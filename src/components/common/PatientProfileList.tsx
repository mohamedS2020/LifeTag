import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../types';
import { profileService } from '../../services';
import { useMedicalProfessionalAccess } from '../../hooks';

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
      Alert.alert('Error', 'Failed to access profile. Please try again.');
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
                DOB: {new Date(profile.personalInfo.dateOfBirth).toLocaleDateString()}
              </Text>
            )}
          </View>
          
          <View style={styles.accessIndicators}>
            {hasEmergencyContacts && (
              <View style={styles.indicator}>
                <Ionicons name="people" size={16} color="#28A745" />
              </View>
            )}
            {hasMedicalInfo && (
              <View style={styles.indicator}>
                <Ionicons name="medical" size={16} color="#FF6B6B" />
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </View>
        </View>

        {!compactView && (
          <View style={styles.profileDetails}>
            {hasEmergencyContacts && (
              <Text style={styles.profileStat}>
                {profile.emergencyContacts.length} Emergency Contact{profile.emergencyContacts.length !== 1 ? 's' : ''}
              </Text>
            )}
            {profile.personalInfo.phoneNumber && (
              <Text style={styles.profileStat}>
                Phone: {profile.personalInfo.phoneNumber}
              </Text>
            )}
            {profile.medicalInfo?.allergies && profile.medicalInfo.allergies.length > 0 && (
              <Text style={styles.alertText}>
                ⚠️ {profile.medicalInfo.allergies.length} Allerg{profile.medicalInfo.allergies.length !== 1 ? 'ies' : 'y'}
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
      <Ionicons name="people-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No Patient Profiles</Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'No profiles match your search criteria.' 
          : 'No patient profiles have enabled medical professional access yet.'
        }
      </Text>
    </View>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#DC3545" />
      <Text style={styles.errorTitle}>Error Loading Profiles</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadPatientProfiles}>
        <Text style={styles.retryButtonText}>Retry</Text>
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
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading patient profiles...</Text>
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
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredProfiles.length === 0 ? styles.emptyListContainer : styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    padding: 12,
    marginBottom: 8,
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
    color: '#333333',
    marginBottom: 4,
  },
  profileContact: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 13,
    color: '#888888',
  },
  accessIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  profileStat: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#DC3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PatientProfileList;