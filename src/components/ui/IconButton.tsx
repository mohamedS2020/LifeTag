/**
 * LifeTag IconButton Component
 * Circular icon button with variants
 */

import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { springConfig } from '../../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export type IconButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
}) => {
  const { colors, shadows } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, springConfig.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springConfig.snappy);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getVariantStyles = useCallback((): { container: ViewStyle; iconColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary.main,
            ...shadows.primary,
          },
          iconColor: colors.white,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          iconColor: colors.text.secondary,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.status.error.background,
            borderWidth: 1,
            borderColor: colors.status.error.border,
          },
          iconColor: colors.status.error.main,
        };
      case 'default':
      default:
        return {
          container: {
            backgroundColor: colors.background.elevated,
            borderWidth: 1,
            borderColor: colors.border.default,
          },
          iconColor: colors.text.primary,
        };
    }
  }, [colors, shadows, variant]);

  const getSizeStyles = useCallback((): { size: number; iconSize: number } => {
    switch (size) {
      case 'sm':
        return { size: 36, iconSize: 18 };
      case 'lg':
        return { size: 52, iconSize: 26 };
      case 'md':
      default:
        return { size: 44, iconSize: 22 };
    }
  }, [size]);

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: {
      opacity: 0.5,
    },
  }), []);

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={[
        styles.container,
        variantStyles.container,
        {
          width: sizeStyles.size,
          height: sizeStyles.size,
          borderRadius: sizeStyles.size / 2,
        },
        animatedStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={sizeStyles.iconSize}
        color={variantStyles.iconColor}
      />
    </AnimatedTouchable>
  );
};

export default IconButton;
