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
          <Ionicons name="mail" size={14} color="#666666" />
          <Text style={styles.detailText}>{professional.personalInfo.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="document-text" size={14} color="#666666" />
          <Text style={styles.detailText}>License: {professional.professionalInfo.licenseNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color="#666666" />
          <Text style={styles.detailText}>Applied: {formatDate(professional.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Ionicons name="chevron-forward" size={16} color="#999999" />
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
          <Ionicons name="close" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Professional Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Buttons */}
      {renderFilterButtons()}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading professionals...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {professionals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#CCCCCC" />
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
                  <Ionicons name="close" size={24} color="#333333" />
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
                    placeholderTextColor="#999999"
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  activeFilterButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  professionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  professionalInfo: {
    flex: 1,
  },
  nameAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
    flex: 1,
  },
  professionalSpecialty: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  professionalHospital: {
    fontSize: 12,
    color: '#999999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#FFF3CD',
  },
  verifiedBadge: {
    backgroundColor: '#D4EDDA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  reviewText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC3545',
    paddingVertical: 14,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28A745',
    paddingVertical: 14,
    borderRadius: 8,
  },
  approveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfessionalVerification;