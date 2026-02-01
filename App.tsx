import { StatusBar } from 'expo-status-bar';
import { AuthProvider, LanguageProvider } from './src/context';
import { AppNavigator } from './src/navigation';
import { ThemeProvider } from './src/theme';
import './src/i18n'; // Initialize i18n

/**
 * Main App Component
 * Sets up the AuthProvider wrapper and navigation system
 * Task 7.1: Basic React Navigation setup
 * Multi-language support with i18n
 */
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}