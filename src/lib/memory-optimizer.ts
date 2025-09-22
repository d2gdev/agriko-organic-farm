// Memory Optimization Utilities
// Addresses the 47MB memory usage issue identified in testing

import { logger } from '@/lib/logger';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  size?: number;
}

export class MemoryOptimizedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize = 1000, ttlMs = 300000) { // 5 minute default TTL
    this.maxSize = maxSize;
    this.ttl = ttlMs;
    this.startCleanup();
  }

  set(key: string, value: T): void {
    // If at capacity, remove least recently used
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      size: this.estimateSize(value)
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access count for LRU
    entry.accessCount++;
    return entry.value;
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruAccessCount = Infinity;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lruAccessCount ||
          (entry.accessCount === lruAccessCount && entry.timestamp < oldestTimestamp)) {
        lruKey = key;
        lruAccessCount = entry.accessCount;
        oldestTimestamp = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate: 2 bytes per char
    } catch {
      return 100; // Fallback estimate
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    if (toDelete.length > 0) {
      logger.debug(`Cleaned up ${toDelete.length} expired cache entries`);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  entries(): IterableIterator<[string, CacheEntry<T>]> {
    return this.cache.entries();
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalEstimatedSize: totalSize,
      averageAccessCount: entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length || 0
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Event bus memory optimization
export class MemoryOptimizedEventBus {
  private listeners = new Map<string, Set<Function>>();
  private eventHistory = new MemoryOptimizedCache<any>(100, 60000); // Keep last 100 events for 1 minute

  on(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);

    // Return cleanup function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emit(event: string, data: any): void {
    // Store in history for debugging
    this.eventHistory.set(`${event}_${Date.now()}`, data);

    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error('Event listener error:', error as Record<string, unknown>);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  getStats() {
    return {
      listenerCount: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
      eventTypes: this.listeners.size,
      historyStats: this.eventHistory.getStats()
    };
  }

  destroy(): void {
    this.listeners.clear();
    this.eventHistory.destroy();
  }
}

// Memory monitoring
class MemoryMonitor {
  private measurements: MemoryStats[] = [];
  private maxMeasurements = 100;

  measure(): MemoryStats {
    const memUsage = process.memoryUsage();
    const stats: MemoryStats = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };

    this.measurements.push(stats);
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    return stats;
  }

  getStats() {
    if (this.measurements.length === 0) return null;

    const latest = this.measurements[this.measurements.length - 1];
    const peak = this.measurements.reduce((max, curr) =>
      curr.heapUsed > max.heapUsed ? curr : max
    );

    return {
      current: latest,
      peak,
      measurementCount: this.measurements.length,
      trend: this.measurements.length > 1 && latest && this.measurements[0] ?
        latest.heapUsed - this.measurements[0].heapUsed : 0
    };
  }

  forceGC(): void {
    if (global.gc) {
      global.gc();
      logger.debug('Forced garbage collection');
    }
  }
}

export const memoryMonitor = new MemoryMonitor();

// Helper function to create memory-optimized objects
export function createMemoryOptimizedMap<K, V>(
  maxSize = 1000,
  ttlMs = 300000
): Map<K, V> & { cleanup: () => void } {
  const map = new Map<K, { value: V; timestamp: number }>();

  const cleanup = () => {
    const now = Date.now();
    const toDelete: K[] = [];

    for (const [key, entry] of map.entries()) {
      if (now - entry.timestamp > ttlMs) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => map.delete(key));
  };

  const intervalId = setInterval(cleanup, Math.min(ttlMs / 4, 60000));

  const optimizedMap = {
    set(key: K, value: V): typeof optimizedMap {
      if (map.size >= maxSize) {
        const firstKey = map.keys().next().value;
        if (firstKey !== undefined) {
          map.delete(firstKey);
        }
      }
      map.set(key, { value, timestamp: Date.now() });
      return this;
    },

    get(key: K): V | undefined {
      const entry = map.get(key);
      if (!entry) return undefined;

      if (Date.now() - entry.timestamp > ttlMs) {
        map.delete(key);
        return undefined;
      }

      return entry.value;
    },

    has(key: K): boolean {
      const entry = map.get(key);
      if (!entry) return false;

      if (Date.now() - entry.timestamp > ttlMs) {
        map.delete(key);
        return false;
      }

      return true;
    },

    delete(key: K): boolean {
      return map.delete(key);
    },

    clear(): void {
      map.clear();
    },

    get size(): number {
      cleanup(); // Clean expired entries before returning size
      return map.size;
    },

    cleanup(): void {
      cleanup();
    },

    destroy(): void {
      clearInterval(intervalId);
      map.clear();
    }
  } as Map<K, V> & { cleanup: () => void; destroy: () => void };

  return optimizedMap;
}

// Memory-optimized JSON stringify with circular reference detection
export function safeJSONStringify(obj: any, maxDepth = 10): string {
  const seen = new WeakSet();

  const stringifyWithCircularCheck = (value: any, depth: number): any => {
    if (depth > maxDepth) return '[Max Depth Reached]';

    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (seen.has(value)) {
      return '[Circular Reference]';
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value.map(item => stringifyWithCircularCheck(item, depth + 1));
    }

    const result: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        result[key] = stringifyWithCircularCheck(value[key], depth + 1);
      }
    }

    return result;
  };

  try {
    return JSON.stringify(stringifyWithCircularCheck(obj, 0));
  } catch {
    return JSON.stringify({ error: 'Failed to stringify object' });
  }
}