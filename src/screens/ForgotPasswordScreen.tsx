import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, TextInput, Card, H1, Body, BodySmall } from '../components/ui';
import { useTheme } from '../theme';
import { sendPasswordResetEmail } from '../services/authService';

interface ForgotPasswordScreenProps {
  navigation?: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const { t } = useTranslation();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', backgroundColor: colors.background.primary },
    card: { margin: spacing.lg, padding: spacing.lg },
    title: { ...typography.h1, marginBottom: spacing.md },
    subtitle: { marginBottom: spacing.md },
    input: { marginBottom: spacing.md },
    button: { marginTop: spacing.md },
    backButton: { marginTop: spacing.sm },
    error: { color: colors.status.error.main, marginTop: spacing.sm },
    success: { color: colors.status.success.main, marginTop: spacing.sm },
  }), [colors, spacing, borderRadius, typography, shadows]);

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
      setSuccess(t('auth.resetLinkSent'));
    } catch (e: any) {
      setError(e.message || t('errors.generic'));
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
        <H1 style={styles.title}>{t('auth.forgotPasswordTitle')}</H1>
        <Body style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Body>
        <TextInput
          label={t('auth.email')}
          placeholder={t('auth.email')}
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
          title={t('auth.sendResetLink')}
          onPress={handleReset}
          loading={loading}
          disabled={loading || !email}
          style={styles.button}
        />
        <Button
          title={t('common.back')}
          onPress={() => navigation?.goBack()}
          variant="ghost"
          style={styles.backButton}
        />
      </Card>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;
