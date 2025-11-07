import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserAuditLogViewer } from '../components/Profile';
import { useAuth } from '../context/AuthContext';

interface ProfileAccessHistoryScreenProps {
  onBack?: () => void;
  profileId?: string;
  title?: string;
}

export const ProfileAccessHistoryScreen: React.FC<ProfileAccessHistoryScreenProps> = ({
  onBack,
  profileId,
  title
}) => {
  const { user } = useAuth();
  const finalProfileId = profileId || user?.profile?.id || user?.id;
  const screenTitle = title || 'Profile Access History';

  const showInfoAlert = () => {
    Alert.alert(
      'About Access Logs',
      'This shows everyone who has accessed your medical profile information, including:\n\n' +
      '• QR code scans by medical professionals 👨‍⚕️\n' +
      '• Emergency access situations 🚨\n' +
      '• Full profile views 👁️\n' +
      '• Profile modifications ✏️\n\n' +
      'Medical professionals are marked with a green badge. All access is logged for your security and privacy.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack || (() => console.log('Back pressed'))}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>{screenTitle}</Text>
        
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={showInfoAlert}
        >
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {finalProfileId ? (
        <UserAuditLogViewer profileId={finalProfileId} />
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#DC3545" />
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorText}>
            Unable to load profile access history.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  backButton: {
    padding: 5
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center'
  },
  infoButton: {
    padding: 5
  },
  infoButtonText: {
    fontSize: 18
  },
  description: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  descriptionText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#DC3545',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProfileAccessHistoryScreen;