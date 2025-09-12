/**
 * Audit Log Retention Utilities
 * Provides utilities for managing audit log retention and cleanup scheduling
 */

import { auditCleanupService } from '../services/auditCleanupService';

export interface RetentionPolicy {
  retentionDays: number;
  maxLogsPerProfile: number;
  cleanupSchedule: 'daily' | 'weekly' | 'manual';
  enableAutomaticCleanup: boolean;
}

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  profilesProcessed: number;
  errors: string[];
  executionTimeMs: number;
  timestamp: Date;
}

/**
 * Utility class for audit log retention management
 */
export class AuditRetentionManager {
  private cleanupIntervalId?: NodeJS.Timeout;
  private isScheduledCleanupEnabled: boolean = false;

  /**
   * Start scheduled cleanup based on policy
   */
  startScheduledCleanup(policy: RetentionPolicy): void {
    if (!policy.enableAutomaticCleanup) {
      console.log('Automatic cleanup is disabled in retention policy');
      return;
    }

    if (this.cleanupIntervalId) {
      console.log('Scheduled cleanup is already running');
      return;
    }

    const intervalMs = this.getCleanupInterval(policy.cleanupSchedule);
    
    this.cleanupIntervalId = setInterval(async () => {
      try {
        console.log('Running scheduled audit log cleanup...');
        await this.executeCleanup();
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, intervalMs);

    this.isScheduledCleanupEnabled = true;
    console.log(`Scheduled audit cleanup started (${policy.cleanupSchedule})`);
  }

  /**
   * Stop scheduled cleanup
   */
  stopScheduledCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
      this.isScheduledCleanupEnabled = false;
      console.log('Scheduled audit cleanup stopped');
    }
  }

  /**
   * Execute manual cleanup
   */
  async executeManualCleanup(profileId?: string): Promise<CleanupResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      const stats = profileId 
        ? await auditCleanupService.runProfileCleanup(profileId)
        : await auditCleanupService.runGlobalCleanup();

      return {
        success: stats.errors.length === 0,
        deletedCount: stats.totalLogsDeleted,
        profilesProcessed: stats.profilesProcessed,
        errors: stats.errors,
        executionTimeMs: Date.now() - startTime,
        timestamp
      };

    } catch (error: any) {
      return {
        success: false,
        deletedCount: 0,
        profilesProcessed: 0,
        errors: [error.message || 'Unknown cleanup error'],
        executionTimeMs: Date.now() - startTime,
        timestamp
      };
    }
  }

  /**
   * Check if cleanup is needed based on current audit log statistics
   */
  async checkCleanupNeeded(profileId?: string): Promise<{
    cleanupNeeded: boolean;
    reason?: string;
    totalLogs: number;
    oldestLogAge?: number;
  }> {
    try {
      const statsResponse = profileId 
        ? await auditCleanupService.getProfileAuditStatistics(profileId)
        : await auditCleanupService.getGlobalAuditStatistics();

      if (!statsResponse.success || !statsResponse.data) {
        return {
          cleanupNeeded: false,
          reason: 'Unable to retrieve audit statistics',
          totalLogs: 0
        };
      }

      const stats = statsResponse.data;
      const oldestLogAge = stats.oldestLog 
        ? Math.floor((Date.now() - stats.oldestLog.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Check if cleanup is needed
      const retentionDays = 365; // From CONFIG.AUDIT.RETENTION_DAYS
      const maxLogs = 1000; // From CONFIG.AUDIT.MAX_LOGS_PER_PROFILE

      if (oldestLogAge > retentionDays) {
        return {
          cleanupNeeded: true,
          reason: `Logs older than ${retentionDays} days found (oldest: ${oldestLogAge} days)`,
          totalLogs: stats.totalLogs,
          oldestLogAge
        };
      }

      if (stats.totalLogs > maxLogs) {
        return {
          cleanupNeeded: true,
          reason: `Log count (${stats.totalLogs}) exceeds maximum (${maxLogs})`,
          totalLogs: stats.totalLogs,
          oldestLogAge
        };
      }

      return {
        cleanupNeeded: false,
        reason: 'No cleanup needed at this time',
        totalLogs: stats.totalLogs,
        oldestLogAge
      };

    } catch (error: any) {
      console.error('Error checking cleanup needed:', error);
      return {
        cleanupNeeded: false,
        reason: 'Error checking cleanup status',
        totalLogs: 0
      };
    }
  }

  /**
   * Get retention status and statistics
   */
  async getRetentionStatus(profileId?: string) {
    const cleanupInfo = auditCleanupService.getCleanupInfo();
    const cleanupCheck = await this.checkCleanupNeeded(profileId);

    return {
      policy: {
        retentionDays: cleanupInfo.retentionDays,
        maxLogsPerProfile: cleanupInfo.maxLogsPerProfile
      },
      status: {
        lastCleanupRun: cleanupInfo.lastRun,
        nextRecommendedRun: cleanupInfo.nextRecommendedRun,
        isCleanupRunning: cleanupInfo.isRunning,
        isScheduledCleanupEnabled: this.isScheduledCleanupEnabled
      },
      current: {
        cleanupNeeded: cleanupCheck.cleanupNeeded,
        reason: cleanupCheck.reason,
        totalLogs: cleanupCheck.totalLogs,
        oldestLogAge: cleanupCheck.oldestLogAge
      }
    };
  }

  /**
   * Execute scheduled cleanup
   */
  private async executeCleanup(): Promise<void> {
    const isNeeded = auditCleanupService.isCleanupNeeded();
    
    if (!isNeeded) {
      console.log('Scheduled cleanup skipped - not needed at this time');
      return;
    }

    const result = await this.executeManualCleanup();
    
    if (result.success) {
      console.log(`Scheduled cleanup completed: ${result.deletedCount} logs deleted`);
    } else {
      console.error('Scheduled cleanup failed:', result.errors.join(', '));
    }
  }

  /**
   * Get cleanup interval in milliseconds
   */
  private getCleanupInterval(schedule: 'daily' | 'weekly' | 'manual'): number {
    switch (schedule) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'manual':
      default:
        return Infinity; // Never run automatically
    }
  }

  /**
   * Get status of scheduled cleanup
   */
  getScheduledCleanupStatus() {
    return {
      isEnabled: this.isScheduledCleanupEnabled,
      isRunning: this.cleanupIntervalId !== undefined
    };
  }
}

// Export utilities
export const auditRetentionManager = new AuditRetentionManager();

export default auditRetentionManager;