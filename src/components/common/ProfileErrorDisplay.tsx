import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        return '#FF6B6B';
      case 'warning':
        return '#FFE66D';
      case 'info':
        return '#4ECDC4';
      default:
        return '#FF6B6B';
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
      'Error Details',
      `Code: ${error.code}\nMessage: ${error.message}\n\nDetails:\n${details}`,
      [{ text: 'OK' }]
    );
  };

  const getErrorSuggestion = () => {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 'Please check all required fields and try again.';
      case 'NETWORK_ERROR':
        return 'Check your internet connection and try again.';
      case 'PERMISSION_ERROR':
        return 'You may need to log in again to perform this action.';
      case 'PROFILE_NOT_FOUND':
        return 'The profile may have been deleted. Try refreshing the page.';
      case 'PASSWORD_REQUIRED':
        return 'This profile requires password verification to access.';
      case 'INVALID_PASSWORD':
        return 'The password you entered is incorrect.';
      case 'SESSION_EXPIRED':
        return 'Your session has expired. Please log in again.';
      case 'DATA_CORRUPTION':
        return 'There may be an issue with the data. Contact support if this persists.';
      default:
        return 'Try again in a moment. Contact support if the problem continues.';
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getErrorColor() }, style]}>
      <View style={styles.header}>
        <Ionicons name={getErrorIcon()} size={24} color={getErrorColor()} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: getErrorColor() }]}>
            {error.severity === 'error' ? 'Error' : 
             error.severity === 'warning' ? 'Warning' : 'Information'}
          </Text>
          {error.field && (
            <Text style={styles.fieldName}>in {error.field}</Text>
          )}
        </View>
      </View>

      <Text style={styles.message}>{error.message}</Text>
      
      <Text style={styles.suggestion}>{getErrorSuggestion()}</Text>

      <View style={styles.actions}>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}

        {showDetails && error.details && (
          <TouchableOpacity style={styles.detailsButton} onPress={showDetailsModal}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        )}

        {onRetry && getRetryable() && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.retryButtonText}>Retry</Text>
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
        <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
        <Text style={styles.successTitle}>Success</Text>
      </View>
      <Text style={styles.successMessage}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity style={styles.successDismiss} onPress={onDismiss}>
          <Ionicons name="close" size={20} color="#4ECDC4" />
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
          <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
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
          <Ionicons name="warning" size={16} color="#FFE66D" />
          <Text style={styles.validationWarningText}>
            <Text style={styles.validationFieldName}>{issue.field}:</Text> {issue.message}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FED7D7',
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
    color: '#666',
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#E5E7EB',
  },
  dismissButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  retryButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  successContainer: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
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
    color: '#4ECDC4',
    marginLeft: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#333',
    marginLeft: 32,
    flex: 2,
  },
  successDismiss: {
    padding: 4,
  },
  validationContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validationErrorText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  validationWarningText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  validationFieldName: {
    fontWeight: '600',
  },
});

export default ProfileErrorDisplay;