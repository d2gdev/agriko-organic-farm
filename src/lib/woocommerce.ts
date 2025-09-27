import { Core } from '@/types/TYPE_REGISTRY';
import { WCProduct, WCCategory, WCOrder, CheckoutData } from '@/types/woocommerce';
import { logger } from '@/lib/logger';
import type { WooCommerceOrderData } from '@/types/business-intelligence-types';
import { EventType } from '@/types/events';
import { apiCache } from '@/lib/cache-manager';
import { handleError } from '@/lib/error-sanitizer';
import { productCache } from '@/lib/productCache'; // Import from productCache.ts instead of cache-manager.ts
import { withExternalAPIRetry } from '@/lib/retry-handler';
// import { urlHelpers } from '@/lib/url-constants';

// Auto-sync imports for real-time persistence
import { autoSyncProductToMemgraph, autoSyncOrderToMemgraph, autoSyncSearchToMemgraph } from '@/lib/memgraph-auto-sync';
import { autoSyncProductToQdrant, autoSyncUserSearchToQdrant } from '@/lib/qdrant-auto-sync';
import { saveAnalyticsEvent } from '@/lib/analytics-db';

// Mock data for build time when WooCommerce API is unavailable
function getBuildTimeMockProducts(): WCProduct[] {
  // Use a placeholder URL for build time since urlHelpers won't work in this context
  const shopBaseUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.agrikoph.com';
  
  return [
    {
      id: 1,
      name: "Premium Organic Black Rice",
      slug: "premium-organic-black-rice",
      permalink: `${shopBaseUrl}/product/premium-organic-black-rice`,
      description: "Our premium organic black rice is packed with antioxidants and nutrients. Perfect for health-conscious families seeking nutritious grains.",
      short_description: "Premium organic black rice rich in antioxidants and nutrients.",
      price: 29900 as Core.Money, // 299.00 pesos as centavos
      regular_price: 29900 as Core.Money, // 299.00 pesos as centavos 
      sale_price: undefined,
      on_sale: false,
      status: "publish",
      featured: true,
      catalog_visibility: "visible",
      sku: "AGRIKO-BLACK-RICE-1KG",
      stock_status: "instock",
      stock_quantity: 50,
      manage_stock: true,
      categories: [{ id: 1, name: "Rice", slug: "rice", description: "Premium rice varieties", display: "default", image: null, menu_order: 1, count: 5 }],
      tags: [{ id: 1, name: "Organic", slug: "organic", description: "Certified organic products", count: 10 }],
      images: [{ id: 1, src: "/images/black-rice.jpg", name: "black-rice.jpg", alt: "Premium Organic Black Rice" }],
      attributes: [],
      variations: [],
      weight: "1000",
      dimensions: { length: "20", width: "15", height: "5" },
      meta_data: [],
      average_rating: "4.8",
      rating_count: 24,
      date_created: "2024-01-15T10:00:00",
      date_modified: "2024-01-20T15:30:00"
    },
    {
      id: 2,
      name: "Organic Brown Rice",
      slug: "organic-brown-rice",
      permalink: `${shopBaseUrl}/product/organic-brown-rice`, 
      description: "Wholesome organic brown rice with natural fiber and nutrients. Ideal for healthy meals and balanced nutrition.",
      short_description: "Nutritious organic brown rice with natural fiber.",
      price: 24900 as Core.Money, // 249.00 pesos as centavos
      regular_price: 24900 as Core.Money, // 249.00 pesos as centavos
      sale_price: undefined,
      on_sale: false,
      status: "publish",
      featured: true,
      catalog_visibility: "visible",
      sku: "AGRIKO-BROWN-RICE-1KG",
      stock_status: "instock",
      stock_quantity: 75,
      manage_stock: true,
      categories: [{ id: 1, name: "Rice", slug: "rice", description: "Premium rice varieties", display: "default", image: null, menu_order: 1, count: 5 }],
      tags: [{ id: 1, name: "Organic", slug: "organic", description: "Certified organic products", count: 10 }],
      images: [{ id: 2, src: "/images/brown-rice.jpg", name: "brown-rice.jpg", alt: "Organic Brown Rice" }],
      attributes: [],
      variations: [],
      weight: "1000", 
      dimensions: { length: "20", width: "15", height: "5" },
      meta_data: [],
      average_rating: "4.6",
      rating_count: 18,
      date_created: "2024-01-10T09:00:00",
      date_modified: "2024-01-18T14:20:00"
    },
    {
      id: 3,
      name: "Pure Turmeric Powder",
      slug: "pure-turmeric-powder",
      permalink: `${shopBaseUrl}/product/pure-turmeric-powder`,
      description: "Freshly ground pure turmeric powder from our organic farm. Known for its anti-inflammatory properties and golden color.",
      short_description: "Pure organic turmeric powder with anti-inflammatory benefits.",
      price: 19900 as Core.Money, // 199.00 pesos as centavos
      regular_price: 21900 as Core.Money, // 219.00 pesos as centavos
      sale_price: 19900 as Core.Money, // 199.00 pesos as centavos
      on_sale: true,
      status: "publish",
      featured: false,
      catalog_visibility: "visible",
      sku: "AGRIKO-TURMERIC-250G",
      stock_status: "instock",
      stock_quantity: 30,
      manage_stock: true,
      categories: [{ id: 2, name: "Spices", slug: "spices", description: "Organic spices and herbs", display: "default", image: null, menu_order: 2, count: 8 }],
      tags: [{ id: 1, name: "Organic", slug: "organic", description: "Certified organic products", count: 10 }, { id: 2, name: "Health", slug: "health", description: "Health beneficial products", count: 5 }],
      images: [{ id: 3, src: "/images/turmeric-powder.jpg", name: "turmeric-powder.jpg", alt: "Pure Turmeric Powder" }],
      attributes: [],
      variations: [],
      weight: "250",
      dimensions: { length: "10", width: "10", height: "8" },
      meta_data: [],
      average_rating: "4.9",
      rating_count: 32,
      date_created: "2024-01-05T11:00:00",
      date_modified: "2024-01-25T16:45:00"
    }
  ];
}

