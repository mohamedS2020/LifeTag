import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MedicalProfessionalDashboard } from '../components/common';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

type MedicalProfessionalScreenNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Medical Professional Screen
 * 
 * Main navigation screen for verified medical professionals.
 * Provides access to QR scanning, patient profile access, and professional tools.
 * Task 7.5: Add medical professional navigation flow and dashboard
 */
const MedicalProfessionalScreen: React.FC = () => {
  const navigation = useNavigation<MedicalProfessionalScreenNavigationProp>();

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
    // Error handling can be enhanced with toast notifications or alerts
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MedicalProfessionalDashboard
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});

export default MedicalProfessionalScreen;