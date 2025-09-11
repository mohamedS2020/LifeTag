/**
 * Loading Overlay Component
 * Displays loading state with spinner and message
 */

import React from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Modal, 
  TouchableWithoutFeedback 
} from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  cancelable?: boolean;
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = 'Loading...', 
  cancelable = false,
  onCancel 
}) => {
  const handleBackdropPress = () => {
    if (cancelable && onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <ActivityIndicator size="large" color="#3498db" style={styles.spinner} />
              <Text style={styles.message}>{message}</Text>
              {cancelable && (
                <Text style={styles.cancelHint}>Tap outside to cancel</Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Inline loading component for forms
interface InlineLoadingProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'large';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  visible, 
  message = 'Loading...', 
  size = 'small' 
}) => {
  if (!visible) return null;

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size={size} color="#3498db" style={styles.inlineSpinner} />
      <Text style={styles.inlineMessage}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelHint: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  inlineSpinner: {
    marginRight: 8,
  },
  inlineMessage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});