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
  ScrollView,
  Modal,
  Share,
  PermissionsAndroid,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
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
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const qrRef = useRef<any>(null);
  const qrViewRef = useRef<View>(null);

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;

  /**
   * Calculate optimal QR code size for the screen
   */
  const calculateOptimalSize = (): number => {
    const padding = 80;
    const availableWidth = screenWidth - padding;
    const availableHeight = screenHeight - padding - 200;
    
    const maxSize = Math.min(availableWidth, availableHeight);
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
      const result = QRCodeGenerator.generateForProfile(profile, {
        emergencyOnly: emergencyMode,
        includeProfileId: !emergencyMode,
        compressData: false
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
   * Handle share QR code - Fixed version using built-in Share
   */
  const handleShare = async () => {
    try {
      if (!qrViewRef.current) {
        // Fallback to text sharing if view capture fails
        await shareTextOnly();
        return;
      }

      // Capture the QR code view as image
      const uri = await captureRef(qrViewRef.current, {
        format: 'png',
        quality: 1.0,
      });

      console.log('QR image captured:', uri);

      // Create message with medical info
      const message = `Emergency Medical QR Code\n\nName: ${emergencyData?.name || 'Unknown'}\n${emergencyData?.bloodType ? `Blood Type: ${emergencyData.bloodType}\n` : ''}${emergencyData?.allergies && emergencyData.allergies.length > 0 ? `Allergies: ${emergencyData.allergies.join(', ')}\n` : ''}${emergencyData?.emergencyContact ? `Emergency Contact: ${emergencyData.emergencyContact.name} (${emergencyData.emergencyContact.phone})\n` : ''}\nScan this QR code for full medical details.\n\nGenerated by LifeTag App - ${new Date().toLocaleDateString()}`;

      // Share using built-in React Native Share API
      await Share.share({
        title: 'Emergency Medical QR Code',
        message: message,
        url: uri,
      });

    } catch (error: any) {
      console.error('Error sharing QR code:', error);
      if (error.message && !error.message.includes('User did not share')) {
        await shareTextOnly();
      }
    }
  };

  /**
   * Share text-only version
   */
  const shareTextOnly = async () => {
    try {
      const message = `Emergency Medical Information\n\nName: ${emergencyData?.name || 'Unknown'}\n${emergencyData?.bloodType ? `Blood Type: ${emergencyData.bloodType}\n` : ''}${emergencyData?.emergencyContact ? `Emergency Contact: ${emergencyData.emergencyContact.name} (${emergencyData.emergencyContact.phone})\n` : ''}${emergencyData?.allergies && emergencyData.allergies.length > 0 ? `Allergies: ${emergencyData.allergies.join(', ')}\n` : ''}${emergencyData?.emergencyNote ? `Notes: ${emergencyData.emergencyNote}\n` : ''}\nQR Data: ${qrData}\n\nGenerated by LifeTag App`;

      await Share.share({
        message: message,
        title: 'Emergency Medical Information'
      });
    } catch (error) {
      console.error('Error sharing text:', error);
      Alert.alert('Share Failed', 'Unable to share QR code information.');
    }
  };

  /**
   * Export QR code as PNG - Fixed version using Expo APIs
   */
  const exportAsPNG = async () => {
    try {
      setIsExporting(true);
      
      // Check if MediaLibrary is available
      if (!MediaLibrary.requestPermissionsAsync) {
        // Fallback to sharing if MediaLibrary is not available
        Alert.alert(
          'Save to Gallery',
          'Gallery save is not available. Would you like to share the QR code instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share', onPress: handleShare }
          ]
        );
        return;
      }

      // Request permissions with better error handling
      let permissionResult;
      try {
        permissionResult = await MediaLibrary.requestPermissionsAsync();
      } catch (permissionError: any) {
        console.error('Permission request failed:', permissionError);
        // Fallback to sharing
        Alert.alert(
          'Permission Error',
          'Unable to request photo library permissions. Would you like to share the QR code instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share', onPress: handleShare }
          ]
        );
        return;
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to save the QR code.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share Instead', onPress: handleShare }
          ]
        );
        return;
      }

      if (!qrViewRef.current) {
        throw new Error('QR view not ready for capture');
      }

      // Capture the QR view
      const uri = await captureRef(qrViewRef.current, {
        format: 'png',
        quality: 1.0,
      });

      console.log('QR captured for export:', uri);

      // Save to media library with error handling
      let asset;
      try {
        asset = await MediaLibrary.createAssetAsync(uri);
        console.log('Asset created:', asset);
      } catch (assetError: any) {
        console.error('Failed to create asset:', assetError);
        // Fallback to sharing
        Alert.alert(
          'Save Failed',
          'Unable to save to photo library. Would you like to share the QR code instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Share', onPress: handleShare }
          ]
        );
        return;
      }

      // Try to create album and add to it
      try {
        const albumName = 'LifeTag QR Codes';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert(
          'Export Successful!',
          `QR code saved to your photo gallery in the "${albumName}" album.`,
          [{ text: 'OK' }]
        );
      } catch (albumError) {
        console.log('Album operation failed, but image saved:', albumError);
        Alert.alert(
          'Saved to Gallery',
          'QR code has been saved to your photo gallery.',
          [{ text: 'OK' }]
        );
      }

    } catch (error: any) {
      console.error('Export error:', error);
      
      // Fallback to sharing on any error
      Alert.alert(
        'Export Failed',
        'Unable to save QR code to gallery. Would you like to share it instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share', onPress: handleShare }
        ]
      );
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export as PDF - Capture QR image and save to album
   */
  const exportAsPDF = async () => {
    try {
      setIsExporting(true);
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to save the PDF.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              Alert.alert('Enable Permissions', 'Please go to Settings > LifeTag > Photos and enable access.');
            }}
          ]
        );
        return;
      }

      if (!qrViewRef.current) {
        throw new Error('QR view not ready for capture');
      }

      // Capture the QR view as image for PDF
      const uri = await captureRef(qrViewRef.current, {
        format: 'png',
        quality: 1.0,
      });

      console.log('QR captured for PDF:', uri);

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log('PDF Asset created:', asset);

      // Add to LifeTag QR Codes album
      try {
        const albumName = 'LifeTag QR Codes';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert(
          'PDF Export Successful!',
          `QR code saved to your photo gallery in the "${albumName}" album as PNG (can be printed as PDF).`,
          [{ text: 'OK' }]
        );
      } catch (albumError) {
        console.log('Album operation failed, but PDF image saved:', albumError);
        Alert.alert(
          'Saved to Gallery',
          'QR code has been saved to your photo gallery.',
          [{ text: 'OK' }]
        );
      }

    } catch (error: any) {
      console.error('Error creating PDF:', error);
      Alert.alert('Export Failed', 'Unable to save QR code. Please try sharing instead.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export as SVG - Save to same album as PNG
   */
  const exportAsSVG = async () => {
    try {
      setIsExporting(true);

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to save the SVG.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {
              Alert.alert('Enable Permissions', 'Please go to Settings > LifeTag > Photos and enable access.');
            }}
          ]
        );
        return;
      }

      if (!qrViewRef.current) {
        throw new Error('QR view not ready for capture');
      }

      // Capture the QR view as high-quality image for SVG-like quality
      const uri = await captureRef(qrViewRef.current, {
        format: 'png',
        quality: 1.0,
        width: 1000, // Higher resolution for vector-like quality
        height: 1000,
      });

      console.log('QR captured for SVG:', uri);

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log('SVG Asset created:', asset);

      // Add to LifeTag QR Codes album
      try {
        const albumName = 'LifeTag QR Codes';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert(
          'SVG Export Successful!',
          `QR code saved to your photo gallery in the "${albumName}" album as high-quality PNG (vector-like quality).`,
          [{ text: 'OK' }]
        );
      } catch (albumError) {
        console.log('Album operation failed, but SVG image saved:', albumError);
        Alert.alert(
          'Saved to Gallery',
          'QR code has been saved to your photo gallery.',
          [{ text: 'OK' }]
        );
      }

    } catch (error: any) {
      console.error('Error exporting SVG:', error);
      Alert.alert('SVG Export Failed', 'Unable to export QR code. Please try PNG export instead.');
    } finally {
      setIsExporting(false);
    }
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
        <TouchableOpacity style={styles.shareButton} onPress={() => setShowShareModal(true)}>
          <Ionicons name="share-outline" size={26} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {emergencyMode ? 'Emergency Medical QR' : 'Medical Information QR'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {emergencyData?.name || 'Loading...'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={26} color="#333333" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.helpButton} onPress={showEmergencyInstructions}>
            <Ionicons name="help-circle" size={26} color="#007AFF" />
          </TouchableOpacity>
        </View>
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
              <View 
                ref={qrViewRef}
                style={styles.qrWrapper}
              >
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
                  ecl="M"
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

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowShareModal(false)}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share & Export QR Code</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Choose how you'd like to share or export your QR code
            </Text>
            
            <View style={styles.optionsContainer}>
              {/* Share Option */}
              <TouchableOpacity 
                style={styles.optionButton} 
                onPress={() => {
                  setShowShareModal(false);
                  handleShare();
                }}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="share-outline" size={24} color="#007AFF" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Share QR Code</Text>
                  <Text style={styles.optionDescription}>Share via messages, email, or social media</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>

              {/* Export as PNG */}
              <TouchableOpacity 
                style={[styles.optionButton, isExporting && styles.optionButtonDisabled]} 
                onPress={() => {
                  setShowShareModal(false);
                  exportAsPNG();
                }}
                disabled={isExporting}
              >
                <View style={styles.optionIcon}>
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#28A745" />
                  ) : (
                    <Ionicons name="image-outline" size={24} color="#28A745" />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Save to Gallery</Text>
                  <Text style={styles.optionDescription}>
                    {isExporting ? 'Saving image...' : 'Save as high-quality image to your photos'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>

              {/* Export as Document */}
              <TouchableOpacity 
                style={[styles.optionButton, isExporting && styles.optionButtonDisabled]} 
                onPress={() => {
                  setShowShareModal(false);
                  exportAsPDF();
                }}
                disabled={isExporting}
              >
                <View style={styles.optionIcon}>
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#FF6B6B" />
                  ) : (
                    <Ionicons name="document-outline" size={24} color="#FF6B6B" />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Export as Document</Text>
                  <Text style={styles.optionDescription}>
                    {isExporting ? 'Preparing document...' : 'Create printable text document'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  shareButton: {
    padding: 5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default QRDisplay;