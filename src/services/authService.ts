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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        throw new Error('User profile not found. Please contact support.');
      }
      
      return userProfile;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
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
      // Validate medical professional registration
      if (userType === 'medical_professional') {
        if (!additionalData?.licenseNumber || !additionalData?.name) {
          throw new Error('License number and name are required for medical professional registration.');
        }
        
        // Check if license number is already registered
        const existingProfessional = await this.checkLicenseNumberExists(additionalData.licenseNumber);
        if (existingProfessional) {
          throw new Error('This license number is already registered.');
        }
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name if provided
      if (additionalData?.name) {
        await updateProfile(firebaseUser, {
          displayName: additionalData.name
        });
      }

      // Create user profile in Firestore
      const userProfile = await this.createUserProfile(firebaseUser, userType, additionalData);
      
      return userProfile;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(this.getAuthErrorMessage(error.code) || error.message);
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
        isVerified: userData.isVerified || false
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
      const userProfile: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        userType,
        isVerified: false
      };

      // Create user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: firebaseUser.email,
        userType,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // If medical professional, create medical professional document
      if (userType === 'medical_professional' && additionalData) {
        const medicalProfessional: Omit<MedicalProfessional, 'id'> = {
          userId: firebaseUser.uid,
          name: additionalData.name,
          email: firebaseUser.email || '',
          licenseNumber: additionalData.licenseNumber,
          isVerified: false,
          createdAt: new Date()
        };

        await setDoc(doc(db, 'medical_professionals', firebaseUser.uid), medicalProfessional);
      }

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
        collection(db, 'medical_professionals'), 
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
}

// Export singleton instance
const authService = new AuthServiceImpl();
export default authService;