import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { socket } from '../services/socket';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { SettingsModal } from '../components/SettingsModal';
import { playSfx } from '../services/audio';

export function LobbyScreen() {
  const { isConnected, player, updatePlayer, room, setRoom, lastRoomCode, setLastRoomCode, setGameMode } = useGameStore();
  const settings = useSettingsStore();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [roomCode, setRoomCode] = useState(lastRoomCode ?? 'TEST01');
  const [nickname, setNickname] = useState(player.nickname);
  const [lastLog, setLastLog] = useState('');

  const joined = !!room && !!room.players.find((p) => p.id === player.id);
  const isHost = room?.hostId === player.id;

  // Socket connect/disconnect and game_state listener are owned by useMultiSocket
  // at the App level (so they survive the Lobby ↔ Table screen transition).
  // Here we only listen to lobby-specific events.
  useEffect(() => {
    const handlePlayerJoined = (data: any) =>
      setLastLog(`${data.player.nickname} joined the room!`);
    socket.on('player_joined', handlePlayerJoined);
    return () => {
      socket.off('player_joined', handlePlayerJoined);
    };
  }, []);

  const handleJoinRoom = () => {
    if (!roomCode || !nickname) {
      Alert.alert('Error', 'Please enter a nickname and room code.');
      return;
    }

    if (nickname !== player.nickname) {
      updatePlayer({ nickname });
    }

    setLastRoomCode(roomCode);

    socket.emit('join_room', {
      roomCode,
      playerId: player.id,
      nickname,
      chips: player.chips,
      settings: settings.getGameSettings(),
    });
  };

  const handleChangeMode = () => {
    socket.disconnect();
    setRoom(null);
    setGameMode(null);
  };

  const handleStartRound = () => {
    socket.emit('update_settings', settings.getGameSettings());
    socket.emit('start_round');
  };

  return (
    <SafeAreaView style={styles.container}>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        isHost={!!isHost && room?.status === 'waiting'}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🃏 Blackjack</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => { playSfx('settings'); setSettingsVisible(true); }}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleChangeMode}>
          <Text style={styles.backLink}>← Change mode</Text>
        </TouchableOpacity>
        <Text style={styles.status}>
          Server: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>

        {!joined ? (
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
            <View style={styles.buttonWrapper}>
              <Button title="Join Room" color="#10b981" onPress={handleJoinRoom} />
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.roomCodeLabel}>Room</Text>
            <Text style={styles.roomCodeValue}>{room!.id}</Text>
            <Text style={styles.label}>Players ({room!.players.length}/7):</Text>
            {room!.players.map((p) => (
              <Text key={p.id} style={styles.playerListItem}>
                {p.id === room!.hostId ? '👑 ' : '• '}{p.nickname}{p.id === player.id ? ' (you)' : ''}
              </Text>
            ))}
            <View style={styles.buttonWrapper}>
              {isHost ? (
                <Button title="Start Round" color="#f59e0b" onPress={handleStartRound} />
              ) : (
                <Text style={styles.waitingText}>Waiting for host to start the round…</Text>
              )}
            </View>
          </View>
        )}

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
  backLink: { color: '#94a3b8', fontSize: 14, marginBottom: 16, alignSelf: 'flex-start' },
  status: { fontSize: 16, color: '#94a3b8', marginBottom: 40 },
  inputContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
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
    borderColor: '#334155',
  },
  buttonWrapper: { marginTop: 10, borderRadius: 8, overflow: 'hidden' },
  logText: { marginTop: 30, color: '#10b981', fontSize: 14, fontStyle: 'italic' },
  roomCodeLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  roomCodeValue: { color: '#fcd34d', fontSize: 28, fontWeight: 'bold', marginBottom: 18, letterSpacing: 2 },
  playerListItem: { color: '#f8fafc', fontSize: 15, paddingVertical: 4 },
  waitingText: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
});
