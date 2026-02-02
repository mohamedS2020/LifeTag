import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { AuditLog } from '../../types';
import { profileService } from '../../services';
import { useAuth } from '../../context/AuthContext';

interface AuditLogViewerProps {
  profileId?: string; // If not provided, uses current user's profile
  showFilters?: boolean;
  maxItems?: number;
}

interface FilterOptions {
  accessType: string;
  accessorType: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  profileId,
  showFilters = true,
  maxItems = 100
}) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.tertiary
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg
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
      borderRadius: 8
    },
    retryButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: 'bold'
    },
    filtersContainer: {
      backgroundColor: colors.text.inverse,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default
    },
    searchInput: {
      backgroundColor: colors.background.tertiary,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 16,
      marginBottom: spacing.md
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      marginRight: spacing.sm,
      minWidth: 80
    },
    filterButton: {
      backgroundColor: colors.border.default,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      marginRight: spacing.xs
    },
    filterButtonActive: {
      backgroundColor: colors.primary.main
    },
    filterButtonText: {
      fontSize: 12,
      color: colors.text.primary
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.text.inverse,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default
    },
    summaryText: {
      fontSize: 14,
      color: colors.text.secondary
    },
    refreshText: {
      fontSize: 14,
      color: colors.primary.main
    },
    emptyText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center'
    },
    listContainer: {
      padding: spacing.md
    },
    logItem: {
      backgroundColor: colors.text.inverse,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs
    },
    logInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1
    },
    accessTypeIcon: {
      fontSize: 24,
      marginRight: spacing.sm
    },
    logDetails: {
      flex: 1
    },
    accessType: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.primary
    },
    timestamp: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2
    },
    accessorTypeBadge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      borderRadius: 12
    },
    accessorTypeText: {
      color: colors.text.inverse,
      fontSize: 10,
      fontWeight: 'bold'
    },
    logMeta: {
      marginTop: spacing.xs
    },
    metaText: {
      fontSize: 12,
      color: colors.text.secondary,
      marginBottom: 2
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.text.inverse
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary
    },
    closeButton: {
      padding: 5
    },
    closeButtonText: {
      fontSize: 20,
      color: colors.text.secondary
    },
    modalContent: {
      flex: 1,
      padding: spacing.lg
    },
    detailSection: {
      marginBottom: spacing.lg
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text.secondary,
      marginBottom: 5
    },
    detailValue: {
      fontSize: 16,
      color: colors.text.primary
    },
    fieldItem: {
      fontSize: 14,
      color: colors.text.primary,
      marginVertical: 2,
      marginLeft: spacing.sm
    },
    warningSection: {
      backgroundColor: colors.status.warning.main + '30',
      padding: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.status.warning.main + '50'
    },
    warningText: {
      fontSize: 14,
      color: colors.status.warning.main,
      fontWeight: 'bold'
    }
  }), [colors, spacing, borderRadius, typography, shadows]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const [filters, setFilters] = useState<FilterOptions>({
    accessType: 'all',
    accessorType: 'all',
    dateRange: 'all'
  });

  const targetProfileId = profileId || user?.id;

  useEffect(() => {
    loadAuditLogs();
  }, [targetProfileId]);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, filters, searchText]);

  const loadAuditLogs = async () => {
    if (!targetProfileId) {
      setError(t('profile.noProfileIdAvailable'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await profileService.getProfileAccessLogs(targetProfileId, maxItems);
      
      if (response.success && response.data) {
        setAuditLogs(response.data);
      } else {
        setError(response.error?.message || t('admin.failedLoadAuditLogs'));
      }
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
      setError(t('admin.failedLoadAuditLogs'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(log => 
        log.accessorType.toLowerCase().includes(searchLower) ||
        log.accessType.toLowerCase().includes(searchLower) ||
        log.accessMethod.toLowerCase().includes(searchLower) ||
        log.notes?.toLowerCase().includes(searchLower) ||
        log.fieldsAccessed?.some(field => field.toLowerCase().includes(searchLower))
      );
    }

    // Apply access type filter
    if (filters.accessType !== 'all') {
      filtered = filtered.filter(log => log.accessType === filters.accessType);
    }

    // Apply accessor type filter
    if (filters.accessorType !== 'all') {
      filtered = filtered.filter(log => log.accessorType === filters.accessorType);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(log => log.timestamp >= filterDate);
    }

    setFilteredLogs(filtered);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
      case 'qr_scan': return '📱';
      case 'full_profile': return '👤';
      case 'emergency_access': return '🚨';
      case 'profile_edit': return '✏️';
      default: return '👁️';
    }
  };

  const getAccessorTypeColor = (accessorType: string) => {
    switch (accessorType) {
      case 'medical_professional': return colors.primary.main;
      case 'emergency_responder': return colors.status.warning.main;
      case 'individual': return colors.status.success.main;
      case 'anonymous': return colors.text.tertiary;
      default: return colors.text.tertiary;
    }
  };

  const showLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setModalVisible(true);
  };

  const renderAuditLogItem = ({ item }: { item: AuditLog }) => (
    <TouchableOpacity 
      style={styles.logItem} 
      onPress={() => showLogDetails(item)}
    >
      <View style={styles.logHeader}>
        <View style={styles.logInfo}>
          <Text style={styles.accessTypeIcon}>
            {getAccessTypeIcon(item.accessType)}
          </Text>
          <View style={styles.logDetails}>
            <Text style={styles.accessType}>
              {item.accessType.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
        <View style={[
          styles.accessorTypeBadge,
          { backgroundColor: getAccessorTypeColor(item.accessorType) }
        ]}>
          <Text style={styles.accessorTypeText}>
            {item.accessorType.replace('_', ' ')}
          </Text>
        </View>
      </View>
      
      <View style={styles.logMeta}>
        <Text style={styles.metaText}>
          {t('admin.accessMethod')}: {item.accessMethod.replace('_', ' ')}
        </Text>
        {item.fieldsAccessed && item.fieldsAccessed.length > 0 && (
          <Text style={styles.metaText}>
            {t('admin.fieldsAccessed')}: {item.fieldsAccessed.slice(0, 3).join(', ')}
            {item.fieldsAccessed.length > 3 && '...'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('admin.searchLogs')}
          value={searchText}
          onChangeText={setSearchText}
        />
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{t('profile.accessType')}:</Text>
          <TouchableOpacity
            style={[styles.filterButton, filters.accessType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, accessType: 'all' }))}
          >
            <Text style={styles.filterButtonText}>{t('admin.filterAll')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.accessType === 'emergency_access' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, accessType: 'emergency_access' }))}
          >
            <Text style={styles.filterButtonText}>{t('admin.filterEmergency')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.accessType === 'qr_scan' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, accessType: 'qr_scan' }))}
          >
            <Text style={styles.filterButtonText}>{t('admin.filterQRScan')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{t('admin.timeRange')}:</Text>
          <TouchableOpacity
            style={[styles.filterButton, filters.dateRange === 'all' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}
          >
            <Text style={styles.filterButtonText}>{t('admin.filterAll')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.dateRange === 'today' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, dateRange: 'today' }))}
          >
            <Text style={styles.filterButtonText}>{t('admin.filterToday')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.dateRange === 'week' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, dateRange: 'week' }))}
          >
            <Text style={styles.filterButtonText}>{t('admin.filterWeek')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLogDetailsModal = () => {
    if (!selectedLog) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('admin.auditLogDetails')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{t('profile.accessType')}</Text>
              <Text style={styles.detailValue}>
                {getAccessTypeIcon(selectedLog.accessType)} {selectedLog.accessType.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{t('admin.accessedBy')}</Text>
              <Text style={[styles.detailValue, { color: getAccessorTypeColor(selectedLog.accessorType) }]}>
                {selectedLog.accessorType.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{t('admin.method')}</Text>
              <Text style={styles.detailValue}>
                {selectedLog.accessMethod.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{t('admin.timestamp')}</Text>
              <Text style={styles.detailValue}>
                {formatTimestamp(selectedLog.timestamp)}
              </Text>
            </View>

            {selectedLog.fieldsAccessed && selectedLog.fieldsAccessed.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>{t('admin.fieldsAccessed')}</Text>
                {selectedLog.fieldsAccessed.map((field, index) => (
                  <Text key={index} style={styles.fieldItem}>
                    • {field}
                  </Text>
                ))}
              </View>
            )}

            {selectedLog.notes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>{t('admin.notes')}</Text>
                <Text style={styles.detailValue}>{selectedLog.notes}</Text>
              </View>
            )}

            {selectedLog.location && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>{t('admin.location')}</Text>
                <Text style={styles.detailValue}>
                  {selectedLog.location.latitude.toFixed(4)}, {selectedLog.location.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            {selectedLog.deviceInfo && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>{t('admin.device')}</Text>
                <Text style={styles.detailValue}>{selectedLog.deviceInfo}</Text>
              </View>
            )}

            {selectedLog.dataModified && (
              <View style={styles.warningSection}>
                <Text style={styles.warningText}>⚠️ {t('admin.dataModifiedWarning')}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>{t('admin.loadingAuditLogs')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAuditLogs}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilters()}
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {t('admin.showingLogsCount', { filtered: filteredLogs.length, total: auditLogs.length })}
        </Text>
        <TouchableOpacity onPress={loadAuditLogs}>
          <Text style={styles.refreshText}>🔄 {t('admin.refresh')}</Text>
        </TouchableOpacity>
      </View>

      {filteredLogs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {auditLogs.length === 0 
              ? t('admin.noAccessLogsFound') 
              : t('admin.noLogsMatchFilters')
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderAuditLogItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {renderLogDetailsModal()}
    </View>
  );
};

export default AuditLogViewer;