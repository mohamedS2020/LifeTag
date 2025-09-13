import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase.config';
import { User } from '../types';

/**
 * Admin Management Service
 * Handles admin user creation, management, and system administration
 */
export interface AdminCreationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  permissions?: string[];
}

export interface AdminUser {
  id: string;
  email: string;
  userType: 'admin';
  isVerified: boolean;
  firstName: string;
  lastName: string;
  role?: string;
  permissions?: string[];
  createdBy?: string;
  createdAt?: Date;
  isComplete: boolean;
  lastLoginAt?: Date;
}

export class AdminManagementService {
  
  /**
   * Create a new admin user
   * Only existing admins can create new admins
   */
  static async createAdmin(adminData: AdminCreationData, createdBy: string): Promise<AdminUser> {
    try {
      // Verify the creator is an admin
      const creatorDoc = await getDoc(doc(db, 'users', createdBy));
      if (!creatorDoc.exists() || creatorDoc.data().userType !== 'admin') {
        throw new Error('Only administrators can create admin users');
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        adminData.email, 
        adminData.password
      );

      const firebaseUser = userCredential.user;

      // Create admin user document
      const newAdmin: AdminUser = {
        id: firebaseUser.uid,
        email: adminData.email,
        userType: 'admin',
        isVerified: true, // Admins are always verified
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: adminData.role || 'admin',
        permissions: adminData.permissions || ['users', 'medical_professionals', 'audit_logs', 'system'],
        createdBy: createdBy,
        createdAt: new Date(),
        isComplete: true,
        lastLoginAt: new Date()
      };

      // Save to Firestore (convert to plain object)
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...newAdmin,
        createdAt: serverTimestamp()
      });

      console.log('Admin created successfully:', firebaseUser.uid);
      return newAdmin;

    } catch (error) {
      console.error('Error creating admin:', error);
      throw new Error(`Failed to create admin: ${error}`);
    }
  }

  /**
   * Get all admin users
   */
  static async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('userType', '==', 'admin'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const admins: AdminUser[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        admins.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
        } as AdminUser);
      });

      return admins;
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw new Error(`Failed to fetch admins: ${error}`);
    }
  }

  /**
   * Update admin permissions
   */
  static async updateAdminPermissions(adminId: string, permissions: string[], updatedBy: string): Promise<void> {
    try {
      // Verify the updater is an admin
      const updaterDoc = await getDoc(doc(db, 'users', updatedBy));
      if (!updaterDoc.exists() || updaterDoc.data().userType !== 'admin') {
        throw new Error('Only administrators can update admin permissions');
      }

      await updateDoc(doc(db, 'users', adminId), {
        permissions,
        updatedAt: serverTimestamp(),
        updatedBy
      });

      console.log('Admin permissions updated:', adminId);
    } catch (error) {
      console.error('Error updating admin permissions:', error);
      throw new Error(`Failed to update admin permissions: ${error}`);
    }
  }

  /**
   * Remove admin user (soft delete - change userType)
   */
  static async removeAdmin(adminId: string, removedBy: string): Promise<void> {
    try {
      // Verify the remover is an admin
      const removerDoc = await getDoc(doc(db, 'users', removedBy));
      if (!removerDoc.exists() || removerDoc.data().userType !== 'admin') {
        throw new Error('Only administrators can remove admin users');
      }

      // Prevent self-removal
      if (adminId === removedBy) {
        throw new Error('Administrators cannot remove themselves');
      }

      // Change userType instead of deleting to preserve audit trail
      await updateDoc(doc(db, 'users', adminId), {
        userType: 'former_admin',
        removedAt: serverTimestamp(),
        removedBy
      });

      console.log('Admin removed:', adminId);
    } catch (error) {
      console.error('Error removing admin:', error);
      throw new Error(`Failed to remove admin: ${error}`);
    }
  }

  /**
   * Get system statistics for admin dashboard
   */
  static async getSystemStats(): Promise<{
    totalUsers: number;
    totalMedicalProfessionals: number;
    pendingVerifications: number;
    totalAdmins: number;
  }> {
    try {
      const batch = [
        getDocs(query(collection(db, 'users'), where('userType', '==', 'individual'))),
        getDocs(query(collection(db, 'users'), where('userType', '==', 'medical_professional'))),
        getDocs(query(collection(db, 'users'), where('userType', '==', 'medical_professional'), where('isVerified', '==', false))),
        getDocs(query(collection(db, 'users'), where('userType', '==', 'admin')))
      ];

      const [individuals, medPros, pendingMedPros, admins] = await Promise.all(batch);

      return {
        totalUsers: individuals.size,
        totalMedicalProfessionals: medPros.size,
        pendingVerifications: pendingMedPros.size,
        totalAdmins: admins.size
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        totalUsers: 0,
        totalMedicalProfessionals: 0,
        pendingVerifications: 0,
        totalAdmins: 0
      };
    }
  }
}

export default AdminManagementService;