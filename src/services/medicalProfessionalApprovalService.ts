import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { MedicalProfessional } from '../types';
import { VerificationStatusUpdate } from '../hooks/useVerificationStatusTracking';

/**
 * Medical Professional Approval Service
 * Handles the manual approval/rejection system for medical professional registrations
 */

// Approval action types
export type ApprovalAction = 'approve' | 'reject' | 'pending';

// Approval notification types
export interface ApprovalNotification {
  id?: string;
  professionalId: string;
  professionalEmail: string;
  professionalName: string;
  action: ApprovalAction;
  adminId: string;
  adminName: string;
  notes?: string;
  timestamp: Date;
  emailSent: boolean;
  read: boolean;
}

// Approval history entry
export interface ApprovalHistory {
  id?: string;
  professionalId: string;
  action: ApprovalAction;
  adminId: string;
  adminName: string;
  notes?: string;
  timestamp: Date;
  previousStatus?: boolean;
  newStatus: boolean;
}

/**
 * Medical Professional Approval Service Class
 */
export class MedicalProfessionalApprovalService {

  /**
   * Get all pending medical professionals awaiting approval
   */
  static async getPendingProfessionals(): Promise<MedicalProfessional[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('userType', '==', 'medical_professional'),
        where('isVerified', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const professionals: MedicalProfessional[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        professionals.push({
          id: doc.id,
          userId: doc.id, // Using document ID as userId
          personalInfo: {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber
          },
          professionalInfo: {
            licenseNumber: data.licenseNumber || '',
            licenseState: data.licenseState,
            licenseExpiryDate: data.licenseExpiryDate?.toDate(),
            specialty: data.specialization || data.specialty,
            hospitalAffiliation: data.institution || data.hospitalAffiliation,
            yearsOfExperience: data.yearsOfExperience
          },
          verificationStatus: {
            isVerified: data.isVerified || false,
            verifiedAt: data.verifiedAt?.toDate(),
            verifiedBy: data.verifiedBy,
            verificationNotes: data.rejectionReason || data.verificationNotes
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      return professionals;
    } catch (error) {
      console.error('Error fetching pending professionals:', error);
      throw new Error('Failed to fetch pending medical professionals');
    }
  }

  /**
   * Get all verified medical professionals
   */
  static async getVerifiedProfessionals(): Promise<MedicalProfessional[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('userType', '==', 'medical_professional'),
        where('isVerified', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const professionals: MedicalProfessional[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        professionals.push({
          id: doc.id,
          userId: doc.id, // Using document ID as userId
          personalInfo: {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber
          },
          professionalInfo: {
            licenseNumber: data.licenseNumber || '',
            licenseState: data.licenseState,
            licenseExpiryDate: data.licenseExpiryDate?.toDate(),
            specialty: data.specialization || data.specialty,
            hospitalAffiliation: data.institution || data.hospitalAffiliation,
            yearsOfExperience: data.yearsOfExperience
          },
          verificationStatus: {
            isVerified: data.isVerified || false,
            verifiedAt: data.verifiedAt?.toDate(),
            verifiedBy: data.verifiedBy,
            verificationNotes: data.rejectionReason || data.verificationNotes
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      return professionals;
    } catch (error) {
      console.error('Error fetching verified professionals:', error);
      throw new Error('Failed to fetch verified medical professionals');
    }
  }

  /**
   * Get all medical professionals (pending and verified)
   */
  static async getAllProfessionals(): Promise<MedicalProfessional[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('userType', '==', 'medical_professional'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const professionals: MedicalProfessional[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        professionals.push({
          id: doc.id,
          userId: doc.id, // Using document ID as userId
          personalInfo: {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber
          },
          professionalInfo: {
            licenseNumber: data.licenseNumber || '',
            licenseState: data.licenseState,
            licenseExpiryDate: data.licenseExpiryDate?.toDate(),
            specialty: data.specialization || data.specialty,
            hospitalAffiliation: data.institution || data.hospitalAffiliation,
            yearsOfExperience: data.yearsOfExperience
          },
          verificationStatus: {
            isVerified: data.isVerified || false,
            verifiedAt: data.verifiedAt?.toDate(),
            verifiedBy: data.verifiedBy,
            verificationNotes: data.rejectionReason || data.verificationNotes
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      return professionals;
    } catch (error) {
      console.error('Error fetching all professionals:', error);
      throw new Error('Failed to fetch medical professionals');
    }
  }

  /**
   * Get a medical professional by ID
   */
  static async getProfessionalById(professionalId: string): Promise<MedicalProfessional | null> {
    try {
      const docRef = doc(db, 'users', professionalId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Check if this user is a medical professional
      if (data.userType !== 'medical_professional') {
        return null;
      }

      return {
        id: docSnap.id,
        userId: docSnap.id,
        personalInfo: {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber
        },
        professionalInfo: {
          licenseNumber: data.licenseNumber || '',
          licenseState: data.licenseState,
          licenseExpiryDate: data.licenseExpiryDate?.toDate(),
          specialty: data.specialization || data.specialty,
          hospitalAffiliation: data.institution || data.hospitalAffiliation,
          yearsOfExperience: data.yearsOfExperience
        },
        verificationStatus: {
          isVerified: data.isVerified || false,
          verifiedAt: data.verifiedAt?.toDate(),
          verifiedBy: data.verifiedBy,
          verificationNotes: data.rejectionReason || data.verificationNotes
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting professional by ID:', error);
      throw new Error('Failed to retrieve medical professional');
    }
  }

  /**
   * Approve a medical professional
   */
  static async approveProfessional(
    professionalId: string,
    adminId: string,
    adminName: string,
    notes?: string
  ): Promise<void> {
    try {
      // Get the professional's current data
      const professionalRef = doc(db, 'users', professionalId);
      const professionalSnap = await getDoc(professionalRef);
      
      if (!professionalSnap.exists()) {
        throw new Error('Medical professional not found');
      }
      
      const professionalData = professionalSnap.data();
      const previousStatus = professionalData.isVerified;

      // Update professional verification status
      await updateDoc(professionalRef, {
        isVerified: true,
        verifiedAt: serverTimestamp(),
        verifiedBy: adminId,
        verificationNotes: notes || '',
        updatedAt: serverTimestamp()
      });

      // Create approval history entry
      await this.createApprovalHistory({
        professionalId,
        action: 'approve',
        adminId,
        adminName,
        notes,
        timestamp: new Date(),
        previousStatus,
        newStatus: true
      });

      // Create notification
      await this.createApprovalNotification({
        professionalId,
        professionalEmail: professionalData.email,
        professionalName: `${professionalData.firstName} ${professionalData.lastName}`,
        action: 'approve',
        adminId,
        adminName,
        notes,
        timestamp: new Date(),
        emailSent: false,
        read: false
      });

      // Create verification status update
      await this.createVerificationStatusUpdate({
        professionalId,
        status: 'approved',
        message: notes || 'Your medical professional application has been approved',
        timestamp: new Date(),
        actionBy: adminId,
        actionByName: adminName,
        read: false
      });

      // TODO: Send approval email notification
      await this.sendApprovalEmail(
        professionalData.email,
        `${professionalData.firstName} ${professionalData.lastName}`,
        'approve',
        notes
      );

      console.log(`Medical professional ${professionalId} approved by ${adminName}`);
    } catch (error) {
      console.error('Error approving professional:', error);
      throw new Error('Failed to approve medical professional');
    }
  }

  /**
   * Reject a medical professional application
   */
  static async rejectProfessional(
    professionalId: string,
    adminId: string,
    adminName: string,
    rejectionReason: string
  ): Promise<void> {
    try {
      // Get the professional's current data
      const professionalRef = doc(db, 'users', professionalId);
      const professionalSnap = await getDoc(professionalRef);
      
      if (!professionalSnap.exists()) {
        throw new Error('Medical professional not found');
      }
      
      const professionalData = professionalSnap.data();
      const previousStatus = professionalData.isVerified;

      // Update professional with rejection status
      await updateDoc(professionalRef, {
        isVerified: false,
        rejectedAt: serverTimestamp(),
        rejectedBy: adminId,
        rejectionReason: rejectionReason,
        verificationNotes: rejectionReason,
        updatedAt: serverTimestamp()
      });

      // Create approval history entry
      await this.createApprovalHistory({
        professionalId,
        action: 'reject',
        adminId,
        adminName,
        notes: rejectionReason,
        timestamp: new Date(),
        previousStatus,
        newStatus: false
      });

      // Create notification
      await this.createApprovalNotification({
        professionalId,
        professionalEmail: professionalData.email,
        professionalName: `${professionalData.firstName} ${professionalData.lastName}`,
        action: 'reject',
        adminId,
        adminName,
        notes: rejectionReason,
        timestamp: new Date(),
        emailSent: false,
        read: false
      });

      // Create verification status update
      await this.createVerificationStatusUpdate({
        professionalId,
        status: 'rejected',
        message: rejectionReason,
        timestamp: new Date(),
        actionBy: adminId,
        actionByName: adminName,
        read: false
      });

      // TODO: Send rejection email notification
      await this.sendApprovalEmail(
        professionalData.email,
        `${professionalData.firstName} ${professionalData.lastName}`,
        'reject',
        rejectionReason
      );

      console.log(`Medical professional ${professionalId} rejected by ${adminName}: ${rejectionReason}`);
    } catch (error) {
      console.error('Error rejecting professional:', error);
      throw new Error('Failed to reject medical professional');
    }
  }

  /**
   * Revoke verification for a previously approved professional
   */
  static async revokeProfessional(
    professionalId: string,
    adminId: string,
    adminName: string,
    revocationReason: string
  ): Promise<void> {
    try {
      // Get the professional's current data
      const professionalRef = doc(db, 'users', professionalId);
      const professionalSnap = await getDoc(professionalRef);
      
      if (!professionalSnap.exists()) {
        throw new Error('Medical professional not found');
      }
      
      const professionalData = professionalSnap.data();
      const previousStatus = professionalData.isVerified;

      // Update professional with revocation
      await updateDoc(professionalRef, {
        isVerified: false,
        revokedAt: serverTimestamp(),
        revokedBy: adminId,
        revocationReason: revocationReason,
        verificationNotes: revocationReason,
        updatedAt: serverTimestamp()
      });

      // Create approval history entry
      await this.createApprovalHistory({
        professionalId,
        action: 'reject', // Using reject for revocation in history
        adminId,
        adminName,
        notes: `REVOKED: ${revocationReason}`,
        timestamp: new Date(),
        previousStatus,
        newStatus: false
      });

      // Create notification
      await this.createApprovalNotification({
        professionalId,
        professionalEmail: professionalData.email,
        professionalName: `${professionalData.firstName} ${professionalData.lastName}`,
        action: 'reject',
        adminId,
        adminName,
        notes: `Verification revoked: ${revocationReason}`,
        timestamp: new Date(),
        emailSent: false,
        read: false
      });

      // Create verification status update
      await this.createVerificationStatusUpdate({
        professionalId,
        status: 'rejected',
        message: `Verification revoked: ${revocationReason}`,
        timestamp: new Date(),
        actionBy: adminId,
        actionByName: adminName,
        read: false
      });

      console.log(`Medical professional ${professionalId} revoked by ${adminName}: ${revocationReason}`);
    } catch (error) {
      console.error('Error revoking professional:', error);
      throw new Error('Failed to revoke medical professional verification');
    }
  }

  /**
   * Get approval history for a specific professional
   */
  static async getApprovalHistory(professionalId: string): Promise<ApprovalHistory[]> {
    try {
      const q = query(
        collection(db, 'approval_history'),
        where('professionalId', '==', professionalId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const history: ApprovalHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        } as ApprovalHistory);
      });
      
      return history;
    } catch (error) {
      console.error('Error fetching approval history:', error);
      throw new Error('Failed to fetch approval history');
    }
  }

  /**
   * Get approval notifications for admin dashboard
   */
  static async getApprovalNotifications(
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<ApprovalNotification[]> {
    try {
      let q = query(
        collection(db, 'approval_notifications'),
        orderBy('timestamp', 'desc')
      );

      if (unreadOnly) {
        q = query(
          collection(db, 'approval_notifications'),
          where('read', '==', false),
          orderBy('timestamp', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const notifications: ApprovalNotification[] = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        } as ApprovalNotification);
      });
      
      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error fetching approval notifications:', error);
      throw new Error('Failed to fetch approval notifications');
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'approval_notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Private method to create approval history entry
   */
  private static async createApprovalHistory(historyData: Omit<ApprovalHistory, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'approval_history'), {
        ...historyData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating approval history:', error);
      throw new Error('Failed to create approval history');
    }
  }

  /**
   * Private method to create approval notification
   */
  private static async createApprovalNotification(notificationData: Omit<ApprovalNotification, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'approval_notifications'), {
        ...notificationData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating approval notification:', error);
      throw new Error('Failed to create approval notification');
    }
  }

  /**
   * Private method to create verification status update
   */
  private static async createVerificationStatusUpdate(updateData: {
    professionalId: string;
    status: 'pending' | 'approved' | 'rejected' | 'under_review';
    message: string;
    timestamp: Date;
    actionBy?: string;
    actionByName?: string;
    read: boolean;
  }): Promise<void> {
    try {
      await addDoc(collection(db, 'verification_status_updates'), {
        ...updateData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating verification status update:', error);
      throw new Error('Failed to create verification status update');
    }
  }

  /**
   * Private method to send approval/rejection email
   * TODO: Integrate with email service (SendGrid, AWS SES, etc.)
   */
  private static async sendApprovalEmail(
    email: string,
    name: string,
    action: ApprovalAction,
    notes?: string
  ): Promise<void> {
    try {
      // TODO: Implement actual email sending
      console.log(`Sending ${action} email to ${email} for ${name}`);
      console.log(`Email content: ${notes || 'No additional notes'}`);
      
      // Placeholder for email service integration
      // Example with SendGrid or similar service:
      /*
      const msg = {
        to: email,
        from: 'noreply@lifetag.app',
        subject: `LifeTag Medical Professional ${action === 'approve' ? 'Approval' : 'Application Update'}`,
        html: this.generateEmailTemplate(name, action, notes)
      };
      
      await sgMail.send(msg);
      */
      
    } catch (error) {
      console.error('Error sending approval email:', error);
      // Don't throw error for email failure - approval should still succeed
    }
  }

  /**
   * Generate email template for approval/rejection notifications
   */
  private static generateEmailTemplate(
    name: string,
    action: ApprovalAction,
    notes?: string
  ): string {
    const isApproval = action === 'approve';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: ${isApproval ? '#28a745' : '#dc3545'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LifeTag Medical Professional ${isApproval ? 'Approval' : 'Application Update'}</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          
          ${isApproval 
            ? `<p>Congratulations! Your LifeTag medical professional application has been <strong>approved</strong>.</p>
               <p>You now have verified access to the LifeTag emergency medical information system and can scan patient QR codes to access critical medical information.</p>`
            : `<p>We regret to inform you that your LifeTag medical professional application has been <strong>rejected</strong>.</p>
               <p>Please review the feedback below and feel free to reapply if you can address the concerns.</p>`
          }
          
          ${notes ? `
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid ${isApproval ? '#28a745' : '#dc3545'}; margin: 20px 0;">
              <h4>Additional Notes:</h4>
              <p>${notes}</p>
            </div>
          ` : ''}
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The LifeTag Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from LifeTag. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get verification statistics for admin dashboard
   */
  static async getVerificationStats(): Promise<{
    pending: number;
    verified: number;
    total: number;
    recentApprovals: number;
    recentRejections: number;
  }> {
    try {
      const [pendingProfs, verifiedProfs, allProfs] = await Promise.all([
        this.getPendingProfessionals(),
        this.getVerifiedProfessionals(),
        this.getAllProfessionals()
      ]);

      // Get recent approvals (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentHistory = await this.getRecentApprovalHistory(sevenDaysAgo);
      const recentApprovals = recentHistory.filter(h => h.action === 'approve').length;
      const recentRejections = recentHistory.filter(h => h.action === 'reject').length;

      return {
        pending: pendingProfs.length,
        verified: verifiedProfs.length,
        total: allProfs.length,
        recentApprovals,
        recentRejections
      };
    } catch (error) {
      console.error('Error fetching verification stats:', error);
      throw new Error('Failed to fetch verification statistics');
    }
  }

  /**
   * Get recent approval history for statistics
   */
  private static async getRecentApprovalHistory(since: Date): Promise<ApprovalHistory[]> {
    try {
      const q = query(
        collection(db, 'approval_history'),
        where('timestamp', '>=', since),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const history: ApprovalHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        } as ApprovalHistory);
      });
      
      return history;
    } catch (error) {
      console.error('Error fetching recent approval history:', error);
      return [];
    }
  }
}

export default MedicalProfessionalApprovalService;