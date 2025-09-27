/**
 * Mappers for converting between WooCommerce API types (snake_case)
 * and our clean domain types (camelCase)
 */

import {
  Product,
  ProductStatus,
  CatalogVisibility,
  StockStatus,
  ProductType,
  ProductDimensions,
  ProductAttribute,
  ProductImage,
  Category,
  // CategoryImage, // Unused
  Tag,
  Cart,
  CartItem,
  // CartItemAttribute, // Unused
  Order,
  OrderStatus,
  OrderLineItem,
  // OrderItemAttribute, // Unused
  ShippingLine,
  TaxLine,
  FeeLine,
  CouponLine,
  BillingAddress,
  ShippingAddress,
  Customer,
  CustomerRole,
  Review,
  ReviewStatus,
} from '@/types/domain';

import type {
  WCProduct,
  WCCategory,
  WCTag,
  WCOrder,
  WCAddress,
  WCOrderLineItem,
  WCShippingLine,
  WCTaxLine,
  WCFeeLine,
  WCCouponLine,
  WCImage,
  WCAttribute,
  WCDimensions,
  WCMetaData,
} from '@/types/woocommerce';
import { Core } from '@/types/TYPE_REGISTRY';
import { Money } from '@/lib/money';

// Additional WooCommerce types not defined in main types file
interface WCCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  billing: WCAddress;
  shipping: WCAddress;
  orders_count: number;
  total_spent: string;
  average_order_value: string;
  date_created: string;
  last_order_date?: string;
  is_paying_customer: boolean;
  accepts_marketing: boolean;
}

interface WCReview {
  id: number;
  product_id: number;
  reviewer_id?: number;
  reviewer: string;
  reviewer_email: string;
  rating: number;
  review: string;
  verified: boolean;
  status: string;
  helpful_count?: number;
  not_helpful_count?: number;
  date_created: string;
  date_modified?: string;
}

interface WCDimensionsData {
  length: string;
  width: string;
  height: string;
}

interface WCMetaDataItem {
  key: string;
  value: number | boolean;
}

interface SessionCartData {
  id?: string;
  sessionId?: string;
  userId?: number | null;
  items?: SessionCartItemData[];
  subtotal?: number;
  tax?: number;
  shipping?: number;
  total?: number;
  currency?: string;
  appliedCoupons?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  expiresAt?: string | Date;
}

interface SessionCartItemData {
  product_id?: number;
  productId?: number;
  product_name?: string;
  productName?: string;
  product_slug?: string;
  productSlug?: string;
  variant_id?: number | null;
  variantId?: number | null;
  quantity?: number;
  price?: number;
  subtotal?: number;
  sku?: string;
  image?: string | null;
  attributes?: Array<{
    name?: string;
    key?: string;
    value?: string;
  }>;
}

// ============================================
// Product Mappers
// ============================================

export function mapWCProductToDomain(wc: WCProduct): Product {
  return {
    id: wc.id,
    name: wc.name,
    slug: wc.slug,
    description: wc.description || '',
    shortDescription: wc.short_description || '',
    sku: wc.sku || '',
    status: mapProductStatus(wc.status || 'publish'),
    featured: wc.featured || false,
    catalogVisibility: mapCatalogVisibility(wc.catalog_visibility || 'visible'),

    // Pricing
    price: wc.price ? wc.price.toPesos() : 0,
    regularPrice: wc.regular_price ? wc.regular_price.toPesos() : 0,
    salePrice: wc.sale_price ? wc.sale_price.toPesos() : null,
    onSale: wc.on_sale || false,

    // Inventory
    manageStock: wc.manage_stock || false,
    stockQuantity: wc.stock_quantity !== undefined ? wc.stock_quantity : null,
    stockStatus: mapStockStatus(wc.stock_status || 'instock'),
    backordersAllowed: false, // WC type doesn't have backorders field

    // Classification
    type: ProductType.SIMPLE, // Default, as WC doesn't specify type enum
    virtual: false, // WC type doesn't have virtual field
    downloadable: false, // WC type doesn't have downloadable field

    // Organization
    categories: (wc.categories || []).map(mapWCCategoryToDomain),
    tags: (wc.tags || []).map(mapWCTagToDomain),
    attributes: (wc.attributes || []).map(mapWCAttributeToDomain),

    // Media
    images: (wc.images || []).map(mapWCImageToDomain),

    // Dimensions
    weight: wc.weight ? parseFloat(wc.weight) : null,
    dimensions: wc.dimensions ? mapWCDimensionsToDomain(wc.dimensions) : null,

    // Metadata
    createdAt: wc.date_created ? new Date(wc.date_created) : new Date(),
    updatedAt: wc.date_modified ? new Date(wc.date_modified) : new Date(),
  };
}

