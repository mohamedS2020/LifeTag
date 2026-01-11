import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context';
import { AppNavigator } from './src/navigation';
import { ThemeProvider } from './src/theme';

/**
 * Main App Component
 * Sets up the AuthProvider wrapper and navigation system
 * Task 7.1: Basic React Navigation setup
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </AuthProvider>
    </ThemeProvider>
  );
}