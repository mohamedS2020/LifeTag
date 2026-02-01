import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography } from '../../theme';

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
  const { t } = useTranslation();
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
   * Get badge color scheme - using theme colors
   */
  const getColorScheme = () => {
    if (isVerified) {
      return {
        backgroundColor: colors.medical.verifiedBackground,
        borderColor: colors.status.success.border,
        textColor: colors.status.success.main,
        iconColor: colors.status.success.main,
        iconName: 'checkmark-circle' as const,
        label: t('verification.verified'),
      };
    } else {
      return {
        backgroundColor: colors.medical.pendingBackground,
        borderColor: colors.status.warning.border,
        textColor: colors.status.warning.main,
        iconColor: colors.status.warning.main,
        iconName: 'time' as const,
        label: t('verification.pending'),
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
          {t('verification.verifiedOnDate', { date: formatVerificationDate(verifiedAt) })}
          {verifiedBy && ` ${t('medicalProfessional.byAdmin', { admin: verifiedBy })}`}
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
  const { t } = useTranslation();
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
          <Text style={styles.compactText}>{t('medicalProfessional.title')}</Text>
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
              {t('medicalProfessional.license')}: {professionalInfo.licenseNumber}
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
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  smallContainer: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  mediumContainer: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  largeContainer: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  mediumText: {
    ...typography.label,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  largeText: {
    ...typography.labelLarge,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  iconOnlyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationDetails: {
    ...typography.caption,
    marginLeft: spacing.sm,
    fontStyle: 'italic',
  },
  compactIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  compactText: {
    ...typography.label,
    color: colors.status.success.main,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  professionalIndicator: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  professionalDetails: {
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  specialtyText: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  licenseText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  affiliationText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  profileHeaderBadge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});

export default VerifiedBadge;