export function mapDomainProductToWC(product: Product): Partial<WCProduct> {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    short_description: product.shortDescription,
    sku: product.sku,
    status: product.status,
    featured: product.featured,
    catalog_visibility: product.catalogVisibility,

    // Pricing
    price: Money.pesos(product.price),
    regular_price: Money.pesos(product.regularPrice),
    sale_price: product.salePrice ? Money.pesos(product.salePrice) : undefined,
    on_sale: product.onSale,

    // Inventory
    manage_stock: product.manageStock,
    stock_quantity: product.stockQuantity,
    stock_status: product.stockStatus,
    // backorders field not in WCProduct type

    // Classification - these fields are not in WCProduct type
    // type, virtual, downloadable not in WCProduct

    // Organization
    categories: product.categories.map(mapDomainCategoryToWC) as WCCategory[],
    tags: product.tags.map(mapDomainTagToWC) as WCTag[],
    attributes: product.attributes.map(mapDomainAttributeToWC) as WCAttribute[],

    // Media
    images: product.images.map(mapDomainImageToWC),

    // Dimensions
    weight: product.weight?.toString() || '',
    dimensions: product.dimensions ? mapDomainDimensionsToWC(product.dimensions) : undefined,
  };
}

// ============================================
// Category Mappers
// ============================================

export function mapWCCategoryToDomain(wc: WCCategory): Category {
  return {
    id: wc.id,
    name: wc.name,
    slug: wc.slug,
    parentId: 0, // WCCategory doesn't have parent field
    description: wc.description || '',
    display: wc.display || 'default',
    image: wc.image ? {
      id: wc.image.id,
      src: wc.image.src,
      name: wc.image.name || '',
      alt: wc.image.alt || '',
    } : null,
    menuOrder: wc.menu_order || 0,
    count: wc.count || 0,
  };
}

export function mapDomainCategoryToWC(category: Category): Partial<WCCategory> {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    // WCCategory doesn't have parent field
    description: category.description,
    display: category.display,
    image: category.image ? {
      id: category.image.id,
      src: category.image.src,
      name: category.image.name,
      alt: category.image.alt,
    } : undefined,
    menu_order: category.menuOrder,
    count: category.count,
  };
}

// ============================================
// Tag Mappers
// ============================================

export function mapWCTagToDomain(wc: WCTag): Tag {
  return {
    id: wc.id,
    name: wc.name,
    slug: wc.slug,
    description: wc.description || '',
    count: wc.count || 0,
  };
}

export function mapDomainTagToWC(tag: Tag): Partial<WCTag> {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    count: tag.count,
  };
}

// ============================================
// Order Mappers
// ============================================

