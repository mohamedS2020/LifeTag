import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context';
import { 
  handleAuthError,
  createLoadingState,
  AuthError,
  validateEmailAddress,
  validatePasswordStrength,
  validatePersonName
} from '../../utils';
import { LoadingOverlay, ErrorDisplay, FieldError, SuccessDisplay } from '../../components/common';
import { Button, TextInput, Card, H1, Body, Caption } from '../../components/ui';
import { colors, spacing } from '../../theme';

interface RegisterScreenProps {
  navigation?: any; // Will be properly typed when navigation is set up
  onNavigateToLogin?: () => void;
  onNavigateToMedicalRegister?: () => void;
  onRegisterSuccess?: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  navigation, 
  onNavigateToLogin,
  onNavigateToMedicalRegister,
  onRegisterSuccess 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { register, loading } = useAuth();

  // Update form data
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear auth error when user makes changes
    if (authError) {
      setAuthError(null);
    }
  };

  // Enhanced validation functions using utilities
  const validateEmail = (email: string): boolean => {
    const result = validateEmailAddress(email);
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, email: result.error }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    const result = validatePasswordStrength(password);
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, password: result.error }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (confirmPassword !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const validateName = (name: string, field: 'firstName' | 'lastName'): boolean => {
    const result = validatePersonName(name);
    const fieldLabel = field === 'firstName' ? 'First name' : 'Last name';
    
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, [field]: result.error }));
      return false;
    }
    setErrors(prev => ({ ...prev, [field]: '' }));
    return true;
  };

  // Handle form submission
  const handleRegister = async (): Promise<void> => {
    // Clear previous errors
    setAuthError(null);
    setSuccessMessage(null);
    
    // Validate all fields
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword, formData.password);
    const isFirstNameValid = validateName(formData.firstName, 'firstName');
    const isLastNameValid = validateName(formData.lastName, 'lastName');

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isFirstNameValid || !isLastNameValid) {
      const validationError = handleAuthError(
        { message: 'Please correct the errors above and try again.' },
        'Form Validation'
      );
      setAuthError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await register(
        formData.email,
        formData.password,
        'individual',
        {
          firstName: formData.firstName,
          lastName: formData.lastName
        }
      );
      
      // Show success message
      setSuccessMessage('Account created successfully! Welcome to LifeTag.');
      
      // Clear form on success
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
      });
      
      setErrors({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
      });
      
      // Small delay to show success message before navigating
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
        // Navigation will happen automatically via AuthContext state change
        // No manual navigation needed since we use conditional rendering
      }, 1500);
      
    } catch (error: any) {
      const parsedError = handleAuthError(error, 'Registration');
      setAuthError(parsedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation to login
  const handleNavigateToLogin = (): void => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else if (navigation) {
      navigation.navigate('Login');
    }
  };

  // Handle navigation to medical professional register
  const handleNavigateToMedicalRegister = (): void => {
    if (onNavigateToMedicalRegister) {
      onNavigateToMedicalRegister();
    } else if (navigation) {
      navigation.navigate('MedicalProfessionalRegister');
    }
  };

  return (
    <>
      <LoadingOverlay 
        visible={isSubmitting}
        message={createLoadingState('register').loadingMessage}
        cancelable={false}
      />
      
      <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            { 
              paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) : 48,
              paddingBottom: spacing.xl + 48 
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={styles.content} entering={FadeInDown.duration(600)}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="person-add" size={48} color={colors.primary.main} />
              </View>
              <H1 style={styles.title}>Create Account</H1>
              <Body style={styles.subtitle}>Join LifeTag to create your emergency medical profile</Body>
            </View>

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

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(600).delay(100)}>
              <TextInput
                label="First Name"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(text) => updateFormData('firstName', text)}
                onBlur={() => validateName(formData.firstName, 'firstName')}
                autoCapitalize="words"
                autoCorrect={false}
                error={errors.firstName}
                leftIcon="person-outline"
                editable={!loading && !isSubmitting}
              />

              <TextInput
                label="Last Name"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(text) => updateFormData('lastName', text)}
                onBlur={() => validateName(formData.lastName, 'lastName')}
                autoCapitalize="words"
                autoCorrect={false}
                error={errors.lastName}
                leftIcon="person-outline"
                editable={!loading && !isSubmitting}
              />

              <TextInput
                label="Email Address"
                placeholder="your.email@example.com"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                onBlur={() => validateEmail(formData.email)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
                leftIcon="mail-outline"
                editable={!loading && !isSubmitting}
              />

              <TextInput
                label="Password"
                placeholder="Create a secure password"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                onBlur={() => validatePassword(formData.password)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.password}
                leftIcon="lock-closed-outline"
                hint="6+ characters with at least one letter and one number"
                editable={!loading && !isSubmitting}
              />

              <TextInput
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                onBlur={() => validateConfirmPassword(formData.confirmPassword, formData.password)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.confirmPassword}
                leftIcon="lock-closed-outline"
                editable={!loading && !isSubmitting}
              />

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                disabled={loading || isSubmitting}
                style={styles.registerButton}
              />
            </Animated.View>

            {/* Medical Professional Option */}
            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
              <Card variant="outlined" style={styles.medicalProfessionalCard}>
                <View style={styles.medicalProfessionalContent}>
                  <Ionicons name="medical" size={24} color={colors.primary.main} />
                  <View style={styles.medicalProfessionalText}>
                    <Body style={styles.medicalQuestion}>Are you a medical professional?</Body>
                    <Caption>Register for verified access to patient profiles</Caption>
                  </View>
                </View>
                <Button
                  title="Register as Medical Professional"
                  variant="outline"
                  onPress={handleNavigateToMedicalRegister}
                  disabled={loading}
                  style={styles.medicalButton}
                />
              </Card>
            </Animated.View>

            {/* Login Link */}
            <Animated.View style={styles.loginContainer} entering={FadeInDown.duration(600).delay(300)}>
              <Body style={styles.loginText}>Already have an account? </Body>
              <Button
                title="Sign In"
                variant="ghost"
                size="sm"
                onPress={handleNavigateToLogin}
                disabled={loading}
                fullWidth={false}
              />
            </Animated.View>
            <View style={{ height: spacing.xl }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  content: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
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
  registerButton: {
    marginTop: spacing.md,
  },
  medicalProfessionalCard: {
    marginTop: spacing.xl,
    borderColor: colors.primary.main,
  },
  medicalProfessionalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  medicalProfessionalText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  medicalQuestion: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  medicalButton: {
    marginTop: spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    color: colors.text.secondary,
  },
});

export default RegisterScreen;