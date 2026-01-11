import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { EmergencyQRData } from '../services/qrService';
import { profileService } from '../services';
import { useAuth } from '../context/AuthContext';
import { AuditLog } from '../types';
import { colors, spacing } from '../theme';

// Navigation type definitions
type RootStackParamList = {
  EmergencyInfoScreen: {
    emergencyData: EmergencyQRData;
    qrCodeString?: string;
    scannedBy?: string;
    medicalProfessionalAccess?: boolean;
  };
};

type EmergencyInfoScreenRouteProp = RouteProp<RootStackParamList, 'EmergencyInfoScreen'>;
type EmergencyInfoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EmergencyInfoScreen'>;

/**
 * Props for EmergencyInfoScreen component (legacy, now using navigation)
 */
interface EmergencyInfoScreenProps {
  emergencyData?: EmergencyQRData;
  qrCodeString?: string;
  onClose?: () => void;
  onCallEmergencyContact?: (phone: string) => void;
  onScanAnother?: () => void;
}

/**
 * EmergencyInfoScreen Component
 * 
 * Displays scanned emergency medical information in a first-responder optimized format
 * - Large, clear typography for emergency situations
 * - Quick access to emergency contact calling
 * - Color-coded critical information
 * - Optimized for high-stress emergency scenarios
 */
