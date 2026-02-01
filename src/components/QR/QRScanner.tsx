import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Vibration,
  TextInput,
  ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { QRService, EmergencyQRData } from '../../services/qrService';
import { profileService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';
import { colors, spacing } from '../../theme';

/**
 * QR Scanner Component Props
 */
interface QRScannerProps {
  onQRScanned?: (qrData: string, emergencyData: EmergencyQRData | null) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

/**
 * QRScanner Component
 * 
 * Emergency-optimized QR code scanner with medical data validation
 * - Camera-based scanning with high accuracy
 * - Permission handling with clear user guidance
 * - Emergency data validation and display
 * - Manual entry fallback for accessibility
 * - Optimized for emergency situations with clear visual feedback
 */
const QRScanner: React.FC<QRScannerProps> = ({
  onQRScanned,
  onError,
  onClose,
}) => {
  // Translation hook
  const { t } = useTranslation();

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  
  // Auth context for user identification
  const { user } = useAuth();
  
  // State management
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualQRCode, setManualQRCode] = useState('');
  const [lastScanned, setLastScanned] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);
  const [emergencyData, setEmergencyData] = useState<EmergencyQRData | null>(null);
  
  // Refs
  const scannerRef = useRef<any>(null);
  
  // Screen dimensions for responsive layout
  const { width, height } = Dimensions.get('window');
  const scanAreaSize = Math.min(width * 0.8, height * 0.4);

  /**
   * Request camera permissions on component mount
   */
  useEffect(() => {
    (async () => {
      try {
        if (!permission?.granted) {
          const result = await requestPermission();
          if (!result.granted) {
            Alert.alert(
              t('qr.cameraPermissionRequired'),
              t('qr.cameraPermissionMessage'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('qr.useManualEntry'), onPress: () => setShowManualEntry(true) }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        onError?.('Failed to request camera permissions');
      }
    })();
  }, [permission, requestPermission, onError]);

  /**
   * Log QR scan activity for audit purposes
   */
  const logQRScan = async (
    scannedData: string, 
    scanResult: 'success' | 'error' | 'invalid_format',
    scanType: 'emergency_qr' | 'regular_qr' | 'unknown',
    profileId?: string
  ) => {
    try {
      if (!user) {
        console.log('No authenticated user for QR scan logging');
        return;
      }

      const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        profileId: profileId || 'unknown', // Use scanned profile ID or 'unknown' for non-LifeTag QRs
        accessedBy: user.id,
        accessorType: user.userType === 'admin' ? 'admin' : user.userType === 'medical_professional' ? 'medical_professional' : 'individual',
        accessType: 'qr_scan',
        accessMethod: 'qr_code',
        dataModified: false,
        deviceInfo: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
        notes: `QR scan: ${scanResult} (${scanType}) - Data length: ${scannedData.length} chars`
      };

      // Only add fieldsAccessed if it has values
      if (scanType === 'emergency_qr') {
        auditLog.fieldsAccessed = ['name', 'bloodType', 'allergies', 'emergencyContact'];
      }

      // Only add location if available (currently not implemented)
      // auditLog.location = undefined; // Remove this to avoid undefined values

      const result = await profileService.logProfileAccess(profileId || 'unknown', auditLog);
      if (!result.success) {
        console.error('Failed to log QR scan:', result.error);
      }
    } catch (error) {
      console.error('QR scan logging error:', error);
    }
  };

  /**
   * Handle QR code scan result
   */
  const handleBarcodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (scanned || !data || data === lastScanned) {
      return;
    }

    setScanned(true);
    setIsLoading(true);
    setLastScanned(data);
    setScanCount(prev => prev + 1);

    // Provide haptic feedback for successful scan
    if (Platform.OS === 'ios') {
      Vibration.vibrate([100]);
    } else {
      Vibration.vibrate(100);
    }

    try {
      console.log('QR Code scanned:', { type, data: data.substring(0, 100) + '...' });
      
      // Validate and parse emergency QR data
      const isValidQR = QRService.validateQRCode(data);
      let parsedEmergencyData: EmergencyQRData | null = null;

      if (isValidQR) {
        try {
          parsedEmergencyData = QRService.decodeQRString(data);
          setEmergencyData(parsedEmergencyData);
          
          if (parsedEmergencyData) {
            // Log successful emergency QR scan
            await logQRScan(data, 'success', 'emergency_qr', parsedEmergencyData.profileId);
            
            Alert.alert(
              t('qr.emergencyQRDetected'),
              t('qr.scannedMedicalInfo', {
                name: parsedEmergencyData.name,
                bloodType: parsedEmergencyData.bloodType || t('common.notSpecified'),
                allergies: parsedEmergencyData.allergies && parsedEmergencyData.allergies.length > 0 ? parsedEmergencyData.allergies.join(', ') : t('qr.noneSpecified'),
                contactName: parsedEmergencyData.emergencyContact?.name || t('common.notSpecified'),
                contactPhone: parsedEmergencyData.emergencyContact?.phone ? ` (${parsedEmergencyData.emergencyContact.phone})` : ''
              }),
              [
                { text: t('qr.viewDetails'), onPress: () => onQRScanned?.(data, parsedEmergencyData) },
                { text: t('qr.scanAnother'), onPress: resetScanner }
              ]
            );
          }
        } catch (parseError) {
          console.error('Failed to parse QR data:', parseError);
          
          // Log failed parse attempt
          await logQRScan(data, 'error', 'emergency_qr');
          
          Alert.alert(
            t('qr.formatIssue'),
            t('qr.formatIssueMessage'),
            [
              { text: t('qr.tryAgain'), onPress: resetScanner },
              { text: t('qr.useRawData'), onPress: () => onQRScanned?.(data, null) }
            ]
          );
        }
      } else {
        // Log non-LifeTag QR scan
        await logQRScan(data, 'success', 'regular_qr');
        
        // Not a LifeTag emergency QR - ask user what to do
        Alert.alert(
          t('qr.nonEmergencyQR'),
          t('qr.nonEmergencyQRMessage'),
          [
            { text: t('qr.scanAnother'), onPress: resetScanner },
            { text: t('qr.processAnyway'), onPress: () => onQRScanned?.(data, null) }
          ]
        );
      }
    } catch (error) {
      console.error('QR processing error:', error);
      
      // Log general QR processing error
      await logQRScan(data, 'error', 'unknown');
      
      onError?.(`Failed to process QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset scanner for next scan
   */
  const resetScanner = () => {
    setScanned(false);
    setIsLoading(false);
    setLastScanned('');
    setEmergencyData(null);
  };

  /**
   * Handle manual QR code entry
   */
  const handleManualEntry = async () => {
    if (!manualQRCode.trim()) {
      Alert.alert(t('common.error'), t('qr.pleaseEnterQRCode'));
      return;
    }

    setIsLoading(true);
    
    try {
      const isValidQR = QRService.validateQRCode(manualQRCode);
      let parsedEmergencyData: EmergencyQRData | null = null;

      if (isValidQR) {
        parsedEmergencyData = QRService.decodeQRString(manualQRCode);
        
        // Log successful manual emergency QR entry
        await logQRScan(
          manualQRCode, 
          'success', 
          'emergency_qr', 
          parsedEmergencyData?.profileId
        );
      } else {
        // Log manual entry of non-LifeTag QR
        await logQRScan(manualQRCode, 'success', 'regular_qr');
      }

      onQRScanned?.(manualQRCode, parsedEmergencyData);
      setManualQRCode('');
      setShowManualEntry(false);
    } catch (error) {
      console.error('Manual entry error:', error);
      
      // Log manual entry error
      await logQRScan(manualQRCode, 'error', 'unknown');
      
      onError?.(`Failed to process manual entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render permission request screen
   */
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.statusText}>{t('qr.requestingCameraPermission')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render permission denied screen
   */
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={80} color={colors.text.tertiary} />
          <Text style={styles.errorTitle}>{t('qr.cameraAccessRequired')}</Text>
          <Text style={styles.errorText}>
            {t('qr.cameraAccessMessage')}
          </Text>
          <Text style={styles.errorSubtext}>
            {t('qr.enableCameraOrManualEntry')}
          </Text>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowManualEntry(true)}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>{t('qr.manualEntry')}</Text>
          </TouchableOpacity>
          
          {onClose && (
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render manual entry modal
   */
  if (showManualEntry) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.manualEntryContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowManualEntry(false)}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('qr.manualQREntry')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.manualEntryContent}>
            <Text style={styles.instructionTitle}>{t('qr.enterQRCodeData')}</Text>
            <Text style={styles.instructionText}>
              {t('qr.manualEntryInstructions')}
            </Text>

            <TextInput
              style={styles.textInput}
              value={manualQRCode}
              onChangeText={setManualQRCode}
              placeholder={t('qr.pasteOrTypeQRData')}
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.primaryButton, (!manualQRCode.trim() || isLoading) && styles.disabledButton]}
              onPress={handleManualEntry}
              disabled={!manualQRCode.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>{t('qr.processQRData')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowManualEntry(false)}
            >
              <Text style={styles.secondaryButtonText}>{t('qr.backToScanner')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /**
   * Render main scanner interface
   */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{t('qr.emergencyQRScanner')}</Text>
        <TouchableOpacity onPress={() => setShowManualEntry(true)}>
          <Ionicons name="create-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Scanner View */}
      <View style={styles.scannerContainer}>
        <CameraView
          ref={scannerRef}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          style={[styles.scanner, { width, height: height * 0.7 }]}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Scan Overlay */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanArea}>
            <View style={[styles.scanFrame, { width: scanAreaSize, height: scanAreaSize }]}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Loading indicator */}
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary.main} />
                  <Text style={styles.loadingText}>{t('qr.processingQRCode')}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>
          {scanned ? t('qr.qrCodeScannedSuccess') : t('qr.positionQRCodeInFrame')}
        </Text>
        <Text style={styles.instructionText}>
          {scanned 
            ? t('qr.processingEmergencyInfo')
            : t('qr.holdDeviceSteady')
          }
        </Text>
        
        {scanCount > 0 && (
          <Text style={styles.scanCountText}>
            {t('qr.scansCompleted', { count: scanCount })}
          </Text>
        )}

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          {scanned && !isLoading && (
            <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.primaryButtonText}>{t('qr.scanAnother')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

/**
 * Styles for QRScanner component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary.main,
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: colors.text.primary,
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: '500',
  },
  instructionsContainer: {
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanCountText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.md,
    marginVertical: spacing.xs,
  },
  primaryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: colors.text.tertiary,
    opacity: 0.6,
  },
  statusText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.status.error.main,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  manualEntryContainer: {
    flexGrow: 1,
    backgroundColor: colors.background.primary,
  },
  manualEntryContent: {
    flex: 1,
    padding: spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 120,
    marginVertical: spacing.md,
  },
});

export default QRScanner;