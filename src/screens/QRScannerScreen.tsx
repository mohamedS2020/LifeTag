/**
 * QR Scanner Screen
 * Screen wrapper for QRScanner component that handles navigation and emergency info display
 * Task 7.4: Implement navigation between profile creation, QR display, scanning, and history
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { QRScanner } from '../components/QR';
import { EmergencyQRData } from '../services/qrService';

interface QRScannerScreenProps {
  navigation: any;
  route?: {
    params?: {
      returnTo?: string; // Screen to return to after scanning
      medicalProfessionalMode?: boolean; // Enhanced mode for medical professionals
    };
  };
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [scanResult, setScanResult] = useState<{
    qrData: string;
    emergencyData: EmergencyQRData | null;
  } | null>(null);

  const returnTo = route?.params?.returnTo;
  const medicalProfessionalMode = route?.params?.medicalProfessionalMode || false;

  const handleQRScanned = (qrData: string, emergencyData: EmergencyQRData | null) => {
    setScanResult({ qrData, emergencyData });

    if (emergencyData) {
      // Successfully parsed emergency data
      if (emergencyData.hasFullProfile && emergencyData.profileId) {
        // This QR code has a full profile available in the app
        Alert.alert(
          'Emergency Information Found',
          `Found emergency information for ${emergencyData.name}. Would you like to view the full profile or just the emergency summary?`,
          [
            {
              text: 'Emergency Only',
              onPress: () => navigateToEmergencyInfo(emergencyData),
            },
            {
              text: 'Full Profile',
              onPress: () => navigateToFullProfile(emergencyData.profileId!),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setScanResult(null),
            },
          ]
        );
      } else {
        // QR code contains only emergency information (offline mode)
        navigateToEmergencyInfo(emergencyData);
      }
    } else {
      // Could not parse as emergency QR data
      Alert.alert(
        'QR Code Scanned',
        'This QR code does not contain LifeTag emergency information. The raw data has been copied for your reference.',
        [
          { text: 'Scan Another', onPress: () => setScanResult(null) },
          { text: 'Close', onPress: handleClose },
        ]
      );
    }
  };

  const navigateToEmergencyInfo = (emergencyData: EmergencyQRData) => {
    // Navigate to emergency info display screen
    navigation.navigate('EmergencyInfoScreen', {
      emergencyData,
      scannedBy: user?.id,
      medicalProfessionalAccess: user?.userType === 'medical_professional' && user?.isVerified,
    });
  };

  const navigateToFullProfile = (profileId: string) => {
    // Navigate to full profile display (medical professional access)
    if (user?.userType === 'medical_professional' && user?.isVerified) {
      navigation.navigate('ProfileDisplay', {
        profileId,
        accessType: 'medical_professional',
        scannedBy: user.id,
      });
    } else {
      // Regular users get emergency info only
      Alert.alert(
        'Access Limited',
        'Full profile access requires verified medical professional credentials. Showing emergency information only.',
        [{ text: 'OK', onPress: () => setScanResult(null) }]
      );
    }
  };

  const handleError = (error: string) => {
    Alert.alert(
      'Scanner Error',
      error,
      [
        { text: 'Retry', onPress: () => setScanResult(null) },
        { text: 'Close', onPress: handleClose },
      ]
    );
  };

  const handleClose = () => {
    if (returnTo) {
      navigation.navigate(returnTo);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {medicalProfessionalMode ? 'Medical Scanner' : 'Scan QR Code'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {user?.userType === 'medical_professional' && user?.isVerified && (
        <View style={styles.professionalBanner}>
          <Ionicons name="medical" size={20} color="#4CAF50" />
          <Text style={styles.professionalText}>Verified Medical Professional Access</Text>
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>
          {medicalProfessionalMode 
            ? 'Scan Emergency QR Code' 
            : 'Point camera at LifeTag QR code'}
        </Text>
        <Text style={styles.instructionsText}>
          {medicalProfessionalMode
            ? 'As a verified medical professional, you can access full emergency profiles when available.'
            : 'Scanning will display emergency medical information including allergies, blood type, and emergency contacts.'}
        </Text>
      </View>

      <QRScanner
        onQRScanned={handleQRScanned}
        onError={handleError}
        onClose={handleClose}
      />

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Ionicons name="shield-checkmark" size={16} color="#666" />
          <Text style={styles.footerText}>
            Scan results are logged for security and audit purposes
          </Text>
        </View>
        
        {user?.userType === 'medical_professional' && user?.isVerified && (
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => navigation.navigate('ProfileAccessHistoryScreen')}
          >
            <Ionicons name="time" size={16} color="#2196F3" />
            <Text style={styles.historyButtonText}>View Scan History</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Same width as close button to center title
  },
  
  professionalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  professionalText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  instructionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  historyButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default QRScannerScreen;