export function mapWCOrderToDomain(wc: WCOrder): Order {
  return {
    id: wc.id,
    orderNumber: wc.number,
    status: mapOrderStatus(wc.status),
    currency: wc.currency,

    // Totals
    subtotal: wc.total ? Money.fromWooCommerce(wc.total).toPesos() : 0, // WCOrder doesn't have subtotal
    totalTax: wc.total_tax ? Money.fromWooCommerce(wc.total_tax).toPesos() : 0,
    totalShipping: wc.shipping_total ? Money.fromWooCommerce(wc.shipping_total).toPesos() : 0,
    totalDiscount: wc.discount_total ? Money.fromWooCommerce(wc.discount_total).toPesos() : 0,
    total: wc.total ? Money.fromWooCommerce(wc.total).toPesos() : 0,

    // Items
    lineItems: (wc.line_items || []).map(mapWCLineItemToDomain),
    shippingLines: (wc.shipping_lines || []).map(mapWCShippingLineToDomain),
    taxLines: (wc.tax_lines || []).map(mapWCTaxLineToDomain),
    feeLines: (wc.fee_lines || []).map(mapWCFeeLineToDomain),
    couponLines: (wc.coupon_lines || []).map(mapWCCouponLineToDomain),

    // Customer
    customerId: wc.customer_id || null,
    customerNote: wc.customer_note || '',

    // Addresses
    billing: mapWCAddressToDomain(wc.billing) as BillingAddress,
    shipping: mapWCAddressToDomain(wc.shipping) as ShippingAddress,

    // Payment
    paymentMethod: wc.payment_method || '',
    paymentMethodTitle: wc.payment_method_title || '',
    transactionId: wc.transaction_id || null,
    paidAt: wc.date_paid ? new Date(wc.date_paid) : null,

    // Fulfillment
    shippingMethod: '', // WCOrder doesn't have shipping_method
    shippingMethodTitle: '', // WCOrder doesn't have shipping_method_title

    // Metadata
    createdAt: new Date(wc.date_created),
    updatedAt: new Date(wc.date_modified),
    completedAt: wc.date_completed ? new Date(wc.date_completed) : null,
  };
}

// ============================================
// Customer Mappers
// ============================================

export function mapWCCustomerToDomain(wc: WCCustomer): Customer {
  return {
    id: wc.id,
    email: wc.email,
    firstName: wc.first_name || '',
    lastName: wc.last_name || '',
    username: wc.username || '',
    role: mapCustomerRole(wc.role),

    // Addresses
    billing: mapWCAddressToDomain(wc.billing) as BillingAddress,
    shipping: mapWCAddressToDomain(wc.shipping) as ShippingAddress,

    // Stats
    ordersCount: wc.orders_count || 0,
    totalSpent: Money.parse(wc.total_spent).toPesos(),
    averageOrderValue: Money.parse(wc.average_order_value).toPesos(),

    // Metadata
    createdAt: new Date(wc.date_created),
    lastOrderAt: wc.last_order_date ? new Date(wc.last_order_date) : null,

    // Preferences
    isPayingCustomer: wc.is_paying_customer || false,
    acceptsMarketing: wc.accepts_marketing || false,
  };
}

// ============================================
// Review Mappers
// ============================================

export function mapWCReviewToDomain(wc: WCReview): Review {
  return {
    id: wc.id,
    productId: wc.product_id,
    customerId: wc.reviewer_id || null,
    customerName: wc.reviewer,
    customerEmail: wc.reviewer_email,
    rating: wc.rating,
    review: wc.review,
    verified: wc.verified,
    status: mapReviewStatus(wc.status),
    helpfulCount: wc.helpful_count || 0,
    notHelpfulCount: wc.not_helpful_count || 0,
    createdAt: new Date(wc.date_created),
    updatedAt: new Date(wc.date_modified || wc.date_created),
  };
}

// ============================================
// Helper Mappers
// ============================================

function mapProductStatus(status: string | undefined): ProductStatus {
  switch (status) {
    case 'publish': return ProductStatus.PUBLISH;
    case 'draft': return ProductStatus.DRAFT;
    case 'private': return ProductStatus.PRIVATE;
    case 'pending': return ProductStatus.PENDING;
    default: return ProductStatus.DRAFT;
  }
}

function mapCatalogVisibility(visibility: string | undefined): CatalogVisibility {
  switch (visibility) {
    case 'visible': return CatalogVisibility.VISIBLE;
    case 'catalog': return CatalogVisibility.CATALOG;
    case 'search': return CatalogVisibility.SEARCH;
    case 'hidden': return CatalogVisibility.HIDDEN;
    default: return CatalogVisibility.VISIBLE;
  }
}

function mapStockStatus(status: string | undefined): StockStatus {
  switch (status) {
    case 'instock': return StockStatus.IN_STOCK;
    case 'outofstock': return StockStatus.OUT_OF_STOCK;
    case 'onbackorder': return StockStatus.ON_BACKORDER;
    default: return StockStatus.IN_STOCK;
  }
}

function _mapProductType(type: string): ProductType { // Currently unused
  switch (type) {
    case 'simple': return ProductType.SIMPLE;
    case 'grouped': return ProductType.GROUPED;
    case 'external': return ProductType.EXTERNAL;
    case 'variable': return ProductType.VARIABLE;
    default: return ProductType.SIMPLE;
  }
}

function mapOrderStatus(status: string): OrderStatus {
  switch (status) {
    case 'pending': return OrderStatus.PENDING;
    case 'processing': return OrderStatus.PROCESSING;
    case 'on-hold': return OrderStatus.ON_HOLD;
    case 'completed': return OrderStatus.COMPLETED;
    case 'cancelled': return OrderStatus.CANCELLED;
    case 'refunded': return OrderStatus.REFUNDED;
    case 'failed': return OrderStatus.FAILED;
    default: return OrderStatus.PENDING;
  }
}

function mapCustomerRole(role: string): CustomerRole {
  switch (role) {
    case 'customer': return CustomerRole.CUSTOMER;
    case 'subscriber': return CustomerRole.SUBSCRIBER;
    case 'shop_manager': return CustomerRole.SHOP_MANAGER;
    case 'administrator': return CustomerRole.ADMINISTRATOR;
    default: return CustomerRole.CUSTOMER;
  }
}

function mapReviewStatus(status: string): ReviewStatus {
  switch (status) {
    case 'approved': return ReviewStatus.APPROVED;
    case 'pending': return ReviewStatus.PENDING;
    case 'spam': return ReviewStatus.SPAM;
    case 'trash': return ReviewStatus.TRASH;
    default: return ReviewStatus.PENDING;
  }
}

function mapWCAttributeToDomain(wc: WCAttribute): ProductAttribute {
  return {
    id: wc.id || 0,
    name: wc.name,
    position: wc.position || 0,
    visible: wc.visible !== false,
    variation: wc.variation || false,
    options: wc.options || [],
  };
}

function mapDomainAttributeToWC(attr: ProductAttribute): WCAttribute {
  return {
    id: attr.id,
    name: attr.name,
    position: attr.position,
    visible: attr.visible,
    variation: attr.variation,
    options: attr.options,
  };
}

function mapWCImageToDomain(wc: WCImage): ProductImage {
  return {
    id: wc.id,
    src: wc.src,
    name: wc.name || '',
    alt: wc.alt || '',
    position: 0, // WCImage doesn't have position
  };
}

function mapDomainImageToWC(image: ProductImage): WCImage {
  return {
    id: image.id,
    src: image.src,
    name: image.name || '',
    alt: image.alt || ''
  };
}

function mapWCDimensionsToDomain(wc: WCDimensionsData): ProductDimensions {
  return {
    length: parseFloat(wc.length) || 0,
    width: parseFloat(wc.width) || 0,
    height: parseFloat(wc.height) || 0,
    unit: 'cm', // WooCommerce default
  };
}

function mapDomainDimensionsToWC(dims: ProductDimensions): WCDimensionsData {
  return {
    length: dims.length.toString(),
    width: dims.width.toString(),
    height: dims.height.toString(),
  };
}

function mapWCLineItemToDomain(wc: WCOrderLineItem): OrderLineItem {
  return {
    id: wc.id,
    productId: wc.product_id,
    productName: wc.name,
    variantId: wc.variation_id || null,
    quantity: wc.quantity,
    subtotal: wc.subtotal ? Money.fromWooCommerce(wc.subtotal).toPesos() : 0,
    total: wc.total ? Money.fromWooCommerce(wc.total).toPesos() : 0,
    tax: wc.total_tax ? Money.fromWooCommerce(wc.total_tax).toPesos() : 0,
    sku: wc.sku || '',
    price: wc.price ? wc.price : 0, // price is already a number
    attributes: (wc.meta_data || []).map((meta: WCMetaData) => ({
      name: meta.key,
      value: meta.value,
    })),
  };
}

function mapWCShippingLineToDomain(wc: WCShippingLine): ShippingLine {
  return {
    id: wc.id,
    methodTitle: wc.method_title,
    methodId: wc.method_id,
    total: wc.total ? Money.fromWooCommerce(wc.total).toPesos() : 0,
    totalTax: wc.total_tax ? Money.fromWooCommerce(wc.total_tax).toPesos() : 0,
  };
}

