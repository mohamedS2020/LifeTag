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
import { useTranslation } from 'react-i18next';
import { AuditLog } from '../types';
import profileService from '../services/profileService';
import authService from '../services/authService';
import { MedicalProfessionalApprovalService } from '../services/medicalProfessionalApprovalService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, spacing } from '../theme';

interface RouteParams {
  logId: string;
  logData: AuditLog & { timestamp: string | Date };
}

type AdminAuditLogDetailNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Admin Audit Log Detail Screen
 * Shows comprehensive details of a specific audit log
 */
const AdminAuditLogDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AdminAuditLogDetailNavigationProp>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const routeParams = route.params as RouteParams;
  
  // Deserialize timestamp if it was passed as string
  const logData: AuditLog = {
    ...routeParams.logData,
    timestamp: typeof routeParams.logData.timestamp === 'string'
      ? new Date(routeParams.logData.timestamp)
      : routeParams.logData.timestamp
  };
  
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
              type: t('admin.medicalProfessional'),
              details: `${medProf.professionalInfo.specialty || t('admin.general')} • ${t('admin.license')}: ${medProf.professionalInfo.licenseNumber}`
            });
          }
        } else {
          // Get regular user profile
          const userProfileResponse = await profileService.getProfileByUserId(logData.accessedBy);
          if (userProfileResponse.success && userProfileResponse.data) {
            const profile = userProfileResponse.data;
            setAccessorInfo({
              name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
              type: logData.accessorType === 'admin' ? t('admin.administrator') : t('admin.regularUser'),
              details: `${t('admin.userId')}: ${logData.accessedBy.substring(0, 8)}...`
            });
          } else {
            // Fallback: try to get name from users collection (set during registration)
            const userBasicInfo = await authService.getUserBasicInfo(logData.accessedBy);
            if (userBasicInfo?.firstName || userBasicInfo?.lastName) {
              const name = `${userBasicInfo.firstName || ''} ${userBasicInfo.lastName || ''}`.trim();
              setAccessorInfo({
                name: name || `${t('admin.user')} (${logData.accessedBy.substring(0, 8)}...)`,
                type: logData.accessorType === 'admin' ? t('admin.administrator') : t('admin.regularUser'),
                details: t('admin.noProfileCreated')
              });
            } else {
              // Final fallback if no name found anywhere
              setAccessorInfo({
                name: `${t('admin.user')} (${logData.accessedBy.substring(0, 8)}...)`,
                type: logData.accessorType === 'admin' ? t('admin.administrator') : t('admin.regularUser'),
                details: t('admin.noProfileCreated')
              });
            }
          }
        }
      } else {
        setAccessorInfo({
          name: t('admin.anonymousUser'),
          type: t('admin.anonymousAccess'),
          details: t('admin.noUserIdentification')
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
          name: t('profile.notFound'),
          details: `${t('admin.profileId')}: ${logData.profileId}`
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
          title: t('admin.accessTypes.qrScan'),
          description: t('admin.accessTypes.qrScanDesc'),
          icon: 'qr-code',
          color: colors.primary.main
        };
      case 'full_profile':
        return {
          title: t('admin.accessTypes.fullProfile'),
          description: t('admin.accessTypes.fullProfileDesc'),
          icon: 'person-outline',
          color: colors.status.success.main
        };
      case 'emergency_access':
        return {
          title: t('admin.accessTypes.emergencyAccess'),
          description: t('admin.accessTypes.emergencyAccessDesc'),
          icon: 'medical-outline',
          color: colors.status.error.main
        };
      case 'profile_edit':
        return {
          title: t('admin.accessTypes.profileEdit'),
          description: t('admin.accessTypes.profileEditDesc'),
          icon: 'create-outline',
          color: colors.status.warning.main
        };
      default:
        return {
          title: t('admin.accessTypes.profileAccess'),
          description: t('admin.accessTypes.profileAccessDesc'),
          icon: 'eye-outline',
          color: colors.text.tertiary
        };
    }
  };

  const accessTypeDetails = getAccessTypeDetails();

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('admin.auditLogDetails')}</Text>
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
          <Text style={styles.sectionTitle}>{t('admin.timestamp')}</Text>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={20} color={colors.primary.main} />
            <Text style={styles.infoText}>{formatFullTimestamp(logData.timestamp)}</Text>
          </View>
        </View>

        {/* Accessor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.accessedBy')}</Text>
          <View style={styles.infoCard}>
            <Ionicons name="person-outline" size={20} color={colors.status.success.main} />
            <View style={styles.infoContent}>
              <Text style={styles.infoMainText}>
                {accessorInfo?.name || t('common.loading')}
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
          <Text style={styles.sectionTitle}>{t('admin.profileAccessed')}</Text>
          <View style={styles.infoCard}>
            <Ionicons name="document-text-outline" size={20} color={colors.status.warning.main} />
            <View style={styles.infoContent}>
              <Text style={styles.infoMainText}>
                {profileInfo?.name || t('common.loading')}
              </Text>
              <Text style={styles.infoDetailsText}>
                {profileInfo?.details || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Access Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.accessMethod')}</Text>
          <View style={styles.infoCard}>
            <Ionicons 
              name={logData.accessMethod === 'qr_code' ? 'qr-code-outline' : 'phone-portrait-outline'} 
              size={20} 
              color={colors.text.tertiary} 
            />
            <Text style={styles.infoText}>
              {logData.accessMethod === 'qr_code' ? t('qr.scanQR') : t('admin.mobileApplication')}
            </Text>
          </View>
        </View>

        {/* Fields Accessed */}
        {logData.fieldsAccessed && logData.fieldsAccessed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.fieldsAccessed')}</Text>
            <View style={styles.infoCard}>
              <Ionicons name="list-outline" size={20} color={colors.status.info.main} />
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
            <Text style={styles.sectionTitle}>{t('admin.additionalNotes')}</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{logData.notes}</Text>
            </View>
          </View>
        )}

        {/* Technical Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.technicalDetails')}</Text>
          <View style={styles.technicalCard}>
            <View style={styles.technicalRow}>
              <Text style={styles.technicalLabel}>{t('admin.logId')}:</Text>
              <Text style={styles.technicalValue}>{logData.id}</Text>
            </View>
            <View style={styles.technicalRow}>
              <Text style={styles.technicalLabel}>{t('admin.accessedBy')}:</Text>
              <Text style={styles.technicalValue}>{logData.accessedBy || t('admin.anonymous')}</Text>
            </View>
            <View style={styles.technicalRow}>
              <Text style={styles.technicalLabel}>{t('admin.profileId')}:</Text>
              <Text style={styles.technicalValue}>{logData.profileId}</Text>
            </View>
            <View style={styles.technicalRow}>
              <Text style={styles.technicalLabel}>{t('admin.dataModified')}:</Text>
              <Text style={styles.technicalValue}>
                {logData.dataModified ? t('common.yes') : t('common.no')}
              </Text>
            </View>
            {logData.sessionId && (
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>{t('admin.sessionId')}:</Text>
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
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
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
    padding: spacing.md,
  },
  accessTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  accessTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  accessTypeInfo: {
    flex: 1,
  },
  accessTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  accessTypeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  infoSubText: {
    fontSize: 14,
    color: colors.primary.main,
    marginBottom: 2,
  },
  infoDetailsText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  fieldItem: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 2,
  },
  notesCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  technicalCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  technicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  technicalLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  technicalValue: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
});

export default AdminAuditLogDetailScreen;