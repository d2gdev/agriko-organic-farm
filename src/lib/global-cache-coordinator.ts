import { logger } from './logger';

// Global cache coordination for memory management
interface CacheInstance {
  id: string;
  name: string;
  priority: number; // Higher number = higher priority (less likely to be evicted)
  getCurrentSize(): number;
  getMaxSize(): number;
  getStats(): {
    size: number;
    maxSize: number;
    utilizationPercent: number;
    [key: string]: string | number | boolean | undefined;
  };
  cleanup?(aggressive?: boolean): void;
  clear(): void;
  destroy?(): void;
}

interface GlobalCacheConfig {
  maxGlobalMemoryMB: number;
  warningThresholdPercent: number;
  criticalThresholdPercent: number;
  monitoringInterval: number; // milliseconds
  emergencyCleanupInterval: number; // milliseconds
  maxCacheInstances: number;
}

/**
 * Global cache coordinator for managing memory usage across all cache instances
 */
export class GlobalCacheCoordinator {
  private static instance: GlobalCacheCoordinator;
  private caches = new Map<string, CacheInstance>();
  private config: GlobalCacheConfig;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private lastCleanupTime = 0;
  private emergencyMode = false;
  private totalEvictions = 0;
  private memoryWarnings = 0;

  private constructor() {
    this.config = this.loadConfig();
    this.startMonitoring();
    this.setupShutdownHandlers();
  }

  static getInstance(): GlobalCacheCoordinator {
    if (!GlobalCacheCoordinator.instance) {
      GlobalCacheCoordinator.instance = new GlobalCacheCoordinator();
    }
    return GlobalCacheCoordinator.instance;
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): GlobalCacheConfig {
    return {
      maxGlobalMemoryMB: parseInt(process.env.MAX_CACHE_MEMORY_MB ?? '100'), // 100MB default
      warningThresholdPercent: parseInt(process.env.CACHE_WARNING_THRESHOLD ?? '80'),
      criticalThresholdPercent: parseInt(process.env.CACHE_CRITICAL_THRESHOLD ?? '90'),
      monitoringInterval: parseInt(process.env.CACHE_MONITORING_INTERVAL ?? '30000'), // 30 seconds
      emergencyCleanupInterval: parseInt(process.env.CACHE_EMERGENCY_CLEANUP_INTERVAL ?? '5000'), // 5 seconds
      maxCacheInstances: parseInt(process.env.MAX_CACHE_INSTANCES ?? '20')
    };
  }

  /**
   * Register a cache instance for global coordination
   */
  registerCache(cache: CacheInstance): void {
    if (this.caches.size >= this.config.maxCacheInstances) {
      logger.warn(`Maximum cache instances reached (${this.config.maxCacheInstances}), rejecting new cache: ${cache.name}`);
      return;
    }

    if (this.caches.has(cache.id)) {
      logger.warn(`Cache with ID ${cache.id} already registered, updating registration`);
    }

    this.caches.set(cache.id, cache);
    logger.info(`Cache registered: ${cache.name} (${cache.id})`, {
      priority: cache.priority,
      maxSize: cache.getMaxSize(),
      totalCaches: this.caches.size
    });

    // Immediate memory check after registration
    this.checkMemoryUsage();
  }

  /**
   * Unregister a cache instance
   */
  unregisterCache(cacheId: string): void {
    const cache = this.caches.get(cacheId);
    if (cache) {
      this.caches.delete(cacheId);
      logger.info(`Cache unregistered: ${cache.name} (${cacheId})`);
    }
  }

  /**
   * Get total memory usage across all caches (estimated)
   */
  private getTotalMemoryUsageMB(): number {
    let totalSize = 0;
    
    for (const cache of this.caches.values()) {
      try {
        // Estimate memory usage based on cache size
        // This is a rough estimate - in production, you might want more precise measurement
        const stats = cache.getStats();
        const itemCount = stats.size;
        const estimatedBytesPerItem = 1024; // 1KB average per cache item (adjust based on your data)
        totalSize += itemCount * estimatedBytesPerItem;
      } catch (error) {
        logger.error(`Error getting stats for cache ${cache.id}:`, error as Record<string, unknown>);
      }
    }
    
    return totalSize / (1024 * 1024); // Convert to MB
  }