function mapWCTaxLineToDomain(wc: WCTaxLine): TaxLine {
  return {
    id: wc.id,
    code: wc.rate_code,
    title: wc.label,
    total: wc.tax_total ? Money.fromWooCommerce(wc.tax_total).toPesos() : 0,
    compound: wc.compound,
  };
}

function mapWCFeeLineToDomain(wc: WCFeeLine): FeeLine {
  return {
    id: wc.id,
    name: wc.name,
    total: wc.total ? Money.fromWooCommerce(wc.total).toPesos() : 0,
    totalTax: wc.total_tax ? Money.fromWooCommerce(wc.total_tax).toPesos() : 0,
  };
}

function mapWCCouponLineToDomain(wc: WCCouponLine): CouponLine {
  return {
    id: wc.id,
    code: wc.code,
    discount: wc.discount ? Money.fromWooCommerce(wc.discount).toPesos() : 0,
    discountTax: wc.discount_tax ? Money.fromWooCommerce(wc.discount_tax).toPesos() : 0,
  };
}

// Generic address mapper for both billing and shipping
function mapWCAddressToDomain(wc: WCAddress): BillingAddress | ShippingAddress {
  return {
    firstName: wc.first_name || '',
    lastName: wc.last_name || '',
    company: wc.company || '',
    addressLine1: wc.address_1 || '',
    addressLine2: wc.address_2 || '',
    city: wc.city || '',
    state: wc.state || '',
    postcode: wc.postcode || '',
    country: wc.country || '',
    phone: wc.phone || '',
    email: wc.email || '', // Only in billing but we handle both
  };
}

// ============================================
// Cart Mappers (from session/local storage)
// ============================================

export function mapSessionCartToDomain(sessionCart: SessionCartData): Cart {
  return {
    id: sessionCart.id || '',
    sessionId: sessionCart.sessionId || '',
    userId: sessionCart.userId?.toString() || null,
    items: (sessionCart.items || []).map(mapSessionCartItemToDomain),
    subtotal: sessionCart.subtotal || 0,
    tax: sessionCart.tax || 0,
    shipping: sessionCart.shipping || 0,
    total: sessionCart.total || 0,
    currency: sessionCart.currency || 'USD',
    appliedCoupons: sessionCart.appliedCoupons || [],
    createdAt: sessionCart.createdAt ? new Date(sessionCart.createdAt) : new Date(),
    updatedAt: sessionCart.updatedAt ? new Date(sessionCart.updatedAt) : new Date(),
    expiresAt: sessionCart.expiresAt ? new Date(sessionCart.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
}

function mapSessionCartItemToDomain(item: SessionCartItemData): CartItem {
  return {
    productId: item.product_id || item.productId || 0,
    productName: item.product_name || item.productName || '',
    productSlug: item.product_slug || item.productSlug || '',
    variantId: item.variant_id || item.variantId || null,
    quantity: item.quantity || 1,
    price: item.price || 0,
    subtotal: item.subtotal || ((item.price || 0) * (item.quantity || 1)) || 0,
    sku: item.sku || '',
    image: item.image || null,
    attributes: (item.attributes || []).map((attr: { name?: string; key?: string; value?: string }) => ({
      name: attr.name || attr.key || '',
      value: attr.value || '',
    })),
  };
}

// ============================================
// Batch Mappers for Collections
// ============================================

export function mapWCProductsToDomain(wcProducts: WCProduct[]): Product[] {
  return wcProducts.map(mapWCProductToDomain);
}

export function mapWCOrdersToDomain(wcOrders: WCOrder[]): Order[] {
  return wcOrders.map(mapWCOrderToDomain);
}

export function mapWCCustomersToDomain(wcCustomers: WCCustomer[]): Customer[] {
  return wcCustomers.map(mapWCCustomerToDomain);
}

export function mapWCReviewsToDomain(wcReviews: WCReview[]): Review[] {
  return wcReviews.map(mapWCReviewToDomain);
}