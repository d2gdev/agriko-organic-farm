import { logger } from '@/lib/logger';
import { registerCache } from './global-cache-coordinator';
// Note: MemoryOptimizedCache and memoryMonitor available if needed

// Cache configuration with memory management
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private operationLock = new Set<string>(); // Track ongoing operations
  private operationQueue = new Map<string, Array<() => void>>(); // Queue for pending operations
  private globalLock = false; // Prevent concurrent cleanup operations

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 1000,
      ttl: config.ttl ?? 5 * 60 * 1000, // 5 minutes default
      cleanupInterval: config.cleanupInterval ?? 2 * 60 * 1000, // 2 minutes
    };

    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    // Only start timer if not already running
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.config.cleanupInterval);
      
      // In browser environment, add cleanup on page unload
      if (typeof window !== 'undefined') {
        // Add cleanup for browser environments
        const cleanup = () => this.destroy();
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('pagehide', cleanup);
        
        // Store cleanup function for manual removal if needed
        (this as Record<string, unknown>)._cleanupHandlers = cleanup;
      }
    }
  }

  private stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      
      // Remove browser event listeners if they exist
      const thisRecord = this as Record<string, unknown>;
      if (typeof window !== 'undefined' && thisRecord._cleanupHandlers) {
        const cleanupFn = thisRecord._cleanupHandlers as EventListener;
        window.removeEventListener('beforeunload', cleanupFn);
        window.removeEventListener('pagehide', cleanupFn);
        delete thisRecord._cleanupHandlers;
      }
    }
  }

  private async executeWithLock<R>(key: string, operation: () => R | Promise<R>): Promise<R> {
    // If operation is already in progress, queue it
    if (this.operationLock.has(key)) {
      return new Promise((resolve, reject) => {
        const queue = this.operationQueue.get(key) || [];
        queue.push(async () => {
          try {
            const result = await operation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        this.operationQueue.set(key, queue);
      });
    }

    // Execute operation with lock
    this.operationLock.add(key);
    try {
      const result = await operation();

      // Process queued operations
      const queue = this.operationQueue.get(key);
      if (queue && queue.length > 0) {
        // Execute next operation in queue
        const nextOp = queue.shift();
        this.operationQueue.set(key, queue);
        if (nextOp) {
          // Execute without await to prevent blocking
          try {
            nextOp();
          } catch (error) {
            // Log error but don't throw to prevent unhandled rejection
            logger.warn(`Queued cache operation failed for key: ${key}`, {
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }

      return result;
    } finally {
      this.operationLock.delete(key);
      if (this.operationQueue.get(key)?.length === 0) {
        this.operationQueue.delete(key);
      }
    }
  }

  cleanup(aggressive = false) {
    // Prevent concurrent cleanup operations
    if (this.globalLock) {
      logger.debug('Cleanup already in progress, skipping');
      return;
    }

    this.globalLock = true;
    try {
      const now = Date.now();
      const entries = Array.from(this.cache.entries());

      // Remove expired entries
      let removedCount = 0;
      for (const [key, entry] of entries) {
        // Skip locked keys during cleanup
        if (!this.operationLock.has(key) && now > entry.expiresAt) {
          this.cache.delete(key);
          removedCount++;
        }
      }

      // Aggressive cleanup if cache is too large
      if (aggressive || this.cache.size > this.config.maxSize * 0.8) {
        const remainingEntries = Array.from(this.cache.entries())
          .filter(([key]) => !this.operationLock.has(key)); // Skip locked keys

        // Sort by access pattern (LRU + access frequency)
        remainingEntries.sort(([, a], [, b]) => {
          const scoreA = a.accessCount / (now - a.lastAccessed + 1);
          const scoreB = b.accessCount / (now - b.lastAccessed + 1);
          return scoreA - scoreB; // Lower score = remove first
        });

        const targetSize = Math.floor(this.config.maxSize * 0.7);
        const entriesToRemove = Math.max(0, remainingEntries.length - targetSize);

        for (let i = 0; i < entriesToRemove; i++) {
          const entry = remainingEntries[i];
          if (entry) {
            const [keyToRemove] = entry;
            if (!this.operationLock.has(keyToRemove)) {
              this.cache.delete(keyToRemove);
              removedCount++;
            }
          }
        }
      }

      if (removedCount > 0) {
        logger.debug(`Cache cleanup removed ${removedCount} entries, size: ${this.cache.size}`);
      }
    } finally {
      this.globalLock = false;
    }
  }

  // Default synchronous method for backward compatibility
  set(key: string, data: T, customTtl?: number): boolean {
    // Prevent concurrent operations on the same key
    if (this.operationLock.has(key)) {
      logger.warn(`Cache operation already in progress for key: ${key}`);
      return false;
    }

    this.operationLock.add(key);

    try {
      const now = Date.now();
      const ttl = customTtl ?? this.config.ttl;

      // Check if updating existing entry (doesn't count against size limit)
      const isUpdate = this.cache.has(key);

      // For new entries, check capacity and cleanup if needed
      if (!isUpdate) {
        if (this.cache.size >= this.config.maxSize) {
          this.cleanup(true);

          // If still at capacity after cleanup, reject
          if (this.cache.size >= this.config.maxSize) {
            logger.warn(`Cache at maximum capacity (${this.config.maxSize}), rejecting new entry for key: ${key}`);
            return false;
          }
        }
      }

      // Add or update the entry
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        accessCount: 0,
        lastAccessed: now,
      };

      this.cache.set(key, entry);
      return true;
    } finally {
      this.operationLock.delete(key);
    }
  }

  // Async version with proper locking mechanism
  async setAsync(key: string, data: T, customTtl?: number): Promise<boolean> {
    return this.executeWithLock(key, () => {
      const now = Date.now();
      const ttl = customTtl ?? this.config.ttl;

      // Check if updating existing entry (doesn't count against size limit)
      const isUpdate = this.cache.has(key);

      // For new entries, check capacity and cleanup if needed
      if (!isUpdate) {
        if (this.cache.size >= this.config.maxSize) {
          this.cleanup(true);

          // If still at capacity after cleanup, reject
          if (this.cache.size >= this.config.maxSize) {
            logger.warn(`Cache at maximum capacity (${this.config.maxSize}), rejecting new entry for key: ${key}`);
            return false;
          }
        }
      }

      // Add or update the entry
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        accessCount: 0,
        lastAccessed: now,
      };

      this.cache.set(key, entry);
      return true;
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      // Only delete if not locked (to prevent race conditions during cleanup)
      if (!this.operationLock.has(key)) {
        this.cache.delete(key);
      }
      return null;
    }

    // Update access statistics atomically to prevent race conditions
    // Use a simple technique to minimize race conditions
    if (!this.operationLock.has(key)) {
      entry.accessCount = (entry.accessCount || 0) + 1;
      entry.lastAccessed = now;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      // Only delete if not locked (to prevent race conditions during cleanup)
      if (!this.operationLock.has(key)) {
        this.cache.delete(key);
      }
      return false;
    }

    return true;
  }

  // Default synchronous method for backward compatibility
  delete(key: string): boolean {
    if (this.operationLock.has(key)) {
      logger.warn(`Cache operation already in progress for key: ${key}`);
      return false;
    }
    return this.cache.delete(key);
  }

  // Async version with proper locking
  async deleteAsync(key: string): Promise<boolean> {
    return this.executeWithLock(key, () => {
      return this.cache.delete(key);
    });
  }

  clear(): void {
    // Wait for any ongoing operations to complete
    if (this.globalLock || this.operationLock.size > 0) {
      logger.debug('Waiting for ongoing operations before clearing cache');
      // Don't clear if operations are in progress to prevent data corruption
      return;
    }

    this.cache.clear();
    this.operationQueue.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalAccess = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
      totalAccess += entry.accessCount;
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      expiredCount,
      utilizationPercent: (this.cache.size / this.config.maxSize) * 100,
      averageAccessCount: this.cache.size > 0 ? totalAccess / this.cache.size : 0,
    };
  }

  destroy() {
    this.stopCleanupTimer();

    // Wait for ongoing operations to complete before destroying
    if (this.operationLock.size > 0) {
      logger.debug(`Waiting for ${this.operationLock.size} operations to complete before destroying cache`);
      // In production, you might want to implement a timeout mechanism here
    }

    this.cache.clear();
    this.operationLock.clear();
    this.operationQueue.clear();
  }
}

// Product cache with memory management
export const productCache = new MemoryCache<Record<string, unknown>>({
  maxSize: 500, // Limit to 500 products
  ttl: 10 * 60 * 1000, // 10 minutes
  cleanupInterval: 5 * 60 * 1000, // Cleanup every 5 minutes
});

// Search cache for frequent queries
export const searchCache = new MemoryCache<Record<string, unknown>>({
  maxSize: 200, // Limit to 200 search results
  ttl: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 2 * 60 * 1000, // Cleanup every 2 minutes
});

// API response cache
export const apiCache = new MemoryCache<Record<string, unknown>>({
  maxSize: 1000, // Limit to 1000 API responses
  ttl: 2 * 60 * 1000, // 2 minutes
  cleanupInterval: 60 * 1000, // Cleanup every minute
});

// Register caches with global coordinator
registerCache({
  id: 'product-cache',
  name: 'Product Cache',
  priority: 8, // High priority - products are critical
  getCurrentSize: () => productCache.size(),
  getMaxSize: () => productCache.getStats().maxSize,
  getStats: () => productCache.getStats(),
  cleanup: (aggressive) => productCache.cleanup(aggressive),
  clear: () => productCache.clear(),
  destroy: () => productCache.destroy()
});

registerCache({
  id: 'search-cache',
  name: 'Search Cache',
  priority: 6, // Medium-high priority - searches are important
  getCurrentSize: () => searchCache.size(),
  getMaxSize: () => searchCache.getStats().maxSize,
  getStats: () => searchCache.getStats(),
  cleanup: (aggressive) => searchCache.cleanup(aggressive),
  clear: () => searchCache.clear(),
  destroy: () => searchCache.destroy()
});

registerCache({
  id: 'api-cache',
  name: 'API Response Cache',
  priority: 4, // Medium priority - can be regenerated
  getCurrentSize: () => apiCache.size(),
  getMaxSize: () => apiCache.getStats().maxSize,
  getStats: () => apiCache.getStats(),
  cleanup: (aggressive) => apiCache.cleanup(aggressive),
  clear: () => apiCache.clear(),
  destroy: () => apiCache.destroy()
});

// Safe localStorage wrapper with quota management
export class SafeLocalStorage {
  static maxSize = 5 * 1024 * 1024; // 5MB limit
  static warningThreshold = 0.8; // Warn at 80%

  /**
   * Check if localStorage is available
   */
  private static isLocalStorageAvailable(): boolean {
    try {
      // Check if localStorage exists
      if (typeof localStorage === 'undefined') {
        return false;
      }

      // Test write/read/remove to ensure it's functional
      const testKey = '__ls_test_' + Date.now();
      const testValue = 'test';
      
      localStorage.setItem(testKey, testValue);
      const retrievedValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrievedValue === testValue;
    } catch {
      // localStorage might be disabled (private browsing, SSR, etc.)
      return false;
    }
  }

  static set(key: string, value: unknown): boolean {
    if (!this.isLocalStorageAvailable()) {
      logger.warn('localStorage not available, cannot store data', { key });
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const currentSize = SafeLocalStorage.getStorageSize();
      const newSize = currentSize + serialized.length;

      // Check if we're approaching quota
      if (newSize > SafeLocalStorage.maxSize * SafeLocalStorage.warningThreshold) {
        logger.warn(`localStorage approaching quota: ${newSize} bytes`);
        SafeLocalStorage.cleanup();
      }

      // Check if still too large after cleanup
      if (newSize > SafeLocalStorage.maxSize) {
        logger.error(`localStorage quota exceeded, cannot store ${key}`);
        return false;
      }

      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // Handle both DOMException and other error types, including test mocks
      if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 22) {
        const errorMessage = error instanceof Error ? error.message :
                           (error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : null) || 'QuotaExceededError';
        logger.error('localStorage quota exceeded', { key, error: errorMessage });
        SafeLocalStorage.cleanup();
        return false;
      }
      const errorMessage = error instanceof Error ? error.message :
                          (error && typeof error === 'object' && 'message' in error) ?
                          (error as { message: string }).message : 'Unknown error';
      logger.error('localStorage error', { key, error: errorMessage });
      return false;
    }
  }

  static get(key: string): unknown {
    if (!this.isLocalStorageAvailable()) {
      logger.warn('localStorage not available, cannot retrieve data', { key });
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error('localStorage parse error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  static remove(key: string): void {
    if (!this.isLocalStorageAvailable()) {
      logger.warn('localStorage not available, cannot remove data', { key });
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('localStorage remove error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  static clear(): void {
    if (!this.isLocalStorageAvailable()) {
      logger.warn('localStorage not available, cannot clear data');
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      logger.error('localStorage clear error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  static getStorageSize(): number {
    if (!this.isLocalStorageAvailable()) {
      return 0;
    }

    try {
      let size = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key);
          size += (value?.length ?? 0) + key.length;
        }
      }
      return size;
    } catch (error) {
      logger.error('Error calculating localStorage size', { error: error instanceof Error ? error.message : 'Unknown error' });
      return 0;
    }
  }

  static cleanup(): void {
    if (!this.isLocalStorageAvailable()) {
      logger.warn('localStorage not available, cannot perform cleanup');
      return;
    }

    try {
      // Remove items with 'temp-' prefix first
      const tempKeys = Object.keys(localStorage).filter(key => key.startsWith('temp-'));
      tempKeys.forEach(key => localStorage.removeItem(key));

      // If still too large, remove oldest cache entries
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('cache-') || key.includes('search-') || key.includes('product-')
      );

      // Remove half of cache entries
      const toRemove = Math.ceil(cacheKeys.length / 2);
      for (let i = 0; i < toRemove; i++) {
        const key = cacheKeys[i];
        if (key) {
          localStorage.removeItem(key);
        }
      }

      logger.info(`localStorage cleanup completed, removed ${tempKeys.length + toRemove} items`);
    } catch (error) {
      logger.error('localStorage cleanup error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  static getStats() {
    if (!this.isLocalStorageAvailable()) {
      return {
        currentSize: 0,
        maxSize: SafeLocalStorage.maxSize,
        utilizationPercent: 0,
        itemCount: 0,
        available: false,
      };
    }

    try {
      const size = SafeLocalStorage.getStorageSize();
      return {
        currentSize: size,
        maxSize: SafeLocalStorage.maxSize,
        utilizationPercent: (size / SafeLocalStorage.maxSize) * 100,
        itemCount: Object.keys(localStorage).length,
        available: true,
      };
    } catch (error) {
      logger.error('Error getting localStorage stats', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        currentSize: 0,
        maxSize: SafeLocalStorage.maxSize,
        utilizationPercent: 0,
        itemCount: 0,
        available: false,
      };
    }
  }
}

// Graceful shutdown (prevent duplicate listeners)
if (typeof process !== 'undefined') {
  // Increase max listeners to prevent warnings during hot reloading
  if (process.getMaxListeners() < 50) {
    process.setMaxListeners(50);
  }

  const cleanup = () => {
    productCache.destroy();
    searchCache.destroy();
    apiCache.destroy();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

const CacheManager = {
  productCache,
  searchCache,
  apiCache,
  SafeLocalStorage,
  MemoryCache,
};

export default CacheManager;