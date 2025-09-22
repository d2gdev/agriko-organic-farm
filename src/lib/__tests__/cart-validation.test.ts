import { calculateCartTotal, isProductInStock, getProductMainImage } from '../utils';
import { WCProduct } from '@/types/woocommerce';

describe('Cart Operations', () => {
  describe('calculateCartTotal', () => {
    it('should calculate total for valid cart items', () => {
      const items = [
        { price: '100', quantity: 2 },
        { price: '50.99', quantity: 1 },
        { price: '25.50', quantity: 3 }
      ];
      const total = calculateCartTotal(items);
      expect(total).toBeCloseTo(327.49, 2); // 200 + 50.99 + 76.5
    });

    it('should handle items with commas in price', () => {
      const items = [
        { price: '1,234.56', quantity: 1 },
        { price: '2,000', quantity: 2 }
      ];
      const total = calculateCartTotal(items);
      expect(total).toBeCloseTo(5234.56, 2); // 1234.56 + 4000
    });

    it('should skip invalid items without breaking', () => {
      const items = [
        { price: '100', quantity: 2 },
        { price: 'invalid', quantity: 1 },
        { price: '50', quantity: 1 }
      ];
      const total = calculateCartTotal(items);
      expect(total).toBe(250); // 200 + 0 + 50
    });

    it('should handle empty cart', () => {
      const total = calculateCartTotal([]);
      expect(total).toBe(0);
    });

    it('should prevent overflow', () => {
      const items = [
        { price: '999999999', quantity: 2 }
      ];
      const total = calculateCartTotal(items);
      expect(total).toBe(999999999); // Should cap at maximum
    });

    it('should handle zero prices and quantities', () => {
      const items = [
        { price: '0', quantity: 5 },
        { price: '100', quantity: 0 }
      ];
      const total = calculateCartTotal(items);
      expect(total).toBe(0);
    });
  });

  describe('isProductInStock', () => {
    it('should return true for products in stock without stock management', () => {
      const product: WCProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        stock_status: 'instock',
        manage_stock: false,
        stock_quantity: null,
        price: '100',
        regular_price: '100',
        sale_price: '',
        on_sale: false,
        categories: [],
        tags: [],
        images: [],
        attributes: [],
        variations: [],
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_data: [],
        average_rating: '0',
        rating_count: 0,
        date_created: '',
        date_modified: '',
        short_description: '',
        description: '',
        permalink: '',
        status: 'publish',
        featured: false,
        catalog_visibility: 'visible',
        sku: ''
      };
      expect(isProductInStock(product)).toBe(true);
    });

    it('should return true for products with stock management and available quantity', () => {
      const product: WCProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        stock_status: 'instock',
        manage_stock: true,
        stock_quantity: 10,
        price: '100',
        regular_price: '100',
        sale_price: '',
        on_sale: false,
        categories: [],
        tags: [],
        images: [],
        attributes: [],
        variations: [],
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_data: [],
        average_rating: '0',
        rating_count: 0,
        date_created: '',
        date_modified: '',
        short_description: '',
        description: '',
        permalink: '',
        status: 'publish',
        featured: false,
        catalog_visibility: 'visible',
        sku: ''
      };
      expect(isProductInStock(product)).toBe(true);
    });

    it('should return false for out of stock products', () => {
      const product: WCProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        stock_status: 'outofstock',
        manage_stock: false,
        stock_quantity: null,
        price: '100',
        regular_price: '100',
        sale_price: '',
        on_sale: false,
        categories: [],
        tags: [],
        images: [],
        attributes: [],
        variations: [],
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_data: [],
        average_rating: '0',
        rating_count: 0,
        date_created: '',
        date_modified: '',
        short_description: '',
        description: '',
        permalink: '',
        status: 'publish',
        featured: false,
        catalog_visibility: 'visible',
        sku: ''
      };
      expect(isProductInStock(product)).toBe(false);
    });

    it('should return false for products with zero stock', () => {
      const product: WCProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        stock_status: 'instock',
        manage_stock: true,
        stock_quantity: 0,
        price: '100',
        regular_price: '100',
        sale_price: '',
        on_sale: false,
        categories: [],
        tags: [],
        images: [],
        attributes: [],
        variations: [],
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_data: [],
        average_rating: '0',
        rating_count: 0,
        date_created: '',
        date_modified: '',
        short_description: '',
        description: '',
        permalink: '',
        status: 'publish',
        featured: false,
        catalog_visibility: 'visible',
        sku: ''
      };
      expect(isProductInStock(product)).toBe(false);
    });
  });

  describe('getProductMainImage', () => {
    it('should return first image src when available', () => {
      const product: WCProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        stock_status: 'instock',
        manage_stock: false,
        stock_quantity: null,
        price: '100',
        regular_price: '100',
        sale_price: '',
        on_sale: false,
        categories: [],
        images: [
          { id: 1, src: 'https://example.com/image1.jpg', name: 'Image 1', alt: 'Alt text' },
          { id: 2, src: 'https://example.com/image2.jpg', name: 'Image 2', alt: 'Alt text' }
        ],
        short_description: '',
        description: '',
        permalink: '',
        status: 'publish',
        featured: false,
        catalog_visibility: 'visible',
        sku: '',
        tags: [],
        attributes: [],
        variations: [],
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_data: [],
        average_rating: '0',
        rating_count: 0,
        date_created: '',
        date_modified: ''
      };
      expect(getProductMainImage(product)).toBe('https://example.com/image1.jpg');
    });

    it('should return placeholder SVG when no images', () => {
      const product: WCProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        stock_status: 'instock',
        manage_stock: false,
        stock_quantity: null,
        price: '100',
        regular_price: '100',
        sale_price: '',
        on_sale: false,
        categories: [],
        tags: [],
        images: [],
        attributes: [],
        variations: [],
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_data: [],
        average_rating: '0',
        rating_count: 0,
        date_created: '',
        date_modified: '',
        short_description: '',
        description: '',
        permalink: '',
        status: 'publish',
        featured: false,
        catalog_visibility: 'visible',
        sku: ''
      };
      const result = getProductMainImage(product);
      expect(result).toContain('data:image/svg+xml;base64,');

      // Decode base64 to check SVG content
      const base64Content = result.replace('data:image/svg+xml;base64,', '');
      const decodedSvg = Buffer.from(base64Content, 'base64').toString();
      expect(decodedSvg).toContain('Product Image');
    });

    it('should handle malformed image objects', () => {
      const product: WCProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        stock_status: 'instock',
        manage_stock: false,
        stock_quantity: null,
        price: '100',
        regular_price: '100',
        sale_price: '',
        on_sale: false,
        categories: [],
        images: [
          { id: 1, src: '' as string, name: 'Image 1', alt: 'Alt text' }
        ],
        short_description: '',
        description: '',
        permalink: '',
        status: 'publish',
        featured: false,
        catalog_visibility: 'visible',
        sku: '',
        tags: [],
        attributes: [],
        variations: [],
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_data: [],
        average_rating: '0',
        rating_count: 0,
        date_created: '',
        date_modified: ''
      };
      const result = getProductMainImage(product);
      expect(result).toContain('data:image/svg+xml;base64,');
    });
  });
});