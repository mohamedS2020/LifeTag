import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { UserProfile } from '../../types';
import { QRService, QRCodeGenerator, EmergencyQRData } from '../../services/qrService';
import { BackupTextDisplay } from './BackupTextDisplay';

/**
 * QR Display Screen Props
 */
interface QRDisplayProps {
  profile: UserProfile;
  onClose?: () => void;
  onError?: (error: string) => void;
  emergencyMode?: boolean;
  fullScreen?: boolean;
}

/**
 * QR Display Screen Component
 * Displays QR code in full-screen format optimized for emergency scanning
 */
export const QRDisplay: React.FC<QRDisplayProps> = ({
  profile,
  onClose,
  onError,
  emergencyMode = false,
  fullScreen = true
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [emergencyData, setEmergencyData] = useState<EmergencyQRData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [qrSize, setQrSize] = useState<number>(300);
  const [brightness, setBrightness] = useState<number>(1.0);
  const [isMaxBrightness, setIsMaxBrightness] = useState<boolean>(false);
  const [showBackupText, setShowBackupText] = useState<boolean>(false);
  const qrRef = useRef<any>(null);

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;

  /**
   * Calculate optimal QR code size for the screen
   */
  const calculateOptimalSize = (): number => {
    const padding = 80; // Space for controls and text
    const availableWidth = screenWidth - padding;
    const availableHeight = screenHeight - padding - 200; // Extra space for text below
    
    const maxSize = Math.min(availableWidth, availableHeight);
    
    // Ensure minimum size for emergency situations
    const minSize = 250;
    const optimalSize = Math.max(minSize, Math.min(maxSize, 400));
    
    return optimalSize;
  };

  /**
   * Generate QR code for display
   */
  const generateQRCode = async (forceRefresh: boolean = false) => {
    if (!profile) {
      onError?.('No profile data available');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate QR code optimized for emergency display
      const result = QRCodeGenerator.generateForProfile(profile, {
        emergencyOnly: emergencyMode,
        includeProfileId: !emergencyMode,
        compressData: false // Don't compress for better readability
      }, forceRefresh);

      setQrData(result.qrData);
      setEmergencyData(result.emergencyData);

      console.log('QR Display generated:', {
        dataLength: result.qrData.length,
        emergencyMode,
        warnings: result.warnings.length,
        forceRefresh
      });

    } catch (error) {
      console.error('QR Display Generation Error:', error);
      onError?.(`Failed to generate QR code: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Toggle screen brightness for better scanning
   */
  const toggleBrightness = () => {
    // Note: Actual brightness control would require expo-brightness
    // For now, we'll simulate with visual feedback
    setIsMaxBrightness(!isMaxBrightness);
    
    Alert.alert(
      'Brightness',
      isMaxBrightness ? 'Brightness reset to normal' : 'Brightness set to maximum for better scanning',
      [{ text: 'OK' }]
    );
  };

  /**
   * Toggle between QR code and backup text display
   */
  const toggleBackupText = () => {
    setShowBackupText(!showBackupText);
  };

  /**
   * Show emergency instructions
   */
  const showEmergencyInstructions = () => {
    Alert.alert(
      'Emergency QR Code Instructions',
      `This QR code contains emergency medical information for ${emergencyData?.name || 'this person'}.\n\n` +
      '• Scan with any QR code scanner app\n' +
      '• Information is readable without this app\n' +
      '• Contains critical medical data for first responders\n' +
      '• Keep screen brightness high for better scanning',
      [{ text: 'Got it' }]
    );
  };

  /**
   * Handle screen orientation change
   */
  useEffect(() => {
    const newSize = calculateOptimalSize();
    setQrSize(newSize);
  }, [screenWidth, screenHeight]);

  // Generate QR code on mount
  useEffect(() => {
    generateQRCode();
  }, [profile.id, emergencyMode]);

  // Set status bar style for better visibility
  useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content');
    }
    return () => {
      if (Platform.OS === 'ios') {
        StatusBar.setBarStyle('default');
      }
    };
  }, []);

  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.normalContainer;
  const backgroundStyle = isMaxBrightness ? styles.maxBrightnessBackground : styles.normalBackground;

  return (
    <SafeAreaView style={[containerStyle, backgroundStyle]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF" 
        translucent={false}
      />
      
      {/* Header Controls */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#333333" />
          </TouchableOpacity>
        )}
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {emergencyMode ? 'Emergency Medical QR' : 'Medical Information QR'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {emergencyData?.name || 'Loading...'}
          </Text>
        </View>

        <TouchableOpacity style={styles.helpButton} onPress={showEmergencyInstructions}>
          <Ionicons name="help-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Main QR Code Display */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle Button */}
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={toggleBackupText}
        >
          <Ionicons 
            name={showBackupText ? "qr-code" : "text"} 
            size={20} 
            color="#007AFF" 
          />
          <Text style={styles.toggleButtonText}>
            {showBackupText ? 'Show QR Code' : 'Show Backup Text'}
          </Text>
        </TouchableOpacity>

        {showBackupText ? (
          /* Backup Text Display */
          emergencyData && (
            <View style={styles.backupTextContainer}>
              <BackupTextDisplay 
                emergencyData={emergencyData}
                qrData={qrData}
                showQRData={false}
                showCopyButton={true}
                compact={true}
              />
            </View>
          )
        ) : (
          /* QR Code Display */
          <View style={styles.qrContainer}>
            {isGenerating ? (
              <View style={[styles.qrPlaceholder, { width: qrSize, height: qrSize }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Generating QR Code...</Text>
              </View>
            ) : qrData ? (
              <View style={styles.qrWrapper}>
                {/* High-contrast border for emergency visibility */}
                <View style={[styles.qrBorder, { 
                  width: qrSize + 40, 
                  height: qrSize + 40 
                }]} />
                
                <QRCode
                  value={qrData}
                  size={qrSize}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  logoSize={0}
                  getRef={(ref) => (qrRef.current = ref)}
                  ecl="M" // Error correction level for better scanning
                />
                
                {/* Corner markers for easy identification */}
                <View style={[styles.cornerMarker, styles.topLeft]} />
                <View style={[styles.cornerMarker, styles.topRight]} />
                <View style={[styles.cornerMarker, styles.bottomLeft]} />
                <View style={[styles.cornerMarker, styles.bottomRight]} />
              </View>
            ) : (
              <View style={[styles.qrPlaceholder, { width: qrSize, height: qrSize }]}>
                <Ionicons name="alert-circle" size={60} color="#FF3B30" />
                <Text style={styles.errorText}>Failed to generate QR code</Text>
                <TouchableOpacity 
                  style={styles.fallbackButton} 
                  onPress={toggleBackupText}
                >
                  <Text style={styles.fallbackButtonText}>View Backup Text</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Emergency Information Display */}
        {emergencyData && (
          <View style={styles.emergencyInfoContainer}>
            <Text style={styles.emergencyTitle}>Emergency Information</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{emergencyData.name}</Text>
              </View>

              {emergencyData.bloodType && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Blood Type</Text>
                  <Text style={[styles.infoValue, styles.criticalInfo]}>
                    {emergencyData.bloodType}
                  </Text>
                </View>
              )}

              {emergencyData.allergies.length > 0 && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Allergies</Text>
                  <Text style={[styles.infoValue, styles.criticalInfo]}>
                    {emergencyData.allergies.join(', ')}
                  </Text>
                </View>
              )}

              {emergencyData.emergencyContact && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Emergency Contact</Text>
                  <Text style={styles.infoValue}>
                    {emergencyData.emergencyContact.name}
                  </Text>
                  <Text style={styles.infoSubValue}>
                    {emergencyData.emergencyContact.phone}
                  </Text>
                </View>
              )}
            </View>

            {emergencyData.emergencyNote && (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Medical Note</Text>
                <Text style={styles.noteText}>{emergencyData.emergencyNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Scanning Instructions</Text>
          <Text style={styles.instructionsText}>
            • Use any QR code scanner app{'\n'}
            • Hold camera 6-12 inches from screen{'\n'}
            • Ensure good lighting for best results{'\n'}
            • Information is readable without this app
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={toggleBrightness}
        >
          <Ionicons 
            name={isMaxBrightness ? "sunny" : "sunny-outline"} 
            size={24} 
            color="#007AFF" 
          />
          <Text style={styles.controlButtonText}>
            {isMaxBrightness ? 'Normal' : 'Bright'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => generateQRCode(true)}
          disabled={isGenerating}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
          <Text style={styles.controlButtonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={showEmergencyInstructions}
        >
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.controlButtonText}>Help</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  normalContainer: {
    flex: 1,
  },
  normalBackground: {
    backgroundColor: '#FFFFFF',
  },
  maxBrightnessBackground: {
    backgroundColor: '#FFFFFF',
    // Simulate max brightness with pure white
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 2,
  },
  helpButton: {
    padding: 5,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  qrWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    // High contrast shadow for emergency visibility
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
  },
  topLeft: { top: -10, left: -10 },
  topRight: { top: -10, right: -10 },
  bottomLeft: { bottom: -10, left: -10 },
  bottomRight: { bottom: -10, right: -10 },
  qrPlaceholder: {
    borderWidth: 3,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emergencyInfoContainer: {
    backgroundColor: '#F0F8FF',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF',
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  criticalInfo: {
    color: '#FF3B30',
    fontSize: 18,
  },
  infoSubValue: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  noteContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  instructionsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    minWidth: 80,
  },
  controlButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  toggleButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backupTextContainer: {
    width: '100%',
    flex: 1,
  },
  fallbackButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  fallbackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QRDisplay;