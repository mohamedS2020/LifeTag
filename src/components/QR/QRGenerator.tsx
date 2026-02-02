import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../types';
import { QRService, QRCodeGenerator, EmergencyQRData } from '../../services/qrService';
import { useTheme } from '../../theme';

/**
 * QR Generator Component Props
 */
interface QRGeneratorProps {
  profile: UserProfile;
  onQRGenerated?: (qrData: string, emergencyData: EmergencyQRData) => void;
  onError?: (error: string) => void;
  size?: number;
  showControls?: boolean;
  showWarnings?: boolean;
  emergencyOnly?: boolean;
}

/**
 * QR Generator Component
 * Creates QR codes from user profile data with emergency information
 */
export const QRGenerator: React.FC<QRGeneratorProps> = ({
  profile,
  onQRGenerated,
  onError,
  size = 250,
  showControls = true,
  showWarnings = true,
  emergencyOnly = false
}) => {
  const { colors, spacing, borderRadius, typography, shadows } = useTheme();
  const [qrData, setQrData] = useState<string>('');
  const [emergencyData, setEmergencyData] = useState<EmergencyQRData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [qrRef, setQrRef] = useState<any>(null);

  /**
   * Generate QR code from profile
   */
  const generateQRCode = async () => {
    if (!profile) {
      const errorMsg = 'No profile data available for QR generation';
      onError?.(errorMsg);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate QR code with optimal settings
      const result = QRCodeGenerator.generateForProfile(profile, {
        emergencyOnly,
        includeProfileId: !emergencyOnly,
        compressData: true
      });

      setQrData(result.qrData);
      setEmergencyData(result.emergencyData);
      setWarnings(result.warnings);
      setLastGenerated(new Date());

      // Callback with generated data
      onQRGenerated?.(result.qrData, result.emergencyData);

      // Log successful generation
      console.log('QR Code generated successfully', {
        dataLength: result.qrData.length,
        isOptimized: result.isOptimized,
        warningCount: result.warnings.length
      });

    } catch (error) {
      const errorMsg = `Failed to generate QR code: ${error}`;
      console.error('QR Generation Error:', error);
      onError?.(errorMsg);
      
      Alert.alert(
        'QR Generation Failed',
        errorMsg,
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Regenerate QR code if profile has changed
   */
  const checkForRegeneration = () => {
    if (qrData && profile) {
      const shouldRegenerate = QRCodeGenerator.shouldRegenerateQR(qrData, profile);
      if (shouldRegenerate) {
        generateQRCode();
      }
    }
  };

  /**
   * Share QR code as image or text
   */
  const shareQRCode = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, share the QR data as text
        await Share.share({
          message: `Emergency Medical Information QR Code Data:\n\n${qrData}\n\nScan this QR code to access emergency medical information.`,
          title: 'Emergency Medical QR Code'
        });
      } else {
        // For mobile, we could implement image sharing
        // For now, share as text data
        await Share.share({
          message: qrData,
          title: 'Emergency Medical QR Code'
        });
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Share Failed', 'Unable to share QR code');
    }
  };

  /**
   * Copy QR data to clipboard (fallback for sharing)
   */
  const copyQRData = () => {
    // Note: Clipboard functionality would need expo-clipboard
    Alert.alert(
      'QR Data',
      qrData,
      [
        { text: 'OK' }
      ]
    );
  };

  /**
   * Show QR code details/information
   */
  const showQRDetails = () => {
    if (!emergencyData) return;

    const details = [
      `Name: ${emergencyData.name}`,
      emergencyData.bloodType ? `Blood Type: ${emergencyData.bloodType}` : null,
      emergencyData.allergies.length > 0 ? `Allergies: ${emergencyData.allergies.join(', ')}` : null,
      emergencyData.emergencyContact ? 
        `Emergency Contact: ${emergencyData.emergencyContact.name} (${emergencyData.emergencyContact.phone})` : null,
      emergencyData.emergencyNote ? `Note: ${emergencyData.emergencyNote}` : null,
      `Generated: ${lastGenerated?.toLocaleString()}`
    ].filter(Boolean).join('\n\n');

    Alert.alert('QR Code Information', details, [{ text: 'OK' }]);
  };

  // Generate QR code on component mount and profile changes
  useEffect(() => {
    generateQRCode();
  }, [profile.id, emergencyOnly]);

  // Check for regeneration when profile updates
  useEffect(() => {
    checkForRegeneration();
  }, [profile.updatedAt]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    contentContainer: {
      alignItems: 'center',
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: 5,
    },
    qrContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    qrCodeWrapper: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    qrBorder: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: colors.border.default,
      borderRadius: 10,
      top: -10,
      left: -10,
    },
    qrPlaceholder: {
      borderWidth: 2,
      borderColor: colors.border.default,
      borderStyle: 'dashed',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.secondary,
    },
    generatingText: {
      marginTop: 10,
      fontSize: 16,
      color: colors.text.secondary,
    },
    placeholderText: {
      marginTop: 10,
      fontSize: 16,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
    summaryContainer: {
      backgroundColor: colors.background.secondary,
      padding: 15,
      borderRadius: 10,
      width: '100%',
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 10,
    },
    summaryText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 5,
    },
    warningsContainer: {
      backgroundColor: colors.status.warning.light,
      padding: 15,
      borderRadius: 10,
      width: '100%',
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: colors.status.warning.main,
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    warningTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.status.warning.main,
      marginLeft: 8,
    },
    warningText: {
      fontSize: 14,
      color: colors.status.warning.main,
      marginBottom: 5,
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 20,
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary.main,
    },
    controlButtonText: {
      color: colors.primary.main,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 5,
    },
    infoContainer: {
      alignItems: 'center',
    },
    infoText: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginBottom: 2,
    },
  }), [colors, spacing, borderRadius, typography, shadows]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Medical QR Code</Text>
        <Text style={styles.subtitle}>
          {emergencyOnly ? 'Emergency Info Only' : 'Complete Profile Access'}
        </Text>
      </View>

      {/* QR Code Display */}
      <View style={styles.qrContainer}>
        {isGenerating ? (
          <View style={[styles.qrPlaceholder, { width: size, height: size }]}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.generatingText}>Generating QR Code...</Text>
          </View>
        ) : qrData ? (
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={qrData}
              size={size}
              color="#000000"
              backgroundColor="#FFFFFF"
              logoSize={30}
              logoBackgroundColor="transparent"
              getRef={(ref) => setQrRef(ref)}
            />
            
            {/* QR Code Border */}
            <View style={[styles.qrBorder, { width: size + 20, height: size + 20 }]} />
          </View>
        ) : (
          <View style={[styles.qrPlaceholder, { width: size, height: size }]}>
            <Ionicons name="qr-code-outline" size={60} color={colors.text.tertiary} />
            <Text style={styles.placeholderText}>No QR Code Generated</Text>
          </View>
        )}
      </View>

      {/* Emergency Data Summary */}
      {emergencyData && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Emergency Information</Text>
          <Text style={styles.summaryText}>Name: {emergencyData.name}</Text>
          {emergencyData.bloodType && (
            <Text style={styles.summaryText}>Blood Type: {emergencyData.bloodType}</Text>
          )}
          {emergencyData.allergies.length > 0 && (
            <Text style={styles.summaryText}>
              Allergies: {emergencyData.allergies.slice(0, 3).join(', ')}
              {emergencyData.allergies.length > 3 && '...'}
            </Text>
          )}
          {emergencyData.emergencyContact && (
            <Text style={styles.summaryText}>
              Contact: {emergencyData.emergencyContact.name}
            </Text>
          )}
        </View>
      )}

      {/* Warnings */}
      {showWarnings && warnings.length > 0 && (
        <View style={styles.warningsContainer}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color="#FF9500" />
            <Text style={styles.warningTitle}>Recommendations</Text>
          </View>
          {warnings.map((warning, index) => (
            <Text key={index} style={styles.warningText}>
              • {warning}
            </Text>
          ))}
        </View>
      )}

      {/* Controls */}
      {showControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={generateQRCode}
            disabled={isGenerating}
          >
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.controlButtonText}>Regenerate</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={showQRDetails}
            disabled={!emergencyData}
          >
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.controlButtonText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={shareQRCode}
            disabled={!qrData}
          >
            <Ionicons name="share" size={20} color="#007AFF" />
            <Text style={styles.controlButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Generation Info */}
      {lastGenerated && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Generated: {lastGenerated.toLocaleString()}
          </Text>
          <Text style={styles.infoText}>
            Data Length: {qrData.length} characters
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default QRGenerator;