import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MedicalProfessionalAccessService, AccessResult } from '../services/medicalProfessionalAccessService';
import { MedicalProfessional } from '../types';

/**
 * Custom hook for medical professional access functionality
 */
export const useMedicalProfessionalAccess = () => {
  const { user: currentUser } = useAuth();
  const [isVerifiedProfessional, setIsVerifiedProfessional] = useState(false);
  const [professionalData, setProfessionalData] = useState<MedicalProfessional | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check if current user is a verified medical professional
   */
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        setLoading(true);
        
        const isVerified = await MedicalProfessionalAccessService.isVerifiedMedicalProfessional(currentUser);
        setIsVerifiedProfessional(isVerified);

        if (isVerified) {
          const data = await MedicalProfessionalAccessService.getMedicalProfessionalData(currentUser);
          setProfessionalData(data);
        } else {
          setProfessionalData(null);
        }
      } catch (error) {
        console.error('Error checking professional verification:', error);
        setIsVerifiedProfessional(false);
        setProfessionalData(null);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [currentUser]);

  /**
   * Check if the medical professional can access a specific profile
   * @param profileUserId - ID of the profile to access
   * @param profilePrivacySettings - Privacy settings of the profile
   * @returns Promise<AccessResult> - Access permission details
   */
  const checkProfileAccess = async (
    profileUserId: string,
    profilePrivacySettings: {
      allowMedicalProfessionalAccess: boolean;
      requirePasswordForFullAccess: boolean;
    }
  ): Promise<AccessResult> => {
    return await MedicalProfessionalAccessService.canAccessProfile(
      currentUser,
      profileUserId,
      profilePrivacySettings
    );
  };

  /**
   * Log access to a profile for audit trail
   * @param profileId - ID of accessed profile
   * @param profileName - Name of profile owner
   * @param accessType - Type of access granted
   */
  const logProfileAccess = async (
    profileId: string,
    profileName: string,
    accessType: string = 'medical_professional_privileged'
  ) => {
    if (!professionalData) return;

    const accessLog = MedicalProfessionalAccessService.createAccessLog(
      professionalData,
      profileId,
      profileName,
      accessType
    );
    
    await MedicalProfessionalAccessService.logProfileAccess(accessLog);
  };

  /**
   * Get formatted credentials for display
   * @returns string - Formatted professional credentials
   */
  const getFormattedCredentials = (): string => {
    if (!professionalData) return '';
    return MedicalProfessionalAccessService.formatProfessionalCredentials(professionalData);
  };

  return {
    // Status
    isVerifiedProfessional,
    professionalData,
    loading,
    
    // Functions
    checkProfileAccess,
    logProfileAccess,
    getFormattedCredentials,
    
    // Helper properties
    canBypassPassword: isVerifiedProfessional,
    hasPrivilegedAccess: isVerifiedProfessional,
  };
};

export default useMedicalProfessionalAccess;