function getBuildTimeMockCategories(): WCCategory[] {
  return [
    {
      id: 1,
      name: "Rice",
      slug: "rice", 
      description: "Premium organic rice varieties including black, brown, red, and white rice",
      display: "default",
      image: { id: 10, src: "/images/categories/rice.jpg", name: "rice.jpg", alt: "Rice Category" },
      menu_order: 1,
      count: 5
    },
    {
      id: 2,
      name: "Spices",
      slug: "spices",
      description: "Pure organic spices and herbal powders for health and flavor",
      display: "default", 
      image: { id: 11, src: "/images/categories/spices.jpg", name: "spices.jpg", alt: "Spices Category" },
      menu_order: 2,
      count: 8
    },
    {
      id: 3,
      name: "Health Products",
      slug: "health-products",
      description: "Nutritional supplements and health-focused organic products",
      display: "default",
      image: { id: 12, src: "/images/categories/health.jpg", name: "health.jpg", alt: "Health Products Category" },
      menu_order: 3,
      count: 12
    }
  ];
}

function getBuildTimeMockOrder(): WCOrder {
  return {
    id: 1,
    parent_id: 0,
    number: "1001",
    order_key: "wc_order_mock_build_key",
    created_via: "checkout",
    version: "1.0.0",
    status: "pending",
    currency: "INR",
    date_created: "2024-01-20T10:00:00",
    date_created_gmt: "2024-01-20T04:30:00",
    date_modified: "2024-01-20T10:00:00",
    date_modified_gmt: "2024-01-20T04:30:00", 
    discount_total: "0.00",
    discount_tax: "0.00",
    shipping_total: "50.00",
    shipping_tax: "0.00",
    cart_tax: "0.00",
    total: "349.00",
    total_tax: "0.00",
    prices_include_tax: false,
    customer_id: 0,
    customer_ip_address: "127.0.0.1",
    customer_user_agent: "Build Time Mock",
    customer_note: "",
    billing: {
      first_name: "Mock",
      last_name: "Customer",
      company: "",
      address_1: "Build Time Address",
      address_2: "", 
      city: "Mock City",
      state: "Mock State",
      postcode: "000000",
      country: "IN",
      email: "mock@example.com",
      phone: "+91-0000000000"
    },
    shipping: {
      first_name: "Mock",
      last_name: "Customer", 
      company: "",
      address_1: "Build Time Address",
      address_2: "",
      city: "Mock City",
      state: "Mock State", 
      postcode: "000000",
      country: "IN"
    },
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    transaction_id: "",
    date_paid: null,
    date_paid_gmt: null,
    date_completed: null,
    date_completed_gmt: null,
    cart_hash: "",
    meta_data: [],
    line_items: [
      {
        id: 1,
        name: "Premium Organic Black Rice",
        product_id: 1,
        variation_id: 0,
        quantity: 1,
        tax_class: "",
        subtotal: "299.00",
        subtotal_tax: "0.00", 
        total: "299.00",
        total_tax: "0.00",
        taxes: [],
        meta_data: [],
        sku: "AGRIKO-BLACK-RICE-1KG",
        price: 299 as Core.Money,
        image: {
          id: 1,
          src: "",
          name: "Product Image",
          alt: "Product Image"
        },
        parent_name: null
      }
    ],
    tax_lines: [],
    shipping_lines: [
      {
        id: 1,
        method_title: "Standard Shipping",
        method_id: "standard",
        instance_id: "",
        total: "50.00",
        total_tax: "0.00",
        taxes: [],
        meta_data: []
      }
    ],
    fee_lines: [],
    coupon_lines: [],
    refunds: [],
    payment_url: "",
    is_editable: false,
    needs_payment: true,
    needs_processing: false,
    currency_symbol: "₹"
  };
}

