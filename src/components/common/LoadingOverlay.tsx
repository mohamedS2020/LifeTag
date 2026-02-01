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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  cancelable?: boolean;
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message, 
  cancelable = false,
  onCancel 
}) => {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');
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
            <Animated.View 
              entering={FadeIn.duration(200)}
              style={styles.container}
            >
              <ActivityIndicator size="large" color={colors.primary.main} style={styles.spinner} />
              <Text style={styles.message}>{displayMessage}</Text>
              {cancelable && (
                <Text style={styles.cancelHint}>{t('common.tapOutsideToCancel')}</Text>
              )}
            </Animated.View>
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
  message, 
  size = 'small' 
}) => {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');
  if (!visible) return null;

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size={size} color={colors.primary.main} style={styles.inlineSpinner} />
      <Text style={styles.inlineMessage}>{displayMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay.heavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.lg,
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  cancelHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  inlineSpinner: {
    marginRight: spacing.sm,
  },
  inlineMessage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});