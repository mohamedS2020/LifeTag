/**
 * ProfileForm Component
 * Multi-step form for creating and editing user profiles
 * Handles personal info, medical info, emergency contacts, and privacy settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { 
  UserProfile, 
  PersonalInfo, 
  MedicalInfo,
  EmergencyContact,
  PrivacySettings,
  BloodType,
  ValidationResult 
} from '../../types';
import { 
  BLOOD_TYPES, 
  RELATIONSHIP_TYPES 
} from '../../types/profileConstants';
import { 
  validateProfile,
  validatePersonalInfo,
  validateMedicalInfo,
  validateEmergencyContacts,
  calculateProfileCompletion 
} from '../../utils/profileValidation';
import { profileService, passwordService } from '../../services';
import { LoadingOverlay } from '../common/LoadingOverlay';

// =============================================
// INTERFACES
// =============================================

export interface ProfileFormProps {
  userId: string;
  initialProfile?: UserProfile | null;
  mode: 'create' | 'edit';
  onSuccess?: (profile: UserProfile) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

interface FormState {
  personalInfo: Partial<PersonalInfo>;
  medicalInfo: Partial<MedicalInfo>;
  emergencyContacts: EmergencyContact[];
  privacySettings: Partial<PrivacySettings>;
}

interface FormErrors {
  [key: string]: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Get color for password strength indicator
 */
const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return '#FF6B6B';
    case 'medium':
      return '#FFE66D';
    case 'strong':
      return '#4ECDC4';
    default:
      return '#999';
  }
};

// =============================================
// MAIN COMPONENT
// =============================================

