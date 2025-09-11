import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { auth } from './src/config/firebase.config';
import { AuthProvider, useAuth } from './src/context';
import { LoginScreen, RegisterScreen, MedicalProfessionalRegister } from './src/components/Auth';

// Main App Content Component
function AppContent() {
  const { user, initializing, logout } = useAuth();
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [showMedicalRegister, setShowMedicalRegister] = useState<boolean>(false);

  useEffect(() => {
    // Only show login screen if not initializing and no user is logged in
    if (!initializing && !user) {
      setShowLogin(true);
    }
  }, [initializing, user]);

  const handleShowRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
    setShowMedicalRegister(false);
  };

  const handleShowMedicalRegister = () => {
    setShowLogin(false);
    setShowRegister(false);
    setShowMedicalRegister(true);
  };

  const handleShowLogin = () => {
    setShowRegister(false);
    setShowMedicalRegister(false);
    setShowLogin(true);
  };

  // Show loading screen while initializing
  if (initializing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>LifeTag App</Text>
        <Text style={styles.subtitle}>Emergency Medical Information System</Text>
        <Text style={styles.status}>🔄 Checking authentication...</Text>
        <Text style={styles.instructions}>Loading user session...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Show main app if user is logged in
  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>Hello, {user.email}</Text>
        <Text style={styles.status}>✅ Authentication restored from storage</Text>
        <Text style={styles.instructions}>
          User Type: {user.userType} {'\n'}
          Last Login: Session persisted
        </Text>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={async () => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Logout', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await logout();
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
        <StatusBar style="auto" />
      </View>
    );
  }

  // Show authentication screens
  if (showMedicalRegister) {
    return (
      <MedicalProfessionalRegister 
        onRegisterSuccess={() => {
          console.log('Medical professional registration successful!');
          // User will be automatically set by AuthContext
        }}
        onNavigateToLogin={handleShowLogin}
        onNavigateToRegularRegister={handleShowRegister}
      />
    );
  }

  if (showRegister) {
    return (
      <RegisterScreen 
        onRegisterSuccess={() => {
          console.log('Registration successful!');
          // User will be automatically set by AuthContext
        }}
        onNavigateToLogin={handleShowLogin}
        onNavigateToMedicalRegister={handleShowMedicalRegister}
      />
    );
  }

  if (showLogin) {
    return (
      <LoginScreen 
        onLoginSuccess={() => {
          console.log('Login successful!');
          // User will be automatically set by AuthContext
        }}
        onNavigateToRegister={handleShowRegister}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LifeTag App</Text>
      <Text style={styles.subtitle}>Emergency Medical Information System</Text>
      <Text style={styles.status}>🔄 Initializing...</Text>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Test Firebase initialization
    try {
      if (auth) {
        setFirebaseStatus('✅ Firebase Connected');
      } else {
        setFirebaseStatus('❌ Firebase Connection Failed');
      }
    } catch (error) {
      setFirebaseStatus('❌ Firebase Error: ' + (error as Error).message);
    }
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
    textAlign: 'center',
  },
  status: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
