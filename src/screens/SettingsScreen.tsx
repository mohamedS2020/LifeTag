import React from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Card, Button, Badge, H2, H4, Body, BodySmall } from '../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

/**
 * Settings Screen Component
 * Displays app settings and user actions
 */
export const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();

  /**
   * Handle user sign out
   */
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
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
          <H2 style={styles.headerTitle}>Settings</H2>
          <Body color="secondary" align="center">Manage your account and preferences</Body>
        </Animated.View>

        {/* Coming Soon Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card variant="default" style={styles.comingSoonSection}>
            <Badge 
              label="Coming Soon" 
              variant="warning" 
              icon="time-outline" 
              size="lg"
              style={styles.comingSoonBadge}
            />
            <BodySmall color="secondary" align="center" style={styles.comingSoonDescription}>
              More settings and customization options will be available in upcoming updates.
            </BodySmall>
          </Card>
        </Animated.View>

        {/* Settings Sections */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Card variant="default" style={styles.settingsSection}>
            <H4 style={styles.sectionTitle}>Account & Privacy</H4>
            
            <View style={styles.settingItem}>
              <View style={styles.settingIconBg}>
                <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>Profile Settings</Text>
              <Badge label="Soon" variant="warning" size="sm" />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingIconBg}>
                <Ionicons name="shield-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>Privacy Controls</Text>
              <Badge label="Soon" variant="warning" size="sm" />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Card variant="default" style={styles.settingsSection}>
            <H4 style={styles.sectionTitle}>Emergency Settings</H4>
            <View style={styles.settingItem}>
              <View style={styles.settingIconBg}>
                <Ionicons name="medical-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>Emergency Contacts</Text>
              <Badge label="Soon" variant="warning" size="sm" />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingIconBg}>
                <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.settingText}>Alert Preferences</Text>
              <Badge label="Soon" variant="warning" size="sm" />
            </View>
          </Card>
        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.signOutSection}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            icon="log-out-outline"
            iconColor={colors.status.error.main}
            style={styles.signOutButton}
            textStyle={styles.signOutText}
          />
        </Animated.View>
      </ScrollView>
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