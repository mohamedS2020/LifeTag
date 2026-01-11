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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { LoadingOverlay } from '../components/common';
import { Card, Button, Badge, H2, H3, H4, Body, BodySmall, Caption } from '../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

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
        color: colors.status.info.main,
        onPress: () => navigation.navigate('ProfileDisplay'),
      },
      {
        id: 'edit-profile',
        title: 'Edit Profile',
        subtitle: 'Update emergency information',
        icon: 'person-circle',
        color: colors.status.warning.main,
        onPress: () => navigation.navigate('ProfileForm'),
      },
      {
        id: 'access-history',
        title: 'Profile Access History',
        subtitle: 'View who accessed your profile',
        icon: 'eye-outline',
        color: colors.primary.main,
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
        color: colors.status.error.main,
        onPress: () => navigation.navigate('MedPro'),
      });
    }

    return actions;
  };

  const renderWelcomeCard = () => (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <Card variant="elevated" style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeIconContainer}>
            <Ionicons name="heart-circle" size={32} color={colors.primary.main} />
          </View>
          <View style={styles.welcomeText}>
            <H3 style={styles.welcomeTitle}>
              Welcome back{profile?.personalInfo?.firstName ? `, ${profile.personalInfo.firstName}` : ''}!
            </H3>
            <BodySmall color="secondary">
              {user?.userType === 'medical_professional' && user?.isVerified 
                ? 'Verified Medical Professional' 
                : user?.userType === 'medical_professional' && !user?.isVerified
                ? 'Medical Professional - Awaiting Verification'
                : 'Emergency Medical Information System'}
            </BodySmall>
          </View>
        </View>
        
        {user?.userType === 'medical_professional' && user?.isVerified && (
          <Badge 
            label="Verified Professional" 
            variant="success" 
            icon="checkmark-circle" 
            style={styles.statusBadge}
          />
        )}
        
        {user?.userType === 'medical_professional' && !user?.isVerified && (
          <Badge 
            label="Pending Verification" 
            variant="warning" 
            icon="time-outline"
            pulse
            style={styles.statusBadge}
          />
        )}
      </Card>
    </Animated.View>
  );

  const renderProfileStatus = () => {
    if (profileCompletion === 100) return null;
    
    return (
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Card variant="default" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <H4>Profile Status</H4>
            <Text style={styles.completionPercentage}>{profileCompletion}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { width: `${profileCompletion}%` }
                ]} 
              />
            </View>
          </View>
          
          <BodySmall color="secondary" style={styles.statusDescription}>
            {profileCompletion < 50 
              ? 'Complete your profile for better emergency response'
              : profileCompletion < 100 
              ? 'Almost done! Add remaining details'
              : 'Profile complete and ready for emergencies'}
          </BodySmall>
          
          {profileCompletion < 100 && (
            <Button
              title="Complete Profile"
              onPress={() => navigation.navigate('ProfileForm')}
              icon="arrow-forward"
              iconPosition="right"
              size="sm"
              style={styles.completeProfileButton}
            />
          )}
        </Card>
      </Animated.View>
    );
  };

  const renderQuickActions = () => {
    const actions = getQuickActions();
    
    return (
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.quickActionsContainer}>
        <H4 style={styles.sectionTitle}>Quick Actions</H4>
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <Animated.View 
              key={action.id}
              entering={FadeInDown.delay(350 + index * 50).duration(300)}
            >
              <Card
                variant="default"
                onPress={action.onPress}
                style={{ ...styles.actionCard, borderLeftColor: action.color }}
              >
                <View style={styles.actionIconContainer}>
                  <View style={[styles.actionIconBg, { backgroundColor: `${action.color}20` }]}>
                    <Ionicons name={action.icon} size={22} color={action.color} />
                  </View>
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
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </Card>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderEmergencyInfo = () => {
    if (!profile?.personalInfo) return null;

    return (
      <Animated.View entering={FadeInDown.delay(250).duration(400)}>
        <Card variant="default" style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning" size={22} color={colors.medical.emergency} />
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
          
          <Button
            title="Show Emergency QR Code"
            onPress={() => navigation.navigate('QRDisplay')}
            variant="danger"
            icon="qr-code-outline"
          />
        </Card>
      </Animated.View>
    );
  };

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={20} color={colors.status.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <Button
              title="Retry"
              onPress={loadDashboardData}
              variant="danger"
              size="sm"
              fullWidth={false}
            />
          </Animated.View>
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
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.status.error.background,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.error.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error.main,
    flex: 1,
  },
  
  // Welcome Card
  welcomeCard: {
    margin: spacing.lg,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  welcomeText: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  welcomeTitle: {
    marginBottom: spacing.xxs,
  },
  statusBadge: {
    marginTop: spacing.md,
  },
  
  // Profile Status Card
  statusCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completionPercentage: {
    ...typography.h3,
    color: colors.primary.main,
  },
  progressBarContainer: {
    marginBottom: spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.status.success.main,
    borderRadius: borderRadius.full,
  },
  statusDescription: {
    marginBottom: spacing.md,
  },
  completeProfileButton: {
    alignSelf: 'flex-start',
  },
  
  // Quick Actions
  quickActionsContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  actionsGrid: {
    gap: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingVertical: spacing.md,
  },
  actionIconContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.status.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  
  // Emergency Info Card
  emergencyCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.medical.emergency,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  emergencyTitle: {
    ...typography.h4,
    color: colors.medical.emergency,
  },
  emergencyContent: {
    marginBottom: spacing.lg,
  },
  emergencyItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  emergencyLabel: {
    ...typography.label,
    color: colors.text.secondary,
    width: 120,
  },
  emergencyValue: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  
  bottomSpacing: {
    height: spacing.xl,
  },
});

export default HomeScreen;