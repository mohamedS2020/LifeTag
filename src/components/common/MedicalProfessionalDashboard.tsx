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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, MedicalProfessional } from '../../types';
import { profileService, MedicalProfessionalAccessService } from '../../services';
import { 
  LoadingOverlay, 
  VerifiedBadge, 
  MedicalProfessionalList 
} from '../common';
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
      <MedicalProfessionalList
        showOnlyVerified={true}
        compactView={true}
        onProfessionalPress={(professional) => {
          // Navigate to professional profile or show details
          console.log('Selected professional:', professional);
        }}
      />
    </View>
  );

  /**
   * Render access history tab content
   */
  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.comingSoonText}>
        Access history and audit logs will be displayed here.
      </Text>
      <Text style={styles.comingSoonSubtext}>
        This feature tracks all profile accesses for compliance and security purposes.
      </Text>
    </View>
  );

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
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              // Refresh data
              setTimeout(() => setRefreshing(false), 1000);
            }}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
      >
        {activeTab === 'scanner' && renderScannerTab()}
        {activeTab === 'profiles' && renderProfilesTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </ScrollView>

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
          
          {scannedProfile && (
            <ProfileDisplay
              userId={scannedProfile.userId}
              profile={scannedProfile}
              showEditButton={false}
              showPasswordProtection={false} // Medical professional has privileged access
            />
          )}
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
});

export default MedicalProfessionalDashboard;