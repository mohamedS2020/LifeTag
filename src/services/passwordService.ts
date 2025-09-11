import { SHA256 } from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Profile Password Protection Service
 * Handles password hashing, verification, and temporary access management
 */

// Configuration
const ACCESS_TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds
const STORAGE_KEYS = {
  TEMP_ACCESS_TOKEN: '@lifetag_temp_access_token',
  TEMP_ACCESS_EXPIRY: '@lifetag_temp_access_expiry',
} as const;

/**
 * Hash a password using SHA256
 * @param password - Plain text password
 * @returns Hashed password string
 */
export const hashPassword = (password: string): string => {
  // Add a salt for additional security
  const salt = 'lifetag_profile_salt_2024';
  return SHA256(password + salt).toString();
};

/**
 * Verify if a provided password matches the stored hash
 * @param password - Plain text password to verify
 * @param storedHash - Stored password hash
 * @returns True if password matches, false otherwise
 */
export const verifyPassword = (password: string, storedHash: string): boolean => {
  const hashedInput = hashPassword(password);
  return hashedInput === storedHash;
};

/**
 * Generate a temporary access token for profile viewing
 * @param userId - User ID
 * @returns Temporary access token
 */
export const generateTempAccessToken = (userId: string): string => {
  const timestamp = Date.now().toString();
  const tokenData = `${userId}_${timestamp}`;
  return SHA256(tokenData).toString();
};

/**
 * Store temporary access credentials
 * @param userId - User ID
 * @returns Promise resolving to access token
 */
export const grantTempAccess = async (userId: string): Promise<string> => {
  try {
    const token = generateTempAccessToken(userId);
    const expiryTime = Date.now() + ACCESS_TOKEN_EXPIRY;
    
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TEMP_ACCESS_TOKEN, token],
      [STORAGE_KEYS.TEMP_ACCESS_EXPIRY, expiryTime.toString()],
    ]);
    
    return token;
  } catch (error) {
    console.error('Error granting temporary access:', error);
    throw new Error('Failed to grant access');
  }
};

/**
 * Check if user has valid temporary access
 * @returns Promise resolving to boolean indicating access status
 */
export const hasValidTempAccess = async (): Promise<boolean> => {
  try {
    const [token, expiryStr] = await AsyncStorage.multiGet([
      STORAGE_KEYS.TEMP_ACCESS_TOKEN,
      STORAGE_KEYS.TEMP_ACCESS_EXPIRY,
    ]);
    
    const accessToken = token[1];
    const expiryTime = expiryStr[1];
    
    if (!accessToken || !expiryTime) {
      return false;
    }
    
    const currentTime = Date.now();
    const expiry = parseInt(expiryTime, 10);
    
    return currentTime < expiry;
  } catch (error) {
    console.error('Error checking temporary access:', error);
    return false;
  }
};

/**
 * Revoke temporary access
 */
export const revokeTempAccess = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TEMP_ACCESS_TOKEN,
      STORAGE_KEYS.TEMP_ACCESS_EXPIRY,
    ]);
  } catch (error) {
    console.error('Error revoking temporary access:', error);
  }
};

/**
 * Get remaining access time in minutes
 * @returns Promise resolving to remaining minutes or null if no access
 */
export const getRemainingAccessTime = async (): Promise<number | null> => {
  try {
    const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.TEMP_ACCESS_EXPIRY);
    
    if (!expiryStr) {
      return null;
    }
    
    const expiryTime = parseInt(expiryStr, 10);
    const currentTime = Date.now();
    const remainingMs = expiryTime - currentTime;
    
    if (remainingMs <= 0) {
      return null;
    }
    
    return Math.ceil(remainingMs / (60 * 1000)); // Convert to minutes
  } catch (error) {
    console.error('Error getting remaining access time:', error);
    return null;
  }
};

/**
 * Password strength validator for profile passwords
 * @param password - Password to validate
 * @returns Validation result
 */
export const validateProfilePassword = (password: string): {
  isValid: boolean;
  error?: string;
  strength: 'weak' | 'medium' | 'strong';
} => {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 'weak' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters', strength: 'weak' };
  }
  
  // Calculate strength
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  let strength: 'weak' | 'medium' | 'strong';
  
  if (score >= 5) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }
  
  // Minimum requirements for validity
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must contain at least one letter and one number',
      strength
    };
  }
  
  return { isValid: true, strength };
};

/**
 * Profile password service interface
 */
export const passwordService = {
  hashPassword,
  verifyPassword,
  grantTempAccess,
  hasValidTempAccess,
  revokeTempAccess,
  getRemainingAccessTime,
  validateProfilePassword,
} as const;

export default passwordService;