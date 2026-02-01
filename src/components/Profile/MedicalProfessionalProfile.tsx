import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { MedicalProfessional } from '../../types';
import { MedicalProfessionalApprovalService } from '../../services/medicalProfessionalApprovalService';
import { LoadingOverlay } from '../common/LoadingOverlay';
import VerifiedBadge, { ProfileHeaderBadge } from '../common/VerifiedBadge';

interface MedicalProfessionalProfileProps {
  professionalId?: string;
  professional?: MedicalProfessional;
  showEditButton?: boolean;
  showContactButtons?: boolean;
  onEdit?: () => void;
  onError?: (error: string) => void;
}

/**
 * MedicalProfessionalProfile Component
 * Displays medical professional information with verification badges
 */
export const MedicalProfessionalProfile: React.FC<MedicalProfessionalProfileProps> = ({
  professionalId,
  professional: initialProfessional,
  showEditButton = false,
  showContactButtons = true,
  onEdit,
  onError,
}) => {
  const { t } = useTranslation();
  const [professional, setProfessional] = useState<MedicalProfessional | null>(initialProfessional || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // =============================================
  // INITIALIZATION & DATA LOADING
  // =============================================

  useEffect(() => {
    if (professionalId && !initialProfessional) {
      loadProfessional();
    }
  }, [professionalId]);

  /**
   * Load professional data from service
   */
  const loadProfessional = async () => {
    if (!professionalId) return;

    try {
      setIsLoading(true);
      const loadedProfessional = await MedicalProfessionalApprovalService.getProfessionalById(professionalId);
      setProfessional(loadedProfessional);
    } catch (error) {
      console.error('Error loading professional:', error);
      const errorMessage = t('medicalProfessional.failedToLoadProfessional');
      onError?.(errorMessage);
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Handle refresh action
   */
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProfessional();
  };

  /**
   * Handle contact actions
   */
  const handleCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert(t('common.error'), t('medicalProfessional.phoneNotSupported'));
        }
      })
      .catch((error) => {
        console.error('Error opening phone:', error);
        Alert.alert(t('common.error'), t('medicalProfessional.failedToOpenPhone'));
      });
  };

  const handleEmail = (email: string) => {
    const emailUrl = `mailto:${email}`;
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert(t('common.error'), t('medicalProfessional.emailNotSupported'));
        }
      })
      .catch((error) => {
        console.error('Error opening email:', error);
        Alert.alert(t('common.error'), t('medicalProfessional.failedToOpenEmail'));
      });
  };

  /**
   * Format years of experience
   */
  const formatExperience = (years?: number): string => {
    if (!years) return t('common.notSpecified');
    return years === 1 ? t('medicalProfessional.oneYear') : t('medicalProfessional.yearsCount', { count: years });
  };

  /**
   * Format license expiry date
   */
  const formatLicenseExpiry = (date?: Date): { text: string; isExpiring: boolean; isExpired: boolean } => {
    if (!date) return { text: t('common.notSpecified'), isExpiring: false, isExpired: false };
    
    const now = new Date();
    const expiryDate = new Date(date);
    const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const isExpired = daysDiff < 0;
    const isExpiring = daysDiff <= 30 && daysDiff >= 0;
    
    if (isExpired) {
      return { text: t('medicalProfessional.expiredDaysAgo', { count: Math.abs(daysDiff) }), isExpiring: false, isExpired: true };
    } else if (isExpiring) {
      return { text: t('medicalProfessional.expiresInDays', { count: daysDiff }), isExpiring: true, isExpired: false };
    } else {
      return { text: t('medicalProfessional.expiresOnDate', { date: expiryDate.toLocaleDateString() }), isExpiring: false, isExpired: false };
    }
  };

  // =============================================
  // RENDER SECTIONS
  // =============================================

  /**
   * Render professional header with name and verification badge
   */
  const renderHeader = () => {
    if (!professional) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.name}>
            {professional.personalInfo.firstName} {professional.personalInfo.lastName}
          </Text>
          
          <ProfileHeaderBadge
            isVerified={professional.verificationStatus.isVerified}
            userType="medical_professional"
            verificationStatus={{
              verifiedAt: professional.verificationStatus.verifiedAt,
              verifiedBy: professional.verificationStatus.verifiedBy,
            }}
          />
          
          {professional.professionalInfo.specialty && (
            <Text style={styles.specialty}>
              {professional.professionalInfo.specialty}
            </Text>
          )}
          
          {professional.professionalInfo.hospitalAffiliation && (
            <Text style={styles.hospital}>
              {professional.professionalInfo.hospitalAffiliation}
            </Text>
          )}
        </View>

        {showEditButton && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons name="create-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Render contact information section
   */
  const renderContactInfo = () => {
    if (!professional) return null;

    const { email, phoneNumber } = professional.personalInfo;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="call" size={20} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>{t('medicalProfessional.contactInformation')}</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.contactRow}>
            <Ionicons name="mail" size={16} color="#666666" />
            <Text style={styles.label}>{t('medicalProfessional.emailLabel')}</Text>
            <Text style={styles.value}>{email}</Text>
            {showContactButtons && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleEmail(email)}
              >
                <Ionicons name="send" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>

          {phoneNumber && (
            <View style={styles.contactRow}>
              <Ionicons name="call" size={16} color="#666666" />
              <Text style={styles.label}>{t('medicalProfessional.phoneLabel')}</Text>
              <Text style={styles.value}>{phoneNumber}</Text>
              {showContactButtons && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleCall(phoneNumber)}
                >
                  <Ionicons name="call" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render professional credentials section
   */
  const renderCredentials = () => {
    if (!professional) return null;

    const { professionalInfo } = professional;
    const licenseExpiry = formatLicenseExpiry(professionalInfo.licenseExpiryDate);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={20} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>{t('medicalProfessional.professionalCredentials')}</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('medicalProfessional.licenseNumberLabel')}</Text>
            <Text style={styles.value}>{professionalInfo.licenseNumber}</Text>
          </View>

          {professionalInfo.licenseState && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('medicalProfessional.licenseStateLabel')}</Text>
              <Text style={styles.value}>{professionalInfo.licenseState}</Text>
            </View>
          )}

          {professionalInfo.licenseExpiryDate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('medicalProfessional.licenseExpiryLabel')}</Text>
              <Text style={[
                styles.value,
                licenseExpiry.isExpired && styles.expiredText,
                licenseExpiry.isExpiring && styles.expiringText
              ]}>
                {licenseExpiry.text}
              </Text>
              {(licenseExpiry.isExpired || licenseExpiry.isExpiring) && (
                <Ionicons 
                  name="warning" 
                  size={16} 
                  color={licenseExpiry.isExpired ? "#DC3545" : "#FFC107"} 
                />
              )}
            </View>
          )}

          {professionalInfo.yearsOfExperience && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('medicalProfessional.experienceLabel')}</Text>
              <Text style={styles.value}>{formatExperience(professionalInfo.yearsOfExperience)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render verification status section
   */
  const renderVerificationStatus = () => {
    if (!professional) return null;

    const { verificationStatus } = professional;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={20} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>{t('medicalProfessional.verificationStatus')}</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.verificationRow}>
            <VerifiedBadge
              isVerified={verificationStatus.isVerified}
              size="large"
              verifiedAt={verificationStatus.verifiedAt}
            />
          </View>

          {verificationStatus.isVerified && verificationStatus.verifiedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('medicalProfessional.verifiedDateLabel')}</Text>
              <Text style={styles.value}>
                {verificationStatus.verifiedAt.toLocaleDateString()}
              </Text>
            </View>
          )}

          {verificationStatus.verifiedBy && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('medicalProfessional.verifiedByLabel')}</Text>
              <Text style={styles.value}>{verificationStatus.verifiedBy}</Text>
            </View>
          )}

          {verificationStatus.verificationNotes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('medicalProfessional.notesLabel')}</Text>
              <Text style={styles.value}>{verificationStatus.verificationNotes}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // =============================================
  // MAIN RENDER
  // =============================================

  if (isLoading && !professional) {
    return <LoadingOverlay visible={true} message={t('medicalProfessional.loadingProfile')} />;
  }

  if (!professional) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color="#CCCCCC" />
        <Text style={styles.errorTitle}>{t('medicalProfessional.professionalNotFound')}</Text>
        <Text style={styles.errorText}>
          {t('medicalProfessional.professionalNotFoundMessage')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#FF6B6B']}
          tintColor="#FF6B6B"
        />
      }
    >
      {renderHeader()}
      {renderContactInfo()}
      {renderCredentials()}
      {renderVerificationStatus()}
    </ScrollView>
  );
};

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  specialty: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
    marginBottom: 4,
  },
  hospital: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  verificationRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 8,
    minWidth: 100,
  },
  value: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    marginLeft: 8,
  },
  expiredText: {
    color: '#DC3545',
    fontWeight: '600',
  },
  expiringText: {
    color: '#FFC107',
    fontWeight: '600',
  },
  contactButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFF5F5',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MedicalProfessionalProfile;