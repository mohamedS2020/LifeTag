import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';

interface ProfileError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
  details?: any;
}

interface ProfileErrorDisplayProps {
  error: ProfileError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  style?: any;
}

/**
 * Enhanced Profile Error Display Component
 * Provides comprehensive error handling for profile-related operations
 */
export const ProfileErrorDisplay: React.FC<ProfileErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  style,
}) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const { t } = useTranslation();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.status.error.background,
      borderLeftWidth: 4,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.status.error.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerText: {
      marginLeft: 12,
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
    },
    fieldName: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2,
    },
    message: {
      fontSize: 14,
      color: colors.text.primary,
      lineHeight: 20,
      marginBottom: 8,
    },
    suggestion: {
      fontSize: 12,
      color: colors.text.secondary,
      fontStyle: 'italic',
      marginBottom: 12,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    dismissButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      backgroundColor: colors.background.elevated,
    },
    dismissButtonText: {
      fontSize: 12,
      color: colors.text.secondary,
      fontWeight: '500',
    },
    detailsButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      backgroundColor: colors.background.elevated,
    },
    detailsButtonText: {
      fontSize: 12,
      color: colors.text.secondary,
      fontWeight: '500',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      backgroundColor: colors.status.error.main,
    },
    retryButtonText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '500',
      marginLeft: 4,
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.severity) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'alert-circle';
    }
  };

  const getErrorColor = () => {
    switch (error.severity) {
      case 'error':
        return colors.status.error.main;
      case 'warning':
        return colors.status.warning.main;
      case 'info':
        return colors.status.success.main;
      default:
        return colors.status.error.main;
    }
  };

  const getRetryable = () => {
    const retryableCodes = [
      'NETWORK_ERROR',
      'DATABASE_ERROR',
      'TIMEOUT_ERROR',
      'CONNECTION_ERROR',
      'SERVER_ERROR',
    ];
    return retryableCodes.includes(error.code);
  };

  const showDetailsModal = () => {
    const details = JSON.stringify(error.details, null, 2);
    Alert.alert(
      t('errors.errorDetails'),
      `${t('errors.code')}: ${error.code}\n${t('errors.message')}: ${error.message}\n\n${t('common.details')}:\n${details}`,
      [{ text: t('common.ok') }]
    );
  };

  const getErrorSuggestion = () => {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return t('errors.suggestions.validation');
      case 'NETWORK_ERROR':
        return t('errors.suggestions.network');
      case 'PERMISSION_ERROR':
        return t('errors.suggestions.permission');
      case 'PROFILE_NOT_FOUND':
        return t('errors.suggestions.profileNotFound');
      case 'PASSWORD_REQUIRED':
        return t('errors.suggestions.passwordRequired');
      case 'INVALID_PASSWORD':
        return t('errors.suggestions.invalidPassword');
      case 'SESSION_EXPIRED':
        return t('errors.suggestions.sessionExpired');
      case 'DATA_CORRUPTION':
        return t('errors.suggestions.dataCorruption');
      default:
        return t('errors.suggestions.default');
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getErrorColor() }, style]}>
      <View style={styles.header}>
        <Ionicons name={getErrorIcon()} size={24} color={getErrorColor()} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: getErrorColor() }]}>
            {error.severity === 'error' ? t('errors.error') : 
             error.severity === 'warning' ? t('errors.warning') : t('errors.information')}
          </Text>
          {error.field && (
            <Text style={styles.fieldName}>{t('errors.inField', { field: error.field })}</Text>
          )}
        </View>
      </View>

      <Text style={styles.message}>{error.message}</Text>
      
      <Text style={styles.suggestion}>{getErrorSuggestion()}</Text>

      <View style={styles.actions}>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>{t('common.dismiss')}</Text>
          </TouchableOpacity>
        )}

        {showDetails && error.details && (
          <TouchableOpacity style={styles.detailsButton} onPress={showDetailsModal}>
            <Text style={styles.detailsButtonText}>{t('common.details')}</Text>
          </TouchableOpacity>
        )}

        {onRetry && getRetryable() && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Profile Success Display Component
 * Shows success messages for profile operations
 */
interface ProfileSuccessDisplayProps {
  message: string | null;
  onDismiss?: () => void;
  autoHide?: boolean;
  style?: any;
}

export const ProfileSuccessDisplay: React.FC<ProfileSuccessDisplayProps> = ({
  message,
  onDismiss,
  autoHide = true,
  style,
}) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const { t } = useTranslation();

  const styles = useMemo(() => StyleSheet.create({
    successContainer: {
      backgroundColor: colors.status.success.background,
      borderLeftWidth: 4,
      borderLeftColor: colors.status.success.main,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.status.success.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    successHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    successTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.status.success.main,
      marginLeft: 8,
    },
    successMessage: {
      fontSize: 14,
      color: colors.text.primary,
      marginLeft: 32,
      flex: 2,
    },
    successDismiss: {
      padding: 4,
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

  React.useEffect(() => {
    if (message && autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, autoHide, onDismiss]);

  if (!message) return null;

  return (
    <View style={[styles.successContainer, style]}>
      <View style={styles.successHeader}>
        <Ionicons name="checkmark-circle" size={24} color={colors.status.success.main} />
        <Text style={styles.successTitle}>{t('common.success')}</Text>
      </View>
      <Text style={styles.successMessage}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity style={styles.successDismiss} onPress={onDismiss}>
          <Ionicons name="close" size={20} color={colors.status.success.main} />
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Profile Validation Summary Component
 * Shows validation issues for profile fields
 */
interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ProfileValidationSummaryProps {
  issues: ValidationIssue[];
  onFieldFocus?: (fieldName: string) => void;
  style?: any;
}

export const ProfileValidationSummary: React.FC<ProfileValidationSummaryProps> = ({
  issues,
  onFieldFocus,
  style,
}) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    validationContainer: {
      backgroundColor: colors.status.warning.background,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.status.warning.border,
    },
    validationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.status.warning.main,
      marginBottom: 12,
    },
    validationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    validationErrorText: {
      fontSize: 12,
      color: colors.text.primary,
      marginLeft: 8,
      flex: 1,
    },
    validationWarningText: {
      fontSize: 12,
      color: colors.text.primary,
      marginLeft: 8,
      flex: 1,
    },
    validationFieldName: {
      fontWeight: '600',
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

  if (!issues.length) return null;

  const errors = issues.filter(issue => issue.severity === 'error');
  const warnings = issues.filter(issue => issue.severity === 'warning');

  return (
    <View style={[styles.validationContainer, style]}>
      <Text style={styles.validationTitle}>
        {errors.length > 0 ? 'Please fix the following issues:' : 'Recommendations:'}
      </Text>

      {errors.map((issue, index) => (
        <TouchableOpacity
          key={`error-${index}`}
          style={styles.validationItem}
          onPress={() => onFieldFocus?.(issue.field)}
        >
          <Ionicons name="alert-circle" size={16} color={colors.status.error.main} />
          <Text style={styles.validationErrorText}>
            <Text style={styles.validationFieldName}>{issue.field}:</Text> {issue.message}
          </Text>
        </TouchableOpacity>
      ))}

      {warnings.map((issue, index) => (
        <TouchableOpacity
          key={`warning-${index}`}
          style={styles.validationItem}
          onPress={() => onFieldFocus?.(issue.field)}
        >
          <Ionicons name="warning" size={16} color={colors.status.warning.main} />
          <Text style={styles.validationWarningText}>
            <Text style={styles.validationFieldName}>{issue.field}:</Text> {issue.message}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ProfileErrorDisplay;