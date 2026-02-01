import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context';
import { Button, TextInput, Card, H1, Body, Caption } from '../../components/ui';
import { LoadingOverlay } from '../../components/common';
import { colors, spacing } from '../../theme';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
      setErrors(prev => ({ ...prev, email: t('validation.emailRequired') }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: t('auth.invalidEmail') }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePasswordField = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: t('validation.passwordRequired') }));
      return false;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: t('medicalProfessional.passwordMin8') }));
      return false;
    }
    if (!/(?=.*[a-z])/.test(password)) {
      setErrors(prev => ({ ...prev, password: t('medicalProfessional.passwordLowercase') }));
      return false;
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      setErrors(prev => ({ ...prev, password: t('medicalProfessional.passwordUppercase') }));
      return false;
    }
    if (!/(?=.*\d)/.test(password)) {
      setErrors(prev => ({ ...prev, password: t('medicalProfessional.passwordNumber') }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPasswordField = (confirmPassword: string, password: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: t('auth.confirmPasswordRequired') }));
      return false;
    }
    if (confirmPassword !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: t('auth.passwordsDoNotMatch') }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const validateFullNameField = (fullName: string): boolean => {
    if (!fullName) {
      setErrors(prev => ({ ...prev, fullName: t('medicalProfessional.fullNameRequired') }));
      return false;
    }
    if (fullName.length < 2) {
      setErrors(prev => ({ ...prev, fullName: t('medicalProfessional.fullNameMinLength') }));
      return false;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(fullName)) {
      setErrors(prev => ({ ...prev, fullName: t('medicalProfessional.fullNameInvalidChars') }));
      return false;
    }
    setErrors(prev => ({ ...prev, fullName: '' }));
    return true;
  };

  const validateLicenseNumberField = (licenseNumber: string): boolean => {
    if (!licenseNumber) {
      setErrors(prev => ({ ...prev, licenseNumber: t('medicalProfessional.licenseRequired') }));
      return false;
    }
    if (licenseNumber.length < 3) {
      setErrors(prev => ({ ...prev, licenseNumber: t('medicalProfessional.licenseMinLength') }));
      return false;
    }
    // Basic alphanumeric validation for license numbers
    if (!/^[A-Za-z0-9-]+$/.test(licenseNumber)) {
      setErrors(prev => ({ ...prev, licenseNumber: t('medicalProfessional.licenseInvalidChars') }));
      return false;
    }
    setErrors(prev => ({ ...prev, licenseNumber: '' }));
    return true;
  };

  const validateSpecialtyField = (specialty: string): boolean => {
    if (!specialty) {
      setErrors(prev => ({ ...prev, specialty: t('medicalProfessional.specialtyRequired') }));
      return false;
    }
    if (specialty.length < 2) {
      setErrors(prev => ({ ...prev, specialty: t('medicalProfessional.specialtyMinLength') }));
      return false;
    }
    setErrors(prev => ({ ...prev, specialty: '' }));
    return true;
  };

  const validateInstitutionField = (institution: string): boolean => {
    if (!institution) {
      setErrors(prev => ({ ...prev, institution: t('medicalProfessional.institutionRequired') }));
      return false;
    }
    if (institution.length < 2) {
      setErrors(prev => ({ ...prev, institution: t('medicalProfessional.institutionMinLength') }));
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
        t('medicalProfessional.registrationSubmitted'),
        t('medicalProfessional.registrationSubmittedMessage'),
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
        t('medicalProfessional.registrationFailed'),
        error.message || t('medicalProfessional.registrationError'),
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
    <>
      <LoadingOverlay visible={loading} message={t('medicalProfessional.submittingRegistration')} />
      
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
                <Ionicons name="medical" size={48} color={colors.primary.main} />
              </View>
              <H1 style={styles.title}>{t('medicalProfessional.title')}</H1>
              <Body style={styles.subtitle}>{t('medicalProfessional.registerSubtitle')}</Body>
            </View>

            {/* Verification Notice */}
            <Animated.View entering={FadeInDown.duration(600).delay(100)}>
              <Card variant="filled" style={styles.verificationNotice}>
                <View style={styles.noticeHeader}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.primary.main} />
                  <Body style={styles.noticeTitle}>{t('medicalProfessional.verificationRequired')}</Body>
                </View>
                <Caption style={styles.noticeText}>
                  {t('medicalProfessional.verificationNotice')}
                </Caption>
              </Card>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
              <TextInput
                label={t('medicalProfessional.fullName')}
                placeholder={t('medicalProfessional.fullNamePlaceholder')}
                value={formData.fullName}
                onChangeText={(text) => updateFormData('fullName', text)}
                onBlur={() => validateFullNameField(formData.fullName)}
                autoCapitalize="words"
                autoCorrect={false}
                error={errors.fullName}
                leftIcon="person-outline"
                editable={!loading}
              />

              <TextInput
                label={t('medicalProfessional.licenseNumber')}
                placeholder={t('medicalProfessional.licensePlaceholder')}
                value={formData.licenseNumber}
                onChangeText={(text) => updateFormData('licenseNumber', text)}
                onBlur={() => validateLicenseNumberField(formData.licenseNumber)}
                autoCapitalize="characters"
                autoCorrect={false}
                error={errors.licenseNumber}
                leftIcon="card-outline"
                hint={t('medicalProfessional.licenseHint')}
                editable={!loading}
              />

              <TextInput
                label={t('medicalProfessional.specialty')}
                placeholder={t('medicalProfessional.specialtyPlaceholder')}
                value={formData.specialty}
                onChangeText={(text) => updateFormData('specialty', text)}
                onBlur={() => validateSpecialtyField(formData.specialty)}
                autoCapitalize="words"
                autoCorrect={false}
                error={errors.specialty}
                leftIcon="fitness-outline"
                editable={!loading}
              />

              <TextInput
                label={t('medicalProfessional.institution')}
                placeholder={t('medicalProfessional.institutionPlaceholder')}
                value={formData.institution}
                onChangeText={(text) => updateFormData('institution', text)}
                onBlur={() => validateInstitutionField(formData.institution)}
                autoCapitalize="words"
                autoCorrect={false}
                error={errors.institution}
                leftIcon="business-outline"
                editable={!loading}
              />

              <TextInput
                label={t('medicalProfessional.professionalEmail')}
                placeholder={t('medicalProfessional.emailPlaceholder')}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                onBlur={() => validateEmailField(formData.email)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
                leftIcon="mail-outline"
                hint={t('medicalProfessional.emailHint')}
                editable={!loading}
              />

              <TextInput
                label={t('auth.password')}
                placeholder={t('auth.createSecurePassword')}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                onBlur={() => validatePasswordField(formData.password)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.password}
                leftIcon="lock-closed-outline"
                hint={t('medicalProfessional.passwordHint')}
                editable={!loading}
              />

              <TextInput
                label={t('auth.confirmPassword')}
                placeholder={t('auth.confirmYourPassword')}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                onBlur={() => validateConfirmPasswordField(formData.confirmPassword, formData.password)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.confirmPassword}
                leftIcon="lock-closed-outline"
                editable={!loading}
              />

              <Button
                title={t('medicalProfessional.submitForVerification')}
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.registerButton}
              />
            </Animated.View>

            {/* Navigation Links */}
            <Animated.View style={styles.navigationContainer} entering={FadeInDown.duration(600).delay(300)}>
              <Button
                title={t('medicalProfessional.registerAsIndividual')}
                variant="ghost"
                onPress={handleNavigateToRegularRegister}
                disabled={loading}
              />
              
              <View style={styles.loginContainer}>
                <Body style={styles.loginText}>{t('auth.alreadyHaveAccount')}</Body>
                <Button
                  title={t('auth.signIn')}
                  variant="ghost"
                  size="sm"
                  onPress={handleNavigateToLogin}
                  disabled={loading}
                  fullWidth={false}
                />
              </View>
              <View style={{ height: spacing.xl }} />
            </Animated.View>
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
  verificationNotice: {
    marginBottom: spacing.lg,
    backgroundColor: colors.background.elevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  noticeTitle: {
    color: colors.primary.main,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  noticeText: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  navigationContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginText: {
    color: colors.text.secondary,
  },
});

export default MedicalProfessionalRegister;