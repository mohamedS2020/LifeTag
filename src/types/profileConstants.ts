/**
 * Profile Constants and Enums
 * Contains constant values and enumerations for profile management
 */

// =============================================
// BLOOD TYPE CONSTANTS
// =============================================

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

// =============================================
// RELATIONSHIP TYPES
// =============================================

export const RELATIONSHIP_TYPES = [
  'spouse',
  'partner',
  'parent',
  'child',
  'sibling',
  'grandparent',
  'grandchild',
  'aunt',
  'uncle',
  'cousin',
  'friend',
  'neighbor',
  'colleague',
  'other'
] as const;

// =============================================
// MEDICAL CONDITION SEVERITIES
// =============================================

export const CONDITION_SEVERITIES = [
  'mild',
  'moderate',
  'severe',
  'critical'
] as const;

// =============================================
// GENDER OPTIONS
// =============================================

export const GENDER_OPTIONS = [
  'male',
  'female'
] as const;

// =============================================
// MEDICAL SPECIALTIES
// =============================================

export const MEDICAL_SPECIALTIES = [
  'family_medicine',
  'internal_medicine',
  'emergency_medicine',
  'cardiology',
  'dermatology',
  'endocrinology',
  'gastroenterology',
  'neurology',
  'oncology',
  'orthopedics',
  'pediatrics',
  'psychiatry',
  'radiology',
  'surgery',
  'other'
] as const;

// =============================================
// ACCESS TYPES
// =============================================

export const ACCESS_TYPES = [
  'qr_scan',
  'full_profile',
  'emergency_access',
  'profile_edit'
] as const;

export const ACCESSOR_TYPES = [
  'medical_professional',
  'individual',
  'anonymous',
  'emergency_responder'
] as const;

// =============================================
// PROFILE FIELD CATEGORIES
// =============================================

export const PROFILE_FIELD_CATEGORIES = {
  PERSONAL: [
    'firstName',
    'lastName',
    'displayName',
    'dateOfBirth',
    'gender',
    'phoneNumber',
    'address'
  ],
  MEDICAL: [
    'bloodType',
    'height',
    'weight',
    'allergies',
    'medications',
    'medicalConditions',
    'surgeries',
    'emergencyMedicalInfo',
    'primaryPhysician'
  ],
  EMERGENCY: [
    'emergencyContacts',
    'emergencyMedicalInfo'
  ],
  PRIVACY: [
    'privacySettings',
    'profilePassword'
  ]
} as const;

// =============================================
// REQUIRED FIELDS FOR PROFILE COMPLETION
// =============================================

export const REQUIRED_PROFILE_FIELDS = [
  'personalInfo.firstName',
  'personalInfo.lastName',
  'personalInfo.dateOfBirth',
  'emergencyContacts' // At least one emergency contact
] as const;

export const RECOMMENDED_PROFILE_FIELDS = [
  'personalInfo.phoneNumber',
  'medicalInfo.bloodType',
  'medicalInfo.allergies',
  'medicalInfo.medications',
  'medicalInfo.emergencyMedicalInfo'
] as const;

// =============================================
// QR CODE CONSTANTS
// =============================================

export const QR_CODE_CONFIG = {
  VERSION: '1.0',
  MAX_EMERGENCY_DATA_SIZE: 1000, // bytes
  MAX_ALLERGIES_IN_QR: 3,
  MAX_MEDICATIONS_IN_QR: 3,
  ERROR_CORRECTION_LEVEL: 'M' as const,
  SIZE: 256 // pixels
} as const;

// =============================================
// VALIDATION CONSTANTS
// =============================================

export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/
  },
  PHONE: {
    PATTERN: /^\+?[\d\s\-\(\)\.]{10,}$/
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  LICENSE_NUMBER: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z0-9\-]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false
  }
} as const;

// =============================================
// ERROR CODES
// =============================================

export const PROFILE_ERROR_CODES = {
  // Validation Errors
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_NAME: 'INVALID_NAME',
  INVALID_DATE: 'INVALID_DATE',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  
  // Profile Errors
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  PROFILE_ACCESS_DENIED: 'PROFILE_ACCESS_DENIED',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  DUPLICATE_PROFILE: 'DUPLICATE_PROFILE',
  
  // Medical Professional Errors
  LICENSE_INVALID: 'LICENSE_INVALID',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  NOT_VERIFIED: 'NOT_VERIFIED',
  
  // QR Code Errors
  QR_CODE_INVALID: 'QR_CODE_INVALID',
  QR_CODE_EXPIRED: 'QR_CODE_EXPIRED',
  QR_DATA_TOO_LARGE: 'QR_DATA_TOO_LARGE',
  
  // System Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// =============================================
// TYPE GUARDS
// =============================================

export function isBloodType(value: string): value is typeof BLOOD_TYPES[number] {
  return BLOOD_TYPES.includes(value as any);
}

export function isRelationshipType(value: string): value is typeof RELATIONSHIP_TYPES[number] {
  return RELATIONSHIP_TYPES.includes(value as any);
}

export function isConditionSeverity(value: string): value is typeof CONDITION_SEVERITIES[number] {
  return CONDITION_SEVERITIES.includes(value as any);
}

export function isGenderOption(value: string): value is typeof GENDER_OPTIONS[number] {
  return GENDER_OPTIONS.includes(value as any);
}

export function isMedicalSpecialty(value: string): value is typeof MEDICAL_SPECIALTIES[number] {
  return MEDICAL_SPECIALTIES.includes(value as any);
}