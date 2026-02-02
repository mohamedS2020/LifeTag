import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { auditRetentionManager, CleanupResult } from '../../utils/auditRetention';
import { auditCleanupService } from '../../services/auditCleanupService';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';

interface AuditCleanupAdminProps {
  onClose?: () => void;
}

interface RetentionStatus {
  policy: {
    retentionDays: number;
    maxLogsPerProfile: number;
  };
  status: {
    lastCleanupRun?: Date;
    nextRecommendedRun: Date;
    isCleanupRunning: boolean;
    isScheduledCleanupEnabled: boolean;
  };
  current: {
    cleanupNeeded: boolean;
    reason?: string;
    totalLogs: number;
    oldestLogAge?: number;
  };
}

export const AuditCleanupAdmin: React.FC<AuditCleanupAdminProps> = ({ onClose }) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary
    },
    closeButton: {
      padding: spacing.xs
    },
    closeButtonText: {
      fontSize: 20,
      color: colors.text.secondary
    },
    loadingText: {
      marginTop: spacing.sm,
      fontSize: 16,
      color: colors.text.secondary
    },
    errorText: {
      fontSize: 16,
      color: colors.status.error.main,
      textAlign: 'center',
      marginBottom: spacing.lg
    },
    retryButton: {
      backgroundColor: colors.primary.main,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md
    },
    retryButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: 'bold'
    },
    section: {
      backgroundColor: colors.background.secondary,
      marginHorizontal: spacing.md,
      marginVertical: spacing.xs,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: spacing.sm
    },
    policyInfo: {
      backgroundColor: colors.primary.main + '20',
      padding: spacing.sm,
      borderRadius: borderRadius.sm
    },
    policyText: {
      fontSize: 14,
      color: colors.primary.main,
      marginBottom: spacing.xxs
    },
    statusInfo: {
      gap: spacing.xs
    },
    statusText: {
      fontSize: 14,
      color: colors.text.primary
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      marginTop: spacing.xs
    },
    statusBadgeText: {
      color: colors.text.inverse,
      fontSize: 12,
      fontWeight: 'bold'
    },
    reasonText: {
      fontSize: 12,
      color: colors.text.secondary,
      fontStyle: 'italic',
      marginTop: spacing.xs
    },
    historyInfo: {
      gap: spacing.xs
    },
    historyText: {
      fontSize: 14,
      color: colors.text.primary
    },
    resultInfo: {
      gap: spacing.xs
    },
    resultText: {
      fontSize: 14,
      color: colors.text.primary
    },
    errorContainer: {
      backgroundColor: colors.status.error.main + '20',
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs
    },
    errorLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.status.error.main,
      marginBottom: spacing.xxs
    },
    errorItem: {
      fontSize: 11,
      color: colors.status.error.main,
      marginLeft: spacing.xs
    },
    actionButtons: {
      gap: spacing.sm
    },
    actionButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center'
    },
    cleanupButton: {
      backgroundColor: colors.status.warning.main
    },
    refreshButton: {
      backgroundColor: colors.primary.main
    },
    disabledButton: {
      backgroundColor: colors.text.tertiary
    },
    actionButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: 'bold'
    },
    infoText: {
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 18
    }
  }), [colors, spacing, borderRadius, typography, shadows]);

  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [retentionStatus, setRetentionStatus] = useState<RetentionStatus | null>(null);
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadRetentionStatus();
  }, []);

  const loadRetentionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await auditRetentionManager.getRetentionStatus();
      setRetentionStatus(status);
      
    } catch (err: any) {
      console.error('Error loading retention status:', err);
      setError(t('admin.failedLoadRetentionStatus'));
    } finally {
      setLoading(false);
    }
  };

  const handleManualCleanup = async () => {
    Alert.alert(
      t('admin.runAuditCleanup'),
      t('admin.cleanupWarningMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.runCleanup'),
          style: 'destructive',
          onPress: executeCleanup
        }
      ]
    );
  };

  const executeCleanup = async () => {
    try {
      setCleanupLoading(true);
      
      const result = await auditRetentionManager.executeManualCleanup();
      setLastCleanupResult(result);
      
      if (result.success) {
        Alert.alert(
          t('admin.cleanupCompleted'),
          t('admin.cleanupSuccessMessage', { count: result.deletedCount, time: result.executionTimeMs })
        );
      } else {
        Alert.alert(
          t('admin.cleanupFailed'),
          t('admin.cleanupFailedMessage')
        );
      }
      
      // Reload status
      await loadRetentionStatus();
      
    } catch (error: any) {
      console.error('Cleanup execution error:', error);
      Alert.alert(t('common.error'), t('admin.failedExecuteCleanup'));
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>{t('admin.loadingRetentionStatus')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRetentionStatus}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {onClose && (
        <View style={styles.header}>
          <Text style={styles.title}>{t('admin.auditLogCleanupAdmin')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {retentionStatus && (
        <>
          {/* Retention Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.retentionPolicy')}</Text>
            <View style={styles.policyInfo}>
              <Text style={styles.policyText}>
                {t('admin.retentionPeriod')} {retentionStatus.policy.retentionDays} {t('common.days')}
              </Text>
              <Text style={styles.policyText}>
                {t('admin.maxLogsPerProfile')} {retentionStatus.policy.maxLogsPerProfile}
              </Text>
            </View>
          </View>

          {/* Current Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.currentStatus')}</Text>
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>
                {t('admin.totalAuditLogs')} {retentionStatus.current.totalLogs}
              </Text>
              {retentionStatus.current.oldestLogAge !== undefined && (
                <Text style={styles.statusText}>
                  {t('admin.oldestLog')} {retentionStatus.current.oldestLogAge} {t('admin.daysAgo')}
                </Text>
              )}
              <View style={[
                styles.statusBadge,
                { backgroundColor: retentionStatus.current.cleanupNeeded ? colors.status.warning.main : colors.status.success.main }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {retentionStatus.current.cleanupNeeded ? t('admin.cleanupNeeded') : t('admin.noCleanupNeeded')}
                </Text>
              </View>
              {retentionStatus.current.reason && (
                <Text style={styles.reasonText}>
                  {retentionStatus.current.reason}
                </Text>
              )}
            </View>
          </View>

          {/* Cleanup History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.cleanupHistory')}</Text>
            <View style={styles.historyInfo}>
              {retentionStatus.status.lastCleanupRun ? (
                <Text style={styles.historyText}>
                  {t('admin.lastRun')} {formatDate(retentionStatus.status.lastCleanupRun)}
                </Text>
              ) : (
                <Text style={styles.historyText}>
                  {t('admin.noPreviousCleanups')}
                </Text>
              )}
              <Text style={styles.historyText}>
                {t('admin.nextRecommended')} {formatDate(retentionStatus.status.nextRecommendedRun)}
              </Text>
              <Text style={styles.historyText}>
                {t('common.status')} {retentionStatus.status.isCleanupRunning ? t('common.running') : t('common.idle')}
              </Text>
            </View>
          </View>

          {/* Last Cleanup Result */}
          {lastCleanupResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('admin.lastCleanupResult')}</Text>
              <View style={styles.resultInfo}>
                <Text style={[
                  styles.resultText,
                  { color: lastCleanupResult.success ? colors.status.success.main : colors.status.error.main }
                ]}>
                  {lastCleanupResult.success ? t('common.success') : t('common.failed')}
                </Text>
                <Text style={styles.resultText}>
                  {t('admin.deleted')} {lastCleanupResult.deletedCount} {t('admin.logs')}
                </Text>
                <Text style={styles.resultText}>
                  {t('admin.profilesProcessed')} {lastCleanupResult.profilesProcessed}
                </Text>
                <Text style={styles.resultText}>
                  {t('admin.executionTime')} {formatDuration(lastCleanupResult.executionTimeMs)}
                </Text>
                <Text style={styles.resultText}>
                  {t('admin.timestamp')} {formatDate(lastCleanupResult.timestamp)}
                </Text>
                {lastCleanupResult.errors.length > 0 && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorLabel}>{t('common.errors')}</Text>
                    {lastCleanupResult.errors.map((error, index) => (
                      <Text key={index} style={styles.errorItem}>• {error}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.actions')}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.cleanupButton,
                  (cleanupLoading || retentionStatus.status.isCleanupRunning) && styles.disabledButton
                ]}
                onPress={handleManualCleanup}
                disabled={cleanupLoading || retentionStatus.status.isCleanupRunning}
              >
                {cleanupLoading ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={styles.actionButtonText}>{t('admin.runManualCleanup')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.refreshButton]}
                onPress={loadRetentionStatus}
              >
                <Text style={styles.actionButtonText}>{t('admin.refreshStatus')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('admin.information')}</Text>
            <Text style={styles.infoText}>
              {t('admin.cleanupInfoText', { days: retentionStatus.policy.retentionDays, maxLogs: retentionStatus.policy.maxLogsPerProfile })}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default AuditCleanupAdmin;