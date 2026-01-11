/**
 * LifeTag Typography System
 * Modern, clean font hierarchy
 */

import { TextStyle, Platform } from 'react-native';

// Font family - using system fonts for best performance
const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// Font weights
export const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

// Font sizes
export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 42,
};

// Line heights
export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

// Pre-defined text styles
export const typography = {
  // Display styles - for hero sections
  displayLarge: {
    fontFamily,
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['5xl'] * lineHeights.tight,
    letterSpacing: -0.5,
  } as TextStyle,

  displayMedium: {
    fontFamily,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: -0.3,
  } as TextStyle,

  // Heading styles
  h1: {
    fontFamily,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: -0.2,
  } as TextStyle,

  h2: {
    fontFamily,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  } as TextStyle,

  h3: {
    fontFamily,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.normal,
  } as TextStyle,

  h4: {
    fontFamily,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.normal,
  } as TextStyle,

  // Body styles
  bodyLarge: {
    fontFamily,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.lg * lineHeights.relaxed,
  } as TextStyle,

  body: {
    fontFamily,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.md * lineHeights.relaxed,
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
  } as TextStyle,

  // Label styles
  labelLarge: {
    fontFamily,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.md * lineHeights.normal,
  } as TextStyle,

  label: {
    fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.normal,
  } as TextStyle,

  labelSmall: {
    fontFamily,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  // Button text
  button: {
    fontFamily,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: 0.3,
  } as TextStyle,

  buttonSmall: {
    fontFamily,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: 0.2,
  } as TextStyle,

  // Caption/helper text
  caption: {
    fontFamily,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
  } as TextStyle,
} as const;

export type Typography = typeof typography;
export default typography;
