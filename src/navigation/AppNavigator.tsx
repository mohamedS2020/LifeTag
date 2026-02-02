/**
 * App Navigator
 * Handles authenticated and unauthenticated navigation flows
 * Task 7.2: Create AppNavigator with authenticated and unauthenticated flows
 */

import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LoginScreen, RegisterScreen, MedicalProfessionalRegister } from '../components/Auth';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { HomeScreen, ProfileFormScreen, ProfileDisplayScreen, QRTabScreen, QRDisplayScreen, QRScannerScreen, EmergencyInfoScreen, VerificationStatusScreen, MedicalProfessionalScreen, AdminScreen, SettingsScreen, ProfileAccessHistoryScreen } from '../screens';
import AdminAuditLogsScreen from '../screens/AdminAuditLogsScreen';
import AdminAuditLogDetailScreen from '../screens/AdminAuditLogDetailScreen';
import { MedicalProfessionalDashboard } from '../components/common';
import { EmergencyQRData } from '../services/qrService';
import { StatusBar } from 'expo-status-bar';

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
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
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
  }), [colors, spacing, typography]);

  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.appTitle}>LifeTag</Text>
      <Text style={styles.appSubtitle}>{t('home.emergencySystem')}</Text>
      <ActivityIndicator size="large" color={colors.primary.main} style={styles.spinner} />
      <Text style={styles.loadingText}>{t('common.loading')}</Text>
    </View>
  );
};

// Temporary placeholder screen components for authenticated app
const PlaceholderScreen = ({ title }: { title: string }) => {
  const { colors, spacing, typography } = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
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
  }), [colors, spacing, typography]);

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors, spacing, typography, isDark } = useTheme();
  const isVerifiedMedicalProfessional = user?.userType === 'medical_professional' && user?.isVerified;
  const isAdmin = user?.userType === 'admin';

  const screenOptions = useMemo(() => ({
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
      backgroundColor: isDark ? colors.background.primary : colors.primary.main,
      shadowColor: colors.primary.dark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.15,
      shadowRadius: 8,
      elevation: isDark ? 0 : 4,
      borderBottomWidth: 0,
      height: 100,
    },
    headerTintColor: isDark ? colors.text.primary : '#FFFFFF',
    headerTitleStyle: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: isDark ? colors.text.primary : '#FFFFFF',
      letterSpacing: -0.5,
    },
    headerTitleAlign: 'left' as const,
    headerLeftContainerStyle: {
      paddingLeft: spacing.md,
    },
    headerRightContainerStyle: {
      paddingRight: spacing.md,
    },
    headerShadowVisible: !isDark,
  }), [colors, spacing, typography, isDark]);

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
        ...screenOptions,
      })}
    >
      {/* Home and QR tabs - Hide for admin users */}
      {!isAdmin && (
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            tabBarLabel: t('home.title'),
            title: 'LifeTag'
          }}
        />
      )}
      {!isAdmin && (
        <Tab.Screen 
          name="QR" 
          component={QRTabScreen}
          options={{ 
            tabBarLabel: t('qr.title'),
            title: t('qr.scanTitle')
          }}
        />
      )}
      
      {/* Medical Professional Tab - Only show for verified medical professionals */}
      {isVerifiedMedicalProfessional && (
        <Tab.Screen 
          name="MedPro" 
          component={MedicalProfessionalScreen}
          options={{ 
            tabBarLabel: t('medicalProfessional.title'),
            title: t('medicalProfessional.dashboard')
          }}
        />
      )}
      
      {/* Admin Tab - Only show for admin users */}
      {isAdmin && (
        <Tab.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{ 
            tabBarLabel: t('admin.title'),
            title: t('admin.dashboard')
          }}
        />
      )}
      
      {/* Settings tab - Hide for admin users */}
      {!isAdmin && (
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            tabBarLabel: t('settings.title'),
            title: t('settings.title')
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
  const { colors, isDark } = useTheme();

  // Create dynamic navigation theme based on current theme
  const navigationTheme = useMemo(() => ({
    ...(isDark ? DarkTheme : DefaultTheme),
    dark: isDark,
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary.main,
      background: colors.background.primary,
      card: colors.background.secondary,
      text: colors.text.primary,
      border: colors.border.default,
      notification: colors.status.error.main,
    },
  }), [colors, isDark]);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        {initializing ? (
          <LoadingScreen />
        ) : user ? (
          <AuthenticatedStack />
        ) : (
          <AuthStack />
        )}
        <StatusBar style="light" translucent backgroundColor={isDark ? colors.background.primary : colors.primary.main} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;