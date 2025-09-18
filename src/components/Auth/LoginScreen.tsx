

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
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
      setEmailError('Email is required');
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
      setEmailError('Invalid email format');
      return false;
    }
    
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password validation with security checks
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    // Security check for malicious input
    const securityCheck = isSecureInput(password);
    if (!securityCheck.isSecure) {
      setPasswordError('Invalid password format');
      return false;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
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
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>LifeTag</Text>
            <Text style={styles.subtitle}>Emergency Medical Information</Text>
            <Text style={styles.description}>
              Sign in to access your medical profile and QR code
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor="#999"
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
              />
              <FieldError error={emailError} />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Enter your password"
                placeholderTextColor="#999"
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
              />
              <FieldError error={passwordError} />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, (loading || isSubmitting) ? styles.buttonDisabled : null]}
              onPress={handleLogin}
              disabled={loading || isSubmitting}
            >
              {loading || isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={handleNavigateToRegister}
                disabled={loading || isSubmitting}
              >
                <Text style={[styles.registerLink, (loading || isSubmitting) ? styles.linkDisabled : null]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Emergency Access Info */}
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyTitle}>Emergency Access</Text>
            <Text style={styles.emergencyText}>
              In case of emergency, medical professionals can scan your QR code 
              for immediate access to critical information.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    marginTop: 4,
  },
  loginButton: {
    height: 50,
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '600',
  },
  linkDisabled: {
    color: '#CCC',
  },
  emergencyInfo: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default LoginScreen;