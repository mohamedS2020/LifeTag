/**
 * QR Display Screen
 * Screen wrapper for QRDisplay component that loads user profile and displays emergency QR code
 * Task 7.4: Implement navigation between profile creation, QR display, scanning, and history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { QRDisplay } from '../components/QR';
import { LoadingOverlay } from '../components/common';
import { profileService } from '../services';

interface QRDisplayScreenProps {
  navigation: any;
  route?: {
    params?: {
      emergencyMode?: boolean;
      profileId?: string; // For medical professionals viewing other profiles
    };
  };
}

const QRDisplayScreen: React.FC<QRDisplayScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emergencyMode = route?.params?.emergencyMode || false;
  const profileId = route?.params?.profileId;

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [user?.id, profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use provided profileId or current user's ID
      const targetUserId = profileId || user?.id;
      
      if (!targetUserId) {
        setError('No user ID available');
        return;
      }

      const profileResponse = await profileService.getProfile(targetUserId);

      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data);
      } else {
        setError(profileResponse.error?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error loading profile for QR display:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    Alert.alert(
      'QR Code Error',
      errorMessage,
      [
        { text: 'Retry', onPress: loadProfile },
        { text: 'Close', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    navigation.navigate('ProfileForm');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible={true} message="Loading QR code..." />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#F44336" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Code</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>Unable to Display QR Code</Text>
          <Text style={styles.errorMessage}>
            {error || 'Profile data is required to generate your emergency QR code.'}
          </Text>
          
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            {!profileId && ( // Only show edit button for current user
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Ionicons name="person-circle" size={20} color="#2196F3" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {emergencyMode ? 'Emergency QR Code' : 'My QR Code'}
        </Text>
        <TouchableOpacity style={styles.headerEditButton} onPress={handleEditProfile}>
          <Ionicons name="create" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <QRDisplay
        profile={profile}
        onError={handleError}
        emergencyMode={emergencyMode}
        fullScreen={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerEditButton: {
    padding: 8,
  },
  placeholder: {
    width: 40, // Same width as close button to center title
  },
  
  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorActions: {
    flexDirection: 'column',
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default QRDisplayScreen;