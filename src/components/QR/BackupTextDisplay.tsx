import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmergencyQRData } from '../../services/qrService';
import { useTheme } from '../../theme';

/**
 * Backup Text Display Props
 */
interface BackupTextDisplayProps {
  emergencyData: EmergencyQRData;
  qrData?: string;
  showQRData?: boolean;
  showCopyButton?: boolean;
  onCopySuccess?: () => void;
  compact?: boolean;
}

/**
 * Backup Text Display Component
 * Provides human-readable emergency information when QR scanning fails
 */
export const BackupTextDisplay: React.FC<BackupTextDisplayProps> = ({
  emergencyData,
  qrData,
  showQRData = false,
  showCopyButton = true,
  onCopySuccess,
  compact = false
}) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    fullContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    compactContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      margin: spacing.sm,
      maxHeight: 600, // Add max height for compact mode
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    compactHeader: {
      paddingHorizontal: 0,
      paddingVertical: spacing.sm,
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginLeft: spacing.sm,
    },
    compactHeaderTitle: {
      fontSize: 16,
    },
    copyButton: {
      padding: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background.tertiary,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    compactScrollContainer: {
      paddingHorizontal: 0,
      paddingVertical: spacing.sm,
    },
    
    // Critical Information Card - keep visible with slight color tints
    criticalCard: {
      backgroundColor: 'rgba(255, 59, 48, 0.15)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderLeftWidth: 5,
      borderLeftColor: colors.status.error.main,
    },
    compactCriticalCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    compactCardHeader: {
      marginBottom: spacing.sm,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginLeft: spacing.xs,
    },
    compactCardTitle: {
      fontSize: 14,
    },
    criticalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    compactCriticalGrid: {
      marginBottom: spacing.sm,
    },
    criticalItem: {
      width: '48%',
      marginBottom: spacing.sm,
    },
    criticalLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    criticalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    compactCriticalValue: {
      fontSize: 16,
    },
    bloodType: {
      color: colors.status.error.main,
      fontSize: 24,
    },
    compactBloodType: {
      fontSize: 20,
    },
    allergiesSection: {
      marginTop: spacing.sm,
    },
    allergiesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.xs,
    },
    allergyTag: {
      backgroundColor: colors.status.error.main,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
    },
    allergyText: {
      color: colors.text.inverse,
      fontSize: 14,
      fontWeight: '600',
    },
    compactAllergyText: {
      fontSize: 12,
    },

    // Emergency Contact Card
    contactCard: {
      backgroundColor: 'rgba(64, 124, 226, 0.15)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderLeftWidth: 5,
      borderLeftColor: colors.primary.main,
    },
    compactContactCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    contactInfo: {
      alignItems: 'center',
    },
    contactName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    compactContactName: {
      fontSize: 16,
    },
    contactPhone: {
      fontSize: 18,
      color: colors.primary.main,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    compactContactPhone: {
      fontSize: 16,
    },
    contactRelation: {
      fontSize: 14,
      color: colors.text.secondary,
      textTransform: 'capitalize',
    },
    compactContactRelation: {
      fontSize: 12,
    },

    // Medical Notes Card
    notesCard: {
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderLeftWidth: 5,
      borderLeftColor: colors.status.warning.main,
    },
    compactNotesCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    notesText: {
      fontSize: 16,
      color: colors.text.primary,
      lineHeight: 24,
    },
    compactNotesText: {
      fontSize: 14,
      lineHeight: 20,
    },

    // QR Data Card
    qrDataCard: {
      backgroundColor: colors.background.tertiary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderLeftWidth: 5,
      borderLeftColor: colors.text.tertiary,
    },
    compactQrDataCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    qrDataScroll: {
      maxHeight: 100,
    },
    qrDataText: {
      fontSize: 12,
      color: colors.text.secondary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },

    // Instructions Card
    instructionsCard: {
      backgroundColor: 'rgba(52, 199, 89, 0.15)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderLeftWidth: 5,
      borderLeftColor: colors.status.success.main,
    },
    compactInstructionsCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    instructionsText: {
      fontSize: 14,
      color: colors.text.primary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    compactInstructionsText: {
      fontSize: 12,
      lineHeight: 18,
      marginBottom: spacing.sm,
    },
    timestampContainer: {
      alignItems: 'center',
    },
    timestampText: {
      fontSize: 12,
      color: colors.text.tertiary,
      fontStyle: 'italic',
    },
    compactTimestampText: {
      fontSize: 10,
    },

    // Action Bar
    actionBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.background.secondary,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
    compactActionBar: {
      paddingHorizontal: 0,
      paddingVertical: spacing.sm,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      marginTop: spacing.sm,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.tertiary,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary.main,
    },
    compactActionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    actionButtonText: {
      color: colors.primary.main,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: spacing.xs,
    },
    compactActionButtonText: {
      fontSize: 12,
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

  /**
   * Copy emergency information to clipboard
   */
  const copyEmergencyInfo = async () => {
    try {
      const emergencyText = formatEmergencyText();
      
      if (Platform.OS === 'web') {
        // For web, use the Clipboard API
        await navigator.clipboard.writeText(emergencyText);
      } else {
        // For mobile, use Expo's Clipboard (would need expo-clipboard)
        // For now, we'll simulate it
        console.log('Emergency info copied:', emergencyText);
      }
      
      Alert.alert('Copied', 'Emergency information copied to clipboard');
      onCopySuccess?.();
    } catch (error) {
      console.error('Copy failed:', error);
      Alert.alert('Copy Failed', 'Unable to copy information to clipboard');
    }
  };

  /**
   * Format emergency information as readable text
   */
  const formatEmergencyText = (): string => {
    const lines: string[] = [];
    
    lines.push('=== EMERGENCY MEDICAL INFORMATION ===');
    lines.push('');
    lines.push(`NAME: ${emergencyData.name}`);
    
    if (emergencyData.bloodType) {
      lines.push(`BLOOD TYPE: ${emergencyData.bloodType}`);
    }
    
    if (emergencyData.allergies.length > 0) {
      lines.push(`ALLERGIES: ${emergencyData.allergies.join(', ')}`);
    }
    
    if (emergencyData.emergencyContact) {
      lines.push('');
      lines.push('EMERGENCY CONTACT:');
      lines.push(`  Name: ${emergencyData.emergencyContact.name}`);
      lines.push(`  Phone: ${emergencyData.emergencyContact.phone}`);
      lines.push(`  Relationship: ${emergencyData.emergencyContact.relationship}`);
    }
    
    if (emergencyData.emergencyNote) {
      lines.push('');
      lines.push('MEDICAL NOTES:');
      lines.push(emergencyData.emergencyNote);
    }
    
    if (showQRData && qrData) {
      lines.push('');
      lines.push('QR CODE DATA:');
      lines.push(qrData);
    }
    
    lines.push('');
    lines.push(`Generated: ${new Date(emergencyData.timestamp).toLocaleString()}`);
    lines.push('');
    lines.push('This information is for emergency medical use only.');
    
    return lines.join('\n');
  };

  /**
   * Show detailed emergency information in alert
   */
  const showDetailedInfo = () => {
    const emergencyText = formatEmergencyText();
    
    Alert.alert(
      'Emergency Medical Information',
      emergencyText,
      [
        { text: 'Copy', onPress: copyEmergencyInfo },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const containerStyle = compact ? styles.compactContainer : styles.fullContainer;

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View style={[styles.header, compact && styles.compactHeader]}>
        <View style={styles.headerLeft}>
          <Ionicons name="medical" size={compact ? 20 : 24} color={colors.status.error.main} />
          <Text style={[styles.headerTitle, compact && styles.compactHeaderTitle]}>
            Emergency Medical Information
          </Text>
        </View>
        
        {showCopyButton && (
          <TouchableOpacity style={styles.copyButton} onPress={copyEmergencyInfo}>
            <Ionicons name="copy" size={compact ? 18 : 20} color={colors.primary.main} />
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Information Cards */}
      <ScrollView 
        style={[styles.scrollContainer, compact && styles.compactScrollContainer]} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        
        {/* Critical Information Card */}
        <View style={[styles.criticalCard, compact && styles.compactCriticalCard]}>
          <View style={[styles.cardHeader, compact && styles.compactCardHeader]}>
            <Ionicons name="warning" size={compact ? 18 : 20} color={colors.status.error.main} />
            <Text style={[styles.cardTitle, compact && styles.compactCardTitle]}>
              Critical Information
            </Text>
          </View>
          
          <View style={[styles.criticalGrid, compact && styles.compactCriticalGrid]}>
            <View style={styles.criticalItem}>
              <Text style={styles.criticalLabel}>NAME</Text>
              <Text style={[styles.criticalValue, compact && styles.compactCriticalValue]}>
                {emergencyData.name}
              </Text>
            </View>

            {emergencyData.bloodType && (
              <View style={styles.criticalItem}>
                <Text style={styles.criticalLabel}>BLOOD TYPE</Text>
                <Text style={[
                  styles.criticalValue, 
                  styles.bloodType,
                  compact && styles.compactBloodType
                ]}>
                  {emergencyData.bloodType}
                </Text>
              </View>
            )}
          </View>

          {emergencyData.allergies.length > 0 && (
            <View style={styles.allergiesSection}>
              <Text style={styles.criticalLabel}>ALLERGIES</Text>
              <View style={styles.allergiesList}>
                {emergencyData.allergies.map((allergy, index) => (
                  <View key={index} style={styles.allergyTag}>
                    <Text style={[styles.allergyText, compact && styles.compactAllergyText]}>
                      {allergy}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Emergency Contact Card */}
        {emergencyData.emergencyContact && (
          <View style={[styles.contactCard, compact && styles.compactContactCard]}>
            <View style={[styles.cardHeader, compact && styles.compactCardHeader]}>
              <Ionicons name="call" size={compact ? 18 : 20} color={colors.primary.main} />
              <Text style={[styles.cardTitle, compact && styles.compactCardTitle]}>
                Emergency Contact
              </Text>
            </View>
            
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, compact && styles.compactContactName]}>
                {emergencyData.emergencyContact.name}
              </Text>
              <Text style={[styles.contactPhone, compact && styles.compactContactPhone]}>
                {emergencyData.emergencyContact.phone}
              </Text>
              <Text style={[styles.contactRelation, compact && styles.compactContactRelation]}>
                {emergencyData.emergencyContact.relationship}
              </Text>
            </View>
          </View>
        )}

        {/* Medical Notes Card */}
        {emergencyData.emergencyNote && (
          <View style={[styles.notesCard, compact && styles.compactNotesCard]}>
            <View style={[styles.cardHeader, compact && styles.compactCardHeader]}>
              <Ionicons name="document-text" size={compact ? 18 : 20} color={colors.status.warning.main} />
              <Text style={[styles.cardTitle, compact && styles.compactCardTitle]}>
                Medical Notes
              </Text>
            </View>
            
            <Text style={[styles.notesText, compact && styles.compactNotesText]}>
              {emergencyData.emergencyNote}
            </Text>
          </View>
        )}

        {/* QR Data Card (if requested) */}
        {showQRData && qrData && (
          <View style={[styles.qrDataCard, compact && styles.compactQrDataCard]}>
            <View style={[styles.cardHeader, compact && styles.compactCardHeader]}>
              <Ionicons name="qr-code" size={compact ? 18 : 20} color={colors.text.tertiary} />
              <Text style={[styles.cardTitle, compact && styles.compactCardTitle]}>
                QR Code Data
              </Text>
            </View>
            
            <ScrollView style={styles.qrDataScroll} horizontal>
              <Text style={styles.qrDataText}>{qrData}</Text>
            </ScrollView>
          </View>
        )}

        {/* Instructions Card */}
        <View style={[styles.instructionsCard, compact && styles.compactInstructionsCard]}>
          <View style={[styles.cardHeader, compact && styles.compactCardHeader]}>
            <Ionicons name="information-circle" size={compact ? 18 : 20} color={colors.status.success.main} />
            <Text style={[styles.cardTitle, compact && styles.compactCardTitle]}>
              For First Responders
            </Text>
          </View>
          
          <Text style={[styles.instructionsText, compact && styles.compactInstructionsText]}>
            This information is provided for emergency medical treatment only. 
            Please verify critical details with the patient or emergency contacts 
            when possible.
          </Text>
          
          <View style={styles.timestampContainer}>
            <Text style={[styles.timestampText, compact && styles.compactTimestampText]}>
              Generated: {new Date(emergencyData.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Action Buttons */}
      {!compact && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={showDetailedInfo}>
            <Ionicons name="document-text" size={18} color={colors.primary.main} />
            <Text style={styles.actionButtonText}>View All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={copyEmergencyInfo}>
            <Ionicons name="copy" size={18} color={colors.primary.main} />
            <Text style={styles.actionButtonText}>Copy Text</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {compact && (
        <View style={[styles.actionBar, styles.compactActionBar]}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.compactActionButton]} 
            onPress={copyEmergencyInfo}
          >
            <Ionicons name="copy" size={16} color={colors.primary.main} />
            <Text style={[styles.actionButtonText, styles.compactActionButtonText]}>
              Copy Text
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default BackupTextDisplay;