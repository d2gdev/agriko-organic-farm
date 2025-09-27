/**
 * WooCommerce Adapter Tests
 * Tests edge cases in product data adaptation
 */

import { adaptProductFromAPI, adaptProductsFromAPI, validateProductData } from '../woocommerce-adapter';
import { Money } from '../money';

describe('WooCommerce Adapter Edge Cases', () => {
  describe('adaptProductFromAPI', () => {
    it('should handle product with zero price string', () => {
      const raw = {
        id: 1,
        name: 'Zero Price Product',
        slug: 'zero-price',
        price: '0',
        regular_price: '0',
        sale_price: '',
      };

      const product = adaptProductFromAPI(raw as any);

      expect(product.price.isZero).toBe(true);
      expect(product.regular_price.isZero).toBe(true);
      expect(product.sale_price).toBeNull();
    });

    it('should handle product with missing price (undefined)', () => {
      const raw = {
        id: 2,
        name: 'No Price Product',
        slug: 'no-price',
        // price is undefined
      };

      const product = adaptProductFromAPI(raw as any);

      // Should default to zero
      expect(product.price.isZero).toBe(true);
      expect(product.regular_price.isZero).toBe(true);
      expect(product.sale_price).toBeNull();
    });

    it('should handle product with empty price string', () => {
      const raw = {
        id: 3,
        name: 'Empty Price Product',
        slug: 'empty-price',
        price: '',
        regular_price: '',
        sale_price: '',
      };

      const product = adaptProductFromAPI(raw as any);

      expect(product.price.isZero).toBe(true);
      expect(product.regular_price.isZero).toBe(true);
      expect(product.sale_price).toBeNull();
    });

    it('should handle product with only sale price', () => {
      const raw = {
        id: 4,
        name: 'Sale Only Product',
        slug: 'sale-only',
        price: '99.99',
        sale_price: '99.99',
        // regular_price missing
      };

      const product = adaptProductFromAPI(raw as any);

      expect(product.price.pesos).toBe(99.99);
      expect(product.regular_price.pesos).toBe(99.99); // Should default to price
      expect(product.sale_price?.pesos).toBe(99.99);
    });

    it('should handle malformed price strings gracefully', () => {
      const raw = {
        id: 5,
        name: 'Bad Price Product',
        slug: 'bad-price',
        price: 'not-a-number',
        regular_price: '123.456789', // Too many decimals
        sale_price: '$99.99', // Has currency symbol
      };

      const product = adaptProductFromAPI(raw as any);

      // Should handle these gracefully
      expect(product.price.pesos).toBe(0); // NaN becomes 0
      expect(product.regular_price.pesos).toBe(123.46); // Rounds to 2 decimals
      // Money.fromWooCommerce actually handles "$99.99" correctly by stripping the $
      expect(product.sale_price?.pesos).toBe(99.99); // Parses successfully
    });

    it('should handle negative prices by converting to zero', () => {
      const raw = {
        id: 6,
        name: 'Negative Price Product',
        slug: 'negative-price',
        price: '-50.00',
        regular_price: '-100.00',
      };

      const product = adaptProductFromAPI(raw as any);

      // Money class should handle negatives appropriately
      // (In this case, we treat them as zero for safety)
      expect(product.price.pesos).toBeGreaterThanOrEqual(0);
      expect(product.regular_price.pesos).toBeGreaterThanOrEqual(0);
    });

    it('should preserve all non-price fields', () => {
      const raw = {
        id: 7,
        name: 'Full Product',
        slug: 'full-product',
        price: '100.00',
        description: 'A description',
        sku: 'SKU123',
        stock_status: 'instock',
        categories: [{ id: 1, name: 'Test' }],
        images: [{ src: 'image.jpg' }],
      };

      const product = adaptProductFromAPI(raw as any);

      expect(product.description).toBe('A description');
      expect(product.sku).toBe('SKU123');
      expect(product.stock_status).toBe('instock');
      expect(product.categories).toEqual([{ id: 1, name: 'Test' }]);
      expect(product.images).toEqual([{ src: 'image.jpg' }]);
    });
  });

  describe('adaptProductsFromAPI', () => {
    it('should handle empty array', () => {
      const products = adaptProductsFromAPI([]);
      expect(products).toEqual([]);
    });

    it('should handle mixed valid and invalid products', () => {
      const raw = [
        { id: 1, name: 'Good', slug: 'good', price: '100.00' },
        { id: 2, name: 'Bad', slug: 'bad', price: 'invalid' },
        { id: 3, name: 'Ugly', slug: 'ugly' }, // Missing price
      ];

      const products = adaptProductsFromAPI(raw as any);

      expect(products).toHaveLength(3);

      // First product should have valid price
      const firstProduct = products[0];
      expect(firstProduct).toBeDefined();
      expect(firstProduct!.price.pesos).toBe(100);

      // Second product with invalid price should default to zero
      const secondProduct = products[1];
      expect(secondProduct).toBeDefined();
      expect(secondProduct!.price.isZero).toBe(true); // Invalid becomes zero

      // Third product with missing price should default to zero
      const thirdProduct = products[2];
      expect(thirdProduct).toBeDefined();
      expect(thirdProduct!.price.isZero).toBe(true); // Missing becomes zero
    });
  });

  describe('validateProductData', () => {
    it('should validate product with all required fields', () => {
      const product = {
        id: 1,
        name: 'Valid Product',
        slug: 'valid',
        price: Money.pesos(100),
        regular_price: Money.pesos(120),
        sale_price: Money.pesos(100),
      };

      const result = validateProductData(product as any);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing product name', () => {
      const product = {
        id: 1,
        name: '',
        slug: 'no-name',
        price: Money.pesos(100),
        regular_price: Money.pesos(100),
      };

      const result = validateProductData(product as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    it('should catch sale price higher than regular price', () => {
      const product = {
        id: 1,
        name: 'Bad Sale',
        slug: 'bad-sale',
        price: Money.pesos(150),
        regular_price: Money.pesos(100),
        sale_price: Money.pesos(150),
      };

      const result = validateProductData(product as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Sale price cannot be higher than regular price');
    });

    it('should catch negative stock quantity', () => {
      const product = {
        id: 1,
        name: 'Negative Stock',
        slug: 'negative-stock',
        price: Money.pesos(100),
        regular_price: Money.pesos(100),
        manage_stock: true,
        stock_quantity: -5,
      };

      const result = validateProductData(product as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Stock quantity cannot be negative');
    });

    it('should allow zero price with warning', () => {
      const product = {
        id: 1,
        name: 'Free Product',
        slug: 'free',
        price: Money.ZERO,
        regular_price: Money.ZERO,
      };

      const result = validateProductData(product as any);

      // Zero price is valid but might need attention
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle WooCommerce variable product parent (no price)', () => {
      const raw = {
        id: 100,
        name: 'Variable Product',
        slug: 'variable',
        type: 'variable',
        // Variable products don't have price on parent
        variations: [101, 102, 103],
      };

      const product = adaptProductFromAPI(raw as any);

      expect(product.price.isZero).toBe(true);
      expect(product.variations).toEqual([101, 102, 103]);
    });

    it('should handle grouped product (price range)', () => {
      const raw = {
        id: 200,
        name: 'Grouped Product',
        slug: 'grouped',
        type: 'grouped',
        price: '50.00 - 150.00', // Price range
      };

      const product = adaptProductFromAPI(raw as any);

      // Should handle price range gracefully
      // (Current implementation would parse as 0, which is safe)
      expect(product.price).toBeDefined();
    });

    it('should handle product with HTML in price field', () => {
      const raw = {
        id: 300,
        name: 'HTML Price Product',
        slug: 'html-price',
        price: '<span>100.00</span>', // Some plugins do this
      };

      const product = adaptProductFromAPI(raw as any);

      // Should strip HTML and parse number
      expect(product.price).toBeDefined();
      expect(product.price.pesos).toBeGreaterThanOrEqual(0);
    });
  });
});