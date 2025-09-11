import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { passwordService } from '../../services';

interface PasswordVerificationModalProps {
  visible: boolean;
  onVerified: () => void;
  onCancel: () => void;
  profilePassword: string; // Hashed password to verify against
  userFirstName?: string; // For personalized messaging
}

/**
 * Password Verification Modal Component
 * Handles password verification for accessing protected profiles
 */
export const PasswordVerificationModal: React.FC<PasswordVerificationModalProps> = ({
  visible,
  onVerified,
  onCancel,
  profilePassword,
  userFirstName = 'User',
}) => {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Check if user already has valid access
  useEffect(() => {
    const checkExistingAccess = async () => {
      if (visible) {
        const hasAccess = await passwordService.hasValidTempAccess();
        if (hasAccess) {
          const timeLeft = await passwordService.getRemainingAccessTime();
          setRemainingTime(timeLeft);
          onVerified();
        }
      }
    };

    checkExistingAccess();
  }, [visible, onVerified]);

  // Update remaining time every minute
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (remainingTime !== null && remainingTime > 0) {
      interval = setInterval(async () => {
        const timeLeft = await passwordService.getRemainingAccessTime();
        setRemainingTime(timeLeft);
        
        if (!timeLeft || timeLeft <= 0) {
          setRemainingTime(null);
        }
      }, 60000); // Update every minute
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [remainingTime]);

  const handleVerify = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter the profile password');
      return;
    }

    setIsVerifying(true);

    try {
      // Verify password
      const isValid = passwordService.verifyPassword(password, profilePassword);
      
      if (isValid) {
        // Grant temporary access
        await passwordService.grantTempAccess('profile_access');
        const timeLeft = await passwordService.getRemainingAccessTime();
        setRemainingTime(timeLeft);
        
        setPassword('');
        setAttemptCount(0);
        onVerified();
        
        Alert.alert(
          'Access Granted',
          `You now have temporary access to ${userFirstName}'s profile for ${timeLeft} minutes.`
        );
      } else {
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        if (newAttemptCount >= 3) {
          Alert.alert(
            'Access Denied',
            'Too many incorrect attempts. Please try again later.',
            [{ text: 'OK', onPress: onCancel }]
          );
        } else {
          Alert.alert(
            'Incorrect Password',
            `Incorrect password. ${3 - newAttemptCount} attempts remaining.`
          );
        }
        
        setPassword('');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      Alert.alert('Error', 'An error occurred while verifying the password');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setAttemptCount(0);
    setShowPassword(false);
    onCancel();
  };

  const resetForm = () => {
    setPassword('');
    setAttemptCount(0);
    setShowPassword(false);
  };

  // Reset form when modal becomes visible
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="lock-closed" size={32} color="#FF6B6B" />
              <Text style={styles.title}>Profile Access Required</Text>
              <Text style={styles.subtitle}>
                {userFirstName}'s profile is password protected
              </Text>
            </View>

            {/* Remaining time indicator */}
            {remainingTime && (
              <View style={styles.accessInfo}>
                <Ionicons name="time" size={16} color="#4ECDC4" />
                <Text style={styles.accessText}>
                  Access expires in {remainingTime} minutes
                </Text>
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter Profile Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, attemptCount >= 3 && styles.inputDisabled]}
                  placeholder="Profile password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={attemptCount < 3 && !isVerifying}
                  onSubmitEditing={handleVerify}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={attemptCount >= 3 || isVerifying}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={attemptCount >= 3 ? '#CCC' : '#666'}
                  />
                </TouchableOpacity>
              </View>

              {attemptCount > 0 && (
                <Text style={styles.attemptWarning}>
                  {attemptCount >= 3
                    ? 'Too many incorrect attempts'
                    : `${3 - attemptCount} attempts remaining`}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isVerifying}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.verifyButton,
                  (attemptCount >= 3 || isVerifying || !password.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={attemptCount >= 3 || isVerifying || !password.trim()}
              >
                <Text style={styles.verifyButtonText}>
                  {isVerifying ? 'Verifying...' : 'Verify & Access'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <Text style={styles.helpText}>
              This password was set by {userFirstName} to protect their medical information.
              {'\n'}Access will be granted for 30 minutes once verified.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  accessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  accessText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    color: '#999',
    backgroundColor: '#F5F5F5',
  },
  eyeButton: {
    padding: 8,
  },
  attemptWarning: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#4ECDC4',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#DDD',
    opacity: 0.6,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

export default PasswordVerificationModal;