// TypeScript Type Definitions
// This directory contains TypeScript interfaces and type definitions

// Export constants and enums
export * from './profileConstants';

// =============================================
// USER AUTHENTICATION TYPES
// =============================================

export interface User {
  id: string;
  email: string;
  userType: 'individual' | 'medical_professional';
  isVerified?: boolean;
  profile?: UserProfile; // Link to full profile
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// PROFILE MANAGEMENT TYPES
// =============================================

// Core profile interface
export interface UserProfile {
  id: string;
  userId: string;
  
  // Personal Information
  personalInfo: PersonalInfo;
  
  // Medical Information
  medicalInfo: MedicalInfo;
  
  // Emergency Contacts
  emergencyContacts: EmergencyContact[];
  
  // Privacy and Security
  privacySettings: PrivacySettings;
  
  // System Information
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  isComplete: boolean; // True when all required fields are filled
}

// Personal information section
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  displayName?: string; // Optional display name
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  phoneNumber?: string;
  address?: Address;
  profilePicture?: string; // URL or base64 string
}

// Address information
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Medical information section
export interface MedicalInfo {
  // Basic Medical Data
  bloodType?: BloodType;
  height?: string; // e.g., "5'10\"" or "178 cm"
  weight?: string; // e.g., "150 lbs" or "68 kg"
  
  // Medical Conditions and History
  allergies: MedicalCondition[];
  medications: Medication[];
  medicalConditions: MedicalCondition[];
  surgeries: Surgery[];
  
  // Emergency Medical Information
  emergencyMedicalInfo?: string; // Critical info for first responders
  bloodDonorStatus?: boolean;
  organDonorStatus?: boolean;
  
  // Healthcare Providers
  primaryPhysician?: HealthcareProvider;
  specialists: HealthcareProvider[];
  
  // Insurance Information
  insuranceInfo?: InsuranceInfo;
}

// Blood type enumeration
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// Medical condition interface
export interface MedicalCondition {
  id: string;
  name: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  diagnosedDate?: Date;
  notes?: string;
  isActive: boolean;
}

// Medication interface
export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string; // e.g., "twice daily", "as needed"
  prescribedBy?: string; // Doctor name
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
}

// Surgery interface
export interface Surgery {
  id: string;
  name: string;
  date: Date;
  hospital?: string;
  surgeon?: string;
  notes?: string;
}

// Healthcare provider interface
export interface HealthcareProvider {
  id: string;
  name: string;
  specialty?: string;
  phoneNumber?: string;
  address?: Address;
  notes?: string;
}

// Insurance information
export interface InsuranceInfo {
  provider: string;
  policyNumber?: string;
  groupNumber?: string;
  phoneNumber?: string;
  notes?: string;
}
// Insurance information
export interface InsuranceInfo {
  provider: string;
  policyNumber?: string;
  groupNumber?: string;
  phoneNumber?: string;
  notes?: string;
}

// Emergency contact interface
export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string; // e.g., "spouse", "parent", "friend"
  email?: string;
  address?: Address;
  isPrimary: boolean; // Is this the primary emergency contact?
  notes?: string;
}

// Privacy and security settings
export interface PrivacySettings {
  // QR Code Access Controls
  allowEmergencyAccess: boolean; // Allow emergency access via QR code
  allowMedicalProfessionalAccess: boolean; // Allow verified medical professionals
  
  // Password Protection
  requirePasswordForFullAccess: boolean;
  profilePassword?: string; // Hashed password for profile access
  
  // Visibility Settings
  visibleFields: ProfileFieldVisibility;
  
  // Audit Settings
  enableAuditLogging: boolean;
  notifyOnAccess: boolean; // Send notifications when profile is accessed
}

// Profile field visibility settings
export interface ProfileFieldVisibility {
  personalInfo: {
    name: boolean;
    dateOfBirth: boolean;
    gender: boolean;
    phoneNumber: boolean;
    address: boolean;
  };
  medicalInfo: {
    bloodType: boolean;
    allergies: boolean;
    medications: boolean;
    medicalConditions: boolean;
    emergencyMedicalInfo: boolean;
    primaryPhysician: boolean;
  };
  emergencyContacts: boolean;
}

// =============================================
// MEDICAL PROFESSIONAL TYPES
// =============================================

export interface MedicalProfessional {
  id: string;
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  professionalInfo: {
    licenseNumber: string;
    licenseState?: string;
    licenseExpiryDate?: Date;
    specialty?: string;
    hospitalAffiliation?: string;
    yearsOfExperience?: number;
  };
  verificationStatus: {
    isVerified: boolean;
    verifiedAt?: Date;
    verifiedBy?: string; // Admin ID who verified
    verificationNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// QR CODE AND ACCESS TYPES
// =============================================

// QR Code data structure
export interface QRCodeData {
  version: string; // QR code format version
  profileId: string;
  emergencyData: EmergencyQRData; // Data embedded directly in QR code
  appData?: {
    deepLink: string; // Link to open full profile in app
    checksum: string; // Verify data integrity
  };
  generatedAt: Date;
}

// Emergency data embedded in QR code (for offline access)
export interface EmergencyQRData {
  name: string;
  bloodType?: BloodType;
  criticalAllergies: string[]; // Most important allergies only
  criticalMedications: string[]; // Most important medications only
  emergencyContact: {
    name: string;
    phone: string;
  };
  emergencyNotes?: string; // Brief critical info
}

// =============================================
// AUDIT AND LOGGING TYPES
// =============================================

export interface AuditLog {
  id: string;
  profileId: string;
  accessedBy: string; // User ID or "anonymous"
  accessorType: 'medical_professional' | 'individual' | 'anonymous' | 'emergency_responder';
  accessType: 'qr_scan' | 'full_profile' | 'emergency_access' | 'profile_edit';
  accessMethod: 'qr_code' | 'app_interface' | 'api';
  
  // Access Details
  fieldsAccessed?: string[]; // Which profile fields were viewed
  dataModified?: boolean; // Whether any data was changed
  
  // Context Information
  timestamp: Date;
  location?: GeoLocation;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Additional Notes
  notes?: string;
  sessionId?: string;
}

// Geographic location
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

// =============================================
// FORM AND VALIDATION TYPES
// =============================================

// Form validation results
export interface ValidationResult {
  isValid: boolean;
  error: string;
  suggestions?: string[];
}

// Profile completion status
export interface ProfileCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  recommendedFields: string[];
}

// =============================================
// API AND SERVICE TYPES
// =============================================

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// Profile update request
export interface ProfileUpdateRequest {
  profileId: string;
  updates: Partial<UserProfile>;
  updateReason?: string;
}

// Profile search/filter criteria
export interface ProfileSearchCriteria {
  userId?: string;
  bloodType?: BloodType;
  hasAllergies?: boolean;
  hasConditions?: boolean;
  isComplete?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

// =============================================
// LEGACY COMPATIBILITY (to be deprecated)
// =============================================

// Legacy Profile interface for backward compatibility
// @deprecated Use UserProfile instead
export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bloodType?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  emergencyContacts?: EmergencyContact[];
  password?: string;
  extraInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}
