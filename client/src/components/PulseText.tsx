import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface PulseTextProps {
  children: React.ReactNode;
  style?: any;
  pulseColor?: string;
}

export function PulseText({ children, style, pulseColor = '#fcd34d' }: PulseTextProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(colorAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(colorAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ]),
      ])
    ).start();
  }, [pulseAnim, colorAnim]);

  const interpolatedColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [style?.color || '#fff', pulseColor],
  });

  return (
    <Animated.Text
      style={[
        styles.text,
        style,
        {
          transform: [{ scale: pulseAnim }],
          color: interpolatedColor,
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: 'bold',
  },
});
