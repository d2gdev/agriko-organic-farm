/**
 * Simple Graph Recommendation Cache
 * Windows Dev: In-memory Map
 * Ubuntu Prod: Redis (when available)
 */

import { logger } from '@/lib/logger';
import { MemoryOptimizedCache } from './memory-optimizer';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class GraphCache {
  private cache = new MemoryOptimizedCache(1000, 300000);
  private readonly DEFAULT_TTL = 3600000; // 1 hour in ms
  private readonly MAX_SIZE = 100;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 600000);
    logger.info('📦 Graph cache initialized (in-memory mode for Windows dev)');
  }

  private makeKey(type: string, id: number, limit?: number): string {
    return `graph:${type}:${id}${limit ? `:${limit}` : ''}`;
  }

  async get<T>(type: string, id: number, limit?: number): Promise<T | null> {
    const key = this.makeKey(type, id, limit);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }

    logger.info(`✅ Cache HIT: ${key}`);
    return (entry as any).value as T;
  }

  async set<T>(type: string, id: number, data: T, limit?: number, _ttl?: number): Promise<void> {
    // Enforce size limit
    if (this.cache.size >= this.MAX_SIZE) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.makeKey(type, id, limit);
    this.cache.set(key, data);

    logger.info(`💾 Cached: ${key}`);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Use DEFAULT_TTL since MemoryOptimizedCache doesn't store per-entry TTL
      if (now > entry.timestamp + this.DEFAULT_TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`🧹 Cleaned ${cleaned} expired graph cache entries`);
    }
  }

  clear(): void {
    this.cache.clear();
    logger.info('🗑️ Graph cache cleared');
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('🛑 Graph cache cleanup interval stopped');
    }
    this.clear();
  }
}

export const graphCache = new GraphCache();

// Graceful shutdown handler
const cleanup = () => {
  logger.info('🧹 Cleaning up graph cache...');
  graphCache.destroy();
};

// Register cleanup handlers
if (typeof process !== 'undefined') {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}