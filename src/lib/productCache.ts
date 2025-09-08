import { WCProduct } from '@/types/woocommerce';

interface CachedProduct {
  product: WCProduct;
  timestamp: number;
  etag?: string;
}

class ProductCache {
  private cache = new Map<string, CachedProduct>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  private maxSize = 50; // Maximum cached items

  set(key: string, product: WCProduct, etag?: string): void {
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

  get(key: string): WCProduct | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.product;
  }

  getStale(key: string): WCProduct | null {
    const cached = this.cache.get(key);
    return cached ? cached.product : null;
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
      if (now - cached.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

export const productCache = new ProductCache();

// Cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    productCache.cleanup();
  }, 5 * 60 * 1000);
}