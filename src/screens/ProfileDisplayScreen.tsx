import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProfileDisplay } from '../components/Profile/ProfileDisplay';
import { useAuth } from '../context/AuthContext';
import profileService from '../services/profileService';
import { MedicalProfessionalAccessService } from '../services/medicalProfessionalAccessService';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import VerifiedBadge from '../components/common/VerifiedBadge';
import { UserProfile, MedicalProfessional } from '../types';
import { useTheme } from '../theme';
import { Button } from '../components/ui';

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
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const { t } = useTranslation();
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

  const styles = useMemo(() => StyleSheet.create({
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
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginRight: spacing.sm,
    },
    verifiedBadge: {
      marginLeft: spacing.xs,
    },
    editButton: {
      backgroundColor: colors.primary.main,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
    },
    editButtonText: {
      color: colors.text.inverse,
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
      paddingBottom: spacing.lg,
    },
    errorContainer: {
      margin: spacing.lg,
    },
    noProfileContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xxl,
    },
    noProfileText: {
      fontSize: 18,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    createButton: {
      backgroundColor: colors.primary.main,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
    },
    createButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: '600',
    },
    accessContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xxl,
    },
    accessTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    accessMessage: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.lg,
    },
    accessLoader: {
      marginTop: spacing.lg,
    },
    errorText: {
      fontSize: 16,
      color: colors.status.error.main,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary.main,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    retryButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: '600',
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

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
        setError(t('profile.noProfileIdAvailable'));
        return;
      }

      // Load the profile
      const profileResponse = await profileService.getProfile(targetProfileId);
      
      if (!profileResponse.success || !profileResponse.data) {
        setError(profileResponse.error?.message || 'Profile not found');
        return;
      }

      setProfile(profileResponse.data);

      // Check access permissions
      if (!isViewingOtherProfile || targetProfileId === user?.id) {
        // Viewing own profile - always allow
        setAccessGranted(true);
      } else if (isViewingOtherProfile) {
        // Viewing other's profile
        if (isMedicalProfessional && user?.id) {
          // Medical professional - check medical access
          await checkMedicalAccess(targetProfileId);
        } else {
          // Regular user - allow access (ProfileDisplay will handle password protection)
          setAccessGranted(true);
        }
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
          {isViewingOtherProfile ? t('profile.patientProfile') : t('profile.myProfile')}
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
          <Text style={styles.editButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAccessPending = () => (
    <View style={styles.accessContainer}>
      <Text style={styles.accessTitle}>{t('profile.medicalProfessionalAccess')}</Text>
      <Text style={styles.accessMessage}>
        {t('profile.requestingAccess')}
      </Text>
      {accessLoading && (
        <ActivityIndicator size="large" color={colors.primary.main} style={styles.accessLoader} />
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return <LoadingOverlay visible={true} message={t('profile.loadingProfile')} />;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!profile) {
      return (
        <View style={styles.noProfileContainer}>
          <Text style={styles.noProfileText}>{t('profile.noProfileFound')}</Text>
          {!isViewingOtherProfile && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('ProfileForm', { mode: 'create' })}
            >
              <Text style={styles.createButtonText}>{t('profile.createProfile')}</Text>
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
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={true}
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

