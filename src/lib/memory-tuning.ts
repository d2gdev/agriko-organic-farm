import { logger } from './logger';
import { updateGlobalMemoryLimit, getGlobalCacheStatus } from './global-cache-coordinator';

// Memory tuning configuration
interface MemoryProfile {
  name: string;
  description: string;
  totalMemoryMB: number;
  cacheMemoryMB: number;
  nodeMemoryMB: number;
  recommendations: string[];
}

// Predefined memory profiles for different instance sizes
const MEMORY_PROFILES: Record<string, MemoryProfile> = {
  'micro': {
    name: 'Micro Instance',
    description: 'For small development or testing (512MB total)',
    totalMemoryMB: 512,
    cacheMemoryMB: 50,
    nodeMemoryMB: 256,
    recommendations: [
      'Suitable for development only',
      'Limited concurrent users',
      'Consider upgrading for production'
    ]
  },
  'small': {
    name: 'Small Instance',
    description: 'For small production sites (1GB total)',
    totalMemoryMB: 1024,
    cacheMemoryMB: 100,
    nodeMemoryMB: 512,
    recommendations: [
      'Good for < 1000 daily users',
      'Single instance deployment',
      'Monitor memory usage closely'
    ]
  },
  'medium': {
    name: 'Medium Instance',
    description: 'For medium production sites (2GB total)',
    totalMemoryMB: 2048,
    cacheMemoryMB: 200,
    nodeMemoryMB: 1024,
    recommendations: [
      'Good for 1000-10000 daily users',
      'Can handle moderate traffic spikes',
      'Consider load balancing for growth'
    ]
  },
  'large': {
    name: 'Large Instance',
    description: 'For large production sites (4GB total)',
    totalMemoryMB: 4096,
    cacheMemoryMB: 400,
    nodeMemoryMB: 2048,
    recommendations: [
      'Good for 10000+ daily users',
      'Handles high traffic well',
      'Suitable for multi-instance deployment'
    ]
  },
  'xlarge': {
    name: 'Extra Large Instance',
    description: 'For enterprise deployments (8GB+ total)',
    totalMemoryMB: 8192,
    cacheMemoryMB: 800,
    nodeMemoryMB: 4096,
    recommendations: [
      'Enterprise-grade capacity',
      'High availability deployments',
      'Suitable for distributed architecture'
    ]
  }
};

// Memory monitoring and tuning system
export class MemoryTuningSystem {
  private static instance: MemoryTuningSystem;
  private currentProfile: MemoryProfile | null = null;
  private autoTuningEnabled = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private memoryHistory: Array<{
    timestamp: number;
    used: number;
    free: number;
    cached: number;
  }> = [];

  static getInstance(): MemoryTuningSystem {
    if (!MemoryTuningSystem.instance) {
      MemoryTuningSystem.instance = new MemoryTuningSystem();
    }
    return MemoryTuningSystem.instance;
  }

  /**
   * Initialize memory tuning system
   */
  initialize(): void {
    this.detectSystemMemory();
    this.applyOptimalProfile();
    this.startMonitoring();
    
    logger.info('Memory tuning system initialized', {
      profile: this.currentProfile?.name,
      autoTuning: this.autoTuningEnabled
    });
  }

