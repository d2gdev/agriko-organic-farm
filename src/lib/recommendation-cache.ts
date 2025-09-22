// Recommendation caching system for improved performance
import { RecommendationScore, UserProfile, RecommendationContext } from './multi-factor-recommendations';
import { MemoryOptimizedCache } from './memory-optimizer';

import { logger } from '@/lib/logger';

interface _CacheEntry {
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
  private cache = new MemoryOptimizedCache(1000, 300000);
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
    const data = this.cache.get(key);

    if (!data) {
      this.stats.misses++;
      return null;
    }

    // MemoryOptimizedCache handles TTL internally
    this.stats.hits++;

    logger.info(`🎯 Cache hit for recommendation type: ${type}`);
    return data as RecommendationScore[];
  }

  // Set recommendations in cache
  set(
    type: string,
    data: RecommendationScore[],
    userProfile?: UserProfile,
    context?: RecommendationContext,
    additionalParams?: Record<string, unknown>,
    _ttl?: number
  ): void {
    // MemoryOptimizedCache handles size limits automatically

    const key = this.generateCacheKey(type, userProfile, context, additionalParams);

    // MemoryOptimizedCache handles TTL internally, so we just store the data
    const dataCopy = JSON.parse(JSON.stringify(data)); // Deep copy to prevent mutations

    this.cache.set(key, dataCopy);
    logger.info(`💾 Cached recommendations for type: ${type}`);
  }

  // Invalidate cache entries that might be affected by new data
  invalidate(productIds?: number[], categories?: string[], healthBenefits?: string[]): void {
    const keysToDelete: string[] = [];

    for (const [key, _entry] of this.cache.entries()) {
      void _entry; // Entry not needed for key-based invalidation logic
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
    // MemoryOptimizedCache handles cleanup automatically
    logger.info(`🧹 Cache cleanup triggered (handled internally)`);
  }

  // Evict oldest entries based on LRU
  private evictOldest(): void {
    // MemoryOptimizedCache handles LRU eviction automatically
    logger.info(`⏰ Cache eviction triggered (handled internally)`);
  }

  // Get cache statistics
  getStats(): CacheStats {
    const entries = this.cache.size;
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    // Estimate memory usage using MemoryOptimizedCache stats
    const cacheStats = this.cache.getStats();
    const memoryUsage = cacheStats.totalEstimatedSize || entries * 1000; // Fallback estimate

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

  // Get cache entries (simplified since MemoryOptimizedCache doesn't track individual hits)
  getPopularEntries(limit: number = 10): Array<{ key: string; hits: number; data: RecommendationScore[] }> {
    const entries = Array.from(this.cache.keys())
      .slice(0, limit)
      .map(key => ({
        key,
        hits: 0, // MemoryOptimizedCache doesn't track individual entry hits
        data: this.cache.get(key) as RecommendationScore[] || []
      }));

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