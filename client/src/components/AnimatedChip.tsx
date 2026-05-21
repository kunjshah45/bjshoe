import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface AnimatedChipProps {
  amount: number;
  animate?: 'bet' | 'win' | 'none';
  delay?: number;
  color?: string;
}

export function AnimatedChip({ amount, animate = 'none', delay = 0, color = '#f59e0b' }: AnimatedChipProps) {
  const scaleAnim = useRef(new Animated.Value(animate !== 'none' ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animate === 'win' ? -50 : 0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animate === 'bet') {
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 40,
        }),
      ]).start();
    } else if (animate === 'win') {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 4,
            tension: 50,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 40,
          }),
        ]),
        // Pulse effect after landing
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ),
      ]).start();
    }
  }, [animate, delay, scaleAnim, translateY, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.chip,
        { backgroundColor: color },
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
            { translateY },
          ],
        },
      ]}
    >
      <View style={styles.chipInner}>
        <Text style={styles.chipText}>${amount}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  chipInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
