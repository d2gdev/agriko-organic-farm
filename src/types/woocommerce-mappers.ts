// Mapping layer between WooCommerce API (snake_case) and internal types (camelCase)

import { Core } from '@/types/TYPE_REGISTRY';
import { Order, CartItem, WooCommerceProduct } from '@/lib/business-logic-validator';

// Internal domain types (camelCase)
export interface DomainProduct {
  id: number;
  name: string;
  status: 'publish' | 'private' | 'draft';
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  manageStock: boolean;
  stockQuantity: number | null;
  price: Core.Money;
  regularPrice: string;
  salePrice: string;
  categories: Array<{ id: number; name: string; slug: string }>;
}

export interface DomainCartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  sku?: string;
  variantId?: number;
}

export interface DomainOrder {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  total: number;
  currency: string;
  lineItems: DomainOrderLineItem[];
  billing: DomainAddress;
  shipping?: DomainAddress;
  paymentMethod: string;
  paymentMethodTitle: string;
  customerId?: number;
  dateCreated: string;
}

export interface DomainOrderLineItem {
  id: number;
  productId: number;
  variantId?: number;
  quantity: number;
  name: string;
  price: number;
  total: number;
  sku?: string;
}

export interface DomainAddress {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

// Mappers from WooCommerce (snake_case) to Domain (camelCase)
export function mapWooCommerceProductToDomain(wooProduct: WooCommerceProduct): DomainProduct {
  return {
    id: wooProduct.id,
    name: wooProduct.name,
    status: wooProduct.status,
    stockStatus: wooProduct.stock_status,
    manageStock: wooProduct.manage_stock,
    stockQuantity: wooProduct.stock_quantity,
    price: parseFloat(wooProduct.price || '0') as Core.Money,
    regularPrice: wooProduct.regular_price,
    salePrice: wooProduct.sale_price?.toString() || '',
    categories: wooProduct.categories,
  };
}

export function mapCartItemToDomain(cartItem: CartItem): DomainCartItem {
  return {
    productId: cartItem.product_id,
    productName: cartItem.product_name,
    quantity: cartItem.quantity,
    price: cartItem.price,
    sku: cartItem.product_sku,
    variantId: cartItem.variation_id,
  };
}

export function mapOrderToDomain(order: Order): DomainOrder {
  return {
    id: order.id,
    status: order.status,
    total: order.total,
    currency: order.currency,
    lineItems: order.line_items.map(item => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variation_id,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      total: item.total,
      sku: item.sku,
    })),
    billing: {
      firstName: order.billing.first_name,
      lastName: order.billing.last_name,
      email: order.billing.email,
      phone: order.billing.phone,
      address1: order.billing.address_1,
      address2: order.billing.address_2,
      city: order.billing.city,
      state: order.billing.state,
      postcode: order.billing.postcode,
      country: order.billing.country,
    },
    shipping: order.shipping ? {
      firstName: order.shipping.first_name,
      lastName: order.shipping.last_name,
      phone: '',  // ShippingAddress in business-logic-validator doesn't have phone
      address1: order.shipping.address_1,
      address2: order.shipping.address_2,
      city: order.shipping.city,
      state: order.shipping.state,
      postcode: order.shipping.postcode,
      country: order.shipping.country,
    } : undefined,
    paymentMethod: order.payment_method,
    paymentMethodTitle: order.payment_method_title,
    customerId: order.customer_id,
    dateCreated: order.date_created,
  };
}

// Reverse mappers (Domain to WooCommerce) for API calls
export function mapDomainCartItemToWooCommerce(item: DomainCartItem): CartItem {
  return {
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    price: item.price,
    product_sku: item.sku,
    variation_id: item.variantId,
  };
}