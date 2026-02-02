import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AdminDashboard } from '../components/common';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme';

type AdminScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Admin Screen
 * 
 * Main navigation screen for admin users.
 * Provides access to medical professional verification, audit management, and system administration.
 */
const AdminScreen: React.FC = () => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const navigation = useNavigation<AdminScreenNavigationProp>();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    content: {
      flex: 1,
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <AdminDashboard
          onNavigateToProfile={handleNavigateToProfile}
          onError={handleError}
        />
      </View>
    </SafeAreaView>
  );
};

export default AdminScreen;