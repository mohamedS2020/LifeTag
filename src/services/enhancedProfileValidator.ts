import { 
  UserProfile, 
  PersonalInfo, 
  MedicalInfo, 
  EmergencyContact,
  BloodType,
  ValidationResult 
} from '../types';

/**
 * Enhanced Profile Validation Service
 * Provides advanced validation rules and error recovery for profile data
 */

interface EnhancedValidationResult extends ValidationResult {
  field?: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  details?: any;
}

interface ValidationContext {
  isEmergencyMode?: boolean;
  requiredFieldsOnly?: boolean;
  skipNonCritical?: boolean;
}

/**
 * Medical-specific validation rules
 */
export class MedicalDataValidator {
  
  /**
   * Validate blood type with cross-compatibility checks
   */
  static validateBloodType(bloodType: string, context?: ValidationContext): EnhancedValidationResult {
    if (!bloodType) {
      return {
        isValid: false,
        error: 'Blood type is required for emergency medical information',
        field: 'bloodType',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      };
    }

    const validBloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    if (!validBloodTypes.includes(bloodType as BloodType)) {
      return {
        isValid: false,
        error: 'Please select a valid blood type from the list',
        field: 'bloodType',
        severity: 'error',
        code: 'INVALID_BLOOD_TYPE'
      };
    }

    return {
      isValid: true,
      error: '',
      field: 'bloodType',
      severity: 'info',
      code: 'VALIDATION_PASSED'
    };
  }

