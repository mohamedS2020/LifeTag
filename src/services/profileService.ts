/**
 * Profile Service
 * Handles all profile-related CRUD operations with Firestore
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import CONFIG from '../config';
import { 
  UserProfile, 
  PersonalInfo, 
  MedicalInfo, 
  EmergencyContact,
  PrivacySettings,
  ProfileUpdateRequest,
  ProfileSearchCriteria,
  ApiResponse,
  ValidationResult,
  ProfileCompletionStatus,
  AuditLog
} from '../types';
import { 
  validateProfile, 
  validatePersonalInfo, 
  validateMedicalInfo, 
  validateEmergencyContacts,
  calculateProfileCompletion,
  sanitizeProfileData
} from '../utils/profileValidation';

// =============================================
// PROFILE SERVICE INTERFACE
// =============================================

export interface ProfileService {
  // Core CRUD Operations
  createProfile: (userId: string, profileData: Partial<UserProfile>) => Promise<ApiResponse<UserProfile>>;
  getProfile: (userId: string) => Promise<ApiResponse<UserProfile>>;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<ApiResponse<UserProfile>>;
  deleteProfile: (userId: string) => Promise<ApiResponse<void>>;
  
  // Profile Sections Management
  updatePersonalInfo: (userId: string, personalInfo: Partial<PersonalInfo>) => Promise<ApiResponse<UserProfile>>;
  updateMedicalInfo: (userId: string, medicalInfo: Partial<MedicalInfo>) => Promise<ApiResponse<UserProfile>>;
  updatePrivacySettings: (userId: string, privacySettings: Partial<PrivacySettings>) => Promise<ApiResponse<UserProfile>>;
  
  // Emergency Contacts Management
  addEmergencyContact: (userId: string, contact: Omit<EmergencyContact, 'id'>) => Promise<ApiResponse<UserProfile>>;
  updateEmergencyContact: (userId: string, contactId: string, updates: Partial<EmergencyContact>) => Promise<ApiResponse<UserProfile>>;
  removeEmergencyContact: (userId: string, contactId: string) => Promise<ApiResponse<UserProfile>>;
  setPrimaryEmergencyContact: (userId: string, contactId: string) => Promise<ApiResponse<UserProfile>>;
  
  // Profile Analysis
  getProfileCompletion: (userId: string) => Promise<ApiResponse<ProfileCompletionStatus>>;
  validateProfileData: (profileData: Partial<UserProfile>) => ValidationResult;
  
  // Search and Query
  searchProfiles: (criteria: ProfileSearchCriteria) => Promise<ApiResponse<UserProfile[]>>;
  getProfilesByUserType: (userType: 'individual' | 'medical_professional') => Promise<ApiResponse<UserProfile[]>>;
  
  // Audit and Logging
  logProfileAccess: (profileId: string, accessLog: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<ApiResponse<void>>;
  getProfileAccessLogs: (profileId: string, limit?: number) => Promise<ApiResponse<AuditLog[]>>;
  cleanupAuditLogs: (profileId?: string) => Promise<ApiResponse<{ deletedCount: number }>>;
  getAuditLogStatistics: (profileId?: string) => Promise<ApiResponse<{
    totalLogs: number;
    oldestLog?: Date;
    newestLog?: Date;
    logsByType: Record<string, number>;
    logsByAccessorType: Record<string, number>;
  }>>;
}

// =============================================
// PROFILE SERVICE IMPLEMENTATION
// =============================================

class ProfileServiceImpl implements ProfileService {

  // =============================================
  // CORE CRUD OPERATIONS
  // =============================================

  /**
   * Create a new user profile
   */
  async createProfile(userId: string, profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      console.log('🏭 ProfileService: createProfile called');
      console.log('📋 ProfileService: Received profileData:', JSON.stringify(profileData, null, 2));
      console.log('🔍 ProfileService: personalInfo keys:', Object.keys(profileData.personalInfo || {}));
      console.log('🔍 ProfileService: personalInfo displayName:', (profileData.personalInfo as any)?.displayName);

      // Check if profile already exists
      const existingProfileResponse = await this.getProfile(userId);
      if (existingProfileResponse.success && existingProfileResponse.data) {
        return {
          success: false,
          error: {
            code: 'PROFILE_ALREADY_EXISTS',
            message: 'A profile already exists for this user',
            details: { userId }
          },
          timestamp: new Date()
        };
      }

      // Sanitize and validate profile data
      const sanitizedData = sanitizeProfileData(profileData);
      const validation = this.validateProfileData(sanitizedData);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error,
            details: { validation }
          },
          timestamp: new Date()
        };
      }

      // Create profile with default values
      const now = new Date();
      
      // Create clean personalInfo with displayName
      const dateOfBirth = sanitizedData.personalInfo?.dateOfBirth;
      console.log('🗓️ ProfileService: Processing dateOfBirth:', dateOfBirth, 'Type:', typeof dateOfBirth, 'instanceof Date:', dateOfBirth instanceof Date);
      
      const personalInfo: PersonalInfo = {
        firstName: sanitizedData.personalInfo?.firstName || '',
        lastName: sanitizedData.personalInfo?.lastName || '',
        displayName: `${sanitizedData.personalInfo?.firstName || ''} ${sanitizedData.personalInfo?.lastName || ''}`.trim(),
        dateOfBirth: (dateOfBirth instanceof Date) ? dateOfBirth : new Date(),
        ...(sanitizedData.personalInfo?.gender && { gender: sanitizedData.personalInfo.gender }),
        ...(sanitizedData.personalInfo?.phoneNumber && { phoneNumber: sanitizedData.personalInfo.phoneNumber }),
        ...(sanitizedData.personalInfo?.address && { address: sanitizedData.personalInfo.address }),
        ...(sanitizedData.personalInfo?.profilePicture && { profilePicture: sanitizedData.personalInfo.profilePicture })
      };

      console.log('✨ ProfileService: Created personalInfo:', JSON.stringify(personalInfo, null, 2));
      console.log('🔍 ProfileService: personalInfo keys:', Object.keys(personalInfo));
      console.log('🔍 ProfileService: displayName value:', personalInfo.displayName);
      console.log('🗓️ ProfileService: Final dateOfBirth before profile creation:', personalInfo.dateOfBirth, 'Type:', typeof personalInfo.dateOfBirth);

      const profile: UserProfile = {
        id: userId,
        userId,
        personalInfo,
        medicalInfo: sanitizedData.medicalInfo || {
          allergies: [],
          medications: [],
          medicalConditions: [],
          surgeries: [],
          specialists: []
        },
        emergencyContacts: sanitizedData.emergencyContacts || [],
        privacySettings: sanitizedData.privacySettings || {
          allowEmergencyAccess: true,
          allowMedicalProfessionalAccess: true,
          requirePasswordForFullAccess: false,
          visibleFields: {
            personalInfo: {
              name: true,
              dateOfBirth: true,
              gender: true,
              phoneNumber: true,
              address: false
            },
            medicalInfo: {
              bloodType: true,
              allergies: true,
              medications: true,
              medicalConditions: true,
              emergencyMedicalInfo: true,
              primaryPhysician: false
            },
            emergencyContacts: true
          },
          enableAuditLogging: true,
          notifyOnAccess: false
        },
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now,
        isComplete: false
      };

      // Calculate completion status
      const completionStatus = calculateProfileCompletion(profile);
      profile.isComplete = completionStatus.isComplete;

      console.log('💾 ProfileService: About to save profile to Firestore');
      console.log('📋 ProfileService: Final profile data:', JSON.stringify(profile, null, 2));
      console.log('🔍 ProfileService: Final personalInfo keys:', Object.keys(profile.personalInfo));
      console.log('🔍 ProfileService: Final displayName:', profile.personalInfo.displayName);

      // Final cleaning step - remove any undefined values before Firestore save
      const cleanForFirestore = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return obj;
        }
        
        if (Array.isArray(obj)) {
          return obj.map(cleanForFirestore).filter(item => item !== undefined);
        }
        
        if (typeof obj === 'object') {
          // Handle Date objects specially - don't try to clean them
          if (obj instanceof Date) {
            console.log('📅 ProfileService: Found Date object in cleanForFirestore, returning as-is:', obj);
            return obj;
          }
          
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              cleaned[key] = cleanForFirestore(value);
            }
          }
          return cleaned;
        }
        
        return obj;
      };

      const cleanedProfile = cleanForFirestore(profile);
      console.log('🧹 ProfileService: Cleaned profile for Firestore:', JSON.stringify(cleanedProfile, null, 2));
      console.log('🔍 ProfileService: Cleaned personalInfo keys:', Object.keys(cleanedProfile.personalInfo));
      console.log('🗓️ ProfileService: Cleaned dateOfBirth:', cleanedProfile.personalInfo.dateOfBirth, 'Type:', typeof cleanedProfile.personalInfo.dateOfBirth);
      
      // Save to Firestore
      try {
        console.log('🔥 ProfileService: Calling setDoc...');
        await setDoc(doc(db, 'profiles', userId), {
          ...cleanedProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastAccessedAt: serverTimestamp()
        });
        console.log('✅ ProfileService: setDoc completed successfully');
      } catch (firestoreError: any) {
        console.error('❌ ProfileService: setDoc failed:', firestoreError);
        console.error('❌ ProfileService: Error message:', firestoreError.message);
        console.error('❌ ProfileService: Error code:', firestoreError.code);
        throw firestoreError; // Re-throw to be caught by outer try-catch
      }

      // Log profile creation
      await this.logProfileAccess(userId, {
        profileId: userId,
        accessedBy: userId,
        accessorType: 'individual',
        accessType: 'profile_edit',
        accessMethod: 'app_interface',
        dataModified: true,
        notes: 'Profile created'
      });

      return {
        success: true,
        data: profile,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Create profile error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create profile',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      
      if (!profileDoc.exists()) {
        return {
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profile not found',
            details: { userId }
          },
          timestamp: new Date()
        };
      }

      const profileData = profileDoc.data();
      const profile: UserProfile = {
        ...profileData,
        id: userId,
        createdAt: profileData.createdAt?.toDate() || new Date(),
        updatedAt: profileData.updatedAt?.toDate() || new Date(),
        lastAccessedAt: profileData.lastAccessedAt?.toDate() || new Date()
      } as UserProfile;

      // Update last accessed time
      await updateDoc(doc(db, 'profiles', userId), {
        lastAccessedAt: serverTimestamp()
      });

      return {
        success: true,
        data: profile,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve profile',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      // Get current profile
      const currentProfileResponse = await this.getProfile(userId);
      if (!currentProfileResponse.success || !currentProfileResponse.data) {
        return currentProfileResponse as ApiResponse<UserProfile>;
      }

      const currentProfile = currentProfileResponse.data;

      // Sanitize and merge updates
      const sanitizedUpdates = sanitizeProfileData(updates);
      const mergedProfile = {
        ...currentProfile,
        ...sanitizedUpdates,
        updatedAt: new Date()
      };

      // Validate merged profile
      const validation = this.validateProfileData(mergedProfile);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error,
            details: { validation }
          },
          timestamp: new Date()
        };
      }

      // Calculate completion status
      const completionStatus = calculateProfileCompletion(mergedProfile);
      mergedProfile.isComplete = completionStatus.isComplete;

      // Update in Firestore
      await updateDoc(doc(db, 'profiles', userId), {
        ...sanitizedUpdates,
        isComplete: completionStatus.isComplete,
        updatedAt: serverTimestamp()
      });

      // Log profile update
      await this.logProfileAccess(userId, {
        profileId: userId,
        accessedBy: userId,
        accessorType: 'individual',
        accessType: 'profile_edit',
        accessMethod: 'app_interface',
        dataModified: true,
        notes: 'Profile updated'
      });

      return {
        success: true,
        data: mergedProfile,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update profile',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<ApiResponse<void>> {
    try {
      // Check if profile exists
      const profileResponse = await this.getProfile(userId);
      if (!profileResponse.success) {
        return {
          success: false,
          error: profileResponse.error,
          timestamp: new Date()
        };
      }

      // Delete profile document
      await deleteDoc(doc(db, 'profiles', userId));

      // Log profile deletion
      await this.logProfileAccess(userId, {
        profileId: userId,
        accessedBy: userId,
        accessorType: 'individual',
        accessType: 'profile_edit',
        accessMethod: 'app_interface',
        dataModified: true,
        notes: 'Profile deleted'
      });

      return {
        success: true,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Delete profile error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete profile',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  // =============================================
  // PROFILE SECTIONS MANAGEMENT
  // =============================================

  /**
   * Update personal information section
   */
  async updatePersonalInfo(userId: string, personalInfo: Partial<PersonalInfo>): Promise<ApiResponse<UserProfile>> {
    try {
      // Validate personal info
      const validation = validatePersonalInfo(personalInfo);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error,
            details: { validation }
          },
          timestamp: new Date()
        };
      }

      // Get current profile to merge with existing data
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        return currentProfile as ApiResponse<UserProfile>;
      }

      // Merge personal info with existing data
      const updatedPersonalInfo = {
        ...currentProfile.data.personalInfo,
        ...personalInfo
      };

      // Update profile with merged personal info
      return await this.updateProfile(userId, { personalInfo: updatedPersonalInfo });

    } catch (error: any) {
      console.error('Update personal info error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update personal information',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Update medical information section
   */
  async updateMedicalInfo(userId: string, medicalInfo: Partial<MedicalInfo>): Promise<ApiResponse<UserProfile>> {
    try {
      // Validate medical info
      const validation = validateMedicalInfo(medicalInfo);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error,
            details: { validation }
          },
          timestamp: new Date()
        };
      }

      // Get current profile to merge with existing data
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        return currentProfile as ApiResponse<UserProfile>;
      }

      // Merge medical info with existing data
      const updatedMedicalInfo = {
        ...currentProfile.data.medicalInfo,
        ...medicalInfo
      };

      // Update profile with merged medical info
      return await this.updateProfile(userId, { medicalInfo: updatedMedicalInfo });

    } catch (error: any) {
      console.error('Update medical info error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update medical information',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(userId: string, privacySettings: Partial<PrivacySettings>): Promise<ApiResponse<UserProfile>> {
    try {
      // Get current profile to merge with existing data
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        return currentProfile as ApiResponse<UserProfile>;
      }

      // Merge privacy settings with existing data
      const updatedPrivacySettings = {
        ...currentProfile.data.privacySettings,
        ...privacySettings
      };

      // Update profile with merged privacy settings
      return await this.updateProfile(userId, { privacySettings: updatedPrivacySettings });

    } catch (error: any) {
      console.error('Update privacy settings error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update privacy settings',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  // =============================================
  // EMERGENCY CONTACTS MANAGEMENT
  // =============================================

  /**
   * Add emergency contact
   */
  async addEmergencyContact(userId: string, contact: Omit<EmergencyContact, 'id'>): Promise<ApiResponse<UserProfile>> {
    try {
      // Get current profile
      const profileResponse = await this.getProfile(userId);
      if (!profileResponse.success || !profileResponse.data) {
        return profileResponse as ApiResponse<UserProfile>;
      }

      const profile = profileResponse.data;
      const newContact: EmergencyContact = {
        ...contact,
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Validate the new contact
      const validation = validateEmergencyContacts([...profile.emergencyContacts, newContact]);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error,
            details: { validation }
          },
          timestamp: new Date()
        };
      }

      // If this is the first contact, make it primary
      if (profile.emergencyContacts.length === 0) {
        newContact.isPrimary = true;
      }

      // Add contact to profile
      const updatedContacts = [...profile.emergencyContacts, newContact];
      return await this.updateProfile(userId, { emergencyContacts: updatedContacts });

    } catch (error: any) {
      console.error('Add emergency contact error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to add emergency contact',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(userId: string, contactId: string, updates: Partial<EmergencyContact>): Promise<ApiResponse<UserProfile>> {
    try {
      // Get current profile
      const profileResponse = await this.getProfile(userId);
      if (!profileResponse.success || !profileResponse.data) {
        return profileResponse as ApiResponse<UserProfile>;
      }

      const profile = profileResponse.data;
      const contactIndex = profile.emergencyContacts.findIndex(c => c.id === contactId);

      if (contactIndex === -1) {
        return {
          success: false,
          error: {
            code: 'CONTACT_NOT_FOUND',
            message: 'Emergency contact not found',
            details: { contactId }
          },
          timestamp: new Date()
        };
      }

      // Update contact
      const updatedContacts = [...profile.emergencyContacts];
      updatedContacts[contactIndex] = { ...updatedContacts[contactIndex], ...updates };

      // Validate updated contacts
      const validation = validateEmergencyContacts(updatedContacts);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error,
            details: { validation }
          },
          timestamp: new Date()
        };
      }

      return await this.updateProfile(userId, { emergencyContacts: updatedContacts });

    } catch (error: any) {
      console.error('Update emergency contact error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update emergency contact',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Remove emergency contact
   */
  async removeEmergencyContact(userId: string, contactId: string): Promise<ApiResponse<UserProfile>> {
    try {
      // Get current profile
      const profileResponse = await this.getProfile(userId);
      if (!profileResponse.success || !profileResponse.data) {
        return profileResponse as ApiResponse<UserProfile>;
      }

      const profile = profileResponse.data;
      const updatedContacts = profile.emergencyContacts.filter(c => c.id !== contactId);

      if (updatedContacts.length === profile.emergencyContacts.length) {
        return {
          success: false,
          error: {
            code: 'CONTACT_NOT_FOUND',
            message: 'Emergency contact not found',
            details: { contactId }
          },
          timestamp: new Date()
        };
      }

      // If we removed the primary contact, make the first remaining contact primary
      if (updatedContacts.length > 0 && !updatedContacts.some(c => c.isPrimary)) {
        updatedContacts[0].isPrimary = true;
      }

      return await this.updateProfile(userId, { emergencyContacts: updatedContacts });

    } catch (error: any) {
      console.error('Remove emergency contact error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to remove emergency contact',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Set primary emergency contact
   */
  async setPrimaryEmergencyContact(userId: string, contactId: string): Promise<ApiResponse<UserProfile>> {
    try {
      // Get current profile
      const profileResponse = await this.getProfile(userId);
      if (!profileResponse.success || !profileResponse.data) {
        return profileResponse as ApiResponse<UserProfile>;
      }

      const profile = profileResponse.data;
      const updatedContacts = profile.emergencyContacts.map(contact => ({
        ...contact,
        isPrimary: contact.id === contactId
      }));

      if (!updatedContacts.some(c => c.isPrimary)) {
        return {
          success: false,
          error: {
            code: 'CONTACT_NOT_FOUND',
            message: 'Emergency contact not found',
            details: { contactId }
          },
          timestamp: new Date()
        };
      }

      return await this.updateProfile(userId, { emergencyContacts: updatedContacts });

    } catch (error: any) {
      console.error('Set primary emergency contact error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to set primary emergency contact',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  // =============================================
  // PROFILE ANALYSIS
  // =============================================

  /**
   * Get profile completion status
   */
  async getProfileCompletion(userId: string): Promise<ApiResponse<ProfileCompletionStatus>> {
    try {
      const profileResponse = await this.getProfile(userId);
      if (!profileResponse.success || !profileResponse.data) {
        return {
          success: false,
          error: profileResponse.error,
          timestamp: new Date()
        };
      }

      const completionStatus = calculateProfileCompletion(profileResponse.data);
      
      return {
        success: true,
        data: completionStatus,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Get profile completion error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to calculate profile completion',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate profile data
   */
  validateProfileData(profileData: Partial<UserProfile>): ValidationResult {
    return validateProfile(profileData);
  }

  // =============================================
  // SEARCH AND QUERY
  // =============================================

  /**
   * Search profiles based on criteria
   */
  async searchProfiles(criteria: ProfileSearchCriteria): Promise<ApiResponse<UserProfile[]>> {
    try {
      let q = query(collection(db, 'profiles'));

      // Apply filters
      if (criteria.userId) {
        q = query(q, where('userId', '==', criteria.userId));
      }

      if (criteria.bloodType) {
        q = query(q, where('medicalInfo.bloodType', '==', criteria.bloodType));
      }

      if (criteria.isComplete !== undefined) {
        q = query(q, where('isComplete', '==', criteria.isComplete));
      }

      if (criteria.createdAfter) {
        q = query(q, where('createdAt', '>=', criteria.createdAfter));
      }

      if (criteria.createdBefore) {
        q = query(q, where('createdAt', '<=', criteria.createdBefore));
      }

      // Add ordering
      q = query(q, orderBy('updatedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const profiles: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        profiles.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastAccessedAt: data.lastAccessedAt?.toDate() || new Date()
        } as UserProfile);
      });

      return {
        success: true,
        data: profiles,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Search profiles error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to search profiles',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get profiles by user type
   */
  async getProfilesByUserType(userType: 'individual' | 'medical_professional'): Promise<ApiResponse<UserProfile[]>> {
    try {
      // First get users of the specified type
      const usersQuery = query(
        collection(db, 'users'),
        where('userType', '==', userType)
      );

      const usersSnapshot = await getDocs(usersQuery);
      const userIds = usersSnapshot.docs.map(doc => doc.id);

      if (userIds.length === 0) {
        return {
          success: true,
          data: [],
          timestamp: new Date()
        };
      }

      // Get profiles for these users
      const profiles: UserProfile[] = [];
      for (const userId of userIds) {
        const profileResponse = await this.getProfile(userId);
        if (profileResponse.success && profileResponse.data) {
          profiles.push(profileResponse.data);
        }
      }

      return {
        success: true,
        data: profiles,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Get profiles by user type error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to get profiles by user type',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  // =============================================
  // AUDIT AND LOGGING
  // =============================================

  /**
   * Log profile access
   */
  async logProfileAccess(profileId: string, accessLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<ApiResponse<void>> {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const auditLog: AuditLog = {
        ...accessLog,
        id: logId,
        timestamp: new Date()
      };

      await setDoc(doc(db, 'audit_logs', logId), {
        ...auditLog,
        timestamp: serverTimestamp()
      });

      return {
        success: true,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Log profile access error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to log profile access',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get profile access logs
   */
  async getProfileAccessLogs(profileId: string, logLimit: number = 50): Promise<ApiResponse<AuditLog[]>> {
    try {
      const q = query(
        collection(db, 'audit_logs'),
        where('profileId', '==', profileId),
        orderBy('timestamp', 'desc'),
        limit(logLimit)
      );

      const querySnapshot = await getDocs(q);
      const logs: AuditLog[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date()
        } as AuditLog);
      });

      return {
        success: true,
        data: logs,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Get profile access logs error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to get profile access logs',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Clean up old audit logs based on retention policies
   */
  async cleanupAuditLogs(profileId?: string): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const { RETENTION_DAYS, MAX_LOGS_PER_PROFILE } = CONFIG.AUDIT;
      let totalDeleted = 0;

      if (profileId) {
        // Clean up logs for specific profile
        totalDeleted = await this.cleanupProfileAuditLogs(profileId, RETENTION_DAYS, MAX_LOGS_PER_PROFILE);
      } else {
        // Clean up logs for all profiles (admin operation)
        const profilesQuery = query(collection(db, 'user_profiles'));
        const profilesSnapshot = await getDocs(profilesQuery);
        
        for (const profileDoc of profilesSnapshot.docs) {
          const profileIdToClean = profileDoc.id;
          const deleted = await this.cleanupProfileAuditLogs(profileIdToClean, RETENTION_DAYS, MAX_LOGS_PER_PROFILE);
          totalDeleted += deleted;
        }
      }

      console.log(`Audit cleanup completed: ${totalDeleted} logs deleted`);
      
      return {
        success: true,
        data: { deletedCount: totalDeleted },
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Audit cleanup error:', error);
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Failed to cleanup audit logs',
          details: error
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Clean up audit logs for a specific profile
   */
  private async cleanupProfileAuditLogs(
    profileId: string, 
    retentionDays: number, 
    maxLogsPerProfile: number
  ): Promise<number> {
    let deletedCount = 0;

    try {
      // Step 1: Delete logs older than retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldLogsQuery = query(
        collection(db, 'audit_logs'),
        where('profileId', '==', profileId),
        where('timestamp', '<', cutoffDate)
      );

      const oldLogsSnapshot = await getDocs(oldLogsQuery);
      
      // Delete old logs in batches
      const batch = writeBatch(db);
      oldLogsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (oldLogsSnapshot.size > 0) {
        await batch.commit();
        console.log(`Deleted ${oldLogsSnapshot.size} old audit logs for profile ${profileId}`);
      }

      // Step 2: Enforce maximum logs per profile limit
      const allLogsQuery = query(
        collection(db, 'audit_logs'),
        where('profileId', '==', profileId),
        orderBy('timestamp', 'desc')
      );

      const allLogsSnapshot = await getDocs(allLogsQuery);
      
      if (allLogsSnapshot.size > maxLogsPerProfile) {
        const excessLogs = allLogsSnapshot.size - maxLogsPerProfile;
        const logsToDelete = allLogsSnapshot.docs.slice(maxLogsPerProfile);
        
        const excessBatch = writeBatch(db);
        logsToDelete.forEach((doc) => {
          excessBatch.delete(doc.ref);
        });

        await excessBatch.commit();
        deletedCount += excessLogs;
        
        console.log(`Deleted ${excessLogs} excess audit logs for profile ${profileId} (over limit of ${maxLogsPerProfile})`);
      }

    } catch (error: any) {
      console.error(`Error cleaning up audit logs for profile ${profileId}:`, error);
      throw error;
    }

    return deletedCount;
  }

  /**
   * Get audit log statistics for monitoring
   */
  async getAuditLogStatistics(profileId?: string): Promise<ApiResponse<{
    totalLogs: number;
    oldestLog?: Date;
    newestLog?: Date;
    logsByType: Record<string, number>;
    logsByAccessorType: Record<string, number>;
  }>> {
    try {
      let logsQuery;
      
      if (profileId) {
        logsQuery = query(
          collection(db, 'audit_logs'),
          where('profileId', '==', profileId),
          orderBy('timestamp', 'desc')
        );
      } else {
        logsQuery = query(
          collection(db, 'audit_logs'),
          orderBy('timestamp', 'desc')
        );
      }

      const snapshot = await getDocs(logsQuery);
      const logs = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as AuditLog[];

      const stats = {
        totalLogs: logs.length,
        oldestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : undefined,
        newestLog: logs.length > 0 ? logs[0].timestamp : undefined,
        logsByType: {} as Record<string, number>,
        logsByAccessorType: {} as Record<string, number>
      };

      // Count logs by type
      logs.forEach(log => {
        stats.logsByType[log.accessType] = (stats.logsByType[log.accessType] || 0) + 1;
        stats.logsByAccessorType[log.accessorType] = (stats.logsByAccessorType[log.accessorType] || 0) + 1;
      });

      return {
        success: true,
        data: stats,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('Get audit statistics error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to get audit log statistics',
          details: error
        },
        timestamp: new Date()
      };
    }
  }
}

// =============================================
// EXPORT SINGLETON INSTANCE
// =============================================

const profileService = new ProfileServiceImpl();
export default profileService;