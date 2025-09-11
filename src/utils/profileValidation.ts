/**
 * Profile Validation Utilities
 * Contains validation functions specific to profile data
 */

import { 
  UserProfile, 
  PersonalInfo, 
  MedicalInfo, 
  EmergencyContact,
  ValidationResult,
  ProfileCompletionStatus,
  VALIDATION_RULES,
  REQUIRED_PROFILE_FIELDS,
  RECOMMENDED_PROFILE_FIELDS,
  isBloodType,
  isRelationshipType,
  isGenderOption
} from '../types';

// =============================================
// PERSONAL INFO VALIDATION
// =============================================

/**
 * Validate personal information
 */
export function validatePersonalInfo(personalInfo: Partial<PersonalInfo>): ValidationResult {
  const errors: string[] = [];

  // First Name validation
  if (!personalInfo.firstName) {
    errors.push('First name is required');
  } else if (!VALIDATION_RULES.NAME.PATTERN.test(personalInfo.firstName)) {
    errors.push('First name contains invalid characters');
  } else if (personalInfo.firstName.length < VALIDATION_RULES.NAME.MIN_LENGTH || 
             personalInfo.firstName.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    errors.push(`First name must be between ${VALIDATION_RULES.NAME.MIN_LENGTH} and ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`);
  }

  // Last Name validation
  if (!personalInfo.lastName) {
    errors.push('Last name is required');
  } else if (!VALIDATION_RULES.NAME.PATTERN.test(personalInfo.lastName)) {
    errors.push('Last name contains invalid characters');
  } else if (personalInfo.lastName.length < VALIDATION_RULES.NAME.MIN_LENGTH || 
             personalInfo.lastName.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
    errors.push(`Last name must be between ${VALIDATION_RULES.NAME.MIN_LENGTH} and ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`);
  }

  // Date of Birth validation
  if (!personalInfo.dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const birthDate = new Date(personalInfo.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (birthDate > today) {
      errors.push('Date of birth cannot be in the future');
    } else if (age > 150) {
      errors.push('Please enter a valid date of birth');
    }
  }

  // Gender validation (optional)
  if (personalInfo.gender && !isGenderOption(personalInfo.gender)) {
    errors.push('Please select a valid gender option');
  }

  // Phone number validation (optional)
  if (personalInfo.phoneNumber && !VALIDATION_RULES.PHONE.PATTERN.test(personalInfo.phoneNumber)) {
    errors.push('Please enter a valid phone number');
  }

  return {
    isValid: errors.length === 0,
    error: errors.join(', ')
  };
}

// =============================================
// MEDICAL INFO VALIDATION
// =============================================

/**
 * Validate medical information
 */
export function validateMedicalInfo(medicalInfo: Partial<MedicalInfo>): ValidationResult {
  const errors: string[] = [];

  // Blood type validation (optional)
  if (medicalInfo.bloodType && !isBloodType(medicalInfo.bloodType)) {
    errors.push('Please select a valid blood type');
  }

  // Validate allergies array
  if (medicalInfo.allergies) {
    medicalInfo.allergies.forEach((allergy, index) => {
      if (!allergy.name || allergy.name.trim().length === 0) {
        errors.push(`Allergy #${index + 1} name is required`);
      }
    });
  }

  // Validate medications array
  if (medicalInfo.medications) {
    medicalInfo.medications.forEach((medication, index) => {
      if (!medication.name || medication.name.trim().length === 0) {
        errors.push(`Medication #${index + 1} name is required`);
      }
    });
  }

  // Validate medical conditions array
  if (medicalInfo.medicalConditions) {
    medicalInfo.medicalConditions.forEach((condition, index) => {
      if (!condition.name || condition.name.trim().length === 0) {
        errors.push(`Medical condition #${index + 1} name is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    error: errors.join(', ')
  };
}

// =============================================
// EMERGENCY CONTACT VALIDATION
// =============================================

/**
 * Validate emergency contact
 */
export function validateEmergencyContact(contact: Partial<EmergencyContact>): ValidationResult {
  const errors: string[] = [];

  // Name validation
  if (!contact.name) {
    errors.push('Emergency contact name is required');
  } else if (!VALIDATION_RULES.NAME.PATTERN.test(contact.name)) {
    errors.push('Emergency contact name contains invalid characters');
  }

  // Phone number validation
  if (!contact.phoneNumber) {
    errors.push('Emergency contact phone number is required');
  } else if (!VALIDATION_RULES.PHONE.PATTERN.test(contact.phoneNumber)) {
    errors.push('Please enter a valid phone number for emergency contact');
  }

  // Relationship validation
  if (!contact.relationship) {
    errors.push('Emergency contact relationship is required');
  } else if (!isRelationshipType(contact.relationship)) {
    errors.push('Please select a valid relationship type');
  }

  // Email validation (optional)
  if (contact.email && !VALIDATION_RULES.EMAIL.PATTERN.test(contact.email)) {
    errors.push('Please enter a valid email address for emergency contact');
  }

  return {
    isValid: errors.length === 0,
    error: errors.join(', ')
  };
}

/**
 * Validate array of emergency contacts
 */
export function validateEmergencyContacts(contacts: EmergencyContact[]): ValidationResult {
  const errors: string[] = [];

  if (!contacts || contacts.length === 0) {
    errors.push('At least one emergency contact is required');
    return {
      isValid: false,
      error: errors.join(', ')
    };
  }

  // Check for primary contact
  const primaryContacts = contacts.filter(contact => contact.isPrimary);
  if (primaryContacts.length === 0) {
    errors.push('Please designate one emergency contact as primary');
  } else if (primaryContacts.length > 1) {
    errors.push('Only one emergency contact can be designated as primary');
  }

  // Validate each contact
  contacts.forEach((contact, index) => {
    const validation = validateEmergencyContact(contact);
    if (!validation.isValid) {
      errors.push(`Emergency contact #${index + 1}: ${validation.error}`);
    }
  });

  return {
    isValid: errors.length === 0,
    error: errors.join(', ')
  };
}

// =============================================
// FULL PROFILE VALIDATION
// =============================================

/**
 * Validate entire profile
 */
export function validateProfile(profile: Partial<UserProfile>): ValidationResult {
  const errors: string[] = [];

  // Validate personal info
  if (profile.personalInfo) {
    const personalValidation = validatePersonalInfo(profile.personalInfo);
    if (!personalValidation.isValid) {
      errors.push(`Personal Info: ${personalValidation.error}`);
    }
  } else {
    errors.push('Personal information is required');
  }

  // Validate medical info (optional but if provided, must be valid)
  if (profile.medicalInfo) {
    const medicalValidation = validateMedicalInfo(profile.medicalInfo);
    if (!medicalValidation.isValid) {
      errors.push(`Medical Info: ${medicalValidation.error}`);
    }
  }

  // Validate emergency contacts
  if (profile.emergencyContacts) {
    const contactsValidation = validateEmergencyContacts(profile.emergencyContacts);
    if (!contactsValidation.isValid) {
      errors.push(`Emergency Contacts: ${contactsValidation.error}`);
    }
  } else {
    errors.push('At least one emergency contact is required');
  }

  return {
    isValid: errors.length === 0,
    error: errors.join(', ')
  };
}

// =============================================
// PROFILE COMPLETION ANALYSIS
// =============================================

/**
 * Calculate profile completion status
 */
export function calculateProfileCompletion(profile: Partial<UserProfile>): ProfileCompletionStatus {
  const missingFields: string[] = [];
  const recommendedFields: string[] = [];
  
  // Check required fields
  REQUIRED_PROFILE_FIELDS.forEach(fieldPath => {
    if (!getNestedValue(profile, fieldPath)) {
      missingFields.push(fieldPath);
    }
  });

  // Check recommended fields
  RECOMMENDED_PROFILE_FIELDS.forEach(fieldPath => {
    if (!getNestedValue(profile, fieldPath)) {
      recommendedFields.push(fieldPath);
    }
  });

  // Calculate completion percentage
  const totalRequiredFields = REQUIRED_PROFILE_FIELDS.length;
  const totalRecommendedFields = RECOMMENDED_PROFILE_FIELDS.length;
  const completedRequiredFields = totalRequiredFields - missingFields.length;
  const completedRecommendedFields = totalRecommendedFields - recommendedFields.length;
  
  const requiredWeight = 0.7; // Required fields are 70% of completion
  const recommendedWeight = 0.3; // Recommended fields are 30% of completion
  
  const completionPercentage = Math.round(
    (completedRequiredFields / totalRequiredFields) * requiredWeight * 100 +
    (completedRecommendedFields / totalRecommendedFields) * recommendedWeight * 100
  );

  return {
    isComplete: missingFields.length === 0,
    completionPercentage,
    missingFields,
    recommendedFields
  };
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      if (key === 'emergencyContacts') {
        // Special case for emergency contacts - check if array has at least one item
        return current[key] && Array.isArray(current[key]) && current[key].length > 0 ? current[key] : null;
      }
      return current[key];
    }
    return null;
  }, obj);
}

/**
 * Sanitize profile data before saving
 */
export function sanitizeProfileData(profile: Partial<UserProfile>): Partial<UserProfile> {
  const sanitized = { ...profile };

  // Sanitize personal info
  if (sanitized.personalInfo) {
    sanitized.personalInfo = {
      ...sanitized.personalInfo,
      firstName: sanitized.personalInfo.firstName?.trim(),
      lastName: sanitized.personalInfo.lastName?.trim(),
      displayName: sanitized.personalInfo.displayName?.trim(),
      phoneNumber: sanitized.personalInfo.phoneNumber?.replace(/\D/g, ''), // Remove non-digits
    };
  }

  // Sanitize emergency contacts
  if (sanitized.emergencyContacts) {
    sanitized.emergencyContacts = sanitized.emergencyContacts.map(contact => ({
      ...contact,
      name: contact.name?.trim(),
      phoneNumber: contact.phoneNumber?.replace(/\D/g, ''), // Remove non-digits
      email: contact.email?.trim().toLowerCase(),
      relationship: contact.relationship?.toLowerCase()
    }));
  }

  return sanitized;
}