import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { passwordService } from '../../services';
import { useTheme } from '../../theme';

interface PasswordVerificationModalProps {
  visible: boolean;
  onVerified: () => void;
  onCancel: () => void;
  profilePassword: string; // Hashed password to verify against
  userFirstName?: string; // For personalized messaging
}

/**
 * Password Verification Modal Component
 * Handles password verification for accessing protected profiles
 */
export const PasswordVerificationModal: React.FC<PasswordVerificationModalProps> = ({
  visible,
  onVerified,
  onCancel,
  profilePassword,
  userFirstName = 'User',
}) => {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Check if user already has valid access
  useEffect(() => {
    const checkExistingAccess = async () => {
      if (visible) {
        const hasAccess = await passwordService.hasValidTempAccess();
        if (hasAccess) {
          const timeLeft = await passwordService.getRemainingAccessTime();
          setRemainingTime(timeLeft);
          onVerified();
        }
      }
    };

    checkExistingAccess();
  }, [visible, onVerified]);

  // Update remaining time every minute
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (remainingTime !== null && remainingTime > 0) {
      interval = setInterval(async () => {
        const timeLeft = await passwordService.getRemainingAccessTime();
        setRemainingTime(timeLeft);
        
        if (!timeLeft || timeLeft <= 0) {
          setRemainingTime(null);
        }
      }, 60000); // Update every minute
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [remainingTime]);

  const handleVerify = async () => {
    if (!password.trim()) {
      Alert.alert(t('common.error'), t('passwordModal.pleaseEnterPassword'));
      return;
    }

    setIsVerifying(true);

    try {
      // Verify password
      const isValid = passwordService.verifyPassword(password, profilePassword);
      
      if (isValid) {
        // Grant temporary access
        await passwordService.grantTempAccess('profile_access');
        const timeLeft = await passwordService.getRemainingAccessTime();
        setRemainingTime(timeLeft);
        
        setPassword('');
        setAttemptCount(0);
        onVerified();
        
        Alert.alert(
          t('passwordModal.accessGranted'),
          t('passwordModal.tempAccessGranted', { name: userFirstName, minutes: timeLeft })
        );
      } else {
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        if (newAttemptCount >= 3) {
          Alert.alert(
            t('passwordModal.accessDenied'),
            t('passwordModal.tooManyAttempts'),
            [{ text: t('common.ok'), onPress: onCancel }]
          );
        } else {
          Alert.alert(
            t('passwordModal.incorrectPassword'),
            t('passwordModal.attemptsRemaining', { count: 3 - newAttemptCount })
          );
        }
        
        setPassword('');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      Alert.alert(t('common.error'), t('passwordModal.verificationError'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setAttemptCount(0);
    setShowPassword(false);
    onCancel();
  };

  const resetForm = () => {
    setPassword('');
    setAttemptCount(0);
    setShowPassword(false);
  };

  // Reset form when modal becomes visible
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '90%',
      maxWidth: 400,
    },
    modal: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: spacing.xxs,
      textAlign: 'center',
    },
    accessInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.elevated,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    accessText: {
      color: colors.primary.main,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: spacing.xxs,
    },
    inputContainer: {
      width: '100%',
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.background.elevated,
    },
    input: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: colors.text.primary,
    },
    inputDisabled: {
      color: colors.text.tertiary,
      backgroundColor: colors.background.secondary,
    },
    eyeButton: {
      padding: spacing.xs,
    },
    attemptWarning: {
      color: colors.status.error.main,
      fontSize: 12,
      marginTop: spacing.xxs,
      fontWeight: '500',
    },
    buttonContainer: {
      flexDirection: 'row',
      width: '100%',
      gap: spacing.sm,
    },
    button: {
      flex: 1,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.background.elevated,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    cancelButtonText: {
      color: colors.text.secondary,
      fontSize: 16,
      fontWeight: '500',
    },
    verifyButton: {
      backgroundColor: colors.primary.main,
    },
    verifyButtonText: {
      color: colors.text.secondary,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonDisabled: {
      backgroundColor: colors.background.elevated,
      opacity: 0.6,
    },
    helpText: {
      fontSize: 12,
      color: colors.text.tertiary,
      textAlign: 'center',
      marginTop: spacing.md,
      lineHeight: 16,
    },
  }), [colors, spacing, borderRadius, typography]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="lock-closed" size={32} color={colors.primary.main} />
              <Text style={styles.title}>{t('passwordModal.title')}</Text>
              <Text style={styles.subtitle}>
                {t('passwordModal.profileProtected', { name: userFirstName })}
              </Text>
            </View>

            {/* Remaining time indicator */}
            {remainingTime && (
              <View style={styles.accessInfo}>
                <Ionicons name="time" size={16} color={colors.status.success.main} />
                <Text style={styles.accessText}>
                  {t('passwordModal.accessExpiresIn', { minutes: remainingTime })}
                </Text>
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('passwordModal.enterPassword')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, attemptCount >= 3 && styles.inputDisabled]}
                  placeholder={t('passwordModal.passwordPlaceholder')}
                  placeholderTextColor={colors.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={attemptCount < 3 && !isVerifying}
                  onSubmitEditing={handleVerify}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={attemptCount >= 3 || isVerifying}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={attemptCount >= 3 ? colors.text.disabled : colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              {attemptCount > 0 && (
                <Text style={styles.attemptWarning}>
                  {attemptCount >= 3
                    ? t('passwordModal.tooManyAttemptsShort')
                    : t('passwordModal.attemptsRemaining', { count: 3 - attemptCount })}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isVerifying}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.verifyButton,
                  (attemptCount >= 3 || isVerifying || !password.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={attemptCount >= 3 || isVerifying || !password.trim()}
              >
                <Text style={styles.verifyButtonText}>
                  {isVerifying ? t('passwordModal.verifying') : t('passwordModal.verifyAndAccess')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <Text style={styles.helpText}>
              {t('passwordModal.helpText', { name: userFirstName })}
              {'\n'}{t('passwordModal.accessDuration')}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PasswordVerificationModal;