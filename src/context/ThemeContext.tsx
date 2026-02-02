/**
 * Theme Context
 * Provides theme state management and persistence for the entire app
 * Supports dark and light themes with smooth transitions
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, Colors, ThemeMode } from '../theme/colors';
import { spacing, borderRadius, layout, Spacing, BorderRadius, Layout } from '../theme/spacing';
import { typography, fontWeights, fontSizes, Typography } from '../theme/typography';
import { createShadows, Shadows } from '../theme/shadows';
import { duration, springConfig, timingConfig, animationValues } from '../theme/animations';

// Storage key for theme preference
const THEME_STORAGE_KEY = '@lifetag_theme';

// Theme Context Types
export interface ThemeContextType {
  // Current theme state
  isDark: boolean;
  themeMode: ThemeMode;
  isInitialized: boolean;
  
  // Theme operations
  toggleTheme: () => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
  
  // Dynamic colors based on current theme
  colors: Colors;
  
  // Other theme values
  spacing: Spacing;
  borderRadius: BorderRadius;
  layout: Layout;
  typography: Typography;
  fontWeights: typeof fontWeights;
  fontSizes: typeof fontSizes;
  shadows: Shadows;
  animation: {
    duration: typeof duration;
    spring: typeof springConfig;
    timing: typeof timingConfig;
    values: typeof animationValues;
  };
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Get stored theme preference from AsyncStorage
 */
const getStoredTheme = async (): Promise<ThemeMode | null> => {
  try {
    const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return null;
  } catch (error) {
    console.error('Error loading theme preference:', error);
    return null;
  }
};

/**
 * Store theme preference to AsyncStorage
 */
const storeTheme = async (mode: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.error('Error storing theme preference:', error);
  }
};

/**
 * Theme Provider Component
 * Wraps the app to provide theme context to all components
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Default to dark theme
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load stored preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const storedTheme = await getStoredTheme();
        if (storedTheme) {
          setThemeMode(storedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadPreference();
  }, []);

  // Toggle between dark and light
  const toggleTheme = async (): Promise<void> => {
    const newMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
    await storeTheme(newMode);
  };

  // Set specific theme
  const setTheme = async (mode: ThemeMode): Promise<void> => {
    setThemeMode(mode);
    await storeTheme(mode);
  };

  // Get current colors based on theme mode
  const currentColors = useMemo(() => {
    return themeMode === 'dark' ? darkColors : lightColors;
  }, [themeMode]);

  // Get dynamic shadows based on current colors
  const currentShadows = useMemo(() => {
    return createShadows(currentColors);
  }, [currentColors]);

  // Build complete theme context value
  const contextValue: ThemeContextType = useMemo(() => ({
    isDark: themeMode === 'dark',
    themeMode,
    isInitialized,
    toggleTheme,
    setTheme,
    colors: currentColors,
    spacing,
    borderRadius,
    layout,
    typography,
    fontWeights,
    fontSizes,
    shadows: currentShadows,
    animation: {
      duration,
      spring: springConfig,
      timing: timingConfig,
      values: animationValues,
    },
  }), [themeMode, isInitialized, currentColors, currentShadows]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 * Must be used within a ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export context for edge cases
export { ThemeContext };
