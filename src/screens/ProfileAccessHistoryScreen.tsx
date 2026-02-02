import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { UserAuditLogViewer } from '../components/Profile';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

interface ProfileAccessHistoryScreenProps {
  onBack?: () => void;
  profileId?: string;
  title?: string;
}

export const ProfileAccessHistoryScreen: React.FC<ProfileAccessHistoryScreenProps> = ({
  onBack,
  profileId,
  title
}) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const finalProfileId = profileId || user?.profile?.id || user?.id;
  const screenTitle = title || t('profile.accessHistory');

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    content: {
      flex: 1,
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
    backButton: {
      padding: spacing.xs,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    infoButton: {
      padding: spacing.xs,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xxl,
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
      fontWeight: '600',
      color: colors.status.error.main,
      marginBottom: spacing.sm,
    },
    errorText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

  const showInfoAlert = () => {
    Alert.alert(
      t('profile.aboutAccessLogs'),
      t('profile.accessLogsDescription'),
      [{ text: t('common.ok') }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack || (() => navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.title}>{screenTitle}</Text>
        
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={showInfoAlert}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {finalProfileId ? (
          <UserAuditLogViewer profileId={finalProfileId} />
        ) : (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="warning-outline" size={48} color={colors.status.error.main} />
            </View>
            <Text style={styles.errorTitle}>{t('profile.noProfileFound')}</Text>
            <Text style={styles.errorText}>
              {t('profile.noAccessHistory')}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProfileAccessHistoryScreen;