// TypeScript Type Definitions
// This directory contains TypeScript interfaces and type definitions

export interface User {
  id: string;
  email: string;
  userType: 'individual' | 'medical_professional';
  isVerified?: boolean;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bloodType?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  emergencyContacts?: EmergencyContact[];
  password?: string;
  extraInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface MedicalProfessional {
  id: string;
  userId: string;
  name: string;
  email: string;
  licenseNumber: string;
  isVerified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  profileId: string;
  accessedBy: string;
  accessType: 'emergency' | 'full';
  userType: 'anonymous' | 'medical_professional' | 'individual';
  timestamp: Date;
  location?: string;
}
