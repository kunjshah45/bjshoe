import 'react-native-get-random-values';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, SafeAreaView, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { PlayerHand } from '@blackjack/shared';
import { socket } from './src/services/socket';
import { useGameStore } from './src/store/gameStore';
import { useSettingsStore } from './src/store/settingsStore';
import { SettingsModal } from './src/components/SettingsModal';
import { CardView, AnimatedButton, ResultOverlay, PulseText, Shoe, DiscardPile, HandScore, CelebrationEffect } from './src/components';
import type { Round } from '@blackjack/shared';

function calcResultAmount(hand: PlayerHand): number {
  switch (hand.result) {
    case 'win': return hand.bet;
    case 'blackjack': return Math.floor(hand.bet * 1.5);
    case 'loss': return -hand.bet;
    case 'surrender': return -Math.floor(hand.bet / 2);
    case 'push':
    default: return 0;
  }
}

const AUTO_DEAL_SECONDS = 5;

const MIN_BET = 10;
const CHIP_DENOMS: Array<{ value: number; color: string }> = [
  { value: 10, color: '#3b82f6' },
  { value: 25, color: '#06b6d4' },
  { value: 50, color: '#8b5cf6' },
  { value: 100, color: '#f59e0b' },
  { value: 200, color: '#ec4899' },
  { value: 500, color: '#dc2626' },
];

