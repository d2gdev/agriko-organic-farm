import { WCProduct } from '@/types/woocommerce';

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
    // Clean up if we're at max size
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      product,
      timestamp: Date.now(),
      etag,
    });
  }

  setError(key: string): void {
    this.cache.set(key, {
      product: null as unknown as WCProduct,
      timestamp: Date.now(),
      error: true,
      errorTimestamp: Date.now(),
    });
  }

  get(key: string): WCProduct | null {
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
    const cached = this.cache.get(key);
    return cached && !cached.error ? cached.product : null;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      const maxAge = cached.error ? this.errorMaxAge : this.maxAge;
      if (now - cached.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
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