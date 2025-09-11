/**
 * Authentication Error Handling Utilities
 * Provides standardized error messages and handling for authentication operations
 */

// Authentication Error Types
export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'error' | 'warning' | 'info';
}

// Firebase Auth Error Codes Mapping
const FIREBASE_ERROR_MESSAGES: Record<string, AuthError> = {
  'auth/user-not-found': {
    code: 'auth/user-not-found',
    message: 'No user found with this email address',
    userMessage: 'No account found with this email. Please check your email or sign up.',
    severity: 'error'
  },
  'auth/wrong-password': {
    code: 'auth/wrong-password',
    message: 'Incorrect password',
    userMessage: 'Incorrect password. Please try again.',
    severity: 'error'
  },
  'auth/invalid-email': {
    code: 'auth/invalid-email',
    message: 'Invalid email format',
    userMessage: 'Please enter a valid email address.',
    severity: 'error'
  },
  'auth/email-already-in-use': {
    code: 'auth/email-already-in-use',
    message: 'Email already registered',
    userMessage: 'An account with this email already exists. Try logging in instead.',
    severity: 'error'
  },
  'auth/weak-password': {
    code: 'auth/weak-password',
    message: 'Password is too weak',
    userMessage: 'Password should be at least 6 characters long with a mix of letters and numbers.',
    severity: 'error'
  },
  'auth/too-many-requests': {
    code: 'auth/too-many-requests',
    message: 'Too many failed attempts',
    userMessage: 'Too many failed attempts. Please wait a few minutes before trying again.',
    severity: 'warning'
  },
  'auth/network-request-failed': {
    code: 'auth/network-request-failed',
    message: 'Network connection failed',
    userMessage: 'Please check your internet connection and try again.',
    severity: 'error'
  },
  'auth/invalid-credential': {
    code: 'auth/invalid-credential',
    message: 'Invalid credentials provided',
    userMessage: 'Invalid email or password. Please check your credentials.',
    severity: 'error'
  },
  'auth/user-disabled': {
    code: 'auth/user-disabled',
    message: 'User account has been disabled',
    userMessage: 'This account has been disabled. Please contact support.',
    severity: 'error'
  }
};

// Firestore Error Codes Mapping
const FIRESTORE_ERROR_MESSAGES: Record<string, AuthError> = {
  'permission-denied': {
    code: 'permission-denied',
    message: 'Insufficient permissions',
    userMessage: 'Access denied. Please make sure you are logged in.',
    severity: 'error'
  },
  'unavailable': {
    code: 'unavailable',
    message: 'Service temporarily unavailable',
    userMessage: 'Service is temporarily unavailable. Please try again in a moment.',
    severity: 'warning'
  },
  'not-found': {
    code: 'not-found',
    message: 'Document not found',
    userMessage: 'User profile not found. Please try logging in again.',
    severity: 'error'
  },
  'already-exists': {
    code: 'already-exists',
    message: 'Document already exists',
    userMessage: 'Profile already exists. Please try logging in instead.',
    severity: 'error'
  }
};

// Generic Error Messages
const GENERIC_ERROR_MESSAGES: Record<string, AuthError> = {
  'network-error': {
    code: 'network-error',
    message: 'Network connection error',
    userMessage: 'Please check your internet connection and try again.',
    severity: 'error'
  },
  'unknown-error': {
    code: 'unknown-error',
    message: 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again.',
    severity: 'error'
  },
  'validation-error': {
    code: 'validation-error',
    message: 'Form validation failed',
    userMessage: 'Please check all fields and try again.',
    severity: 'error'
  },
  'registration-failed': {
    code: 'registration-failed',
    message: 'User registration failed',
    userMessage: 'Registration failed. Please try again.',
    severity: 'error'
  },
  'login-failed': {
    code: 'login-failed',
    message: 'Login attempt failed',
    userMessage: 'Login failed. Please check your credentials.',
    severity: 'error'
  }
};

/**
 * Parse error and return user-friendly message
 */
export const parseAuthError = (error: any): AuthError => {
  // Handle Firebase Auth errors
  if (error?.code && FIREBASE_ERROR_MESSAGES[error.code]) {
    return FIREBASE_ERROR_MESSAGES[error.code];
  }

  // Handle Firestore errors
  if (error?.code && FIRESTORE_ERROR_MESSAGES[error.code]) {
    return FIRESTORE_ERROR_MESSAGES[error.code];
  }

  // Handle custom error messages
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return GENERIC_ERROR_MESSAGES['network-error'];
    }
    
    if (message.includes('validation')) {
      return GENERIC_ERROR_MESSAGES['validation-error'];
    }
    
    if (message.includes('registration') || message.includes('register')) {
      return GENERIC_ERROR_MESSAGES['registration-failed'];
    }
    
    if (message.includes('login') || message.includes('sign in')) {
      return GENERIC_ERROR_MESSAGES['login-failed'];
    }
  }

  // Default fallback
  return {
    code: 'unknown-error',
    message: error?.message || 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again.',
    severity: 'error'
  };
};

/**
 * Log error for debugging while returning user-friendly message
 */
export const handleAuthError = (error: any, context: string = 'Authentication'): AuthError => {
  const parsedError = parseAuthError(error);
  
  // Log detailed error for debugging
  console.error(`${context} Error:`, {
    code: parsedError.code,
    message: parsedError.message,
    originalError: error,
    timestamp: new Date().toISOString()
  });
  
  return parsedError;
};

/**
 * Create standardized loading states
 */
export interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  operation: string;
}

export const createLoadingState = (operation: string, message?: string): LoadingState => {
  const defaultMessages: Record<string, string> = {
    'login': 'Signing you in...',
    'register': 'Creating your account...',
    'logout': 'Signing you out...',
    'refresh': 'Refreshing your profile...',
    'validate': 'Validating information...',
    'save': 'Saving your information...'
  };

  return {
    isLoading: true,
    loadingMessage: message || defaultMessages[operation] || 'Processing...',
    operation
  };
};

/**
 * Validation error helpers
 */
export const createValidationError = (field: string, message: string): AuthError => {
  return {
    code: 'validation-error',
    message: `Validation failed for ${field}: ${message}`,
    userMessage: message,
    severity: 'error'
  };
};