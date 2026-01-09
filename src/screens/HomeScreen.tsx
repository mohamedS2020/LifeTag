/**
 * HomeScreen - Main Dashboard
 * Task 7.3: Build HomeScreen with main dashboard and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { LoadingOverlay } from '../components/common';

// Service imports
import { profileService } from '../services';
import { QRService } from '../services/qrService';

interface HomeScreenProps {
  navigation: any;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  badge?: number;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Load user profile and dashboard data
  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const profileResponse = await profileService.getProfile(user.id);
      
      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data);
        
        // Calculate profile completion percentage
        const completion = calculateProfileCompletion(profileResponse.data);
        setProfileCompletion(completion);
      } else {
        setError(profileResponse.error?.message || 'Failed to load profile data');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (userProfile: UserProfile): number => {
    let completedFields = 0;
    let totalFields = 0;

    // Personal Info (required fields)
    const personalFields = ['firstName', 'lastName', 'dateOfBirth'];
    personalFields.forEach(field => {
      totalFields++;
      if (userProfile.personalInfo && userProfile.personalInfo[field as keyof typeof userProfile.personalInfo]) {
        completedFields++;
      }
    });

    // Medical Info
    totalFields++;
    if (userProfile.medicalInfo?.bloodType) completedFields++;

    // Emergency Contacts
    totalFields++;
    if (userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0) {
      completedFields++;
    }

    return Math.round((completedFields / totalFields) * 100);
  };

  // Define quick actions
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [
      {
        id: 'view-profile',
        title: 'View Full Profile',
        subtitle: 'See complete information',
        icon: 'document-text',
        color: '#9C27B0',
        onPress: () => navigation.navigate('ProfileDisplay'),
      },
      {
        id: 'edit-profile',
        title: 'Edit Profile',
        subtitle: 'Update emergency information',
        icon: 'person-circle',
        color: '#FF9800',
        onPress: () => navigation.navigate('ProfileForm'),
      },
      {
        id: 'access-history',
        title: 'Profile Access History',
        subtitle: 'View who accessed your profile',
        icon: 'eye-outline',
        color: '#007AFF',
        onPress: () => navigation.navigate('ProfileAccessHistory'),
      },
    ];

    // Add medical professional actions if applicable
    if (user?.userType === 'medical_professional' && user?.isVerified) {
      actions.push({
        id: 'professional-scanner',
        title: 'Professional Scanner',
        subtitle: 'Verified access scanning',
        icon: 'medical',
        color: '#F44336',
        onPress: () => navigation.navigate('MedPro'),
      });
    }

    return actions;
  };

  const renderWelcomeCard = () => (
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeHeader}>
        <Ionicons name="heart-circle" size={40} color="#2196F3" />
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>
            Welcome back{profile?.personalInfo?.firstName ? `, ${profile.personalInfo.firstName}` : ''}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {user?.userType === 'medical_professional' && user?.isVerified 
              ? 'Verified Medical Professional' 
              : user?.userType === 'medical_professional' && !user?.isVerified
              ? 'Medical Professional - Awaiting Verification'
              : 'Emergency Medical Information System'}
          </Text>
        </View>
      </View>
      
      {user?.userType === 'medical_professional' && user?.isVerified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.verifiedText}>Verified Professional</Text>
        </View>
      )}
      
      {user?.userType === 'medical_professional' && !user?.isVerified && (
        <View style={styles.unverifiedBadge}>
          <Ionicons name="time-outline" size={16} color="#FF9800" />
          <Text style={styles.unverifiedText}>Pending Verification</Text>
        </View>
      )}
    </View>
  );

  const renderProfileStatus = () => {
    if (profileCompletion === 100) return null;
    
    return (
      <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>Profile Status</Text>
        <Text style={styles.completionPercentage}>{profileCompletion}%</Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${profileCompletion}%` }
            ]} 
          />
        </View>
      </View>
      
      <Text style={styles.statusDescription}>
        {profileCompletion < 50 
          ? 'Complete your profile for better emergency response'
          : profileCompletion < 100 
          ? 'Almost done! Add remaining details'
          : 'Profile complete and ready for emergencies'}
      </Text>
      
      {profileCompletion < 100 && (
        <TouchableOpacity 
          style={styles.completeProfileButton}
          onPress={() => navigation.navigate('ProfileForm')}
        >
          <Text style={styles.completeProfileText}>Complete Profile</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
    );
  };

  const renderQuickActions = () => {
    const actions = getQuickActions();
    
    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name={action.icon} size={24} color={action.color} />
                {action.badge && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{action.badge}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderEmergencyInfo = () => {
    if (!profile?.personalInfo) return null;

    return (
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyHeader}>
          <Ionicons name="warning" size={24} color="#F44336" />
          <Text style={styles.emergencyTitle}>Emergency Summary</Text>
        </View>
        
        <View style={styles.emergencyContent}>
          {profile.medicalInfo?.bloodType && (
            <View style={styles.emergencyItem}>
              <Text style={styles.emergencyLabel}>Blood Type:</Text>
              <Text style={styles.emergencyValue}>{profile.medicalInfo.bloodType}</Text>
            </View>
          )}
          
          {profile.medicalInfo?.allergies && profile.medicalInfo.allergies.length > 0 && (
            <View style={styles.emergencyItem}>
              <Text style={styles.emergencyLabel}>Allergies:</Text>
              <Text style={styles.emergencyValue}>
                {profile.medicalInfo.allergies.join(', ')}
              </Text>
            </View>
          )}
          
          {profile.emergencyContacts && profile.emergencyContacts.length > 0 && (
            <View style={styles.emergencyItem}>
              <Text style={styles.emergencyLabel}>Emergency Contact:</Text>
              <Text style={styles.emergencyValue}>
                {profile.emergencyContacts[0].name} ({profile.emergencyContacts[0].phoneNumber})
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.viewFullButton}
          onPress={() => navigation.navigate('QRDisplay')}
        >
          <Text style={styles.viewFullButtonText}>Show Emergency QR Code</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {renderWelcomeCard()}
        {renderProfileStatus()}
        {renderEmergencyInfo()}
        {renderQuickActions()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Welcome Card
  welcomeCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  unverifiedText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  
  // Profile Status Card
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  completionPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  completeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  completeProfileText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  
  // Quick Actions
  quickActionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  actionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  
  // Emergency Info Card
  emergencyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: 8,
  },
  emergencyContent: {
    marginBottom: 16,
  },
  emergencyItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  emergencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 120,
  },
  emergencyValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  viewFullButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewFullButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;