  /**
   * Check current memory usage and take action if needed
   */
  private checkMemoryUsage(): void {
    const totalMemoryMB = this.getTotalMemoryUsageMB();
    const memoryUtilization = (totalMemoryMB / this.config.maxGlobalMemoryMB) * 100;

    // Log memory status periodically
    const shouldLogStatus = Date.now() - this.lastCleanupTime > 60000; // Log every minute
    if (shouldLogStatus) {
      logger.debug(`Global cache memory usage: ${totalMemoryMB.toFixed(2)}MB / ${this.config.maxGlobalMemoryMB}MB (${memoryUtilization.toFixed(1)}%)`);
    }

    if (memoryUtilization >= this.config.criticalThresholdPercent) {
      this.handleCriticalMemoryUsage(totalMemoryMB, memoryUtilization);
    } else if (memoryUtilization >= this.config.warningThresholdPercent) {
      this.handleWarningMemoryUsage(totalMemoryMB, memoryUtilization);
    } else if (this.emergencyMode) {
      // Exit emergency mode
      this.emergencyMode = false;
      logger.info('Exiting cache emergency mode - memory usage normalized');
    }
  }

  /**
   * Handle warning level memory usage
   */
  private handleWarningMemoryUsage(totalMemoryMB: number, utilizationPercent: number): void {
    this.memoryWarnings++;
    
    logger.warn(`Cache memory usage warning: ${totalMemoryMB.toFixed(2)}MB (${utilizationPercent.toFixed(1)}%)`, {
      threshold: this.config.warningThresholdPercent,
      warningCount: this.memoryWarnings
    });

    // Perform gentle cleanup on lower priority caches
    this.performCleanup(false);
  }

  /**
   * Handle critical memory usage
   */
  private handleCriticalMemoryUsage(totalMemoryMB: number, utilizationPercent: number): void {
    this.emergencyMode = true;
    
    logger.error(`Critical cache memory usage: ${totalMemoryMB.toFixed(2)}MB (${utilizationPercent.toFixed(1)}%)`, {
      threshold: this.config.criticalThresholdPercent,
      emergencyMode: true
    });

    // Perform aggressive cleanup
    this.performCleanup(true);
  }

  /**
   * Perform coordinated cleanup across cache instances
   */
  private performCleanup(aggressive = false): void {
    const now = Date.now();
    this.lastCleanupTime = now;

    // Sort caches by priority (lowest first for cleanup)
    const sortedCaches = Array.from(this.caches.values()).sort((a, b) => a.priority - b.priority);
    
    let cleanedUp = false;
    let totalItemsEvicted = 0;

    for (const cache of sortedCaches) {
      try {
        const statsBefore = cache.getStats();
        
        // Try cleanup method first
        if (cache.cleanup) {
          cache.cleanup(aggressive);
          cleanedUp = true;
        }
        
        // If aggressive cleanup and still over memory limit, clear lower priority caches
        if (aggressive && cache.priority < 5) {
          const memoryAfterCleanup = this.getTotalMemoryUsageMB();
          const utilizationAfterCleanup = (memoryAfterCleanup / this.config.maxGlobalMemoryMB) * 100;
          
          if (utilizationAfterCleanup > this.config.criticalThresholdPercent * 0.8) {
            logger.warn(`Clearing low-priority cache due to critical memory usage: ${cache.name}`);
            cache.clear();
            cleanedUp = true;
          }
        }
        
        const statsAfter = cache.getStats();
        const itemsEvicted = statsBefore.size - statsAfter.size;
        totalItemsEvicted += itemsEvicted;
        
        if (itemsEvicted > 0) {
          logger.debug(`Cache cleanup: ${cache.name} evicted ${itemsEvicted} items`);
        }
        
      } catch (error) {
        logger.error(`Error during cache cleanup for ${cache.id}:`, error as Record<string, unknown>);
      }
    }

    if (cleanedUp) {
      this.totalEvictions += totalItemsEvicted;
      logger.info(`Global cache cleanup completed`, {
        aggressive,
        itemsEvicted: totalItemsEvicted,
        totalEvictions: this.totalEvictions,
        remainingMemoryMB: this.getTotalMemoryUsageMB().toFixed(2)
      });
    }
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    const interval = this.emergencyMode ? 
      this.config.emergencyCleanupInterval : 
      this.config.monitoringInterval;

    this.monitoringTimer = setInterval(() => {
      this.checkMemoryUsage();
    }, interval);

    logger.info(`Global cache monitoring started (interval: ${interval}ms)`);
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdown = () => {
      logger.info('Shutting down global cache coordinator...');
      
      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer);
        this.monitoringTimer = null;
      }

