/**
 * LifeTag Color System
 * Primary: Black & Blue (#407CE2)
 * Dual theme support with semantic color tokens
 */

// Shared colors (same in both themes)
const sharedColors = {
  // Primary palette
  primary: {
    main: '#407CE2',
    light: '#6B9AE8',
    dark: '#2D5AA8',
    contrast: '#FFFFFF',
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

  // Accent colors
  accent: {
    purple: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
      background: 'rgba(139, 92, 246, 0.12)',
    },
    teal: {
      main: '#14B8A6',
      light: '#2DD4BF',
      dark: '#0D9488',
      background: 'rgba(20, 184, 166, 0.12)',
    },
  },

  // Medical/Emergency specific colors
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
} as const;

// Dark theme colors
export const darkColors = {
  ...sharedColors,

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

// Light theme colors
export const lightColors = {
  ...sharedColors,

  // Background colors (Light theme)
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F0F2F5',
    elevated: '#FFFFFF',
    card: '#FFFFFF',
    input: '#F5F5F7',
  },

  // Text colors
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    disabled: '#D1D5DB',
    inverse: '#FFFFFF',
  },

  // Border colors
  border: {
    default: '#E5E7EB',
    light: '#F3F4F6',
    focus: '#407CE2',
    error: '#BF1A1A',
  },

  // Gradient definitions
  gradients: {
    primary: ['#407CE2', '#6B9AE8'],
    dark: ['#F8F9FA', '#FFFFFF'],
    card: ['#FFFFFF', '#F8F9FA'],
    emergency: ['#BF1A1A', '#FF6961'],
  },

  // Overlay colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.02)',
    medium: 'rgba(0, 0, 0, 0.05)',
    dark: 'rgba(0, 0, 0, 0.3)',
    heavy: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

// Default export (dark theme for backwards compatibility)
export const colors = darkColors;

// Create a flexible type that works for both themes
export interface Colors {
  primary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    card: string;
    input: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    default: string;
    light: string;
    focus: string;
    error: string;
  };
  status: {
    success: { main: string; light: string; dark: string; background: string; border: string };
    warning: { main: string; light: string; dark: string; background: string; border: string };
    error: { main: string; light: string; dark: string; background: string; border: string };
    info: { main: string; light: string; dark: string; background: string; border: string };
  };
  medical: {
    emergency: string;
    emergencyBackground: string;
    verified: string;
    verifiedBackground: string;
    pending: string;
    pendingBackground: string;
    professional: string;
    professionalBackground: string;
  };
  accent: {
    purple: {
      main: string;
      light: string;
      dark: string;
      background: string;
    };
    teal: {
      main: string;
      light: string;
      dark: string;
      background: string;
    };
  };
  transparent: string;
  white: string;
  black: string;
  gradients: {
    primary: readonly string[];
    dark: readonly string[];
    card: readonly string[];
    emergency: readonly string[];
  };
  overlay: {
    light: string;
    medium: string;
    dark: string;
    heavy: string;
  };
}

export type ThemeMode = 'dark' | 'light';

export default colors;
