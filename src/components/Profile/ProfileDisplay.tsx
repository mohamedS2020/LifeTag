import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../types';
import { profileService, passwordService } from '../../services';
import { LoadingOverlay, PasswordVerificationModal } from '../common';

interface ProfileDisplayProps {
  userId: string;
  profile?: UserProfile;
  showEditButton?: boolean;
  showPasswordProtection?: boolean;
  onEdit?: () => void;
  onError?: (error: string) => void;
}

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
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPasswordAccess, setHasPasswordAccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accessTimeRemaining, setAccessTimeRemaining] = useState<number | null>(null);

  // =============================================
  // INITIALIZATION & DATA LOADING
  // =============================================

  useEffect(() => {
    if (!initialProfile) {
      loadProfile();
    }
    checkPasswordAccess();
  }, [userId, initialProfile]);

  // Check password access status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkPasswordAccess();
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

  const checkPasswordAccess = async () => {
    if (!showPasswordProtection || !profile?.privacySettings.requirePasswordForFullAccess) {
      setHasPasswordAccess(true);
      return;
    }

    try {
      const hasAccess = await passwordService.hasValidTempAccess();
      const timeRemaining = await passwordService.getRemainingAccessTime();
      
      setHasPasswordAccess(hasAccess);
      setAccessTimeRemaining(timeRemaining);
    } catch (error) {
      console.error('Error checking password access:', error);
      setHasPasswordAccess(false);
    }
  };

  const handlePasswordVerified = async () => {
    setShowPasswordModal(false);
    await checkPasswordAccess();
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
                {personalInfo.dateOfBirth.toLocaleDateString()}
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
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

        {/* Content */}
        {needsPasswordAccess ? (
          renderPasswordProtectionScreen()
        ) : (
          <>
            {renderPersonalInfo()}
            {renderMedicalInfo()}
            {renderEmergencyContacts()}
            {renderPrivacyStatus()}
          </>
        )}
      </ScrollView>

      {/* Password Modal */}
      <PasswordVerificationModal
        visible={showPasswordModal}
        onVerified={handlePasswordVerified}
        onCancel={() => setShowPasswordModal(false)}
        profilePassword={profile.privacySettings?.profilePassword || ''}
        userFirstName={profile.personalInfo?.firstName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
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
});

export default ProfileDisplay;