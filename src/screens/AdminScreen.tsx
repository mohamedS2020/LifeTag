import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AdminDashboard } from '../components/common';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../theme';

type AdminScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Admin Screen
 * 
 * Main navigation screen for admin users.
 * Provides access to medical professional verification, audit management, and system administration.
 */
const AdminScreen: React.FC = () => {
  const navigation = useNavigation<AdminScreenNavigationProp>();

  /**
   * Handle navigation to profile display
   */
  const handleNavigateToProfile = (profileId: string) => {
    navigation.navigate('ProfileDisplay', {
      profileId,
      isViewingOtherProfile: true,
      accessType: 'admin',
      scannedBy: 'admin_dashboard'
    });
  };

  /**
   * Handle error display
   */
  const handleError = (error: string) => {
    console.error('Admin Screen Error:', error);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AdminDashboard
          onNavigateToProfile={handleNavigateToProfile}
          onError={handleError}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
});

export default AdminScreen;