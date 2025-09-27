/**
 * WooCommerce API Adapter
 * Converts between WooCommerce API format (string prices) and internal format (centavos)
 */

import { Core } from '@/types/TYPE_REGISTRY';
import { WCProduct, WCOrder, WCCartItem } from '@/types/woocommerce';
import { parseWooPrice, formatPrice, toCentavos } from '@/lib/php-currency';

/**
 * Raw product data from WooCommerce API
 */
interface WCProductRaw {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  description?: string;
  short_description?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  status?: 'draft' | 'pending' | 'private' | 'publish';
  featured?: boolean;
  catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
  sku?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity?: number | null;
  manage_stock?: boolean;
  categories?: any[];
  tags?: any[];
  images?: any[];
  attributes?: any[];
  variations?: number[];
  weight?: string;
  dimensions?: any;
  meta_data?: any[];
  average_rating?: string;
  rating_count?: number;
  total_sales?: number;
  date_created?: string;
  date_modified?: string;
}

/**
 * Convert raw WooCommerce product to internal format
 * Converts string prices to centavos
 */
export function adaptProductFromAPI(raw: WCProductRaw): WCProduct {
  return {
    ...raw,
    price: raw.price ? parseWooPrice(raw.price) : undefined,
    regular_price: raw.regular_price ? parseWooPrice(raw.regular_price) : undefined,
    sale_price: raw.sale_price ? parseWooPrice(raw.sale_price) : undefined,
  };
}

/**
 * Convert internal product format to WooCommerce API format
 * Converts centavos to string prices
 */
export function adaptProductForAPI(product: Partial<WCProduct>): any {
  const apiProduct: any = { ...product };

  // Convert money fields to string format for API
  if (product.price !== undefined) {
    apiProduct.price = (product.price / 100).toFixed(2);
  }
  if (product.regular_price !== undefined) {
    apiProduct.regular_price = (product.regular_price / 100).toFixed(2);
  }
  if (product.sale_price !== undefined) {
    apiProduct.sale_price = (product.sale_price / 100).toFixed(2);
  }

  return apiProduct;
}

/**
 * Convert array of raw products from API
 */
export function adaptProductsFromAPI(rawProducts: WCProductRaw[]): WCProduct[] {
  return rawProducts.map(adaptProductFromAPI);
}

/**
 * Raw order data from WooCommerce API
 */
interface WCOrderRaw {
  id: number;
  status: string;
  currency: string;
  total?: string;
  total_tax?: string;
  shipping_total?: string;
  discount_total?: string;
  line_items?: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total?: string;
    subtotal?: string;
    total_tax?: string;
    price?: string;
  }>;
  billing?: any;
  shipping?: any;
  payment_method?: string;
  transaction_id?: string;
  date_created?: string;
  date_modified?: string;
}

/**
 * Convert raw WooCommerce order to internal format
 */
export function adaptOrderFromAPI(raw: WCOrderRaw): WCOrder {
  const order: WCOrder = {
    ...raw,
    total: raw.total ? parseWooPrice(raw.total) : undefined,
    total_tax: raw.total_tax ? parseWooPrice(raw.total_tax) : undefined,
    shipping_total: raw.shipping_total ? parseWooPrice(raw.shipping_total) : undefined,
    discount_total: raw.discount_total ? parseWooPrice(raw.discount_total) : undefined,
  } satisfies WCOrder;

  // Convert line items
  if (raw.line_items) {
    order.line_items = raw.line_items.map(item => ({
      ...item,
      total: item.total ? parseWooPrice(item.total) : undefined,
      subtotal: item.subtotal ? parseWooPrice(item.subtotal) : undefined,
      total_tax: item.total_tax ? parseWooPrice(item.total_tax) : undefined,
      price: item.price ? parseWooPrice(item.price) : undefined,
    }));
  }

  return order;
}

/**
 * Convert internal order format to WooCommerce API format
 */
