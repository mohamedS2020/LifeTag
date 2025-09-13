import { UserProfile, EmergencyContact, MedicalCondition } from '../types';

/**
 * QR Code Service for Emergency Medical Information
 * Handles QR code generation and data encoding for offline emergency access
 */

// Emergency data format for QR codes (offline readable)
export interface EmergencyQRData {
  version: string; // QR format version for future compatibility
  name: string;
  bloodType?: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  } | null;
  emergencyNote?: string;
  hasFullProfile: boolean; // Indicates if full profile is available in app
  profileId?: string; // For app-based scanning
  timestamp: string; // When QR was generated
}

// QR encoding format options
export interface QREncodingOptions {
  includeProfileId?: boolean; // Include profile ID for app scanning
  maxLength?: number; // Maximum QR code content length
  emergencyOnly?: boolean; // Only include critical emergency data
  compressData?: boolean; // Compress data for smaller QR codes
}

/**
 * QR Service Class
 */
export class QRService {
  
  // Maximum QR code data length (for reliable scanning)
  private static readonly MAX_QR_LENGTH = 1000;
  private static readonly QR_VERSION = '1.0';
  
  /**
   * Generate emergency QR data from user profile
   */
  static generateEmergencyData(
    profile: UserProfile, 
    options: QREncodingOptions = {}
  ): EmergencyQRData {
    const { 
      includeProfileId = true, 
      emergencyOnly = false 
    } = options;

    // Extract basic info
    const name = `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`;
    const bloodType = profile.medicalInfo.bloodType || undefined;
    
    // Extract allergies (critical ones first)
    const allergies = this.extractCriticalAllergies(profile.medicalInfo.allergies || []);
    
    // Get primary emergency contact
    const primaryContact = this.getPrimaryEmergencyContact(profile.emergencyContacts);
    
    // Emergency medical info
    const emergencyNote = profile.medicalInfo.emergencyMedicalInfo;

    const emergencyData: EmergencyQRData = {
      version: this.QR_VERSION,
      name,
      bloodType,
      allergies,
      emergencyContact: primaryContact,
      emergencyNote,
      hasFullProfile: !emergencyOnly,
      profileId: includeProfileId ? profile.id : undefined,
      timestamp: new Date().toISOString()
    };

    return emergencyData;
  }

  /**
   * Encode emergency data into QR string format
   * Format: "N:FirstName LastName;BT:BloodType;ALG:Allergy1,Allergy2;EC:ContactName-Phone-Relationship;NOTE:Emergency info;APP:ProfileId"
   */
  static encodeQRString(emergencyData: EmergencyQRData): string {
    const parts: string[] = [];
    
    // Version
    parts.push(`V:${emergencyData.version}`);
    
    // Name
    parts.push(`N:${emergencyData.name}`);
    
    // Blood type
    if (emergencyData.bloodType) {
      parts.push(`BT:${emergencyData.bloodType}`);
    }
    
    // Allergies
    if (emergencyData.allergies.length > 0) {
      const allergiesStr = emergencyData.allergies.join(',');
      parts.push(`ALG:${allergiesStr}`);
    }
    
    // Emergency contact
    if (emergencyData.emergencyContact) {
      const contact = emergencyData.emergencyContact;
      parts.push(`EC:${contact.name}-${contact.phone}-${contact.relationship}`);
    }
    
    // Emergency note
    if (emergencyData.emergencyNote) {
      // Truncate long notes for QR code size
      const note = emergencyData.emergencyNote.length > 100 
        ? emergencyData.emergencyNote.substring(0, 100) + '...'
        : emergencyData.emergencyNote;
      parts.push(`NOTE:${note}`);
    }
    
    // Full profile available indicator
    if (emergencyData.hasFullProfile) {
      parts.push('FULL access in LifeTag app');
    }
    
    // Timestamp
    parts.push(`TS:${emergencyData.timestamp}`);
    
    const qrString = parts.join(';');
    
    // Check length and truncate if necessary
    if (qrString.length > this.MAX_QR_LENGTH) {
      return this.truncateQRString(qrString);
    }
    
    return qrString;
  }

