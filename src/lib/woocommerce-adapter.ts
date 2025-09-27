/**
 * WooCommerce API Adapter
 * Converts between WooCommerce API format (string prices) and internal format (centavos)
 */

import { Core } from '@/types/TYPE_REGISTRY';
import { WCProduct, WCOrder, WCCartItem, WCOrderLineItem } from '@/types/woocommerce';
import { Money } from '@/lib/money';
import { logger } from '@/lib/logger';
import { SerializedWCProduct, serializeProduct } from '@/lib/product-serializer';

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
  const dataIssues: string[] = [];

  // Parse price with extensive validation
  let price: Core.Money;
  try {
    if (!raw.price || raw.price === '') {
      dataIssues.push('missing_price');
      price = Money.ZERO;
    } else {
      price = Money.fromWooCommerce(raw.price);
      if (price.isZero) {
        dataIssues.push('zero_price');
      }
    }
  } catch (error) {
    dataIssues.push(`invalid_price: ${raw.price}`);
    price = Money.ZERO;
  }

  // Parse regular price
  let regular_price: Core.Money;
  try {
    if (!raw.regular_price || raw.regular_price === '') {
      // Default to price if not specified
      regular_price = price;
    } else {
      regular_price = Money.fromWooCommerce(raw.regular_price);
    }
  } catch (error) {
    dataIssues.push(`invalid_regular_price: ${raw.regular_price}`);
    regular_price = price;
  }

  // Parse sale price
  let sale_price: Core.Money | null = null;
  try {
    if (raw.sale_price && raw.sale_price !== '') {
      sale_price = Money.fromWooCommerce(raw.sale_price);

      // Validate sale price logic
      if (sale_price.greaterThan(regular_price)) {
        dataIssues.push('sale_price_higher_than_regular');
        // Fix it automatically
        sale_price = regular_price;
      }
    }
  } catch (error) {
    dataIssues.push(`invalid_sale_price: ${raw.sale_price}`);
    sale_price = null;
  }

  // Log data quality issues (but don't fail)
  if (dataIssues.length > 0) {
    logger.warn('Product data quality issues', {
      productId: raw.id,
      productName: raw.name,
      issues: dataIssues
    });
  }

  return {
    ...raw,
    price,  // Always exists now
    regular_price,
    sale_price,
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
    apiProduct.price = product.price.toWooCommerce();
  }
  if (product.regular_price !== undefined) {
    apiProduct.regular_price = product.regular_price.toWooCommerce();
  }
  if (product.sale_price !== undefined && product.sale_price !== null) {
    apiProduct.sale_price = product.sale_price.toWooCommerce();
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
 * Internal order format with Money objects for calculations
 */
export interface InternalWCOrder extends Omit<WCOrder, 'total' | 'total_tax' | 'shipping_total' | 'discount_total' | 'line_items'> {
  total?: Core.Money;
  total_tax?: Core.Money;
  shipping_total?: Core.Money;
  discount_total?: Core.Money;
  line_items?: InternalWCOrderLineItem[];
}

export interface InternalWCOrderLineItem extends Omit<WCOrderLineItem, 'total' | 'subtotal' | 'total_tax' | 'price'> {
  total?: Core.Money;
  subtotal?: Core.Money;
  total_tax?: Core.Money;
  price?: Core.Money;
}

export interface InternalWCCartItem extends Omit<WCCartItem, 'line_subtotal' | 'line_tax' | 'line_total' | 'line_subtotal_tax'> {
  line_subtotal?: Core.Money;
  line_tax?: Core.Money;
  line_total?: Core.Money;
  line_subtotal_tax?: Core.Money;
}

/**
 * Convert raw WooCommerce order to internal format
 */
export function adaptOrderFromAPI(raw: WCOrderRaw): Partial<InternalWCOrder> {
  const order: any = {
    ...raw,
    total: raw.total ? Money.fromWooCommerce(raw.total) : undefined,
    total_tax: raw.total_tax ? Money.fromWooCommerce(raw.total_tax) : undefined,
    shipping_total: raw.shipping_total ? Money.fromWooCommerce(raw.shipping_total) : undefined,
    discount_total: raw.discount_total ? Money.fromWooCommerce(raw.discount_total) : undefined,
  };

  // Convert line items
  if (raw.line_items) {
    order.line_items = raw.line_items.map(item => ({
      id: item.id,
      name: item.name,
      product_id: item.product_id,
      quantity: item.quantity,
      total: item.total ? Money.fromWooCommerce(item.total) : undefined,
      subtotal: item.subtotal ? Money.fromWooCommerce(item.subtotal) : undefined,
      total_tax: item.total_tax ? Money.fromWooCommerce(item.total_tax) : undefined,
      price: item.price ? Money.fromWooCommerce(item.price) : undefined,
      // Add default values for missing properties
      variation_id: 0,
      tax_class: '',
      subtotal_tax: '0.00',
      taxes: [],
      meta_data: [],
      sku: '',
      image: { id: 0, src: '', name: '', alt: '' },
      parent_name: null
    }));
  }

  return order;
}

/**
 * Convert internal order format to WooCommerce API format
 */
export function adaptOrderForAPI(order: Partial<InternalWCOrder>): any {
  const apiOrder: any = { ...order };

  // Convert money fields
  if (order.total !== undefined) {
    apiOrder.total = order.total.toWooCommerce();
  }
  if (order.total_tax !== undefined) {
    apiOrder.total_tax = order.total_tax.toWooCommerce();
  }
  if (order.shipping_total !== undefined) {
    apiOrder.shipping_total = order.shipping_total.toWooCommerce();
  }
  if (order.discount_total !== undefined) {
    apiOrder.discount_total = order.discount_total.toWooCommerce();
  }

  // Convert line items
  if (order.line_items) {
    apiOrder.line_items = order.line_items.map((item: InternalWCOrderLineItem) => {
      const apiItem: any = { ...item };

      if (item.total !== undefined) {
        apiItem.total = item.total.toWooCommerce();
      }
      if (item.subtotal !== undefined) {
        apiItem.subtotal = item.subtotal.toWooCommerce();
      }
      if (item.total_tax !== undefined) {
        apiItem.total_tax = item.total_tax.toWooCommerce();
      }
      if (item.price !== undefined) {
        apiItem.price = item.price.toWooCommerce();
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
export function adaptCartItemFromAPI(raw: any): InternalWCCartItem {
  return {
    ...raw,
    line_total: raw.line_total ? Money.fromWooCommerce(raw.line_total.toString()) : undefined,
    line_subtotal: raw.line_subtotal ? Money.fromWooCommerce(raw.line_subtotal.toString()) : undefined,
    line_tax: raw.line_tax ? Money.fromWooCommerce(raw.line_tax.toString()) : undefined,
    line_subtotal_tax: raw.line_subtotal_tax ? Money.fromWooCommerce(raw.line_subtotal_tax.toString()) : undefined,
  };
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items: InternalWCCartItem[]): {
  subtotal: Core.Money;
  tax: Core.Money;
  total: Core.Money;
} {
  let subtotal = Money.ZERO;
  let tax = Money.ZERO;

  for (const item of items) {
    if (item.line_subtotal) {
      subtotal = subtotal.add(item.line_subtotal);
    }
    if (item.line_tax) {
      tax = tax.add(item.line_tax);
    }
  }

  const total = subtotal.add(tax);

  return {
    subtotal,
    tax,
    total
  };
}

/**
 * Format price for display
 */
export function formatPriceForDisplay(money: Core.Money | undefined): string {
  if (money === undefined) {
    return '₱0.00';
  }
  return money.format();
}

/**
 * Parse price from user input (forms)
 */
export function parsePriceFromInput(input: string): Core.Money | null {
  try {
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

    return Money.pesos(pesos);
  } catch {
    return null;
  }
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
  if (product.price !== undefined) {
    const price = typeof product.price === 'number' ? Money.pesos(product.price) : product.price;
    if (price.lessThan(Money.ZERO)) {
      errors.push('Price cannot be negative');
    }
  }

  if (product.sale_price !== undefined && product.sale_price !== null && product.regular_price !== undefined) {
    const salePrice = typeof product.sale_price === 'number' ? Money.pesos(product.sale_price) : product.sale_price;
    const regularPrice = typeof product.regular_price === 'number' ? Money.pesos(product.regular_price) : product.regular_price;
    if (salePrice.greaterThan(regularPrice)) {
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
 * Convert raw WooCommerce product directly to serialized format for Next.js 15 client components
 * First adapts to WCProduct with Money objects, then serializes for client components
 */
export function adaptProductFromAPIForClient(raw: WCProductRaw): SerializedWCProduct {
  // First convert to WCProduct with Money objects
  const product = adaptProductFromAPI(raw);

  // Then serialize Money objects to plain numbers
  return serializeProduct(product);
}

/**
 * Convert array of raw WooCommerce products to serialized format for Next.js 15 client components
 */
export function adaptProductsFromAPIForClient(rawProducts: WCProductRaw[]): SerializedWCProduct[] {
  return rawProducts.map(adaptProductFromAPIForClient);
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