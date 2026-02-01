import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context';
import { 
  validateEmailAddress, 
  sanitizeEmailInput, 
  sanitizeTextInput,
  isSecureInput,
  FormSubmissionLimiter,
  handleAuthError,
  createLoadingState,
  AuthError
} from '../../utils';
// Import directly to avoid require cycle via common/index barrel
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { ErrorDisplay, FieldError, SuccessDisplay } from '../../components/common/ErrorDisplay';
import { Button, TextInput, Card, H1, H3, Body, BodySmall, Caption } from '../../components/ui';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

interface LoginScreenProps {
  navigation?: any; // Will be properly typed when navigation is set up
  onNavigateToRegister?: () => void;
  onLoginSuccess?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  navigation, 
  onNavigateToRegister,
  onLoginSuccess 
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { login, loading } = useAuth();

  // Rate limiting for login attempts
  const loginLimiter = new FormSubmissionLimiter(5, 5); // 5 attempts per 5 minutes

  // Email validation with enhanced security
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(t('auth.requiredField'));
      return false;
    }
    
    // Enhanced validation using utility functions
    const enhancedResult = validateEmailAddress(email);
    if (!enhancedResult.isValid) {
      setEmailError(enhancedResult.error);
      return false;
    }
    
    // Security check for malicious input
    const securityCheck = isSecureInput(email);
    if (!securityCheck.isSecure) {
      setEmailError(t('auth.invalidEmail'));
      return false;
    }
    
    if (!emailRegex.test(email)) {
      setEmailError(t('auth.invalidEmail'));
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password validation with security checks
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError(t('auth.requiredField'));
      return false;
    }
    
    // Security check for malicious input
    const securityCheck = isSecureInput(password);
    if (!securityCheck.isSecure) {
      setPasswordError(t('auth.invalidEmail'));
      return false;
    }
    
    if (password.length < 6) {
      setPasswordError(t('auth.passwordMinLength'));
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle login with enhanced security and clear wrong-credential UX
  const handleLogin = async (): Promise<void> => {
    // Clear previous errors
    setAuthError(null);
    setSuccessMessage(null);
    
    // Check rate limiting
    if (!loginLimiter.canSubmit(email || 'anonymous')) {
      const remainingAttempts = loginLimiter.getRemainingAttempts(email || 'anonymous');
      const rateLimitError = handleAuthError(
        { message: 'Too many login attempts. Please wait before trying again.' },
        'Rate Limiting'
      );
      setAuthError(rateLimitError);
      return;
    }

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      const validationError = handleAuthError(
        { message: 'Please correct the errors above and try again.' },
        'Form Validation'
      );
      setAuthError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Record login attempt
      loginLimiter.recordSubmission(email || 'anonymous');
      
      // Sanitize inputs before sending to auth service
      const sanitizedEmail = sanitizeEmailInput(email);
      
      await login(sanitizedEmail, password);
      
      // Show success message
      setSuccessMessage('Login successful! Welcome back.');
      
      // Clear form on success
      setEmail('');
      setPassword('');
      setEmailError('');
      setPasswordError('');
      setAuthError(null);
      
      // Small delay to show success message before navigation
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        // Navigation will happen automatically via AuthContext state change
        // No manual navigation needed since we use conditional rendering
      }, 1000);
      
    } catch (error: any) {
  const parsedError = handleAuthError(error, 'Login');
  // Enhance UX for wrong credentials by attaching field-level errors
  // We rely on error.code propagated from authService (Firebase codes like
  // auth/wrong-password, auth/user-not-found, auth/invalid-credential)
      const code = error?.code || parsedError.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Incorrect password. Please try again.');
      }
      if (code === 'auth/user-not-found') {
        setEmailError('No account found with this email.');
      }
      setAuthError({
        ...parsedError,
        userMessage:
          code === 'auth/wrong-password' || code === 'auth/invalid-credential'
            ? 'Wrong email or password. Please try again.'
            : parsedError.userMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation to register
  const handleNavigateToRegister = (): void => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else if (navigation) {
      navigation.navigate('Register');
    }
  };

  return (
    <>
      <LoadingOverlay 
        visible={isSubmitting}
        message={createLoadingState('login').loadingMessage}
        cancelable={false}
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer,
          { 
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) : 48
          }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
            <H1 style={styles.title}>LifeTag</H1>
            <Body color="secondary" style={styles.subtitle}>{t('home.emergencySystem')}</Body>
            <BodySmall color="tertiary" align="center" style={styles.description}>
              {t('auth.loginSubtitle')}
            </BodySmall>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.form}>
            {/* Error Display */}
            <ErrorDisplay 
              error={authError} 
              onDismiss={() => setAuthError(null)}
              showDetails={true}
            />
            
            {/* Success Display */}
            <SuccessDisplay 
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
              autoHide={true}
            />

            {/* Email Input */}
            <TextInput
              label={t('auth.email')}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
                if (authError) setAuthError(null);
              }}
              onBlur={() => validateEmail(email)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !isSubmitting}
              error={emailError}
              leftIcon="mail-outline"
            />

            {/* Password Input */}
            <TextInput
              label={t('auth.password')}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
                if (authError) setAuthError(null);
              }}
              onBlur={() => validatePassword(password)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !isSubmitting}
              error={passwordError}
              leftIcon="lock-closed-outline"
            />

            {/* Forgot Password Link */}
            <View style={{ alignItems: 'flex-end', marginBottom: spacing.sm }}>
              <TouchableOpacity
                onPress={() => navigation?.navigate('ForgotPassword')}
                disabled={loading || isSubmitting}
              >
                <Text style={[styles.forgotPasswordLink, (loading || isSubmitting) ? styles.linkDisabled : null]}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Button
              title={t('auth.signIn')}
              onPress={handleLogin}
              loading={loading || isSubmitting}
              disabled={loading || isSubmitting}
              icon="log-in-outline"
              size="lg"
              style={styles.loginButton}
            />

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <BodySmall color="secondary">{t('auth.noAccount')} </BodySmall>
              <TouchableOpacity 
                onPress={handleNavigateToRegister}
                disabled={loading || isSubmitting}
              >
                <Text style={[styles.registerLink, (loading || isSubmitting) ? styles.linkDisabled : null]}>
                  {t('auth.createAccount')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Emergency Access Info */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <Card variant="outlined" style={styles.emergencyInfo}>
              <View style={styles.emergencyHeader}>
                <Ionicons name="warning-outline" size={20} color={colors.medical.emergency} />
                <Text style={styles.emergencyTitle}>Emergency Access</Text>
              </View>
              <BodySmall color="secondary" style={styles.emergencyText}>
                In case of emergency, medical professionals can scan your QR code 
                for immediate access to critical information.
              </BodySmall>
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  content: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  title: {
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  description: {
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  form: {
    marginBottom: spacing['3xl'],
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  registerLink: {
    ...typography.labelLarge,
    color: colors.primary.main,
  },
  linkDisabled: {
    color: colors.text.disabled,
  },
  forgotPasswordLink: {
    ...typography.labelLarge,
    color: colors.primary.main,
    textDecorationLine: 'underline',
    marginBottom: 2,
  },
  emergencyInfo: {
    borderLeftWidth: 3,
    borderLeftColor: colors.medical.emergency,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  emergencyTitle: {
    ...typography.labelLarge,
    color: colors.medical.emergency,
  },
  emergencyText: {
    lineHeight: 22,
  },
});

export default LoginScreen;