/**
 * Form Validation Utilities
 * Enhanced validation helpers for authentication forms
 */

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

// Email validation with comprehensive checks
export const validateEmailAddress = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Additional checks for professional email (for medical professionals)
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, error: '' };
};

// Enhanced password validation with strength requirements
export const validatePasswordStrength = (password: string, type: 'basic' | 'enhanced' = 'basic'): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (type === 'basic') {
    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }
  } else if (type === 'enhanced') {
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }
  }

  return { isValid: true, error: '' };
};

// Password confirmation validation
export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true, error: '' };
};

// Name validation (first name, last name, full name)
export const validatePersonName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters` };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { isValid: true, error: '' };
};

// Medical license number validation
export const validateMedicalLicense = (licenseNumber: string): ValidationResult => {
  if (!licenseNumber || licenseNumber.trim() === '') {
    return { isValid: false, error: 'License number is required' };
  }

  const trimmedLicense = licenseNumber.trim();
  if (trimmedLicense.length < 3) {
    return { isValid: false, error: 'License number must be at least 3 characters' };
  }

  if (trimmedLicense.length > 20) {
    return { isValid: false, error: 'License number must be less than 20 characters' };
  }

  // Allow alphanumeric characters, hyphens, and dots
  if (!/^[A-Za-z0-9.-]+$/.test(trimmedLicense)) {
    return { isValid: false, error: 'License number can only contain letters, numbers, hyphens, and dots' };
  }

  return { isValid: true, error: '' };
};

// Required field validation
export const validateRequiredField = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true, error: '' };
};

// Input sanitization utilities
export const sanitizeTextInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML characters
};

export const sanitizeEmailInput = (email: string): string => {
  if (!email) return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/\s/g, ''); // Remove all spaces
};

export const sanitizeLicenseInput = (license: string): string => {
  if (!license) return '';
  
  return license
    .trim()
    .toUpperCase()
    .replace(/\s/g, ''); // Remove spaces for consistency
};

// Form validation helper that validates multiple fields at once
export const validateFormFields = (fields: Array<{
  value: string;
  validator: (value: string) => ValidationResult;
  name: string;
}>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  fields.forEach(field => {
    const result = field.validator(field.value);
    if (!result.isValid) {
      errors[field.name] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Password strength indicator
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (!password) return 'weak';

  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};