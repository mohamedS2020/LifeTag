import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, AuditLog } from '../../types';
import { profileService, passwordService, MedicalProfessionalAccessService } from '../../services';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { PasswordVerificationModal } from '../common/PasswordVerificationModal';
import { VerifiedProfessionalIndicator } from '../common/VerifiedBadge';
import { useAuth } from '../../context/AuthContext';

interface ProfileDisplayProps {
  userId: string;
  profile?: UserProfile;
  showEditButton?: boolean;
  showPasswordProtection?: boolean;
  onEdit?: () => void;
  onError?: (error: string) => void;
}

// Helper function to safely format dates from Firestore
const formatFirestoreDate = (date: any): string => {
  if (!date) return 'Not provided';
  
  try {
    console.log('🗓️ ProfileDisplay: Formatting date:', date, 'Type:', typeof date, 'Keys:', Object.keys(date || {}));
    
    // Check if it's an empty object
    if (typeof date === 'object' && Object.keys(date).length === 0) {
      console.log('❌ ProfileDisplay: Empty object detected');
      return 'Date not set';
    }
    
    // If it's already a Date object and valid
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
    
    // If it's a Firestore timestamp object with seconds
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    
    // If it's a Firestore timestamp with toDate method
    if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    
    // If it's a string, try to parse it
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : 'Invalid date';
    }
    
    // If it's an object with _seconds property
    if (typeof date === 'object' && '_seconds' in date) {
      return new Date(date._seconds * 1000).toLocaleDateString();
    }
    
    console.log('🗓️ ProfileDisplay: Unknown date format:', date, 'Type:', typeof date);
    return 'Invalid date format';
  } catch (error) {
    console.error('❌ ProfileDisplay: Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * ProfileDisplay Component
 * Displays user profile information in a read-only format
 * Integrates with password protection system for sensitive data
 */
export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  userId,
  profile: initialProfile,
  showEditButton = true,
  showPasswordProtection = true,
  onEdit,
  onError,
}) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPasswordAccess, setHasPasswordAccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accessTimeRemaining, setAccessTimeRemaining] = useState<number | null>(null);
  
  // Medical professional access state
  const [hasMedicalProfessionalAccess, setHasMedicalProfessionalAccess] = useState(false);
  const [medicalProfessionalData, setMedicalProfessionalData] = useState<any>(null);
  const [accessType, setAccessType] = useState<string | null>(null);

  // =============================================
  // INITIALIZATION & DATA LOADING
  // =============================================

  useEffect(() => {
    if (!initialProfile) {
      loadProfile();
    }
    checkAccess();
  }, [userId, initialProfile, currentUser]);

  // Check access status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkAccess();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const loadProfile = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await profileService.getProfile(userId);
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        const errorMessage = response.error?.message || 'Failed to load profile';
        onError?.(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('Profile loading error:', error);
      const errorMessage = 'An unexpected error occurred while loading the profile';
      onError?.(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Log full profile access for audit purposes
   */
  const logFullProfileAccess = async (accessMethod: string) => {
    try {
      if (!currentUser || !profile) return;

      const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        profileId: profile.id,
        accessedBy: currentUser.id,
        accessorType: currentUser.userType === 'medical_professional' ? 'medical_professional' : 'individual',
        accessType: 'full_profile', // Key distinction: full profile access
        accessMethod: 'app_interface',
        fieldsAccessed: ['personalInfo', 'medicalInfo', 'emergencyContacts', 'privacySettings'], // All profile fields
        dataModified: false,
        deviceInfo: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
        notes: `Full profile access granted via ${accessMethod}`
      };

      const result = await profileService.logProfileAccess(profile.id, auditLog);
      if (!result.success) {
        console.error('Failed to log full profile access:', result.error);
      }
    } catch (error) {
      console.error('Full profile access logging error:', error);
    }
  };

  const checkAccess = async () => {
    if (!showPasswordProtection || !profile) {
      setHasPasswordAccess(true);
      setHasMedicalProfessionalAccess(false);
      return;
    }

    try {
      // First check for medical professional privileged access
      const accessResult = await MedicalProfessionalAccessService.canAccessProfile(
        currentUser,
        userId,
        {
          allowMedicalProfessionalAccess: profile.privacySettings.allowMedicalProfessionalAccess,
          requirePasswordForFullAccess: profile.privacySettings.requirePasswordForFullAccess
        }
      );

      if (accessResult.canAccess && accessResult.bypassPassword) {
        // Medical professional has privileged access
        setHasMedicalProfessionalAccess(true);
        setHasPasswordAccess(true);
        setMedicalProfessionalData(accessResult.professionalData);
        setAccessType(accessResult.accessType || 'medical_professional_privileged');
        
        // Log the access for audit trail
        if (accessResult.professionalData && profile.personalInfo) {
          const accessLog = MedicalProfessionalAccessService.createAccessLog(
            accessResult.professionalData,
            userId,
            `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
            accessResult.accessType
          );
          await MedicalProfessionalAccessService.logProfileAccess(accessLog);
        }
        
        // Log full profile access via medical professional privilege
        await logFullProfileAccess('medical_professional_privilege');
        
        setAccessTimeRemaining(null); // No time limit for medical professional access
        return;
      } else {
        setHasMedicalProfessionalAccess(false);
        setMedicalProfessionalData(null);
        setAccessType(null);
      }

      // Fall back to regular password access check
      if (!profile.privacySettings.requirePasswordForFullAccess) {
        setHasPasswordAccess(true);
        
        // Log full profile access (no password required)
        await logFullProfileAccess('no_password_required');
        return;
      }

      const hasAccess = await passwordService.hasValidTempAccess();
      const timeRemaining = await passwordService.getRemainingAccessTime();
      
      setHasPasswordAccess(hasAccess);
      setAccessTimeRemaining(timeRemaining);

      // Log full profile access if password access is valid
      if (hasAccess) {
        await logFullProfileAccess('password_verified');
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasPasswordAccess(false);
      setHasMedicalProfessionalAccess(false);
      setMedicalProfessionalData(null);
      setAccessType(null);
    }
  };

  const handlePasswordVerified = async () => {
    setShowPasswordModal(false);
    await checkAccess();
  };

  const handleRefresh = () => {
    loadProfile(true);
  };

  // =============================================
  // RENDER HELPERS
  // =============================================

  const formatAddress = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const formatMedicalConditions = (conditions: any[]): string => {
    if (!conditions?.length) return '';
    return conditions
      .filter(condition => condition.isActive !== false)
      .map(condition => condition.name || condition)
      .join(', ');
  };

  const formatMedications = (medications: any[]): string => {
    if (!medications?.length) return '';
    return medications
      .map(med => med.name || med)
      .join(', ');
  };

  const formatHealthcareProvider = (provider: any): string => {
    if (!provider) return '';
    if (typeof provider === 'string') return provider;
    
    const parts = [provider.name];
    if (provider.specialty) parts.push(`(${provider.specialty})`);
    return parts.join(' ');
  };

  const renderPersonalInfo = () => {
    if (!profile?.personalInfo) return null;

    const { personalInfo } = profile;
    const visibleFields = profile.privacySettings?.visibleFields?.personalInfo;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color="#4ECDC4" />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>

        <View style={styles.sectionContent}>
          {visibleFields?.name !== false && (personalInfo.firstName || personalInfo.lastName) && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>
                {`${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}
              </Text>
            </View>
          )}

          {visibleFields?.dateOfBirth !== false && personalInfo.dateOfBirth && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date of Birth</Text>
              <Text style={styles.value}>
                {formatFirestoreDate(personalInfo.dateOfBirth)}
              </Text>
            </View>
          )}

          {visibleFields?.gender !== false && personalInfo.gender && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.value}>{personalInfo.gender}</Text>
            </View>
          )}

          {visibleFields?.phoneNumber !== false && personalInfo.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.value}>{personalInfo.phoneNumber}</Text>
            </View>
          )}

          {visibleFields?.address !== false && personalInfo.address && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{formatAddress(personalInfo.address)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMedicalInfo = () => {
    if (!profile?.medicalInfo) return null;

    const { medicalInfo } = profile;
    const visibleFields = profile.privacySettings?.visibleFields?.medicalInfo;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medical" size={20} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>Medical Information</Text>
        </View>

        <View style={styles.sectionContent}>
          {visibleFields?.bloodType !== false && medicalInfo.bloodType && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Blood Type</Text>
              <Text style={[styles.value, styles.criticalValue]}>{medicalInfo.bloodType}</Text>
            </View>
          )}

          {medicalInfo.height && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Height</Text>
              <Text style={styles.value}>{medicalInfo.height}</Text>
            </View>
          )}

          {medicalInfo.weight && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Weight</Text>
              <Text style={styles.value}>{medicalInfo.weight}</Text>
            </View>
          )}

          {visibleFields?.allergies !== false && medicalInfo.allergies && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Allergies</Text>
              <Text style={[styles.value, styles.criticalValue]}>{formatMedicalConditions(medicalInfo.allergies)}</Text>
            </View>
          )}

          {visibleFields?.medications !== false && medicalInfo.medications && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Current Medications</Text>
              <Text style={styles.value}>{formatMedications(medicalInfo.medications)}</Text>
            </View>
          )}

          {visibleFields?.medicalConditions !== false && medicalInfo.medicalConditions && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Medical Conditions</Text>
              <Text style={styles.value}>{formatMedicalConditions(medicalInfo.medicalConditions)}</Text>
            </View>
          )}

          {visibleFields?.emergencyMedicalInfo !== false && medicalInfo.emergencyMedicalInfo && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Emergency Medical Information</Text>
              <Text style={[styles.value, styles.criticalValue]}>
                {medicalInfo.emergencyMedicalInfo}
              </Text>
            </View>
          )}

          {medicalInfo.bloodDonorStatus !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Blood Donor</Text>
              <Text style={styles.value}>{medicalInfo.bloodDonorStatus ? 'Yes' : 'No'}</Text>
            </View>
          )}

          {medicalInfo.organDonorStatus !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Organ Donor</Text>
              <Text style={styles.value}>{medicalInfo.organDonorStatus ? 'Yes' : 'No'}</Text>
            </View>
          )}

          {visibleFields?.primaryPhysician !== false && medicalInfo.primaryPhysician && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Primary Physician</Text>
              <Text style={styles.value}>{formatHealthcareProvider(medicalInfo.primaryPhysician)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmergencyContacts = () => {
    if (!profile?.emergencyContacts?.length) return null;

    const visibleContacts = profile.privacySettings?.visibleFields?.emergencyContacts !== false;
    if (!visibleContacts) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="call" size={20} color="#FFE66D" />
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        </View>

        <View style={styles.sectionContent}>
          {profile.emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                  </View>
                )}
              </View>

              <View style={styles.contactDetails}>
                <View style={styles.contactRow}>
                  <Ionicons name="call" size={16} color="#666" />
                  <Text style={styles.contactInfo}>{contact.phoneNumber}</Text>
                </View>

                {contact.email && (
                  <View style={styles.contactRow}>
                    <Ionicons name="mail" size={16} color="#666" />
                    <Text style={styles.contactInfo}>{contact.email}</Text>
                  </View>
                )}

                {contact.relationship && (
                  <View style={styles.contactRow}>
                    <Ionicons name="people" size={16} color="#666" />
                    <Text style={styles.contactInfo}>{contact.relationship}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPrivacyStatus = () => {
    if (!profile?.privacySettings) return null;

    const { privacySettings } = profile;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={20} color="#9C88FF" />
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Emergency Access</Text>
            <View style={[styles.statusBadge, privacySettings.allowEmergencyAccess ? styles.enabledBadge : styles.disabledBadge]}>
              <Text style={styles.statusText}>
                {privacySettings.allowEmergencyAccess ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Medical Professional Access</Text>
            <View style={[styles.statusBadge, privacySettings.allowMedicalProfessionalAccess ? styles.enabledBadge : styles.disabledBadge]}>
              <Text style={styles.statusText}>
                {privacySettings.allowMedicalProfessionalAccess ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Password Protection</Text>
            <View style={[styles.statusBadge, privacySettings.requirePasswordForFullAccess ? styles.enabledBadge : styles.disabledBadge]}>
              <Text style={styles.statusText}>
                {privacySettings.requirePasswordForFullAccess ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          {accessTimeRemaining && (
            <View style={styles.accessTimeRow}>
              <Ionicons name="time" size={16} color="#4ECDC4" />
              <Text style={styles.accessTimeText}>
                Full access expires in {accessTimeRemaining} minutes
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPasswordProtectionScreen = () => (
    <View style={styles.passwordProtectionContainer}>
      <View style={styles.lockIconContainer}>
        <Ionicons name="lock-closed" size={64} color="#FF6B6B" />
      </View>
      
      <Text style={styles.protectionTitle}>Profile Protected</Text>
      <Text style={styles.protectionMessage}>
        This profile requires password verification to view sensitive medical information.
      </Text>

      <TouchableOpacity
        style={styles.unlockButton}
        onPress={() => setShowPasswordModal(true)}
      >
        <Ionicons name="lock-open" size={20} color="white" />
        <Text style={styles.unlockButtonText}>Enter Password</Text>
      </TouchableOpacity>

      {/* Show basic emergency info even when locked */}
      {profile?.medicalInfo.bloodType && (
        <View style={styles.emergencyInfoCard}>
          <Text style={styles.emergencyInfoTitle}>Emergency Information</Text>
          <Text style={styles.emergencyInfoText}>
            Blood Type: {profile.medicalInfo.bloodType}
          </Text>
          {profile.medicalInfo.allergies && profile.medicalInfo.allergies.length > 0 && (
            <Text style={styles.emergencyInfoText}>
              Allergies: {formatMedicalConditions(profile.medicalInfo.allergies)}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // =============================================
  // MAIN RENDER
  // =============================================

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading profile..." />;
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <Text style={styles.errorMessage}>
          Unable to load profile information. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadProfile()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show password protection screen if needed
  const needsPasswordAccess = showPasswordProtection && 
    profile.privacySettings?.requirePasswordForFullAccess && 
    !hasPasswordAccess;

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isLoading} />
      <PasswordVerificationModal
        visible={showPasswordModal}
        onVerified={handlePasswordVerified}
        onCancel={() => setShowPasswordModal(false)}
        profilePassword={profile.privacySettings?.profilePassword || ''}
        userFirstName={profile.personalInfo?.firstName}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.profileName}>
            {profile.personalInfo?.firstName && profile.personalInfo?.lastName
              ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`
              : 'User Profile'}
          </Text>
          <Text style={styles.lastUpdated}>
            Last updated: {profile.updatedAt?.toLocaleDateString() || 'Unknown'}
          </Text>
        </View>

        {showEditButton && onEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons name="create" size={20} color="white" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Medical Professional Access Indicator */}
      {hasMedicalProfessionalAccess && medicalProfessionalData && (
        <View style={styles.medicalAccessBanner}>
          <View style={styles.medicalAccessContent}>
            <VerifiedProfessionalIndicator 
              isVerified={true}
              compact={true}
            />
            <View style={styles.medicalAccessText}>
              <Text style={styles.medicalAccessTitle}>
                Medical Professional Access
              </Text>
              <Text style={styles.medicalAccessSubtitle}>
                Accessed by: {MedicalProfessionalAccessService.formatProfessionalCredentials(medicalProfessionalData)}
              </Text>
            </View>
          </View>
          <Ionicons name="shield-checkmark" size={20} color="#28A745" />
        </View>
      )}

      {/* Content */}
      {!needsPasswordAccess ? (
        <>
          {renderPersonalInfo()}
          {renderMedicalInfo()}
          {renderEmergencyContacts()}
          {renderPrivacyStatus()}
        </>
      ) : (
        renderPasswordProtectionScreen()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    paddingBottom: 20,
    minHeight: '100%',
  },
  accessBanner: {
    padding: 15,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  bannerIcon: {
    marginRight: 12,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  accessSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  criticalValue: {
    fontWeight: '600',
    color: '#FF6B6B',
  },
  contactCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFE66D',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  primaryBadge: {
    backgroundColor: '#FFE66D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B8860B',
  },
  contactDetails: {
    gap: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enabledBadge: {
    backgroundColor: '#d4edda',
  },
  disabledBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accessTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f8f7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  accessTimeText: {
    fontSize: 14,
    color: '#4ECDC4',
    marginLeft: 8,
    fontWeight: '500',
  },
  passwordProtectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockIconContainer: {
    marginBottom: 24,
  },
  protectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  protectionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 32,
  },
  unlockButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emergencyInfoCard: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  emergencyInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  emergencyInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Medical Professional Access Banner Styles
  medicalAccessBanner: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  medicalAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicalAccessText: {
    marginLeft: 12,
    flex: 1,
  },
  medicalAccessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28A745',
    marginBottom: 2,
  },
  medicalAccessSubtitle: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
});

export default ProfileDisplay;