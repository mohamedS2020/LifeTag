import React, { useState, useEffect } from 'react';
import { AdminManagementService } from '../../services/adminManagementService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfessionalVerification, AuditCleanupAdmin } from '../Admin';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase.config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../../theme';

/**
 * Admin Dashboard Props
 */
interface AdminDashboardProps {
  onNavigateToProfile?: (profileId: string) => void;
  onError?: (error: string) => void;
}

type AdminNavigationProp = {
  navigate: (screen: string, params?: any) => void;
};

/**
 * Admin Dashboard Component
 * 
 * Central dashboard for admin users providing access to:
 * - Medical professional verification
 * - Audit log cleanup and management
 * - System administration tools
 * - User management (future)
 */
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToProfile,
  onError,
}) => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<AdminNavigationProp>();
  const [activeModal, setActiveModal] = useState<'verification' | 'audit' | 'createAdmin' | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMedicalProfessionals: 0,
    pendingVerifications: 0,
    totalAdmins: 0
  });

  // Admin creation form state
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'admin'
  });

  /**
   * Load system statistics on component mount
   */
  useEffect(() => {
    setLoading(true);
    // Queries for each stat
    const usersQuery = query(collection(db, 'users'), where('userType', '==', 'individual'));
    const medProsQuery = query(collection(db, 'users'), where('userType', '==', 'medical_professional'), where('isVerified', '==', true));
    const pendingMedProsQuery = query(collection(db, 'users'), where('userType', '==', 'medical_professional'), where('isVerified', '==', false));
    const adminsQuery = query(collection(db, 'users'), where('userType', '==', 'admin'));

    // Store unsubscribe functions for cleanup
    const unsubRefs: Array<() => void> = [];

    unsubRefs.push(onSnapshot(usersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
      setLoading(false);
    }, (error) => {
      console.error('Error listening to usersQuery:', error);
      onError?.('Failed to listen for user stats updates');
    }));
    unsubRefs.push(onSnapshot(medProsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalMedicalProfessionals: snapshot.size }));
    }, (error) => {
      console.error('Error listening to medProsQuery:', error);
      onError?.('Failed to listen for medical professional stats updates');
    }));
    unsubRefs.push(onSnapshot(pendingMedProsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingVerifications: snapshot.size }));
    }, (error) => {
      console.error('Error listening to pendingMedProsQuery:', error);
      onError?.('Failed to listen for pending verification stats updates');
    }));
    unsubRefs.push(onSnapshot(adminsQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalAdmins: snapshot.size }));
    }, (error) => {
      console.error('Error listening to adminsQuery:', error);
      onError?.('Failed to listen for admin stats updates');
    }));

    return () => {
      unsubRefs.forEach(unsub => unsub());
    };
  }, []);

  /**
   * Handle admin creation
   */
  const handleCreateAdmin = async () => {
    if (!adminForm.email || !adminForm.password || !adminForm.firstName || !adminForm.lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await AdminManagementService.createAdmin(adminForm, user?.id || '');
      Alert.alert(
        'Success',
        'Admin user created successfully',
        [{ text: 'OK', onPress: () => {
          setActiveModal(null);
          setAdminForm({ email: '', password: '', firstName: '', lastName: '', role: 'admin' });
        }}]
      );
    } catch (error) {
      console.error('Error creating admin:', error);
      Alert.alert('Error', `Failed to create admin: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle professional verification completion
   */
  const handleProfessionalVerified = (professionalId: string) => {
    Alert.alert(
      'Success',
      'Medical professional has been verified successfully.',
      [{ text: 'OK' }]
    );
  };

  const handleProfessionalRejected = (professionalId: string) => {
    Alert.alert(
      'Professional Rejected',
      'Medical professional application has been rejected.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle error display
   */
  const handleError = (error: string) => {
    onError?.(error);
    Alert.alert('Error', error, [{ text: 'OK' }]);
  };

  /**
   * Handle admin sign out
   */
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={16} color={colors.status.success.main} />
              <Text style={styles.adminBadgeText}>Administrator</Text>
            </View>
          </View>
          <Text style={styles.welcomeText}>Welcome, {user?.email}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color={colors.primary.main} />
                <Text style={styles.statLabel}>Total Users</Text>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="medical" size={24} color={colors.status.success.main} />
                <Text style={styles.statLabel}>Medical Pros</Text>
                <Text style={styles.statValue}>{stats.totalMedicalProfessionals}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color={colors.status.warning.main} />
                <Text style={styles.statLabel}>Pending Reviews</Text>
                <Text style={styles.statValue}>{stats.pendingVerifications}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="shield-checkmark" size={24} color={colors.status.info.main} />
                <Text style={styles.statLabel}>Admins</Text>
                <Text style={styles.statValue}>{stats.totalAdmins}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Admin Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Administration Tools</Text>
          
          {/* Scan QR Code */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="scan-outline" size={28} color={colors.primary.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan QR Code</Text>
              <Text style={styles.actionDescription}>
                Scan a patient's emergency QR code
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Medical Professional Verification */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('verification')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark" size={28} color={colors.status.success.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Medical Professional Verification</Text>
              <Text style={styles.actionDescription}>
                Review and approve medical professional registrations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* History - Admin Audit Logs */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminAuditLogs')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="time" size={28} color={colors.status.warning.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>History</Text>
              <Text style={styles.actionDescription}>
                View all system audit logs and activity history
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Audit Log Management */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('audit')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="document-text" size={28} color={colors.primary.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Audit Log Management</Text>
              <Text style={styles.actionDescription}>
                Manage audit log retention and cleanup policies
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* System Settings */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('createAdmin')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="person-add" size={28} color={colors.status.info.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create Admin User</Text>
              <Text style={styles.actionDescription}>
                Create new administrator accounts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* System Settings */}
          <TouchableOpacity
            style={[styles.actionCard, styles.disabledCard]}
            disabled
          >
            <View style={styles.actionIcon}>
              <Ionicons name="settings" size={28} color={colors.text.tertiary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.disabledText]}>System Settings</Text>
              <Text style={[styles.actionDescription, styles.disabledText]}>
                Configure system-wide settings (Coming Soon)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.disabled} />
          </TouchableOpacity>

          {/* User Management */}
          <TouchableOpacity
            style={[styles.actionCard, styles.disabledCard]}
            disabled
          >
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={28} color={colors.text.tertiary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.disabledText]}>User Management</Text>
              <Text style={[styles.actionDescription, styles.disabledText]}>
                Manage user accounts and permissions (Coming Soon)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.disabled} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={colors.status.error.main} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Professional Verification Modal */}
      <Modal
        visible={activeModal === 'verification'}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <ProfessionalVerification
          onClose={() => setActiveModal(null)}
          onProfessionalVerified={handleProfessionalVerified}
          onProfessionalRejected={handleProfessionalRejected}
        />
      </Modal>

      {/* Audit Cleanup Modal */}
      <Modal
        visible={activeModal === 'audit'}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <AuditCleanupAdmin
          onClose={() => setActiveModal(null)}
        />
      </Modal>

      {/* Create Admin Modal */}
      <Modal
        visible={activeModal === 'createAdmin'}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Admin User</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={adminForm.email}
                onChangeText={(text) => setAdminForm(prev => ({ ...prev, email: text }))}
                placeholder="admin@example.com"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password *</Text>
              <TextInput
                style={styles.formInput}
                value={adminForm.password}
                onChangeText={(text) => setAdminForm(prev => ({ ...prev, password: text }))}
                placeholder="Secure password"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>First Name *</Text>
              <TextInput
                style={styles.formInput}
                value={adminForm.firstName}
                onChangeText={(text) => setAdminForm(prev => ({ ...prev, firstName: text }))}
                placeholder="First name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Last Name *</Text>
              <TextInput
                style={styles.formInput}
                value={adminForm.lastName}
                onChangeText={(text) => setAdminForm(prev => ({ ...prev, lastName: text }))}
                placeholder="Last name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.disabledButton]}
              onPress={handleCreateAdmin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="white" />
                  <Text style={styles.createButtonText}>Create Admin</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.success.main + '30',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: spacing.borderRadius.lg,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.status.success.main,
    marginLeft: spacing.xxs,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  statsContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.xxs,
  },
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  actionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  disabledCard: {
    opacity: 0.6,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  disabledText: {
    color: colors.text.tertiary,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  createButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  signOutSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.status.error.main,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.status.error.main,
    marginLeft: spacing.xs,
  },
});

export default AdminDashboard;