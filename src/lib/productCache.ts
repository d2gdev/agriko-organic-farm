import { WCProduct } from '@/types/woocommerce';
import { logger } from '@/lib/logger';

interface CachedProduct {
  product: WCProduct;
  timestamp: number;
  etag?: string;
  error?: boolean;
  errorTimestamp?: number;
}

class ProductCache {
  private cache = new Map<string, CachedProduct>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  private errorMaxAge = 30 * 1000; // 30 seconds for error caching
  private maxSize = 100; // Increased maximum cached items

  set(key: string, product: WCProduct, etag?: string): void {
    // Add type safety check
    if (!key) {
      logger.warn('ProductCache: Attempted to set cache with falsy key');
      return;
    }
    
    // Clean up if we're at max size
    if (this.cache.size >= this.maxSize) {
      const keys = Array.from(this.cache.keys());
      if (keys.length > 0) {
        const oldestKey = keys[0];
        // Add type check to ensure oldestKey is a string
        if (typeof oldestKey === 'string') {
          this.cache.delete(oldestKey);
        }
      }
    }

    this.cache.set(key, {
      product,
      timestamp: Date.now(),
      etag,
    });
  }

  setError(key: string): void {
    // Add type safety check
    if (!key) {
      logger.warn('ProductCache: Attempted to set error with falsy key');
      return;
    }
    
    this.cache.set(key, {
      product: null as unknown as WCProduct,
      timestamp: Date.now(),
      error: true,
      errorTimestamp: Date.now(),
    });
  }

  get(key: string): WCProduct | null {
    // Add type safety check
    if (!key) {
      logger.warn('ProductCache: Attempted to get cache with falsy key');
      return null;
    }
    
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Handle error cache
    if (cached.error) {
      // If error is recent, return null to prevent cascading failures
      if (cached.errorTimestamp && Date.now() - cached.errorTimestamp < this.errorMaxAge) {
        return null;
      }
      // If error is old, remove it and allow retry
      this.cache.delete(key);
      return null;
    }

    // Handle normal cache expiration
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.product;
  }

  getStale(key: string): WCProduct | null {
    // Add type safety check
    if (!key) {
      logger.warn('ProductCache: Attempted to get stale cache with falsy key');
      return null;
    }
    
    const cached = this.cache.get(key);
    return cached && !cached.error ? cached.product : null;
  }

  has(key: string): boolean {
    // Add type safety check
    if (!key) {
      logger.warn('ProductCache: Attempted to check cache with falsy key');
      return false;
    }
    
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      // Add safety check for key
      if (!key) {
        this.cache.delete(key);
        continue;
      }
      
      const maxAge = cached.error ? this.errorMaxAge : this.maxAge;
      if (now - cached.timestamp > maxAge) {
        // Type assertion to ensure key is string
        this.cache.delete(key as string);
      }
    }
  }

  // Add missing getMetrics method
  getMetrics(): { hits: number; misses: number; size: number; hitRate: number } {
    // Since we don't track hits/misses in this simple implementation,
    // we'll return basic stats
    return {
      hits: 0,
      misses: 0,
      size: this.cache.size,
      hitRate: 0
    };
  }

  // Add size method for compatibility
  size(): number {
    return this.cache.size;
  }
}

export const productCache = new ProductCache();

// Cleanup every 5 minutes with proper cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

if (typeof window !== 'undefined') {
  cleanupInterval = setInterval(() => {
    productCache.cleanup();
  }, 5 * 60 * 1000);
  
  // Clean up interval when page unloads
  window.addEventListener('beforeunload', () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
  });
}