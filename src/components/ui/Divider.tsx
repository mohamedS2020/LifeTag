/**
 * LifeTag Divider Component
 * Simple divider with optional label
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface DividerProps {
  label?: string;
  style?: ViewStyle;
  color?: string;
}

const Divider: React.FC<DividerProps> = ({
  label,
  style,
  color,
}) => {
  const { colors, spacing, typography } = useTheme();
  const dividerColor = color || colors.border.default;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.lg,
    },
    line: {
      flex: 1,
      height: 1,
    },
    simpleLine: {
      height: 1,
      marginVertical: spacing.lg,
    },
    label: {
      ...typography.caption,
      color: colors.text.tertiary,
      marginHorizontal: spacing.md,
    },
  }), [colors, spacing, typography]);

  if (label) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.line, { backgroundColor: dividerColor }]} />
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.line, { backgroundColor: dividerColor }]} />
      </View>
    );
  }

  return <View style={[styles.simpleLine, { backgroundColor: dividerColor }, style]} />;
};

export default Divider;
