/**
 * LifeTag Shadow System
 * Elevation-based shadows supporting both dark and light themes
 */

import { Platform, ViewStyle } from 'react-native';
import { colors, type Colors } from './colors';

// Shadow factory for cross-platform shadows
const createShadow = (
  offsetY: number,
  blur: number,
  opacity: number,
  color: string = '#000000'
): ViewStyle => {
  if (Platform.OS === 'android') {
    return {
      elevation: offsetY,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
  };
};

/**
 * Create shadows based on current theme colors
 * This allows shadows to adapt to light/dark theme
 */
export const createShadows = (themeColors: Colors) => ({
  none: {} as ViewStyle,

  // Subtle elevation - for cards on dark bg
  sm: createShadow(2, 4, 0.3),

  // Medium elevation - for floating elements
  md: createShadow(4, 8, 0.4),

  // Large elevation - for modals, dropdowns
  lg: createShadow(8, 16, 0.5),

  // Extra large - for prominent elements
  xl: createShadow(12, 24, 0.6),

  // Colored shadows (for accent elements)
  primary: {
    ...createShadow(4, 12, 0.4, themeColors.primary.main),
    shadowColor: themeColors.primary.main,
  } as ViewStyle,

  success: {
    ...createShadow(4, 12, 0.3, themeColors.status.success.main),
    shadowColor: themeColors.status.success.main,
  } as ViewStyle,

  error: {
    ...createShadow(4, 12, 0.3, themeColors.status.error.main),
    shadowColor: themeColors.status.error.main,
  } as ViewStyle,

  // Glow effects for interactive elements
  glow: {
    primary: {
      ...createShadow(0, 20, 0.5, themeColors.primary.main),
      shadowColor: themeColors.primary.main,
    } as ViewStyle,
    success: {
      ...createShadow(0, 16, 0.4, themeColors.status.success.main),
      shadowColor: themeColors.status.success.main,
    } as ViewStyle,
  },

  // Inner shadow simulation (using border + background)
  inner: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: themeColors.background.input,
  } as ViewStyle,
});

// Default shadows using default colors (for backwards compatibility)
export const shadows = createShadows(colors);

export type Shadows = ReturnType<typeof createShadows>;
export default shadows;
