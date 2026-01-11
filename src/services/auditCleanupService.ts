/**
 * Audit Cleanup Service
 * Handles scheduled cleanup of audit logs based on retention policies
 */

import profileService from './profileService';
import CONFIG from '../config';

interface CleanupStats {
  totalLogsDeleted: number;
  profilesProcessed: number;
  errors: string[];
  executionTime: number;
}

export class AuditCleanupService {
  private static instance: AuditCleanupService;
  private isCleanupRunning: boolean = false;
  private lastCleanupRun?: Date;

  private constructor() {}

  static getInstance(): AuditCleanupService {
    if (!AuditCleanupService.instance) {
      AuditCleanupService.instance = new AuditCleanupService();
    }
    return AuditCleanupService.instance;
  }

  /**
   * Run cleanup for all profiles
   */
  async runGlobalCleanup(): Promise<CleanupStats> {
    if (this.isCleanupRunning) {
      throw new Error('Cleanup is already running');
    }

    this.isCleanupRunning = true;
    const startTime = Date.now();
    const stats: CleanupStats = {
      totalLogsDeleted: 0,
      profilesProcessed: 0,
      errors: [],
      executionTime: 0
    };

    try {
      console.log('Starting global audit log cleanup...');
      
      const response = await profileService.cleanupAuditLogs();
      
      if (response.success && response.data) {
        stats.totalLogsDeleted = response.data.deletedCount;
        stats.profilesProcessed = response.data.profilesProcessed ?? 1;
        this.lastCleanupRun = new Date();
        
        console.log(`Global cleanup completed: ${stats.totalLogsDeleted} logs deleted, ${stats.profilesProcessed} profiles processed`);
      } else {
        const errorMsg = response.error?.message || 'Unknown cleanup error';
        stats.errors.push(errorMsg);
        console.error('Global cleanup failed:', errorMsg);
      }

    } catch (error: any) {
      const errorMsg = error.message || 'Unexpected cleanup error';
      stats.errors.push(errorMsg);
      console.error('Global cleanup error:', error);
    } finally {
      stats.executionTime = Date.now() - startTime;
      this.isCleanupRunning = false;
    }

    return stats;
  }

  /**
   * Run cleanup for a specific profile
   */
  async runProfileCleanup(profileId: string): Promise<CleanupStats> {
    const startTime = Date.now();
    const stats: CleanupStats = {
      totalLogsDeleted: 0,
      profilesProcessed: 0,
      errors: [],
      executionTime: 0
    };

    try {
      console.log(`Starting audit log cleanup for profile ${profileId}...`);
      
      const response = await profileService.cleanupAuditLogs(profileId);
      
      if (response.success && response.data) {
        stats.totalLogsDeleted = response.data.deletedCount;
        stats.profilesProcessed = 1;
        
        console.log(`Profile cleanup completed: ${stats.totalLogsDeleted} logs deleted for profile ${profileId}`);
      } else {
        const errorMsg = response.error?.message || 'Unknown cleanup error';
        stats.errors.push(errorMsg);
        console.error(`Profile cleanup failed for ${profileId}:`, errorMsg);
      }

    } catch (error: any) {
      const errorMsg = error.message || 'Unexpected cleanup error';
      stats.errors.push(errorMsg);
      console.error(`Profile cleanup error for ${profileId}:`, error);
    } finally {
      stats.executionTime = Date.now() - startTime;
    }

    return stats;
  }

  /**
   * Get cleanup status and configuration
   */
  getCleanupInfo() {
    return {
      isRunning: this.isCleanupRunning,
      lastRun: this.lastCleanupRun,
      retentionDays: CONFIG.AUDIT.RETENTION_DAYS,
      maxLogsPerProfile: CONFIG.AUDIT.MAX_LOGS_PER_PROFILE,
      nextRecommendedRun: this.getNextRecommendedRun()
    };
  }

  /**
   * Calculate when the next cleanup should run (daily recommended)
   */
  private getNextRecommendedRun(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // Run at 2 AM
    return tomorrow;
  }

  /**
   * Check if cleanup is needed based on last run time
   */
  isCleanupNeeded(): boolean {
    if (!this.lastCleanupRun) {
      return true; // Never run before
    }

    const daysSinceLastRun = (Date.now() - this.lastCleanupRun.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastRun >= 1; // Run daily
  }

  /**
   * Get audit log statistics across all profiles
   */
  async getGlobalAuditStatistics() {
    try {
      const response = await profileService.getAuditLogStatistics();
      return response;
    } catch (error: any) {
      console.error('Error getting global audit statistics:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics for a specific profile
   */
  async getProfileAuditStatistics(profileId: string) {
    try {
      const response = await profileService.getAuditLogStatistics(profileId);
      return response;
    } catch (error: any) {
      console.error(`Error getting audit statistics for profile ${profileId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const auditCleanupService = AuditCleanupService.getInstance();
export default auditCleanupService;