import { config } from '@/lib/unified-config';

const WC_API_URL = config.woocommerce.apiUrl;
const WC_CONSUMER_KEY = config.woocommerce.consumerKey;
const WC_CONSUMER_SECRET = config.woocommerce.consumerSecret;

// Debug logging removed - credentials are working

// Create authorization header
const getAuthHeader = () => {
  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    throw new Error('Missing WooCommerce API credentials. Please check your environment variables.');
  }
  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
};

// Unified timeout configuration based on environment
const TIMEOUT_CONFIG = {
  production: 8000,   // 8 seconds in production
  development: 15000, // 15 seconds in development
  build: 5000,        // 5 seconds during build
  test: 3000          // 3 seconds for tests
};

function getTimeoutMs(): number {
  if (config.isProd) return TIMEOUT_CONFIG.production;
  if (config.isTest) return TIMEOUT_CONFIG.test;
  if (process.env.NEXT_PHASE === 'phase-production-build') return TIMEOUT_CONFIG.build;
  return TIMEOUT_CONFIG.development;
}

// Timeout helper with environment-aware timeouts
function withTimeout<T>(promise: Promise<T>, customTimeoutMs?: number): Promise<T> {
  const timeoutMs = customTimeoutMs ?? getTimeoutMs();
  
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

// Response type that includes headers for pagination
interface WCResponse<T> {
  data: T;
  headers: {
    'x-wp-total'?: string;
    'x-wp-totalpages'?: string;
  };
}

// Generic API request function with timeout, retry, and caching
async function wcRequest<T>(endpoint: string, options: RequestInit = {}, retries: number = 3): Promise<T> {
  if (!WC_API_URL) {
    // During build time or when API is unavailable, return mock data for static generation
    if (!options.method || options.method === 'GET') {
      logger.warn('🏗️ WooCommerce API URL not available during build, returning mock data for static generation', { 
        endpoint, 
        buildContext: process.env.NODE_ENV || 'unknown',
        isBuildTime: true 
      });
      
      // Return mock data instead of empty arrays to support static generation
      if (endpoint.includes('/products')) {
        return getBuildTimeMockProducts() as T;
      }
      if (endpoint.includes('/categories')) {
        return getBuildTimeMockCategories() as T;
      }
      if (endpoint.includes('/orders')) {
        // For individual order endpoints, return a proper mock order structure
        if (endpoint.match(/\/orders\/\d+$/)) {
          return getBuildTimeMockOrder() as T;
        }
        return [] as T; // For orders list, empty is fine
      }
      if (endpoint.includes('/customers')) {
        return [] as T; // Customers list - empty is fine for build
      }
      if (endpoint.includes('/coupons')) {
        return [] as T; // Coupons list - empty is fine for build
      }
      
      // Provide meaningful fallback data structure for unknown endpoints
      logger.debug('🏗️ Unknown endpoint during build, providing empty array fallback', { endpoint });
      return [] as T; // Default to empty array for other endpoints
    }
    throw new Error('Missing WooCommerce API URL. Please check your environment variables.');
  }
  
  // During production build, use shorter retries and timeout
  const buildTimeRetries = config.isProd ? 1 : retries;
  
  const url = `${WC_API_URL}${endpoint}`;
  const cacheKey = `wc:${endpoint}:${JSON.stringify(options)}`;
  
  // Check cache for GET requests only
  if ((!options.method || options.method === 'GET') && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey) as T;
  }
  
  const defaultOptions: RequestInit = {
    headers: getAuthHeader(),
    ...options,
  };

  // Use standardized retry mechanism with circuit breaker protection and global timeout
  const globalTimeoutMs = getTimeoutMs() * (buildTimeRetries + 2); // Extra buffer for total operation
  
  return Promise.race([
    withExternalAPIRetry(
      async () => {
        const response = await withTimeout(fetch(url, defaultOptions));
      
      if (!response.ok) {
        // Sanitize error responses in production to prevent information disclosure
        if (config.isProd) {
          if (response.status === 404) {
            throw new Error('Resource not found');
          }
          if (response.status === 401 || response.status === 403) {
            throw new Error('Authentication required');
          }
          if (response.status >= 500) {
            throw new Error('Service temporarily unavailable');
          }
          throw new Error('Request failed');
        } else {
          // In development, show detailed errors for debugging
          throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data: unknown = await response.json();
      
      // Cache successful GET responses
      if (!options.method || options.method === 'GET') {
        apiCache.set(cacheKey, data as Record<string, unknown>, 5 * 60 * 1000); // 5 minutes cache
      }
      
      return data as T;
    },
    `wc-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`, // Circuit breaker key
    {
      maxAttempts: buildTimeRetries + 1,
      // Add global timeout protection to prevent infinite loops
      baseDelayMs: 1000, // 1 second base delay
      maxDelayMs: config.isProd ? 5000 : 10000,
      backoffMultiplier: 1.5,
      onRetry: (attempt, error) => {
        logger.warn(`WooCommerce API retry ${attempt}/${buildTimeRetries + 1} for ${endpoint}`, {
          error: error instanceof Error ? error.message : String(error),
          totalTimeoutMs: getTimeoutMs() * (buildTimeRetries + 1)
        });
      }
    }),
    // Global timeout to prevent infinite loops
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`WooCommerce API global timeout after ${globalTimeoutMs}ms for ${endpoint}`));
      }, globalTimeoutMs);
    })
  ]);
}

