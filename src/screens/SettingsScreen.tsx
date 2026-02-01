import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { Card, Button, Badge, H2, H4, Body, BodySmall } from '../components/ui';
import { LanguageSelector } from '../components/common';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

/**
 * Settings Screen Component
 * Displays app settings and user actions
 */
export const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { currentLanguage, getCurrentLanguageInfo } = useLanguage();
  const navigation = useNavigation();
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);

  const currentLanguageInfo = getCurrentLanguageInfo();

  /**
   * Handle user sign out
   */
  const handleSignOut = async () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert(t('common.error'), t('auth.logoutError'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="settings-outline" size={36} color={colors.primary.main} />
          </View>
          <H2 style={styles.headerTitle}>{t('settings.title')}</H2>
          <Body color="secondary" align="center">{t('settings.subtitle')}</Body>
        </Animated.View>

        {/* App Preferences Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card variant="default" style={styles.settingsSection}>
            <H4 style={styles.sectionTitle}>{t('settings.appPreferences')}</H4>
            
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => setLanguageSelectorVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconBg}>
                <Ionicons name="language-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>{t('settings.language')}</Text>
              <Text style={styles.settingValue}>{currentLanguageInfo?.nativeName || 'English'}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Coming Soon Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Card variant="default" style={styles.comingSoonSection}>
            <Badge 
              label={t('common.comingSoon')} 
              variant="warning" 
              icon="time-outline" 
              size="lg"
              style={styles.comingSoonBadge}
            />
            <BodySmall color="secondary" align="center" style={styles.comingSoonDescription}>
              {t('settings.comingSoonDescription')}
            </BodySmall>
          </Card>
        </Animated.View>

        {/* Settings Sections */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Card variant="default" style={styles.settingsSection}>
            <H4 style={styles.sectionTitle}>{t('settings.accountPrivacy')}</H4>
            
            <View style={styles.settingItem}>
              <View style={styles.settingIconBg}>
                <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>{t('settings.profileSettings')}</Text>
              <Badge label={t('common.soon')} variant="warning" size="sm" />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingIconBg}>
                <Ionicons name="shield-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>{t('settings.privacyControls')}</Text>
              <Badge label={t('common.soon')} variant="warning" size="sm" />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Card variant="default" style={styles.settingsSection}>
            <H4 style={styles.sectionTitle}>{t('settings.emergencySettings')}</H4>
            <View style={styles.settingItem}>
              <View style={styles.settingIconBg}>
                <Ionicons name="medical-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>{t('settings.emergencyContacts')}</Text>
              <Badge label={t('common.soon')} variant="warning" size="sm" />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingIconBg}>
                <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>{t('settings.alertPreferences')}</Text>
              <Badge label={t('common.soon')} variant="warning" size="sm" />
            </View>
          </Card>
        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.signOutSection}>
          <Button
            title={t('settings.signOut')}
            onPress={handleSignOut}
            variant="outline"
            icon="log-out-outline"
            iconColor={colors.status.error.main}
            style={styles.signOutButton}
            textStyle={styles.signOutText}
          />
        </Animated.View>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={languageSelectorVisible}
        onClose={() => setLanguageSelectorVisible(false)}
      />
    </SafeAreaView>
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
  contentContainer: {
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    paddingVertical: spacing.xl,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  comingSoonSection: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  comingSoonBadge: {
    marginBottom: spacing.md,
  },
  comingSoonDescription: {
    lineHeight: 22,
  },
  settingsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  settingValue: {
    ...typography.body,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  signOutSection: {
    marginTop: spacing.xl,
    marginBottom: spacing['4xl'],
  },
  signOutButton: {
    borderColor: colors.status.error.main,
  },
  signOutText: {
    color: colors.status.error.main,
  },
});