      // Destroy all registered caches
      for (const cache of this.caches.values()) {
        try {
          if (cache.destroy) {
            cache.destroy();
          }
        } catch (error) {
          logger.error(`Error destroying cache ${cache.id}:`, error as Record<string, unknown>);
        }
      }

      this.caches.clear();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('beforeExit', shutdown);
  }

  /**
   * Get comprehensive status of all caches
   */
  getGlobalStatus(): {
    totalMemoryMB: number;
    maxMemoryMB: number;
    utilizationPercent: number;
    cacheCount: number;
    emergencyMode: boolean;
    totalEvictions: number;
    memoryWarnings: number;
    caches: Array<{
      id: string;
      name: string;
      priority: number;
      size: number;
      maxSize: number;
      utilizationPercent: number;
    }>;
  } {
    const totalMemoryMB = this.getTotalMemoryUsageMB();
    const utilizationPercent = (totalMemoryMB / this.config.maxGlobalMemoryMB) * 100;
    
    const cacheStats = Array.from(this.caches.values()).map(cache => {
      try {
        const stats = cache.getStats();
        return {
          id: cache.id,
          name: cache.name,
          priority: cache.priority,
          size: stats.size,
          maxSize: stats.maxSize,
          utilizationPercent: stats.utilizationPercent
        };
      } catch (error) {
        logger.error(`Error getting stats for cache ${cache.id}:`, error as Record<string, unknown>);
        return {
          id: cache.id,
          name: cache.name,
          priority: cache.priority,
          size: 0,
          maxSize: 0,
          utilizationPercent: 0
        };
      }
    });

    return {
      totalMemoryMB: parseFloat(totalMemoryMB.toFixed(2)),
      maxMemoryMB: this.config.maxGlobalMemoryMB,
      utilizationPercent: parseFloat(utilizationPercent.toFixed(1)),
      cacheCount: this.caches.size,
      emergencyMode: this.emergencyMode,
      totalEvictions: this.totalEvictions,
      memoryWarnings: this.memoryWarnings,
      caches: cacheStats
    };
  }

  /**
   * Force immediate cleanup of all caches
   */
  async forceCleanup(aggressive = true): Promise<void> {
    logger.info(`Forcing ${aggressive ? 'aggressive' : 'gentle'} cleanup of all caches`);
    this.performCleanup(aggressive);
  }

  /**
   * Update global memory limit
   */
  updateMemoryLimit(newLimitMB: number): void {
    if (newLimitMB <= 0) {
      throw new Error('Memory limit must be positive');
    }

    const oldLimit = this.config.maxGlobalMemoryMB;
    this.config.maxGlobalMemoryMB = newLimitMB;
    
    logger.info(`Global cache memory limit updated: ${oldLimit}MB → ${newLimitMB}MB`);
    
    // Immediate check with new limit
    this.checkMemoryUsage();
  }
}

// Export singleton instance and utility functions
export const globalCacheCoordinator = GlobalCacheCoordinator.getInstance();

export const registerCache = (cache: CacheInstance) => globalCacheCoordinator.registerCache(cache);
export const unregisterCache = (cacheId: string) => globalCacheCoordinator.unregisterCache(cacheId);
export const getGlobalCacheStatus = () => globalCacheCoordinator.getGlobalStatus();
export const forceGlobalCacheCleanup = (aggressive?: boolean) => globalCacheCoordinator.forceCleanup(aggressive);
export const updateGlobalMemoryLimit = (limitMB: number) => globalCacheCoordinator.updateMemoryLimit(limitMB);