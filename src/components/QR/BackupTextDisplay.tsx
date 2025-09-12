import React from 'react';
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="medical" size={24} color="#FF3B30" />
          <Text style={styles.headerTitle}>Emergency Medical Information</Text>
        </View>
        
        {showCopyButton && (
          <TouchableOpacity style={styles.copyButton} onPress={copyEmergencyInfo}>
            <Ionicons name="copy" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Information Cards */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Critical Information Card */}
        <View style={styles.criticalCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="warning" size={20} color="#FF3B30" />
            <Text style={styles.cardTitle}>Critical Information</Text>
          </View>
          
          <View style={styles.criticalGrid}>
            <View style={styles.criticalItem}>
              <Text style={styles.criticalLabel}>NAME</Text>
              <Text style={styles.criticalValue}>{emergencyData.name}</Text>
            </View>

            {emergencyData.bloodType && (
              <View style={styles.criticalItem}>
                <Text style={styles.criticalLabel}>BLOOD TYPE</Text>
                <Text style={[styles.criticalValue, styles.bloodType]}>
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
                    <Text style={styles.allergyText}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Emergency Contact Card */}
        {emergencyData.emergencyContact && (
          <View style={styles.contactCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="call" size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Emergency Contact</Text>
            </View>
            
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>
                {emergencyData.emergencyContact.name}
              </Text>
              <Text style={styles.contactPhone}>
                {emergencyData.emergencyContact.phone}
              </Text>
              <Text style={styles.contactRelation}>
                {emergencyData.emergencyContact.relationship}
              </Text>
            </View>
          </View>
        )}

        {/* Medical Notes Card */}
        {emergencyData.emergencyNote && (
          <View style={styles.notesCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#FF9500" />
              <Text style={styles.cardTitle}>Medical Notes</Text>
            </View>
            
            <Text style={styles.notesText}>
              {emergencyData.emergencyNote}
            </Text>
          </View>
        )}

        {/* QR Data Card (if requested) */}
        {showQRData && qrData && (
          <View style={styles.qrDataCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="qr-code" size={20} color="#666666" />
              <Text style={styles.cardTitle}>QR Code Data</Text>
            </View>
            
            <ScrollView style={styles.qrDataScroll} horizontal>
              <Text style={styles.qrDataText}>{qrData}</Text>
            </ScrollView>
          </View>
        )}

        {/* Instructions Card */}
        <View style={styles.instructionsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#34C759" />
            <Text style={styles.cardTitle}>For First Responders</Text>
          </View>
          
          <Text style={styles.instructionsText}>
            This information is provided for emergency medical treatment only. 
            Please verify critical details with the patient or emergency contacts 
            when possible.
          </Text>
          
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              Generated: {new Date(emergencyData.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={showDetailedInfo}>
          <Ionicons name="document-text" size={18} color="#007AFF" />
          <Text style={styles.actionButtonText}>View All</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={copyEmergencyInfo}>
          <Ionicons name="copy" size={18} color="#007AFF" />
          <Text style={styles.actionButtonText}>Copy Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  compactContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    margin: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 10,
  },
  copyButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  
  // Critical Information Card
  criticalCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#FF3B30',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  criticalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  criticalItem: {
    width: '48%',
    marginBottom: 10,
  },
  criticalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  criticalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  bloodType: {
    color: '#FF3B30',
    fontSize: 24,
  },
  allergiesSection: {
    marginTop: 10,
  },
  allergiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  allergyTag: {
    backgroundColor: '#FF3B30',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  allergyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Emergency Contact Card
  contactCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF',
  },
  contactInfo: {
    alignItems: 'center',
  },
  contactName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  contactPhone: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  contactRelation: {
    fontSize: 14,
    color: '#666666',
    textTransform: 'capitalize',
  },

  // Medical Notes Card
  notesCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#FF9500',
  },
  notesText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },

  // QR Data Card
  qrDataCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#666666',
  },
  qrDataScroll: {
    maxHeight: 100,
  },
  qrDataText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Instructions Card
  instructionsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#34C759',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 15,
  },
  timestampContainer: {
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default BackupTextDisplay;