// Auto-sync helper function
async function triggerAutoSync(event: {
  type: EventType;
  productId?: number;
  orderId?: string;
  userId?: string;
  sessionId?: string;
  searchQuery?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const timestamp = Date.now();
  const sessionId = event.sessionId || `session_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    switch (event.type) {
      case EventType.PRODUCT_VIEWED:
        if (event.productId) {
          await Promise.all([
            autoSyncProductToMemgraph({
              eventType: 'product.viewed',
              productId: event.productId,
              userId: event.userId,
              sessionId,
              timestamp,
              metadata: event.metadata || {}
            }),
            autoSyncProductToQdrant({
              productId: event.productId,
              eventType: 'product.viewed',
              metadata: event.metadata
            })
          ]);
        }
        break;

      case EventType.SEARCH_PERFORMED:
        if (event.searchQuery) {
          await Promise.all([
            autoSyncSearchToMemgraph({
              query: event.searchQuery,
              resultsCount: event.metadata?.resultsCount as number || 0,
              userId: event.userId,
              sessionId,
              timestamp,
              clickedResultId: event.metadata?.clickedResultId as number
            }),
            autoSyncUserSearchToQdrant({
              query: event.searchQuery,
              userId: event.userId,
              sessionId,
              resultsCount: event.metadata?.resultsCount as number || 0,
              clickedResults: event.metadata?.clickedResults as number[],
              timestamp
            })
          ]);
        }
        break;

      case EventType.ORDER_CREATED:
        if (event.orderId && event.metadata?.orderData) {
          const orderData = event.metadata.orderData as WooCommerceOrderData;
          await autoSyncOrderToMemgraph({
            eventType: 'order.created',
            orderId: event.orderId,
            userId: event.userId,
            items: (orderData.line_items || []).map(item => ({
              productId: item.product_id,
              quantity: item.quantity,
              price: parseFloat(item.total) / item.quantity
            })),
            orderTotal: parseFloat(orderData.total || '0'),
            timestamp
          });
        }
        break;
    }

    // Always save to analytics DB
    await saveAnalyticsEvent({
      id: `${event.type}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      type: event.type,
      timestamp,
      sessionId,
      userId: event.userId,
      metadata: {
        productId: event.productId,
        orderId: event.orderId,
        searchQuery: event.searchQuery,
        autoSync: true,
        ...event.metadata
      }
    } as const);

  } catch (error) {
    logger.warn('Auto-sync failed, continuing with operation:', {
      error: error instanceof Error ? error.message : String(error),
      eventType: event.type
    });
  }
}

