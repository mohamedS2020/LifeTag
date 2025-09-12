import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import AuditLogViewer from '../components/Profile/AuditLogViewer';
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
  const finalProfileId = profileId || user?.id;
  const screenTitle = title || 'Profile Access History';

  const showInfoAlert = () => {
    Alert.alert(
      'About Access Logs',
      'This shows everyone who has accessed your medical profile information, including:\n\n' +
      '• QR code scans\n' +
      '• Emergency access\n' +
      '• Medical professional access\n' +
      '• Profile modifications\n\n' +
      'All access is logged for your security and privacy.',
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
          <Text style={styles.infoButtonText}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.description}>
        <Text style={styles.descriptionText}>
          View all access to your medical profile for transparency and security monitoring.
        </Text>
      </View>

      <AuditLogViewer 
        profileId={finalProfileId}
        showFilters={true}
        maxItems={200}
      />
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
  }
});

export default ProfileAccessHistoryScreen;