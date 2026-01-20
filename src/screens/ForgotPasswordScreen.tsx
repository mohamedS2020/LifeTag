import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, Card, H1, Body, BodySmall } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import { sendPasswordResetEmail } from '../services/authService';

interface ForgotPasswordScreenProps {
  navigation?: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSuccess('If this email is registered, you will receive a reset link.');
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Card style={styles.card}>
        <H1 style={styles.title}>Forgot Password</H1>
        <Body style={styles.subtitle}>Enter your email to receive a password reset link.</Body>
        <TextInput
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <Button
          title="Send Reset Email"
          onPress={handleReset}
          loading={loading}
          disabled={loading || !email}
          style={styles.button}
        />
        <Button
          title="Back to Login"
          onPress={() => navigation?.goBack()}
          variant="ghost"
          style={styles.backButton}
        />
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: colors.background.primary },
  card: { margin: spacing.lg, padding: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.md },
  subtitle: { marginBottom: spacing.md },
  input: { marginBottom: spacing.md },
  button: { marginTop: spacing.md },
  backButton: { marginTop: spacing.sm },
  error: { color: colors.status.error.main, marginTop: spacing.sm },
  success: { color: colors.status.success.main, marginTop: spacing.sm },
});

export default ForgotPasswordScreen;