  /**
   * Validate medical allergies with severity assessment
   */
  static validateAllergies(allergies: any[], context?: ValidationContext): EnhancedValidationResult {
    if (!allergies || allergies.length === 0) {
      return {
        isValid: true,
        error: 'Consider adding any known allergies for emergency situations',
        field: 'allergies',
        severity: 'warning',
        code: 'MISSING_RECOMMENDED_INFO'
      };
    }

    // Check for critical allergy keywords
    const criticalKeywords = ['penicillin', 'latex', 'shellfish', 'peanuts', 'bee', 'wasp'];
    const hasCriticalAllergy = allergies.some(allergy => 
      criticalKeywords.some(keyword => 
        (allergy.name || allergy).toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (hasCriticalAllergy && !context?.isEmergencyMode) {
      return {
        isValid: true,
        error: 'Critical allergy detected. Ensure emergency contacts are aware.',
        field: 'allergies',
        severity: 'warning',
        code: 'CRITICAL_ALLERGY_WARNING'
      };
    }

    return {
      isValid: true,
      error: '',
      field: 'allergies',
      severity: 'info',
      code: 'VALIDATION_PASSED'
    };
  }

  /**
   * Validate emergency medical information completeness
   */
  static validateEmergencyMedicalInfo(info: string): EnhancedValidationResult {
    if (!info || info.trim().length === 0) {
      return {
        isValid: true,
        error: 'Consider adding critical medical information for emergency responders',
        field: 'emergencyMedicalInfo',
        severity: 'warning',
        code: 'MISSING_EMERGENCY_INFO'
      };
    }

    if (info.length < 10) {
      return {
        isValid: false,
        error: 'Emergency medical information should be more detailed (at least 10 characters)',
        field: 'emergencyMedicalInfo',
        severity: 'error',
        code: 'INSUFFICIENT_EMERGENCY_INFO'
      };
    }

    if (info.length > 500) {
      return {
        isValid: false,
        error: 'Emergency medical information is too long. Keep it concise for quick reading.',
        field: 'emergencyMedicalInfo',
        severity: 'error',
        code: 'EXCESSIVE_EMERGENCY_INFO'
      };
    }

    // Check for potentially sensitive information
    const sensitivePatterns = [
      /ssn|social security/i,
      /credit card|payment/i,
      /password|pin/i
    ];

    const hasSensitiveInfo = sensitivePatterns.some(pattern => pattern.test(info));
    if (hasSensitiveInfo) {
      return {
        isValid: false,
        error: 'Do not include sensitive information like SSN, credit cards, or passwords',
        field: 'emergencyMedicalInfo',
        severity: 'error',
        code: 'SENSITIVE_INFO_DETECTED'
      };
    }

    return {
      isValid: true,
      error: '',
      field: 'emergencyMedicalInfo',
      severity: 'info',
      code: 'VALIDATION_PASSED'
    };
  }
}

/**
 * Emergency contact validation with relationship analysis
 */
export class EmergencyContactValidator {
  
  /**
   * Validate emergency contact completeness and relationship appropriateness
   */
  static validateEmergencyContact(contact: EmergencyContact, index: number): EnhancedValidationResult[] {
    const results: EnhancedValidationResult[] = [];

    // Name validation
    if (!contact.name || contact.name.trim().length === 0) {
      results.push({
        isValid: false,
        error: 'Contact name is required',
        field: `emergencyContact[${index}].name`,
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    // Phone validation with international support
    if (!contact.phoneNumber) {
      results.push({
        isValid: false,
        error: 'Phone number is required for emergency contact',
        field: `emergencyContact[${index}].phoneNumber`,
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    } else {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(contact.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        results.push({
          isValid: false,
          error: 'Please enter a valid phone number',
          field: `emergencyContact[${index}].phoneNumber`,
          severity: 'error',
          code: 'INVALID_PHONE_FORMAT'
        });
      }
    }

    // Email validation (optional but if provided, must be valid)
    if (contact.email && contact.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        results.push({
          isValid: false,
          error: 'Please enter a valid email address',
          field: `emergencyContact[${index}].email`,
          severity: 'error',
          code: 'INVALID_EMAIL_FORMAT'
        });
      }
    }

    // Relationship appropriateness
    const appropriateRelationships = [
      'spouse', 'parent', 'child', 'sibling', 'partner', 
      'guardian', 'friend', 'colleague', 'neighbor', 'other'
    ];
    
    if (contact.relationship && 
        !appropriateRelationships.includes(contact.relationship.toLowerCase())) {
      results.push({
        isValid: true,
        error: 'Consider using a standard relationship type for clarity',
        field: `emergencyContact[${index}].relationship`,
        severity: 'warning',
        code: 'NON_STANDARD_RELATIONSHIP'
      });
    }

    return results;
  }

  /**
   * Validate emergency contacts list completeness
   */
  static validateEmergencyContactsList(contacts: EmergencyContact[]): EnhancedValidationResult {
    if (!contacts || contacts.length === 0) {
      return {
        isValid: false,
        error: 'At least one emergency contact is required',
        field: 'emergencyContacts',
        severity: 'error',
        code: 'NO_EMERGENCY_CONTACTS'
      };
    }

    if (contacts.length < 2) {
      return {
        isValid: true,
        error: 'Consider adding a second emergency contact for redundancy',
        field: 'emergencyContacts',
        severity: 'warning',
        code: 'SINGLE_EMERGENCY_CONTACT'
      };
    }

    // Check for primary contact designation
    const primaryContacts = contacts.filter(contact => contact.isPrimary);
    if (primaryContacts.length === 0) {
      return {
        isValid: true,
        error: 'Consider designating one contact as primary',
        field: 'emergencyContacts',
        severity: 'warning',
        code: 'NO_PRIMARY_CONTACT'
      };
    }

    if (primaryContacts.length > 1) {
      return {
        isValid: false,
        error: 'Only one emergency contact can be marked as primary',
        field: 'emergencyContacts',
        severity: 'error',
        code: 'MULTIPLE_PRIMARY_CONTACTS'
      };
    }

    return {
      isValid: true,
      error: '',
      field: 'emergencyContacts',
      severity: 'info',
      code: 'VALIDATION_PASSED'
    };
  }
}

/**
 * Profile completeness validator with scoring
 */
export class ProfileCompletenessValidator {
  
  /**
   * Calculate profile completeness score with weighted importance
   */
  static calculateCompletenessScore(profile: Partial<UserProfile>): {
    score: number;
    maxScore: number;
    percentage: number;
    criticalMissing: string[];
    recommendedMissing: string[];
  } {
    let score = 0;
    let maxScore = 0;
    const criticalMissing: string[] = [];
    const recommendedMissing: string[] = [];

    // Critical fields (weight: 10 points each)
    const criticalFields = [
      { field: 'personalInfo.firstName', value: profile.personalInfo?.firstName },
      { field: 'personalInfo.lastName', value: profile.personalInfo?.lastName },
      { field: 'personalInfo.dateOfBirth', value: profile.personalInfo?.dateOfBirth },
      { field: 'medicalInfo.bloodType', value: profile.medicalInfo?.bloodType },
      { field: 'emergencyContacts', value: profile.emergencyContacts?.length }
    ];

    criticalFields.forEach(({ field, value }) => {
      maxScore += 10;
      if (value) {
        score += 10;
      } else {
        criticalMissing.push(field);
      }
    });

    // Important fields (weight: 5 points each)
    const importantFields = [
      { field: 'personalInfo.phoneNumber', value: profile.personalInfo?.phoneNumber },
      { field: 'medicalInfo.allergies', value: profile.medicalInfo?.allergies?.length },
      { field: 'medicalInfo.emergencyMedicalInfo', value: profile.medicalInfo?.emergencyMedicalInfo }
    ];

    importantFields.forEach(({ field, value }) => {
      maxScore += 5;
      if (value) {
        score += 5;
      } else {
        recommendedMissing.push(field);
      }
    });

    // Optional fields (weight: 2 points each)
    const optionalFields = [
      { field: 'personalInfo.gender', value: profile.personalInfo?.gender },
      { field: 'medicalInfo.height', value: profile.medicalInfo?.height },
      { field: 'medicalInfo.weight', value: profile.medicalInfo?.weight }
    ];

    optionalFields.forEach(({ field, value }) => {
      maxScore += 2;
      if (value) {
        score += 2;
      } else {
        recommendedMissing.push(field);
      }
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      score,
      maxScore,
      percentage,
      criticalMissing,
      recommendedMissing
    };
  }

  /**
   * Get completion recommendations based on score
   */
  static getCompletionRecommendations(score: number): EnhancedValidationResult[] {
    const recommendations: EnhancedValidationResult[] = [];

    if (score < 50) {
      recommendations.push({
        isValid: false,
        error: 'Profile is incomplete. Please add critical information for emergency use.',
        severity: 'error',
        code: 'INCOMPLETE_PROFILE'
      });
    } else if (score < 80) {
      recommendations.push({
        isValid: true,
        error: 'Consider adding more information to improve emergency response effectiveness.',
        severity: 'warning',
        code: 'PARTIALLY_COMPLETE_PROFILE'
      });
    } else {
      recommendations.push({
        isValid: true,
        error: 'Profile is well-completed for emergency use.',
        severity: 'info',
        code: 'COMPLETE_PROFILE'
      });
    }

    return recommendations;
  }
}

/**
 * Data integrity validator
 */
export class DataIntegrityValidator {
  
  /**
   * Validate data consistency across profile sections
   */
  static validateDataConsistency(profile: Partial<UserProfile>): EnhancedValidationResult[] {
    const results: EnhancedValidationResult[] = [];

    // Check age consistency
    if (profile.personalInfo?.dateOfBirth) {
      const age = this.calculateAge(profile.personalInfo.dateOfBirth);
      
      if (age < 0) {
        results.push({
          isValid: false,
          error: 'Date of birth cannot be in the future',
          field: 'personalInfo.dateOfBirth',
          severity: 'error',
          code: 'INVALID_BIRTH_DATE'
        });
      }
      
      if (age > 150) {
        results.push({
          isValid: false,
          error: 'Please verify the date of birth - age seems unusually high',
          field: 'personalInfo.dateOfBirth',
          severity: 'error',
          code: 'IMPLAUSIBLE_AGE'
        });
      }

      if (age < 13) {
        results.push({
          isValid: true,
          error: 'Minors should have parent/guardian listed as emergency contact',
          field: 'emergencyContacts',
          severity: 'warning',
          code: 'MINOR_PROFILE_WARNING'
        });
      }
    }

    return results;
  }

  private static calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}

/**
 * Main enhanced profile validator
 */
export class EnhancedProfileValidator {
  
  /**
   * Comprehensive profile validation with context
   */
  static validateProfile(
    profile: Partial<UserProfile>, 
    context: ValidationContext = {}
  ): {
    isValid: boolean;
    errors: EnhancedValidationResult[];
    warnings: EnhancedValidationResult[];
    completionScore: any;
  } {
    const errors: EnhancedValidationResult[] = [];
    const warnings: EnhancedValidationResult[] = [];

    // Medical data validation
    if (profile.medicalInfo) {
      if (profile.medicalInfo.bloodType) {
        const bloodTypeResult = MedicalDataValidator.validateBloodType(
          profile.medicalInfo.bloodType, 
          context
        );
        if (!bloodTypeResult.isValid) {
          errors.push(bloodTypeResult);
        } else if (bloodTypeResult.severity === 'warning') {
          warnings.push(bloodTypeResult);
        }
      }

      if (profile.medicalInfo.allergies) {
        const allergiesResult = MedicalDataValidator.validateAllergies(
          profile.medicalInfo.allergies, 
          context
        );
        if (allergiesResult.severity === 'warning') {
          warnings.push(allergiesResult);
        }
      }

      if (profile.medicalInfo.emergencyMedicalInfo) {
        const emergencyInfoResult = MedicalDataValidator.validateEmergencyMedicalInfo(
          profile.medicalInfo.emergencyMedicalInfo
        );
        if (!emergencyInfoResult.isValid) {
          errors.push(emergencyInfoResult);
        } else if (emergencyInfoResult.severity === 'warning') {
          warnings.push(emergencyInfoResult);
        }
      }
    }

    // Emergency contacts validation
    if (profile.emergencyContacts) {
      const contactsListResult = EmergencyContactValidator.validateEmergencyContactsList(
        profile.emergencyContacts
      );
      if (!contactsListResult.isValid) {
        errors.push(contactsListResult);
      } else if (contactsListResult.severity === 'warning') {
        warnings.push(contactsListResult);
      }

      profile.emergencyContacts.forEach((contact, index) => {
        const contactResults = EmergencyContactValidator.validateEmergencyContact(contact, index);
        contactResults.forEach(result => {
          if (!result.isValid) {
            errors.push(result);
          } else if (result.severity === 'warning') {
            warnings.push(result);
          }
        });
      });
    }

    // Data integrity validation
    const integrityResults = DataIntegrityValidator.validateDataConsistency(profile);
    integrityResults.forEach(result => {
      if (!result.isValid) {
        errors.push(result);
      } else if (result.severity === 'warning') {
        warnings.push(result);
      }
    });

    // Completeness scoring
    const completionScore = ProfileCompletenessValidator.calculateCompletenessScore(profile);
    const completionRecommendations = ProfileCompletenessValidator.getCompletionRecommendations(
      completionScore.percentage
    );
    
    completionRecommendations.forEach(rec => {
      if (rec.severity === 'warning') {
        warnings.push(rec);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionScore
    };
  }
}

export default EnhancedProfileValidator;