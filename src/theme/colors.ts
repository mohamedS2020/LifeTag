/**
 * LifeTag Color System
 * Primary: Black & Blue (#407CE2)
 * Dark-first theme with semantic color tokens
 */

export const colors = {
  // Primary palette
  primary: {
    main: '#407CE2',
    light: '#6B9AE8',
    dark: '#2D5AA8',
    contrast: '#FFFFFF',
  },

  // Background colors (Dark theme)
  background: {
    primary: '#000000',
    secondary: '#0A0A0A',
    tertiary: '#141414',
    elevated: '#1A1A1A',
    card: '#1E1E1E',
    input: '#252525',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#808080',
    disabled: '#4D4D4D',
    inverse: '#000000',
  },

  // Border colors
  border: {
    default: '#2A2A2A',
    light: '#333333',
    focus: '#407CE2',
    error: '#BF1A1A',
  },

  // Semantic colors - Status indicators
  status: {
    success: {
      main: '#32D74B',
      light: '#30DB5B',
      dark: '#248A3D',
      background: 'rgba(50, 215, 75, 0.12)',
      border: 'rgba(50, 215, 75, 0.3)',
    },
    warning: {
      main: '#FF9F0A',
      light: '#FFD60A',
      dark: '#C77800',
      background: 'rgba(255, 159, 10, 0.12)',
      border: 'rgba(255, 159, 10, 0.3)',
    },
    error: {
      main: '#BF1A1A',
      light: '#FF6961',
      dark: '#D70015',
      background: 'rgba(255, 69, 58, 0.12)',
      border: 'rgba(255, 69, 58, 0.3)',
    },
    info: {
      main: '#407CE2',
      light: '#6B9AE8',
      dark: '#2D5AA8',
      background: 'rgba(64, 124, 226, 0.12)',
      border: 'rgba(64, 124, 226, 0.3)',
    },
  },

  // Medical/Emergency specific colors (contextual - these make sense for medical app)
  medical: {
    emergency: '#BF1A1A',
    emergencyBackground: 'rgba(255, 69, 58, 0.15)',
    verified: '#32D74B',
    verifiedBackground: 'rgba(50, 215, 75, 0.15)',
    pending: '#FF9F0A',
    pendingBackground: 'rgba(255, 159, 10, 0.15)',
    professional: '#407CE2',
    professionalBackground: 'rgba(64, 124, 226, 0.15)',
  },

  // Utility
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Gradient definitions
  gradients: {
    primary: ['#407CE2', '#2D5AA8'],
    dark: ['#1A1A1A', '#000000'],
    card: ['#1E1E1E', '#141414'],
    emergency: ['#BF1A1A', '#D70015'],
  },

  // Overlay colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
    heavy: 'rgba(0, 0, 0, 0.8)',
  },
} as const;

export type Colors = typeof colors;
export default colors;
