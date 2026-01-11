import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { AuditLog, User, MedicalProfessional } from '../../types';
import { profileService } from '../../services';
import authService from '../../services/authService';
import { MedicalProfessionalApprovalService } from '../../services/medicalProfessionalApprovalService';

interface UserAuditLogViewerProps {
  profileId: string;
}

interface AccessorInfo {
  name: string;
  isMedicalProfessional: boolean;
  medicalInfo?: {
    specialty?: string;
    licenseNumber?: string;
  };
}

/**
 * User Audit Log Viewer Component
 * Shows regular users who has accessed their profile
 */
const UserAuditLogViewer: React.FC<UserAuditLogViewerProps> = ({ profileId }) => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [accessorInfos, setAccessorInfos] = useState<{ [userId: string]: AccessorInfo }>({});
  const [loading, setLoading] = useState(false);

  /**
   * Fetch accessor information (names and medical professional status)
   */
  const fetchAccessorInfos = async (logs: AuditLog[]) => {
    const userIds = [...new Set(logs.map(log => log.accessedBy))].filter(id => id !== 'anonymous');
    
    if (userIds.length === 0) return;

    try {
      const medicalProfessionals = await MedicalProfessionalApprovalService.getAllProfessionals();
      const newAccessorInfos: { [key: string]: AccessorInfo } = {};

      for (const userId of userIds) {
        // Check if this is an admin access
        const logEntry = logs.find(log => log.accessedBy === userId);
        if (logEntry?.accessorType === 'admin') {
          newAccessorInfos[userId] = {
            name: 'Admin',
            isMedicalProfessional: false,
          };
          continue;
        }

        // Check if user is a medical professional
        const medicalProfessional = medicalProfessionals.find(prof => prof.userId === userId);
        
        if (medicalProfessional) {
          // Medical professional - get name from medical professional data
          newAccessorInfos[userId] = {
            name: `${medicalProfessional.personalInfo.firstName} ${medicalProfessional.personalInfo.lastName}`,
            isMedicalProfessional: true,
            medicalInfo: {
              specialty: medicalProfessional.professionalInfo.specialty,
              licenseNumber: medicalProfessional.professionalInfo.licenseNumber,
            },
          };
        } else {
          // Regular user - first try to get name from their profile
          const userProfileResponse = await profileService.getProfileByUserId(userId);
          if (userProfileResponse.success && userProfileResponse.data) {
            const profile = userProfileResponse.data;
            newAccessorInfos[userId] = {
              name: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
              isMedicalProfessional: false,
            };
          } else {
            // Fallback: try to get name from users collection (set during registration)
            const userBasicInfo = await authService.getUserBasicInfo(userId);
            if (userBasicInfo?.firstName || userBasicInfo?.lastName) {
              newAccessorInfos[userId] = {
                name: `${userBasicInfo.firstName || ''} ${userBasicInfo.lastName || ''}`.trim() || `User (${userId.substring(0, 8)}...)`,
                isMedicalProfessional: false,
              };
            } else {
              // Final fallback if no name found anywhere
              newAccessorInfos[userId] = {
                name: `User (${userId.substring(0, 8)}...)`,
                isMedicalProfessional: false,
              };
            }
          }
        }
      }

      setAccessorInfos(prev => ({ ...prev, ...newAccessorInfos }));
    } catch (error) {
      console.error('Error fetching accessor info:', error);
    }
  };

  /**
   * Fetch user's profile access logs
   */
  const fetchAuditLogs = async () => {
    if (!profileId) return;
    
    setLoading(true);
    try {
      const response = await profileService.getProfileAccessLogs(profileId, 100);
      
      if (response.success && response.data) {
        // Filter out the user's own accesses (they shouldn't see their own profile views)
        const filteredLogs = response.data.filter(log => log.accessedBy !== user?.id);
        setAuditLogs(filteredLogs);
        await fetchAccessorInfos(filteredLogs);
      } else {
        Alert.alert('Error', 'Failed to load access history');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      Alert.alert('Error', 'Failed to load access history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [profileId]);

  /**
   * Render individual audit log item
   */
  const renderAuditLogItem = ({ item }: { item: AuditLog }) => {
    const accessorInfo = accessorInfos[item.accessedBy] || {
      name: item.accessedBy === 'anonymous' ? 'Anonymous User' : `User (${item.accessedBy.substring(0, 8)}...)`,
      isMedicalProfessional: false,
    };

    const getAccessTypeIcon = () => {
      switch (item.accessType) {
        case 'qr_scan':
          return 'qr-code';
        case 'full_profile':
          return 'person-outline';
        case 'emergency_access':
          return 'medical-outline';
        default:
          return 'eye-outline';
      }
    };

    const getAccessTypeLabel = () => {
      switch (item.accessType) {
        case 'qr_scan':
          return 'QR Code Scan';
        case 'full_profile':
          return 'Full Profile View';
        case 'emergency_access':
          return 'Emergency Access';
        default:
          return 'Profile Access';
      }
    };

    const formatAccessDate = (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    };

    return (
      <View style={styles.auditLogItem}>
        <View style={styles.auditLogHeader}>
          <View style={styles.auditLogIcon}>
            <Ionicons
              name={getAccessTypeIcon()}
              size={20}
              color={colors.primary.main}
            />
          </View>
          <View style={styles.auditLogInfo}>
            <View style={styles.accessorNameContainer}>
              <Text style={styles.accessorName}>
                {accessorInfo.name}
              </Text>
              {accessorInfo.isMedicalProfessional && (
                <View style={styles.medicalBadge}>
                  <Ionicons name="medical" size={12} color={colors.text.inverse} />
                  <Text style={styles.medicalBadgeText}>MD</Text>
                </View>
              )}
            </View>
            <Text style={styles.accessType}>
              {getAccessTypeLabel()}
            </Text>
            <Text style={styles.accessTime}>
              {formatAccessDate(item.timestamp)}
            </Text>
            {accessorInfo.isMedicalProfessional && accessorInfo.medicalInfo?.specialty && (
              <Text style={styles.medicalSpecialty}>
                {accessorInfo.medicalInfo.specialty}
              </Text>
            )}
          </View>
          <View style={styles.accessMethodBadge}>
            <Text style={styles.accessMethodText}>
              {item.accessMethod === 'qr_code' ? 'QR' : 'APP'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading access history...</Text>
      </View>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="shield-checkmark-outline" size={64} color={colors.status.success.main} />
        <Text style={styles.emptyStateTitle}>No Profile Access Yet</Text>
        <Text style={styles.emptyStateText}>
          Your profile access history will appear here when others view your profile.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Access History</Text>
      <Text style={styles.subtitle}>
        People who have accessed your profile ({auditLogs.length} total)
      </Text>
      
      <FlatList
        data={auditLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderAuditLogItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchAuditLogs}
            tintColor={colors.primary.main}
          />
        }
        contentContainerStyle={styles.listContent}
        style={styles.logsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  logsList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  auditLogItem: {
    backgroundColor: colors.text.inverse,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  auditLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditLogIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary.main + '20',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  auditLogInfo: {
    flex: 1,
  },
  accessorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  accessorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  medicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.success.main,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  medicalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
    marginLeft: 2,
  },
  accessType: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '500',
    marginBottom: 2,
  },
  accessTime: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  medicalSpecialty: {
    fontSize: 12,
    color: colors.status.success.main,
    fontStyle: 'italic',
    marginTop: 2,
  },
  accessMethodBadge: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accessMethodText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default UserAuditLogViewer;