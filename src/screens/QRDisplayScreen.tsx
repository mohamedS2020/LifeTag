/**
 * QR Display Screen
 * Screen wrapper for QRDisplay component that loads user profile and displays emergency QR code
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
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { QRDisplay } from '../components/QR';
import { LoadingOverlay } from '../components/common';
import { profileService } from '../services';
import { Button, Card, H3, Body, BodySmall } from '../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { useTranslation } from 'react-i18next';

interface QRDisplayScreenProps {
  navigation: any;
  route?: {
    params?: {
      emergencyMode?: boolean;
      profileId?: string; // For medical professionals viewing other profiles
    };
  };
}

const QRDisplayScreen: React.FC<QRDisplayScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emergencyMode = route?.params?.emergencyMode || false;
  const profileId = route?.params?.profileId;

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [user?.id, profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use provided profileId or current user's ID
      const targetUserId = profileId || user?.id;
      
      if (!targetUserId) {
        setError('No user ID available');
        return;
      }

      const profileResponse = await profileService.getProfile(targetUserId);

      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data);
      } else {
        setError(profileResponse.error?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error loading profile for QR display:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    Alert.alert(
      'QR Code Error',
      errorMessage,
      [
        { text: 'Retry', onPress: loadProfile },
        { text: 'Close', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    navigation.navigate('ProfileForm');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={true} message={t('qr.loadingQR')} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('qr.qrCode')}</Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.View entering={FadeIn.duration(300)} style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="warning" size={40} color={colors.medical.emergency} />
          </View>
          <H3 style={styles.errorTitle}>{t('qr.unableToDisplayQR')}</H3>
          <Body color="secondary" align="center" style={styles.errorMessage}>
            {error || t('qr.profileDataRequired')}
          </Body>
          
          <View style={styles.errorActions}>
            <Button
              title={t('common.retry')}
              onPress={loadProfile}
              variant="danger"
              icon="refresh"
            />
            
            {!profileId && ( // Only show edit button for current user
              <Button
                title={t('profile.editProfile')}
                onPress={handleEditProfile}
                variant="outline"
                icon="person-circle"
              />
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {emergencyMode ? t('qr.emergencyQRCode') : t('qr.myQRCode')}
        </Text>
        <TouchableOpacity style={styles.headerEditButton} onPress={handleEditProfile}>
          <Ionicons name="create" size={20} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      <QRDisplay
        profile={profile}
        onError={handleError}
        emergencyMode={emergencyMode}
        fullScreen={true}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerEditButton: {
    padding: spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  
  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.medical.emergencyBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  errorTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    marginBottom: spacing['3xl'],
    lineHeight: 24,
  },
  errorActions: {
    flexDirection: 'column',
    width: '100%',
    gap: spacing.md,
  },
});

export default QRDisplayScreen;