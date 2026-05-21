import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import { Card, calculateHandValue } from '@blackjack/shared';

type AnimationSpeed = 'normal' | 'fast' | 'instant';

interface HandScoreProps {
  cards: Card[];
  animationSpeed: AnimationSpeed;
  style?: TextStyle | TextStyle[];
}

// Per-card stagger used by CardView's deal animation, plus a settle buffer.
const STAGGER_MS = 450;
const SETTLE_MS = 500;

export function HandScore({ cards, animationSpeed, style }: HandScoreProps) {
  const [settled, setSettled] = useState(false);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const prevLen = prevLengthRef.current;
    const added = cards.length - prevLen;
    prevLengthRef.current = cards.length;

    if (cards.length === 0) {
      setSettled(false);
      return;
    }

    if (added <= 0) {
      // No new cards (just a flip or no change) — show immediately.
      setSettled(true);
      return;
    }

    setSettled(false);
    const speedFactor = animationSpeed === 'fast' ? 0.5 : animationSpeed === 'instant' ? 0 : 1;
    const delay = added * STAGGER_MS * speedFactor + SETTLE_MS * speedFactor;

    if (delay === 0) {
      setSettled(true);
      return;
    }

    const t = setTimeout(() => setSettled(true), delay);
    return () => clearTimeout(t);
  }, [cards.length, animationSpeed]);

  const visibleCards = cards.filter((c) => c.faceUp);
  if (!settled || visibleCards.length === 0) return null;

  const score = calculateHandValue(visibleCards);
  return (
    <Text style={style}>
      {score.total}
      {score.isSoft ? ' (Soft)' : ''}
    </Text>
  );
}