export function adaptOrderForAPI(order: Partial<WCOrder>): any {
  const apiOrder: any = { ...order };

  // Convert money fields
  if (order.total !== undefined) {
    apiOrder.total = order.total.toPesos().toFixed(2);
  }
  if (order.total_tax !== undefined) {
    apiOrder.total_tax = order.total_tax.toPesos().toFixed(2);
  }
  if (order.shipping_total !== undefined) {
    apiOrder.shipping_total = order.shipping_total.toPesos().toFixed(2);
  }
  if (order.discount_total !== undefined) {
    apiOrder.discount_total = order.discount_total.toPesos().toFixed(2);
  }

  // Convert line items
  if (order.line_items) {
    apiOrder.line_items = order.line_items.map((item: any) => {
      const apiItem: any = { ...item };

      if (item.total !== undefined) {
        apiItem.total = (item.total / 100).toFixed(2);
      }
      if (item.subtotal !== undefined) {
        apiItem.subtotal = (item.subtotal / 100).toFixed(2);
      }
      if (item.total_tax !== undefined) {
        apiItem.total_tax = (item.total_tax / 100).toFixed(2);
      }
      if (item.price !== undefined) {
        apiItem.price = (item.price / 100).toFixed(2);
      }

      return apiItem;
    });
  }

  // Always set currency to PHP
  apiOrder.currency = 'PHP';

  return apiOrder;
}

/**
 * Cart item adapter
 */
export function adaptCartItemFromAPI(raw: any): WCCartItem {
  return {
    ...raw,
    line_total: raw.line_total ? parseWooPrice(raw.line_total) : undefined,
    line_subtotal: raw.line_subtotal ? parseWooPrice(raw.line_subtotal) : undefined,
    line_tax: raw.line_tax ? parseWooPrice(raw.line_tax) : undefined,
    line_subtotal_tax: raw.line_subtotal_tax ? parseWooPrice(raw.line_subtotal_tax) : undefined,
  } as WCCartItem;
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items: WCCartItem[]): {
  subtotal: Core.Money;
  tax: Core.Money;
  total: Core.Money;
} {
  let subtotal = 0;
  let tax = 0;

  for (const item of items) {
    if (item.line_subtotal) {
      subtotal += item.line_subtotal;
    }
    if (item.line_tax) {
      tax += item.line_tax;
    }
  }

  const total = (subtotal + tax) as Core.Money;

  return {
    subtotal: subtotal as Core.Money,
    tax: tax as Core.Money,
    total
  };
}

/**
 * Format price for display
 */
export function formatPriceForDisplay(centavos: Core.Money | undefined): string {
  if (centavos === undefined) {
    return '₱0.00';
  }
  return formatPrice(centavos);
}

/**
 * Parse price from user input (forms)
 */
export function parsePriceFromInput(input: string): Core.Money | null {
  // Remove PHP symbols and spaces
  const cleaned = input.replace(/[₱\s,]/g, '');

  // Validate format
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    return null;
  }

  const pesos = parseFloat(cleaned);

  if (isNaN(pesos) || pesos < 0) {
    return null;
  }

  return toCentavos(pesos);
}

/**
 * Validate WooCommerce product data
 */
export function validateProductData(product: WCProduct): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!product.name) {
    errors.push('Product name is required');
  }

  // Validate prices
  if (product.price !== undefined && product.price < 0) {
    errors.push('Price cannot be negative');
  }

  if (product.sale_price !== undefined && product.regular_price !== undefined) {
    if (product.sale_price > product.regular_price) {
      errors.push('Sale price cannot be higher than regular price');
    }
  }

  // Validate stock
  if (product.manage_stock && product.stock_quantity !== null && product.stock_quantity !== undefined) {
    if (product.stock_quantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * WooCommerce API adapter instance
 */
export const WooCommerceAdapter = {
  // Products
  adaptProductFromAPI,
  adaptProductForAPI,
  adaptProductsFromAPI,

  // Orders
  adaptOrderFromAPI,
  adaptOrderForAPI,

  // Cart
  adaptCartItemFromAPI,
  calculateCartTotals,

  // Utilities
  formatPriceForDisplay,
  parsePriceFromInput,
  validateProductData
};

export default WooCommerceAdapter;