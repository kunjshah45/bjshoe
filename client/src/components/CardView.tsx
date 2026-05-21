import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Card as CardType } from '@blackjack/shared';

type AnimationSpeed = 'normal' | 'fast' | 'instant';

interface CardViewProps {
  card: CardType;
  animate?: 'deal' | 'flip' | 'sweep' | 'none';
  delay?: number;
  index?: number;
  animationSpeed?: AnimationSpeed;
}

export function CardView({
  card,
  animate = 'none',
  delay = 0,
  index = 0,
  animationSpeed = 'normal',
}: CardViewProps) {
  const isInstant = animationSpeed === 'instant';
  const speedFactor = animationSpeed === 'fast' ? 0.5 : 1;

  // Start at the final visible position; the deal animation rewinds and plays
  // forward. If the animation never fires, the card is still visible in slot.
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const flipScaleX = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Track what we're actually displaying — diverges from card.faceUp briefly
  // during the flip animation so we can swap the contents at the midpoint.
  const [displayFaceUp, setDisplayFaceUp] = useState(card.faceUp);

  // Hole-card flip: scaleX 1 → 0 → 1, swap content at midpoint.
  useEffect(() => {
    if (displayFaceUp === card.faceUp) return;

    if (isInstant) {
      setDisplayFaceUp(card.faceUp);
      return;
    }

    const halfDuration = 150 * speedFactor;
    Animated.sequence([
      Animated.timing(flipScaleX, {
        toValue: 0,
        duration: halfDuration,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(flipScaleX, {
        toValue: 1,
        duration: halfDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const swapTimer = setTimeout(() => setDisplayFaceUp(card.faceUp), halfDuration);
    return () => clearTimeout(swapTimer);
  }, [card.faceUp, isInstant, speedFactor, displayFaceUp, flipScaleX]);

  // Sweep: cards collected into the discard pile (top-left) at round end.
  useEffect(() => {
    if (animate !== 'sweep') return;
    if (isInstant) {
      translateXAnim.setValue(-300);
      translateYAnim.setValue(-250);
      opacityAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(translateXAnim, {
        toValue: -300,
        duration: 600 * speedFactor,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -250,
        duration: 600 * speedFactor,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.6,
        duration: 600 * speedFactor,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: -1,
        duration: 600 * speedFactor,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300 * speedFactor),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300 * speedFactor,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [animate, isInstant, speedFactor]);

  useEffect(() => {
    if (animate !== 'deal' || isInstant) return;

    // Rewind to "coming from the shoe (top-right)" state.
    translateXAnim.setValue(400);
    translateYAnim.setValue(-150);
    scaleAnim.setValue(0.6);
    rotateAnim.setValue(1); // 1 = 30deg via interpolation
    opacityAnim.setValue(1);

    Animated.sequence([
      Animated.delay(delay + index * 450 * speedFactor),
      Animated.parallel([
        Animated.spring(translateXAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 50,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 50,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 60,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 350 * speedFactor,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [animate, delay, index, isInstant, speedFactor]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-25deg', '0deg', '30deg'],
  });

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const color = isRed ? '#ef4444' : '#1e293b';

  const suitIcon =
    card.suit === 'hearts' ? '♥'
    : card.suit === 'diamonds' ? '♦'
    : card.suit === 'clubs' ? '♣'
    : card.suit === 'spades' ? '♠'
    : '';

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: opacityAnim,
          transform: [
            { translateX: translateXAnim },
            { translateY: translateYAnim },
            { scale: scaleAnim },
            { scaleX: flipScaleX },
            { rotate },
          ],
        },
      ]}
    >
      {displayFaceUp ? (
        <View style={[styles.card, styles.cardFront]}>
          <Text style={[styles.rankTop, { color }]}>{card.rank}</Text>
          <Text style={[styles.suitCenter, { color }]}>{suitIcon}</Text>
          <Text style={[styles.rankBottom, { color }]}>{card.rank}</Text>
        </View>
      ) : (
        <View style={[styles.card, styles.cardBack]}>
          <Text style={styles.cardBackText}>🂠</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 60,
    height: 85,
  },
  card: {
    width: 60,
    height: 85,
    borderRadius: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardFront: {
    backgroundColor: 'white',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBack: {
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#1e40af',
  },
  cardBackText: {
    fontSize: 36,
    color: '#fcd34d',
  },
  rankTop: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  suitCenter: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  rankBottom: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    transform: [{ rotate: '180deg' }],
  },
});
