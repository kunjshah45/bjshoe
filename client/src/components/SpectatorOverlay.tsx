import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  onSpectate: () => void;
  onLeave: () => void;
}

export function SpectatorOverlay({ onSpectate, onLeave }: Props) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.banner}>
        <Text style={styles.title}>You're out of chips</Text>
        <Text style={styles.subtitle}>Spectate this hand or leave the table.</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.button, styles.spectate]} onPress={onSpectate}>
            <Text style={styles.buttonText}>Spectate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.leave]} onPress={onLeave}>
            <Text style={styles.buttonText}>Leave room</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: 16, alignItems: 'center' },
  banner: { backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#dc2626', borderWidth: 2, borderRadius: 12, padding: 16, maxWidth: 380, width: '100%', alignItems: 'center' },
  title: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#94a3b8', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  spectate: { backgroundColor: '#3b82f6' },
  leave: { backgroundColor: '#dc2626' },
  buttonText: { color: '#f8fafc', fontWeight: 'bold' },
});
