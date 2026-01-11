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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { ProfileForm } from '../components/Profile';
import { LoadingOverlay } from '../components/common';
import { profileService } from '../services';
import { colors, spacing } from '../theme';
import { Button } from '../components/ui';

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
      <SafeAreaView style={styles.container} edges={[]}>
        
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Error</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="warning" size={48} color={colors.status.error.main} />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Profile</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.errorActions}>
            <Button
              title="Retry"
              onPress={loadProfile}
              icon="refresh"
              style={styles.retryButton}
            />
            
            <Button
              title="Create New Profile"
              variant="outline"
              onPress={() => {
                setError(null);
                setProfile(null);
              }}
              icon="add-circle"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!targetUserId) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="person-remove" size={48} color={colors.status.error.main} />
          </View>
          <Text style={styles.errorTitle}>No User Available</Text>
          <Text style={styles.errorMessage}>
            Unable to create or edit profile without user information.
          </Text>
          <Button
            title="Close"
            variant="outline"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
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
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.background.elevated,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  
  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.status.error.main}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  errorActions: {
    width: '100%',
    gap: spacing.sm,
  },
  retryButton: {
    marginBottom: spacing.sm,
  },
});

export default ProfileFormScreen;