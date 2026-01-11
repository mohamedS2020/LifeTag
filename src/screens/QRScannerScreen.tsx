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
import { colors, spacing } from '../theme';

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
    // Navigate to ProfileDisplay - same logic as EmergencyInfoScreen
    // The ProfileDisplay screen will handle access control and password prompts
    navigation.navigate('ProfileDisplay', {
      profileId,
      isViewingOtherProfile: true
    });
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
    <SafeAreaView style={styles.container} edges={[]}>
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {medicalProfessionalMode ? 'Medical Scanner' : 'Scan QR Code'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {user?.userType === 'medical_professional' && user?.isVerified && (
        <View style={styles.professionalBanner}>
          <Ionicons name="medical" size={20} color={colors.status.success.main} />
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
          <Ionicons name="shield-checkmark" size={16} color={colors.text.secondary} />
          <Text style={styles.footerText}>
            Scan results are logged for security and audit purposes
          </Text>
        </View>
        
        {user?.userType === 'medical_professional' && user?.isVerified && (
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => navigation.navigate('ProfileAccessHistoryScreen')}
          >
            <Ionicons name="time" size={16} color={colors.primary.main} />
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
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.background.elevated,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  
  professionalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.medical.verified}15`,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  professionalText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.medical.verified,
    fontWeight: '600',
  },
  
  instructionsContainer: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  footer: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  footerText: {
    marginLeft: spacing.sm,
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.md,
  },
  historyButtonText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
});

export default QRScannerScreen;