import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DiscardPileProps {
  count: number;
}

export function DiscardPile({ count }: DiscardPileProps) {
  // Visual thickness scales with how many cards have been played.
  const visualLayers = Math.min(5, Math.max(0, Math.ceil(count / 4)));

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.label}>DISCARD</Text>
      <View style={styles.stack}>
        {count === 0 ? (
          <View style={[styles.card, styles.emptySlot]}>
            <Text style={styles.emptyText}>—</Text>
          </View>
        ) : (
          <>
            {Array.from({ length: visualLayers }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.card,
                  { left: i * 1.5, top: -i * 1.5 },
                ]}
              />
            ))}
            <View style={[styles.card, styles.topCard]}>
              <Text style={styles.topCardIcon}>🂠</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 30,
    left: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  stack: {
    width: 55,
    height: 78,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: 55,
    height: 78,
    borderRadius: 6,
    backgroundColor: '#1e3a8a',
    borderWidth: 1,
    borderColor: '#1e40af',
  },
  topCard: {
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  topCardIcon: {
    fontSize: 28,
    color: '#cbd5e1',
  },
  emptySlot: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderColor: 'rgba(148,163,184,0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 20,
  },
});
