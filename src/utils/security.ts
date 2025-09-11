/**
 * Security Utilities
 * Input sanitization and data protection helpers
 */

// Input sanitization to prevent XSS and injection attacks
export const sanitizeHtmlInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>"/]/g, '') // Remove HTML/script injection characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Email sanitization
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@.-]/g, ''); // Only allow valid email characters
};

// Phone number sanitization
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  return phone
    .replace(/[^\d+()-\s]/g, '') // Only allow digits, +, (), -, and spaces
    .trim();
};

// General text sanitization for names and text fields
export const sanitizeTextValue = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/[<>"/\\]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

// License number sanitization
export const sanitizeLicenseNumber = (license: string): string => {
  if (!license) return '';
  
  return license
    .replace(/[^a-zA-Z0-9.-]/g, '') // Only allow alphanumeric, dots, and hyphens
    .toUpperCase()
    .trim();
};

// Data masking for sensitive information display
export const maskSensitiveData = (data: string, type: 'email' | 'phone' | 'license'): string => {
  if (!data) return '';
  
  switch (type) {
    case 'email':
      const [user, domain] = data.split('@');
      if (!domain) return data;
      const maskedUser = user.length > 2 ? user.slice(0, 2) + '*'.repeat(user.length - 2) : user;
      return `${maskedUser}@${domain}`;
      
    case 'phone':
      if (data.length < 4) return data;
      return data.slice(0, 3) + '*'.repeat(data.length - 6) + data.slice(-3);
      
    case 'license':
      if (data.length < 4) return data;
      return data.slice(0, 2) + '*'.repeat(data.length - 4) + data.slice(-2);
      
    default:
      return data;
  }
};

// Generate secure random strings for IDs or tokens
export const generateSecureId = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Basic data encoding for local storage (not for sensitive data)
export const encodeUserData = (data: string): string => {
  try {
    return btoa(encodeURIComponent(data));
  } catch (error) {
    console.warn('Failed to encode data:', error);
    return data;
  }
};

export const decodeUserData = (encodedData: string): string => {
  try {
    return decodeURIComponent(atob(encodedData));
  } catch (error) {
    console.warn('Failed to decode data:', error);
    return encodedData;
  }
};

// Rate limiting helper for form submissions
export class FormSubmissionLimiter {
  private submissions: Map<string, number[]> = new Map();
  private readonly maxSubmissions: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxSubmissions: number = 5, timeWindowMinutes: number = 1) {
    this.maxSubmissions = maxSubmissions;
    this.timeWindow = timeWindowMinutes * 60 * 1000;
  }

  canSubmit(identifier: string): boolean {
    const now = Date.now();
    const userSubmissions = this.submissions.get(identifier) || [];
    
    // Filter out old submissions outside the time window
    const recentSubmissions = userSubmissions.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    this.submissions.set(identifier, recentSubmissions);
    
    return recentSubmissions.length < this.maxSubmissions;
  }

  recordSubmission(identifier: string): void {
    const now = Date.now();
    const userSubmissions = this.submissions.get(identifier) || [];
    userSubmissions.push(now);
    this.submissions.set(identifier, userSubmissions);
  }

  getRemainingAttempts(identifier: string): number {
    const userSubmissions = this.submissions.get(identifier) || [];
    const now = Date.now();
    const recentSubmissions = userSubmissions.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    return Math.max(0, this.maxSubmissions - recentSubmissions.length);
  }
}

// Input validation helpers
export const isValidEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const containsSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(union\s+select)/i,
    /('|('')|;|--|\*|\|)/,
    /(\bor\b|\band\b).*[=]/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

export const containsXSSAttempt = (input: string): boolean => {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// Secure input validator that checks for common attack patterns
export const isSecureInput = (input: string): { isSecure: boolean; reason?: string } => {
  if (containsSQLInjection(input)) {
    return { isSecure: false, reason: 'Input contains potentially unsafe SQL patterns' };
  }
  
  if (containsXSSAttempt(input)) {
    return { isSecure: false, reason: 'Input contains potentially unsafe script patterns' };
  }
  
  return { isSecure: true };
};