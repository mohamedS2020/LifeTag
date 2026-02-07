/**
 * HomeScreen - Main Dashboard
 * Task 7.3: Build HomeScreen with main dashboard and quick actions
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile } from '../types';
import { LoadingOverlay } from '../components/common';
import { Card, Button, Badge, H2, H3, H4, Body, BodySmall, Caption } from '../components/ui';
import { useTheme } from '../theme';

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
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    // Branded Header
    brandHeader: {
      backgroundColor: colors.primary.main,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    brandTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
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
      borderStartWidth: 3,
      borderWidth: 0,
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
      borderStartWidth: 3,
      borderStartColor: colors.medical.emergency,
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
      flexWrap: 'wrap',
    },
    emergencyLabel: {
      ...typography.label,
      color: colors.text.secondary,
      marginEnd: spacing.sm,
    },
    emergencyValue: {
      ...typography.body,
      color: colors.text.primary,
      flex: 1,
      flexShrink: 1,
    },
    
    bottomSpacing: {
      height: spacing.xl,
    },
  }), [colors, spacing, borderRadius, typography, shadows, isRTL]);

  // Load user profile and dashboard data
  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const profileResponse = await profileService.getProfile(user.id);
      
      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data);
        // Calculate profile completion
        const completion = calculateProfileCompletion(profileResponse.data);
        setProfileCompletion(completion);
      } else {
        setError(
          typeof profileResponse.error === 'string'
            ? profileResponse.error
            : profileResponse.error?.message || t('home.failedToLoadProfile')
        );
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(t('home.failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
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

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  // Generate quick actions based on user context
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [
      {
        id: 'view-profile',
        title: t('home.viewFullProfile'),
        subtitle: t('home.seeCompleteInfo'),
        icon: 'document-text',
        color: colors.accent.purple.main,
        onPress: () => navigation.navigate('ProfileDisplay'),
      },
      {
        id: 'edit-profile',
        title: t('home.editProfile'),
        subtitle: t('home.updateEmergencyInfo'),
        icon: 'person-circle',
        color: colors.status.warning.main,
        onPress: () => navigation.navigate('ProfileForm'),
      },
       {
        id: 'access-history',
        title: t('home.accessHistory'),
        subtitle: t('home.viewWhoAccessed'),
        icon: 'eye-outline',
        color: colors.primary.main,
        onPress: () => navigation.navigate('ProfileAccessHistory'),
      },
    ];

    // Add medical professional actions if applicable
    if (user?.userType === 'medical_professional' && user?.isVerified) {
      actions.push({
        id: 'professional-scanner',
        title: t('home.professionalScanner'),
        subtitle: t('home.verifiedAccessScanning'),
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
              {t('home.welcomeBack')}{profile?.personalInfo?.firstName ? `, ${profile.personalInfo.firstName}` : ''}!
            </H3>
            <BodySmall color="secondary">
              {user?.userType === 'medical_professional' && user?.isVerified 
                ? t('home.verifiedProfessional') 
                : user?.userType === 'medical_professional' && !user?.isVerified
                ? t('home.awaitingVerification')
                : t('home.emergencySystem')}
            </BodySmall>
          </View>
        </View>
        
        {user?.userType === 'medical_professional' && user?.isVerified && (
          <Badge 
            label={t('home.verifiedProfessional')} 
            variant="success" 
            icon="checkmark-circle" 
            style={styles.statusBadge}
          />
        )}
        
        {user?.userType === 'medical_professional' && !user?.isVerified && (
          <Badge 
            label={t('medicalProfessional.pendingVerification')} 
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
            <H4>{t('home.profileStatus')}</H4>
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
              ? t('home.profileCompleteMessage')
              : profileCompletion < 100 
              ? t('home.almostDone')
              : t('home.profileReady')}
          </BodySmall>
          
          {profileCompletion < 100 && (
            <Button
              title={t('home.completeProfile')}
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
        <H4 style={styles.sectionTitle}>{t('home.quickActions')}</H4>
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <Animated.View 
              key={action.id}
              entering={FadeInDown.delay(350 + index * 50).duration(300)}
            >
              <Card
                variant="default"
                onPress={action.onPress}
                style={{ ...styles.actionCard, borderStartColor: action.color }}
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
            <Text style={styles.emergencyTitle}>{t('home.emergencySummary')}</Text>
          </View>
          
          <View style={styles.emergencyContent}>
            {profile.medicalInfo?.bloodType && (
              <View style={styles.emergencyItem}>
                <Text style={styles.emergencyLabel}>{t('home.bloodType')}:</Text>
                <Text style={styles.emergencyValue}>{profile.medicalInfo.bloodType}</Text>
              </View>
            )}
            
            {profile.medicalInfo?.allergies && profile.medicalInfo.allergies.length > 0 && (
              <View style={styles.emergencyItem}>
                <Text style={styles.emergencyLabel}>{t('home.allergies')}:</Text>
                <Text style={styles.emergencyValue}>
                  {profile.medicalInfo.allergies.join(', ')}
                </Text>
              </View>
            )}
            
            {profile.emergencyContacts && profile.emergencyContacts.length > 0 && (
              <View style={styles.emergencyItem}>
                <Text style={styles.emergencyLabel}>{t('home.emergencyContact')}:</Text>
                <Text style={styles.emergencyValue}>
                  {profile.emergencyContacts[0].name} ({profile.emergencyContacts[0].phoneNumber})
                </Text>
              </View>
            )}
          </View>
          
          <Button
            title={t('home.showEmergencyQR')}
            onPress={() => navigation.navigate('QRDisplay')}
            variant="danger"
            icon="qr-code-outline"
          />
        </Card>
      </Animated.View>
    );
  };

  if (loading) {
    return <LoadingOverlay visible={true} message={t('home.loadingDashboard')} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary.main} />
      
      {/* Branded Header with SafeArea */}
      <SafeAreaView style={styles.brandHeader} edges={['top']}>
        <Text style={styles.brandTitle}>LifeTag</Text>
      </SafeAreaView>
      
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
              title={t('common.retry')}
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

export default HomeScreen;