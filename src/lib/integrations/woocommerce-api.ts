import { Core } from '@/types/TYPE_REGISTRY';
/**
 * WooCommerce API Integration Service
 * Connects to WooCommerce REST API to fetch real product and order data
 */

interface WooCommerceConfig {
  apiUrl: string;
  consumerKey: string;
  consumerSecret: string;
  version?: string;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: Core.Money;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  categories: { id: number; name: string; slug: string }[];
  images: { src: string; alt: string }[];
  date_created: string;
  date_modified: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  total_sales: number;
  description: string;
  short_description: string;
  sku: string;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
}

interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  total_tax: string;
  shipping_total: string;
  date_created: string;
  date_modified: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    country: string;
    state: string;
    city: string;
  };
  line_items: {
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
    price: number;
  }[];
}

interface WooCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  date_created: string;
  date_modified: string;
  orders_count: number;
  total_spent: string;
  avatar_url: string;
  billing: {
    country: string;
    state: string;
    city: string;
  };
}

interface ApiResponse<T> {
  data: T;
  headers: Record<string, string>;
}

export class WooCommerceAPIService {
  private config: WooCommerceConfig;
  private baseUrl: string;

  constructor(config?: Partial<WooCommerceConfig>) {
    this.config = {
      apiUrl: config?.apiUrl || process.env.NEXT_PUBLIC_WC_API_URL || '',
      consumerKey: config?.consumerKey || process.env.WC_CONSUMER_KEY || '',
      consumerSecret: config?.consumerSecret || process.env.WC_CONSUMER_SECRET || '',
      version: config?.version || 'wc/v3'
    };

    if (!this.config.apiUrl || !this.config.consumerKey || !this.config.consumerSecret) {
      throw new Error('WooCommerce API configuration is incomplete');
    }

    this.baseUrl = `${this.config.apiUrl}/${this.config.version}`;
  }

