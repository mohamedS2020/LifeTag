/**
 * LifeTag Theme System
 * Centralized theme exports and utilities
 */

import React, { createContext, useContext } from 'react';
import { colors, Colors } from './colors';
import { spacing, borderRadius, layout, Spacing, BorderRadius, Layout } from './spacing';
import { typography, fontWeights, fontSizes, Typography } from './typography';
import { shadows, Shadows } from './shadows';
import { duration, springConfig, timingConfig, animationValues } from './animations';

// Combined theme object
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

// Theme context
const ThemeContext = createContext<Theme>(theme);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

// Hook to access theme
export const useTheme = (): Theme => {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return themeContext;
};

// Re-export everything for convenience
export { colors } from './colors';
export { spacing, borderRadius, layout } from './spacing';
export { typography, fontWeights, fontSizes } from './typography';
export { shadows } from './shadows';
export { duration, springConfig, timingConfig, animationValues } from './animations';

// Type exports
export type { Colors, Spacing, BorderRadius, Layout, Typography, Shadows };

export default theme;
