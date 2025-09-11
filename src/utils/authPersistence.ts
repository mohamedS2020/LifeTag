/**
 * Authentication Persistence Utilities
 * Handles storing and retrieving authentication state from AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

// Storage keys
const AUTH_STORAGE_KEYS = {
  USER: '@lifetag_user',
  TOKEN: '@lifetag_token',
  LAST_LOGIN: '@lifetag_last_login'
} as const;

/**
 * Store user authentication data
 */
export const storeAuthData = async (user: User, token?: string): Promise<void> => {
  try {
    const authData = {
      user,
      token,
      lastLogin: new Date().toISOString()
    };

    // Store user data
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    
    // Store token if provided
    if (token) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
    }
    
    // Store last login timestamp
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.LAST_LOGIN, authData.lastLogin);
    
    console.log('Authentication data stored successfully');
  } catch (error) {
    console.error('Error storing authentication data:', error);
    throw new Error('Failed to store authentication data');
  }
};

/**
 * Retrieve stored user data
 */
export const getStoredUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (userData) {
      return JSON.parse(userData) as User;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving stored user:', error);
    return null;
  }
};

/**
 * Retrieve stored authentication token
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error retrieving stored token:', error);
    return null;
  }
};

/**
 * Retrieve last login timestamp
 */
export const getLastLoginTime = async (): Promise<Date | null> => {
  try {
    const lastLogin = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.LAST_LOGIN);
    if (lastLogin) {
      return new Date(lastLogin);
    }
    return null;
  } catch (error) {
    console.error('Error retrieving last login time:', error);
    return null;
  }
};

/**
 * Clear all stored authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      AUTH_STORAGE_KEYS.USER,
      AUTH_STORAGE_KEYS.TOKEN,
      AUTH_STORAGE_KEYS.LAST_LOGIN
    ]);
    console.log('Authentication data cleared successfully');
  } catch (error) {
    console.error('Error clearing authentication data:', error);
    throw new Error('Failed to clear authentication data');
  }
};

/**
 * Check if user session is still valid (within 30 days)
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const lastLogin = await getLastLoginTime();
    if (!lastLogin) {
      return false;
    }

    const now = new Date();
    const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    
    // Session is valid for 30 days
    return daysSinceLogin <= 30;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
};

/**
 * Get all stored auth data for debugging
 */
export const getStoredAuthData = async () => {
  try {
    const [user, token, lastLogin] = await Promise.all([
      getStoredUser(),
      getStoredToken(),
      getLastLoginTime()
    ]);

    return {
      user,
      token,
      lastLogin,
      isValid: await isSessionValid()
    };
  } catch (error) {
    console.error('Error retrieving stored auth data:', error);
    return null;
  }
};