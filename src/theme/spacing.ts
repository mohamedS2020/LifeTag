/**
 * LifeTag Spacing System
 * Based on 4px grid for consistent spacing
 */

// Border radius tokens
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const spacing = {
  // Base unit: 4px
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,

  // Semantic spacing
  screenPadding: 20,
  cardPadding: 16,
  inputPadding: 16,
  sectionGap: 24,
  itemGap: 12,
  iconGap: 12,
  
  // Include borderRadius for convenience
  borderRadius,
} as const;

// Layout constants
export const layout = {
  buttonHeight: 52,
  inputHeight: 52,
  headerHeight: 56,
  tabBarHeight: 60,
  iconSizeSmall: 16,
  iconSizeMedium: 20,
  iconSizeLarge: 24,
  iconSizeXL: 32,
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 64,
  badgeSize: 24,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Layout = typeof layout;