const EmergencyInfoScreen: React.FC = () => {
  // Navigation hooks
  const navigation = useNavigation<any>();
  const route = useRoute<EmergencyInfoScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  // Extract data from route params
  const { emergencyData, qrCodeString, scannedBy, medicalProfessionalAccess } = route.params;
  
  // Auth context for audit logging
  const { user } = useAuth();

  /**
   * Log emergency-only access when component mounts
   */
  useEffect(() => {
    const logEmergencyAccess = async () => {
      try {
        if (!user) {
          console.log('No authenticated user for emergency access logging');
          return;
        }

        const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
          profileId: emergencyData.profileId || 'unknown_emergency_qr',
          accessedBy: user.id,
          accessorType:
            user.userType === 'admin'
              ? 'admin'
              : user.userType === 'medical_professional'
                ? 'medical_professional'
                : 'individual',
          accessType: 'emergency_access', // Key distinction: emergency-only access
          accessMethod: 'qr_code',
          fieldsAccessed: ['name', 'bloodType', 'allergies', 'emergencyContact'], // Only emergency fields
          dataModified: false,
          deviceInfo: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
          notes: `Emergency QR access - Emergency data only (not full profile)`
        };

        const result = await profileService.logProfileAccess(
          emergencyData.profileId || 'unknown_emergency_qr', 
          auditLog
        );
        
        if (!result.success) {
          console.error('Failed to log emergency access:', result.error);
        }
      } catch (error) {
        console.error('Emergency access logging error:', error);
      }
    };

    logEmergencyAccess();
  }, [emergencyData.profileId, user]);

  /**
   * Handle full profile access
   */
  const handleFullProfileAccess = () => {
    if (!emergencyData.profileId) {
      Alert.alert('Error', 'Profile ID not available');
      return;
    }

    // Navigate to ProfileDisplay with correct parameters
    // The ProfileDisplay screen will handle access control based on current user's type
    navigation.navigate('ProfileDisplay', {
      profileId: emergencyData.profileId,
      isViewingOtherProfile: true
    });
  };

  /**
   * Handle emergency contact call
   */
  const handleCallEmergencyContact = () => {
    if (!emergencyData.emergencyContact?.phone) {
      Alert.alert('No Phone Number', 'No emergency contact phone number is available.');
      return;
    }

    const phoneNumber = emergencyData.emergencyContact.phone;
    
    Alert.alert(
      'Call Emergency Contact',
      `Call ${emergencyData.emergencyContact.name} at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          style: 'default',
          onPress: () => {
            const phoneUrl = `tel:${phoneNumber}`;
            Linking.openURL(phoneUrl).catch((err) => {
              console.error('Failed to open phone dialer:', err);
              Alert.alert('Error', 'Could not open phone dialer');
            });
          }
        }
      ]
    );
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  /**
   * Get severity color for allergies
   */
  const getAllergyColor = (allergy: string): string => {
    const severity = allergy.toLowerCase();
    if (severity.includes('severe') || severity.includes('anaphylaxis')) {
      return colors.status.error.main; // Red for severe
    }
    if (severity.includes('moderate')) {
      return colors.status.warning.main; // Orange for moderate
    }
    return colors.status.warning.main; // Yellow for general allergies
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Medical Info</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="qr-code" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Patient Name - Most Prominent */}
        <View style={styles.patientNameSection}>
          <Text style={styles.patientNameLabel}>PATIENT</Text>
          <Text style={styles.patientName}>{emergencyData.name}</Text>
          {emergencyData.timestamp && (
            <Text style={styles.lastUpdated}>
              Last Updated: {formatTimestamp(emergencyData.timestamp)}
            </Text>
          )}
        </View>

        {/* Critical Information Grid */}
        <View style={styles.criticalInfoGrid}>
          {/* Blood Type */}
          <View style={[styles.criticalCard, styles.bloodTypeCard]}>
            <Ionicons name="water" size={24} color={colors.primary.main} />
            <Text style={styles.criticalLabel}>BLOOD TYPE</Text>
            <Text style={styles.criticalValue}>
              {emergencyData.bloodType || 'UNKNOWN'}
            </Text>
          </View>

          {/* Emergency Contact */}
          {emergencyData.emergencyContact && (
            <TouchableOpacity 
              style={[styles.criticalCard, styles.emergencyContactCard]}
              onPress={handleCallEmergencyContact}
            >
              <Ionicons name="call" size={24} color={colors.status.warning.main} />
              <Text style={styles.criticalLabel}>EMERGENCY CONTACT</Text>
              <Text style={styles.criticalValue}>
                {emergencyData.emergencyContact.name}
              </Text>
              <Text style={styles.contactPhone}>
                {emergencyData.emergencyContact.phone}
              </Text>
              <Text style={styles.contactRelation}>
                {emergencyData.emergencyContact.relationship}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Allergies Section */}
        {emergencyData.allergies && emergencyData.allergies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color={colors.status.warning.main} />
              <Text style={styles.sectionTitle}>ALLERGIES & REACTIONS</Text>
            </View>
            <View style={styles.allergiesList}>
              {emergencyData.allergies.map((allergy, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.allergyItem,
                    { borderLeftColor: getAllergyColor(allergy) }
                  ]}
                >
                  <Text style={styles.allergyText}>{allergy}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Emergency Notes */}
        {emergencyData.emergencyNote && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={colors.primary.main} />
              <Text style={styles.sectionTitle}>EMERGENCY NOTES</Text>
            </View>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{emergencyData.emergencyNote}</Text>
            </View>
          </View>
        )}

        {/* Additional Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={colors.status.info.main} />
            <Text style={styles.sectionTitle}>ADDITIONAL INFO</Text>
          </View>
          <View style={styles.additionalInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Profile Version:</Text>
              <Text style={styles.infoValue}>{emergencyData.version}</Text>
            </View>
            {emergencyData.hasFullProfile && (
              <View style={styles.infoRow}>
                <Ionicons name="phone-portrait" size={16} color={colors.status.warning.main} />
                <Text style={styles.fullProfileText}>
                  Full medical profile available in LifeTag app
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons - Inside ScrollView */}
        <View style={styles.actionButtons}>
          {/* Full Profile Button - Show if profileId exists */}
          {emergencyData.profileId && (
            <TouchableOpacity
              style={styles.fullProfileButton}
              onPress={handleFullProfileAccess}
            >
              <Ionicons name="person" size={20} color="white" />
              <Text style={styles.fullProfileButtonText}>
                {user?.userType === 'medical_professional' && user?.isVerified 
                  ? 'View Full Profile' 
                  : 'Full Profile'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Emergency Call Button */}
          {emergencyData.emergencyContact && (
            <TouchableOpacity
              style={styles.emergencyCallButton}
              onPress={handleCallEmergencyContact}
            >
              <Ionicons name="call" size={20} color="white" />
              <Text style={styles.emergencyCallText}>
                Call {emergencyData.emergencyContact.name}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Secondary Buttons */}
          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Ionicons name="qr-code" size={18} color={colors.text.secondary} />
              <Text style={styles.secondaryButtonText}>Scan Another</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={18} color={colors.text.secondary} />
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Styles for EmergencyInfoScreen component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.medical.emergency,
    borderBottomWidth: 2,
    borderBottomColor: colors.status.error.main,
  },
  headerButton: {
    padding: spacing.xs,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  patientNameSection: {
    backgroundColor: colors.background.elevated,
    padding: spacing.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.medical.emergency,
  },
  patientNameLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  patientName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  criticalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  criticalCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  bloodTypeCard: {
    borderTopWidth: 3,
    borderTopColor: colors.medical.emergency,
  },
  emergencyContactCard: {
    borderTopWidth: 3,
    borderTopColor: colors.medical.verified,
  },
  criticalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
    textAlign: 'center',
  },
  criticalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  contactPhone: {
    fontSize: 14,
    color: colors.status.warning.main,
    fontWeight: '600',
    marginTop: spacing.xxs,
  },
  contactRelation: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: spacing.sm,
    letterSpacing: 0.5,
  },
  allergiesList: {
    gap: spacing.sm,
  },
  allergyItem: {
    backgroundColor: `${colors.status.warning.main}20`,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
  },
  allergyText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: `${colors.primary.main}15`,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  notesText: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 22,
  },
  additionalInfoContainer: {
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  fullProfileText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  actionButtons: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  fullProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.sm,
  },
  fullProfileButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  emergencyCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.warning.main,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.sm,
  },
  emergencyCallText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
});

export default EmergencyInfoScreen;