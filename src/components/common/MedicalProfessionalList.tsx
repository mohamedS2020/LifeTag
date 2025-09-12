import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicalProfessional } from '../../types';
import { MedicalProfessionalApprovalService } from '../../services/medicalProfessionalApprovalService';
import { VerifiedBadge, VerifiedProfessionalIndicator } from '../common';

/**
 * Props for MedicalProfessionalList component
 */
interface MedicalProfessionalListProps {
  showOnlyVerified?: boolean;
  onProfessionalPress?: (professional: MedicalProfessional) => void;
  searchQuery?: string;
  compactView?: boolean;
  showVerificationDetails?: boolean;
}

/**
 * MedicalProfessionalList Component
 * 
 * Displays a list of medical professionals with verification badges
 * - Shows verified and pending professionals
 * - Includes verification status and professional details
 * - Supports search filtering and compact/detailed views
 * - Handles refresh and loading states
 */
const MedicalProfessionalList: React.FC<MedicalProfessionalListProps> = ({
  showOnlyVerified = false,
  onProfessionalPress,
  searchQuery = '',
  compactView = false,
  showVerificationDetails = true,
}) => {
  // State management
  const [professionals, setProfessionals] = useState<MedicalProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load professionals on component mount
   */
  useEffect(() => {
    loadProfessionals();
  }, [showOnlyVerified]);

  /**
   * Filter professionals based on search query
   */
  useEffect(() => {
    if (searchQuery) {
      filterProfessionals();
    } else {
      loadProfessionals();
    }
  }, [searchQuery]);

  /**
   * Load professionals from service
   */
  const loadProfessionals = async () => {
    try {
      setError(null);
      let loadedProfessionals: MedicalProfessional[] = [];

      if (showOnlyVerified) {
        loadedProfessionals = await MedicalProfessionalApprovalService.getVerifiedProfessionals();
      } else {
        loadedProfessionals = await MedicalProfessionalApprovalService.getAllProfessionals();
      }

      setProfessionals(loadedProfessionals);
    } catch (error) {
      console.error('Error loading professionals:', error);
      setError('Failed to load medical professionals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Filter professionals based on search query
   */
  const filterProfessionals = async () => {
    try {
      const allProfessionals = await MedicalProfessionalApprovalService.getAllProfessionals();
      
      const filtered = allProfessionals.filter(professional => {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${professional.personalInfo.firstName} ${professional.personalInfo.lastName}`.toLowerCase();
        const specialty = professional.professionalInfo.specialty?.toLowerCase() || '';
        const hospital = professional.professionalInfo.hospitalAffiliation?.toLowerCase() || '';
        const license = professional.professionalInfo.licenseNumber?.toLowerCase() || '';
        
        return fullName.includes(searchLower) ||
               specialty.includes(searchLower) ||
               hospital.includes(searchLower) ||
               license.includes(searchLower);
      });

      // Apply verification filter if needed
      const finalFiltered = showOnlyVerified 
        ? filtered.filter(p => p.verificationStatus.isVerified)
        : filtered;

      setProfessionals(finalFiltered);
    } catch (error) {
      console.error('Error filtering professionals:', error);
      setError('Failed to filter medical professionals');
    }
  };

  /**
   * Handle refresh action
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadProfessionals();
  };

  /**
   * Handle professional item press
   */
  const handleProfessionalPress = (professional: MedicalProfessional) => {
    onProfessionalPress?.(professional);
  };

  /**
   * Format years of experience
   */
  const formatExperience = (years?: number): string => {
    if (!years) return '';
    return years === 1 ? '1 year exp.' : `${years} years exp.`;
  };

  /**
   * Render professional item (compact view)
   */
  const renderCompactItem = ({ item }: { item: MedicalProfessional }) => (
    <TouchableOpacity
      style={styles.compactItem}
      onPress={() => handleProfessionalPress(item)}
    >
      <View style={styles.compactContent}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactName}>
            {item.personalInfo.firstName} {item.personalInfo.lastName}
          </Text>
          <VerifiedBadge
            isVerified={item.verificationStatus.isVerified}
            size="small"
            showText={false}
            iconOnly
          />
        </View>
        
        <Text style={styles.compactSpecialty}>
          {item.professionalInfo.specialty || 'General Practice'}
        </Text>
        
        {item.professionalInfo.hospitalAffiliation && (
          <Text style={styles.compactHospital}>
            {item.professionalInfo.hospitalAffiliation}
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
    </TouchableOpacity>
  );

  /**
   * Render professional item (detailed view)
   */
  const renderDetailedItem = ({ item }: { item: MedicalProfessional }) => (
    <TouchableOpacity
      style={styles.detailedItem}
      onPress={() => handleProfessionalPress(item)}
    >
      <View style={styles.detailedHeader}>
        <View style={styles.professionalNameSection}>
          <Text style={styles.detailedName}>
            {item.personalInfo.firstName} {item.personalInfo.lastName}
          </Text>
          <VerifiedBadge
            isVerified={item.verificationStatus.isVerified}
            size="medium"
            verifiedAt={item.verificationStatus.verifiedAt}
          />
        </View>
      </View>

      <View style={styles.detailedContent}>
        <View style={styles.detailRow}>
          <Ionicons name="medical" size={16} color="#666666" />
          <Text style={styles.detailText}>
            {item.professionalInfo.specialty || 'General Practice'}
          </Text>
        </View>

        {item.professionalInfo.hospitalAffiliation && (
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color="#666666" />
            <Text style={styles.detailText}>
              {item.professionalInfo.hospitalAffiliation}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="document-text" size={16} color="#666666" />
          <Text style={styles.detailText}>
            License: {item.professionalInfo.licenseNumber}
            {item.professionalInfo.licenseState && ` (${item.professionalInfo.licenseState})`}
          </Text>
        </View>

        {item.professionalInfo.yearsOfExperience && (
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#666666" />
            <Text style={styles.detailText}>
              {formatExperience(item.professionalInfo.yearsOfExperience)}
            </Text>
          </View>
        )}

        {showVerificationDetails && item.verificationStatus.verifiedAt && (
          <View style={styles.verificationInfo}>
            <Text style={styles.verificationText}>
              Verified {item.verificationStatus.verifiedAt.toLocaleDateString()}
              {item.verificationStatus.verifiedBy && ` by ${item.verificationStatus.verifiedBy}`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>
        {searchQuery 
          ? 'No professionals found' 
          : showOnlyVerified 
            ? 'No verified professionals'
            : 'No medical professionals'
        }
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : showOnlyVerified
            ? 'No medical professionals have been verified yet'
            : 'No medical professionals have registered yet'
        }
      </Text>
    </View>
  );

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading professionals...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#DC3545" />
        <Text style={styles.errorTitle}>Error Loading Professionals</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfessionals}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={professionals}
        keyExtractor={(item) => item.id}
        renderItem={compactView ? renderCompactItem : renderDetailedItem}
        contentContainerStyle={professionals.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

/**
 * Styles for MedicalProfessionalList component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  compactContent: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },
  compactSpecialty: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  compactHospital: {
    fontSize: 12,
    color: '#999999',
  },
  detailedItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  detailedHeader: {
    marginBottom: 12,
  },
  professionalNameSection: {
    marginBottom: 8,
  },
  detailedName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  detailedContent: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  verificationInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  verificationText: {
    fontSize: 12,
    color: '#28A745',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MedicalProfessionalList;