  /**
   * Decode QR string back to emergency data
   */
  static decodeQRString(qrString: string): EmergencyQRData | null {
    try {
      const parts = qrString.split(';');
      const data: Partial<EmergencyQRData> = {
        allergies: [],
        hasFullProfile: false
      };
      
      for (const part of parts) {
        const [key, value] = part.split(':');
        
        switch (key) {
          case 'V':
            data.version = value;
            break;
          case 'N':
            data.name = value;
            break;
          case 'BT':
            data.bloodType = value;
            break;
          case 'ALG':
            data.allergies = value ? value.split(',') : [];
            break;
          case 'EC':
            const [name, phone, relationship] = value.split('-');
            data.emergencyContact = { name, phone, relationship };
            break;
          case 'NOTE':
            data.emergencyNote = value;
            break;
          case 'APP':
            data.profileId = value;
            break;
          case 'FULL':
            data.hasFullProfile = value === '1';
            break;
          case 'TS':
            data.timestamp = value;
            break;
        }
      }
      
      // Validate required fields
      if (!data.name || !data.version) {
        return null;
      }
      
      return data as EmergencyQRData;
    } catch (error) {
      console.error('Error decoding QR string:', error);
      return null;
    }
  }

  /**
   * Generate QR code data for profile
   */
  static generateQRData(
    profile: UserProfile, 
    options: QREncodingOptions = {}
  ): string {
    const emergencyData = this.generateEmergencyData(profile, options);
    return this.encodeQRString(emergencyData);
  }

  /**
   * Check if QR code was generated by our app
   */
  static isAppGeneratedQR(qrString: string): boolean {
    return qrString.includes('APP:') && qrString.includes('V:');
  }

