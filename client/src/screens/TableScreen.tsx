import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Button, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { PlayerHand, Round } from '@blackjack/shared';
import { socket } from '../services/socket';
import { useGameStore } from '../store/gameStore';
import { useSoloStore } from '../store/soloStore';
import { useSettingsStore } from '../store/settingsStore';
import { useActiveRoom } from '../hooks/useActiveRoom';
import { useGameActions } from '../hooks/useGameActions';
import { playSfx } from '../services/audio';
import { SettingsModal } from '../components/SettingsModal';
import { OutOfChipsModal } from '../components/OutOfChipsModal';
import { SpectatorOverlay } from '../components/SpectatorOverlay';
import {
  CardView,
  ResultOverlay,
  Shoe,
  DiscardPile,
  HandScore,
  CelebrationEffect,
} from '../components';

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

export function TableScreen() {
  const { player, updatePlayer, gameMode, setGameMode, setRoom } = useGameStore();
  const settings = useSettingsStore();
  const room = useActiveRoom();
  const actions = useGameActions();
  const endSoloGame = useSoloStore((s) => s.endGame);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showResult, setShowResult] = useState<{ result: 'win' | 'loss' | 'push' | 'blackjack' | 'surrender'; amount: number } | null>(null);
  const [pendingBet, setPendingBet] = useState(0);
  const [discardCount, setDiscardCount] = useState(0);
  const [autoDealCountdown, setAutoDealCountdown] = useState<number | null>(null);
  const [lingeringRound, setLingeringRound] = useState<Round | null>(null);
  const [spectatorDismissed, setSpectatorDismissed] = useState(false);
  const resultShownForRoundRef = useRef<number>(-1);
  const prevStatusRef = useRef<string | null>(null);
  const pendingSweepRef = useRef<Round | null>(null);

  const playerChips = useMemo(
    () => room?.players.find((p) => p.id === player.id)?.chips ?? player.chips ?? 0,
    [room, player.id, player.chips]
  );

  const isHost = room?.hostId === player.id;

  // Solo auto-initializes on refresh (no persisted room) and then auto-starts
  // the first round once the room is in 'waiting'.
  useEffect(() => {
    if (gameMode !== 'solo') return;
    if (!room) {
      useSoloStore.getState().startGame(settings.getGameSettings());
      return;
    }
    if (room.status === 'waiting') {
      actions.startRound();
    }
  }, [gameMode, room?.status, room]);

  // Reset spectator overlay dismissal when chips come back.
  useEffect(() => {
    if (playerChips > 0) setSpectatorDismissed(false);
  }, [playerChips]);

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

  // Clear pendingBet on phase exit.
  useEffect(() => {
    if (room?.status && room.status !== 'betting' && pendingBet > 0) {
      setPendingBet(0);
    }
  }, [room?.status]);

  // Show result overlay once per resolved round, with stagger delay so cards finish animating.
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
      if (displayResult === 'blackjack') playSfx('blackjack');
      else if (displayResult === 'win') playSfx('win');
      else if (displayResult === 'loss') playSfx('lose');
    }, overlayDelay);
    return () => clearTimeout(timer);
  }, [room?.status, room?.currentRound?.dealerCards.length, player.id, settings.animationSpeed]);

  // Sweep window: hold the previous round's cards briefly so they can animate to discard.
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = room?.status ?? null;
    prevStatusRef.current = curr;

    if (curr === 'resolving' && room?.currentRound) {
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

  // Auto-deal next round 5s after resolve (host only).
  useEffect(() => {
    if (room?.status !== 'resolving' || !isHost) {
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
        actions.emitSettings();
        actions.startRound();
      } else {
        setAutoDealCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.status, isHost]);

  if (!room || !room.currentRound) {
    return (
      <SafeAreaView style={styles.tableContainer}>
        <Text style={styles.loadingText}>Setting up table…</Text>
      </SafeAreaView>
    );
  }

  const handleAddChip = (amount: number) => {
    const next = pendingBet + amount;
    if (next > playerChips) return;
    playSfx('chipClick');
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
    actions.placeBet(pendingBet);
  };

  const handleStartGame = () => {
    actions.emitSettings();
    actions.startRound();
  };

  const handleInsurance = (takeInsurance: boolean) => {
    if (takeInsurance) {
      const activePlayer = room.currentRound?.activePlayers.find((p) => p.playerId === player.id);
      const currentBet = activePlayer?.hands[0]?.bet || 0;
      const maxInsurance = Math.floor(currentBet / 2);
      actions.placeInsurance(maxInsurance);
    } else {
      actions.declineInsurance();
    }
  };

  const handleChangeMode = () => {
    const performLeave = () => {
      if (gameMode === 'multi') {
        socket.disconnect();
      }
      endSoloGame();
      setRoom(null);
      setGameMode(null);
    };

    const needsConfirm = room.status === 'playing' || room.status === 'betting';
    if (!needsConfirm) {
      performLeave();
      return;
    }
    // Alert.alert is a no-op on react-native-web; use window.confirm there.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Leave this table? Any active bet will be forfeited.')) {
        performLeave();
      }
      return;
    }
    Alert.alert('Leave this table?', 'Any active bet will be forfeited.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: performLeave },
    ]);
  };

  const handleClaimFreeChips = () => {
    useSoloStore.getState().claimFreeChips();
  };

  const handleLeaveRoom = () => {
    socket.disconnect();
    setRoom(null);
    setGameMode(null);
  };

  const isBetting = room.status === 'betting';
  const isPlaying = room.status === 'playing';
  const isResolving = room.status === 'resolving';

  const cardSource = lingeringRound ?? room.currentRound;
  const activePlayer = cardSource.activePlayers.find((p) => p.playerId === player.id);
  const otherPlayers = cardSource.activePlayers.filter((p) => p.playerId !== player.id);
  const dealerCards = cardSource.dealerCards;
  const cardAnim: 'deal' | 'sweep' = lingeringRound ? 'sweep' : 'deal';

  const numActivePlayers = room.currentRound.activePlayers.length;
  const dealOrderForPlayer = (playerId: string, cardIndex: number): number => {
    if (cardIndex >= 2) return 0;
    const pos = room.currentRound!.activePlayers.findIndex((p) => p.playerId === playerId);
    return cardIndex * (numActivePlayers + 1) + Math.max(0, pos);
  };
  const dealOrderForDealer = (cardIndex: number): number => {
    if (cardIndex >= 2) return cardIndex - 2;
    return cardIndex * (numActivePlayers + 1) + numActivePlayers;
  };

  // "Out of chips" really means "can't afford the minimum bet" — covers both
  // dead-zero and fractional leftovers (e.g. $2.50 after a 3:2 BJ on a $5 bet).
  const showOutOfChipsModal = gameMode === 'solo' && playerChips < MIN_BET && isBetting;
  const showSpectatorOverlay = gameMode === 'multi' && playerChips < MIN_BET && !spectatorDismissed;

  return (
    <SafeAreaView style={styles.tableContainer}>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        isHost={gameMode === 'solo' || (!!isHost && room.status === 'waiting')}
      />
      <OutOfChipsModal visible={showOutOfChipsModal} onClaim={handleClaimFreeChips} />
      {showSpectatorOverlay && (
        <SpectatorOverlay
          onSpectate={() => setSpectatorDismissed(true)}
          onLeave={handleLeaveRoom}
        />
      )}
      <DiscardPile count={discardCount} />
      <Shoe decks={room.settings.deckCount} />
      <View style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.modeBackButton} onPress={handleChangeMode}>
          <Text style={styles.modeBackText}>← Change mode</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => { playSfx('settings'); setSettingsVisible(true); }}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>
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

        {/* Center Status */}
        <View style={styles.centerArea}>
          <Text style={styles.status}>Table: {room.id} | {room.status.toUpperCase()}</Text>
          {isPlaying && room.currentRound.activePlayers[room.currentRound.turnIndex]?.playerId !== player.id && (
            <Text style={styles.turnIndicator}>
              Waiting for {room.players.find((p) => p.id === room.currentRound?.activePlayers[room.currentRound.turnIndex]?.playerId)?.nickname || 'other player'} to act...
            </Text>
          )}
        </View>

        {/* Other Players */}
        {otherPlayers.length > 0 && (
          <View style={styles.otherPlayersRow}>
            {otherPlayers.map((op, opIdx) => {
              const pData = room.players.find((p) => p.id === op.playerId);
              const isTheirTurn = room.currentRound?.activePlayers[room.currentRound.turnIndex]?.playerId === op.playerId;
              return (
                <View key={opIdx} style={[styles.otherPlayerBox, isTheirTurn ? styles.activePlayerBox : null]}>
                  <Text style={styles.otherPlayerName}>{pData?.nickname || 'Player'}</Text>
                  {op.hands.map((hand, hIdx) => (
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
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Player Hands */}
        <View style={styles.playerArea}>
          <Text style={styles.areaLabel}>Your Hand(s)</Text>
          {activePlayer?.hands.map((hand, hIdx) => {
            const isActiveHand = hIdx === activePlayer.currentHandIndex && !hand.isFinished;
            return (
              <View key={hIdx} style={[styles.handContainer, isActiveHand ? styles.activeHand : null]}>
                <HandScore cards={hand.cards} animationSpeed={settings.animationSpeed} style={styles.scoreText} />
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
                {hand.result && (
                  <Text style={[styles.resultText, hand.result === 'surrender' && styles.surrenderText]}>
                    {hand.result.toUpperCase()}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Controls */}
        <View style={styles.controlsArea}>
          <View style={styles.chipBetRow}>
            <Text style={styles.chipsLabel}>Chips: ${playerChips}</Text>
            {(isPlaying || isResolving) && activePlayer && (
              <Text style={styles.activeBetLabel}>
                Bet: ${activePlayer.hands.reduce((sum, h) => sum + h.bet, 0)}
              </Text>
            )}
          </View>

          {isBetting && activePlayer?.hands[0]?.bet === 0 && playerChips > 0 && (
            <View>
              <Text style={styles.pendingBetText}>
                {pendingBet === 0 ? 'Tap chips to build your bet (min $10)' : `Your bet: $${pendingBet}`}
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
                  <Button title={`Rebet last ($${player.lastBet})`} color="#0ea5e9" onPress={handleRebet} />
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

          {room.currentRound?.insuranceOffered && !room.currentRound?.insuranceClosed && (
            <View style={styles.insuranceContainer}>
              <Text style={styles.insuranceText}>Dealer shows Ace. Take Insurance?</Text>
              <Text style={styles.insuranceSubtext}>Pays 2:1 if dealer has Blackjack (max: half your bet)</Text>
              <View style={styles.actionsRow}>
                <Button title="Yes (Max)" color="#f59e0b" onPress={() => handleInsurance(true)} />
                <Button title="No" color="#64748b" onPress={() => handleInsurance(false)} />
              </View>
              {isHost && (
                <Button title="Continue to Game" color="#3b82f6" onPress={actions.closeInsurancePhase} />
              )}
            </View>
          )}

          {(isPlaying || isResolving) && activePlayer && activePlayer.hands[activePlayer.currentHandIndex] && !activePlayer.hands[activePlayer.currentHandIndex].isFinished && (!room.currentRound?.insuranceOffered || room.currentRound?.insuranceClosed) && (
            <View style={styles.actionsRow}>
              <Button title="Hit" color="#10b981" onPress={() => actions.playerAction('hit')} />
              <Button title="Stand" color="#ef4444" onPress={() => actions.playerAction('stand')} />
              {activePlayer.hands[activePlayer.currentHandIndex].canDouble && (
                <Button title="Double" color="#f59e0b" onPress={() => actions.playerAction('double')} />
              )}
              {activePlayer.hands[activePlayer.currentHandIndex].canSplit && (
                <Button title="Split" color="#8b5cf6" onPress={() => actions.playerAction('split')} />
              )}
              {activePlayer.hands[activePlayer.currentHandIndex].canSurrender && (
                <Button title="Surrender" color="#dc2626" onPress={() => actions.playerAction('surrender')} />
              )}
            </View>
          )}

          {isResolving && isHost && (
            <View style={[styles.actionsRow, { marginTop: 10, alignItems: 'center' }]}>
              {autoDealCountdown !== null && (
                <Text style={styles.countdownText}>Next round in {autoDealCountdown}…</Text>
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

const styles = StyleSheet.create({
  tableContainer: { flex: 1, backgroundColor: '#064e3b' },
  tableContent: { flex: 1, padding: 20, paddingTop: 130, justifyContent: 'space-between' },
  loadingText: { color: '#94a3b8', textAlign: 'center', marginTop: 60, fontSize: 16 },
  topBar: { position: 'absolute', top: 40, left: 0, right: 0, zIndex: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  modeBackButton: { backgroundColor: 'rgba(15,23,42,0.85)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  modeBackText: { color: '#f8fafc', fontSize: 13, fontWeight: '600' },
  settingsButton: { backgroundColor: 'rgba(15,23,42,0.85)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  settingsButtonText: { fontSize: 18 },
  dealerArea: { alignItems: 'center', marginTop: 20 },
  playerArea: { alignItems: 'center', marginBottom: 20 },
  centerArea: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  areaLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  scoreText: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 10, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  cardsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  stackedCard: { marginLeft: -30 },
  handContainer: { alignItems: 'center', marginVertical: 10 },
  activeHand: { borderWidth: 2, borderColor: '#fcd34d', borderRadius: 8, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  betText: { color: '#fcd34d', fontWeight: 'bold', marginTop: 10, fontSize: 16 },
  resultText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 24, marginTop: 10, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
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
  status: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
});
