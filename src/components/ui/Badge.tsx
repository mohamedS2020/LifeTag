/**
 * LifeTag Badge Component
 * Status badges for verification, roles, and indicators
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, duration } from '../../theme';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  pulse?: boolean;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  pulse = false,
  style,
}) => {
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    if (pulse) {
      pulseAnim.value = withRepeat(
        withTiming(0.6, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse ? pulseAnim.value : 1,
  }));

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; iconColor: string } => {
    switch (variant) {
      case 'success':
        return {
          container: {
            backgroundColor: colors.status.success.background,
            borderColor: colors.status.success.border,
          },
          text: { color: colors.status.success.main },
          iconColor: colors.status.success.main,
        };
      case 'warning':
        return {
          container: {
            backgroundColor: colors.status.warning.background,
            borderColor: colors.status.warning.border,
          },
          text: { color: colors.status.warning.main },
          iconColor: colors.status.warning.main,
        };
      case 'error':
        return {
          container: {
            backgroundColor: colors.status.error.background,
            borderColor: colors.status.error.border,
          },
          text: { color: colors.status.error.main },
          iconColor: colors.status.error.main,
        };
      case 'info':
        return {
          container: {
            backgroundColor: colors.status.info.background,
            borderColor: colors.status.info.border,
          },
          text: { color: colors.status.info.main },
          iconColor: colors.status.info.main,
        };
      case 'primary':
        return {
          container: {
            backgroundColor: colors.medical.professionalBackground,
            borderColor: colors.primary.main,
          },
          text: { color: colors.primary.main },
          iconColor: colors.primary.main,
        };
      case 'neutral':
      default:
        return {
          container: {
            backgroundColor: colors.background.elevated,
            borderColor: colors.border.light,
          },
          text: { color: colors.text.secondary },
          iconColor: colors.text.secondary,
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; iconSize: number } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
            borderRadius: borderRadius.xs,
          },
          text: { ...typography.caption, fontWeight: '600' },
          iconSize: 12,
        };
      case 'lg':
        return {
          container: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
          },
          text: { ...typography.labelLarge },
          iconSize: 18,
        };
      case 'md':
      default:
        return {
          container: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
          },
          text: { ...typography.label, fontWeight: '600' },
          iconSize: 14,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      entering={FadeIn.duration(duration.normal)}
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        style,
      ]}
    >
      {icon && (
        <Animated.View style={pulseStyle}>
          <Ionicons
            name={icon}
            size={sizeStyles.iconSize}
            color={variantStyles.iconColor}
            style={styles.icon}
          />
        </Animated.View>
      )}
      <Text style={[sizeStyles.text, variantStyles.text]}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  icon: {
    marginRight: spacing.xs,
  },
});

export default Badge;
