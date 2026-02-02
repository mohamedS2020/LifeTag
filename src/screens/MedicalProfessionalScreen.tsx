import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MedicalProfessionalDashboard } from '../components/common';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme';

type MedicalProfessionalScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Medical Professional Screen
 * 
 * Main navigation screen for verified medical professionals.
 * Provides access to QR scanning, patient profile access, and professional tools.
 * Task 7.5: Add medical professional navigation flow and dashboard
 */
const MedicalProfessionalScreen: React.FC = () => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const navigation = useNavigation<MedicalProfessionalScreenNavigationProp>();

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
      accessType: 'medical_professional',
      scannedBy: 'medical_professional_dashboard'
    });
  };

  /**
   * Handle error display
   */
  const handleError = (error: string) => {
    console.error('Medical Professional Screen Error:', error);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <MedicalProfessionalDashboard
          onNavigateToProfile={handleNavigateToProfile}
          onError={handleError}
        />
      </View>
    </SafeAreaView>
  );
};

export default MedicalProfessionalScreen;