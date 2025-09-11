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
import { AuthError } from '../../utils/errorHandling';

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

  const handleShowDetails = () => {
    Alert.alert(
      'Error Details',
      `Code: ${error.code}\nMessage: ${error.message}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[getErrorStyle(), style]}>
      <Text style={getTextStyle()}>
        {error.userMessage}
      </Text>
      
      <View style={styles.buttonContainer}>
        {showDetails && (
          <TouchableOpacity onPress={handleShowDetails} style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    <View style={styles.fieldErrorContainer}>
      <Text style={styles.fieldErrorText}>⚠ {error}</Text>
    </View>
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
    <View style={styles.successContainer}>
      <Text style={styles.successText}>
        ✓ {message}
      </Text>
      
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#fee',
    borderColor: '#e74c3c',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningContainer: {
    backgroundColor: '#fff8e1',
    borderColor: '#f39c12',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successContainer: {
    backgroundColor: '#f0f8f0',
    borderColor: '#27ae60',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    flex: 1,
  },
  warningText: {
    color: '#d68910',
    fontSize: 14,
    flex: 1,
  },
  infoText: {
    color: '#2980b9',
    fontSize: 14,
    flex: 1,
  },
  successText: {
    color: '#1e8449',
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  detailsButtonText: {
    color: '#7f8c8d',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fieldErrorContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  fieldErrorText: {
    color: '#e74c3c',
    fontSize: 12,
  },
});