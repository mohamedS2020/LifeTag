// Services
// This directory contains service modules for API calls and business logic

export { default as authService } from './authService';
export { default as profileService } from './profileService';
export type { ProfileService } from './profileService';
export { default as passwordService } from './passwordService';
export { 
  MedicalProfessionalApprovalService,
  type ApprovalAction,
  type ApprovalNotification,
  type ApprovalHistory
} from './medicalProfessionalApprovalService';
export { 
  MedicalProfessionalAccessService,
  type AccessResult,
  type ProfileAccessLog
} from './medicalProfessionalAccessService';
export { 
  EnhancedProfileValidator,
  MedicalDataValidator,
  EmergencyContactValidator,
  ProfileCompletenessValidator,
  DataIntegrityValidator
} from './enhancedProfileValidator';
export { 
  QRService,
  QRCodeGenerator,
  type EmergencyQRData,
  type QREncodingOptions,
  type QRCodeGenerationResult
} from './qrService';
// Other services will be added in upcoming tasks
