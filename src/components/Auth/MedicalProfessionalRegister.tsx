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

interface MedicalProfessionalRegisterProps {
  navigation?: any; // Will be properly typed when navigation is set up
  onNavigateToLogin?: () => void;
  onNavigateToRegularRegister?: () => void;
  onRegisterSuccess?: () => void;
}

const MedicalProfessionalRegister: React.FC<MedicalProfessionalRegisterProps> = ({ 
  navigation, 
  onNavigateToLogin,
  onNavigateToRegularRegister,
  onRegisterSuccess 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    licenseNumber: '',
    specialty: '',
    institution: ''
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    licenseNumber: '',
    specialty: '',
    institution: ''
  });

  const { register, loading } = useAuth();

  // Update form data
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validation functions
  const validateEmailField = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePasswordField = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return false;
    }
    if (!/(?=.*[a-z])/.test(password)) {
      setErrors(prev => ({ ...prev, password: 'Password must contain at least one lowercase letter' }));
      return false;
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      setErrors(prev => ({ ...prev, password: 'Password must contain at least one uppercase letter' }));
      return false;
    }
    if (!/(?=.*\d)/.test(password)) {
      setErrors(prev => ({ ...prev, password: 'Password must contain at least one number' }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPasswordField = (confirmPassword: string, password: string): boolean => {
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

  const validateFullNameField = (fullName: string): boolean => {
    if (!fullName) {
      setErrors(prev => ({ ...prev, fullName: 'Full name is required' }));
      return false;
    }
    if (fullName.length < 2) {
      setErrors(prev => ({ ...prev, fullName: 'Full name must be at least 2 characters' }));
      return false;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(fullName)) {
      setErrors(prev => ({ ...prev, fullName: 'Full name can only contain letters, spaces, hyphens, and apostrophes' }));
      return false;
    }
    setErrors(prev => ({ ...prev, fullName: '' }));
    return true;
  };

  const validateLicenseNumberField = (licenseNumber: string): boolean => {
    if (!licenseNumber) {
      setErrors(prev => ({ ...prev, licenseNumber: 'License number is required' }));
      return false;
    }
    if (licenseNumber.length < 3) {
      setErrors(prev => ({ ...prev, licenseNumber: 'License number must be at least 3 characters' }));
      return false;
    }
    // Basic alphanumeric validation for license numbers
    if (!/^[A-Za-z0-9-]+$/.test(licenseNumber)) {
      setErrors(prev => ({ ...prev, licenseNumber: 'License number can only contain letters, numbers, and hyphens' }));
      return false;
    }
    setErrors(prev => ({ ...prev, licenseNumber: '' }));
    return true;
  };

  const validateSpecialtyField = (specialty: string): boolean => {
    if (!specialty) {
      setErrors(prev => ({ ...prev, specialty: 'Medical specialty is required' }));
      return false;
    }
    if (specialty.length < 2) {
      setErrors(prev => ({ ...prev, specialty: 'Specialty must be at least 2 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, specialty: '' }));
    return true;
  };

  const validateInstitutionField = (institution: string): boolean => {
    if (!institution) {
      setErrors(prev => ({ ...prev, institution: 'Institution/Hospital is required' }));
      return false;
    }
    if (institution.length < 2) {
      setErrors(prev => ({ ...prev, institution: 'Institution name must be at least 2 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, institution: '' }));
    return true;
  };

  // Handle form submission
  const handleRegister = async (): Promise<void> => {
    // Validate all fields using centralized validation
    const isEmailValid = validateEmailField(formData.email);
    const isPasswordValid = validatePasswordField(formData.password);
    const isConfirmPasswordValid = validateConfirmPasswordField(formData.confirmPassword, formData.password);
    const isFullNameValid = validateFullNameField(formData.fullName);
    const isLicenseNumberValid = validateLicenseNumberField(formData.licenseNumber);
    const isSpecialtyValid = validateSpecialtyField(formData.specialty);
    const isInstitutionValid = validateInstitutionField(formData.institution);

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || 
        !isFullNameValid || !isLicenseNumberValid || !isSpecialtyValid || !isInstitutionValid) {
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        'medical_professional',
        {
          fullName: formData.fullName,
          licenseNumber: formData.licenseNumber,
          specialty: formData.specialty,
          institution: formData.institution
        }
      );
      
      // Clear form on success
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        licenseNumber: '',
        specialty: '',
        institution: ''
      });
      
      // Show success message with verification info
      Alert.alert(
        'Registration Submitted!',
        'Your medical professional account has been created. Please note that your account requires manual verification by our admin team before you can access full patient profiles. You will receive an email notification once your account is verified.',
        [{ text: 'OK' }]
      );
      
      // Navigate or callback
      if (onRegisterSuccess) {
        onRegisterSuccess();
      } else if (navigation) {
        navigation.navigate('Login');
      }
      
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'An error occurred during registration. Please try again.',
        [{ text: 'OK' }]
      );
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

  // Handle navigation to regular registration
  const handleNavigateToRegularRegister = (): void => {
    if (onNavigateToRegularRegister) {
      onNavigateToRegularRegister();
    } else if (navigation) {
      navigation.navigate('Register');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Medical Professional</Text>
            <Text style={styles.subtitle}>Register for verified access to patient profiles</Text>
          </View>

          {/* Verification Notice */}
          <View style={styles.verificationNotice}>
            <Text style={styles.noticeTitle}>⚕️ Verification Required</Text>
            <Text style={styles.noticeText}>
              Medical professional accounts require manual verification. 
              You'll be notified via email once approved by our admin team.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.fullName ? styles.inputError : null]}
                placeholder="Dr. John Smith"
                placeholderTextColor="#999"
                value={formData.fullName}
                onChangeText={(text) => updateFormData('fullName', text)}
                onBlur={() => validateFullNameField(formData.fullName)}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            {/* Medical License Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Medical License Number *</Text>
              <TextInput
                style={[styles.input, errors.licenseNumber ? styles.inputError : null]}
                placeholder="e.g., MD123456 or 12345-MD"
                placeholderTextColor="#999"
                value={formData.licenseNumber}
                onChangeText={(text) => updateFormData('licenseNumber', text)}
                onBlur={() => validateLicenseNumberField(formData.licenseNumber)}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.licenseNumber ? <Text style={styles.errorText}>{errors.licenseNumber}</Text> : null}
              <Text style={styles.fieldHint}>
                Enter your state medical license number (will be verified)
              </Text>
            </View>

            {/* Medical Specialty */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Medical Specialty *</Text>
              <TextInput
                style={[styles.input, errors.specialty ? styles.inputError : null]}
                placeholder="e.g., Emergency Medicine, Cardiology"
                placeholderTextColor="#999"
                value={formData.specialty}
                onChangeText={(text) => updateFormData('specialty', text)}
                onBlur={() => validateSpecialtyField(formData.specialty)}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.specialty ? <Text style={styles.errorText}>{errors.specialty}</Text> : null}
            </View>

            {/* Institution/Hospital */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Institution/Hospital *</Text>
              <TextInput
                style={[styles.input, errors.institution ? styles.inputError : null]}
                placeholder="e.g., City General Hospital"
                placeholderTextColor="#999"
                value={formData.institution}
                onChangeText={(text) => updateFormData('institution', text)}
                onBlur={() => validateInstitutionField(formData.institution)}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.institution ? <Text style={styles.errorText}>{errors.institution}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Professional Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="doctor@hospital.com"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                onBlur={() => validateEmailField(formData.email)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              <Text style={styles.fieldHint}>
                Use your professional/institutional email address
              </Text>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                placeholder="Create a secure password"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                onBlur={() => validatePasswordField(formData.password)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              <Text style={styles.fieldHint}>
                8+ characters with uppercase, lowercase, and number
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                onBlur={() => validateConfirmPasswordField(formData.confirmPassword, formData.password)}
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
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Submit for Verification</Text>
              )}
            </TouchableOpacity>

            {/* Navigation Links */}
            <View style={styles.navigationContainer}>
              <TouchableOpacity 
                onPress={handleNavigateToRegularRegister}
                disabled={loading}
                style={styles.navigationButton}
              >
                <Text style={styles.navigationText}>Register as Individual</Text>
              </TouchableOpacity>
              
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity 
                  onPress={handleNavigateToLogin}
                  disabled={loading}
                >
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  verificationNotice: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginBottom: 24,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#1976D2',
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
  navigationContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  navigationButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navigationText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '600',
  },
});

export default MedicalProfessionalRegister;