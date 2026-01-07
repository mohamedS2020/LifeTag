import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { User, MedicalProfessional } from '../types';

export interface AuthService {
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, userType: 'individual' | 'medical_professional', additionalData?: any) => Promise<User>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  getUserProfile: (userId: string) => Promise<User | null>;
  createUserProfile: (firebaseUser: FirebaseUser, userType: 'individual' | 'medical_professional', additionalData?: any) => Promise<User>;
}

class AuthServiceImpl implements AuthService {
  
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      console.log('🔐 Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase auth successful');
      
      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        const err: any = new Error('User profile not found. Please contact support.');
        err.code = 'auth/profile-not-found';
        throw err;
      }
      
      return userProfile;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // TEMPORARY: Show actual error for debugging
      const code = error?.code || 'auth/unknown-error';
      const actualMessage = error?.message || 'Unknown error';
      const err: any = new Error(`${this.getAuthErrorMessage(code)} (Debug: ${actualMessage})`);
      err.code = code;
      throw err;
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string, 
    password: string, 
    userType: 'individual' | 'medical_professional',
    additionalData?: any
  ): Promise<User> {
    try {
      // Create Firebase user first
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Now check for duplicate license number (after authentication)
      if (userType === 'medical_professional') {
        if (!additionalData?.licenseNumber || !additionalData?.fullName) {
          // Delete the created user if validation fails
          await firebaseUser.delete();
          throw new Error('License number and name are required for medical professional registration.');
        }
        
        // Check if license number is already registered (now we're authenticated)
        const existingProfessional = await this.checkLicenseNumberExists(additionalData.licenseNumber);
        if (existingProfessional) {
          // Delete the created user if license already exists
          await firebaseUser.delete();
          throw new Error('This license number is already registered.');
        }
      }

      // Update display name if provided
      if (additionalData?.fullName) {
        await updateProfile(firebaseUser, {
          displayName: additionalData.fullName
        });
      }

      // Create user profile in Firestore
      const userProfile = await this.createUserProfile(firebaseUser, userType, additionalData);
      
      return userProfile;
    } catch (error: any) {
      console.error('Registration error:', error);
      const code = error?.code || 'auth/unknown-error';
      const err: any = new Error(this.getAuthErrorMessage(code) || error.message);
      err.code = code;
      throw err;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout. Please try again.');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        return null;
      }
      
      return await this.getUserProfile(firebaseUser.uid);
    } catch (error: any) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return {
        id: userId,
        email: userData.email,
        userType: userData.userType,
        isVerified: userData.isVerified || false,
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date()
      };
    } catch (error: any) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Create user profile in Firestore
   */
  async createUserProfile(
    firebaseUser: FirebaseUser, 
    userType: 'individual' | 'medical_professional',
    additionalData?: any
  ): Promise<User> {
    try {
      const now = new Date();
      const userProfile: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        userType,
        isVerified: false,
        createdAt: now,
        updatedAt: now
      };

      // Create user document with all necessary fields
      const userDoc: any = {
        email: firebaseUser.email,
        userType,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add firstName and lastName for ALL user types if provided
      if (additionalData?.firstName) {
        userDoc.firstName = additionalData.firstName;
      }
      if (additionalData?.lastName) {
        userDoc.lastName = additionalData.lastName;
      }
      // Also handle fullName for backwards compatibility
      if (!userDoc.firstName && additionalData?.fullName) {
        userDoc.firstName = additionalData.fullName.split(' ')[0] || '';
        userDoc.lastName = additionalData.fullName.split(' ').slice(1).join(' ') || '';
      }

      // Add medical professional specific fields if applicable
      if (userType === 'medical_professional' && additionalData) {
        userDoc.licenseNumber = additionalData.licenseNumber;
        userDoc.specialization = additionalData.specialty;
        userDoc.institution = additionalData.institution;
        // Only add phoneNumber if it exists
        if (additionalData.phoneNumber) {
          userDoc.phoneNumber = additionalData.phoneNumber;
        }
        // Only add other optional fields if they exist
        if (additionalData.licenseState) {
          userDoc.licenseState = additionalData.licenseState;
        }
        if (additionalData.hospitalAffiliation) {
          userDoc.hospitalAffiliation = additionalData.hospitalAffiliation;
        }
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);

      return userProfile;
    } catch (error: any) {
      console.error('Create user profile error:', error);
      throw new Error('Failed to create user profile. Please try again.');
    }
  }

  /**
   * Check if license number already exists
   */
  private async checkLicenseNumberExists(licenseNumber: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'users'), 
        where('userType', '==', 'medical_professional'),
        where('licenseNumber', '==', licenseNumber)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error: any) {
      console.error('Check license number error:', error);
      return false;
    }
  }

  /**
   * Convert Firebase auth error codes to user-friendly messages
   */
  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  /**
   * Get user basic info (firstName, lastName) from users collection
   * This is useful when a user hasn't created a profile yet
   */
  async getUserBasicInfo(userId: string): Promise<{ firstName?: string; lastName?: string } | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return {
        firstName: userData.firstName,
        lastName: userData.lastName
      };
    } catch (error: any) {
      console.error('Get user basic info error:', error);
      return null;
    }
  }

  /**
   * Update user basic info (firstName, lastName) in users collection
   * Called when user updates their profile to keep data in sync
   */
  async updateUserBasicInfo(userId: string, firstName: string, lastName: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        firstName,
        lastName,
        updatedAt: new Date()
      });
    } catch (error: any) {
      console.error('Update user basic info error:', error);
      // Don't throw - this is a non-critical sync operation
    }
  }
}

// Export singleton instance
const authService = new AuthServiceImpl();
export default authService;