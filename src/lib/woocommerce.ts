import { WCProduct, WCCategory, WCOrder, CheckoutData } from '@/types/woocommerce';

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

// Generic API request function
async function wcRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!WC_API_URL) {
    throw new Error('Missing WooCommerce API URL. Please check your environment variables.');
  }
  
  const url = `${WC_API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: getAuthHeader(),
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
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
  try {
    const products = await wcRequest<WCProduct[]>(`/products?slug=${slug}`);
    return products.length > 0 ? products[0] : null;
  } catch (error) {
    console.error(`Product with slug ${slug} not found:`, error);
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