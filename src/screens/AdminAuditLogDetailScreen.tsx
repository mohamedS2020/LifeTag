import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuditLog } from '../types';
import profileService from '../services/profileService';
import authService from '../services/authService';
import { MedicalProfessionalApprovalService } from '../services/medicalProfessionalApprovalService';
import { RootStackParamList } from '../navigation/AppNavigator';

interface RouteParams {
  logId: string;
  logData: AuditLog;
}

type AdminAuditLogDetailNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Admin Audit Log Detail Screen
 * Shows comprehensive details of a specific audit log
 */
const AdminAuditLogDetailScreen: React.FC = () => {
  const navigation = useNavigation<AdminAuditLogDetailNavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { logData } = route.params as RouteParams;
  
  const [accessorInfo, setAccessorInfo] = useState<{
    name: string;
    type: string;
    details: string;
  } | null>(null);
  const [profileInfo, setProfileInfo] = useState<{
    name: string;
    details: string;
  } | null>(null);

  /**
   * Fetch detailed information about the accessor and profile
   */
  const fetchDetailedInfo = async () => {
    try {
      // Fetch accessor information
      if (logData.accessedBy && logData.accessedBy !== 'anonymous') {
        if (logData.accessorType === 'medical_professional') {
          // Get medical professional info
          const medProfs = await MedicalProfessionalApprovalService.getAllProfessionals();
          const medProf = medProfs.find((prof: any) => prof.userId === logData.accessedBy);
          if (medProf) {
            setAccessorInfo({
              name: `Dr. ${medProf.personalInfo.firstName} ${medProf.personalInfo.lastName}`,
              type: 'Medical Professional',
              details: `${medProf.professionalInfo.specialty || 'General'} • License: ${medProf.professionalInfo.licenseNumber}`
            });
          }
        } else {
          // Get regular user profile
          const userProfileResponse = await profileService.getProfileByUserId(logData.accessedBy);
          if (userProfileResponse.success && userProfileResponse.data) {
            const profile = userProfileResponse.data;
            setAccessorInfo({
              name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
              type: logData.accessorType === 'admin' ? 'Administrator' : 'Regular User',
              details: `User ID: ${logData.accessedBy.substring(0, 8)}...`
            });
          } else {
            // Fallback: try to get name from users collection (set during registration)
            const userBasicInfo = await authService.getUserBasicInfo(logData.accessedBy);
            if (userBasicInfo?.firstName || userBasicInfo?.lastName) {
              const name = `${userBasicInfo.firstName || ''} ${userBasicInfo.lastName || ''}`.trim();
              setAccessorInfo({
                name: name || `User (${logData.accessedBy.substring(0, 8)}...)`,
                type: logData.accessorType === 'admin' ? 'Administrator' : 'Regular User',
                details: 'No profile created yet'
              });
            } else {
              // Final fallback if no name found anywhere
              setAccessorInfo({
                name: `User (${logData.accessedBy.substring(0, 8)}...)`,
                type: logData.accessorType === 'admin' ? 'Administrator' : 'Regular User',
                details: 'No profile created yet'
              });
            }
          }
        }
      } else {
        setAccessorInfo({
          name: 'Anonymous User',
          type: 'Anonymous Access',
          details: 'No user identification available'
        });
      }

      // Fetch profile information
      const profileResponse = await profileService.getProfile(logData.profileId);
      if (profileResponse.success && profileResponse.data) {
        const profile = profileResponse.data;
        setProfileInfo({
          name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
          details: `Profile ID: ${logData.profileId}`
        });
      } else {
        setProfileInfo({
          name: 'Profile Not Found',
          details: `Profile ID: ${logData.profileId}`
        });
      }
    } catch (error) {
      console.error('Error fetching detailed info:', error);
    }
  };

  useEffect(() => {
    fetchDetailedInfo();
  }, [logData]);

  const formatFullTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getAccessTypeDetails = () => {
    switch (logData.accessType) {
      case 'qr_scan':
        return {
          title: 'QR Code Scan',
          description: 'User scanned QR code to access emergency information',
          icon: 'qr-code',
          color: '#007AFF'
        };
      case 'full_profile':
        return {
          title: 'Full Profile Access',
          description: 'Complete profile information was accessed',
          icon: 'person-outline',
          color: '#28A745'
        };
      case 'emergency_access':
        return {
          title: 'Emergency Access',
          description: 'Emergency medical information was accessed',
          icon: 'medical-outline',
          color: '#DC3545'
        };
      case 'profile_edit':
        return {
          title: 'Profile Modification',
          description: 'Profile data was modified or updated',
          icon: 'create-outline',
          color: '#FF9500'
        };
      default:
        return {
          title: 'Profile Access',
          description: 'Profile was accessed',
          icon: 'eye-outline',
          color: '#6C757D'
        };
    }
  };

  const accessTypeDetails = getAccessTypeDetails();

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Log Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Access Type Header */}
        <View style={styles.accessTypeHeader}>
          <View style={[styles.accessTypeIcon, { backgroundColor: `${accessTypeDetails.color}20` }]}>
            <Ionicons name={accessTypeDetails.icon as any} size={32} color={accessTypeDetails.color} />
          </View>
          <View style={styles.accessTypeInfo}>
            <Text style={styles.accessTypeTitle}>{accessTypeDetails.title}</Text>
            <Text style={styles.accessTypeDescription}>{accessTypeDetails.description}</Text>
          </View>
        </View>

        {/* Timestamp Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timestamp</Text>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={styles.infoText}>{formatFullTimestamp(logData.timestamp)}</Text>
          </View>
        </View>

        {/* Accessor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessed By</Text>
          <View style={styles.infoCard}>
            <Ionicons name="person-outline" size={20} color="#28A745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoMainText}>
                {accessorInfo?.name || 'Loading...'}
              </Text>
              <Text style={styles.infoSubText}>
                {accessorInfo?.type || ''}
              </Text>
              <Text style={styles.infoDetailsText}>
                {accessorInfo?.details || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Accessed</Text>
          <View style={styles.infoCard}>
            <Ionicons name="document-text-outline" size={20} color="#FF9500" />
            <View style={styles.infoContent}>
              <Text style={styles.infoMainText}>
                {profileInfo?.name || 'Loading...'}
              </Text>
              <Text style={styles.infoDetailsText}>
                {profileInfo?.details || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Access Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Access Method</Text>
          <View style={styles.infoCard}>
            <Ionicons 
              name={logData.accessMethod === 'qr_code' ? 'qr-code-outline' : 'phone-portrait-outline'} 
              size={20} 
              color="#6C757D" 
            />
            <Text style={styles.infoText}>
              {logData.accessMethod === 'qr_code' ? 'QR Code Scanner' : 'Mobile Application'}
            </Text>
          </View>
        </View>

        {/* Fields Accessed */}
        {logData.fieldsAccessed && logData.fieldsAccessed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fields Accessed</Text>
            <View style={styles.infoCard}>
              <Ionicons name="list-outline" size={20} color="#17A2B8" />
              <View style={styles.infoContent}>
                {logData.fieldsAccessed.map((field: string, index: number) => (
                  <Text key={index} style={styles.fieldItem}>
                    • {field}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Additional Notes */}
        {logData.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{logData.notes}</Text>
            </View>
          </View>
        )}

        {/* Technical Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Details</Text>
          <View style={styles.technicalCard}>
            <View style={styles.technicalRow}>
              <Text style={styles.technicalLabel}>Log ID:</Text>
              <Text style={styles.technicalValue}>{logData.id}</Text>
            </View>
            <View style={styles.technicalRow}>
              <Text style={styles.technicalLabel}>User ID:</Text>
              <Text style={styles.technicalValue}>{logData.accessedBy || 'Anonymous'}</Text>
            </View>
            <View style={styles.technicalRow}>
              <Text style={styles.technicalLabel}>Profile ID:</Text>
              <Text style={styles.technicalValue}>{logData.profileId}</Text>
            </View>
            <View style={styles.technicalRow}>
              <Text style={styles.technicalLabel}>Data Modified:</Text>
              <Text style={styles.technicalValue}>
                {logData.dataModified ? 'Yes' : 'No'}
              </Text>
            </View>
            {logData.sessionId && (
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>Session ID:</Text>
                <Text style={styles.technicalValue}>{logData.sessionId}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#DC3545',
    borderBottomWidth: 1,
    borderBottomColor: '#C82333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  accessTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accessTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accessTypeInfo: {
    flex: 1,
  },
  accessTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  accessTypeDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  infoMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  infoSubText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  infoDetailsText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  fieldItem: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 2,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#17A2B8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  technicalCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  technicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  technicalLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  technicalValue: {
    fontSize: 12,
    color: '#333333',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
});

export default AdminAuditLogDetailScreen;