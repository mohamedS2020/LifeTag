/**
 * App Navigator
 * Handles authenticated and unauthenticated navigation flows
 * Task 7.2: Create AppNavigator with authenticated and unauthenticated flows
 */

import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen, RegisterScreen, MedicalProfessionalRegister } from '../components/Auth';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { HomeScreen, ProfileFormScreen, ProfileDisplayScreen, QRTabScreen, QRDisplayScreen, QRScannerScreen, EmergencyInfoScreen, VerificationStatusScreen, MedicalProfessionalScreen, AdminScreen, SettingsScreen, ProfileAccessHistoryScreen } from '../screens';
import AdminAuditLogsScreen from '../screens/AdminAuditLogsScreen';
import AdminAuditLogDetailScreen from '../screens/AdminAuditLogDetailScreen';
import { MedicalProfessionalDashboard } from '../components/common';
import { EmergencyQRData } from '../services/qrService';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, borderRadius } from '../theme';

// Dark Navigation Theme
const DarkNavigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary.main,
    background: colors.background.primary,
    card: colors.background.secondary,
    text: colors.text.primary,
    border: colors.border.default,
    notification: colors.status.error.main,
  },
};

// Type definitions for navigation
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Register: undefined;
  MedicalProfessionalRegister: undefined;
  QRDisplay: {
    profileId?: string;
  };
  QRScanner: {
    fromScreen?: string;
  };
  ProfileForm: {
    mode?: 'create' | 'edit';
    profileId?: string;
  };
  ProfileDisplay: {
    profileId?: string;
    isViewingOtherProfile?: boolean;
    accessType?: string;
    scannedBy?: string;
  };
  EmergencyInfoScreen: {
    emergencyData: EmergencyQRData;
    qrCodeString?: string;
    scannedBy?: string;
    medicalProfessionalAccess?: boolean;
  };
  ProfileAccessHistory: undefined;
  AdminAuditLogs: undefined;
  AdminAuditLogDetail: {
    logId: string;
    logData: any;
  };
};

// Tab Navigator Type Definitions
export type TabParamList = {
  Home: undefined;
  QR: undefined;
  MedPro: undefined; // Medical Professional tab
  Admin: undefined; // Admin tab
  Settings: undefined;
};

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Loading Screen Component
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.appTitle}>LifeTag</Text>
      <Text style={styles.appSubtitle}>Emergency Medical Information System</Text>
      <ActivityIndicator size="large" color={colors.primary.main} style={styles.spinner} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

// Temporary placeholder screen components for authenticated app
const PlaceholderScreen = ({ title }: { title: string }) => {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title}</Text>
      <Text style={styles.placeholderSubtext}>Coming soon in next tasks</Text>
    </View>
  );
};

// Separate components to avoid inline function warnings
const QRPlaceholderScreen = () => <PlaceholderScreen title="QR Scanner" />;

// Authenticated Tab Navigator with conditional medical professional and admin features
const AuthenticatedTabs: React.FC = () => {
  const { user } = useAuth();
  const isVerifiedMedicalProfessional = user?.userType === 'medical_professional' && user?.isVerified;
  const isAdmin = user?.userType === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'QR') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'MedPro') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
          height: 60,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          marginTop: 2,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background.primary,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.default,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          ...typography.h4,
          color: colors.text.primary,
        },
      })}
    >
      {/* Home and QR tabs - Hide for admin users */}
      {!isAdmin && (
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            tabBarLabel: 'Home',
            title: 'LifeTag'
          }}
        />
      )}
      {!isAdmin && (
        <Tab.Screen 
          name="QR" 
          component={QRTabScreen}
          options={{ 
            tabBarLabel: 'QR Code',
            title: 'QR Scanner'
          }}
        />
      )}
      
      {/* Medical Professional Tab - Only show for verified medical professionals */}
      {isVerifiedMedicalProfessional && (
        <Tab.Screen 
          name="MedPro" 
          component={MedicalProfessionalScreen}
          options={{ 
            tabBarLabel: 'Medical',
            title: 'Medical Professional Dashboard'
          }}
        />
      )}
      
      {/* Admin Tab - Only show for admin users */}
      {isAdmin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{ 
            tabBarLabel: 'Admin',
            title: 'Admin Dashboard'
          }}
        />
      )}
      
      {/* Settings tab - Hide for admin users */}
      {!isAdmin && (
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            tabBarLabel: 'Settings',
            title: 'Settings'
          }}
        />
      )}
    </Tab.Navigator>
  );
};

// Authenticated Stack Navigator (wraps tabs and modal screens)
const AuthenticatedStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={AuthenticatedTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="QRDisplay" 
        component={QRDisplayScreen as any}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="QRScanner" 
        component={QRScannerScreen as any}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="ProfileForm" 
        component={ProfileFormScreen as any}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="ProfileDisplay" 
        component={ProfileDisplayScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="EmergencyInfoScreen" 
        component={EmergencyInfoScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="ProfileAccessHistory" 
        component={ProfileAccessHistoryScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="AdminAuditLogs" 
        component={AdminAuditLogsScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false
        }}
      />
      <Stack.Screen 
        name="AdminAuditLogDetail" 
        component={AdminAuditLogDetailScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false
        }}
      />
    </Stack.Navigator>
  );
};

// Authentication Stack Navigator
const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ title: 'Forgot Password' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen 
        name="MedicalProfessionalRegister" 
        component={MedicalProfessionalRegister}
        options={{ title: 'Medical Professional Registration' }}
      />
    </Stack.Navigator>
  );
};

// Main App Navigator Component
const AppNavigator: React.FC = () => {
  const { user, initializing } = useAuth();

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkNavigationTheme}>
        {initializing ? (
          <LoadingScreen />
        ) : user ? (
          <AuthenticatedStack />
        ) : (
          <AuthStack />
        )}
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  appTitle: {
    ...typography.displayMedium,
    color: colors.primary.main,
    marginBottom: spacing.sm,
  },
  appSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  placeholderText: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  placeholderSubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // Settings Screen Styles
});

export default AppNavigator;