import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [retentionStatus, setRetentionStatus] = useState<RetentionStatus | null>(null);
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError('Failed to load retention status');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCleanup = async () => {
    Alert.alert(
      'Run Audit Log Cleanup',
      'This will permanently delete old audit logs according to the retention policy. This action cannot be undone.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Cleanup',
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
          'Cleanup Completed',
          `Successfully deleted ${result.deletedCount} audit logs.\n\nExecution time: ${result.executionTimeMs}ms`
        );
      } else {
        Alert.alert(
          'Cleanup Failed',
          `Cleanup encountered errors:\n\n${result.errors.join('\n')}`
        );
      }
      
      // Reload status
      await loadRetentionStatus();
      
    } catch (error: any) {
      console.error('Cleanup execution error:', error);
      Alert.alert('Error', 'Failed to execute cleanup: ' + error.message);
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
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading retention status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRetentionStatus}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {onClose && (
        <View style={styles.header}>
          <Text style={styles.title}>Audit Log Cleanup Admin</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {retentionStatus && (
        <>
          {/* Retention Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Retention Policy</Text>
            <View style={styles.policyInfo}>
              <Text style={styles.policyText}>
                Retention Period: {retentionStatus.policy.retentionDays} days
              </Text>
              <Text style={styles.policyText}>
                Max Logs per Profile: {retentionStatus.policy.maxLogsPerProfile}
              </Text>
            </View>
          </View>

          {/* Current Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Current Status</Text>
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>
                Total Audit Logs: {retentionStatus.current.totalLogs}
              </Text>
              {retentionStatus.current.oldestLogAge !== undefined && (
                <Text style={styles.statusText}>
                  Oldest Log: {retentionStatus.current.oldestLogAge} days ago
                </Text>
              )}
              <View style={[
                styles.statusBadge,
                { backgroundColor: retentionStatus.current.cleanupNeeded ? '#ff9800' : '#4caf50' }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {retentionStatus.current.cleanupNeeded ? 'Cleanup Needed' : 'No Cleanup Needed'}
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
            <Text style={styles.sectionTitle}>🕒 Cleanup History</Text>
            <View style={styles.historyInfo}>
              {retentionStatus.status.lastCleanupRun ? (
                <Text style={styles.historyText}>
                  Last Run: {formatDate(retentionStatus.status.lastCleanupRun)}
                </Text>
              ) : (
                <Text style={styles.historyText}>
                  No previous cleanup runs recorded
                </Text>
              )}
              <Text style={styles.historyText}>
                Next Recommended: {formatDate(retentionStatus.status.nextRecommendedRun)}
              </Text>
              <Text style={styles.historyText}>
                Status: {retentionStatus.status.isCleanupRunning ? 'Running' : 'Idle'}
              </Text>
            </View>
          </View>

          {/* Last Cleanup Result */}
          {lastCleanupResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Last Cleanup Result</Text>
              <View style={styles.resultInfo}>
                <Text style={[
                  styles.resultText,
                  { color: lastCleanupResult.success ? '#4caf50' : '#f44336' }
                ]}>
                  {lastCleanupResult.success ? '✅ Success' : '❌ Failed'}
                </Text>
                <Text style={styles.resultText}>
                  Deleted: {lastCleanupResult.deletedCount} logs
                </Text>
                <Text style={styles.resultText}>
                  Profiles Processed: {lastCleanupResult.profilesProcessed}
                </Text>
                <Text style={styles.resultText}>
                  Execution Time: {formatDuration(lastCleanupResult.executionTimeMs)}
                </Text>
                <Text style={styles.resultText}>
                  Timestamp: {formatDate(lastCleanupResult.timestamp)}
                </Text>
                {lastCleanupResult.errors.length > 0 && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorLabel}>Errors:</Text>
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
            <Text style={styles.sectionTitle}>🔧 Actions</Text>
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>🗑️ Run Manual Cleanup</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.refreshButton]}
                onPress={loadRetentionStatus}
              >
                <Text style={styles.actionButtonText}>🔄 Refresh Status</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Information</Text>
            <Text style={styles.infoText}>
              • Audit logs are automatically cleaned up based on retention policies
              {'\n'}• Logs older than {retentionStatus.policy.retentionDays} days are deleted
              {'\n'}• Only the most recent {retentionStatus.policy.maxLogsPerProfile} logs are kept per profile
              {'\n'}• Cleanup operations are logged for audit purposes
              {'\n'}• This process is irreversible - deleted logs cannot be recovered
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 5
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  policyInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 6
  },
  policyText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4
  },
  statusInfo: {
    gap: 8
  },
  statusText: {
    fontSize: 14,
    color: '#333'
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  reasonText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5
  },
  historyInfo: {
    gap: 6
  },
  historyText: {
    fontSize: 14,
    color: '#333'
  },
  resultInfo: {
    gap: 6
  },
  resultText: {
    fontSize: 14,
    color: '#333'
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 6,
    marginTop: 8
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 4
  },
  errorItem: {
    fontSize: 11,
    color: '#d32f2f',
    marginLeft: 8
  },
  actionButtons: {
    gap: 10
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  cleanupButton: {
    backgroundColor: '#ff5722'
  },
  refreshButton: {
    backgroundColor: '#2196F3'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18
  }
});

export default AuditCleanupAdmin;