import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ShoeProps {
  decks?: number;
}

export function Shoe({ decks }: ShoeProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.label}>SHOE</Text>
      <View style={styles.stack}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.card,
              { right: i * 1.5, top: -i * 1.5 },
            ]}
          />
        ))}
        <View style={[styles.card, styles.topCard]}>
          <Text style={styles.topCardIcon}>🂠</Text>
        </View>
      </View>
      {decks !== undefined && <Text style={styles.count}>{decks} decks</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 30,
    right: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    color: '#fbbf24',
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
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  topCardIcon: {
    fontSize: 32,
    color: '#fcd34d',
  },
  count: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 8,
  },
});
