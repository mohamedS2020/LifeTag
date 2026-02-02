/**
 * ThemeToggle Component
 * Modern animated toggle switch for dark/light theme
 * Features smooth spring animations and sun/moon icon morphing
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// Animation configuration
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 400,
  mass: 1,
};

const TOGGLE_WIDTH = 64;
const TOGGLE_HEIGHT = 34;
const KNOB_SIZE = 28;
const KNOB_MARGIN = 3;

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'md' }) => {
  const { isDark, toggleTheme, colors } = useTheme();
  
  // Animation value (0 = dark, 1 = light)
  const progress = useSharedValue(isDark ? 0 : 1);

  // Update animation when theme changes
  React.useEffect(() => {
    progress.value = withSpring(isDark ? 0 : 1, SPRING_CONFIG);
  }, [isDark]);

  // Animated styles for the track
  const trackAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#1C1C1E', '#E5E5EA'] // iOS-like track colors
    );

    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#3A3A3C', '#D1D1D6']
    );

    return {
      backgroundColor,
      borderColor,
    };
  });

  // Animated styles for the knob
  const knobAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [0, TOGGLE_WIDTH - KNOB_SIZE - (KNOB_MARGIN * 2)]
    );

    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#2C2C2E', '#FFFFFF']
    );

    const shadowOpacity = interpolate(progress.value, [0, 1], [0.3, 0.15]);

    return {
      transform: [{ translateX }],
      backgroundColor,
      shadowOpacity,
    };
  });

  // Animated styles for the moon icon
  const moonAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5], [1, 0]);
    const scale = interpolate(progress.value, [0, 0.5], [1, 0.5]);
    const rotate = interpolate(progress.value, [0, 1], [0, -90]);

    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Animated styles for the sun icon
  const sunAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.5, 1], [0, 1]);
    const scale = interpolate(progress.value, [0.5, 1], [0.5, 1]);
    const rotate = interpolate(progress.value, [0, 1], [90, 0]);

    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Animated glow effect
  const glowAnimatedStyle = useAnimatedStyle(() => {
    const glowColor = interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(147, 112, 219, 0)', 'rgba(255, 204, 0, 0.3)']
    );

    return {
      backgroundColor: glowColor,
    };
  });

  const handlePress = () => {
    toggleTheme();
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Glow effect */}
      <Animated.View style={[styles.glow, glowAnimatedStyle]} />
      
      {/* Track */}
      <Animated.View style={[styles.track, trackAnimatedStyle]}>
        {/* Stars decoration (visible in dark mode) */}
        <Animated.View style={[styles.starsContainer, { opacity: isDark ? 0.6 : 0 }]}>
          <View style={[styles.star, { top: 6, left: 32 }]} />
          <View style={[styles.star, { top: 16, left: 42 }]} />
          <View style={[styles.starSmall, { top: 10, left: 50 }]} />
        </Animated.View>

        {/* Clouds decoration (visible in light mode) */}
        <Animated.View style={[styles.cloudsContainer, { opacity: isDark ? 0 : 0.5 }]}>
          <View style={[styles.cloud, { top: 8, left: 8 }]} />
          <View style={[styles.cloudSmall, { top: 18, left: 16 }]} />
        </Animated.View>

        {/* Knob with icons */}
        <Animated.View style={[styles.knob, knobAnimatedStyle]}>
          {/* Moon icon */}
          <Animated.View style={[styles.iconContainer, moonAnimatedStyle]}>
            <Ionicons name="moon" size={16} color="#FFD93D" />
          </Animated.View>
          
          {/* Sun icon */}
          <Animated.View style={[styles.iconContainer, styles.iconAbsolute, sunAnimatedStyle]}>
            <Ionicons name="sunny" size={18} color="#FF9500" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
  },
  track: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    borderWidth: 1,
    padding: KNOB_MARGIN,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconAbsolute: {
    position: 'absolute',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  starSmall: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  cloudsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  cloud: {
    position: 'absolute',
    width: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  cloudSmall: {
    position: 'absolute',
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

export default ThemeToggle;
