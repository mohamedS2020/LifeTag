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
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { QRService, EmergencyQRData } from '../../services/qrService';
import { profileService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';

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
              'Camera Permission Required',
              'LifeTag needs camera access to scan QR codes containing emergency medical information. Please enable camera permissions in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Use Manual Entry', onPress: () => setShowManualEntry(true) }
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
              '✅ Emergency Medical QR Code Detected',
              `Successfully scanned medical information for: ${parsedEmergencyData.name}\n\nBlood Type: ${parsedEmergencyData.bloodType || 'Not specified'}\nAllergies: ${parsedEmergencyData.allergies && parsedEmergencyData.allergies.length > 0 ? parsedEmergencyData.allergies.join(', ') : 'None specified'}\nEmergency Contact: ${parsedEmergencyData.emergencyContact?.name || 'Not specified'}${parsedEmergencyData.emergencyContact?.phone ? ` (${parsedEmergencyData.emergencyContact.phone})` : ''}`,
              [
                { text: 'View Details', onPress: () => onQRScanned?.(data, parsedEmergencyData) },
                { text: 'Scan Another', onPress: resetScanner }
              ]
            );
          }
        } catch (parseError) {
          console.error('Failed to parse QR data:', parseError);
          
          // Log failed parse attempt
          await logQRScan(data, 'error', 'emergency_qr');
          
          Alert.alert(
            '⚠️ QR Code Format Issue',
            'This appears to be a LifeTag QR code but there was an issue reading the medical information. The QR code may be damaged or from an older version.',
            [
              { text: 'Try Again', onPress: resetScanner },
              { text: 'Use Raw Data', onPress: () => onQRScanned?.(data, null) }
            ]
          );
        }
      } else {
        // Log non-LifeTag QR scan
        await logQRScan(data, 'success', 'regular_qr');
        
        // Not a LifeTag emergency QR - ask user what to do
        Alert.alert(
          'Non-Emergency QR Code',
          'This QR code does not contain LifeTag emergency medical information. It may be a website, contact, or other type of QR code.',
          [
            { text: 'Scan Another', onPress: resetScanner },
            { text: 'Process Anyway', onPress: () => onQRScanned?.(data, null) }
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
      Alert.alert('Error', 'Please enter a QR code string');
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
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.statusText}>Requesting camera permission...</Text>
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
          <Ionicons name="camera-outline" size={80} color="#999999" />
          <Text style={styles.errorTitle}>Camera Access Required</Text>
          <Text style={styles.errorText}>
            LifeTag needs camera access to scan QR codes containing emergency medical information.
          </Text>
          <Text style={styles.errorSubtext}>
            Please enable camera permissions in your device settings, or use manual entry below.
          </Text>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowManualEntry(true)}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Manual Entry</Text>
          </TouchableOpacity>
          
          {onClose && (
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
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
              <Ionicons name="arrow-back" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manual QR Entry</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.manualEntryContent}>
            <Text style={styles.instructionTitle}>Enter QR Code Data</Text>
            <Text style={styles.instructionText}>
              If you can't scan the QR code, you can manually enter the QR code data below. 
              This is typically a long string of text found below or beside the QR code.
            </Text>

            <TextInput
              style={styles.textInput}
              value={manualQRCode}
              onChangeText={setManualQRCode}
              placeholder="Paste or type QR code data here..."
              placeholderTextColor="#999999"
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
                  <Text style={styles.primaryButtonText}>Process QR Data</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowManualEntry(false)}
            >
              <Text style={styles.secondaryButtonText}>Back to Scanner</Text>
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
        <Text style={styles.headerTitle}>Emergency QR Scanner</Text>
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
                  <ActivityIndicator size="large" color="#FF6B6B" />
                  <Text style={styles.loadingText}>Processing QR Code...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionTitle}>
          {scanned ? 'QR Code Scanned!' : 'Position QR Code in Frame'}
        </Text>
        <Text style={styles.instructionText}>
          {scanned 
            ? 'Processing emergency medical information...'
            : 'Hold your device steady and ensure the QR code is clearly visible within the frame above.'
          }
        </Text>
        
        {scanCount > 0 && (
          <Text style={styles.scanCountText}>
            Scans completed: {scanCount}
          </Text>
        )}

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          {scanned && !isLoading && (
            <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Scan Another</Text>
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
    backgroundColor: '#000000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
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
    borderColor: '#FF6B6B',
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
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  instructionsContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  scanCountText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginVertical: 5,
  },
  secondaryButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#999999',
    opacity: 0.6,
  },
  statusText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 15,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  manualEntryContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  manualEntryContent: {
    flex: 1,
    padding: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
    marginVertical: 15,
  },
});

export default QRScanner;