/**
 * LifeTag Card Component
 * Flexible container with variants and animations
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { springConfig, duration } from '../../theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'gradient';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  animated?: boolean;
  animationDelay?: number;
  pressable?: boolean;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  animated = false,
  animationDelay = 0,
  pressable = false,
  disabled = false,
}) => {
  const { colors, shadows, spacing, borderRadius } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (pressable || onPress) {
      scale.value = withSpring(0.98, springConfig.snappy);
    }
  }, [pressable, onPress]);

  const handlePressOut = useCallback(() => {
    if (pressable || onPress) {
      scale.value = withSpring(1, springConfig.snappy);
    }
  }, [pressable, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getVariantStyles = useCallback((): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.background.card,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border.default,
        };
      case 'filled':
        return {
          backgroundColor: colors.background.elevated,
        };
      case 'gradient':
        return {
          backgroundColor: colors.background.card,
          borderWidth: 1,
          borderColor: colors.border.light,
          ...shadows.sm,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.background.card,
          borderWidth: 1,
          borderColor: colors.border.default,
        };
    }
  }, [colors, shadows, variant]);

  const variantStyles = getVariantStyles();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      overflow: 'hidden',
    },
    disabled: {
      opacity: 0.6,
    },
  }), [borderRadius, spacing]);

  const enteringAnimation = animated
    ? FadeInDown.delay(animationDelay).duration(duration.normal).springify()
    : undefined;

  if (onPress || pressable) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        entering={enteringAnimation}
        style={[styles.container, variantStyles, animatedStyle, disabled && styles.disabled, style]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedView
      entering={enteringAnimation}
      style={[styles.container, variantStyles, style]}
    >
      {children}
    </AnimatedView>
  );
};

export default Card;
