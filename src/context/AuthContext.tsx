import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';
import { auth } from '../config/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import authService from '../services/authService';
import { 
  storeAuthData, 
  getStoredUser, 
  clearAuthData, 
  isSessionValid 
} from '../utils/authPersistence';

// Auth Context Types
export interface AuthContextType {
  // Current user state
  user: User | null;
  firebaseUser: FirebaseUser | null;
  
  // Loading states
  loading: boolean;
  initializing: boolean;
  
  // Auth operations
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userType: 'individual' | 'medical_professional', additionalData?: any) => Promise<void>;
  logout: () => Promise<void>;
  
  // State management
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Initialize authentication state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have valid stored session
        const sessionValid = await isSessionValid();
        if (sessionValid) {
          const storedUser = await getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            console.log('Restored user from storage:', storedUser.email);
          }
        } else {
          // Clear invalid session data
          await clearAuthData();
          console.log('Cleared invalid session data');
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
      }
    };

    initializeAuth();
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user profile from Firestore using authService
        try {
          const appUser = await authService.getUserProfile(firebaseUser.uid);
          setUser(appUser);
          
          // Store authentication data for persistence
          if (appUser) {
            await storeAuthData(appUser);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
          // Clear stored data if there's an error
          await clearAuthData();
        }
      } else {
        setUser(null);
        // Clear stored data when user logs out
        await clearAuthData();
      }
      
      if (initializing) {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, [initializing]);

  // Login function - implemented with authService
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      setUser(user);
      
      // Store authentication data for persistence
      if (user) {
        await storeAuthData(user);
        console.log('User logged in and data stored:', user.email);
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function - implemented with authService
  const register = async (email: string, password: string, userType: 'individual' | 'medical_professional', additionalData?: any): Promise<void> => {
    setLoading(true);
    try {
      const user = await authService.register(email, password, userType, additionalData);
      setUser(user);
      
      // Store authentication data for persistence
      if (user) {
        await storeAuthData(user);
        console.log('User registered and data stored:', user.email);
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function - implemented with authService
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      
      // Clear stored authentication data
      await clearAuthData();
      console.log('User logged out and stored data cleared');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data from Firestore
  const refreshUser = async (): Promise<void> => {
    if (firebaseUser) {
      try {
        const updatedUser = await authService.getUserProfile(firebaseUser.uid);
        setUser(updatedUser);
        
        // Update stored data with refreshed user info
        if (updatedUser) {
          await storeAuthData(updatedUser);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  // Enhanced setUser function that also updates storage
  const setUserWithStorage = async (user: User | null): Promise<void> => {
    setUser(user);
    
    if (user) {
      try {
        await storeAuthData(user);
      } catch (error) {
        console.error('Error storing user data:', error);
      }
    } else {
      try {
        await clearAuthData();
      } catch (error) {
        console.error('Error clearing user data:', error);
      }
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    initializing,
    login,
    register,
    logout,
    setUser: setUserWithStorage,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export context for testing purposes
export { AuthContext };