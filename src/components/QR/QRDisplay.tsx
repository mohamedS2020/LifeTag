import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { UserProfile } from '../../types';
import { QRService, QRCodeGenerator, EmergencyQRData } from '../../services/qrService';
import { BackupTextDisplay } from './BackupTextDisplay';
import { useTheme } from '../../theme';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';

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
  const { t } = useTranslation();
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
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
      t('qr.brightness'),
      isMaxBrightness ? t('qr.brightnessResetToNormal') : t('qr.brightnessSetToMax'),
      [{ text: t('common.ok') }]
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
      t('qr.emergencyInstructionsTitle'),
      t('qr.emergencyInstructionsMessage', { name: emergencyData?.name || t('qr.thisPerson') }),
      [{ text: t('qr.gotIt') }]
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
      const message = `${t('qr.emergencyMedicalQRCode')}\n\n${t('qr.name')}: ${emergencyData?.name || t('common.unknown')}\n${emergencyData?.bloodType ? `${t('home.bloodType')}: ${emergencyData.bloodType}\n` : ''}${emergencyData?.allergies && emergencyData.allergies.length > 0 ? `${t('home.allergies')}: ${emergencyData.allergies.join(', ')}\n` : ''}${emergencyData?.emergencyContact ? `${t('home.emergencyContact')}: ${emergencyData.emergencyContact.name} (${emergencyData.emergencyContact.phone})\n` : ''}\n${t('qr.scanForMedicalDetails')}\n\n${t('qr.generatedByLifeTag')} - ${new Date().toLocaleDateString()}`;

      // Share using built-in React Native Share API
      await Share.share({
        title: t('qr.emergencyMedicalQRCode'),
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
      const message = `${t('qr.emergencyMedicalInfo')}\n\n${t('qr.name')}: ${emergencyData?.name || t('common.unknown')}\n${emergencyData?.bloodType ? `${t('home.bloodType')}: ${emergencyData.bloodType}\n` : ''}${emergencyData?.emergencyContact ? `${t('home.emergencyContact')}: ${emergencyData.emergencyContact.name} (${emergencyData.emergencyContact.phone})\n` : ''}${emergencyData?.allergies && emergencyData.allergies.length > 0 ? `${t('home.allergies')}: ${emergencyData.allergies.join(', ')}\n` : ''}${emergencyData?.emergencyNote ? `${t('qr.notes')}: ${emergencyData.emergencyNote}\n` : ''}\n${t('qr.qrData')}: ${qrData}\n\n${t('qr.generatedByLifeTag')}`;

      await Share.share({
        message: message,
        title: t('qr.emergencyMedicalInfo')
      });
    } catch (error) {
      console.error('Error sharing text:', error);
      Alert.alert(t('qr.shareFailed'), t('qr.unableToShareQR'));
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
          t('qr.saveToGallery'),
          t('qr.galleryNotAvailable'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('qr.share'), onPress: handleShare }
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
          t('qr.permissionError'),
          t('qr.unableToRequestPermissions'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('qr.share'), onPress: handleShare }
          ]
        );
        return;
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          t('qr.permissionRequired'),
          t('qr.allowPhotoLibraryAccess'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('qr.shareInstead'), onPress: handleShare }
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
          t('qr.saveFailed'),
          t('qr.unableToSaveToLibrary'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('qr.share'), onPress: handleShare }
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
          t('qr.exportSuccessful'),
          t('qr.qrSavedToAlbum', { albumName }),
          [{ text: t('common.ok') }]
        );
      } catch (albumError) {
        console.log('Album operation failed, but image saved:', albumError);
        Alert.alert(
          t('qr.savedToGallery'),
          t('qr.qrSavedToGallery'),
          [{ text: t('common.ok') }]
        );
      }

    } catch (error: any) {
      console.error('Export error:', error);
      
      // Fallback to sharing on any error
      Alert.alert(
        t('qr.exportFailed'),
        t('qr.unableToSaveShareInstead'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('qr.share'), onPress: handleShare }
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
          t('qr.permissionRequired'),
          t('qr.allowPhotoLibraryForPDF'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('qr.settings'), onPress: () => {
              Alert.alert(t('qr.enablePermissions'), t('qr.goToSettingsPhotos'));
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
          t('qr.pdfExportSuccessful'),
          t('qr.qrSavedAsPDF', { albumName }),
          [{ text: t('common.ok') }]
        );
      } catch (albumError) {
        console.log('Album operation failed, but PDF image saved:', albumError);
        Alert.alert(
          t('qr.savedToGallery'),
          t('qr.qrSavedToGallery'),
          [{ text: t('common.ok') }]
        );
      }

    } catch (error: any) {
      console.error('Error creating PDF:', error);
      Alert.alert(t('qr.exportFailed'), t('qr.unableToSaveTrySharing'));
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
          t('qr.permissionRequired'),
          t('qr.allowPhotoLibraryForSVG'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('qr.settings'), onPress: () => {
              Alert.alert(t('qr.enablePermissions'), t('qr.goToSettingsPhotos'));
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
          t('qr.svgExportSuccessful'),
          t('qr.qrSavedAsSVG', { albumName }),
          [{ text: t('common.ok') }]
        );
      } catch (albumError) {
        console.log('Album operation failed, but SVG image saved:', albumError);
        Alert.alert(
          t('qr.savedToGallery'),
          t('qr.qrSavedToGallery'),
          [{ text: t('common.ok') }]
        );
      }

    } catch (error: any) {
      console.error('Error exporting SVG:', error);
      Alert.alert(t('qr.svgExportFailed'), t('qr.unableToExportTryPNG'));
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

  const styles = useMemo(() => StyleSheet.create({
    fullScreenContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    normalContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    normalBackground: {
      backgroundColor: colors.background.primary,
    },
    maxBrightnessBackground: {
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    closeButton: {
      padding: spacing.xxs,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: 2,
    },
    helpButton: {
      padding: spacing.xxs,
    },
    shareButton: {
      padding: spacing.xxs,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    qrContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    qrWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      direction: 'ltr', // Prevent RTL flip for corner markers
    },
    qrBorder: {
      position: 'absolute',
      borderWidth: 3,
      borderColor: '#000000',
      backgroundColor: '#FFFFFF',
      borderRadius: borderRadius.lg,
    },
    cornerMarker: {
      position: 'absolute',
      width: 20,
      height: 20,
      backgroundColor: colors.medical.emergency,
      borderRadius: 10,
    },
    topLeft: { top: -10, left: -10 },
    topRight: { top: -10, right: -10 },
    bottomLeft: { bottom: -10, left: -10 },
    bottomRight: { bottom: -10, right: -10 },
    qrPlaceholder: {
      borderWidth: 3,
      borderColor: colors.border.default,
      borderStyle: 'dashed',
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.secondary,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    errorText: {
      marginTop: spacing.md,
      fontSize: 16,
      color: colors.status.error.main,
      textAlign: 'center',
    },
    emergencyInfoContainer: {
      backgroundColor: colors.background.secondary,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      width: '90%',
      marginBottom: spacing.lg,
      borderLeftWidth: 5,
      borderLeftColor: colors.primary.main,
    },
    emergencyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    infoItem: {
      width: '48%',
      marginBottom: spacing.md,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      marginBottom: spacing.xxs,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    criticalInfo: {
      color: colors.medical.emergency,
      fontSize: 18,
    },
    infoSubValue: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 2,
    },
    noteContainer: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.background.elevated,
      borderRadius: borderRadius.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.status.warning.main,
    },
    noteLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.status.warning.main,
      marginBottom: spacing.xs,
    },
    noteText: {
      fontSize: 15,
      color: colors.text.primary,
      lineHeight: 22,
    },
    instructionsContainer: {
      backgroundColor: colors.background.secondary,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      width: '90%',
      marginBottom: spacing.lg,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    instructionsText: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    bottomControls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: colors.background.secondary,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
    controlButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.elevated,
      borderRadius: 25,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderWidth: 2,
      borderColor: colors.primary.main,
      minWidth: 80,
    },
    controlButtonText: {
      color: colors.primary.main,
      fontSize: 12,
      fontWeight: '600',
      marginTop: spacing.xxs,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.elevated,
      borderRadius: 25,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 2,
      borderColor: colors.primary.main,
    },
    toggleButtonText: {
      color: colors.primary.main,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: spacing.xs,
    },
    backupTextContainer: {
      width: '100%',
      flex: 1,
    },
    fallbackButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary.main,
      borderRadius: 20,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    fallbackButtonText: {
      color: colors.text.inverse,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      backgroundColor: colors.background.secondary,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
    },
    modalContent: {
      flex: 1,
      padding: spacing.lg,
    },
    modalSubtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
      lineHeight: 22,
    },
    optionsContainer: {
      gap: spacing.md,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    optionButtonDisabled: {
      opacity: 0.6,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background.elevated,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    optionText: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.xxs,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.normalContainer;
  const backgroundStyle = isMaxBrightness ? styles.maxBrightnessBackground : styles.normalBackground;

  return (
    <SafeAreaView style={[containerStyle, backgroundStyle]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.background.primary} 
        translucent={false}
      />
      
      {/* Header Controls */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.shareButton} onPress={() => setShowShareModal(true)}>
          <Ionicons name="share-outline" size={26} color={colors.primary.main} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {emergencyMode ? t('qr.emergencyMedicalQR') : t('qr.medicalInformationQR')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {emergencyData?.name || t('common.loading')}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={26} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.helpButton} onPress={showEmergencyInstructions}>
            <Ionicons name="help-circle" size={26} color={colors.primary.main} />
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
            color={colors.primary.main} 
          />
          <Text style={styles.toggleButtonText}>
            {showBackupText ? t('qr.showQRCode') : t('qr.showBackupText')}
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
                <ActivityIndicator size="large" color={colors.primary.main} />
                <Text style={styles.loadingText}>{t('qr.generatingQRCode')}</Text>
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
                <Ionicons name="alert-circle" size={60} color={colors.status.error.main} />
                <Text style={styles.errorText}>{t('qr.failedToGenerateQR')}</Text>
                <TouchableOpacity 
                  style={styles.fallbackButton} 
                  onPress={toggleBackupText}
                >
                  <Text style={styles.fallbackButtonText}>{t('qr.viewBackupText')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Emergency Information Display */}
        {emergencyData && (
          <View style={styles.emergencyInfoContainer}>
            <Text style={styles.emergencyTitle}>{t('emergency.title')}</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('qr.name')}</Text>
                <Text style={styles.infoValue}>{emergencyData.name}</Text>
              </View>

              {emergencyData.bloodType && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{t('home.bloodType')}</Text>
                  <Text style={[styles.infoValue, styles.criticalInfo]}>
                    {emergencyData.bloodType}
                  </Text>
                </View>
              )}

              {emergencyData.allergies.length > 0 && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{t('home.allergies')}</Text>
                  <Text style={[styles.infoValue, styles.criticalInfo]}>
                    {emergencyData.allergies.join(', ')}
                  </Text>
                </View>
              )}

              {emergencyData.emergencyContact && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{t('home.emergencyContact')}</Text>
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
                <Text style={styles.noteLabel}>{t('qr.medicalNote')}</Text>
                <Text style={styles.noteText}>{emergencyData.emergencyNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>{t('qr.scanningInstructions')}</Text>
          <Text style={styles.instructionsText}>
            {t('qr.scanningInstructionsText')}
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
            color={colors.primary.main} 
          />
          <Text style={styles.controlButtonText}>
            {isMaxBrightness ? t('qr.normal') : t('qr.bright')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => generateQRCode(true)}
          disabled={isGenerating}
        >
          <Ionicons name="refresh" size={24} color={colors.primary.main} />
          <Text style={styles.controlButtonText}>{t('qr.refresh')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={showEmergencyInstructions}
        >
          <Ionicons name="information-circle" size={24} color={colors.primary.main} />
          <Text style={styles.controlButtonText}>{t('qr.help')}</Text>
        </TouchableOpacity>
      </View>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <SafeAreaViewContext style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowShareModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('qr.shareExportTitle')}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              {t('qr.shareExportSubtitle')}
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
                  <Ionicons name="share-outline" size={24} color={colors.primary.main} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{t('qr.shareQR')}</Text>
                  <Text style={styles.optionDescription}>{t('qr.shareViaDescription')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
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
                    <ActivityIndicator size="small" color={colors.status.success.main} />
                  ) : (
                    <Ionicons name="image-outline" size={24} color={colors.status.success.main} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{t('qr.saveToGallery')}</Text>
                  <Text style={styles.optionDescription}>
                    {isExporting ? t('qr.savingImage') : t('qr.saveAsHighQualityImage')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
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
                    <ActivityIndicator size="small" color={colors.status.error.main} />
                  ) : (
                    <Ionicons name="document-outline" size={24} color={colors.status.error.main} />
                  )}
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{t('qr.exportAsDocument')}</Text>
                  <Text style={styles.optionDescription}>
                    {isExporting ? t('qr.preparingDocument') : t('qr.createPrintableDocument')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaViewContext>
      </Modal>
    </SafeAreaView>
  );
};

export default QRDisplay;