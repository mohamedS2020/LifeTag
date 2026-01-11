/**
 * LifeTag Shadow System
 * Elevation-based shadows for dark theme
 */

import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

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

export const shadows = {
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
    ...createShadow(4, 12, 0.4, colors.primary.main),
    shadowColor: colors.primary.main,
  } as ViewStyle,

  success: {
    ...createShadow(4, 12, 0.3, colors.status.success.main),
    shadowColor: colors.status.success.main,
  } as ViewStyle,

  error: {
    ...createShadow(4, 12, 0.3, colors.status.error.main),
    shadowColor: colors.status.error.main,
  } as ViewStyle,

  // Glow effects for interactive elements
  glow: {
    primary: {
      ...createShadow(0, 20, 0.5, colors.primary.main),
      shadowColor: colors.primary.main,
    } as ViewStyle,
    success: {
      ...createShadow(0, 16, 0.4, colors.status.success.main),
      shadowColor: colors.status.success.main,
    } as ViewStyle,
  },

  // Inner shadow simulation (using border + background)
  inner: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: colors.background.input,
  } as ViewStyle,
} as const;

export type Shadows = typeof shadows;
export default shadows;
