import {
  getAllProducts,
  getProductById,
  getProduct,
  getProductBySlug,
  getProductsByIds,
  getFeaturedProducts,
  searchProducts,
  getAllCategories,
  getCategoryById,
  getProductsByCategory,
  createOrder,
  getOrderById,
  updateOrder,
  getStaticProductSlugs
} from '@/lib/woocommerce';
import * as unifiedConfig from '@/lib/unified-config';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/cache-manager', () => ({
  apiCache: {
    has: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('@/lib/productCache', () => ({
  productCache: {
    get: jest.fn(),
    set: jest.fn(),
    setError: jest.fn(),
    getStale: jest.fn(),
  },
}));

jest.mock('@/lib/error-sanitizer', () => ({
  handleError: jest.fn((error) => ({ error: error.message })),
}));

jest.mock('@/lib/unified-config', () => {
  const mockConfig = {
    woocommerce: {
      apiUrl: 'https://test.com/wp-json/wc/v3',
      consumerKey: 'test_consumer_key',
      consumerSecret: 'test_consumer_secret',
    },
    jwt: {
      secret: 'test_jwt_secret',
    },
    nextauth: {
      url: 'https://test.example.com',
      secret: 'test_nextauth_secret',
    },
  };

  return {
    get config() {
      return mockConfig;
    },
    set config(value) {
      // Allow setting for spies
    },
  };
});

jest.mock('@/lib/retry-handler', () => ({
  withExternalAPIRetry: jest.fn((fn) => fn()),
}));

const mockProduct = {
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
  categories: [{ id: 1, name: 'Test Category', slug: 'test-category', description: 'Test category', display: 'default', image: null, menu_order: 1, count: 5 }],
  tags: [{ id: 1, name: 'Test Tag', slug: 'test-tag', description: 'Test tag', count: 1 }],
  images: [{ id: 1, src: 'test-image.jpg', name: 'test-image.jpg', alt: 'Test Image' }],
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

const mockCategory = {
  id: 1,
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test category description',
  display: 'default',
  image: { id: 1, src: 'test-image.jpg', name: 'test-image.jpg', alt: 'Test Category' },
  menu_order: 1,
  count: 5
};

const mockOrder = {
  id: 1,
  parent_id: 0,
  number: '1001',
  order_key: 'test_order_key',
  created_via: 'checkout',
  version: '1.0.0',
  status: 'processing',
  currency: 'USD',
  date_created: '2024-01-01T10:00:00',
  date_created_gmt: '2024-01-01T10:00:00',
  date_modified: '2024-01-01T10:00:00',
  date_modified_gmt: '2024-01-01T10:00:00',
  discount_total: '0.00',
  discount_tax: '0.00',
  shipping_total: '5.00',
  shipping_tax: '0.00',
  cart_tax: '0.00',
  total: '24.99',
  total_tax: '0.00',
  prices_include_tax: false,
  customer_id: 1,
  customer_ip_address: '127.0.0.1',
  customer_user_agent: 'test-agent',
  customer_note: 'Test order',
  billing: {
    first_name: 'John',
    last_name: 'Doe',
    company: '',
    address_1: '123 Test St',
    address_2: '',
    city: 'Test City',
    state: 'Test State',
    postcode: '12345',
    country: 'US',
    email: 'john@test.com',
    phone: '555-555-5555'
  },
  shipping: {
    first_name: 'John',
    last_name: 'Doe',
    company: '',
    address_1: '123 Test St',
    address_2: '',
    city: 'Test City',
    state: 'Test State',
    postcode: '12345',
    country: 'US'
  },
  payment_method: 'stripe',
  payment_method_title: 'Credit Card',
  transaction_id: 'test_transaction',
  date_paid: '2024-01-01T10:00:00',
  date_paid_gmt: '2024-01-01T10:00:00',
  date_completed: null,
  date_completed_gmt: null,
  cart_hash: 'test_hash',
  meta_data: [],
  line_items: [{
    id: 1,
    name: 'Test Product',
    product_id: 1,
    variation_id: 0,
    quantity: 1,
    tax_class: '',
    subtotal: '19.99',
    subtotal_tax: '0.00',
    total: '19.99',
    total_tax: '0.00',
    taxes: [],
    meta_data: [],
    sku: 'TEST-SKU',
    price: 19.99,
    image: {
      id: 1,
      src: 'test-image.jpg',
      name: 'test-image.jpg',
      alt: 'Test Product'
    },
    parent_name: null
  }],
  tax_lines: [],
  shipping_lines: [{
    id: 1,
    method_title: 'Standard Shipping',
    method_id: 'standard',
    instance_id: '1',
    total: '5.00',
    total_tax: '0.00',
    taxes: [],
    meta_data: []
  }],
  fee_lines: [],
  coupon_lines: [],
  refunds: [],
  payment_url: '',
  is_editable: false,
  needs_payment: false,
  needs_processing: true,
  currency_symbol: '$'
};

describe('WooCommerce API', () => {
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      woocommerce: {
        apiUrl: 'https://test.com/wp-json/wc/v3',
        consumerKey: 'test_key',
        consumerSecret: 'test_secret'
      },
      isProd: false,
      isTest: true
    };

    jest.spyOn(unifiedConfig, 'config', 'get').mockReturnValue(mockConfig);
    mockFetch.mockClear();

    const mockApiCache = require('@/lib/cache-manager').apiCache;
    const mockProductCache = require('@/lib/productCache').productCache;

    // Clear all mocks - let each test set up its own specific behavior
    mockApiCache.has.mockClear();
    mockApiCache.get.mockClear();
    mockApiCache.set.mockClear();

    mockProductCache.get.mockClear();
    mockProductCache.set.mockClear();
    mockProductCache.setError.mockClear();
    mockProductCache.getStale.mockClear();

    // Set safe default implementations to prevent undefined returns
    mockApiCache.has.mockImplementation(() => false);
    mockApiCache.get.mockImplementation(() => null);
    mockApiCache.set.mockImplementation(() => undefined);

    mockProductCache.get.mockImplementation(() => null);
    mockProductCache.set.mockImplementation(() => undefined);
    mockProductCache.setError.mockImplementation(() => undefined);
    mockProductCache.getStale.mockImplementation(() => null);
  });

  describe('getAllProducts', () => {
    it('should fetch all products successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      const result = await getAllProducts();

      expect(result).toEqual([mockProduct]);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/wp-json/wc/v3/products',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic')
          })
        })
      );
    });

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      await getAllProducts({
        per_page: 10,
        page: 1,
        featured: true,
        status: 'publish'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=10&page=1&featured=true&status=publish'),
        expect.any(Object)
      );
    });

    it('should return mock data during build time', async () => {
      // Since WC_API_URL is cached at module load, we need to mock it differently
      // The implementation checks if (!WC_API_URL), so let's make sure this condition is met

      // Mock the unified-config module to return empty apiUrl
      jest.doMock('@/lib/unified-config', () => ({
        config: {
          woocommerce: {
            apiUrl: '', // This should trigger the mock data path
            consumerKey: 'test_key',
            consumerSecret: 'test_secret',
          },
          isProd: false,
        },
      }));

      // Re-import the module to get the updated config
      jest.resetModules();
      const { getAllProducts: freshGetAllProducts } = await import('@/lib/woocommerce');

      const result = await freshGetAllProducts();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Premium Organic Black Rice');

      // Restore the mock
      jest.dontMock('@/lib/unified-config');
      jest.resetModules();
    });
  });

  describe('getProductById', () => {
    it('should fetch product by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      });

      const result = await getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/wp-json/wc/v3/products/1',
        expect.any(Object)
      );
    });

    it('should return cached product if available', async () => {
      const mockProductCache = require('@/lib/productCache').productCache;
      mockProductCache.get.mockImplementation((key: string) => {
        if (key === 'product:1') {
          return mockProduct;
        }
        return null;
      });

      const result = await getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null for non-existent product', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await getProductById(999);

      expect(result).toBeNull();
    });
  });

  describe('getProduct', () => {
    it('should be an alias for getProductById', () => {
      expect(getProduct).toBe(getProductById);
    });
  });

  describe('getProductBySlug', () => {
    it('should fetch product by slug successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      const result = await getProductBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('slug=test-product'),
        expect.any(Object)
      );
    });

    it('should return null for empty slug', async () => {
      const result = await getProductBySlug('');

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return cached product if available', async () => {
      const mockProductCache = require('@/lib/productCache').productCache;
      mockProductCache.get.mockImplementation((key: string) => {
        if (key === 'slug:test-product') {
          return mockProduct;
        }
        return null;
      });

      const result = await getProductBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should cache error for non-existent product', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const mockProductCache = require('@/lib/productCache').productCache;
      const result = await getProductBySlug('non-existent');

      expect(result).toBeNull();
      expect(mockProductCache.setError).toHaveBeenCalledWith('slug:non-existent');
    });
  });

  describe('getProductsByIds', () => {
    it('should return empty array for empty input', async () => {
      const result = await getProductsByIds([]);

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch multiple products by IDs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      const result = await getProductsByIds([1, 2]);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include=1,2'),
        expect.any(Object)
      );
    });

    it('should combine cached and fetched products', async () => {
      const mockProductCache = require('@/lib/productCache').productCache;
      const cachedProduct = { ...mockProduct, id: 2 };

      mockProductCache.get.mockImplementation((key: string) => {
        if (key === 'product:2') return cachedProduct;
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      const result = await getProductsByIds([1, 2]);

      expect(result).toHaveLength(2);
    });
  });

  describe('getFeaturedProducts', () => {
    it('should fetch featured products', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      const result = await getFeaturedProducts(5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('featured=true&per_page=5&status=publish'),
        expect.any(Object)
      );
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      const result = await searchProducts('test query', 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test+query&per_page=10&status=publish'),
        expect.any(Object)
      );
    });
  });

  describe('getAllCategories', () => {
    it('should fetch all categories successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCategory]
      });

      const result = await getAllCategories();

      expect(result).toEqual([mockCategory]);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/wp-json/wc/v3/products/categories',
        expect.any(Object)
      );
    });

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCategory]
      });

      await getAllCategories({
        per_page: 10,
        hide_empty: true
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=10&hide_empty=true'),
        expect.any(Object)
      );
    });
  });

  describe('getCategoryById', () => {
    it('should fetch category by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategory
      });

      const result = await getCategoryById(1);

      expect(result).toEqual(mockCategory);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/wp-json/wc/v3/products/categories/1',
        expect.any(Object)
      );
    });

    it('should return null for non-existent category', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await getCategoryById(999);

      expect(result).toBeNull();
    });
  });

  describe('getProductsByCategory', () => {
    it('should fetch products by category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      const result = await getProductsByCategory(1, 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=1&per_page=10&status=publish'),
        expect.any(Object)
      );
    });
  });

  describe('createOrder', () => {
    const orderData = {
      payment_method: 'stripe',
      payment_method_title: 'Credit Card',
      set_paid: false,
      billing: mockOrder.billing,
      shipping: mockOrder.shipping,
      line_items: [{ product_id: 1, quantity: 1 }]
    };

    it('should create order successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder
      });

      const result = await createOrder(orderData);

      expect(result).toEqual(mockOrder);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/wp-json/wc/v3/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(orderData)
        })
      );
    });
  });

  describe('getOrderById', () => {
    it('should fetch order by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder
      });

      const result = await getOrderById(1);

      expect(result).toEqual(mockOrder);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/wp-json/wc/v3/orders/1',
        expect.any(Object)
      );
    });

    it('should return null for non-existent order', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await getOrderById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      const updateData = { status: 'completed' };
      const updatedOrder = { ...mockOrder, status: 'completed' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedOrder
      });

      const result = await updateOrder(1, updateData);

      expect(result).toEqual(updatedOrder);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.com/wp-json/wc/v3/orders/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
    });
  });

  describe('getStaticProductSlugs', () => {
    it('should fetch product slugs for static generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct, { ...mockProduct, id: 2, slug: 'product-2' }]
      });

      const result = await getStaticProductSlugs();

      expect(result).toEqual(['test-product', 'product-2']);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=100&status=publish'),
        expect.any(Object)
      );
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const result = await getStaticProductSlugs();

      expect(result).toEqual([]);
    });
  });

  describe('error handling and production behavior', () => {
    it('should sanitize errors in production', async () => {
      // Mock the unified-config module to return production mode
      jest.doMock('@/lib/unified-config', () => ({
        config: {
          woocommerce: {
            apiUrl: 'https://test.com/wp-json/wc/v3',
            consumerKey: 'test_key',
            consumerSecret: 'test_secret',
          },
          isProd: true, // This should trigger production error handling
        },
      }));

      // Re-import the module to get the updated config
      jest.resetModules();
      const { getAllProducts: freshGetAllProducts } = await import('@/lib/woocommerce');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(freshGetAllProducts()).rejects.toThrow('Resource not found');

      // Restore the mock
      jest.dontMock('@/lib/unified-config');
      jest.resetModules();
    });

    it('should show detailed errors in development', async () => {
      mockConfig.isProd = false;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(getAllProducts()).rejects.toThrow('WooCommerce API error: 500 Internal Server Error');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(getAllProducts()).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(getAllProducts()).rejects.toThrow();
    });
  });

  describe('caching behavior', () => {
    it('should use cached data when available', async () => {
      const mockApiCache = require('@/lib/cache-manager').apiCache;
      mockApiCache.has.mockReturnValue(true);
      mockApiCache.get.mockReturnValue([mockProduct]);

      const result = await getAllProducts();

      expect(result).toEqual([mockProduct]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should cache successful responses', async () => {
      const mockApiCache = require('@/lib/cache-manager').apiCache;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockProduct]
      });

      await getAllProducts();

      expect(mockApiCache.set).toHaveBeenCalled();
    });
  });
});