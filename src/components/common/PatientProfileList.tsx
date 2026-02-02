import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../types';
import { profileService } from '../../services';
import { useMedicalProfessionalAccess } from '../../hooks';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';

/**
 * Props for PatientProfileList component
 */
interface PatientProfileListProps {
  onProfilePress?: (profile: UserProfile) => void;
  searchQuery?: string;
  compactView?: boolean;
}

/**
 * PatientProfileList Component
 * 
 * Displays a list of patient profiles that medical professionals can access
 * - Shows profiles with medical professional access enabled
 * - Includes emergency contact information
 * - Supports search filtering and compact/detailed views
 * - Handles refresh and loading states
 */
const PatientProfileList: React.FC<PatientProfileListProps> = ({
  onProfilePress,
  searchQuery = '',
  compactView = false,
}) => {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const { t } = useTranslation();

  // Memoized styles for dynamic theming
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
    },
    listContainer: {
      paddingBottom: spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    loadingText: {
      marginTop: spacing.sm,
      fontSize: 16,
      color: colors.text.secondary,
    },
    emptyListContainer: {
      flexGrow: 1,
    },
    profileCard: {
      backgroundColor: colors.background.card,
      borderRadius: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    compactCard: {
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    profileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    profileContact: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    profileDetail: {
      fontSize: 13,
      color: colors.text.tertiary,
    },
    accessIndicators: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    indicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.background.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileDetails: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
    profileStat: {
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    alertText: {
      fontSize: 13,
      color: colors.status.error.main,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['2xl'],
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text.primary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    emptyText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['2xl'],
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.status.error.main,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    errorText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary.main,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: spacing.sm,
    },
    retryButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: '600',
    },
  }), [colors, spacing, borderRadius, typography]);

  // State management
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Medical professional access hook
  const { logProfileAccess } = useMedicalProfessionalAccess();

  /**
   * Load patient profiles that allow medical professional access
   */
  const loadPatientProfiles = async () => {
    try {
      setError(null);
      
      // Get all profiles that have medical professional access enabled
      const response = await profileService.getProfilesWithMedicalAccess();
      
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Failed to load patient profiles';
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error loading patient profiles:', error);
      setError('An error occurred while loading patient profiles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle profile press
   */
  const handleProfilePress = async (profile: UserProfile) => {
    try {
      // Log the access
      await logProfileAccess(
        profile.userId,
        `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
        'profile_list_access'
      );

      onProfilePress?.(profile);
    } catch (error) {
      console.error('Error logging profile access:', error);
      Alert.alert(t('common.error'), t('profile.failedToAccessProfile'));
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadPatientProfiles();
  };

  /**
   * Filter profiles based on search query
   */
  const filteredProfiles = profiles.filter((profile) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`.toLowerCase();
    const phoneNumber = profile.personalInfo.phoneNumber?.toLowerCase() || '';
    
    return fullName.includes(searchLower) || phoneNumber.includes(searchLower);
  });

  /**
   * Render individual profile item
   */
  const renderProfileItem = ({ item: profile }: { item: UserProfile }) => {
    const hasEmergencyContacts = profile.emergencyContacts && profile.emergencyContacts.length > 0;
    const hasMedicalInfo = profile.medicalInfo && Object.keys(profile.medicalInfo).length > 0;

    return (
      <TouchableOpacity
        style={[styles.profileCard, compactView && styles.compactCard]}
        onPress={() => handleProfilePress(profile)}
        activeOpacity={0.7}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile.personalInfo.firstName} {profile.personalInfo.lastName}
            </Text>
            {profile.personalInfo.phoneNumber && (
              <Text style={styles.profileContact}>
                {profile.personalInfo.phoneNumber}
              </Text>
            )}
            {profile.personalInfo.dateOfBirth && (
              <Text style={styles.profileDetail}>
                {t('profile.dateOfBirth')}: {new Date(profile.personalInfo.dateOfBirth).toLocaleDateString()}
              </Text>
            )}
          </View>
          
          <View style={styles.accessIndicators}>
            {hasEmergencyContacts && (
              <View style={styles.indicator}>
                <Ionicons name="people" size={16} color={colors.status.success.main} />
              </View>
            )}
            {hasMedicalInfo && (
              <View style={styles.indicator}>
                <Ionicons name="medical" size={16} color={colors.status.error.main} />
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </View>
        </View>

        {!compactView && (
          <View style={styles.profileDetails}>
            {hasEmergencyContacts && (
              <Text style={styles.profileStat}>
                {profile.emergencyContacts.length} {profile.emergencyContacts.length !== 1 ? t('profile.emergencyContacts') : t('profile.emergencyContact')}
              </Text>
            )}
            {profile.personalInfo.phoneNumber && (
              <Text style={styles.profileStat}>
                {t('profile.phone')}: {profile.personalInfo.phoneNumber}
              </Text>
            )}
            {profile.medicalInfo?.allergies && profile.medicalInfo.allergies.length > 0 && (
              <Text style={styles.alertText}>
                ⚠️ {profile.medicalInfo.allergies.length} {profile.medicalInfo.allergies.length !== 1 ? t('profile.allergies') : t('profile.allergy')}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>{t('profile.noPatientProfiles')}</Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? t('profile.noProfilesMatchSearch') 
          : t('profile.noMedicalAccessEnabled')
        }
      </Text>
    </View>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={colors.status.error.main} />
      <Text style={styles.errorTitle}>{t('profile.errorLoadingProfiles')}</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadPatientProfiles}>
        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
      </TouchableOpacity>
    </View>
  );

  // Load profiles on mount
  useEffect(() => {
    loadPatientProfiles();
  }, []);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>{t('profile.loadingPatientProfiles')}</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return renderErrorState();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProfiles}
        keyExtractor={(item) => item.userId}
        renderItem={renderProfileItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredProfiles.length === 0 ? styles.emptyListContainer : styles.listContainer}
      />
    </View>
  );
};

export default PatientProfileList;