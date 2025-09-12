import { User, MedicalProfessional } from '../types';
import { MedicalProfessionalApprovalService } from './medicalProfessionalApprovalService';

/**
 * Medical Professional Access Service
 * Handles privileged access for verified medical professionals
 */
export class MedicalProfessionalAccessService {
  
  /**
   * Check if the current user is a verified medical professional
   * @param currentUser - The currently authenticated user
   * @returns Promise<boolean> - True if user is verified medical professional
   */
  static async isVerifiedMedicalProfessional(currentUser: User | null): Promise<boolean> {
    try {
      // Check if user exists and is medical professional type
      if (!currentUser || currentUser.userType !== 'medical_professional') {
        return false;
      }

      // Check if user has isVerified flag (quick check)
      if (currentUser.isVerified === true) {
        return true;
      }

      // If no verification flag or it's false, check in medical professionals collection
      const professionals = await MedicalProfessionalApprovalService.getAllProfessionals();
      const userProfessional = professionals.find(prof => prof.userId === currentUser.id);
      
      return userProfessional?.verificationStatus.isVerified === true;
    } catch (error) {
      console.error('Error checking medical professional verification:', error);
      return false;
    }
  }

  /**
   * Get medical professional data for the current user
   * @param currentUser - The currently authenticated user
   * @returns Promise<MedicalProfessional | null> - Medical professional data if found
   */
  static async getMedicalProfessionalData(currentUser: User | null): Promise<MedicalProfessional | null> {
    try {
      if (!currentUser || currentUser.userType !== 'medical_professional') {
        return null;
      }

      const professionals = await MedicalProfessionalApprovalService.getAllProfessionals();
      return professionals.find(prof => prof.userId === currentUser.id) || null;
    } catch (error) {
      console.error('Error fetching medical professional data:', error);
      return null;
    }
  }

  /**
   * Check if a medical professional can access a specific profile
   * @param currentUser - The currently authenticated user
   * @param profileUserId - The ID of the profile being accessed
   * @param profilePrivacySettings - Privacy settings of the profile being accessed
   * @returns Promise<AccessResult> - Access permission and details
   */
  static async canAccessProfile(
    currentUser: User | null,
    profileUserId: string,
    profilePrivacySettings: {
      allowMedicalProfessionalAccess: boolean;
      requirePasswordForFullAccess: boolean;
    }
  ): Promise<AccessResult> {
    try {
      // Can't access own profile with professional privileges
      if (currentUser?.id === profileUserId) {
        return {
          canAccess: false,
          bypassPassword: false,
          reason: 'Cannot access own profile with professional privileges'
        };
      }

      // Check if profile allows medical professional access
      if (!profilePrivacySettings.allowMedicalProfessionalAccess) {
        return {
          canAccess: false,
          bypassPassword: false,
          reason: 'Profile does not allow medical professional access'
        };
      }

      // Check if current user is verified medical professional
      const isVerified = await this.isVerifiedMedicalProfessional(currentUser);
      if (!isVerified) {
        return {
          canAccess: false,
          bypassPassword: false,
          reason: 'User is not a verified medical professional'
        };
      }

      // Get professional data for audit logging
      const professionalData = await this.getMedicalProfessionalData(currentUser);

      return {
        canAccess: true,
        bypassPassword: true,
        reason: 'Verified medical professional access granted',
        professionalData: professionalData,
        accessType: 'medical_professional_privileged'
      };
    } catch (error) {
      console.error('Error checking profile access:', error);
      return {
        canAccess: false,
        bypassPassword: false,
        reason: 'Error occurred while checking access permissions'
      };
    }
  }

  /**
   * Log medical professional access to a profile (for audit trail)
   * @param accessDetails - Details of the access event
   */
  static async logProfileAccess(accessDetails: ProfileAccessLog): Promise<void> {
    try {
      // TODO: Implement audit logging to Firestore
      // This would store access logs for compliance and security
      console.log('Medical Professional Profile Access:', {
        timestamp: new Date().toISOString(),
        professionalId: accessDetails.professionalId,
        professionalName: accessDetails.professionalName,
        professionalLicense: accessDetails.professionalLicense,
        accessedProfileId: accessDetails.accessedProfileId,
        accessedProfileName: accessDetails.accessedProfileName,
        accessType: accessDetails.accessType,
        reason: accessDetails.reason
      });

      // In a real implementation, this would save to Firestore:
      // await addDoc(collection(db, 'profile_access_logs'), {
      //   ...accessDetails,
      //   timestamp: serverTimestamp()
      // });
    } catch (error) {
      console.error('Error logging profile access:', error);
      // Don't throw error - logging failure shouldn't break access
    }
  }

  /**
   * Create access log entry for a medical professional accessing a profile
   * @param professional - Medical professional data
   * @param profileId - ID of accessed profile
   * @param profileName - Name of profile owner
   * @param accessType - Type of access granted
   * @returns ProfileAccessLog - Formatted log entry
   */
  static createAccessLog(
    professional: MedicalProfessional,
    profileId: string,
    profileName: string,
    accessType: string = 'medical_professional_privileged'
  ): ProfileAccessLog {
    return {
      professionalId: professional.id,
      professionalUserId: professional.userId,
      professionalName: `${professional.personalInfo.firstName} ${professional.personalInfo.lastName}`,
      professionalLicense: professional.professionalInfo.licenseNumber,
      professionalSpecialty: professional.professionalInfo.specialty,
      accessedProfileId: profileId,
      accessedProfileName: profileName,
      accessType: accessType,
      reason: 'Verified medical professional access',
      timestamp: new Date()
    };
  }

  /**
   * Format professional credentials for display in access logs
   * @param professional - Medical professional data
   * @returns string - Formatted credentials
   */
  static formatProfessionalCredentials(professional: MedicalProfessional): string {
    const parts = [
      `${professional.personalInfo.firstName} ${professional.personalInfo.lastName}`,
      professional.professionalInfo.specialty,
      `License: ${professional.professionalInfo.licenseNumber}`,
    ];

    if (professional.professionalInfo.hospitalAffiliation) {
      parts.push(professional.professionalInfo.hospitalAffiliation);
    }

    return parts.join(' • ');
  }
}

/**
 * Interface for access permission results
 */
export interface AccessResult {
  canAccess: boolean;
  bypassPassword: boolean;
  reason: string;
  professionalData?: MedicalProfessional | null;
  accessType?: string;
}

/**
 * Interface for profile access logging
 */
export interface ProfileAccessLog {
  professionalId: string;
  professionalUserId: string;
  professionalName: string;
  professionalLicense: string;
  professionalSpecialty?: string;
  accessedProfileId: string;
  accessedProfileName: string;
  accessType: string;
  reason: string;
  timestamp: Date;
}

export default MedicalProfessionalAccessService;