export default function App() {
  const { isConnected, setConnected, player, updatePlayer, room, setRoom } = useGameStore();
  const settings = useSettingsStore();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [roomCode, setRoomCode] = useState('TEST01');
  const [nickname, setNickname] = useState(player.nickname);
  const [lastLog, setLastLog] = useState('');
  const [showResult, setShowResult] = useState<{ result: 'win' | 'loss' | 'push' | 'blackjack' | 'surrender', amount: number } | null>(null);
  const [pendingBet, setPendingBet] = useState(0);
  const [discardCount, setDiscardCount] = useState(0);
  const [autoDealCountdown, setAutoDealCountdown] = useState<number | null>(null);
  const [lingeringRound, setLingeringRound] = useState<Round | null>(null);
  const resultShownForRoundRef = useRef<number>(-1);
  const prevStatusRef = useRef<string | null>(null);

  const [isGameStarted, setIsGameStarted] = useState(false);

  // Once a round resolves, count its cards toward the discard pile.
  useEffect(() => {
    if (room?.status === 'resolving' && room.currentRound) {
      const dealerCount = room.currentRound.dealerCards.length;
      const playerCount = room.currentRound.activePlayers.reduce(
        (sum, ap) => sum + ap.hands.reduce((s, h) => s + h.cards.length, 0),
        0
      );
      setDiscardCount((c) => c + dealerCount + playerCount);
    }
  }, [room?.status]);

  // Send settings to server when joining/creating room
  const emitSettingsToServer = () => {
    const gameSettings = settings.getGameSettings();
    socket.emit('update_settings', gameSettings);
  };

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      setLastLog('Connected to server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setLastLog('Disconnected from server');
    });

    socket.on('player_joined', (data) => {
      setLastLog(`${data.player.nickname} joined the room!`);
    });

    socket.on('game_state', (gameState) => {
      setRoom(gameState);
      setLastLog(`Sync: Room state is ${gameState.status}`);
      if (gameState.status !== 'waiting') {
        setIsGameStarted(true);
      }

      // Mirror authoritative chip/lastBet from server back to local persisted player.
      const me = gameState.players?.find((p: any) => p.id === player.id);
      if (me && (me.chips !== player.chips || me.lastBet !== player.lastBet)) {
        updatePlayer({ chips: me.chips, lastBet: me.lastBet });
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('player_joined');
      socket.off('game_state');
      socket.disconnect();
    };
  }, []);

  const handleJoinRoom = () => {
    if (!roomCode || !nickname) {
      Alert.alert('Error', 'Please enter a nickname and room code.');
      return;
    }

    // Persist any nickname edit before joining.
    if (nickname !== player.nickname) {
      updatePlayer({ nickname });
    }

    socket.emit('join_room', {
      roomCode,
      playerId: player.id,
      nickname,
      chips: player.chips,
      settings: settings.getGameSettings(),
    });
  };

  const handleStartGame = () => {
    emitSettingsToServer();
    socket.emit('start_round');
  };

  const playerChips = room?.players.find(p => p.id === player?.id)?.chips ?? player?.chips ?? 0;

  // Clear the pending bet whenever we leave the betting phase. We deliberately
  // do NOT auto-fill from lastBet — the player uses the "Rebet $X" button if
  // they want that, so they're never surprised by an unintended starting bet.
  useEffect(() => {
    if (room?.status && room.status !== 'betting' && pendingBet > 0) {
      setPendingBet(0);
    }
  }, [room?.status]);

  const handleAddChip = (amount: number) => {
    const next = pendingBet + amount;
    if (next > playerChips) return;
    setPendingBet(next);
  };

  const handleClearBet = () => setPendingBet(0);

  const handleRebet = () => {
    if (!player.lastBet || player.lastBet < MIN_BET) return;
    const amount = Math.min(player.lastBet, playerChips);
    if (amount < MIN_BET) return;
    setPendingBet(amount);
  };

  const handleDeal = () => {
    if (pendingBet < MIN_BET || pendingBet > playerChips) return;
    socket.emit('place_bet', { amount: pendingBet });
  };

  const handleAction = (action: string) => {
    socket.emit('player_action', { action });
  };

  const handleInsurance = (takeInsurance: boolean) => {
    if (takeInsurance) {
      // Place max insurance (half of current bet)
      const activePlayer = room?.currentRound?.activePlayers.find(p => p.playerId === player?.id);
      const currentBet = activePlayer?.hands[0]?.bet || 0;
      const maxInsurance = Math.floor(currentBet / 2);
      socket.emit('place_insurance', { amount: maxInsurance });
    } else {
      socket.emit('decline_insurance');
    }
  };

  const handleCloseInsurance = () => {
    socket.emit('close_insurance_phase');
  };

  // Show win/loss/blackjack overlay once when the round resolves. We delay
  // the overlay so cards (especially the dealer's hits / hole-card reveal)
  // have time to animate in before the result flashes — otherwise a natural
  // blackjack pops up while the cards are still arriving on the table.
  useEffect(() => {
    if (room?.status === 'betting') {
      resultShownForRoundRef.current = -1;
      setShowResult(null);
      return;
    }
    if (room?.status !== 'resolving' || !room.currentRound) return;

    const roundId = room.currentRound.dealerCards.length;
    if (resultShownForRoundRef.current === roundId) return;

    const me = room.currentRound.activePlayers.find((p) => p.playerId === player.id);
    if (!me) return;

    const resolvedHand = me.hands.find((h) => h.result);
    if (!resolvedHand || !resolvedHand.result) return;

    const total = me.hands.reduce((sum, h) => sum + calcResultAmount(h), 0);
    const hasBlackjack = me.hands.some((h) => h.result === 'blackjack');
    const displayResult = hasBlackjack ? 'blackjack' : resolvedHand.result;

    const speedFactor =
      settings.animationSpeed === 'fast' ? 0.5
      : settings.animationSpeed === 'instant' ? 0
      : 1;
    const dealerCardCount = room.currentRound.dealerCards.length;
    const playerCardCount = me.hands.reduce((s, h) => s + h.cards.length, 0);
    const overlayDelay = Math.max(1800, (dealerCardCount + playerCardCount) * 300) * speedFactor;

    resultShownForRoundRef.current = roundId;
    const timer = setTimeout(() => {
      setShowResult({ result: displayResult, amount: total });
    }, overlayDelay);
    return () => clearTimeout(timer);
  }, [room?.status, room?.currentRound?.dealerCards.length, player.id, settings.animationSpeed]);

  const pendingSweepRef = useRef<Round | null>(null);

  // When the round flips from resolving → betting, hold onto the previous
  // round's cards briefly so they can sweep into the discard pile.
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = room?.status ?? null;
    prevStatusRef.current = curr;

    if (curr === 'resolving' && room?.currentRound) {
      // Stash the resolving snapshot so we can sweep it on the next transition.
      pendingSweepRef.current = room.currentRound;
    }

    if (prev === 'resolving' && curr === 'betting' && pendingSweepRef.current) {
      const snapshot = pendingSweepRef.current;
      pendingSweepRef.current = null;
      setLingeringRound(snapshot);
      const speedFactor =
        settings.animationSpeed === 'fast' ? 0.5
        : settings.animationSpeed === 'instant' ? 0
        : 1;
      const clearTimer = setTimeout(() => setLingeringRound(null), 700 * speedFactor);
      return () => clearTimeout(clearTimer);
    }
  }, [room?.status]);

  // Auto-deal next round 5s after the round resolves (host only).
  const isHostForAutoDeal = room?.hostId === player.id;
  useEffect(() => {
    if (room?.status !== 'resolving' || !isHostForAutoDeal) {
      setAutoDealCountdown(null);
      return;
    }
    setAutoDealCountdown(AUTO_DEAL_SECONDS);
    let remaining = AUTO_DEAL_SECONDS;
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        setAutoDealCountdown(null);
        socket.emit('update_settings', settings.getGameSettings());
        socket.emit('start_round');
      } else {
        setAutoDealCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.status, isHostForAutoDeal]);

  // If game is started, show a basic table instead of lobby
  if (isGameStarted && room?.currentRound) {
    const isBetting = room.status === 'betting';
    const isPlaying = room.status === 'playing';
    const isResolving = room.status === 'resolving';

    // Find the current player's state
    // During the sweep window, render the previous round's cards (so they can
    // animate off the table) instead of the new empty hands.
    const cardSource = lingeringRound ?? room.currentRound;
    const activePlayer = cardSource.activePlayers.find(p => p.playerId === player?.id);
    const otherPlayers = cardSource.activePlayers.filter(p => p.playerId !== player?.id);
    const dealerCards = cardSource.dealerCards;
    const cardAnim: 'deal' | 'sweep' = lingeringRound ? 'sweep' : 'deal';

    const isHost = room?.hostId === player?.id;

    // Real-casino deal order: players left-to-right get card 1, then dealer,
    // then players card 2, then dealer.
    // - Player hits (cardIndex >= 2): instant (player initiated, no delay).
    // - Dealer hits (cardIndex >= 2): stagger one-by-one so the user watches
    //   the dealer draw each card in sequence after standing.
    const numActivePlayers = room.currentRound.activePlayers.length;
    const dealOrderForPlayer = (playerId: string, cardIndex: number): number => {
      if (cardIndex >= 2) return 0;
      const pos = room.currentRound!.activePlayers.findIndex((p) => p.playerId === playerId);
      return cardIndex * (numActivePlayers + 1) + Math.max(0, pos);
    };
    const dealOrderForDealer = (cardIndex: number): number => {
      if (cardIndex >= 2) return cardIndex - 2; // 0, 1, 2, ... for hit cards
      return cardIndex * (numActivePlayers + 1) + numActivePlayers;
    };

    return (
      <SafeAreaView style={styles.tableContainer}>
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          isHost={isHost && room?.status === 'waiting'}
        />
        <DiscardPile count={discardCount} />
        <Shoe decks={room.settings.deckCount} />
        <ScrollView contentContainerStyle={styles.tableContent}>
          
          {/* Dealer Area */}
          <View style={styles.dealerArea}>
            <Text style={styles.areaLabel}>Dealer</Text>
            <HandScore cards={dealerCards} animationSpeed={settings.animationSpeed} style={styles.scoreText} />
            <View style={styles.cardsRow}>
              {dealerCards.map((card, idx) => (
                <View key={idx} style={idx > 0 ? styles.stackedCard : null}>
                  <CardView
                    card={card}
                    animate={cardAnim}
                    index={dealOrderForDealer(idx)}
                    animationSpeed={settings.animationSpeed}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Table Center (Status/Logs) */}
          <View style={styles.centerArea}>
             <Text style={styles.status}>Table: {room.id} | {room.status.toUpperCase()}</Text>
             
             {isPlaying && room.currentRound.activePlayers[room.currentRound.turnIndex]?.playerId !== player?.id && (
               <Text style={styles.turnIndicator}>
                 Waiting for {room.players.find(p => p.id === room.currentRound?.activePlayers[room.currentRound.turnIndex]?.playerId)?.nickname || 'other player'} to act...
               </Text>
             )}
          </View>

          {/* Other Players Area */}
          {otherPlayers.length > 0 && (
            <View style={styles.otherPlayersRow}>
               {otherPlayers.map((op, opIdx) => {
                 const pData = room.players.find(p => p.id === op.playerId);
                 const isTheirTurn = room.currentRound?.activePlayers[room.currentRound.turnIndex]?.playerId === op.playerId;
                 
                 return (
                   <View key={opIdx} style={[styles.otherPlayerBox, isTheirTurn ? styles.activePlayerBox : null]}>
                      <Text style={styles.otherPlayerName}>{pData?.nickname || 'Player'}</Text>
                      {op.hands.map((hand, hIdx) => {
                        return (
                          <View key={hIdx} style={styles.otherPlayerHand}>
                            <HandScore
                              cards={hand.cards}
                              animationSpeed={settings.animationSpeed}
                              style={styles.otherPlayerScore}
                            />
                            <View style={[styles.cardsRow, { transform: [{ scale: 0.6 }] }]}>
                              {hand.cards.map((c, cIdx) => (
                                <View key={cIdx} style={cIdx > 0 ? styles.stackedCard : null}>
                                  <CardView
                                    card={c}
                                    animate={cardAnim}
                                    index={dealOrderForPlayer(op.playerId, cIdx)}
                                    animationSpeed={settings.animationSpeed}
                                  />
                                </View>
                              ))}
                            </View>
                            {hand.result && <Text style={styles.otherPlayerResult}>{hand.result.toUpperCase()}</Text>}
                          </View>
                        );
                      })}
                   </View>
                 );
               })}
            </View>
          )}

          {/* Player Area */}
          <View style={styles.playerArea}>
             <Text style={styles.areaLabel}>Your Hand(s)</Text>
             {activePlayer?.hands.map((hand, hIdx) => {
               const isActiveHand = hIdx === activePlayer.currentHandIndex && !hand.isFinished;

               return (
                 <View key={hIdx} style={[styles.handContainer, isActiveHand ? styles.activeHand : null]}>
                   <HandScore
                     cards={hand.cards}
                     animationSpeed={settings.animationSpeed}
                     style={styles.scoreText}
                   />
                   <View style={styles.cardsRow}>
                      {hand.cards.map((card, cIdx) => (
                        <View key={cIdx} style={cIdx > 0 ? styles.stackedCard : null}>
                          <CardView
                            card={card}
                            animate={cardAnim}
                            index={dealOrderForPlayer(activePlayer.playerId, cIdx)}
                            animationSpeed={settings.animationSpeed}
                          />
                        </View>
                      ))}
                   </View>
                   {hand.bet > 0 && <Text style={styles.betText}>Bet: ${hand.bet}</Text>}
                   {hand.insuranceBet !== undefined && hand.insuranceBet > 0 && (
                     <Text style={styles.insuranceIndicator}>🛡️ Insured: ${hand.insuranceBet}</Text>
                   )}
                   {hand.result && <Text style={[styles.resultText, hand.result === 'surrender' && styles.surrenderText]}>{hand.result.toUpperCase()}</Text>}
                 </View>
               );
             })}
          </View>

          {/* Action Buttons Area */}
          <View style={styles.controlsArea}>
            <View style={styles.chipBetRow}>
              <Text style={styles.chipsLabel}>
                Chips: ${room.players.find(p => p.id === player?.id)?.chips ?? player?.chips}
              </Text>
              {(isPlaying || isResolving) && activePlayer && (
                <Text style={styles.activeBetLabel}>
                  Bet: ${activePlayer.hands.reduce((sum, h) => sum + h.bet, 0)}
                </Text>
              )}
            </View>

            {isBetting && activePlayer?.hands[0]?.bet === 0 && (
              <View>
                <Text style={styles.pendingBetText}>
                  {pendingBet === 0
                    ? 'Tap chips to build your bet (min $10)'
                    : `Your bet: $${pendingBet}`}
                </Text>
                <View style={styles.actionsRow}>
                  {CHIP_DENOMS.map((chip) => {
                    const wouldExceed = pendingBet + chip.value > playerChips;
                    return (
                      <Button
                        key={chip.value}
                        title={`+$${chip.value}`}
                        color={chip.color}
                        disabled={wouldExceed}
                        onPress={() => handleAddChip(chip.value)}
                      />
                    );
                  })}
                </View>
                {settings.autoLastBet && player.lastBet >= MIN_BET && pendingBet === 0 && player.lastBet <= playerChips && (
                  <View style={[styles.actionsRow, { marginTop: 10 }]}>
                    <Button
                      title={`Rebet last ($${player.lastBet})`}
                      color="#0ea5e9"
                      onPress={handleRebet}
                    />
                  </View>
                )}
                <View style={[styles.actionsRow, { marginTop: 10 }]}>
                  <Button title="Clear" color="#64748b" onPress={handleClearBet} disabled={pendingBet === 0} />
                  <Button
                    title={pendingBet >= MIN_BET ? `Deal $${pendingBet}` : 'Deal'}
                    color="#10b981"
                    onPress={handleDeal}
                    disabled={pendingBet < MIN_BET}
                  />
                </View>
              </View>
            )}
            {isBetting && (activePlayer?.hands[0]?.bet ?? 0) > 0 && (
              <Text style={styles.pendingBetText}>
                Bet placed: ${activePlayer?.hands[0]?.bet}. Waiting for other players…
              </Text>
            )}

            {/* Insurance Prompt */}
            {room.currentRound?.insuranceOffered && !room.currentRound?.insuranceClosed && (
              <View style={styles.insuranceContainer}>
                <Text style={styles.insuranceText}>Dealer shows Ace. Take Insurance?</Text>
                <Text style={styles.insuranceSubtext}>Pays 2:1 if dealer has Blackjack (max: half your bet)</Text>
                <View style={styles.actionsRow}>
                  <Button title="Yes (Max)" color="#f59e0b" onPress={() => handleInsurance(true)} />
                  <Button title="No" color="#64748b" onPress={() => handleInsurance(false)} />
                </View>
                {isHost && (
                  <Button title="Continue to Game" color="#3b82f6" onPress={handleCloseInsurance} />
                )}
              </View>
            )}

            {/* Regular Actions */}
            {(isPlaying || isResolving) && activePlayer && activePlayer.hands[activePlayer.currentHandIndex] && !activePlayer.hands[activePlayer.currentHandIndex].isFinished && (!room.currentRound?.insuranceOffered || room.currentRound?.insuranceClosed) && (
              <View style={styles.actionsRow}>
                <Button title="Hit" color="#10b981" onPress={() => handleAction('hit')} />
                <Button title="Stand" color="#ef4444" onPress={() => handleAction('stand')} />
                {activePlayer.hands[activePlayer.currentHandIndex].canDouble && (
                  <Button title="Double" color="#f59e0b" onPress={() => handleAction('double')} />
                )}
                {activePlayer.hands[activePlayer.currentHandIndex].canSplit && (
                  <Button title="Split" color="#8b5cf6" onPress={() => handleAction('split')} />
                )}
                {activePlayer.hands[activePlayer.currentHandIndex].canSurrender && (
                  <Button title="Surrender" color="#dc2626" onPress={() => handleAction('surrender')} />
                )}
              </View>
            )}

            {isResolving && isHost && (
              <View style={[styles.actionsRow, { marginTop: 10, alignItems: 'center' }]}>
                {autoDealCountdown !== null && (
                  <Text style={styles.countdownText}>
                    Next round in {autoDealCountdown}…
                  </Text>
                )}
                <Button
                  title={autoDealCountdown !== null ? 'Deal Now' : 'Next Round'}
                  color="#6366f1"
                  onPress={handleStartGame}
                />
              </View>
            )}
            {isResolving && !isHost && (
              <Text style={styles.countdownText}>Waiting for host to start next round…</Text>
            )}
          </View>

        </ScrollView>
        <CelebrationEffect result={showResult?.result ?? null} />
        <ResultOverlay
          result={showResult?.result ?? null}
          amount={showResult?.amount}
          onComplete={() => setShowResult(null)}
        />
      </SafeAreaView>
    );
  }

  const isHost = room?.hostId === player?.id;

  return (
    <SafeAreaView style={styles.container}>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        isHost={isHost && room?.status === 'waiting'}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🃏 Blackjack</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.status}>
          Server: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nickname:</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholderTextColor="#64748b"
          />
          <Text style={styles.label}>Room Code:</Text>
          <TextInput
            style={styles.input}
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
            placeholderTextColor="#64748b"
          />
          
          {room?.status === 'waiting' && isHost ? (
             <View style={styles.buttonWrapper}>
               <Button title="Start Round" color="#f59e0b" onPress={handleStartGame} />
             </View>
          ) : (
            <View style={styles.buttonWrapper}>
              <Button title="Join Room" color="#10b981" onPress={handleJoinRoom} />
            </View>
          )}
        </View>

        {lastLog ? <Text style={styles.logText}>📡 {lastLog}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 340, marginBottom: 10 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#f8fafc' },
  settingsButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  settingsButtonText: { fontSize: 20 },
  status: { fontSize: 16, color: '#94a3b8', marginBottom: 40 },
  inputContainer: { 
    width: '100%', 
    maxWidth: 340, 
    backgroundColor: '#1e293b', 
    padding: 20, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  label: { color: '#cbd5e1', marginBottom: 6, fontSize: 14, fontWeight: '600' },
  input: { 
    backgroundColor: '#0f172a', 
    color: '#f8fafc', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  buttonWrapper: { marginTop: 10, borderRadius: 8, overflow: 'hidden' },
  logText: { marginTop: 30, color: '#10b981', fontSize: 14, fontStyle: 'italic' },
  
  // Table Styles
  tableContainer: { flex: 1, backgroundColor: '#064e3b' }, // Green felt color
  tableContent: { flex: 1, padding: 20, paddingTop: 130, justifyContent: 'space-between' },
  dealerArea: { alignItems: 'center', marginTop: 20 },
  playerArea: { alignItems: 'center', marginBottom: 20 },
  centerArea: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  areaLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  scoreText: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 10, textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },
  cardsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  stackedCard: { marginLeft: -30 }, // Overlap cards slightly
  handContainer: { alignItems: 'center', marginVertical: 10 },
  activeHand: { borderWidth: 2, borderColor: '#fcd34d', borderRadius: 8, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  betText: { color: '#fcd34d', fontWeight: 'bold', marginTop: 10, fontSize: 16 },
  resultText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 24, marginTop: 10, textShadowColor: '#000', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 },
  surrenderText: { color: '#dc2626' },
  insuranceIndicator: { color: '#f59e0b', fontSize: 12, marginTop: 5, fontStyle: 'italic' },
  controlsArea: { backgroundColor: '#0f172a', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#1e293b' },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10, rowGap: 10 },
  pendingBetText: { color: '#fcd34d', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  countdownText: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginBottom: 8 },
  chipBetRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 10, gap: 20 },
  chipsLabel: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
  activeBetLabel: { color: '#fcd34d', fontSize: 18, fontWeight: 'bold' },
  otherPlayersRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 15, marginBottom: 20 },
  otherPlayerBox: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, minWidth: 100 },
  activePlayerBox: { borderColor: '#fcd34d', borderWidth: 2, backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  otherPlayerName: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  otherPlayerHand: { alignItems: 'center', marginVertical: 5 },
  otherPlayerScore: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  otherPlayerResult: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold', marginTop: -5 },
  turnIndicator: { color: '#fcd34d', fontSize: 18, fontWeight: 'bold', marginVertical: 10, textAlign: 'center' },
  insuranceContainer: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#f59e0b', marginVertical: 10, alignItems: 'center' },
  insuranceText: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  insuranceSubtext: { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
});
