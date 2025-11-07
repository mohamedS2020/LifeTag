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

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'scanner' | 'profiles' | 'history'>('scanner');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [accessHistory, setAccessHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // =============================================
  // INITIALIZATION
  // =============================================

  useEffect(() => {
    if (!isVerifiedProfessional && !professionalLoading) {
      Alert.alert(
        'Access Denied',
        'This dashboard is only available to verified medical professionals.',
        [{ text: 'OK', onPress: () => onError?.('Access denied - not a verified medical professional') }]
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
          'Invalid QR Code',
          'This QR code does not contain a valid LifeTag profile link.',
          [{ text: 'Scan Another', onPress: () => setShowQRScanner(true) }]
        );
        return;
      }

      // Load the profile
      const profileResponse = await profileService.getProfile(profileId);
      
      if (!profileResponse.success || !profileResponse.data) {
        Alert.alert(
          'Profile Not Found',
          'The profile linked to this QR code could not be found.',
          [{ text: 'Scan Another', onPress: () => setShowQRScanner(true) }]
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
          'Access Denied',
          accessResult.reason,
          [{ text: 'Scan Another', onPress: () => setShowQRScanner(true) }]
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
        '✅ Profile Access Granted',
        `You now have privileged access to ${profile.personalInfo.firstName} ${profile.personalInfo.lastName}'s medical profile.`,
        [{ text: 'View Profile', onPress: () => setShowProfileModal(true) }]
      );

    } catch (error) {
      console.error('Error processing QR scan:', error);
      Alert.alert(
        'Scan Error',
        'An error occurred while processing the QR code. Please try again.',
        [{ text: 'Retry', onPress: () => setShowQRScanner(true) }]
      );
    } finally {
      setIsLoading(false);
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
      } else {
        console.error('Failed to fetch access history:', response.error);
        Alert.alert('Error', 'Failed to load access history');
      }
    } catch (error) {
      console.error('Error fetching medical professional logs:', error);
      Alert.alert('Error', 'Failed to load access history');
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
            Medical Professional Dashboard
          </Text>
          <Text style={styles.verificationSubtitle}>
            {isVerifiedProfessional ? getFormattedCredentials() : 'Verification Required'}
          </Text>
        </View>
      </View>
      <Ionicons name="medical" size={24} color="#FF6B6B" />
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
          color={activeTab === 'scanner' ? '#FF6B6B' : '#666666'} 
        />
        <Text style={[styles.tabText, activeTab === 'scanner' && styles.activeTabText]}>
          QR Scanner
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'profiles' && styles.activeTab]}
        onPress={() => setActiveTab('profiles')}
      >
        <Ionicons 
          name="people-outline" 
          size={20} 
          color={activeTab === 'profiles' ? '#FF6B6B' : '#666666'} 
        />
        <Text style={[styles.tabText, activeTab === 'profiles' && styles.activeTabText]}>
          Profiles
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Ionicons 
          name="time-outline" 
          size={20} 
          color={activeTab === 'history' ? '#FF6B6B' : '#666666'} 
        />
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          History
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
        <Ionicons name="qr-code" size={64} color="#FF6B6B" />
        <Text style={styles.scannerTitle}>Scan Patient QR Code</Text>
        <Text style={styles.scannerDescription}>
          Scan a LifeTag QR code to instantly access patient medical information with your verified professional status.
        </Text>
        
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowQRScanner(true)}
          disabled={!isVerifiedProfessional}
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>

        <View style={styles.privilegeNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#28A745" />
          <Text style={styles.privilegeText}>
            Verified professionals bypass password requirements
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
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading access history...</Text>
        </View>
      );
    }

    if (auditLogs.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="document-text-outline" size={64} color="#999999" />
          <Text style={styles.emptyStateTitle}>No Access History</Text>
          <Text style={styles.emptyStateText}>
            Your profile access history will appear here after scanning QR codes or viewing patient profiles.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.historyTitle}>Your Profile Access History</Text>
        <Text style={styles.historySubtitle}>
          Showing your last {auditLogs.length} profile accesses for compliance tracking
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
              tintColor="#007AFF"
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
    // Get patient name from the dedicated field or fallback
    const getPatientName = () => {
      if (item.patientName) {
        return item.patientName;
      }
      // Fallback to extracting from notes for older logs
      if (item.notes && item.notes.includes('Medical Professional Access:')) {
        const match = item.notes.match(/Medical Professional Access: (.+?) \(License:/);
        if (match && match[1]) {
          return match[1]; // This would be the professional name, not patient
        }
      }
      return 'Unknown Patient';
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
          return 'QR Code Scan';
        case 'full_profile':
          return 'Full Profile View';
        case 'emergency_access':
          return 'Emergency Access';
        case 'profile_edit':
          return 'Profile Modified';
        default:
          return 'Profile Access';
      }
    };

    return (
      <View style={styles.auditLogItem}>
        <View style={styles.auditLogHeader}>
          <View style={styles.auditLogIcon}>
            <Ionicons
              name={getAccessTypeIcon()}
              size={20}
              color="#007AFF"
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
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
    return <LoadingOverlay visible={true} message="Verifying professional status..." />;
  }

  if (!isVerifiedProfessional) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Ionicons name="shield-outline" size={64} color="#DC3545" />
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedText}>
          This dashboard is only available to verified medical professionals.
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
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.profileModalTitle}>Patient Profile</Text>
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
        <LoadingOverlay visible={true} message="Processing QR code..." />
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
    backgroundColor: '#F8F9FA',
  },
  verificationHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verificationText: {
    marginLeft: 12,
    flex: 1,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  scannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  scannerDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  privilegeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  privilegeText: {
    fontSize: 12,
    color: '#28A745',
    marginLeft: 6,
    fontWeight: '500',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC3545',
    marginTop: 20,
    marginBottom: 12,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  profileModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  profileModalContent: {
    flex: 1,
  },
  // History Tab Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  historySubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  historyList: {
    flex: 1,
  },
  auditLogItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  auditLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  auditLogIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#E8F4FD',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  auditLogInfo: {
    flex: 1,
  },
  auditLogAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  auditLogTimestamp: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  auditLogAccessType: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accessTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  auditLogDetails: {
    paddingLeft: 48,
  },
  auditLogProfile: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  auditLogNotes: {
    fontSize: 14,
    color: '#333333',
    fontStyle: 'italic',
  },
  auditLogPatient: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  auditLogFields: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
  },
  auditLogPatientName: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default MedicalProfessionalDashboard;