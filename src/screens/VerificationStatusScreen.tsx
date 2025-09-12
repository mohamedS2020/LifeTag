import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVerificationStatusTracking, VerificationStatusUpdate } from '../hooks/useVerificationStatusTracking';
import { LoadingOverlay, VerifiedBadge } from '../components/common';

/**
 * Verification Status Screen Props
 */
interface VerificationStatusScreenProps {
  onNavigateToRegistration?: () => void;
  onNavigateToReapply?: () => void;
  onError?: (error: string) => void;
}

/**
 * Verification Status Screen Component
 * 
 * Displays medical professional verification status with:
 * - Real-time status updates
 * - Status timeline and history
 * - Notification indicators
 * - Action buttons based on current status
 */
const VerificationStatusScreen: React.FC<VerificationStatusScreenProps> = ({
  onNavigateToRegistration,
  onNavigateToReapply,
  onError,
}) => {
  // Verification status tracking
  const {
    professionalData,
    statusUpdates,
    loading,
    error,
    hasUnreadUpdates,
    currentStatus,
    recentUpdates,
    statusTimeline,
    canReapply,
    markUpdatesAsRead,
  } = useVerificationStatusTracking();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  /**
   * Handle refresh action
   */
  const handleRefresh = () => {
    setRefreshing(true);
    // The hook automatically handles real-time updates
    setTimeout(() => setRefreshing(false), 1000);
  };

  /**
   * Handle marking updates as read
   */
  const handleMarkAsRead = () => {
    markUpdatesAsRead();
    Alert.alert('Updates Marked as Read', 'All recent updates have been marked as read.');
  };

  /**
   * Handle reapply action
   */
  const handleReapply = () => {
    Alert.alert(
      'Reapply for Verification',
      'You can submit a new medical professional verification application. Would you like to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          onPress: () => onNavigateToReapply?.()
        }
      ]
    );
  };

  /**
   * Render status header
   */
  const renderStatusHeader = () => (
    <View style={styles.statusHeader}>
      <View style={styles.statusContent}>
        <View style={styles.statusIconContainer}>
          <Ionicons 
            name={currentStatus.icon as any} 
            size={32} 
            color={currentStatus.color} 
          />
          {hasUnreadUpdates && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>!</Text>
            </View>
          )}
        </View>
        
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusTitle}>{currentStatus.message}</Text>
          
          {currentStatus.status === 'verified' && currentStatus.verifiedAt && (
            <Text style={styles.statusSubtitle}>
              Verified on {currentStatus.verifiedAt.toLocaleDateString()}
              {currentStatus.verifiedBy && ` by ${currentStatus.verifiedBy}`}
            </Text>
          )}
          
          {currentStatus.status !== 'verified' && currentStatus.status !== 'not_registered' && (
            <Text style={styles.statusSubtitle}>
              {professionalData?.createdAt && 
                `Submitted ${professionalData.createdAt.toLocaleDateString()}`
              }
            </Text>
          )}
        </View>
      </View>

      {currentStatus.status === 'verified' && (
        <VerifiedBadge
          isVerified={true}
          size="medium"
          verifiedAt={currentStatus.verifiedAt}
        />
      )}
    </View>
  );

  /**
   * Render action buttons
   */
  const renderActionButtons = () => {
    if (currentStatus.status === 'not_registered') {
      return (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onNavigateToRegistration}
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Register as Medical Professional</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (canReapply) {
      return (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleReapply}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Reapply for Verification</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (hasUnreadUpdates) {
      return (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleMarkAsRead}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FF6B6B" />
            <Text style={styles.secondaryButtonText}>Mark Updates as Read</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  /**
   * Render recent updates section
   */
  const renderRecentUpdates = () => {
    if (recentUpdates.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={20} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>Recent Updates</Text>
          {hasUnreadUpdates && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>New</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionContent}>
          {recentUpdates.map((update: VerificationStatusUpdate) => (
            <View key={update.id} style={styles.updateItem}>
              <View style={styles.updateContent}>
                <Text style={styles.updateMessage}>{update.message}</Text>
                <Text style={styles.updateTime}>
                  {update.timestamp.toLocaleDateString()} at {update.timestamp.toLocaleTimeString()}
                </Text>
                {update.notes && (
                  <Text style={styles.updateNotes}>{update.notes}</Text>
                )}
                {update.adminName && (
                  <Text style={styles.updateAdmin}>Updated by: {update.adminName}</Text>
                )}
              </View>
              <View style={[styles.updateStatusDot, { backgroundColor: getStatusColor(update.status) }]} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render professional info section
   */
  const renderProfessionalInfo = () => {
    if (!professionalData) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>Professional Information</Text>
        </View>

        <View style={styles.sectionContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {professionalData.personalInfo.firstName} {professionalData.personalInfo.lastName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License Number:</Text>
            <Text style={styles.infoValue}>{professionalData.professionalInfo.licenseNumber}</Text>
          </View>

          {professionalData.professionalInfo.specialty && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specialty:</Text>
              <Text style={styles.infoValue}>{professionalData.professionalInfo.specialty}</Text>
            </View>
          )}

          {professionalData.professionalInfo.hospitalAffiliation && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hospital:</Text>
              <Text style={styles.infoValue}>{professionalData.professionalInfo.hospitalAffiliation}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render status timeline
   */
  const renderStatusTimeline = () => {
    if (statusTimeline.length === 0) {
      return null;
    }

    const timelineToShow = showFullTimeline ? statusTimeline : statusTimeline.slice(0, 3);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color="#FF6B6B" />
          <Text style={styles.sectionTitle}>Status Timeline</Text>
        </View>

        <View style={styles.sectionContent}>
          {timelineToShow.map((item: any, index: number) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View style={[styles.timelineDot, { backgroundColor: getStatusColor(item.status) }]} />
                {index < timelineToShow.length - 1 && <View style={styles.timelineLine} />}
              </View>
              
              <View style={styles.timelineContent}>
                <Text style={styles.timelineMessage}>{item.message}</Text>
                <Text style={styles.timelineDate}>
                  {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString()}
                </Text>
                {item.adminName && (
                  <Text style={styles.timelineAdmin}>By: {item.adminName}</Text>
                )}
                {item.notes && (
                  <Text style={styles.timelineNotes}>{item.notes}</Text>
                )}
              </View>
            </View>
          ))}

          {statusTimeline.length > 3 && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowFullTimeline(!showFullTimeline)}
            >
              <Text style={styles.toggleButtonText}>
                {showFullTimeline ? 'Show Less' : `Show All (${statusTimeline.length})`}
              </Text>
              <Ionicons 
                name={showFullTimeline ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#FF6B6B" 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  /**
   * Get color for status
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'verified':
      case 'approved':
        return '#28A745';
      case 'rejected':
        return '#DC3545';
      case 'under_review':
        return '#FFC107';
      case 'registered':
      case 'pending':
      default:
        return '#6C757D';
    }
  };

  // =============================================
  // MAIN RENDER
  // =============================================

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading verification status..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#DC3545" />
        <Text style={styles.errorTitle}>Error Loading Status</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
      >
        {renderStatusHeader()}
        {renderActionButtons()}
        {renderRecentUpdates()}
        {renderProfessionalInfo()}
        {renderStatusTimeline()}
      </ScrollView>
    </SafeAreaView>
  );
};

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  statusHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC3545',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContent: {
    padding: 16,
  },
  actionContainer: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  updateContent: {
    flex: 1,
    marginRight: 12,
  },
  updateMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  updateTime: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  updateNotes: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  updateAdmin: {
    fontSize: 12,
    color: '#999999',
  },
  updateStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E9ECEF',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  timelineAdmin: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
    marginRight: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerificationStatusScreen;