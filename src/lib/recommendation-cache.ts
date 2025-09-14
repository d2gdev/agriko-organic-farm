// Recommendation caching system for improved performance
import { RecommendationScore, UserProfile, RecommendationContext } from './multi-factor-recommendations';

import { logger } from '@/lib/logger';

interface CacheEntry {
  data: RecommendationScore[];
  timestamp: number;
  expiresAt: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsage: number;
}

export class RecommendationCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly maxEntries = 1000;
  private readonly cleanupInterval = 10 * 60 * 1000; // 10 minutes
  private stats = {
    hits: 0,
    misses: 0
  };

  private cleanupIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.cleanupIntervalId = setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  // Destroy the cache and clean up resources
  destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.cache.clear();
  }

  // Generate cache key from user profile and context
  private generateCacheKey(
    type: string,
    userProfile?: UserProfile,
    context?: RecommendationContext,
    additionalParams?: Record<string, unknown>
  ): string {
    const keyParts = [type];

    // Add user profile elements that affect recommendations
    if (userProfile) {
      if (userProfile.purchaseHistory?.length) {
        keyParts.push(`ph:${userProfile.purchaseHistory.sort().join(',')}`);
      }
      if (userProfile.viewHistory?.length) {
        keyParts.push(`vh:${userProfile.viewHistory.sort().join(',')}`);
      }
      if (userProfile.preferredCategories?.length) {
        keyParts.push(`pc:${userProfile.preferredCategories.sort().join(',')}`);
      }
      if (userProfile.healthGoals?.length) {
        keyParts.push(`hg:${userProfile.healthGoals.sort().join(',')}`);
      }
      if (userProfile.location) {
        keyParts.push(`loc:${userProfile.location}`);
      }
    }

    // Add context elements
    if (context) {
      if (context.currentProduct) {
        keyParts.push(`cp:${context.currentProduct}`);
      }
      if (context.currentCategory) {
        keyParts.push(`cc:${context.currentCategory}`);
      }
      if (context.currentSeason) {
        keyParts.push(`cs:${context.currentSeason}`);
      }
      if (context.healthCondition) {
        keyParts.push(`hc:${context.healthCondition}`);
      }
      if (context.targetNutrient) {
        keyParts.push(`tn:${context.targetNutrient}`);
      }
      if (context.limit) {
        keyParts.push(`l:${context.limit}`);
      }
    }

    // Add additional parameters
    if (additionalParams) {
      Object.entries(additionalParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, value]) => {
          keyParts.push(`${key}:${String(value)}`);
        });
    }

    return keyParts.join('|');
  }

  // Get recommendations from cache
  get(
    type: string,
    userProfile?: UserProfile,
    context?: RecommendationContext,
    additionalParams?: Record<string, unknown>
  ): RecommendationScore[] | null {
    const key = this.generateCacheKey(type, userProfile, context, additionalParams);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit counter and stats
    entry.hits++;
    this.stats.hits++;
    
    logger.info(`🎯 Cache hit for recommendation type: ${type}`);
    return entry.data;
  }

  // Set recommendations in cache
  set(
    type: string,
    data: RecommendationScore[],
    userProfile?: UserProfile,
    context?: RecommendationContext,
    additionalParams?: Record<string, unknown>,
    ttl?: number
  ): void {
    // Check cache size and remove oldest entries if necessary
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const key = this.generateCacheKey(type, userProfile, context, additionalParams);
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.defaultTTL);

    const entry: CacheEntry = {
      data: JSON.parse(JSON.stringify(data)), // Deep copy to prevent mutations
      timestamp: now,
      expiresAt,
      hits: 0
    };

    this.cache.set(key, entry);
    logger.info(`💾 Cached recommendations for type: ${type}, expires at: ${new Date(expiresAt).toISOString()}`);
  }

  // Invalidate cache entries that might be affected by new data
  invalidate(productIds?: number[], categories?: string[], healthBenefits?: string[]): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      let shouldInvalidate = false;

      // Invalidate if specific products are mentioned
      if (productIds?.length) {
        for (const productId of productIds) {
          if (key.includes(`cp:${productId}`) || key.includes(`:${productId},`) || key.includes(`,${productId}:`)) {
            shouldInvalidate = true;
            break;
          }
        }
      }

      // Invalidate if specific categories are mentioned
      if (categories?.length && !shouldInvalidate) {
        for (const category of categories) {
          if (key.includes(`cc:${category}`) || key.includes(`:${category},`) || key.includes(`,${category}:`)) {
            shouldInvalidate = true;
            break;
          }
        }
      }

      // Invalidate if specific health benefits are mentioned
      if (healthBenefits?.length && !shouldInvalidate) {
        for (const benefit of healthBenefits) {
          if (key.includes(`hg:${benefit}`) || key.includes(`:${benefit},`) || key.includes(`,${benefit}:`)) {
            shouldInvalidate = true;
            break;
          }
        }
      }

      if (shouldInvalidate) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      logger.info(`🗑️ Invalidated ${keysToDelete.length} cache entries`);
    }
  }

  // Invalidate all cache entries
  invalidateAll(): void {
    const count = this.cache.size;
    this.cache.clear();
    logger.info(`🗑️ Invalidated all ${count} cache entries`);
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      logger.info(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  // Evict oldest entries based on LRU
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.info(`⏰ Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    const entries = this.cache.size;
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const [key, entry] of this.cache.entries()) {
      memoryUsage += key.length * 2; // Rough string size in bytes
      memoryUsage += JSON.stringify(entry.data).length * 2; // Rough data size
      memoryUsage += 100; // Overhead for entry metadata
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: Math.round(memoryUsage / 1024) // Convert to KB
    };
  }

  // Warm up cache with common recommendations
  async warmUp(commonUserProfiles: UserProfile[], commonContexts: RecommendationContext[]): Promise<void> {
    logger.info('🔥 Warming up recommendation cache...');
    
    // This would be implemented to pre-populate cache with common recommendation patterns
    // For now, we'll just log the intention
    logger.info(`📊 Would warm up cache with ${commonUserProfiles.length} user profiles and ${commonContexts.length} contexts`);
  }

  // Get cache entries sorted by popularity (hit count)
  getPopularEntries(limit: number = 10): Array<{ key: string; hits: number; data: RecommendationScore[] }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits, data: entry.data }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);

    return entries;
  }
}

// Create singleton instance
export const recommendationCache = new RecommendationCache();

// Cache decorator function for recommendation methods
export function withCache(
  cache: RecommendationCache,
  type: string,
  ttl?: number
) {
  return function <T extends (...args: unknown[]) => Promise<RecommendationScore[]>>(
    target: unknown,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value as T;

    descriptor.value = async function (...args: Parameters<T>): Promise<RecommendationScore[]> {
      // Type-safe extraction of arguments
      const userProfile = args[0] as UserProfile | undefined;
      const context = args[1] as RecommendationContext | undefined;
      const additionalParams = args.slice(2);
      
      // Try to get from cache
      const cached = cache.get(type, userProfile, context, { additionalParams });
      if (cached) {
        return cached;
      }

      // Execute original method
      const result = await method.apply(this, args);
      
      // Store in cache
      cache.set(type, result, userProfile, context, { additionalParams }, ttl);
      
      return result;
    };

    return descriptor;
  };
}