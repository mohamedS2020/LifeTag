import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, LanguageProvider, ThemeProvider, useTheme } from './src/context';
import { AppNavigator } from './src/navigation';
import './src/i18n'; // Initialize i18n

/**
 * App Content with dynamic StatusBar
 * Separated to use theme context inside provider
 */
function AppContent() {
  const { isDark, colors } = useTheme();
  
  return (
    <>
      <AppNavigator />
      <StatusBar 
        style="light" 
        translucent 
        backgroundColor={isDark ? colors.background.primary : colors.primary.main} 
      />
    </>
  );
}

/**
 * Main App Component
 * Sets up the AuthProvider wrapper and navigation system
 * Task 7.1: Basic React Navigation setup
 * Multi-language support with i18n
 * Dark/Light theme support
 */
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}