// Product functions
// New function that returns products with pagination info
async function wcRequestWithHeaders<T>(endpoint: string, options: RequestInit = {}, retries: number = 3): Promise<WCResponse<T>> {
  if (!WC_API_URL) {
    // During build time, return mock data with mock headers
    if (!options.method || options.method === 'GET') {
      const mockData = await wcRequest<T>(endpoint, options, retries);
      return {
        data: mockData,
        headers: {
          'x-wp-total': '20', // Mock total
          'x-wp-totalpages': '2' // Mock total pages
        }
      };
    }
    throw new Error('Missing WooCommerce API URL. Please check your environment variables.');
  }

  const url = `${WC_API_URL}${endpoint}`;
  const cacheKey = `wc:${endpoint}:${JSON.stringify(options)}`;

  const defaultOptions: RequestInit = {
    headers: getAuthHeader(),
    ...options,
  };

  return withExternalAPIRetry(
    async () => {
      const response = await withTimeout(fetch(url, defaultOptions));

      if (!response.ok) {
        const errorData = await response.text().catch(() => 'Unknown error');
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data = await response.json() as T;
      const headers = {
        'x-wp-total': response.headers.get('X-WP-Total') || undefined,
        'x-wp-totalpages': response.headers.get('X-WP-TotalPages') || undefined,
      };

      const result = { data, headers };

      // Cache successful GET requests
      if ((!options.method || options.method === 'GET')) {
        apiCache.set(cacheKey, result, 300000); // 5 minutes cache
      }

      return result;
    },
    `WooCommerce API request to ${endpoint}`
  );
}

export async function getAllProducts(params: {
  per_page?: number;
  page?: number;
  status?: string;
  featured?: boolean;
  category?: string;
  tag?: string;
  search?: string;
  orderby?: string;
  order?: 'asc' | 'desc';
  min_price?: string;
  max_price?: string;
} = {}): Promise<WCProduct[]> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

  return wcRequest<WCProduct[]>(endpoint);
}

