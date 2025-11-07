import { UserProfile, EmergencyContact, MedicalCondition } from '../types';

/**
 * QR Code Service for Emergency Medical Information
 * Handles QR code generation and data encoding for offline emergency access
 */

// Cache interface for QR data
interface QRCacheEntry {
  qrData: string;
  emergencyData: EmergencyQRData;
  dataHash: string;
  timestamp: number;
}

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
  
  // In-memory cache for QR data
  private static qrCache = new Map<string, QRCacheEntry>();
  
  /**
   * Generate hash for emergency data to detect changes
   */
  private static generateDataHash(profile: UserProfile, options: QREncodingOptions): string {
    const { includeProfileId = true, emergencyOnly = false } = options;
    
    // Include only data that affects QR content
    const hashData = {
      name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
      bloodType: profile.medicalInfo.bloodType,
      allergies: profile.medicalInfo.allergies,
      emergencyMedicalInfo: profile.medicalInfo.emergencyMedicalInfo,
      emergencyContacts: profile.emergencyContacts,
      requirePassword: profile.privacySettings?.requirePasswordForFullAccess,
      profileId: includeProfileId ? profile.id : null,
      emergencyOnly,
      options: { includeProfileId, emergencyOnly }
    };
    
    return JSON.stringify(hashData);
  }
  
  /**
   * Get cached QR data or generate new if changed
   */
  static getCachedOrGenerateQR(
    profile: UserProfile, 
    options: QREncodingOptions = {},
    forceRefresh: boolean = false
  ): { qrData: string; emergencyData: EmergencyQRData; fromCache: boolean } {
    const cacheKey = profile.id;
    const dataHash = this.generateDataHash(profile, options);
    const cached = this.qrCache.get(cacheKey);
    
    // Check if we can use cached data
    if (!forceRefresh && cached && cached.dataHash === dataHash) {
      console.log('QR: Using cached data for profile', profile.id);
      return {
        qrData: cached.qrData,
        emergencyData: cached.emergencyData,
        fromCache: true
      };
    }
    
    // Generate new QR data
    console.log('QR: Generating new data for profile', profile.id, forceRefresh ? '(forced)' : '(data changed)');
    const emergencyData = this.generateEmergencyData(profile, options);
    const qrData = this.encodeQRString(emergencyData);
    
    // Cache the result
    this.qrCache.set(cacheKey, {
      qrData,
      emergencyData,
      dataHash,
      timestamp: Date.now()
    });
    
    return { qrData, emergencyData, fromCache: false };
  }
  
  /**
   * Clear cache for specific profile or all profiles
   */
  static clearCache(profileId?: string): void {
    if (profileId) {
      this.qrCache.delete(profileId);
      console.log('QR: Cleared cache for profile', profileId);
    } else {
      this.qrCache.clear();
      console.log('QR: Cleared all QR cache');
    }
  }
  
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
   * Encode emergency data into QR string format - Professional Medical ID Card Style
   * Format: Human-readable emergency medical information followed by technical data
   */
  static encodeQRString(emergencyData: EmergencyQRData): string {
    const lines: string[] = [];
    
    // Medical Emergency ID Header
    lines.push('═══ EMERGENCY MEDICAL ID ═══');
    lines.push('');
    
    // Patient Name (Most prominent)
    lines.push(`PATIENT: ${emergencyData.name.toUpperCase()}`);
    lines.push('');
    
    // Critical Medical Information
    if (emergencyData.bloodType) {
      lines.push(`🩸 BLOOD TYPE: ${emergencyData.bloodType}`);
    }
    
    // Allergies (Critical Warning)
    if (emergencyData.allergies.length > 0) {
      lines.push(`⚠️  ALLERGIES:`);
      emergencyData.allergies.forEach(allergy => {
        lines.push(`   • ${allergy}`);
      });
    }
    
    // Emergency Contact - Modified to prevent iPhone auto-detection
    if (emergencyData.emergencyContact) {
      const contact = emergencyData.emergencyContact;
      lines.push('');
      lines.push('📞 EMERGENCY CONTACT:');
      lines.push(`   ${contact.name} (${contact.relationship})`);
      // Format phone to prevent auto-detection: add spaces and text
      const formattedPhone = contact.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
      lines.push(`   Phone: ${formattedPhone}`);
    }
    
    // Emergency Medical Notes
    if (emergencyData.emergencyNote) {
      lines.push('');
      lines.push('🏥 MEDICAL NOTES:');
      // Split long notes into readable lines
      const note = emergencyData.emergencyNote.length > 150 
        ? emergencyData.emergencyNote.substring(0, 150) + '...'
        : emergencyData.emergencyNote;
      
      // Break into 50-char lines for readability
      const words = note.split(' ');
      let currentLine = '   ';
      words.forEach(word => {
        if (currentLine.length + word.length + 1 > 50) {
          lines.push(currentLine);
          currentLine = '   ' + word;
        } else {
          currentLine += (currentLine === '   ' ? '' : ' ') + word;
        }
      });
      if (currentLine !== '   ') {
        lines.push(currentLine);
      }
    }
    
    // Additional Information
    lines.push('');
    lines.push('───────────────────────────');
    
    if (emergencyData.hasFullProfile) {
      lines.push('📱 Full medical profile available in LifeTag app');
    }
    
    const updateDate = new Date(emergencyData.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
    lines.push(`📅 Updated: ${updateDate}`);
    lines.push('🔒 Generated by LifeTag Medical ID');
    
    // Technical data (for app parsing) - less prominent
    const techData: string[] = [];
    techData.push(`V:${emergencyData.version}`);
    techData.push(`N:${emergencyData.name}`);
    if (emergencyData.bloodType) techData.push(`BT:${emergencyData.bloodType}`);
    if (emergencyData.allergies.length > 0) techData.push(`ALG:${emergencyData.allergies.join(',')}`);
    if (emergencyData.emergencyContact) {
      const c = emergencyData.emergencyContact;
      // Encode phone number to prevent iPhone detection
      const encodedPhone = btoa(c.phone); // Base64 encode the phone number
      techData.push(`EC:${c.name}-${encodedPhone}-${c.relationship}`);
    }
    if (emergencyData.emergencyNote) {
      const note = emergencyData.emergencyNote.length > 100 
        ? emergencyData.emergencyNote.substring(0, 100) + '...'
        : emergencyData.emergencyNote;
      techData.push(`NOTE:${note}`);
    }
    if (emergencyData.profileId) {
      const encodedId = btoa(emergencyData.profileId);
      techData.push(`LT:${encodedId}`);
    }
    techData.push(`TS:${emergencyData.timestamp}`);
    
    // Add technical data at the end (separated)
    lines.push('');
    lines.push(`APP_DATA: ${techData.join(';')}`);
    
    const qrString = lines.join('\n');
    
    // Check length and truncate if necessary
    if (qrString.length > this.MAX_QR_LENGTH) {
      return this.truncateQRString(qrString);
    }
    
    return qrString;
  }

  /**
   * Decode QR string back to emergency data
   * Supports both new human-readable format and legacy technical format
   */
  static decodeQRString(qrString: string): EmergencyQRData | null {
    try {
      // Check if this is the new human-readable format
      if (qrString.includes('EMERGENCY MEDICAL ID') || qrString.includes('DATA:')) {
        return this.decodeHumanReadableFormat(qrString);
      }
      
      // Legacy technical format (backward compatibility)
      return this.decodeTechnicalFormat(qrString);
    } catch (error) {
      console.error('Error decoding QR string:', error);
      return null;
    }
  }

  /**
   * Decode new human-readable QR format
   */
  private static decodeHumanReadableFormat(qrString: string): EmergencyQRData | null {
    try {
      const lines = qrString.split('\n');
      const data: Partial<EmergencyQRData> = {
        allergies: [],
        hasFullProfile: false
      };

      // Extract technical data from APP_DATA: or DATA: line (backward compatibility)
      const dataLine = lines.find(line => line.startsWith('APP_DATA:') || line.startsWith('DATA:'));
      if (dataLine) {
        const techData = dataLine.replace(/^(APP_DATA:|DATA:)/, '').trim();
        const decoded = this.decodeTechnicalFormat(techData);
        if (decoded) {
          Object.assign(data, decoded);
        }
      }

      // Also parse human-readable content for fallback
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('PATIENT:')) {
          data.name = trimmed.replace('PATIENT:', '').trim();
        } else if (trimmed.includes('BLOOD TYPE:')) {
          data.bloodType = trimmed.split('BLOOD TYPE:')[1].trim();
        } else if (trimmed.startsWith('📱') && trimmed.includes('LifeTag app')) {
          data.hasFullProfile = true;
        }
      }

      // Validate required fields
      if (!data.name || !data.version) {
        return null;
      }

      return data as EmergencyQRData;
    } catch (error) {
      console.error('Error decoding human-readable format:', error);
      return null;
    }
  }

  /**
   * Decode legacy technical QR format
   */
  private static decodeTechnicalFormat(qrString: string): EmergencyQRData | null {
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
            const [name, encodedPhone, relationship] = value.split('-');
            // Try to decode base64 phone, fallback to plain text for backward compatibility
            let phone = encodedPhone;
            try {
              phone = atob(encodedPhone);
            } catch (error) {
              // If decoding fails, assume it's plain text (old format)
              phone = encodedPhone;
            }
            data.emergencyContact = { name, phone, relationship };
            break;
          case 'NOTE':
            data.emergencyNote = value;
            break;
          case 'APP':
            data.profileId = value;
            break;
          case 'LT':
            // Decode hidden profileId (LifeTag internal)
            try {
              data.profileId = atob(value);
            } catch (error) {
              console.warn('Failed to decode LifeTag internal ID:', error);
            }
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
      console.error('Error decoding technical format:', error);
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
   * Generate complete QR code data with optimization and caching
   */
  static generateForProfile(
    profile: UserProfile,
    customOptions?: Partial<QREncodingOptions>,
    forceRefresh: boolean = false
  ): QRCodeGenerationResult {
    const warnings: string[] = [];
    
    // Get optimal options for this profile
    const optimalOptions = QRService.getOptimalQROptions(profile);
    const options = { ...optimalOptions, ...customOptions };
    
    // Get cached or generate new QR data
    const result = QRService.getCachedOrGenerateQR(profile, options, forceRefresh);
    
    // Add cache info to warnings if debugging
    if (result.fromCache) {
      console.log('QR Generator: Using cached QR code');
    } else {
      console.log('QR Generator: Generated new QR code');
    }
    
    // Check for warnings
    if (!profile.isComplete) {
      warnings.push('Profile is incomplete - QR code contains limited information');
    }
    
    if (!result.emergencyData.emergencyContact) {
      warnings.push('No emergency contact available - consider adding one');
    }
    
    if (!result.emergencyData.bloodType) {
      warnings.push('Blood type not specified - important for emergency care');
    }
    
    if (result.emergencyData.allergies.length === 0) {
      warnings.push('No allergies listed - verify if this is accurate');
    }
    
    return {
      qrData: result.qrData,
      emergencyData: result.emergencyData,
      isOptimized: result.qrData.length <= QRService['MAX_QR_LENGTH'],
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