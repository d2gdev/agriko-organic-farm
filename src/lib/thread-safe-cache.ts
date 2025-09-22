import { logger } from '@/lib/logger';

// Thread-safe cache implementation with atomic operations
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  version: number; // For optimistic locking
}

interface CacheOperation<T> {
  type: 'get' | 'set' | 'delete' | 'clear';
  key?: string;
  data?: T;
  ttl?: number;
  resolve: (value: T | null | boolean) => void;
  reject: (error: Error) => void;
}

export class ThreadSafeCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private operations: CacheOperation<T>[] = [];
  private processing = false;
  private maxSize: number;
  private defaultTtl: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private locks = new Map<string, Promise<void>>();

  constructor(maxSize: number = 1000, defaultTtl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.queueOperation({
        type: 'clear',
        resolve: () => {},
        reject: () => {}
      });
    }, 2 * 60 * 1000); // Cleanup every 2 minutes
  }

  private async processOperations(): Promise<void> {
    if (this.processing || this.operations.length === 0) {
      return;
    }

    this.processing = true;

    try {
      // Process operations in batches to improve performance
      const batchSize = 10;
      while (this.operations.length > 0) {
        const batch = this.operations.splice(0, batchSize);
        
        for (const operation of batch) {
          try {
            await this.executeOperation(operation);
          } catch (error) {
            operation.reject(error instanceof Error ? error : new Error(String(error)));
          }
        }

        // Yield control to prevent blocking
        if (this.operations.length > 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async executeOperation(operation: CacheOperation<T>): Promise<void> {
    switch (operation.type) {
      case 'get':
        if (!operation.key) {
          operation.reject(new Error('Key is required for get operation'));
          return;
        }
        operation.resolve(this.internalGet(operation.key));
        break;

      case 'set':
        if (!operation.key) {
          operation.reject(new Error('Key is required for set operation'));
          return;
        }
        this.internalSet(operation.key, operation.data as T, operation.ttl);
        operation.resolve(null); // Set operations don't return the data
        break;

      case 'delete':
        if (!operation.key) {
          operation.reject(new Error('Key is required for delete operation'));
          return;
        }
        operation.resolve(this.internalDelete(operation.key));
        break;

      case 'clear':
        this.internalCleanup();
        operation.resolve(true);
        break;

      default:
        operation.reject(new Error(`Unknown operation type: ${operation.type}`));
    }
  }

  private queueOperation(operation: CacheOperation<T>): Promise<T | null | boolean> {
    return new Promise<T | null | boolean>((resolve, reject) => {
      this.operations.push({
        ...operation,
        resolve,
        reject
      } as CacheOperation<T>);

      // Process operations asynchronously
      setImmediate(() => this.processOperations());
    });
  }

  // Atomic get operation with race condition protection
  private internalGet(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics atomically
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  // Atomic set operation with capacity management
  private internalSet(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl ?? this.defaultTtl;

    // Check capacity and cleanup if needed
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldestEntries(Math.floor(this.maxSize * 0.1)); // Evict 10% of entries
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now,
      version: this.cache.has(key) ? (this.cache.get(key)?.version ?? 0) + 1 : 1
    };

    this.cache.set(key, entry);
  }

  // Atomic delete operation
  private internalDelete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Smart cleanup with LRU eviction
  private internalCleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    // If still over capacity, use LRU eviction
    if (this.cache.size > this.maxSize * 0.9) {
      this.evictOldestEntries(this.cache.size - Math.floor(this.maxSize * 0.8));
    }
  }

  private evictOldestEntries(count: number): void {
    if (count <= 0) return;

    // Convert to array and sort by access pattern (LRU + frequency)
    const entries = Array.from(this.cache.entries()) as Array<[string, CacheEntry<T>]>;
    const now = Date.now();

    entries.sort(([, a], [, b]) => {
      // Score based on recency and frequency
      const scoreA = a.accessCount / (now - a.lastAccessed + 1);
      const scoreB = b.accessCount / (now - b.lastAccessed + 1);
      return scoreA - scoreB; // Lower score = remove first
    });

    // Remove the least valuable entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const entry = entries[i];
      if (entry?.[0]) {
        this.cache.delete(entry[0]);
      }
    }
  }

  // Public API methods
  async get(key: string): Promise<T | null> {
    // Implement per-key locking to prevent race conditions
    const lockKey = `get:${key}`;
    
    // Wait for any existing lock on this key
    const existingLock = this.locks.get(lockKey);
    if (existingLock) {
      await existingLock;
    }

    return this.queueOperation({
      type: 'get',
      key,
      resolve: () => {},
      reject: () => {}
    }) as Promise<T | null>;
  }

  async set(key: string, data: T, ttl?: number): Promise<void> {
    const lockKey = `set:${key}`;
    
    // Create lock for this operation
    const lockPromise = this.queueOperation({
      type: 'set',
      key,
      data,
      ttl,
      resolve: () => {},
      reject: () => {}
    }) as Promise<void>;

    this.locks.set(lockKey, lockPromise);
    
    try {
      await lockPromise;
    } finally {
      this.locks.delete(lockKey);
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.queueOperation({
      type: 'delete',
      key,
      resolve: () => {},
      reject: () => {}
    });
    return result as boolean;
  }

  async has(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result !== null;
  }

  async clear(): Promise<void> {
    await this.queueOperation({
      type: 'clear',
      resolve: () => {},
      reject: () => {}
    });
  }

  // Compare-and-swap operation for atomic updates
  async compareAndSwap(
    key: string, 
    expectedVersion: number, 
    newData: T, 
    ttl?: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.operations.push({
        type: 'set' as const,
        key,
        data: newData,
        ttl,
        resolve: () => {
          const entry = this.cache.get(key);
          if (entry && entry.version === expectedVersion) {
            this.internalSet(key, newData, ttl);
            resolve(true);
          } else {
            resolve(false);
          }
        },
        reject
      });
      
      setImmediate(() => this.processOperations());
    });
  }

  // Batch operations for better performance
  async getMultiple(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    // Process in parallel but maintain consistency
    const promises = keys.map(key =>
      this.get(key).then(value => ({ key, value }))
    );
    
    const resolved = await Promise.all(promises);
    
    for (const { key, value } of resolved) {
      results.set(key, value);
    }
    
    return results;
  }

  async setMultiple(entries: Map<string, T>, ttl?: number): Promise<void> {
    const promises = Array.from(entries.entries()).map(([key, data]) =>
      this.set(key, data, ttl)
    );
    
    await Promise.all(promises);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  // Statistics and monitoring
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalAccess = 0;
    let totalAge = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
      totalAccess += entry.accessCount;
      totalAge += now - entry.timestamp;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.cache.size / this.maxSize) * 100,
      expiredCount,
      averageAccessCount: this.cache.size > 0 ? totalAccess / this.cache.size : 0,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      pendingOperations: this.operations.length,
      activeLocks: this.locks.size,
      processing: this.processing
    };
  }

  // Graceful shutdown
  async destroy(): Promise<void> {
    // Stop cleanup timer
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Wait for pending operations to complete
    while (this.operations.length > 0 || this.processing) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Wait for all locks to be released
    if (this.locks.size > 0) {
      await Promise.all(Array.from(this.locks.values()));
    }
    this.locks.clear();

    // Clear cache
    this.cache.clear();
    this.locks.clear();

    logger.info('Thread-safe cache destroyed');
  }
}

// Singleton instances for common use cases
export const productCacheSafe = new ThreadSafeCache<unknown>(500, 10 * 60 * 1000); // 10 minutes
export const searchCacheSafe = new ThreadSafeCache<unknown>(200, 5 * 60 * 1000);   // 5 minutes
export const apiCacheSafe = new ThreadSafeCache<unknown>(1000, 2 * 60 * 1000);     // 2 minutes

// Graceful shutdown
if (typeof process !== 'undefined') {
  const cleanup = async () => {
    await Promise.all([
      productCacheSafe.destroy(),
      searchCacheSafe.destroy(),
      apiCacheSafe.destroy()
    ]);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}

const cacheExports = {
  ThreadSafeCache,
  productCacheSafe,
  searchCacheSafe,
  apiCacheSafe,
};

export default cacheExports;