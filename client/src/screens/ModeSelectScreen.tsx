import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { useSoloStore } from '../store/soloStore';
import { useSettingsStore } from '../store/settingsStore';
import { FEATURES } from '../config';

interface ModeSelectScreenProps {
  onHowToPlay: () => void;
}

export function ModeSelectScreen({ onHowToPlay }: ModeSelectScreenProps) {
  const setGameMode = useGameStore((s) => s.setGameMode);
  const startSoloGame = useSoloStore((s) => s.startGame);
  const getSettings = useSettingsStore((s) => s.getGameSettings);

  const handleSolo = () => {
    startSoloGame(getSettings());
    setGameMode('solo');
  };

  const handleMulti = () => {
    setGameMode('multi');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🃏 Blackjack</Text>
        <Text style={styles.subtitle}>How do you want to play?</Text>

        <TouchableOpacity style={[styles.modeButton, styles.soloButton]} onPress={handleSolo}>
          <Text style={styles.modeEmoji}>🎯</Text>
          <Text style={styles.modeTitle}>Play Solo</Text>
          <Text style={styles.modeDescription}>Just you vs. the dealer. No server needed.</Text>
        </TouchableOpacity>

        {FEATURES.multiplayer && (
          <TouchableOpacity style={[styles.modeButton, styles.multiButton]} onPress={handleMulti}>
            <Text style={styles.modeEmoji}>👥</Text>
            <Text style={styles.modeTitle}>Play with Friends</Text>
            <Text style={styles.modeDescription}>Join a room with up to 7 players.</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.modeButton, styles.helpButton]} onPress={onHowToPlay}>
          <Text style={styles.modeEmoji}>📖</Text>
          <Text style={styles.modeTitle}>How to Play</Text>
          <Text style={styles.modeDescription}>Learn the rules, actions, and tips.</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          {/* @ts-ignore — href is supported by react-native-web on Text */}
          <Text accessibilityRole="link" href="/blackjack-rules/" style={styles.footerLink}>Rules</Text>
          <Text style={styles.footerSep}>·</Text>
          {/* @ts-ignore */}
          <Text accessibilityRole="link" href="/blackjack-strategy/" style={styles.footerLink}>Strategy</Text>
          <Text style={styles.footerSep}>·</Text>
          {/* @ts-ignore */}
          <Text accessibilityRole="link" href="/blackjack-odds/" style={styles.footerLink}>Odds</Text>
          <Text style={styles.footerSep}>·</Text>
          {/* @ts-ignore */}
          <Text accessibilityRole="link" href="/card-counting/" style={styles.footerLink}>Card Counting</Text>
          <Text style={styles.footerSep}>·</Text>
          {/* @ts-ignore */}
          <Text accessibilityRole="link" href="/blackjack-glossary/" style={styles.footerLink}>Glossary</Text>
        </View>
        <View style={styles.footer}>
          {/* @ts-ignore */}
          <Text accessibilityRole="link" href="/privacy/" style={styles.footerLink}>Privacy</Text>
          <Text style={styles.footerSep}>·</Text>
          {/* @ts-ignore */}
          <Text accessibilityRole="link" href="/terms/" style={styles.footerLink}>Terms</Text>
          <Text style={styles.footerSep}>·</Text>
          <Text style={styles.footerText}>© bjshoe</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#94a3b8', marginBottom: 32 },
  modeButton: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  soloButton: { backgroundColor: '#1e293b', borderColor: '#10b981' },
  multiButton: { backgroundColor: '#1e293b', borderColor: '#3b82f6' },
  helpButton: { backgroundColor: '#1e293b', borderColor: '#8b5cf6' },
  modeEmoji: { fontSize: 40, marginBottom: 8 },
  modeTitle: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 6 },
  modeDescription: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
  footerLink: { color: '#94a3b8', fontSize: 13, textDecorationLine: 'underline' },
  footerSep: { color: '#475569', fontSize: 13 },
  footerText: { color: '#64748b', fontSize: 13 },
});
