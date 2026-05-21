import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface ResultOverlayProps {
  result: 'win' | 'loss' | 'push' | 'blackjack' | 'surrender' | null;
  amount?: number;
  onComplete?: () => void;
}

export function ResultOverlay({ result, amount, onComplete }: ResultOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (result) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 100,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 100,
          }),
        ]),
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onComplete?.();
      });
    }
  }, [result, fadeAnim, scaleAnim, slideAnim, onComplete]);

  if (!result) return null;

  const getResultConfig = () => {
    switch (result) {
      case 'win':
        return { text: 'YOU WIN!', color: '#10b981', emoji: '💰' };
      case 'blackjack':
        return { text: 'BLACKJACK!', color: '#f59e0b', emoji: '👑' };
      case 'loss':
        return { text: 'DEALER WINS', color: '#ef4444', emoji: '💸' };
      case 'push':
        return { text: 'PUSH', color: '#64748b', emoji: '🤝' };
      case 'surrender':
        return { text: 'SURRENDERED', color: '#dc2626', emoji: '🏳️' };
      default:
        return { text: '', color: '#fff', emoji: '' };
    }
  };

  const config = getResultConfig();

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
    >
      <View style={[styles.container, { backgroundColor: config.color }]}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <Text style={styles.text}>{config.text}</Text>
        {amount !== undefined && amount !== 0 && (
          <Text style={styles.amount}>
            {amount > 0 ? `+$${amount}` : `-$${Math.abs(amount)}`}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
  container: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