  /**
   * Extract profile ID from QR code (if available)
   */
  static extractProfileId(qrString: string): string | null {
    const match = qrString.match(/APP:([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validate QR code format and version compatibility
   */
  static validateQRCode(qrString: string): {
    isValid: boolean;
    version?: string;
    isCompatible: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const decoded = this.decodeQRString(qrString);
    
    if (!decoded) {
      return {
        isValid: false,
        isCompatible: false,
        errors: ['Invalid QR code format']
      };
    }
    
    // Check version compatibility
    const isCompatible = decoded.version === this.QR_VERSION;
    if (!isCompatible) {
      errors.push(`QR code version ${decoded.version} may not be fully compatible with current version ${this.QR_VERSION}`);
    }
    
    // Validate required fields
    if (!decoded.name) {
      errors.push('Missing name information');
    }
    
    if (!decoded.emergencyContact) {
      errors.push('Missing emergency contact information');
    }
    
    return {
      isValid: errors.length === 0 || isCompatible,
      version: decoded.version,
      isCompatible,
      errors
    };
  }

  /**
   * Generate QR code options based on profile completeness
   */
  static getOptimalQROptions(profile: UserProfile): QREncodingOptions {
    const hasFullProfile = profile.isComplete;
    const hasEmergencyInfo = !!profile.medicalInfo.emergencyMedicalInfo;
    
    // If profile is incomplete, focus on emergency data only
    if (!hasFullProfile) {
      return {
        emergencyOnly: true,
        includeProfileId: false,
        compressData: true
      };
    }
    
    // If we have emergency info, include it with profile ID
    return {
      emergencyOnly: false,
      includeProfileId: true,
      compressData: hasEmergencyInfo
    };
  }

  // PRIVATE HELPER METHODS

  /**
   * Extract critical allergies for emergency display
   */
  private static extractCriticalAllergies(allergies: string[]): string[] {
    // Critical allergy keywords that should always be included
    const criticalKeywords = [
      'penicillin', 'latex', 'shellfish', 'peanuts', 'tree nuts',
      'bee', 'wasp', 'sulfa', 'iodine', 'aspirin'
    ];
    
    const criticalAllergies: string[] = [];
    const normalAllergies: string[] = [];
    
    allergies.forEach(allergy => {
      if (!allergy || !allergy.trim()) return;
      
      const allergyName = allergy.toLowerCase();
      const isCritical = criticalKeywords.some(keyword => 
        allergyName.includes(keyword)
      );
      
      if (isCritical) {
        criticalAllergies.push(allergy);
      } else {
        normalAllergies.push(allergy);
      }
    });
    
    // Prioritize critical allergies, then add normal ones if space allows
    const maxAllergies = 5; // Limit for QR code size
    return [...criticalAllergies, ...normalAllergies].slice(0, maxAllergies);
  }

  /**
   * Get the primary emergency contact
   */
  private static getPrimaryEmergencyContact(
    contacts: EmergencyContact[]
  ): EmergencyQRData['emergencyContact'] {
    if (!contacts.length) return null;
    
    // Find primary contact
    const primary = contacts.find(contact => contact.isPrimary);
    const contact = primary || contacts[0]; // Fallback to first contact
    
    return {
      name: contact.name,
      phone: contact.phoneNumber,
      relationship: contact.relationship
    };
  }

  /**
   * Truncate QR string to fit size limits while preserving critical data
   */
  private static truncateQRString(qrString: string): string {
    const parts = qrString.split(';');
    const criticalParts: string[] = [];
    const optionalParts: string[] = [];
    
    // Separate critical vs optional parts
    parts.forEach(part => {
      const [key] = part.split(':');
      if (['V', 'N', 'BT', 'ALG', 'EC'].includes(key)) {
        criticalParts.push(part);
      } else {
        optionalParts.push(part);
      }
    });
    
    // Start with critical parts
    let result = criticalParts.join(';');
    
    // Add optional parts if space allows
    for (const part of optionalParts) {
      const newResult = result + ';' + part;
      if (newResult.length <= this.MAX_QR_LENGTH) {
        result = newResult;
      } else {
        break;
      }
    }
    
    return result;
  }
}

/**
 * QR Code Generation Helper
 */
export interface QRCodeGenerationResult {
  qrData: string;
  emergencyData: EmergencyQRData;
  isOptimized: boolean;
  warnings: string[];
}

export class QRCodeGenerator {
  
  /**
   * Generate complete QR code data with optimization
   */
  static generateForProfile(
    profile: UserProfile,
    customOptions?: Partial<QREncodingOptions>
  ): QRCodeGenerationResult {
    const warnings: string[] = [];
    
    // Get optimal options for this profile
    const optimalOptions = QRService.getOptimalQROptions(profile);
    const options = { ...optimalOptions, ...customOptions };
    
    // Generate emergency data
    const emergencyData = QRService.generateEmergencyData(profile, options);
    
    // Generate QR string
    const qrData = QRService.encodeQRString(emergencyData);
    
    // Check for warnings
    if (!profile.isComplete) {
      warnings.push('Profile is incomplete - QR code contains limited information');
    }
    
    if (!emergencyData.emergencyContact) {
      warnings.push('No emergency contact available - consider adding one');
    }
    
    if (!emergencyData.bloodType) {
      warnings.push('Blood type not specified - important for emergency care');
    }
    
    if (emergencyData.allergies.length === 0) {
      warnings.push('No allergies listed - verify if this is accurate');
    }
    
    return {
      qrData,
      emergencyData,
      isOptimized: qrData.length <= QRService['MAX_QR_LENGTH'],
      warnings
    };
  }
  
  /**
   * Regenerate QR code when profile data changes
   */
  static shouldRegenerateQR(
    currentQRData: string,
    updatedProfile: UserProfile
  ): boolean {
    const currentDecoded = QRService.decodeQRString(currentQRData);
    if (!currentDecoded) return true;
    
    const newData = QRService.generateEmergencyData(updatedProfile);
    
    // Check if critical emergency data has changed
    return (
      currentDecoded.name !== newData.name ||
      currentDecoded.bloodType !== newData.bloodType ||
      JSON.stringify(currentDecoded.allergies) !== JSON.stringify(newData.allergies) ||
      JSON.stringify(currentDecoded.emergencyContact) !== JSON.stringify(newData.emergencyContact) ||
      currentDecoded.emergencyNote !== newData.emergencyNote
    );
  }
}

export default QRService;