import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicalProfessional } from '../../types';
import { MedicalProfessionalApprovalService } from '../../services/medicalProfessionalApprovalService';
import { VerifiedBadge } from '../common';
import { colors, spacing } from '../../theme';

/**
 * Props for ProfessionalVerification component
 */
interface ProfessionalVerificationProps {
  onClose?: () => void;
  onProfessionalVerified?: (professionalId: string) => void;
  onProfessionalRejected?: (professionalId: string) => void;
}

/**
 * Verification status for filtering
 */
type VerificationFilter = 'pending' | 'verified' | 'rejected' | 'all';

/**
 * ProfessionalVerification Component
 * 
 * Admin interface for reviewing and verifying medical professional registrations
 * - Lists pending medical professional applications
 * - Provides detailed review interface for each application
 * - Allows approval/rejection with notes
 * - Tracks verification history and status
 */
const ProfessionalVerification: React.FC<ProfessionalVerificationProps> = ({
  onClose,
  onProfessionalVerified,
  onProfessionalRejected,
}) => {
  // State management
  const [professionals, setProfessionals] = useState<MedicalProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VerificationFilter>('pending');
  const [selectedProfessional, setSelectedProfessional] = useState<MedicalProfessional | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Load medical professionals based on filter
   */
  useEffect(() => {
    loadProfessionals();
  }, [filter]);

  /**
   * Load professionals from Firebase using the approval service
   */
  const loadProfessionals = async () => {
    setLoading(true);
    try {
      let loadedProfessionals: MedicalProfessional[] = [];

      switch (filter) {
        case 'pending':
          loadedProfessionals = await MedicalProfessionalApprovalService.getPendingProfessionals();
          break;
        case 'verified':
          loadedProfessionals = await MedicalProfessionalApprovalService.getVerifiedProfessionals();
          break;
        case 'all':
        default:
          loadedProfessionals = await MedicalProfessionalApprovalService.getAllProfessionals();
          break;
      }

      setProfessionals(loadedProfessionals);
    } catch (error) {
      console.error('Error loading professionals:', error);
      Alert.alert('Error', 'Failed to load medical professionals');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle professional verification approval
   */
  const handleApproval = async () => {
    if (!selectedProfessional) return;

    setActionLoading(true);
    try {
      // TODO: Replace with actual admin ID from auth context
      const adminId = 'admin-user-id';
      const adminName = 'Admin User';
      
      await MedicalProfessionalApprovalService.approveProfessional(
        selectedProfessional.id,
        adminId,
        adminName,
        verificationNotes
      );

      onProfessionalVerified?.(selectedProfessional.id);
      
      Alert.alert(
        'Professional Verified',
        `${selectedProfessional.personalInfo.firstName} ${selectedProfessional.personalInfo.lastName} has been verified and can now access the application.`
      );
      
      setShowDetailModal(false);
      setVerificationNotes('');
      setSelectedProfessional(null);
      
      // Reload the list to reflect changes
      loadProfessionals();
    } catch (error) {
      console.error('Error approving professional:', error);
      Alert.alert('Error', 'Failed to approve medical professional');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle professional verification rejection
   */
  const handleRejection = async () => {
    if (!selectedProfessional) return;

    if (!verificationNotes.trim()) {
      Alert.alert('Rejection Reason Required', 'Please provide a reason for rejecting this application.');
      return;
    }

    setActionLoading(true);
    try {
      // TODO: Replace with actual admin ID from auth context
      const adminId = 'admin-user-id';
      const adminName = 'Admin User';
      
      await MedicalProfessionalApprovalService.rejectProfessional(
        selectedProfessional.id,
        adminId,
        adminName,
        verificationNotes
      );

      onProfessionalRejected?.(selectedProfessional.id);
      
      Alert.alert(
        'Application Rejected',
        `${selectedProfessional.personalInfo.firstName} ${selectedProfessional.personalInfo.lastName}'s application has been rejected.`
      );
      
      setShowDetailModal(false);
      setVerificationNotes('');
      setSelectedProfessional(null);
      
      // Reload the list to reflect changes
      loadProfessionals();
    } catch (error) {
      console.error('Error rejecting professional:', error);
      Alert.alert('Error', 'Failed to reject medical professional');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Open professional detail modal
   */
  const openProfessionalDetail = (professional: MedicalProfessional) => {
    setSelectedProfessional(professional);
    setVerificationNotes(professional.verificationStatus.verificationNotes || '');
    setShowDetailModal(true);
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  /**
   * Get status badge color
   */
  const getStatusBadgeStyle = (isVerified: boolean) => {
    return isVerified ? styles.verifiedBadge : styles.pendingBadge;
  };

  /**
   * Render professional card
   */
  const renderProfessionalCard = (professional: MedicalProfessional) => (
    <TouchableOpacity
      key={professional.id}
      style={styles.professionalCard}
      onPress={() => openProfessionalDetail(professional)}
    >
        <View style={styles.cardHeader}>
          <View style={styles.professionalInfo}>
            <View style={styles.nameAndBadgeRow}>
              <Text style={styles.professionalName}>
                {professional.personalInfo.firstName} {professional.personalInfo.lastName}
              </Text>
              <VerifiedBadge
                isVerified={professional.verificationStatus.isVerified}
                size="small"
                verifiedAt={professional.verificationStatus.verifiedAt}
              />
            </View>
            <Text style={styles.professionalSpecialty}>
              {professional.professionalInfo.specialty || 'General Practice'}
            </Text>
            <Text style={styles.professionalHospital}>
              {professional.professionalInfo.hospitalAffiliation || 'Independent Practice'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="mail" size={14} color={colors.text.tertiary} />
          <Text style={styles.detailText}>{professional.personalInfo.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="document-text" size={14} color={colors.text.tertiary} />
          <Text style={styles.detailText}>License: {professional.professionalInfo.licenseNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color={colors.text.tertiary} />
          <Text style={styles.detailText}>Applied: {formatDate(professional.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        <Text style={styles.reviewText}>Tap to review</Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render filter buttons
   */
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {(['pending', 'verified', 'all'] as VerificationFilter[]).map((filterOption) => (
        <TouchableOpacity
          key={filterOption}
          style={[
            styles.filterButton,
            filter === filterOption && styles.activeFilterButton
          ]}
          onPress={() => setFilter(filterOption)}
        >
          <Text style={[
            styles.filterButtonText,
            filter === filterOption && styles.activeFilterButtonText
          ]}>
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Professional Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Buttons */}
      {renderFilterButtons()}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading professionals...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {professionals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptyText}>
                {filter === 'pending' 
                  ? 'No pending medical professional applications at this time.'
                  : `No ${filter} medical professionals found.`
                }
              </Text>
            </View>
          ) : (
            professionals.map(renderProfessionalCard)
          )}
        </ScrollView>
      )}

      {/* Professional Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedProfessional && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Verification Review</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Professional Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Professional Information</Text>
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoValue}>
                        {selectedProfessional.personalInfo.firstName} {selectedProfessional.personalInfo.lastName}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoValue}>{selectedProfessional.personalInfo.email}</Text>
                    </View>
                    {selectedProfessional.personalInfo.phoneNumber && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={styles.infoValue}>{selectedProfessional.personalInfo.phoneNumber}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* License Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>License Information</Text>
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>License Number:</Text>
                      <Text style={styles.infoValue}>{selectedProfessional.professionalInfo.licenseNumber}</Text>
                    </View>
                    {selectedProfessional.professionalInfo.licenseState && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>License State:</Text>
                        <Text style={styles.infoValue}>{selectedProfessional.professionalInfo.licenseState}</Text>
                      </View>
                    )}
                    {selectedProfessional.professionalInfo.specialty && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Specialty:</Text>
                        <Text style={styles.infoValue}>{selectedProfessional.professionalInfo.specialty}</Text>
                      </View>
                    )}
                    {selectedProfessional.professionalInfo.hospitalAffiliation && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Hospital/Institution:</Text>
                        <Text style={styles.infoValue}>{selectedProfessional.professionalInfo.hospitalAffiliation}</Text>
                      </View>
                    )}
                    {selectedProfessional.professionalInfo.yearsOfExperience && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Years of Experience:</Text>
                        <Text style={styles.infoValue}>{selectedProfessional.professionalInfo.yearsOfExperience}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Verification Notes */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Verification Notes</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={verificationNotes}
                    onChangeText={setVerificationNotes}
                    placeholder="Add verification notes or rejection reason..."
                    placeholderTextColor={colors.text.tertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={handleRejection}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="white" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={handleApproval}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

/**
 * Styles for ProfessionalVerification component
 */
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.background.elevated,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  activeFilterButton: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  activeFilterButtonText: {
    color: colors.text.inverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  professionalCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  professionalInfo: {
    flex: 1,
  },
  nameAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing.xs,
    flex: 1,
  },
  professionalSpecialty: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  professionalHospital: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: spacing.borderRadius.md,
  },
  pendingBadge: {
    backgroundColor: colors.status.warning.main + '30',
  },
  verifiedBadge: {
    backgroundColor: colors.status.success.main + '30',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
  cardDetails: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  reviewText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginLeft: spacing.xxs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.error.main,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.md,
  },
  rejectButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.success.main,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.md,
  },
  approveButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default ProfessionalVerification;