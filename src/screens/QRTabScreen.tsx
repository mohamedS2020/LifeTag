/**
 * QR Tab Screen
 * Provides quick access to QR-related features from the main tab
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';
import { Card, H1, Body, Caption, Badge } from '../components/ui';

interface QRTabScreenProps {
  navigation: any;
}

const QRTabScreen: React.FC<QRTabScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleShowMyQR = () => {
    navigation.navigate('QRDisplay');
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner', {
      medicalProfessionalMode: user?.userType === 'medical_professional' && user?.isVerified,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={styles.header} entering={FadeInDown.duration(500)}>
          <View style={styles.iconContainer}>
            <Ionicons name="qr-code" size={48} color={colors.primary.main} />
          </View>
          <H1 style={styles.title}>{t('qr.features')}</H1>
          <Body style={styles.subtitle}>{t('qr.quickAccess')}</Body>
        </Animated.View>

        <View style={styles.actionsContainer}>
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <TouchableOpacity onPress={handleShowMyQR} activeOpacity={0.7}>
              <Card variant="elevated" style={styles.actionButton}>
                <View style={[styles.actionIconBg, { backgroundColor: `${colors.medical.verified}20` }]}>
                  <Ionicons name="qr-code" size={28} color={colors.medical.verified} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{t('qr.showMyQR')}</Text>
                  <Caption>{t('qr.showMyQRSubtitle')}</Caption>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </Card>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(200)}>
            <TouchableOpacity onPress={handleScanQR} activeOpacity={0.7}>
              <Card variant="elevated" style={styles.actionButton}>
                <View style={[styles.actionIconBg, { backgroundColor: `${colors.primary.main}20` }]}>
                  <Ionicons name="scan" size={28} color={colors.primary.main} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{t('qr.scanQR')}</Text>
                  <Caption>
                    {t('qr.scanOthers')}
                    {user?.userType === 'medical_professional' && user?.isVerified && ` (${t('qr.professionalMode')})`}
                  </Caption>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </Card>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {user?.userType === 'medical_professional' && user?.isVerified && (
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <Card variant="filled" style={styles.professionalSection}>
              <View style={styles.professionalBadge}>
                <Ionicons name="medical" size={20} color={colors.medical.verified} />
                <Text style={styles.professionalText}>{t('qr.medicalProFeatures')}</Text>
              </View>
              <Caption style={styles.professionalDescription}>
                {t('qr.enhancedAccess')}
              </Caption>
            </Card>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  actionsContainer: {
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  
  professionalSection: {
    marginTop: spacing.xl,
    backgroundColor: `${colors.medical.verified}10`,
    borderLeftWidth: 3,
    borderLeftColor: colors.medical.verified,
  },
  professionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  professionalText: {
    marginLeft: spacing.sm,
    fontSize: 16,
    fontWeight: '600',
    color: colors.medical.verified,
  },
  professionalDescription: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export default QRTabScreen;