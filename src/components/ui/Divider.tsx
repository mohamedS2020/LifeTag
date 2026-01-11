/**
 * LifeTag Divider Component
 * Simple divider with optional label
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface DividerProps {
  label?: string;
  style?: ViewStyle;
  color?: string;
}

const Divider: React.FC<DividerProps> = ({
  label,
  style,
  color = colors.border.default,
}) => {
  if (label) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.line, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.line, { backgroundColor: color }]} />
      </View>
    );
  }

  return <View style={[styles.simpleLine, { backgroundColor: color }, style]} />;
};

const styles = StyleSheet.create({
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
});

export default Divider;
