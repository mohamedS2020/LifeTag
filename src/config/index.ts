// Environment Configuration
// This file contains environment-specific configuration

export const CONFIG = {
  // Firebase configuration is imported from firebase.config.ts
  
  // App configuration
  APP_NAME: 'LifeTag',
  VERSION: '1.0.0',
  
  // QR Code configuration
  QR_CODE: {
    SIZE: 200,
    BACKGROUND_COLOR: '#FFFFFF',
    FOREGROUND_COLOR: '#000000',
    ERROR_CORRECTION_LEVEL: 'M' as const,
  },
  
  // Medical professional verification
  VERIFICATION: {
    ADMIN_EMAIL: 'admin@lifetag.app', // TODO: Replace with actual admin email
    PENDING_VERIFICATION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
  
  // Audit logging
  AUDIT: {
    RETENTION_DAYS: 365, // Keep audit logs for 1 year
    MAX_LOGS_PER_PROFILE: 1000,
  },
  
  // Profile limits
  PROFILE: {
    MAX_EMERGENCY_CONTACTS: 5,
    MIN_PASSWORD_LENGTH: 6,
    MAX_FIELD_LENGTH: 500,
  }
};

export default CONFIG;