  /**
   * Make authenticated request to WooCommerce API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: Record<string, unknown> | unknown[],
    params?: Record<string, number>
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    // Add authentication
    url.searchParams.append('consumer_key', this.config.consumerKey);
    url.searchParams.append('consumer_secret', this.config.consumerSecret);

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url.toString(), requestOptions);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WooCommerce API Error: ${response.status} - ${errorBody}`);
      }

      const responseData = await response.json();
      const headers: Record<string, string> = {};

      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        data: responseData,
        headers
      };
    } catch (error) {
      console.error('WooCommerce API request failed:', error);
      throw error;
    }
  }

  /**
   * Get all products with pagination
   */
  async getProducts(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    status?: string;
    orderby?: string;
    order?: 'asc' | 'desc';
    on_sale?: boolean;
    min_price?: number;
    max_price?: number;
  }): Promise<{
    products: WooCommerceProduct[];
    totalPages: number;
    totalCount: number;
  }> {
    const queryParams: Record<string, number> = {
      page: params?.page || 1,
      per_page: params?.per_page || 20,
      ...Object.fromEntries(
        Object.entries(params || {}).map(([key, value]) => [
          key,
          value == null ? '' : String(value)
        ])
      )
    };

    const response = await this.makeRequest<WooCommerceProduct[]>('products', 'GET', undefined, queryParams);

    return {
      products: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalCount: parseInt(response.headers['x-wp-total'] || '0')
    };
  }

  /**
   * Get specific product by ID
   */
  async getProduct(productId: number): Promise<WooCommerceProduct> {
    const response = await this.makeRequest<WooCommerceProduct>(`products/${productId}`);
    return response.data;
  }

  /**
   * Get recent orders
   */
  async getOrders(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    customer?: number;
    after?: string;
    before?: string;
    orderby?: string;
    order?: 'asc' | 'desc';
  }): Promise<{
    orders: WooCommerceOrder[];
    totalPages: number;
    totalCount: number;
  }> {
    const queryParams: Record<string, number> = {
      page: params?.page || 1,
      per_page: params?.per_page || 20,
      ...Object.fromEntries(
        Object.entries(params || {}).map(([key, value]) => [
          key,
          value == null ? '' : String(value)
        ])
      )
    };

    const response = await this.makeRequest<WooCommerceOrder[]>('orders', 'GET', undefined, queryParams);

    return {
      orders: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalCount: parseInt(response.headers['x-wp-total'] || '0')
    };
  }

  /**
   * Get customers
   */
  async getCustomers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    orderby?: string;
    order?: 'asc' | 'desc';
  }): Promise<{
    customers: WooCommerceCustomer[];
    totalPages: number;
    totalCount: number;
  }> {
    const queryParams: Record<string, number> = {
      page: params?.page || 1,
      per_page: params?.per_page || 20,
      ...Object.fromEntries(
        Object.entries(params || {}).map(([key, value]) => [
          key,
          value == null ? '' : String(value)
        ])
      )
    };

    const response = await this.makeRequest<WooCommerceCustomer[]>('customers', 'GET', undefined, queryParams);

    return {
      customers: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalCount: parseInt(response.headers['x-wp-total'] || '0')
    };
  }

  /**
   * Get sales reports
   */
  async getSalesReport(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    averageOrderValue: number;
    salesData: { date: string; sales: number; orders: number }[];
  }> {
    try {
      // Get recent orders for sales calculation
      const ordersResponse = await this.getOrders({
        per_page: 100,
        status: 'completed',
        after: this.getDateRangeStart(period)
      });

      const orders = ordersResponse.orders;
      const totalSales = orders.reduce((sum, order) => {
        const orderTotal = order.total ?? '0';
        return sum + parseFloat(orderTotal);
      }, 0);
      const totalOrders = orders.length;

      // Get product count
      const productsResponse = await this.getProducts({ per_page: 1 });
      const totalProducts = productsResponse.totalCount;

      // Get customer count
      const customersResponse = await this.getCustomers({ per_page: 1 });
      const totalCustomers = customersResponse.totalCount;

      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Generate sales data by day
      const salesData = this.aggregateSalesData(orders, period);

      return {
        totalSales,
        totalOrders,
        totalCustomers,
        totalProducts,
        averageOrderValue,
        salesData
      };
    } catch (error) {
      console.error('Failed to generate sales report:', error);
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  async getTopSellingProducts(limit: number = 10): Promise<WooCommerceProduct[]> {
    const response = await this.getProducts({
      orderby: 'popularity',
      order: 'desc',
      per_page: limit
    });

    return response.products;
  }

  /**
   * Search products by name or SKU
   */
  async searchProducts(query: string, limit: number = 20): Promise<WooCommerceProduct[]> {
    const response = await this.getProducts({
      search: query,
      per_page: limit
    });

    return response.products;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: number, limit: number = 20): Promise<WooCommerceProduct[]> {
    const response = await this.getProducts({
      category: categoryId.toString(),
      per_page: limit
    });

    return response.products;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; storeInfo?: Record<string, unknown> }> {
    try {
      // Try to fetch system status or a simple endpoint
      const response = await this.makeRequest('system_status');

      return {
        success: true,
        message: 'Successfully connected to WooCommerce API',
        storeInfo: response.data as Record<string, unknown>
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }

  /**
   * Helper: Get date range start for reports
   */
  private getDateRangeStart(period: 'week' | 'month' | 'year'): string {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return start.toISOString();
  }

  /**
   * Helper: Aggregate sales data by date
   */
  private aggregateSalesData(
    orders: WooCommerceOrder[],
    _period: 'week' | 'month' | 'year'
  ): { date: string; sales: number; orders: number }[] {
    const salesMap = new Map<string, { sales: number; orders: number }>();

    orders.forEach(order => {
      const dateString = order.date_created ?? new Date().toISOString();
      const date = new Date(dateString);
      const isoString = date.toISOString();
      const dateKey = isoString.split('T')[0] || isoString.substring(0, 10); // YYYY-MM-DD format

      const existing = salesMap.get(dateKey) || { sales: 0, orders: 0 };
      const orderTotal = order.total ?? '0';
      existing.sales += parseFloat(String(orderTotal));
      existing.orders += 1;
      salesMap.set(dateKey, existing);
    });

    return Array.from(salesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Export singleton instance
export const wooCommerceAPI = new WooCommerceAPIService();