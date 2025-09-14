import { productCache } from '@/lib/productCache';
import { WCProduct } from '@/types/woocommerce';

jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn()
  }
}));

const mockProduct: WCProduct = {
  id: 1,
  name: 'Test Product',
  slug: 'test-product',
  permalink: 'https://test.com/product/test-product',
  description: 'Test description',
  short_description: 'Short test description',
  price: '19.99',
  regular_price: '19.99',
  sale_price: '',
  on_sale: false,
  status: 'publish',
  featured: true,
  catalog_visibility: 'visible',
  sku: 'TEST-SKU',
  stock_status: 'instock',
  stock_quantity: 10,
  manage_stock: true,
  categories: [],
  tags: [],
  images: [],
  attributes: [],
  variations: [],
  weight: '100',
  dimensions: { length: '10', width: '10', height: '10' },
  meta_data: [],
  average_rating: '4.5',
  rating_count: 10,
  date_created: '2024-01-01T10:00:00',
  date_modified: '2024-01-01T10:00:00'
};

describe('ProductCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    productCache.clear();
  });

  describe('basic operations', () => {
    it('should store and retrieve products', () => {
      const key = 'product:1';
      productCache.set(key, mockProduct);

      const retrieved = productCache.get(key);
      expect(retrieved).toEqual(mockProduct);
    });

    it('should return null for non-existent keys', () => {
      const result = productCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle has() method', () => {
      const key = 'product:1';
      expect(productCache.has(key)).toBe(false);

      productCache.set(key, mockProduct);
      expect(productCache.has(key)).toBe(true);
    });

    it('should clear all items', () => {
      productCache.set('product:1', mockProduct);
      productCache.set('product:2', { ...mockProduct, id: 2 });

      expect(productCache.has('product:1')).toBe(true);
      expect(productCache.has('product:2')).toBe(true);

      productCache.clear();

      expect(productCache.has('product:1')).toBe(false);
      expect(productCache.has('product:2')).toBe(false);
    });

    it('should track cache size', () => {
      expect(productCache.size()).toBe(0);

      productCache.set('product:1', mockProduct);
      expect(productCache.size()).toBe(1);

      productCache.set('product:2', { ...mockProduct, id: 2 });
      expect(productCache.size()).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle setError', () => {
      const key = 'product:error';
      productCache.setError(key);

      // Error state should return null
      expect(productCache.get(key)).toBeNull();
    });

    it('should handle empty string keys', () => {
      expect(() => productCache.set('', mockProduct)).not.toThrow();
      expect(productCache.get('')).toBeNull();
    });

    it('should handle invalid products', () => {
      productCache.set('null-key', null as any);
      const result = productCache.get('null-key');
      expect(result).toBeNull();
    });
  });

  describe('getStale method', () => {
    it('should return stale data when available', () => {
      const key = 'product:1';
      productCache.set(key, mockProduct);

      const stale = productCache.getStale(key);
      expect(stale).toEqual(mockProduct);
    });

    it('should return null when no stale data available', () => {
      const result = productCache.getStale('non-existent');
      expect(result).toBeNull();
    });

    it('should handle empty key', () => {
      const result = productCache.getStale('');
      expect(result).toBeNull();
    });
  });

  describe('cleanup and expiration', () => {
    it('should handle TTL expiration', () => {
      const key = 'product:1';
      productCache.set(key, mockProduct);

      // Mock time passing beyond maxAge (5 minutes)
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 6 * 60 * 1000);

      // Should be expired
      expect(productCache.get(key)).toBeNull();

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should cleanup expired entries', () => {
      productCache.set('product:1', mockProduct);

      // Should exist
      expect(productCache.has('product:1')).toBe(true);

      // Trigger cleanup with mocked time
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 6 * 60 * 1000);

      productCache.cleanup();

      // Should be cleaned up
      expect(productCache.has('product:1')).toBe(false);

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('memory management', () => {
    it('should respect maxSize limit', () => {
      // Fill cache beyond maxSize (100)
      for (let i = 0; i < 110; i++) {
        productCache.set(`product:${i}`, { ...mockProduct, id: i });
      }

      // Should be limited to maxSize
      expect(productCache.size()).toBe(100);
    });

    it('should handle rapid operations', () => {
      const key = 'product:rapid';

      for (let i = 0; i < 10; i++) {
        productCache.set(key, { ...mockProduct, id: i });
        const result = productCache.get(key);
        expect(result?.id).toBe(i);
      }
    });
  });

  describe('getMetrics', () => {
    it('should return basic metrics', () => {
      const metrics = productCache.getMetrics();

      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('size');
      expect(metrics).toHaveProperty('hitRate');

      expect(typeof metrics.size).toBe('number');
    });
  });
});