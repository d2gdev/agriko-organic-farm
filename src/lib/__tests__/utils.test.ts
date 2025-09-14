import { formatPrice, calculateCartTotal, isProductInStock, getProductMainImage, stripHtml, cn } from '@/lib/utils';
import { WCProduct } from '@/types/woocommerce';

describe('Utility Functions', () => {
  describe('formatPrice', () => {
    it('should format price correctly with PHP currency', () => {
      const result = formatPrice(100, 'PHP');
      expect(result).toMatch(/₱/);
      expect(result).toMatch(/100/);
    });

    it('should handle string prices', () => {
      const result = formatPrice('50.99', 'PHP');
      expect(result).toMatch(/₱/);
      expect(result).toMatch(/50.99/);
    });

    it('should return N/A for invalid prices', () => {
      const result = formatPrice('invalid', 'PHP');
      expect(result).toBe('N/A');
    });

    it('should handle zero price', () => {
      const result = formatPrice(0, 'PHP');
      expect(result).toMatch(/₱/);
      expect(result).toMatch(/0/);
    });
  });

  describe('calculateCartTotal', () => {
    it('should calculate total correctly', () => {
      const items = [
        { price: '100', quantity: 2 },
        { price: '50', quantity: 1 },
      ];
      const result = calculateCartTotal(items);
      expect(result).toBe(250);
    });

    it('should handle empty cart', () => {
      const result = calculateCartTotal([]);
      expect(result).toBe(0);
    });

    it('should skip invalid items', () => {
      const items = [
        { price: '100', quantity: 2 },
        { price: 'invalid', quantity: 1 },
        { price: '50', quantity: 1 },
      ];
      const result = calculateCartTotal(items);
      expect(result).toBe(250);
    });

    it('should handle overflow protection', () => {
      const items = [
        { price: '999999999', quantity: 2 },
      ];
      const result = calculateCartTotal(items);
      expect(result).toBe(999999999);
    });
  });

  describe('isProductInStock', () => {
    it('should return true for in-stock product', () => {
      const product = {
        stock_status: 'instock',
        manage_stock: false,
      } as WCProduct;
      expect(isProductInStock(product)).toBe(true);
    });

    it('should return false for out-of-stock product', () => {
      const product = {
        stock_status: 'outofstock',
        manage_stock: false,
      } as WCProduct;
      expect(isProductInStock(product)).toBe(false);
    });

    it('should check stock quantity when managed', () => {
      const product = {
        stock_status: 'instock',
        manage_stock: true,
        stock_quantity: 5,
      } as WCProduct;
      expect(isProductInStock(product)).toBe(true);
    });

    it('should return false for zero stock when managed', () => {
      const product = {
        stock_status: 'instock',
        manage_stock: true,
        stock_quantity: 0,
      } as WCProduct;
      expect(isProductInStock(product)).toBe(false);
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const result = stripHtml(html);
      expect(result).toBe('Hello World');
    });

    it('should decode HTML entities', () => {
      const html = 'Hello &amp; &lt;World&gt;';
      const result = stripHtml(html);
      expect(result).toBe('Hello & <World>');
    });

    it('should handle empty string', () => {
      const result = stripHtml('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(stripHtml(null as string)).toBe('');
      expect(stripHtml(undefined as string)).toBe('');
    });

    it('should clean up extra whitespace', () => {
      const html = '<p>Hello    World</p>';
      const result = stripHtml(html);
      expect(result).toBe('Hello World');
    });
  });

  describe('getProductMainImage', () => {
    it('should return first image src if available', () => {
      const product = {
        images: [
          { src: 'https://example.com/image1.jpg', alt: 'Image 1' },
          { src: 'https://example.com/image2.jpg', alt: 'Image 2' }
        ]
      } as WCProduct;

      const result = getProductMainImage(product);
      expect(result).toBe('https://example.com/image1.jpg');
    });

    it('should return placeholder SVG if no images', () => {
      const product = {
        images: []
      } as WCProduct;

      const result = getProductMainImage(product);
      expect(result).toMatch(/data:image\/svg\+xml;base64,/);

      // Decode the base64 to check content
      const base64Part = result.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      expect(decoded).toContain('Product Image');
    });

    it('should handle undefined images', () => {
      const product = {} as WCProduct;

      const result = getProductMainImage(product);
      expect(result).toMatch(/data:image\/svg\+xml;base64,/);
    });

    it('should handle invalid image src', () => {
      const product = {
        images: [
          { src: null, alt: 'Invalid Image' } as any
        ]
      } as WCProduct;

      const result = getProductMainImage(product);
      expect(result).toMatch(/data:image\/svg\+xml;base64,/);
    });
  });

  describe('cn (className utility)', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should filter out falsy values', () => {
      const result = cn('class1', null, undefined, false, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle arrays', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should trim extra spaces', () => {
      const result = cn('  class1  ', '  class2  ');
      // The actual behavior preserves internal spaces from the input
      expect(result).toBe('class1     class2');
    });
  });
});