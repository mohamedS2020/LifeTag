import React, { useState, useEffect } from 'react';
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
  const { user } = useAuth();
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
      setError('No profile ID available');
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
        setError(response.error?.message || 'Failed to load audit logs');
      }
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
      setError('Failed to load audit logs');
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
      case 'medical_professional': return '#2196F3';
      case 'emergency_responder': return '#FF5722';
      case 'individual': return '#4CAF50';
      case 'anonymous': return '#9E9E9E';
      default: return '#757575';
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
          Method: {item.accessMethod.replace('_', ' ')}
        </Text>
        {item.fieldsAccessed && item.fieldsAccessed.length > 0 && (
          <Text style={styles.metaText}>
            Fields: {item.fieldsAccessed.slice(0, 3).join(', ')}
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
          placeholder="Search logs..."
          value={searchText}
          onChangeText={setSearchText}
        />
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Access Type:</Text>
          <TouchableOpacity
            style={[styles.filterButton, filters.accessType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, accessType: 'all' }))}
          >
            <Text style={styles.filterButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.accessType === 'emergency_access' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, accessType: 'emergency_access' }))}
          >
            <Text style={styles.filterButtonText}>Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.accessType === 'qr_scan' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, accessType: 'qr_scan' }))}
          >
            <Text style={styles.filterButtonText}>QR Scan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Time Range:</Text>
          <TouchableOpacity
            style={[styles.filterButton, filters.dateRange === 'all' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}
          >
            <Text style={styles.filterButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.dateRange === 'today' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, dateRange: 'today' }))}
          >
            <Text style={styles.filterButtonText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.dateRange === 'week' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, dateRange: 'week' }))}
          >
            <Text style={styles.filterButtonText}>Week</Text>
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
            <Text style={styles.modalTitle}>Access Log Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Access Type</Text>
              <Text style={styles.detailValue}>
                {getAccessTypeIcon(selectedLog.accessType)} {selectedLog.accessType.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Accessed By</Text>
              <Text style={[styles.detailValue, { color: getAccessorTypeColor(selectedLog.accessorType) }]}>
                {selectedLog.accessorType.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Method</Text>
              <Text style={styles.detailValue}>
                {selectedLog.accessMethod.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Timestamp</Text>
              <Text style={styles.detailValue}>
                {formatTimestamp(selectedLog.timestamp)}
              </Text>
            </View>

            {selectedLog.fieldsAccessed && selectedLog.fieldsAccessed.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Fields Accessed</Text>
                {selectedLog.fieldsAccessed.map((field, index) => (
                  <Text key={index} style={styles.fieldItem}>
                    • {field}
                  </Text>
                ))}
              </View>
            )}

            {selectedLog.notes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{selectedLog.notes}</Text>
              </View>
            )}

            {selectedLog.location && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {selectedLog.location.latitude.toFixed(4)}, {selectedLog.location.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            {selectedLog.deviceInfo && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Device</Text>
                <Text style={styles.detailValue}>{selectedLog.deviceInfo}</Text>
              </View>
            )}

            {selectedLog.dataModified && (
              <View style={styles.warningSection}>
                <Text style={styles.warningText}>⚠️ Data was modified during this access</Text>
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
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading audit logs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAuditLogs}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilters()}
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Showing {filteredLogs.length} of {auditLogs.length} access logs
        </Text>
        <TouchableOpacity onPress={loadAuditLogs}>
          <Text style={styles.refreshText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {filteredLogs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {auditLogs.length === 0 
              ? "No access logs found" 
              : "No logs match your filters"
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
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 80
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8
  },
  filterButtonActive: {
    backgroundColor: '#2196F3'
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333'
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  summaryText: {
    fontSize: 14,
    color: '#666'
  },
  refreshText: {
    fontSize: 14,
    color: '#2196F3'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  listContainer: {
    padding: 15
  },
  logItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
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
    marginBottom: 8
  },
  logInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  accessTypeIcon: {
    fontSize: 24,
    marginRight: 10
  },
  logDetails: {
    flex: 1
  },
  accessType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  accessorTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  accessorTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  logMeta: {
    marginTop: 8
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
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
  modalContent: {
    flex: 1,
    padding: 20
  },
  detailSection: {
    marginBottom: 20
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5
  },
  detailValue: {
    fontSize: 16,
    color: '#333'
  },
  fieldItem: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
    marginLeft: 10
  },
  warningSection: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: 'bold'
  }
});

export default AuditLogViewer;