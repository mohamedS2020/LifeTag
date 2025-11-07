import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileDisplay } from '../components/Profile/ProfileDisplay';
import { useAuth } from '../context/AuthContext';
import profileService from '../services/profileService';
import { MedicalProfessionalAccessService } from '../services/medicalProfessionalAccessService';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import VerifiedBadge from '../components/common/VerifiedBadge';
import { UserProfile, MedicalProfessional } from '../types';

type AuthenticatedStackParamList = {
  ProfileDisplay: {
    profileId?: string;
    isViewingOtherProfile?: boolean;
  };
  ProfileForm: {
    mode: 'create' | 'edit';
    profileId?: string;
  };
};

type ProfileDisplayScreenRouteProp = RouteProp<
  AuthenticatedStackParamList,
  'ProfileDisplay'
>;

type ProfileDisplayScreenNavigationProp = StackNavigationProp<
  AuthenticatedStackParamList,
  'ProfileDisplay'
>;

export const ProfileDisplayScreen: React.FC = () => {
  const navigation = useNavigation<ProfileDisplayScreenNavigationProp>();
  const route = useRoute<ProfileDisplayScreenRouteProp>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const { profileId, isViewingOtherProfile = false } = route.params || {};
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [isMedicalProfessional, setIsMedicalProfessional] = useState(false);

  useEffect(() => {
    checkMedicalProfessionalStatus();
    loadProfile();
  }, [profileId, user?.id]);

  const checkMedicalProfessionalStatus = async () => {
    if (user) {
      const isVerified = await MedicalProfessionalAccessService.isVerifiedMedicalProfessional(user);
      setIsMedicalProfessional(isVerified);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine which profile to load
      const targetProfileId = profileId || user?.id;
      
      if (!targetProfileId) {
        setError('No profile ID available');
        return;
      }

      // Load the profile
      const profileResponse = await profileService.getProfile(targetProfileId);
      
      if (!profileResponse.success || !profileResponse.data) {
        setError(profileResponse.error?.message || 'Profile not found');
        return;
      }

      setProfile(profileResponse.data);

      // Check if medical professional access is needed
      if (isViewingOtherProfile && isMedicalProfessional && user?.id) {
        await checkMedicalAccess(targetProfileId);
      } else if (!isViewingOtherProfile || targetProfileId === user?.id) {
        setAccessGranted(true);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkMedicalAccess = async (targetProfileId: string) => {
    try {
      setAccessLoading(true);
      
      if (!user?.id || !isMedicalProfessional) {
        setError('Medical professional access required');
        return;
      }

      // For now, we'll simulate access checking
      // In a real implementation, this would check with the access service
      setAccessGranted(true);
      
    } catch (err) {
      console.error('Error checking medical access:', err);
      setError('Failed to verify access permissions');
    } finally {
      setAccessLoading(false);
    }
  };

  const handleEditProfile = () => {
    if (!profile) return;
    
    navigation.navigate('ProfileForm', {
      mode: 'edit',
      profileId: profile.id,
    });
  };

  const handleRetry = () => {
    loadProfile();
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>
          {isViewingOtherProfile ? 'Patient Profile' : 'My Profile'}
        </Text>
        {isMedicalProfessional && (
          <VerifiedBadge isVerified={true} style={styles.verifiedBadge} />
        )}
      </View>
      
      {!isViewingOtherProfile && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
          disabled={!profile}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAccessPending = () => (
    <View style={styles.accessContainer}>
      <Text style={styles.accessTitle}>Medical Professional Access</Text>
      <Text style={styles.accessMessage}>
        Requesting access to patient profile for emergency medical purposes.
      </Text>
      {accessLoading && (
        <ActivityIndicator size="large" color="#007AFF" style={styles.accessLoader} />
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return <LoadingOverlay visible={true} message="Loading profile..." />;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!profile) {
      return (
        <View style={styles.noProfileContainer}>
          <Text style={styles.noProfileText}>No profile found</Text>
          {!isViewingOtherProfile && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('ProfileForm', { mode: 'create' })}
            >
              <Text style={styles.createButtonText}>Create Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (isViewingOtherProfile && !accessGranted) {
      return renderAccessPending();
    }

    return (
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        bounces={true}
        pointerEvents="auto"
        onScroll={() => console.log('📜 ProfileDisplayScreen: Scrolling...')}
        scrollEventThrottle={16}
        onTouchStart={() => console.log('👆 ProfileDisplayScreen: Touch started on ScrollView')}
        onTouchEnd={() => console.log('👆 ProfileDisplayScreen: Touch ended on ScrollView')}
      >
        <ProfileDisplay
          userId={profile.id}
          profile={profile}
          showEditButton={false}
          showPasswordProtection={isViewingOtherProfile}
        />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {renderHeader()}
      <View style={styles.contentWrapper}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2196F3',
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  verifiedBadge: {
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  errorContainer: {
    margin: 20,
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noProfileText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  accessTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  accessMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  accessLoader: {
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});