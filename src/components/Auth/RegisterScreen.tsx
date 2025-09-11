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
  handleAuthError,
  createLoadingState,
  AuthError,
  validateEmailAddress,
  validatePasswordStrength,
  validatePersonName
} from '../../utils';
import { LoadingOverlay, ErrorDisplay, FieldError, SuccessDisplay } from '../../components/common';

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
        } else if (navigation) {
          navigation.navigate('Home'); // Will be set up in navigation task
        }
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
      navigation.navigate('MedicalRegister');
    }
  };

  return (
    <>
      <LoadingOverlay 
        visible={isSubmitting}
        message={createLoadingState('register').loadingMessage}
        cancelable={false}
      />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join LifeTag to create your emergency medical profile</Text>
            </View>

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

              {/* First Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={[styles.input, errors.firstName ? styles.inputError : null]}
                  placeholder="Enter your first name"
                  placeholderTextColor="#999"
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  onBlur={() => validateName(formData.firstName, 'firstName')}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading && !isSubmitting}
                />
                <FieldError error={errors.firstName} />
              </View>

              {/* Last Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={[styles.input, errors.lastName ? styles.inputError : null]}
                  placeholder="Enter your last name"
                  placeholderTextColor="#999"
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  onBlur={() => validateName(formData.lastName, 'lastName')}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading && !isSubmitting}
                />
                <FieldError error={errors.lastName} />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  onBlur={() => validateEmail(formData.email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !isSubmitting}
                />
                <FieldError error={errors.email} />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  placeholder="Create a secure password"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  onBlur={() => validatePassword(formData.password)}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !isSubmitting}
                />
                <FieldError error={errors.password} />
                <Text style={styles.fieldHint}>
                  6+ characters with at least one letter and one number
                </Text>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                onBlur={() => validateConfirmPassword(formData.confirmPassword, formData.password)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading ? styles.buttonDisabled : null]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Medical Professional Option */}
          <View style={styles.medicalProfessionalContainer}>
            <Text style={styles.medicalProfessionalText}>
              Are you a medical professional?
            </Text>
            <TouchableOpacity
              style={styles.medicalProfessionalButton}
              onPress={handleNavigateToMedicalRegister}
              disabled={loading}
            >
              <Text style={styles.medicalProfessionalButtonText}>
                Register as Medical Professional
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleNavigateToLogin} disabled={loading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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
  fieldHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  registerButton: {
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
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  medicalProfessionalContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  medicalProfessionalText: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  medicalProfessionalButton: {
    height: 50,
    backgroundColor: '#007bff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  medicalProfessionalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
});

export default RegisterScreen;