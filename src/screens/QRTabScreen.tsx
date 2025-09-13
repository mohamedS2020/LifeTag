/**
 * QR Tab Screen
 * Provides quick access to QR-related features from the main tab
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface QRTabScreenProps {
  navigation: any;
}

const QRTabScreen: React.FC<QRTabScreenProps> = ({ navigation }) => {
  const { user } = useAuth();

  const handleShowMyQR = () => {
    navigation.navigate('QRDisplay');
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner', {
      medicalProfessionalMode: user?.userType === 'medical_professional' && user?.isVerified,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="qr-code" size={48} color="#2196F3" />
          <Text style={styles.title}>QR Code Features</Text>
          <Text style={styles.subtitle}>Quick access to emergency QR codes</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShowMyQR}>
            <View style={styles.actionIcon}>
              <Ionicons name="qr-code" size={32} color="#4CAF50" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Show My QR Code</Text>
              <Text style={styles.actionDescription}>
                Display your emergency information QR code
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleScanQR}>
            <View style={styles.actionIcon}>
              <Ionicons name="scan" size={32} color="#2196F3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan QR Code</Text>
              <Text style={styles.actionDescription}>
                Scan emergency information from others
                {user?.userType === 'medical_professional' && user?.isVerified && ' (Professional Mode)'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {user?.userType === 'medical_professional' && user?.isVerified && (
          <View style={styles.professionalSection}>
            <View style={styles.professionalBadge}>
              <Ionicons name="medical" size={16} color="#4CAF50" />
              <Text style={styles.professionalText}>Medical Professional Features</Text>
            </View>
            <Text style={styles.professionalDescription}>
              As a verified medical professional, you have enhanced access to full emergency profiles when scanning QR codes.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
  actionsContainer: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  professionalSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  professionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  professionalText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  professionalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default QRTabScreen;