  /**
   * Detect system memory and recommend profile
   */
  private detectSystemMemory(): void {
    try {
      const totalMemoryBytes = process.memoryUsage().rss;
      const totalMemoryMB = Math.round(totalMemoryBytes / (1024 * 1024));
      
      // Try to get actual system memory if available
      let systemMemoryMB = totalMemoryMB;
      
      if (typeof process.env.SYSTEM_MEMORY_MB !== 'undefined') {
        systemMemoryMB = parseInt(process.env.SYSTEM_MEMORY_MB);
      }

      logger.info(`System memory detection`, {
        processMemoryMB: totalMemoryMB,
        estimatedSystemMemoryMB: systemMemoryMB
      });

      // Recommend profile based on system memory
      const recommendedProfile = this.getRecommendedProfile(systemMemoryMB);
      
      if (recommendedProfile) {
        logger.info(`Recommended memory profile: ${recommendedProfile.name}`, {
          reason: `Based on ${systemMemoryMB}MB system memory`
        });
      }
      
    } catch (error) {
      logger.error('Error detecting system memory:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Get recommended profile based on available memory
   */
  private getRecommendedProfile(memoryMB: number): MemoryProfile | null {
    if (memoryMB <= 512) return MEMORY_PROFILES.micro ?? null;
    if (memoryMB <= 1024) return MEMORY_PROFILES.small ?? null;
    if (memoryMB <= 2048) return MEMORY_PROFILES.medium ?? null;
    if (memoryMB <= 4096) return MEMORY_PROFILES.large ?? null;
    return MEMORY_PROFILES.xlarge ?? null;
  }

  /**
   * Apply optimal memory profile
   */
  applyOptimalProfile(): void {
    // Check if profile is manually set via environment
    const manualProfile = process.env.MEMORY_PROFILE;
    
    if (manualProfile && MEMORY_PROFILES[manualProfile]) {
      this.applyProfile(manualProfile);
      return;
    }

    // Auto-detect optimal profile
    const totalMemoryBytes = process.memoryUsage().rss;
    const totalMemoryMB = Math.round(totalMemoryBytes / (1024 * 1024)) * 4; // Estimate system memory
    
    const profile = this.getRecommendedProfile(totalMemoryMB);
    if (profile) {
      const profileKey = Object.keys(MEMORY_PROFILES).find(
        key => MEMORY_PROFILES[key]?.name === profile.name
      );
      if (profileKey) {
        this.applyProfile(profileKey);
      }
    }
  }

  /**
   * Apply specific memory profile
   */
  applyProfile(profileKey: string): void {
    const profile = MEMORY_PROFILES[profileKey];
    if (!profile) {
      logger.error(`Unknown memory profile: ${profileKey}`);
      return;
    }

    this.currentProfile = profile;
    
    // Apply cache memory limits
    updateGlobalMemoryLimit(profile.cacheMemoryMB);
    
    // Set Node.js memory limits if not already set
    if (!process.env.NODE_OPTIONS?.includes('max-old-space-size')) {
      logger.info(`Recommending Node.js max-old-space-size: ${profile.nodeMemoryMB}MB`);
      logger.info('Add to your startup script: --max-old-space-size=' + profile.nodeMemoryMB);
    }

    logger.info(`Applied memory profile: ${profile.name}`, {
      totalMemoryMB: profile.totalMemoryMB,
      cacheMemoryMB: profile.cacheMemoryMB,
      nodeMemoryMB: profile.nodeMemoryMB
    });
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    const interval = parseInt(process.env.MEMORY_MONITORING_INTERVAL ?? '60000'); // 1 minute default
    
    this.monitoringInterval = setInterval(() => {
      this.recordMemoryUsage();
      this.analyzeMemoryTrends();
    }, interval);
  }

  /**
   * Record current memory usage
   */
  private recordMemoryUsage(): void {
    try {
      const memUsage = process.memoryUsage();
      const cacheStatus = getGlobalCacheStatus();
      
      const record = {
        timestamp: Date.now(),
        used: Math.round(memUsage.rss / (1024 * 1024)), // MB
        free: Math.round(memUsage.heapTotal - memUsage.heapUsed) / (1024 * 1024), // MB
        cached: cacheStatus.totalMemoryMB
      };

      this.memoryHistory.push(record);
      
      // Keep only last 24 hours of data
      const cutoff = Date.now() - (24 * 60 * 60 * 1000);
      this.memoryHistory = this.memoryHistory.filter(r => r.timestamp > cutoff);
      
    } catch (error) {
      logger.error('Error recording memory usage:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Analyze memory trends and suggest optimizations
   */
  private analyzeMemoryTrends(): void {
    if (this.memoryHistory.length < 10) return; // Need some data

    try {
      const recent = this.memoryHistory.slice(-10);
      const avgUsed = recent.reduce((sum, r) => sum + r.used, 0) / recent.length;
      const _maxUsed = Math.max(...recent.map(r => r.used));
      void _maxUsed; // Preserved for future memory spike analysis
      
      if (!this.currentProfile) return;

      // Check if consistently over profile limits
      const profileLimit = this.currentProfile.totalMemoryMB * 0.8; // 80% of profile limit
      
      if (avgUsed > profileLimit) {
        logger.warn('Memory usage consistently above profile limits', {
          avgUsedMB: Math.round(avgUsed),
          profileLimitMB: Math.round(profileLimit),
          recommendation: 'Consider upgrading to a larger memory profile'
        });
        
        this.suggestProfileUpgrade();
      }

      // Check for memory leaks (steadily increasing usage)
      if (recent.length >= 10) {
        const trend = this.calculateMemoryTrend(recent);
        if (trend > 5) { // More than 5MB increase per hour
          logger.warn('Potential memory leak detected', {
            trendMBPerHour: Math.round(trend),
            recommendation: 'Monitor for memory leaks and restart if necessary'
          });
        }
      }
      
    } catch (error) {
      logger.error('Error analyzing memory trends:', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Calculate memory usage trend (MB per hour)
   */
  private calculateMemoryTrend(data: typeof this.memoryHistory): number {
    if (data.length < 2) return 0;

    const first = data[0];
    const last = data[data.length - 1];
    
    // Add safety checks
    if (!first || !last) return 0;
    
    const timeDiffHours = (last.timestamp - first.timestamp) / (1000 * 60 * 60);
    const memoryDiffMB = last.used - first.used;

    return timeDiffHours > 0 ? memoryDiffMB / timeDiffHours : 0;
  }

  /**
   * Suggest profile upgrade
   */
  private suggestProfileUpgrade(): void {
    if (!this.currentProfile) return;

    const profiles = Object.entries(MEMORY_PROFILES);
    const currentIndex = profiles.findIndex(([, profile]) => profile.name === this.currentProfile?.name);
    
    if (currentIndex >= 0 && currentIndex < profiles.length - 1) {
      const nextProfileEntry = profiles[currentIndex + 1];
      if (nextProfileEntry) {
        const [_nextKey, nextProfile] = nextProfileEntry;
        void _nextKey; // Key not needed for logging
        logger.info('Recommending memory profile upgrade', {
          current: this.currentProfile.name,
          recommended: nextProfile.name,
          benefit: `+${nextProfile.totalMemoryMB - this.currentProfile.totalMemoryMB}MB capacity`
        });
      }
    }
  }

  /**
   * Get current memory status
   */
  getMemoryStatus(): {
    profile: MemoryProfile | null;
    current: {
      usedMB: number;
      freeMB: number;
      cachedMB: number;
    };
    trends: {
      avgUsedMB: number;
      peakUsedMB: number;
      trendMBPerHour: number;
    };
    recommendations: string[];
  } {
    const memUsage = process.memoryUsage();
    const cacheStatus = getGlobalCacheStatus();
    
    let trends = {
      avgUsedMB: 0,
      peakUsedMB: 0,
      trendMBPerHour: 0
    };

    const recommendations: string[] = [];

    if (this.memoryHistory.length > 0) {
      const recent = this.memoryHistory.slice(-24); // Last 24 records
      trends = {
        avgUsedMB: Math.round(recent.reduce((sum, r) => sum + r.used, 0) / recent.length),
        peakUsedMB: Math.max(...recent.map(r => r.used)),
        trendMBPerHour: Math.round(this.calculateMemoryTrend(recent) * 100) / 100
      };
    }

    // Generate recommendations
    if (this.currentProfile) {
      const usagePercent = (trends.avgUsedMB / this.currentProfile.totalMemoryMB) * 100;
      
      if (usagePercent > 80) {
        recommendations.push('Consider upgrading to a larger memory profile');
      }
      if (trends.trendMBPerHour > 5) {
        recommendations.push('Monitor for potential memory leaks');
      }
      if (cacheStatus.utilizationPercent > 90) {
        recommendations.push('Cache memory usage is high - consider cleanup');
      }
    }

    return {
      profile: this.currentProfile,
      current: {
        usedMB: Math.round(memUsage.rss / (1024 * 1024)),
        freeMB: Math.round((memUsage.heapTotal - memUsage.heapUsed) / (1024 * 1024)),
        cachedMB: cacheStatus.totalMemoryMB
      },
      trends,
      recommendations
    };
  }

  /**
   * Get available memory profiles
   */
  getAvailableProfiles(): Record<string, MemoryProfile> {
    return { ...MEMORY_PROFILES };
  }

  /**
   * Manually set memory profile
   */
  setProfile(profileKey: string): boolean {
    if (!MEMORY_PROFILES[profileKey]) {
      return false;
    }

    this.applyProfile(profileKey);
    return true;
  }

  /**
   * Enable/disable auto-tuning
   */
  setAutoTuning(enabled: boolean): void {
    this.autoTuningEnabled = enabled;
    logger.info(`Memory auto-tuning ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance and utility functions
export const memoryTuner = MemoryTuningSystem.getInstance();

export const initializeMemoryTuning = () => memoryTuner.initialize();
export const getMemoryStatus = () => memoryTuner.getMemoryStatus();
export const getAvailableProfiles = () => memoryTuner.getAvailableProfiles();
export const setMemoryProfile = (profile: string) => memoryTuner.setProfile(profile);
export const setAutoTuning = (enabled: boolean) => memoryTuner.setAutoTuning(enabled);