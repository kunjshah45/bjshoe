import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  GestureResponderEvent,
} from 'react-native';

interface AnimatedButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  color?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function AnimatedButton({
  title,
  onPress,
  color = '#3b82f6',
  disabled = false,
  size = 'medium',
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 12 },
    medium: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 14 },
    large: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 16 },
  };

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            backgroundColor: disabled ? '#64748b' : color,
            paddingVertical: sizeStyles[size].paddingVertical,
            paddingHorizontal: sizeStyles[size].paddingHorizontal,
          },
        ]}
      >
        <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    margin: 4,
  },
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