export const ProfileForm: React.FC<ProfileFormProps> = ({
  userId,
  initialProfile,
  mode,
  onSuccess,
  onCancel,
  onError
}) => {
  // =============================================
  // STATE MANAGEMENT
  // =============================================

  const [formState, setFormState] = useState<FormState>({
    personalInfo: {},
    medicalInfo: { 
      allergies: [], 
      medications: [], 
      medicalConditions: [], 
      surgeries: [],
      specialists: []
    },
    emergencyContacts: [],
    privacySettings: {
      allowEmergencyAccess: true,
      allowMedicalProfessionalAccess: true,
      requirePasswordForFullAccess: false,
      visibleFields: {
        personalInfo: {
          name: true,
          dateOfBirth: true,
          gender: true,
          phoneNumber: true,
          address: true
        },
        medicalInfo: {
          bloodType: true,
          allergies: true,
          medications: true,
          medicalConditions: true,
          emergencyMedicalInfo: true,
          primaryPhysician: true
        },
        emergencyContacts: true
      },
      enableAuditLogging: true,
      notifyOnAccess: false
    }
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Password-related state
  const [profilePassword, setProfilePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const steps = ['Personal Info', 'Medical Info', 'Emergency Contacts', 'Privacy'];

  // =============================================
  // INITIALIZATION
  // =============================================

  useEffect(() => {
    if (mode === 'edit' && !initialProfile) {
      loadExistingProfile();
    } else if (initialProfile) {
      populateForm(initialProfile);
    }
  }, [userId, mode, initialProfile]);

  const loadExistingProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await profileService.getProfile(userId);
      if (response.success && response.data) {
        populateForm(response.data);
      } else {
        setErrors({ general: 'Failed to load profile data' });
      }
    } catch (error) {
      console.error('Load profile error:', error);
      setErrors({ general: 'Failed to load profile data' });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const populateForm = (profile: UserProfile) => {
    setFormState({
      personalInfo: { ...profile.personalInfo },
      medicalInfo: { ...profile.medicalInfo },
      emergencyContacts: [...profile.emergencyContacts],
      privacySettings: { ...profile.privacySettings }
    });
  };

  // =============================================
  // FORM HANDLERS
  // =============================================

  const updatePersonalInfo = useCallback((field: keyof PersonalInfo, value: any) => {
    setFormState(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const updateMedicalInfo = useCallback((field: keyof MedicalInfo, value: any) => {
    setFormState(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        [field]: value
      }
    }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const addEmergencyContact = () => {
    const newContact: EmergencyContact = {
      id: `temp_${Date.now()}`,
      name: '',
      phoneNumber: '',
      relationship: 'other',
      isPrimary: formState.emergencyContacts.length === 0
    };

    setFormState(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, newContact]
    }));
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: any) => {
    setFormState(prev => {
      const updatedContacts = [...prev.emergencyContacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value
      };

      // If setting as primary, unset others
      if (field === 'isPrimary' && value === true) {
        updatedContacts.forEach((contact, i) => {
          if (i !== index) {
            contact.isPrimary = false;
          }
        });
      }

      return {
        ...prev,
        emergencyContacts: updatedContacts
      };
    });
  };

  const removeEmergencyContact = (index: number) => {
    setFormState(prev => {
      const updatedContacts = prev.emergencyContacts.filter((_, i) => i !== index);
      
      // If we removed the primary contact, make the first one primary
      if (updatedContacts.length > 0 && !updatedContacts.some(c => c.isPrimary)) {
        updatedContacts[0].isPrimary = true;
      }

      return {
        ...prev,
        emergencyContacts: updatedContacts
      };
    });
  };

  // =============================================
  // VALIDATION
  // =============================================

  const validateCurrentStep = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {};

    switch (currentStep) {
      case 0: // Personal Info
        if (!formState.personalInfo.firstName?.trim()) {
          newErrors.firstName = 'First name is required';
          isValid = false;
        }
        if (!formState.personalInfo.lastName?.trim()) {
          newErrors.lastName = 'Last name is required';
          isValid = false;
        }
        if (!formState.personalInfo.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
          isValid = false;
        }
        break;

      case 1: // Medical Info
        if (!formState.medicalInfo.bloodType) {
          newErrors.bloodType = 'Blood type is required';
          isValid = false;
        }
        break;

      case 2: // Emergency Contacts
        if (formState.emergencyContacts.length === 0) {
          newErrors.emergencyContacts = 'At least one emergency contact is required';
          isValid = false;
        }
        formState.emergencyContacts.forEach((contact, index) => {
          if (!contact.name.trim()) {
            newErrors[`contact_${index}_name`] = 'Contact name is required';
            isValid = false;
          }
          if (!contact.phoneNumber.trim()) {
            newErrors[`contact_${index}_phone`] = 'Contact phone number is required';
            isValid = false;
          }
        });
        break;

      case 3: // Privacy Settings
        // Validate password if password protection is enabled
        if (formState.privacySettings.requirePasswordForFullAccess) {
          if (!profilePassword.trim()) {
            setPasswordError('Password is required when password protection is enabled');
            isValid = false;
          } else if (profilePassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            isValid = false;
          } else {
            const passwordValidation = passwordService.validateProfilePassword(profilePassword);
            if (!passwordValidation.isValid) {
              setPasswordError(passwordValidation.error || 'Invalid password');
              isValid = false;
            } else {
              setPasswordError('');
            }
          }
        } else {
          setPasswordError('');
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateFullForm = (): boolean => {
    const profileData: Partial<UserProfile> = {
      personalInfo: formState.personalInfo as PersonalInfo,
      medicalInfo: formState.medicalInfo as MedicalInfo,
      emergencyContacts: formState.emergencyContacts,
      privacySettings: formState.privacySettings as PrivacySettings
    };

    const validation = validateProfile(profileData);
    if (!validation.isValid) {
      setErrors({ general: validation.error || 'Please check all fields and try again' });
    }

    return validation.isValid;
  };

  // =============================================
  // FORM SUBMISSION
  // =============================================

  const handleSubmit = async () => {
    if (!validateFullForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Prepare privacy settings with hashed password if needed
      let privacySettings = { ...formState.privacySettings };
      
      if (privacySettings.requirePasswordForFullAccess && profilePassword) {
        privacySettings.profilePassword = passwordService.hashPassword(profilePassword);
      }

      const profileData: Partial<UserProfile> = {
        personalInfo: formState.personalInfo as PersonalInfo,
        medicalInfo: formState.medicalInfo as MedicalInfo,
        emergencyContacts: formState.emergencyContacts,
        privacySettings: privacySettings as PrivacySettings
      };

      let response;
      if (mode === 'create') {
        response = await profileService.createProfile(userId, profileData);
      } else {
        response = await profileService.updateProfile(userId, profileData);
      }

      if (response.success && response.data) {
        onSuccess?.(response.data);
      } else {
        const errorMessage = response.error?.message || 'Failed to save profile';
        setErrors({ general: errorMessage });
        onError?.(errorMessage);
      }
    } catch (error: any) {
      console.error('Profile submission error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // NAVIGATION
  // =============================================

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel?.();
    }
  };

  // =============================================
  // RENDER METHODS
  // =============================================

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            index <= currentStep ? styles.stepActiveCircle : styles.stepInactiveCircle
          ]}>
            <Text style={[
              styles.stepNumber,
              index <= currentStep ? styles.stepActiveText : styles.stepInactiveText
            ]}>
              {index + 1}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            index === currentStep ? styles.stepActiveLabel : styles.stepInactiveLabel
          ]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Enter your basic personal information for emergency identification
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          value={formState.personalInfo.firstName || ''}
          onChangeText={(value) => updatePersonalInfo('firstName', value)}
          placeholder="Enter your first name"
          autoCapitalize="words"
        />
        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={[styles.input, errors.lastName && styles.inputError]}
          value={formState.personalInfo.lastName || ''}
          onChangeText={(value) => updatePersonalInfo('lastName', value)}
          placeholder="Enter your last name"
          autoCapitalize="words"
        />
        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={[styles.input, errors.dateOfBirth && styles.inputError]}
          value={formState.personalInfo.dateOfBirth?.toISOString().split('T')[0] || ''}
          onChangeText={(value) => {
            if (value) {
              updatePersonalInfo('dateOfBirth', new Date(value));
            }
          }}
          placeholder="YYYY-MM-DD"
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
        />
        {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
        <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 1990-05-15)</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={formState.personalInfo.phoneNumber || ''}
          onChangeText={(value) => updatePersonalInfo('phoneNumber', value)}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'non-binary', label: 'Non-binary' },
            { value: 'prefer-not-to-say', label: 'Prefer not to say' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.genderButton,
                formState.personalInfo.gender === option.value && styles.genderButtonActive
              ]}
              onPress={() => updatePersonalInfo('gender', option.value)}
            >
              <Text style={[
                styles.genderText,
                formState.personalInfo.gender === option.value && styles.genderTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderMedicalInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Medical Information</Text>
      <Text style={styles.stepDescription}>
        Provide critical medical information for emergency responders
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Blood Type *</Text>
        <View style={styles.bloodTypeContainer}>
          {BLOOD_TYPES.map((bloodType) => (
            <TouchableOpacity
              key={bloodType}
              style={[
                styles.bloodTypeButton,
                formState.medicalInfo.bloodType === bloodType && styles.bloodTypeButtonActive
              ]}
              onPress={() => updateMedicalInfo('bloodType', bloodType)}
            >
              <Text style={[
                styles.bloodTypeText,
                formState.medicalInfo.bloodType === bloodType && styles.bloodTypeTextActive
              ]}>
                {bloodType}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.bloodType && <Text style={styles.errorText}>{errors.bloodType}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Height</Text>
        <TextInput
          style={styles.input}
          value={formState.medicalInfo.height || ''}
          onChangeText={(value) => updateMedicalInfo('height', value)}
          placeholder="e.g., 5'10&quot; or 178 cm"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight</Text>
        <TextInput
          style={styles.input}
          value={formState.medicalInfo.weight || ''}
          onChangeText={(value) => updateMedicalInfo('weight', value)}
          placeholder="e.g., 150 lbs or 68 kg"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Emergency Medical Information</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formState.medicalInfo.emergencyMedicalInfo || ''}
          onChangeText={(value) => updateMedicalInfo('emergencyMedicalInfo', value)}
          placeholder="Critical medical information for first responders (allergies, conditions, medications, etc.)"
          multiline
          numberOfLines={4}
        />
        <Text style={styles.helperText}>
          Include critical allergies, medical conditions, current medications, and any other information emergency responders should know immediately.
        </Text>
      </View>

      <View style={styles.switchGroup}>
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Blood Donor</Text>
          <Switch
            value={formState.medicalInfo.bloodDonorStatus || false}
            onValueChange={(value) => updateMedicalInfo('bloodDonorStatus', value)}
          />
        </View>
        
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Organ Donor</Text>
          <Switch
            value={formState.medicalInfo.organDonorStatus || false}
            onValueChange={(value) => updateMedicalInfo('organDonorStatus', value)}
          />
        </View>
      </View>
    </View>
  );

  const renderEmergencyContactsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Emergency Contacts</Text>
      <Text style={styles.stepDescription}>
        Add people to contact in case of emergency. At least one contact is required.
      </Text>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={addEmergencyContact}
      >
        <Text style={styles.addButtonText}>+ Add Emergency Contact</Text>
      </TouchableOpacity>

      {formState.emergencyContacts.map((contact, index) => (
        <View key={contact.id} style={styles.contactItem}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactTitle}>Contact {index + 1}</Text>
            {contact.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Primary</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeEmergencyContact(index)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, errors[`contact_${index}_name`] && styles.inputError]}
              value={contact.name}
              onChangeText={(value) => updateEmergencyContact(index, 'name', value)}
              placeholder="Contact name"
              autoCapitalize="words"
            />
            {errors[`contact_${index}_name`] && (
              <Text style={styles.errorText}>{errors[`contact_${index}_name`]}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors[`contact_${index}_phone`] && styles.inputError]}
              value={contact.phoneNumber}
              onChangeText={(value) => updateEmergencyContact(index, 'phoneNumber', value)}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
            {errors[`contact_${index}_phone`] && (
              <Text style={styles.errorText}>{errors[`contact_${index}_phone`]}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={contact.email || ''}
              onChangeText={(value) => updateEmergencyContact(index, 'email', value)}
              placeholder="Email address (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship</Text>
            <View style={styles.relationshipContainer}>
              {RELATIONSHIP_TYPES.slice(0, 6).map((relationship) => (
                <TouchableOpacity
                  key={relationship}
                  style={[
                    styles.relationshipButton,
                    contact.relationship === relationship && styles.relationshipButtonActive
                  ]}
                  onPress={() => updateEmergencyContact(index, 'relationship', relationship)}
                >
                  <Text style={[
                    styles.relationshipText,
                    contact.relationship === relationship && styles.relationshipTextActive
                  ]}>
                    {relationship.charAt(0).toUpperCase() + relationship.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {formState.emergencyContacts.length > 1 && (
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Set as Primary Contact</Text>
              <Switch
                value={contact.isPrimary}
                onValueChange={(value) => updateEmergencyContact(index, 'isPrimary', value)}
              />
            </View>
          )}
        </View>
      ))}

      {formState.emergencyContacts.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No emergency contacts added yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Add at least one emergency contact for emergency responders to reach
          </Text>
        </View>
      )}

      {errors.emergencyContacts && (
        <Text style={styles.errorText}>{errors.emergencyContacts}</Text>
      )}
    </View>
  );

  const renderPrivacySettingsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Privacy Settings</Text>
      <Text style={styles.stepDescription}>
        Configure how your profile information can be accessed in emergency situations.
      </Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Allow Emergency Access</Text>
          <Text style={styles.settingDescription}>
            Allow emergency responders to access your basic information via QR code
          </Text>
        </View>
        <Switch
          value={formState.privacySettings.allowEmergencyAccess}
          onValueChange={(value) => setFormState(prev => ({
            ...prev,
            privacySettings: {
              ...prev.privacySettings,
              allowEmergencyAccess: value
            }
          }))}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Allow Medical Professional Access</Text>
          <Text style={styles.settingDescription}>
            Allow verified medical professionals to access additional information
          </Text>
        </View>
        <Switch
          value={formState.privacySettings.allowMedicalProfessionalAccess}
          onValueChange={(value) => setFormState(prev => ({
            ...prev,
            privacySettings: {
              ...prev.privacySettings,
              allowMedicalProfessionalAccess: value
            }
          }))}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Require Password for Full Access</Text>
          <Text style={styles.settingDescription}>
            Require additional authentication for complete profile access via app
          </Text>
        </View>
        <Switch
          value={formState.privacySettings.requirePasswordForFullAccess}
          onValueChange={(value) => {
            setFormState(prev => ({
              ...prev,
              privacySettings: {
                ...prev.privacySettings,
                requirePasswordForFullAccess: value
              }
            }));
            // Clear password fields when disabling password protection
            if (!value) {
              setProfilePassword('');
              setConfirmPassword('');
              setPasswordError('');
            }
          }}
        />
      </View>

      {/* Password Setup Section */}
      {formState.privacySettings.requirePasswordForFullAccess && (
        <View style={styles.passwordSection}>
          <Text style={styles.passwordSectionTitle}>Set Profile Password</Text>
          <Text style={styles.passwordSectionDescription}>
            This password will be required to access your full profile information through the app.
          </Text>

          <View style={styles.passwordInputContainer}>
            <Text style={styles.label}>Profile Password</Text>
            <View style={styles.passwordFieldContainer}>
              <TextInput
                style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                placeholder="Enter profile password"
                value={profilePassword}
                onChangeText={setProfilePassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.passwordInputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.passwordInput, passwordError ? styles.inputError : null]}
              placeholder="Confirm profile password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {passwordError ? (
            <Text style={styles.passwordError}>{passwordError}</Text>
          ) : null}

          {profilePassword && (
            <View style={styles.passwordStrengthContainer}>
              <Text style={styles.passwordStrengthLabel}>Password Strength:</Text>
              <Text style={[
                styles.passwordStrengthText,
                { color: getPasswordStrengthColor(passwordService.validateProfilePassword(profilePassword).strength) }
              ]}>
                {passwordService.validateProfilePassword(profilePassword).strength.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Enable Audit Logging</Text>
          <Text style={styles.settingDescription}>
            Keep track of who accesses your profile and when
          </Text>
        </View>
        <Switch
          value={formState.privacySettings.enableAuditLogging}
          onValueChange={(value) => setFormState(prev => ({
            ...prev,
            privacySettings: {
              ...prev.privacySettings,
              enableAuditLogging: value
            }
          }))}
        />
      </View>

      <View style={styles.completionSection}>
        <Text style={styles.completionTitle}>Ready to Save</Text>
        <Text style={styles.completionText}>
          Your profile is ready to be saved. You can always edit this information later.
        </Text>
      </View>
    </View>
  );

  // =============================================
  // MAIN RENDER
  // =============================================

  if (isLoadingProfile) {
    return <LoadingOverlay visible={true} message="Loading profile..." />;
  }

  return (
    <View style={styles.container}>
      {renderStepIndicator()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && renderPersonalInfoStep()}
        {currentStep === 1 && renderMedicalInfoStep()}
        {currentStep === 2 && renderEmergencyContactsStep()}
        {currentStep === 3 && renderPrivacySettingsStep()}
      </ScrollView>

      {errors.general && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errors.general}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.nextButton]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Save Profile' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepActiveCircle: {
    backgroundColor: '#007bff',
  },
  stepInactiveCircle: {
    backgroundColor: '#e9ecef',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepActiveText: {
    color: '#fff',
  },
  stepInactiveText: {
    color: '#6c757d',
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  stepActiveLabel: {
    color: '#007bff',
    fontWeight: '600',
  },
  stepInactiveLabel: {
    color: '#6c757d',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 5,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genderButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  genderText: {
    fontSize: 14,
    color: '#333',
  },
  genderTextActive: {
    color: '#fff',
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bloodTypeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    minWidth: 50,
    alignItems: 'center',
  },
  bloodTypeButtonActive: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  bloodTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bloodTypeTextActive: {
    color: '#fff',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  primaryBadge: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  relationshipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  relationshipButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  relationshipText: {
    fontSize: 12,
    color: '#333',
  },
  relationshipTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  completionSection: {
    backgroundColor: '#e7f3ff',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c5460',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#0c5460',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  backButton: {
    backgroundColor: '#6c757d',
  },
  nextButton: {
    backgroundColor: '#007bff',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Password-related styles
  passwordSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  passwordSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  passwordSectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  passwordInputContainer: {
    marginBottom: 12,
  },
  passwordFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  passwordToggleText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '500',
  },
  passwordError: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProfileForm;