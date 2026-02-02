/**
 * LifeTag Button Component
 * Reusable button with variants and animations
 */

import React, { useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { springConfig, duration } from '../../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  iconColor?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  iconColor,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const { colors, shadows, spacing, borderRadius, layout, typography } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, springConfig.snappy);
    opacity.value = withTiming(0.9, { duration: duration.fast });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springConfig.snappy);
    opacity.value = withTiming(1, { duration: duration.fast });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getVariantStyles = useCallback((): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary.main,
            ...shadows.primary,
          },
          text: { color: colors.white },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.background.elevated,
            borderWidth: 1,
            borderColor: colors.border.light,
          },
          text: { color: colors.text.primary },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary.main,
          },
          text: { color: colors.primary.main },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: colors.primary.main },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.status.error.main,
            ...shadows.error,
          },
          text: { color: colors.white },
        };
      case 'success':
        return {
          container: {
            backgroundColor: colors.status.success.main,
            ...shadows.success,
          },
          text: { color: colors.white },
        };
      default:
        return {
          container: { backgroundColor: colors.primary.main },
          text: { color: colors.white },
        };
    }
  }, [colors, shadows, variant]);

  const getSizeStyles = useCallback((): { container: ViewStyle; text: TextStyle; iconSize: number } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            height: 40,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.sm,
          },
          text: typography.buttonSmall,
          iconSize: 16,
        };
      case 'lg':
        return {
          container: {
            height: 56,
            paddingHorizontal: spacing['2xl'],
            borderRadius: borderRadius.lg,
          },
          text: { ...typography.button, fontSize: 17 },
          iconSize: 24,
        };
      case 'md':
      default:
        return {
          container: {
            height: layout.buttonHeight,
            paddingHorizontal: spacing.xl,
            borderRadius: borderRadius.md,
          },
          text: typography.button,
          iconSize: 20,
        };
    }
  }, [spacing, borderRadius, layout, typography, size]);

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullWidth: {
      width: '100%',
    },
    disabled: {
      opacity: 0.5,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      textAlign: 'center',
    },
    textDisabled: {
      opacity: 0.7,
    },
    iconLeft: {
      marginRight: spacing.sm,
    },
    iconRight: {
      marginLeft: spacing.sm,
    },
  }), [spacing]);

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
        />
      );
    }

    const iconElement = icon && (
      <Ionicons
        name={icon}
        size={sizeStyles.iconSize}
        color={iconColor || variantStyles.text.color as string}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );

    return (
      <View style={styles.content}>
        {iconPosition === 'left' && iconElement}
        <Text
          style={[
            styles.text,
            sizeStyles.text,
            variantStyles.text,
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

export default Button;
