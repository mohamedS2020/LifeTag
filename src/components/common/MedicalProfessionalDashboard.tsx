import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, MedicalProfessional, AuditLog } from '../../types';
import { profileService, MedicalProfessionalAccessService } from '../../services';
import { LoadingOverlay } from './LoadingOverlay';
import VerifiedBadge from './VerifiedBadge';
import PatientProfileList from './PatientProfileList';
import { ProfileDisplay } from '../Profile';
import { QRScanner } from '../QR';
import { useMedicalProfessionalAccess } from '../../hooks';
import { colors, spacing } from '../../theme';
import { useTranslation } from 'react-i18next';

/**
 * Medical Professional Dashboard Props
 */
interface MedicalProfessionalDashboardProps {
  onNavigateToProfile?: (profileId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Medical Professional Dashboard Component
 * 
 * Provides privileged access tools for verified medical professionals:
 * - QR code scanning with automatic access
 * - Patient profile browsing with verification badges
 * - Access logging and audit trail
 * - Professional verification status display
 */
const MedicalProfessionalDashboard: React.FC<MedicalProfessionalDashboardProps> = ({
  onNavigateToProfile,
  onError,
}) => {
  // Medical professional access hook
  const {
    isVerifiedProfessional,
    professionalData,
    loading: professionalLoading,
    checkProfileAccess,
    logProfileAccess,
    getFormattedCredentials,
  } = useMedicalProfessionalAccess();

  // Translation hook
  const { t } = useTranslation();

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'scanner' | 'profiles' | 'history'>('scanner');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [accessHistory, setAccessHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [patientNames, setPatientNames] = useState<{ [profileId: string]: string }>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // =============================================
  // INITIALIZATION
  // =============================================

  useEffect(() => {
    if (!isVerifiedProfessional && !professionalLoading) {
      Alert.alert(
        t('errors.unauthorized'),
        t('medicalProfessional.dashboardAccessDenied'),
        [{ text: t('common.ok'), onPress: () => onError?.('Access denied - not a verified medical professional') }]
      );
    }
  }, [isVerifiedProfessional, professionalLoading]);

  // =============================================
  // QR SCANNING FUNCTIONALITY
  // =============================================

  /**
   * Handle QR code scan result
   */
  const handleQRScanned = async (qrData: string, emergencyData: any) => {
    try {
      setIsLoading(true);
      setShowQRScanner(false);

      // Try to extract profile ID from QR data
      let profileId: string | null = null;
      
      if (emergencyData?.profileId) {
        profileId = emergencyData.profileId;
      } else {
        // Try to parse as JSON for profile link
        try {
          const parsed = JSON.parse(qrData);
          profileId = parsed.profileId || parsed.userId;
        } catch {
          // If not JSON, check if it's a direct profile ID
          if (qrData.length > 10 && !qrData.includes('http')) {
            profileId = qrData;
          }
        }
      }

      if (!profileId) {
        Alert.alert(
          t('qr.invalidQR'),
          t('qr.noValidProfileLink'),
          [{ text: t('qr.scanAnother'), onPress: () => setShowQRScanner(true) }]
        );
        return;
      }

      // Load the profile
      const profileResponse = await profileService.getProfile(profileId);
      
      if (!profileResponse.success || !profileResponse.data) {
        Alert.alert(
          t('profile.notFound'),
          t('profile.profileLinkedNotFound'),
          [{ text: t('qr.scanAnother'), onPress: () => setShowQRScanner(true) }]
        );
        return;
      }

      const profile = profileResponse.data;

      // Check if medical professional can access this profile
      const accessResult = await checkProfileAccess(
        profileId,
        {
          allowMedicalProfessionalAccess: profile.privacySettings.allowMedicalProfessionalAccess,
          requirePasswordForFullAccess: profile.privacySettings.requirePasswordForFullAccess
        }
      );

      if (!accessResult.canAccess) {
        Alert.alert(
          t('errors.unauthorized'),
          accessResult.reason,
          [{ text: t('qr.scanAnother'), onPress: () => setShowQRScanner(true) }]
        );
        return;
      }

      // Log the access
      await logProfileAccess(
        profileId,
        `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
        'qr_scan_access'
      );

      // Show the profile
      setScannedProfile(profile);
      setShowProfileModal(true);

      Alert.alert(
        `✅ ${t('profile.profileAccess')}`,
        t('medicalProfessional.privilegedAccessGranted', { name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}` }),
        [{ text: t('profile.viewFullProfile'), onPress: () => setShowProfileModal(true) }]
      );

    } catch (error) {
      console.error('Error processing QR scan:', error);
      Alert.alert(
        t('qr.scanError'),
        t('qr.scanErrorMessage'),
        [{ text: t('common.retry'), onPress: () => setShowQRScanner(true) }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch patient names for audit logs that don't have them
   */
  const fetchPatientNames = async (logs: AuditLog[]) => {
    const namesToFetch = logs
      .filter(log => !log.patientName && !patientNames[log.profileId])
      .map(log => log.profileId);

    if (namesToFetch.length === 0) return;

    try {
      const namePromises = namesToFetch.map(async (profileId) => {
        const response = await profileService.getProfile(profileId);
        if (response.success && response.data) {
          const profile = response.data;
          const fullName = `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;
          return { profileId, name: fullName };
        }
        return { profileId, name: `Patient (${profileId.substring(0, 8)}...)` };
      });

      const results = await Promise.all(namePromises);
      const newNames: { [key: string]: string } = {};
      
      results.forEach(({ profileId, name }) => {
        newNames[profileId] = name;
      });

      setPatientNames(prev => ({ ...prev, ...newNames }));
    } catch (error) {
      console.error('Error fetching patient names:', error);
    }
  };

  /**
   * Fetch medical professional's scan history from audit logs
   */
  const fetchMedicalProfessionalLogs = async () => {
    if (!professionalData?.userId) return;
    
    setHistoryLoading(true);
    try {
      // Get all audit logs where this user was the accessor
      const response = await profileService.getMedicalProfessionalAccessHistory(professionalData.userId);
      
      if (response.success && response.data) {
        setAuditLogs(response.data);
        // Fetch patient names for logs that don't have them
        await fetchPatientNames(response.data);
      } else {
        console.error('Failed to fetch access history:', response.error);
        Alert.alert(t('common.error'), t('profile.failedToLoadAccessHistory'));
      }
    } catch (error) {
      console.error('Error fetching medical professional logs:', error);
      Alert.alert(t('common.error'), t('profile.failedToLoadAccessHistory'));
    } finally {
      setHistoryLoading(false);
    }
  };

  /**
   * Load access history when History tab is selected
   */
  useEffect(() => {
    if (activeTab === 'history' && professionalData?.userId) {
      fetchMedicalProfessionalLogs();
    }
  }, [activeTab, professionalData?.userId]);

  // =============================================
  // RENDER FUNCTIONS
  // =============================================

  /**
   * Render verification status header
   */
  const renderVerificationHeader = () => (
    <View style={styles.verificationHeader}>
      <View style={styles.verificationContent}>
        <VerifiedBadge
          isVerified={isVerifiedProfessional}
          size="medium"
          verifiedAt={professionalData?.verificationStatus.verifiedAt}
        />
        <View style={styles.verificationText}>
          <Text style={styles.verificationTitle}>
            {t('medicalProfessional.dashboard')}
          </Text>
          <Text style={styles.verificationSubtitle}>
            {isVerifiedProfessional ? getFormattedCredentials() : t('medicalProfessional.verificationRequired')}
          </Text>
        </View>
      </View>
      <Ionicons name="medical" size={24} color={colors.status.error.main} />
    </View>
  );

  /**
   * Render tab navigation
   */
  const renderTabNavigation = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'scanner' && styles.activeTab]}
        onPress={() => setActiveTab('scanner')}
      >
        <Ionicons 
          name="qr-code-outline" 
          size={20} 
          color={activeTab === 'scanner' ? colors.primary.main : colors.text.secondary} 
        />
        <Text style={[styles.tabText, activeTab === 'scanner' && styles.activeTabText]}>
          {t('qr.qrScanner')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'profiles' && styles.activeTab]}
        onPress={() => setActiveTab('profiles')}
      >
        <Ionicons 
          name="people-outline" 
          size={20} 
          color={activeTab === 'profiles' ? colors.primary.main : colors.text.secondary} 
        />
        <Text style={[styles.tabText, activeTab === 'profiles' && styles.activeTabText]}>
          {t('profile.profiles')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Ionicons 
          name="time-outline" 
          size={20} 
          color={activeTab === 'history' ? colors.primary.main : colors.text.secondary} 
        />
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          {t('medicalProfessional.history')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render QR scanner tab content
   */
  const renderScannerTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.scannerCard}>
        <Ionicons name="qr-code" size={64} color={colors.primary.main} />
        <Text style={styles.scannerTitle}>{t('medicalProfessional.scanPatientQRCode')}</Text>
        <Text style={styles.scannerDescription}>
          {t('medicalProfessional.scanPatientDescription')}
        </Text>
        
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowQRScanner(true)}
          disabled={!isVerifiedProfessional}
        >
          <Ionicons name="camera" size={20} color={colors.text.inverse} />
          <Text style={styles.scanButtonText}>{t('medicalProfessional.startScanning')}</Text>
        </TouchableOpacity>

        <View style={styles.privilegeNotice}>
          <Ionicons name="shield-checkmark" size={16} color={colors.status.success.main} />
          <Text style={styles.privilegeText}>
            {t('medicalProfessional.bypassPasswordRequirements')}
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * Render profiles tab content
   */
  const renderProfilesTab = () => (
    <View style={styles.tabContent}>
      <PatientProfileList
        compactView={true}
        onProfilePress={(profile) => {
          // Navigate to patient profile
          setScannedProfile(profile);
          setShowProfileModal(true);
        }}
      />
    </View>
  );

  /**
   * Render access history tab content
   */
  const renderHistoryTab = () => {
    if (historyLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>{t('profile.loadingAccessHistory')}</Text>
        </View>
      );
    }

    if (auditLogs.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.text.tertiary} />
          <Text style={styles.emptyStateTitle}>{t('profile.noAccessHistory')}</Text>
          <Text style={styles.emptyStateText}>
            {t('profile.accessHistoryDescription')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.historyTitle}>{t('profile.yourAccessHistory')}</Text>
        <Text style={styles.historySubtitle}>
          {t('profile.showingAccessHistory', { count: auditLogs.length })}
        </Text>
        
        <FlatList
          data={auditLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderAuditLogItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={historyLoading}
              onRefresh={fetchMedicalProfessionalLogs}
              tintColor={colors.primary.main}
            />
          }
          style={styles.historyList}
        />
      </View>
    );
  };

  /**
   * Render individual audit log item
   */
  const renderAuditLogItem = ({ item }: { item: AuditLog }) => {
    // Get patient name from the dedicated field, fetched names, or fallback
    const getPatientName = () => {
      // First check if the audit log has the patient name
      if (item.patientName) {
        return item.patientName;
      }
      
      // Check if we've fetched the name for this profile
      if (patientNames[item.profileId]) {
        return patientNames[item.profileId];
      }
      
      // Try to extract from current notes format
      if (item.notes) {
        // Check if it has the new format: "Patient: [Name] | Professional: ..."
        const patientMatch = item.notes.match(/Patient: (.+?) \|/);
        if (patientMatch && patientMatch[1]) {
          return patientMatch[1];
        }
      }
      
      // Final fallback
      return `Patient (${item.profileId.substring(0, 8)}...)`;
    };

    const getPatientInfo = () => {
      return getPatientName();
    };

    const getAccessTypeIcon = () => {
      switch (item.accessType) {
        case 'qr_scan':
          return 'qr-code';
        case 'full_profile':
          return 'person-outline';
        case 'emergency_access':
          return 'medical-outline';
        default:
          return 'eye-outline';
      }
    };

    const getAccessTypeLabel = () => {
      switch (item.accessType) {
        case 'qr_scan':
          return t('profile.qrCodeScan');
        case 'full_profile':
          return t('profile.fullProfileView');
        case 'emergency_access':
          return t('profile.emergencyAccess');
        case 'profile_edit':
          return t('profile.profileModified');
        default:
          return t('profile.profileAccess');
      }
    };

    return (
      <View style={styles.auditLogItem}>
        <View style={styles.auditLogHeader}>
          <View style={styles.auditLogIcon}>
            <Ionicons
              name={getAccessTypeIcon()}
              size={20}
              color={colors.primary.main}
            />
          </View>
          <View style={styles.auditLogInfo}>
            <Text style={styles.auditLogAction}>
              {getAccessTypeLabel()}
            </Text>
            <Text style={styles.auditLogPatient}>
              {getPatientInfo()}
            </Text>
            <Text style={styles.auditLogTimestamp}>
              {formatAccessDate(item.timestamp)}
            </Text>
          </View>
          <View style={styles.auditLogAccessType}>
            <Text style={styles.accessTypeText}>
              {item.accessMethod === 'qr_code' ? 'QR' : 'APP'}
            </Text>
          </View>
        </View>
        
        <View style={styles.auditLogDetails}>
          <Text style={styles.auditLogPatientName}>
            Patient: {getPatientName()}
          </Text>
          <Text style={styles.auditLogProfile}>
            Profile: {item.profileId.substring(0, 8)}...
          </Text>
          {item.fieldsAccessed && item.fieldsAccessed.length > 0 && (
            <Text style={styles.auditLogFields}>
              Access: {item.fieldsAccessed.join(', ')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  /**
   * Format access date for display
   */
  const formatAccessDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // =============================================
  // MAIN RENDER
  // =============================================

  if (professionalLoading) {
    return <LoadingOverlay visible={true} message={t('medicalProfessional.verifyingProfessionalStatus')} />;
  }

  if (!isVerifiedProfessional) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Ionicons name="shield-outline" size={64} color={colors.status.error.main} />
        <Text style={styles.accessDeniedTitle}>{t('errors.unauthorized')}</Text>
        <Text style={styles.accessDeniedText}>
          {t('medicalProfessional.dashboardAccessDenied')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {renderVerificationHeader()}

      {/* Tab Navigation */}
      {renderTabNavigation()}

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'scanner' && renderScannerTab()}
        {activeTab === 'profiles' && renderProfilesTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </View>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRScanner
          onQRScanned={handleQRScanned}
          onError={(error) => {
            console.error('QR Scanner error:', error);
            setShowQRScanner(false);
            onError?.(error);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      </Modal>

      {/* Profile Display Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.profileModal}>
          <View style={styles.profileModalHeader}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.profileModalTitle}>{t('profile.patientProfile')}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView 
            style={styles.profileModalContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {scannedProfile && (
              <ProfileDisplay
                userId={scannedProfile.userId}
                profile={scannedProfile}
                showEditButton={false}
                showPasswordProtection={false} // Medical professional has privileged access
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingOverlay visible={true} message={t('qr.processingQRCode')} />
      )}
    </SafeAreaView>
  );
};

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  verificationHeader: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verificationText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.xxs,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: spacing.lg,
  },
  scannerCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  scannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  scannerDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  scanButton: {
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.md,
  },
  scanButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  privilegeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.md,
  },
  privilegeText: {
    fontSize: 12,
    color: colors.medical.verified,
    marginLeft: spacing.xxs,
    fontWeight: '500',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background.primary,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.status.error.main,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  accessDeniedText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  profileModal: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  profileModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  profileModalContent: {
    flex: 1,
  },
  // History Tab Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  historySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  historyList: {
    flex: 1,
  },
  auditLogItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  auditLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  auditLogIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.background.elevated,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  auditLogInfo: {
    flex: 1,
  },
  auditLogAction: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  auditLogTimestamp: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  auditLogAccessType: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: spacing.borderRadius.sm,
  },
  accessTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  auditLogDetails: {
    paddingLeft: 48,
  },
  auditLogProfile: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: spacing.xxs,
  },
  auditLogNotes: {
    fontSize: 14,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  auditLogPatient: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '500',
    marginBottom: 2,
  },
  auditLogFields: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  auditLogPatientName: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
});

export default MedicalProfessionalDashboard;