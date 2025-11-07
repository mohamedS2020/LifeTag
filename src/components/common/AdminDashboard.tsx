import React, { useState, useEffect } from 'react';
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
import { AdminManagementService } from '../../services/adminManagementService';
import { useNavigation } from '@react-navigation/native';

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
  const { user } = useAuth();
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
    loadSystemStats();
  }, []);

  /**
   * Load system statistics
   */
  const loadSystemStats = async () => {
    try {
      setLoading(true);
      const systemStats = await AdminManagementService.getSystemStats();
      setStats(systemStats);
    } catch (error) {
      console.error('Error loading system stats:', error);
      onError?.('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

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
          loadSystemStats(); // Refresh stats
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
      [{ text: 'OK', onPress: () => loadSystemStats() }] // Refresh stats
    );
  };

  /**
   * Handle professional rejection
   */
  const handleProfessionalRejected = (professionalId: string) => {
    Alert.alert(
      'Professional Rejected',
      'Medical professional application has been rejected.',
      [{ text: 'OK', onPress: () => loadSystemStats() }] // Refresh stats
    );
  };

  /**
   * Handle error display
   */
  const handleError = (error: string) => {
    onError?.(error);
    Alert.alert('Error', error, [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
              <Text style={styles.adminBadgeText}>Administrator</Text>
            </View>
          </View>
          <Text style={styles.welcomeText}>Welcome, {user?.email}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color="#2196F3" />
                <Text style={styles.statLabel}>Total Users</Text>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="medical" size={24} color="#4CAF50" />
                <Text style={styles.statLabel}>Medical Pros</Text>
                <Text style={styles.statValue}>{stats.totalMedicalProfessionals}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#FF9800" />
                <Text style={styles.statLabel}>Pending Reviews</Text>
                <Text style={styles.statValue}>{stats.pendingVerifications}</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="shield-checkmark" size={24} color="#9C27B0" />
                <Text style={styles.statLabel}>Admins</Text>
                <Text style={styles.statValue}>{stats.totalAdmins}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Admin Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Administration Tools</Text>
          
          {/* Medical Professional Verification */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('verification')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#4CAF50" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Medical Professional Verification</Text>
              <Text style={styles.actionDescription}>
                Review and approve medical professional registrations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {/* History - Admin Audit Logs */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminAuditLogs')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="time" size={28} color="#FF9800" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>History</Text>
              <Text style={styles.actionDescription}>
                View all system audit logs and activity history
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {/* Audit Log Management */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('audit')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="document-text" size={28} color="#2196F3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Audit Log Management</Text>
              <Text style={styles.actionDescription}>
                Manage audit log retention and cleanup policies
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {/* System Settings */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('createAdmin')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="person-add" size={28} color="#9C27B0" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create Admin User</Text>
              <Text style={styles.actionDescription}>
                Create new administrator accounts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {/* System Settings */}
          <TouchableOpacity
            style={[styles.actionCard, styles.disabledCard]}
            disabled
          >
            <View style={styles.actionIcon}>
              <Ionicons name="settings" size={28} color="#999" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.disabledText]}>System Settings</Text>
              <Text style={[styles.actionDescription, styles.disabledText]}>
                Configure system-wide settings (Coming Soon)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          {/* User Management */}
          <TouchableOpacity
            style={[styles.actionCard, styles.disabledCard]}
            disabled
          >
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={28} color="#999" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.disabledText]}>User Management</Text>
              <Text style={[styles.actionDescription, styles.disabledText]}>
                Manage user accounts and permissions (Coming Soon)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
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
              <Ionicons name="close" size={24} color="#666" />
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
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Last Name *</Text>
              <TextInput
                style={styles.formInput}
                value={adminForm.lastName}
                onChangeText={(text) => setAdminForm(prev => ({ ...prev, lastName: text }))}
                placeholder="Last name"
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
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.6,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  disabledText: {
    color: '#999',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#9C27B0',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminDashboard;