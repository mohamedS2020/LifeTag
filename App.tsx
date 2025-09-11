import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { auth } from './src/config/firebase.config';

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
    <View style={styles.container}>
      <Text style={styles.title}>LifeTag App</Text>
      <Text style={styles.subtitle}>Emergency Medical Information System</Text>
      <Text style={styles.status}>{firebaseStatus}</Text>
      <Text style={styles.instructions}>Development environment setup complete!</Text>
      <StatusBar style="auto" />
    </View>
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
  },
});
