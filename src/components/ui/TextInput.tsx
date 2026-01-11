/**
 * LifeTag TextInput Component
 * Styled input with label, icons, and animations
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, layout, typography, duration } from '../../theme';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  required?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  disabled = false,
  required = false,
  secureTextEntry,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const inputRef = useRef<RNTextInput>(null);
  const focusAnim = useSharedValue(0);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: duration.fast });
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: duration.fast });
  }, []);

  const toggleSecure = useCallback(() => {
    setIsSecure((prev) => !prev);
  }, []);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? colors.status.error.main
      : interpolateColor(
          focusAnim.value,
          [0, 1],
          [colors.border.default, colors.primary.main]
        );
    
    return {
      borderColor,
      borderWidth: isFocused || error ? 1.5 : 1,
    };
  });

  const hasValue = textInputProps.value && textInputProps.value.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, error ? styles.labelError : undefined]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <AnimatedView
        style={[
          styles.inputContainer,
          animatedBorderStyle,
          disabled && styles.inputDisabled,
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? colors.primary.main : colors.text.tertiary}
            />
          </View>
        )}

        <RNTextInput
          ref={inputRef}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            disabled && styles.inputTextDisabled,
            inputStyle,
          ]}
          placeholderTextColor={colors.text.tertiary}
          selectionColor={colors.primary.main}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={isSecure}
          {...textInputProps}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={toggleSecure}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={isFocused ? colors.primary.main : colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </AnimatedView>

      {(error || hint) && (
        <Text style={[styles.helperText, error ? styles.errorText : styles.hintText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
  },
  labelError: {
    color: colors.status.error.main,
  },
  required: {
    color: colors.status.error.main,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: layout.inputHeight,
  },
  inputDisabled: {
    backgroundColor: colors.background.tertiary,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    minHeight: layout.inputHeight,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  inputTextDisabled: {
    color: colors.text.disabled,
  },
  leftIconContainer: {
    paddingLeft: spacing.lg,
  },
  rightIconContainer: {
    paddingRight: spacing.lg,
    paddingVertical: spacing.md,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    color: colors.status.error.main,
  },
  hintText: {
    color: colors.text.tertiary,
  },
});

export default TextInput;
