/**
 * Profile Form Screen
 * Screen wrapper for ProfileForm component that handles navigation and profile loading
 * Task 7.4: Implement navigation between profile creation, QR display, scanning, and history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { ProfileForm } from '../components/Profile';
import { LoadingOverlay } from '../components/common';
import { profileService } from '../services';

interface ProfileFormScreenProps {
  navigation: any;
  route?: {
    params?: {
      mode?: 'create' | 'edit';
      profileId?: string; // For medical professionals editing other profiles
      returnTo?: string; // Screen to return to after completion
    };
  };
}

const ProfileFormScreen: React.FC<ProfileFormScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Route parameters
  const mode = route?.params?.mode || 'edit';
  const profileId = route?.params?.profileId;
  const returnTo = route?.params?.returnTo;

  // Determine which user's profile to edit
  const targetUserId = profileId || user?.id;

  useEffect(() => {
    loadProfile();
  }, [targetUserId, mode]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mode === 'create' || !targetUserId) {
        // Creating new profile
        setProfile(null);
        setLoading(false);
        return;
      }

      // Loading existing profile for editing
      const profileResponse = await profileService.getProfile(targetUserId);

      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data);
      } else if (profileResponse.error?.code === 'PROFILE_NOT_FOUND') {
        // Profile doesn't exist, switch to create mode
        setProfile(null);
      } else {
        setError(profileResponse.error?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error loading profile for editing:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (savedProfile: UserProfile) => {
    setSaving(false);
    
    const isCreate = mode === 'create' || !profile;
    const actionText = isCreate ? 'created' : 'updated';
    
    Alert.alert(
      'Profile Saved',
      `Your profile has been ${actionText} successfully.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (returnTo) {
              navigation.navigate(returnTo);
            } else {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const handleError = (errorMessage: string) => {
    setSaving(false);
    setError(errorMessage);
    Alert.alert(
      'Save Error',
      errorMessage,
      [{ text: 'OK' }]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (returnTo) {
              navigation.navigate(returnTo);
            } else {
              navigation.goBack();
            }
          }
        }
      ]
    );
  };

  const getScreenTitle = () => {
    if (profileId && profileId !== user?.id) {
      return 'Edit Profile'; // Medical professional editing someone else's profile
    }
    
    const isCreate = mode === 'create' || !profile;
    return isCreate ? 'Create Profile' : 'Edit Profile';
  };

  const getScreenSubtitle = () => {
    if (profileId && profileId !== user?.id) {
      return 'Medical professional access';
    }
    
    const isCreate = mode === 'create' || !profile;
    return isCreate 
      ? 'Set up your emergency medical information'
      : 'Update your emergency medical information';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={true} message="Loading profile..." />
      </SafeAreaView>
    );
  }

  if (error && mode === 'edit') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Error</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Load Profile</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.createButton} onPress={() => {
              setError(null);
              setProfile(null);
            }}>
              <Ionicons name="add-circle" size={20} color="#2196F3" />
              <Text style={styles.createButtonText}>Create New Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!targetUserId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-remove" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>No User Available</Text>
          <Text style={styles.errorMessage}>
            Unable to create or edit profile without user information.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getScreenSubtitle()}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {saving && (
        <LoadingOverlay visible={true} message="Saving profile..." />
      )}

      <ProfileForm
        userId={targetUserId}
        initialProfile={profile}
        mode={profile ? 'edit' : 'create'}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        onError={handleError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E3F2FD',
    marginTop: 2,
  },
  placeholder: {
    width: 40, // Same width as close button to center content
  },
  
  // Error State Styles
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
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorActions: {
    flexDirection: 'column',
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileFormScreen;