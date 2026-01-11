import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuditLog } from '../types';
import profileService from '../services/profileService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors, spacing } from '../theme';

type AdminAuditLogsNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Admin Audit Logs Screen
 * Shows all system audit logs for admin oversight
 */
const AdminAuditLogsScreen: React.FC = () => {
  const navigation = useNavigation<AdminAuditLogsNavigationProp>();
  const insets = useSafeAreaInsets();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch all audit logs for admin view
   */
  const fetchAllAuditLogs = async () => {
    setLoading(true);
    try {
      // Get all audit logs (admin can see everything)
      const response = await profileService.getAllAuditLogs(200); // Get last 200 logs
      
      if (response.success && response.data) {
        setAuditLogs(response.data);
      } else {
        Alert.alert('Error', 'Failed to load audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      Alert.alert('Error', 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllAuditLogs();
  };

  /**
   * Navigate to detailed log view
   */
  const handleLogPress = (log: AuditLog) => {
    // Serialize timestamp to avoid non-serializable value warning
    const serializedLog = {
      ...log,
      timestamp: log.timestamp instanceof Date 
        ? log.timestamp.toISOString() 
        : log.timestamp
    };
    navigation.navigate('AdminAuditLogDetail', { logId: log.id, logData: serializedLog });
  };

  useEffect(() => {
    fetchAllAuditLogs();
  }, []);

  /**
   * Render compact audit log item
   */
  const renderAuditLogItem = ({ item }: { item: AuditLog }) => {
    const getAccessTypeIcon = () => {
      switch (item.accessType) {
        case 'qr_scan':
          return 'qr-code';
        case 'full_profile':
          return 'person-outline';
        case 'emergency_access':
          return 'medical-outline';
        case 'profile_edit':
          return 'create-outline';
        default:
          return 'eye-outline';
      }
    };

    const getAccessTypeColor = () => {
      switch (item.accessorType) {
        case 'medical_professional':
          return colors.status.success.main;
        case 'admin':
          return colors.status.error.main;
        case 'individual':
          return colors.primary.main;
        case 'anonymous':
          return colors.text.tertiary;
        default:
          return colors.text.tertiary;
      }
    };

    const getAccessTypeLabel = () => {
      switch (item.accessType) {
        case 'qr_scan':
          return 'QR Scan';
        case 'full_profile':
          return 'Full Profile';
        case 'emergency_access':
          return 'Emergency';
        case 'profile_edit':
          return 'Profile Edit';
        default:
          return 'Access';
      }
    };

    const getUserTypeLabel = () => {
      switch (item.accessorType) {
        case 'medical_professional':
          return 'Medical Pro';
        case 'admin':
          return 'Admin';
        case 'individual':
          return 'User';
        case 'anonymous':
          return 'Anonymous';
        default:
          return 'Unknown';
      }
    };

    const formatTimestamp = (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    };

    return (
      <TouchableOpacity style={styles.logItem} onPress={() => handleLogPress(item)}>
        <View style={styles.logHeader}>
          <View style={[styles.logIcon, { backgroundColor: `${getAccessTypeColor()}20` }]}>
            <Ionicons
              name={getAccessTypeIcon()}
              size={18}
              color={getAccessTypeColor()}
            />
          </View>
          <View style={styles.logInfo}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logAction}>{getAccessTypeLabel()}</Text>
              <View style={[styles.userTypeBadge, { backgroundColor: getAccessTypeColor() }]}>
                <Text style={styles.userTypeText}>{getUserTypeLabel()}</Text>
              </View>
            </View>
            <Text style={styles.logProfileId} numberOfLines={1}>
              Profile: {item.profileId.substring(0, 12)}...
            </Text>
            <Text style={styles.logTimestamp}>{formatTimestamp(item.timestamp)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && auditLogs.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Audit Logs</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading audit logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Audit Logs</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsText}>
            Total Logs: {auditLogs.length}
          </Text>
          <Text style={styles.statsSubtext}>
            Tap any log to view full details
          </Text>
        </View>

        <FlatList
          data={auditLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderAuditLogItem}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
            />
          }
          contentContainerStyle={styles.listContent}
          style={styles.logsList}
          nestedScrollEnabled={true}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsHeader: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  statsSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  logsList: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
  },
  logItem: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xxs,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  logInfo: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  userTypeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.borderRadius.sm,
  },
  userTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  logProfileId: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  logTimestamp: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontWeight: '500',
  },
});

export default AdminAuditLogsScreen;