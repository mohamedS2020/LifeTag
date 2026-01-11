/**
 * Error Display Component
 * Shows error messages with appropriate styling based on severity
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthError } from '../../utils/errorHandling';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ErrorDisplayProps {
  error: AuthError | null;
  onDismiss?: () => void;
  showDetails?: boolean;
  style?: any;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onDismiss, 
  showDetails = false,
  style 
}) => {
  if (!error) return null;

  const getErrorStyle = () => {
    switch (error.severity) {
      case 'warning':
        return styles.warningContainer;
      case 'info':
        return styles.infoContainer;
      default:
        return styles.errorContainer;
    }
  };

  const getTextStyle = () => {
    switch (error.severity) {
      case 'warning':
        return styles.warningText;
      case 'info':
        return styles.infoText;
      default:
        return styles.errorText;
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (error.severity) {
      case 'warning':
        return 'warning-outline';
      case 'info':
        return 'information-circle-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  const getIconColor = () => {
    switch (error.severity) {
      case 'warning':
        return colors.status.warning.main;
      case 'info':
        return colors.status.info.main;
      default:
        return colors.status.error.main;
    }
  };

  const handleShowDetails = () => {
    Alert.alert(
      'Error Details',
      `Code: ${error.code}\nMessage: ${error.message}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <Animated.View 
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(200)}
      style={[getErrorStyle(), style]}
    >
      <View style={styles.contentRow}>
        <Ionicons name={getIconName()} size={20} color={getIconColor()} style={styles.icon} />
        <Text style={getTextStyle()}>
          {error.userMessage}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {showDetails && (
          <TouchableOpacity onPress={handleShowDetails} style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// Inline error component for form fields
interface FieldErrorProps {
  error: string | null;
  visible?: boolean;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, visible = true }) => {
  if (!error || !visible) return null;

  return (
    <Animated.View 
      entering={FadeInDown.duration(200)}
      style={styles.fieldErrorContainer}
    >
      <Ionicons name="warning-outline" size={12} color={colors.status.error.main} />
      <Text style={styles.fieldErrorText}>{error}</Text>
    </Animated.View>
  );
};

// Success message component
interface SuccessDisplayProps {
  message: string | null;
  onDismiss?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
}

export const SuccessDisplay: React.FC<SuccessDisplayProps> = ({ 
  message, 
  onDismiss,
  autoHide = true,
  hideDelay = 3000
}) => {
  React.useEffect(() => {
    if (message && autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [message, autoHide, hideDelay, onDismiss]);

  if (!message) return null;

  return (
    <Animated.View 
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(200)}
      style={styles.successContainer}
    >
      <View style={styles.contentRow}>
        <Ionicons name="checkmark-circle-outline" size={20} color={colors.status.success.main} style={styles.icon} />
        <Text style={styles.successText}>{message}</Text>
      </View>
      
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: colors.status.error.background,
    borderColor: colors.status.error.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningContainer: {
    backgroundColor: colors.status.warning.background,
    borderColor: colors.status.warning.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContainer: {
    backgroundColor: colors.status.info.background,
    borderColor: colors.status.info.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successContainer: {
    backgroundColor: colors.status.success.background,
    borderColor: colors.status.success.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error.main,
    flex: 1,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.status.warning.main,
    flex: 1,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.status.info.main,
    flex: 1,
  },
  successText: {
    ...typography.bodySmall,
    color: colors.status.success.main,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  detailsButtonText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
  dismissButton: {
    padding: spacing.xs,
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  fieldErrorText: {
    ...typography.caption,
    color: colors.status.error.main,
  },
});