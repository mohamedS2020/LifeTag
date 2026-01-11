/**
 * LifeTag Animation Constants
 * Consistent timing and easing for smooth micro-interactions
 */

import { Easing } from 'react-native-reanimated';

// Duration constants (in ms)
export const duration = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

// Spring configurations for react-native-reanimated
export const springConfig = {
  // Snappy - for button presses, toggles
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 1,
  },

  // Gentle - for cards, modals
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },

  // Bouncy - for playful interactions
  bouncy: {
    damping: 10,
    stiffness: 300,
    mass: 0.8,
  },

  // Smooth - for page transitions
  smooth: {
    damping: 25,
    stiffness: 150,
    mass: 1,
  },
} as const;

// Timing configurations
export const timingConfig = {
  // For fades
  fade: {
    duration: duration.normal,
    easing: Easing.inOut(Easing.ease),
  },

  // For scale animations
  scale: {
    duration: duration.fast,
    easing: Easing.out(Easing.cubic),
  },

  // For slides
  slide: {
    duration: duration.normal,
    easing: Easing.out(Easing.cubic),
  },

  // For color transitions
  color: {
    duration: duration.fast,
    easing: Easing.linear,
  },
} as const;

// Common animation values
export const animationValues = {
  // Press feedback
  pressScale: 0.97,
  pressOpacity: 0.8,

  // Card hover/focus
  cardLift: -4,
  cardScale: 1.02,

  // Entry animations
  fadeIn: {
    from: 0,
    to: 1,
  },
  slideUp: {
    from: 20,
    to: 0,
  },
  slideDown: {
    from: -20,
    to: 0,
  },
} as const;

export type Duration = typeof duration;
export type SpringConfig = typeof springConfig;
export type TimingConfig = typeof timingConfig;
