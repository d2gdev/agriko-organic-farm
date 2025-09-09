import { WCProduct, WCCategory, WCOrder, CheckoutData } from '@/types/woocommerce';
import { productCache } from './productCache';

const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

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

// Timeout helper with shorter timeout during build
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = process.env.NODE_ENV === 'production' ? 10000 : 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

// Generic API request function with timeout and retry
async function wcRequest<T>(endpoint: string, options: RequestInit = {}, retries: number = 3): Promise<T> {
  if (!WC_API_URL) {
    // During build time or when API is unavailable, return empty array for GET requests
    if (!options.method || options.method === 'GET') {
      console.warn('WooCommerce API URL not available during build, returning empty result');
      return [] as unknown as T;
    }
    throw new Error('Missing WooCommerce API URL. Please check your environment variables.');
  }
  
  // During production build, use shorter retries and timeout
  const buildTimeRetries = process.env.NODE_ENV === 'production' ? 1 : retries;
  
  const url = `${WC_API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: getAuthHeader(),
    ...options,
  };

  for (let attempt = 0; attempt <= buildTimeRetries; attempt++) {
    try {
      const fetchPromise = fetch(url, defaultOptions);
      // Use dynamic timeout based on environment
      const timeoutMs = process.env.NODE_ENV === 'production' ? 10000 : 30000;
      const response = await withTimeout(fetchPromise, timeoutMs);
      
      if (!response.ok) {
        if (response.status >= 500 && attempt < buildTimeRetries) {
          console.warn(`Server error ${response.status} on attempt ${attempt + 1}, retrying...`);
          // Exponential backoff: 1s, 2s, 4s, etc.
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          continue;
        }
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt === retries) {
        console.error(`Error fetching ${endpoint} after ${retries + 1} attempts:`, error);
        throw error;
      }
      console.warn(`Request failed on attempt ${attempt + 1}, retrying...`, error);
      // Exponential backoff: 1s, 2s, 4s, etc.
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Product functions
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

export async function getProductById(id: number): Promise<WCProduct | null> {
  try {
    return await wcRequest<WCProduct>(`/products/${id}`);
  } catch (error) {
    console.error(`Product with ID ${id} not found:`, error);
    return null;
  }
}

export async function getProductBySlug(slug: string): Promise<WCProduct | null> {
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
    
    return product;
  } catch (error) {
    console.error(`Product with slug ${slug} not found:`, error);
    
    // Cache the error to prevent repeated failing requests
    productCache.setError(cacheKey);
    
    // Return stale cache if available
    const stale = productCache.getStale(cacheKey);
    if (stale) {
      console.warn(`Returning stale cache for slug ${slug}`);
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

export async function searchProducts(query: string, limit: number = 20): Promise<WCProduct[]> {
  return getAllProducts({
    search: query,
    per_page: limit,
    status: 'publish',
  });
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
    console.error(`Category with ID ${id} not found:`, error);
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
export async function createOrder(orderData: CheckoutData): Promise<WCOrder> {
  return wcRequest<WCOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

export async function getOrderById(id: number): Promise<WCOrder | null> {
  try {
    return await wcRequest<WCOrder>(`/orders/${id}`);
  } catch (error) {
    console.error(`Order with ID ${id} not found:`, error);
    return null;
  }
}

export async function updateOrder(id: number, data: Partial<WCOrder>): Promise<WCOrder> {
  return wcRequest<WCOrder>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

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
    console.error('Error fetching product slugs:', error);
    return [];
  }
}