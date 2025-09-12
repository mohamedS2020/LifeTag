import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmergencyQRData } from '../services/qrService';

/**
 * Props for EmergencyInfoScreen component
 */
interface EmergencyInfoScreenProps {
  emergencyData: EmergencyQRData;
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
const EmergencyInfoScreen: React.FC<EmergencyInfoScreenProps> = ({
  emergencyData,
  qrCodeString,
  onClose,
  onCallEmergencyContact,
  onScanAnother,
}) => {

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
            if (onCallEmergencyContact) {
              onCallEmergencyContact(phoneNumber);
            } else {
              const phoneUrl = `tel:${phoneNumber}`;
              Linking.openURL(phoneUrl).catch((err) => {
                console.error('Failed to open phone dialer:', err);
                Alert.alert('Error', 'Could not open phone dialer');
              });
            }
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
      return '#FF0000'; // Red for severe
    }
    if (severity.includes('moderate')) {
      return '#FF8C00'; // Orange for moderate
    }
    return '#FFA500'; // Yellow for general allergies
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Medical Info</Text>
        <TouchableOpacity onPress={onScanAnother} style={styles.headerButton}>
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
            <Ionicons name="water" size={24} color="#FF6B6B" />
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
              <Ionicons name="call" size={24} color="#4CAF50" />
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
              <Ionicons name="warning" size={20} color="#FF8C00" />
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
              <Ionicons name="document-text" size={20} color="#2196F3" />
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
            <Ionicons name="information-circle" size={20} color="#9C27B0" />
            <Text style={styles.sectionTitle}>ADDITIONAL INFO</Text>
          </View>
          <View style={styles.additionalInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Profile Version:</Text>
              <Text style={styles.infoValue}>{emergencyData.version}</Text>
            </View>
            {emergencyData.hasFullProfile && (
              <View style={styles.infoRow}>
                <Ionicons name="phone-portrait" size={16} color="#4CAF50" />
                <Text style={styles.fullProfileText}>
                  Full medical profile available in LifeTag app
                </Text>
              </View>
            )}
            {emergencyData.profileId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Profile ID:</Text>
                <Text style={styles.infoValue}>{emergencyData.profileId}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
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
        
        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onScanAnother}>
            <Ionicons name="qr-code" size={18} color="#666666" />
            <Text style={styles.secondaryButtonText}>Scan Another</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Ionicons name="close" size={18} color="#666666" />
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

/**
 * Styles for EmergencyInfoScreen component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FF6B6B',
    borderBottomWidth: 2,
    borderBottomColor: '#E53E3E',
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for action buttons
  },
  patientNameSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  patientNameLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
    letterSpacing: 1,
    marginBottom: 5,
  },
  patientName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999999',
  },
  criticalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  criticalCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bloodTypeCard: {
    borderTopWidth: 3,
    borderTopColor: '#FF6B6B',
  },
  emergencyContactCard: {
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
  },
  criticalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  criticalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  contactPhone: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  contactRelation: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  allergiesList: {
    gap: 8,
  },
  allergyItem: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  allergyText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notesText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  additionalInfoContainer: {
    backgroundColor: '#F3E5F5',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  fullProfileText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 5,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  emergencyCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  emergencyCallText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
});

export default EmergencyInfoScreen;