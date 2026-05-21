import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

type ResultType = 'win' | 'loss' | 'push' | 'blackjack' | 'surrender' | null;

interface CelebrationEffectProps {
  result: ResultType;
}

export function CelebrationEffect({ result }: CelebrationEffectProps) {
  if (result === 'blackjack') return <ParticleBurst key="bj" variant="blackjack" />;
  if (result === 'win') return <ParticleBurst key="win" variant="win" />;
  if (result === 'loss') return <BustFlash key="loss" />;
  return null;
}

// ---------------------------------------------------------------------------

const CONFETTI_COLORS = ['#fbbf24', '#10b981', '#3b82f6', '#ec4899', '#a855f7', '#f97316', '#fcd34d'];

interface ParticleBurstProps {
  variant: 'blackjack' | 'win';
}

function ParticleBurst({ variant }: ParticleBurstProps) {
  const count = variant === 'blackjack' ? 36 : 22;
  const particles = useRef(
    Array.from({ length: count }).map((_, i) => ({
      key: i,
      startX: Math.random(),
      endX: (Math.random() - 0.5) * 0.4,
      delay: Math.random() * 250,
      rotation: Math.random() * 6 - 3,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8,
    })),
  ).current;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((p) => (
        <Particle
          key={p.key}
          startX={p.startX}
          endX={p.endX}
          delay={p.delay}
          rotation={p.rotation}
          color={p.color}
          size={p.size}
          glyph={variant === 'win' ? '🪙' : null}
        />
      ))}
    </View>
  );
}

interface ParticleProps {
  startX: number; // 0-1 (fraction of viewport width)
  endX: number; // -0.5 to 0.5 (drift relative to start)
  delay: number;
  rotation: number; // rotations (full turns)
  color: string;
  size: number;
  glyph: string | null;
}

function Particle({ startX, endX, delay, rotation, color, size, glyph }: ParticleProps) {
  const yAnim = useRef(new Animated.Value(-40)).current;
  const xAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rotAnim = useRef(new Animated.Value(0)).current;

  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(yAnim, {
          toValue: height + 60,
          duration: 2400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(xAnim, {
          toValue: endX * width,
          duration: 2400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1600),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const rotateInterp = rotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotation * 0}deg`, `${rotation * 360}deg`],
  });

  if (glyph) {
    return (
      <Animated.Text
        style={[
          styles.particle,
          {
            left: startX * width,
            fontSize: size * 2,
            opacity: opacityAnim,
            transform: [
              { translateX: xAnim },
              { translateY: yAnim },
              { rotate: rotateInterp },
            ],
          },
        ]}
      >
        {glyph}
      </Animated.Text>
    );
  }

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX * width,
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [
            { translateX: xAnim },
            { translateY: yAnim },
            { rotate: rotateInterp },
          ],
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------

function BustFlash() {
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.55,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(80),
      Animated.timing(flashAnim, {
        toValue: 0.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, styles.bustFlash, { opacity: flashAnim }]}
    />
  );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
  bustFlash: {
    backgroundColor: '#ef4444',
  },
});