export async function getAllProductsWithPagination(params: {
  per_page?: number;
  page?: number;
  status?: string;
  featured?: boolean;
  category?: string | string[];
  tag?: string;
  search?: string;
  orderby?: string;
  order?: 'asc' | 'desc';
  min_price?: string;
  max_price?: string;
} = {}): Promise<{ products: WCProduct[]; total: number; totalPages: number }> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'category' && Array.isArray(value)) {
        // For multiple categories, use comma-separated values
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

  const response = await wcRequestWithHeaders<WCProduct[]>(endpoint);

  return {
    products: response.data,
    total: parseInt(response.headers['x-wp-total'] || '0', 10),
    totalPages: parseInt(response.headers['x-wp-totalpages'] || '1', 10)
  };
}

export async function getProductById(id: number, trackingData?: {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<WCProduct | null> {
  // Check cache first
  const cacheKey = `product:${id}`;
  const cached = productCache.get(cacheKey);
  if (cached) {
    // Trigger auto-sync for product view even from cache
    if (trackingData) {
      await triggerAutoSync({
        type: EventType.PRODUCT_VIEWED,
        productId: id,
        userId: trackingData.userId,
        sessionId: trackingData.sessionId,
        metadata: { ...trackingData.metadata, fromCache: true }
      });
    }
    return cached;
  }

  try {
    const product = await wcRequest<WCProduct>(`/products/${id}`);

    // Cache the result
    if (product) {
      productCache.set(cacheKey, product);

      // Trigger auto-sync for product view
      if (trackingData) {
        await triggerAutoSync({
          type: EventType.PRODUCT_VIEWED,
          productId: id,
          userId: trackingData.userId,
          sessionId: trackingData.sessionId,
          metadata: { ...trackingData.metadata, fromAPI: true }
        });
      }
    }

    return product;
  } catch (error) {
    const errorData = handleError(error, 'getProductById', { productId: id });
    logger.error(`Product with ID ${id} not found:`, errorData);
    return null;
  }
}

// Alias for consistency with other APIs
export const getProduct = getProductById;

export async function getProductsByIds(ids: number[]): Promise<WCProduct[]> {
  if (ids.length === 0) {
    return [];
  }

  // Check cache for individual products first to reduce API calls
  const cachedProducts: WCProduct[] = [];
  const uncachedIds: number[] = [];
  
  for (const id of ids) {
    const cached = productCache.get(`product:${id}`);
    if (cached) {
      cachedProducts.push(cached);
    } else {
      uncachedIds.push(id);
    }
  }

  // If all products are cached, return them
  if (uncachedIds.length === 0) {
    return cachedProducts;
  }

  try {
    // Batch fetch uncached products using WooCommerce include parameter
    const idsString = uncachedIds.join(',');
    const fetchedProducts = await wcRequest<WCProduct[]>(`/products?include=${idsString}&per_page=${uncachedIds.length}`);
    
    // Cache the fetched products
    for (const product of fetchedProducts) {
      productCache.set(`product:${product.id}`, product);
    }
    
    // Combine cached and fetched products, maintaining original order
    const allProducts = [...cachedProducts, ...fetchedProducts];
    
    // Sort to match original order if needed
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    return ids.map(id => productMap.get(id)).filter((p): p is WCProduct => p !== undefined);
    
  } catch (error) {
    const errorData = handleError(error, 'getProductsByIds', { uncachedIds });
    logger.error(`Products with IDs ${uncachedIds.join(', ')} not found:`, errorData);
    
    // Return any cached products we found
    return cachedProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<WCProduct | null> {
  // Add validation to ensure slug is defined
  if (!slug) {
    logger.warn('getProductBySlug called with falsy slug');
    return null;
  }
  
  const cacheKey = `slug:${slug}`;
  
  // Try cache first
  const cached = productCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const products = await wcRequest<WCProduct[]>(`/products?slug=${slug}`);
    const product = products.length > 0 ? products[0] : null;
    
    if (product) {
      productCache.set(cacheKey, product);
      productCache.set(`id:${product.id}`, product);
    } else {
      // Cache the "not found" result to prevent repeated requests
      productCache.setError(cacheKey);
    }
    
    return product ?? null;
  } catch (error) {
    const errorData = handleError(error, 'getProductBySlug', { slug });
    logger.error(`Product with slug ${slug} not found:`, errorData);
    
    // Cache the error to prevent repeated failing requests
    productCache.setError(cacheKey);
    
    // Return stale cache if available
    const stale = productCache.getStale(cacheKey);
    if (stale) {
      logger.warn(`Returning stale cache for slug ${slug}`);
      return stale;
    }
    
    return null;
  }
}

export async function getFeaturedProducts(limit: number = 8): Promise<WCProduct[]> {
  return getAllProducts({
    featured: true,
    per_page: limit,
    status: 'publish',
  });
}

export async function searchProducts(query: string, limit: number = 20, trackingData?: {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<WCProduct[]> {
  const results = await getAllProducts({
    search: query,
    per_page: limit,
    status: 'publish',
  });

  // Trigger auto-sync for search tracking
  if (trackingData && query.trim()) {
    await triggerAutoSync({
      type: EventType.SEARCH_PERFORMED,
      searchQuery: query,
      userId: trackingData.userId,
      sessionId: trackingData.sessionId,
      metadata: {
        ...trackingData.metadata,
        resultsCount: results.length,
        searchLimit: limit
      }
    });
  }

  return results;
}

// Category functions
export async function getAllCategories(params: {
  per_page?: number;
  page?: number;
  parent?: number;
  hide_empty?: boolean;
  orderby?: string;
  order?: 'asc' | 'desc';
} = {}): Promise<WCCategory[]> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  const endpoint = `/products/categories${queryString ? `?${queryString}` : ''}`;
  
  return wcRequest<WCCategory[]>(endpoint);
}

export async function getCategoryById(id: number): Promise<WCCategory | null> {
  try {
    return await wcRequest<WCCategory>(`/products/categories/${id}`);
  } catch (error) {
    const errorData = handleError(error, 'getCategoryById', { categoryId: id });
    logger.error(`Category with ID ${id} not found:`, errorData);
    return null;
  }
}

export async function getProductsByCategory(categoryId: number, limit: number = 20): Promise<WCProduct[]> {
  return getAllProducts({
    category: categoryId.toString(),
    per_page: limit,
    status: 'publish',
  });
}

// Order functions
export async function createOrder(orderData: CheckoutData, trackingData?: {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<WCOrder> {
  const order = await wcRequest<WCOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });

  // Trigger auto-sync for order creation
  if (order && trackingData) {
    await triggerAutoSync({
      type: EventType.ORDER_CREATED,
      orderId: order.id.toString(),
      userId: trackingData.userId,
      sessionId: trackingData.sessionId,
      metadata: {
        ...trackingData.metadata,
        orderData: order,
        orderTotal: parseFloat(order.total),
        itemCount: order.line_items.length
      }
    });
  }

  return order;
}

export async function getOrderById(id: number): Promise<WCOrder | null> {
  try {
    return await wcRequest<WCOrder>(`/orders/${id}`);
  } catch (error) {
    const errorData = handleError(error, 'getOrderById', { orderId: id });
    logger.error(`Order with ID ${id} not found:`, errorData);
    return null;
  }
}

export async function updateOrder(id: number, data: Partial<WCOrder>): Promise<WCOrder> {
  return wcRequest<WCOrder>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Export wcRequest function for webhook configuration
export { wcRequest };

// Re-export utility functions for convenience
export {
  formatPrice,
  calculateCartTotal,
  isProductInStock,
  getProductMainImage,
  stripHtml
} from './utils';

// Cache helpers for ISR
export const revalidate = 3600; // 1 hour

export async function getStaticProductSlugs(): Promise<string[]> {
    try {
      const products = await getAllProducts({
        per_page: 100,
        status: 'publish',
      });
      return products.map(product => product.slug);
    } catch (error) {
      const errorData = handleError(error, 'getAllProductSlugs');
      logger.error('Error fetching product slugs:', errorData);
      return [];
    }
  }
