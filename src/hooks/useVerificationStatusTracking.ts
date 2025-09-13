import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { MedicalProfessional } from '../types';
import { useAuth } from '../context/AuthContext';

/**
 * Interface for verification status updates
 */
export interface VerificationStatusUpdate {
  id: string;
  professionalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  message: string;
  timestamp: Date;
  adminName?: string;
  previousStatus?: string;
  notes?: string;
}

/**
 * Hook for tracking medical professional verification status
 */
export const useVerificationStatusTracking = () => {
  const { user: currentUser } = useAuth();
  const [professionalData, setProfessionalData] = useState<MedicalProfessional | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<VerificationStatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false);

  /**
   * Set up real-time listener for professional data changes
   */
  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'medical_professional') {
      setLoading(false);
      return;
    }

    let unsubscribeProfessional: Unsubscribe | null = null;
    let unsubscribeUpdates: Unsubscribe | null = null;

    const setupListeners = async () => {
      try {
        // Listen for changes to professional data
        const professionalQuery = query(
          collection(db, 'users'),
          where('userType', '==', 'medical_professional'),
          where('__name__', '==', currentUser.id)
        );

        unsubscribeProfessional = onSnapshot(
          professionalQuery,
          (snapshot) => {
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              const professional = {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                verificationStatus: {
                  ...doc.data().verificationStatus,
                  verifiedAt: doc.data().verificationStatus?.verifiedAt?.toDate(),
                },
                professionalInfo: {
                  ...doc.data().professionalInfo,
                  licenseExpiryDate: doc.data().professionalInfo?.licenseExpiryDate?.toDate(),
                },
              } as MedicalProfessional;

              setProfessionalData(professional);

              // Listen for status updates for this professional
              const updatesQuery = query(
                collection(db, 'verification_status_updates'),
                where('professionalId', '==', doc.id),
                orderBy('timestamp', 'desc')
              );

              unsubscribeUpdates = onSnapshot(
                updatesQuery,
                (updatesSnapshot) => {
                  const updates = updatesSnapshot.docs.map(updateDoc => ({
                    id: updateDoc.id,
                    ...updateDoc.data(),
                    timestamp: updateDoc.data().timestamp?.toDate() || new Date(),
                  })) as VerificationStatusUpdate[];

                  setStatusUpdates(updates);
                  
                  // Check for unread updates (within last 24 hours)
                  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  const recentUpdates = updates.filter(update => 
                    update.timestamp > oneDayAgo
                  );
                  setHasUnreadUpdates(recentUpdates.length > 0);
                },
                (error) => {
                  console.error('Error listening to status updates:', error);
                  setError('Failed to load status updates');
                }
              );
            } else {
              setProfessionalData(null);
              setStatusUpdates([]);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to professional data:', error);
            setError('Failed to load professional data');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setError('Failed to initialize status tracking');
        setLoading(false);
      }
    };

    setupListeners();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeProfessional) unsubscribeProfessional();
      if (unsubscribeUpdates) unsubscribeUpdates();
    };
  }, [currentUser]);

  /**
   * Get current verification status with user-friendly message
   */
  const getCurrentStatus = () => {
    if (!professionalData) {
      return {
        status: 'not_registered',
        message: 'Not registered as medical professional',
        color: '#6C757D',
        icon: 'person-outline'
      };
    }

    const { verificationStatus } = professionalData;

    if (verificationStatus.isVerified) {
      return {
        status: 'verified',
        message: 'Verified Medical Professional',
        color: '#28A745',
        icon: 'shield-checkmark',
        verifiedAt: verificationStatus.verifiedAt,
        verifiedBy: verificationStatus.verifiedBy
      };
    }

    // Check latest status update for more detailed status
    const latestUpdate = statusUpdates[0];
    
    if (latestUpdate) {
      switch (latestUpdate.status) {
        case 'under_review':
          return {
            status: 'under_review',
            message: 'Application Under Review',
            color: '#FFC107',
            icon: 'time-outline'
          };
        case 'rejected':
          return {
            status: 'rejected',
            message: 'Application Rejected',
            color: '#DC3545',
            icon: 'close-circle-outline'
          };
        default:
          return {
            status: 'pending',
            message: 'Verification Pending',
            color: '#6C757D',
            icon: 'hourglass-outline'
          };
      }
    }

    return {
      status: 'pending',
      message: 'Verification Pending',
      color: '#6C757D',
      icon: 'hourglass-outline'
    };
  };

  /**
   * Get recent status updates
   */
  const getRecentUpdates = (limit: number = 5) => {
    return statusUpdates.slice(0, limit);
  };

  /**
   * Mark updates as read (clear unread indicator)
   */
  const markUpdatesAsRead = () => {
    setHasUnreadUpdates(false);
  };

  /**
   * Get status timeline for display
   */
  const getStatusTimeline = () => {
    const timeline: Array<{
      date: Date;
      status: string;
      message: string;
      adminName?: string;
      notes?: string;
    }> = [];

    // Add creation date
    if (professionalData?.createdAt) {
      timeline.push({
        date: professionalData.createdAt,
        status: 'registered',
        message: 'Medical professional registration submitted'
      });
    }

    // Add status updates
    statusUpdates.forEach(update => {
      timeline.push({
        date: update.timestamp,
        status: update.status,
        message: update.message,
        adminName: update.adminName,
        notes: update.notes
      });
    });

    // Sort by date (newest first)
    return timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  /**
   * Check if user can reapply (if rejected)
   */
  const canReapply = () => {
    const currentStatus = getCurrentStatus();
    return currentStatus.status === 'rejected';
  };

  return {
    // Data
    professionalData,
    statusUpdates,
    
    // Status
    loading,
    error,
    hasUnreadUpdates,
    
    // Computed values
    currentStatus: getCurrentStatus(),
    recentUpdates: getRecentUpdates(),
    statusTimeline: getStatusTimeline(),
    canReapply: canReapply(),
    
    // Actions
    markUpdatesAsRead,
  };
};

export default useVerificationStatusTracking;