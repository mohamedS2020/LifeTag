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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { UserProfile, AuditLog } from '../../types';
import { profileService, passwordService, MedicalProfessionalAccessService } from '../../services';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { PasswordVerificationModal } from '../common/PasswordVerificationModal';
import { VerifiedProfessionalIndicator } from '../common/VerifiedBadge';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme';

interface ProfileDisplayProps {
  userId: string;
  profile?: UserProfile;
  showEditButton?: boolean;
  showPasswordProtection?: boolean;
  onEdit?: () => void;
  onError?: (error: string) => void;
}

// Helper function to safely format dates from Firestore
const formatFirestoreDate = (date: any, t: (key: string) => string): string => {
  if (!date) return t('common.notProvided');
  
  try {
    // If it's already a Date object and valid - CHECK THIS FIRST!
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
    
    // Check if it's an empty object (after checking for Date)
    if (typeof date === 'object' && Object.keys(date).length === 0) {
      return t('profile.dateNotSet');
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
      return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : t('profile.invalidDate');
    }
    
    // If it's an object with _seconds property
    if (typeof date === 'object' && '_seconds' in date) {
      return new Date(date._seconds * 1000).toLocaleDateString();
    }
    
    return t('profile.invalidDateFormat');
  } catch (error) {
    return t('profile.invalidDate');
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
  const { t } = useTranslation();
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
        const errorMessage = response.error?.message || t('profile.failedToLoadProfile');
        onError?.(errorMessage);
        Alert.alert(t('common.error'), errorMessage);
      }
    } catch (error: any) {
      console.error('Profile loading error:', error);
      const errorMessage = t('profile.unexpectedLoadError');
      onError?.(errorMessage);
      Alert.alert(t('common.error'), errorMessage);
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
        accessorType: currentUser.userType === 'admin' ? 'admin' : currentUser.userType === 'medical_professional' ? 'medical_professional' : 'individual',
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
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color={colors.status.info.main} />
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
        </View>

        <View style={styles.sectionContent}>
          {visibleFields?.name !== false && (personalInfo.firstName || personalInfo.lastName) && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.fullName')}</Text>
              <Text style={styles.value}>
                {`${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}
              </Text>
            </View>
          )}

          {visibleFields?.dateOfBirth !== false && personalInfo.dateOfBirth && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.dateOfBirth')}</Text>
              <Text style={styles.value}>
                {formatFirestoreDate(personalInfo.dateOfBirth, t)}
              </Text>
            </View>
          )}

          {visibleFields?.gender !== false && personalInfo.gender && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.gender')}</Text>
              <Text style={styles.value}>{personalInfo.gender}</Text>
            </View>
          )}

          {visibleFields?.phoneNumber !== false && personalInfo.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.phoneNumber')}</Text>
              <Text style={styles.value}>{personalInfo.phoneNumber}</Text>
            </View>
          )}

          {visibleFields?.address !== false && personalInfo.address && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.address')}</Text>
              <Text style={styles.value}>{formatAddress(personalInfo.address)}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderMedicalInfo = () => {
    if (!profile?.medicalInfo) return null;

    const { medicalInfo } = profile;
    const visibleFields = profile.privacySettings?.visibleFields?.medicalInfo;

    return (
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medical" size={20} color={colors.medical.emergency} />
          <Text style={styles.sectionTitle}>{t('profile.medicalInfo')}</Text>
        </View>

        <View style={styles.sectionContent}>
          {visibleFields?.bloodType !== false && medicalInfo.bloodType && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.bloodType')}</Text>
              <Text style={[styles.value, styles.criticalValue]}>{medicalInfo.bloodType}</Text>
            </View>
          )}

          {medicalInfo.height && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.height')}</Text>
              <Text style={styles.value}>{medicalInfo.height}</Text>
            </View>
          )}

          {medicalInfo.weight && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.weight')}</Text>
              <Text style={styles.value}>{medicalInfo.weight}</Text>
            </View>
          )}

          {visibleFields?.allergies !== false && medicalInfo.allergies && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.allergies')}</Text>
              <Text style={[styles.value, styles.criticalValue]}>{formatMedicalConditions(medicalInfo.allergies)}</Text>
            </View>
          )}

          {visibleFields?.medications !== false && medicalInfo.medications && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.currentMedications')}</Text>
              <Text style={styles.value}>{formatMedications(medicalInfo.medications)}</Text>
            </View>
          )}

          {visibleFields?.medicalConditions !== false && medicalInfo.medicalConditions && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.conditions')}</Text>
              <Text style={styles.value}>{formatMedicalConditions(medicalInfo.medicalConditions)}</Text>
            </View>
          )}

          {visibleFields?.emergencyMedicalInfo !== false && medicalInfo.emergencyMedicalInfo && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.emergencyMedicalInfo')}</Text>
              <Text style={[styles.value, styles.criticalValue]}>
                {medicalInfo.emergencyMedicalInfo}
              </Text>
            </View>
          )}

          {medicalInfo.bloodDonorStatus !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.bloodDonor')}</Text>
              <Text style={styles.value}>{medicalInfo.bloodDonorStatus ? t('common.yes') : t('common.no')}</Text>
            </View>
          )}

          {medicalInfo.organDonorStatus !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.organDonor')}</Text>
              <Text style={styles.value}>{medicalInfo.organDonorStatus ? t('common.yes') : t('common.no')}</Text>
            </View>
          )}

          {visibleFields?.primaryPhysician !== false && medicalInfo.primaryPhysician && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('profile.primaryPhysician')}</Text>
              <Text style={styles.value}>{formatHealthcareProvider(medicalInfo.primaryPhysician)}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderEmergencyContacts = () => {
    if (!profile?.emergencyContacts?.length) return null;

    const visibleContacts = profile.privacySettings?.visibleFields?.emergencyContacts !== false;
    if (!visibleContacts) return null;

    return (
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="call" size={20} color={colors.status.warning.main} />
          <Text style={styles.sectionTitle}>{t('profile.emergencyContacts')}</Text>
        </View>

        <View style={styles.sectionContent}>
          {profile.emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>{t('profile.primaryContact').toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.contactDetails}>
                <View style={styles.contactRow}>
                  <Ionicons name="call" size={16} color={colors.text.tertiary} />
                  <Text style={styles.contactInfo}>{contact.phoneNumber}</Text>
                </View>

                {contact.email && (
                  <View style={styles.contactRow}>
                    <Ionicons name="mail" size={16} color={colors.text.tertiary} />
                    <Text style={styles.contactInfo}>{contact.email}</Text>
                  </View>
                )}

                {contact.relationship && (
                  <View style={styles.contactRow}>
                    <Ionicons name="people" size={16} color={colors.text.tertiary} />
                    <Text style={styles.contactInfo}>{contact.relationship}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderPrivacyStatus = () => {
    if (!profile?.privacySettings) return null;

    const { privacySettings } = profile;

    return (
      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary.main} />
          <Text style={styles.sectionTitle}>{t('profile.privacySecurity')}</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>{t('profile.emergencyAccess')}</Text>
            <View style={[styles.statusBadge, privacySettings.allowEmergencyAccess ? styles.enabledBadge : styles.disabledBadge]}>
              <Text style={[styles.statusText, { color: privacySettings.allowEmergencyAccess ? colors.status.warning.main : colors.status.error.main }]}>
                {privacySettings.allowEmergencyAccess ? t('common.enabled') : t('common.disabled')}
              </Text>
            </View>
          </View>

          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>{t('profile.medicalProAccess')}</Text>
            <View style={[styles.statusBadge, privacySettings.allowMedicalProfessionalAccess ? styles.enabledBadge : styles.disabledBadge]}>
              <Text style={[styles.statusText, { color: privacySettings.allowMedicalProfessionalAccess ? colors.status.warning.main : colors.status.error.main }]}>
                {privacySettings.allowMedicalProfessionalAccess ? t('common.enabled') : t('common.disabled')}
              </Text>
            </View>
          </View>

          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>{t('profile.passwordProtection')}</Text>
            <View style={[styles.statusBadge, privacySettings.requirePasswordForFullAccess ? styles.enabledBadge : styles.disabledBadge]}>
              <Text style={[styles.statusText, { color: privacySettings.requirePasswordForFullAccess ? colors.status.warning.main : colors.status.error.main }]}>
                {privacySettings.requirePasswordForFullAccess ? t('common.enabled') : t('common.disabled')}
              </Text>
            </View>
          </View>

          {accessTimeRemaining && (
            <View style={styles.accessTimeRow}>
              <Ionicons name="time" size={16} color={colors.status.info.main} />
              <Text style={styles.accessTimeText}>
                {t('profile.accessExpiresIn', { minutes: accessTimeRemaining })}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderPasswordProtectionScreen = () => (
    <View style={styles.passwordProtectionContainer}>
      <View style={styles.lockIconContainer}>
        <Ionicons name="lock-closed" size={64} color={colors.medical.emergency} />
      </View>
      
      <Text style={styles.protectionTitle}>{t('profile.profileProtected')}</Text>
      <Text style={styles.protectionMessage}>
        {t('profile.passwordRequiredMessage')}
      </Text>

      <TouchableOpacity
        style={styles.unlockButton}
        onPress={() => setShowPasswordModal(true)}
      >
        <Ionicons name="lock-open" size={20} color="white" />
        <Text style={styles.unlockButtonText}>{t('profile.enterPassword')}</Text>
      </TouchableOpacity>

      {/* Show basic emergency info even when locked */}
      {profile?.medicalInfo.bloodType && (
        <View style={styles.emergencyInfoCard}>
          <Text style={styles.emergencyInfoTitle}>{t('emergency.title')}</Text>
          <Text style={styles.emergencyInfoText}>
            {t('profile.bloodType')}: {profile.medicalInfo.bloodType}
          </Text>
          {profile.medicalInfo.allergies && profile.medicalInfo.allergies.length > 0 && (
            <Text style={styles.emergencyInfoText}>
              {t('profile.allergies')}: {formatMedicalConditions(profile.medicalInfo.allergies)}
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
    return <LoadingOverlay visible={true} message={t('profile.loadingProfile')} />;
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.status.error.main} />
        <Text style={styles.errorTitle}>{t('profile.notFound')}</Text>
        <Text style={styles.errorMessage}>
          {t('profile.unableToLoadProfile')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadProfile()}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
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

      {/* Only show Profile Protected section if password is required */}
      {needsPasswordAccess ? (
        renderPasswordProtectionScreen()
      ) : (
        <>
          {/* ...existing code for header, banners, and profile sections... */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.profileName}>
                {profile.personalInfo?.firstName && profile.personalInfo?.lastName
                  ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`
                  : t('profile.userProfile')}
              </Text>
              <Text style={styles.lastUpdated}>
                {t('profile.lastUpdated')}: {profile.updatedAt?.toLocaleDateString() || t('common.unknown')}
              </Text>
            </View>

            {showEditButton && onEdit && (
              <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                <Ionicons name="create" size={20} color="white" />
                <Text style={styles.editButtonText}>{t('common.edit')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {hasMedicalProfessionalAccess && medicalProfessionalData && (
            <View style={styles.medicalAccessBanner}>
              <View style={styles.medicalAccessContent}>
                <VerifiedProfessionalIndicator 
                  isVerified={true}
                  compact={true}
                />
                <View style={styles.medicalAccessText}>
                  <Text style={styles.medicalAccessTitle}>
                    {t('profile.medicalProfessionalAccess')}
                  </Text>
                  <Text style={styles.medicalAccessSubtitle}>
                    {t('profile.accessedBy')}: {MedicalProfessionalAccessService.formatProfessionalCredentials(medicalProfessionalData)}
                  </Text>
                </View>
              </View>
              <Ionicons name="shield-checkmark" size={20} color={colors.medical.verified} />
            </View>
          )}

          {renderPersonalInfo()}
          {renderMedicalInfo()}
          {renderEmergencyContacts()}
          {renderPrivacyStatus()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingBottom: spacing.lg,
    minHeight: '100%',
  },
  accessBanner: {
    padding: spacing.md,
    backgroundColor: colors.background.elevated,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.medical.verified,
  },
  bannerIcon: {
    marginRight: spacing.sm,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  accessSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  header: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerContent: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.md,
  },
  editButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xxs,
  },
  section: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: spacing.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    padding: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
  },
  value: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 22,
  },
  criticalValue: {
    fontWeight: '600',
    color: colors.status.error.main,
  },
  contactCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.medical.emergency,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  primaryBadge: {
    backgroundColor: colors.medical.emergency,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.sm,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  contactDetails: {
    gap: spacing.xxs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  privacyLabel: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: spacing.borderRadius.lg,
  },
  enabledBadge: {
    backgroundColor: 'transparent',
  },
  disabledBadge: {
    backgroundColor: colors.status.error.main + '30',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accessTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius.md,
    marginTop: spacing.xs,
  },
  accessTimeText: {
    fontSize: 14,
    color: colors.primary.main,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  passwordProtectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  lockIconContainer: {
    marginBottom: spacing.lg,
  },
  protectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  protectionMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.xl,
  },
  unlockButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  emergencyInfoCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.medical.emergency,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    width: '100%',
  },
  emergencyInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.medical.emergency,
    marginBottom: spacing.xs,
  },
  emergencyInfoText: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  // Medical Professional Access Banner Styles
  medicalAccessBanner: {
    backgroundColor: colors.background.elevated,
    borderLeftWidth: 4,
    borderLeftColor: colors.medical.verified,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: spacing.borderRadius.md,
  },
  medicalAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicalAccessText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  medicalAccessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.medical.verified,
    marginBottom: 2,
  },
  medicalAccessSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});

export default ProfileDisplay;