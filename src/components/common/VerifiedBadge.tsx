import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props for VerifiedBadge component
 */
interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: any;
  iconOnly?: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

/**
 * VerifiedBadge Component
 * 
 * Displays verification status badge for medical professionals
 * - Shows verified checkmark or pending indicator
 * - Multiple size options for different UI contexts
 * - Optional text labels and verification details
 * - Consistent styling across the application
 */
const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  size = 'medium',
  showText = true,
  style,
  iconOnly = false,
  verifiedAt,
  verifiedBy,
}) => {
  /**
   * Get size-specific styles
   */
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: 12,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: 24,
          text: styles.largeText,
        };
      case 'medium':
      default:
        return {
          container: styles.mediumContainer,
          icon: 16,
          text: styles.mediumText,
        };
    }
  };

  /**
   * Get badge color scheme
   */
  const getColorScheme = () => {
    if (isVerified) {
      return {
        backgroundColor: '#D4EDDA',
        borderColor: '#28A745',
        textColor: '#155724',
        iconColor: '#28A745',
        iconName: 'checkmark-circle' as const,
        label: 'Verified',
      };
    } else {
      return {
        backgroundColor: '#FFF3CD',
        borderColor: '#FFC107',
        textColor: '#856404',
        iconColor: '#FFC107',
        iconName: 'time' as const,
        label: 'Pending',
      };
    }
  };

  /**
   * Format verification date
   */
  const formatVerificationDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sizeStyles = getSizeStyles();
  const colorScheme = getColorScheme();

  if (iconOnly) {
    return (
      <View style={[styles.iconOnlyContainer, style]}>
        <Ionicons
          name={colorScheme.iconName}
          size={sizeStyles.icon}
          color={colorScheme.iconColor}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        sizeStyles.container,
        {
          backgroundColor: colorScheme.backgroundColor,
          borderColor: colorScheme.borderColor,
        },
        style,
      ]}
    >
      <Ionicons
        name={colorScheme.iconName}
        size={sizeStyles.icon}
        color={colorScheme.iconColor}
      />
      
      {showText && (
        <Text
          style={[
            sizeStyles.text,
            { color: colorScheme.textColor },
          ]}
        >
          {colorScheme.label}
        </Text>
      )}
      
      {isVerified && verifiedAt && size === 'large' && (
        <Text style={[styles.verificationDetails, { color: colorScheme.textColor }]}>
          Verified {formatVerificationDate(verifiedAt)}
          {verifiedBy && ` by ${verifiedBy}`}
        </Text>
      )}
    </View>
  );
};

/**
 * VerifiedProfessionalIndicator Component
 * 
 * Specialized component for indicating verified medical professionals
 * with additional professional context
 */
interface VerifiedProfessionalIndicatorProps {
  isVerified: boolean;
  professionalInfo?: {
    specialty?: string;
    licenseNumber?: string;
    hospitalAffiliation?: string;
  };
  verificationStatus?: {
    verifiedAt?: Date;
    verifiedBy?: string;
  };
  compact?: boolean;
}

export const VerifiedProfessionalIndicator: React.FC<VerifiedProfessionalIndicatorProps> = ({
  isVerified,
  professionalInfo,
  verificationStatus,
  compact = false,
}) => {
  if (compact) {
    return (
      <View style={styles.compactIndicator}>
        <VerifiedBadge
          isVerified={isVerified}
          size="small"
          showText={false}
          iconOnly
        />
        {isVerified && (
          <Text style={styles.compactText}>Medical Professional</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.professionalIndicator}>
      <VerifiedBadge
        isVerified={isVerified}
        size="medium"
        verifiedAt={verificationStatus?.verifiedAt}
        verifiedBy={verificationStatus?.verifiedBy}
      />
      
      {isVerified && professionalInfo && (
        <View style={styles.professionalDetails}>
          {professionalInfo.specialty && (
            <Text style={styles.specialtyText}>
              {professionalInfo.specialty}
            </Text>
          )}
          {professionalInfo.licenseNumber && (
            <Text style={styles.licenseText}>
              License: {professionalInfo.licenseNumber}
            </Text>
          )}
          {professionalInfo.hospitalAffiliation && (
            <Text style={styles.affiliationText}>
              {professionalInfo.hospitalAffiliation}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * ProfileHeaderBadge Component
 * 
 * Badge display for profile headers showing verification status
 */
interface ProfileHeaderBadgeProps {
  isVerified: boolean;
  userType: 'individual' | 'medical_professional';
  verificationStatus?: {
    verifiedAt?: Date;
    verifiedBy?: string;
  };
}

export const ProfileHeaderBadge: React.FC<ProfileHeaderBadgeProps> = ({
  isVerified,
  userType,
  verificationStatus,
}) => {
  if (userType !== 'medical_professional') {
    return null;
  }

  return (
    <View style={styles.profileHeaderBadge}>
      <VerifiedBadge
        isVerified={isVerified}
        size="large"
        verifiedAt={verificationStatus?.verifiedAt}
        verifiedBy={verificationStatus?.verifiedBy}
      />
    </View>
  );
};

/**
 * Styles for VerifiedBadge components
 */
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallContainer: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediumContainer: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  largeContainer: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  mediumText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  largeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  iconOnlyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationDetails: {
    fontSize: 10,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  compactIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  compactText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '500',
    marginLeft: 4,
  },
  professionalIndicator: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  professionalDetails: {
    marginTop: 8,
    marginLeft: 4,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  licenseText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  affiliationText: {
    fontSize: 12,
    color: '#666666',
  },
  profileHeaderBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});

export default VerifiedBadge;