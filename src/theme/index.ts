/**
 * LifeTag Theme System
 * Centralized theme exports and utilities
 * Supports dark and light themes
 */

import { colors, darkColors, lightColors, Colors, ThemeMode } from './colors';
import { spacing, borderRadius, layout, Spacing, BorderRadius, Layout } from './spacing';
import { typography, fontWeights, fontSizes, Typography } from './typography';
import { shadows, createShadows, Shadows } from './shadows';
import { duration, springConfig, timingConfig, animationValues } from './animations';

// Combined theme object (default dark)
export const theme = {
  colors,
  spacing,
  borderRadius,
  layout,
  typography,
  fontWeights,
  fontSizes,
  shadows,
  animation: {
    duration,
    spring: springConfig,
    timing: timingConfig,
    values: animationValues,
  },
} as const;

export type Theme = typeof theme;

// Re-export ThemeProvider and useTheme from context
// Note: Import from '../context/ThemeContext' when using in the app
// This is kept for backwards compatibility
export { ThemeProvider, useTheme } from '../context/ThemeContext';
export type { ThemeContextType } from '../context/ThemeContext';

// Re-export everything for convenience
export { colors, darkColors, lightColors } from './colors';
export { spacing, borderRadius, layout } from './spacing';
export { typography, fontWeights, fontSizes } from './typography';
export { shadows, createShadows } from './shadows';
export { duration, springConfig, timingConfig, animationValues } from './animations';

// Type exports
export type { Colors, ThemeMode, Spacing, BorderRadius, Layout, Typography, Shadows };

export default theme;
