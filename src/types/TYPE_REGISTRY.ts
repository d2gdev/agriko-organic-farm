/**
 * CENTRAL TYPE REGISTRY - SINGLE SOURCE OF TRUTH
 *
 * ALL types must be registered here. No local type definitions allowed.
 * To add a new type, you must prove:
 * 1. No duplicate exists (search required)
 * 2. Business justification documented
 * 3. Proper type safety (no 'any', no index signatures)
 * 4. Monetary values as numbers
 * 5. Code review approval
 */

// ============================================================================
// TYPE REGISTRATION METADATA
// ============================================================================

export interface TypeRegistration {
  name: string;
  category: 'core' | 'domain' | 'api' | 'ui' | 'infrastructure';
  owner: string;
  approved: boolean;
  approvedBy?: string;
  approvalDate?: string;
  businessJustification: string;
  duplicateCheck: {
    searched: boolean;
    similarTypes: string[];
    whyNotReused?: string;
  };
}

// ============================================================================
// CORE TYPES (Primitives and Base Types)
// ============================================================================

export namespace Core {
  /** Unique identifier type - use instead of string for IDs */
  export type ID = string & { readonly __brand: 'ID' };

  /** Monetary value using bulletproof Money class - NO MORE TYPE ASSERTIONS */
  export type Money = import('@/lib/money').Money;

  /** ISO date string */
  export type ISODate = string & { readonly __brand: 'ISODate' };

  /** Email address */
  export type Email = string & { readonly __brand: 'Email' };

  /** URL */
  export type URL = string & { readonly __brand: 'URL' };

  /** Percentage value (0-100) */
  export type Percentage = number & { readonly __brand: 'Percentage' };

  /** Currency codes - Philippines Peso only for now */
  export type Currency = 'PHP';

  /** UUID v4 */
  export type UUID = string & { readonly __brand: 'UUID' };

  /** Non-empty string */
  export type NonEmptyString = string & { readonly __brand: 'NonEmpty' };

  /** Timestamp in milliseconds */
  export type Timestamp = number & { readonly __brand: 'Timestamp' };
}

// ============================================================================
// DOMAIN TYPES (Business Logic)
// ============================================================================

export namespace Domain {
  /**
   * Product - SINGLE DEFINITION
   * Owner: @product-team
   * Approved: 2024-01-26
   */
  export interface Product {
    id: Core.ID;
    name: Core.NonEmptyString;
    slug: string;
    description: string;
    shortDescription?: string;
    sku: string;
    price: Core.Money;
    regularPrice: Core.Money;
    salePrice?: Core.Money;
    costPrice?: Core.Money;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'mm' | 'cm' | 'm' | 'in' | 'ft';
    };
    stockStatus: 'instock' | 'outofstock' | 'onbackorder';
    stockQuantity: number | null;
    manageStock: boolean;
    backorders: 'no' | 'notify' | 'yes';
    categories: Category[];
    tags: Tag[];
    images: ProductImage[];
    attributes: ProductAttribute[];
    variations?: ProductVariation[];
    relatedIds?: Core.ID[];
    crossSellIds?: Core.ID[];
    upsellIds?: Core.ID[];
    featured: boolean;
    virtual: boolean;
    downloadable: boolean;
    taxStatus: 'taxable' | 'shipping' | 'none';
    taxClass: string;
    reviewsAllowed: boolean;
    averageRating: number;
    ratingCount: number;
    totalSales: number;
    dateCreated: Core.ISODate;
    dateModified: Core.ISODate;
    status: 'publish' | 'draft' | 'pending' | 'private';
    metadata: ProductMetadata;
  }

  /**
   * Order - SINGLE DEFINITION
   * Owner: @commerce-team
   * Approved: 2024-01-26
   */
  export interface Order {
    id: Core.ID;
    orderNumber: string;
    status: OrderStatus;
    currency: Currency;
    total: Core.Money;
    subtotal: Core.Money;
    totalTax: Core.Money;
    shippingTotal: Core.Money;
    discountTotal: Core.Money;
    refundTotal: Core.Money;
    lineItems: OrderLineItem[];
    billing: Address;
    shipping?: Address;
    paymentMethod: string;
    paymentMethodTitle: string;
    transactionId?: string;
    customerId?: Core.ID;
    customerNote?: string;
    dateCreated: Core.ISODate;
    dateModified: Core.ISODate;
    datePaid?: Core.ISODate;
    dateCompleted?: Core.ISODate;
    metadata: OrderMetadata;
  }

  /**
   * User - SINGLE DEFINITION
   * Owner: @auth-team
   * Approved: 2024-01-26
   */
  export interface User {
    id: Core.ID;
    email: Core.Email;
    username: string;
    firstName?: string;
    lastName?: string;
    displayName: string;
    role: UserRole;
    permissions: Permission[];
    avatar?: Core.URL;
    isActive: boolean;
    isVerified: boolean;
    lastLogin?: Core.ISODate;
    createdAt: Core.ISODate;
    updatedAt: Core.ISODate;
    metadata: UserMetadata;
  }

  /**
   * Cart - SINGLE DEFINITION
   * Owner: @commerce-team
   * Approved: 2024-01-26
   */
  export interface Cart {
    id: Core.ID;
    sessionId: string;
    userId?: Core.ID;
    items: CartItem[];
    subtotal: Core.Money;
    tax: Core.Money;
    shipping: Core.Money;
    discount: Core.Money;
    total: Core.Money;
    currency: Currency;
    couponCodes: string[];
    createdAt: Core.ISODate;
    updatedAt: Core.ISODate;
    expiresAt: Core.ISODate;
  }

  // Supporting types
  export interface Category {
    id: Core.ID;
    name: string;
    slug: string;
    parent?: Core.ID;
  }

  export interface Tag {
    id: Core.ID;
    name: string;
    slug: string;
  }

  export interface ProductImage {
    id: Core.ID;
    src: Core.URL;
    alt: string;
    position: number;
  }

  export interface ProductAttribute {
    id: Core.ID;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }

  export interface ProductVariation {
    id: Core.ID;
    sku: string;
    price: Core.Money;
    regularPrice: Core.Money;
    salePrice?: Core.Money;
    stockStatus: 'instock' | 'outofstock' | 'onbackorder';
    stockQuantity: number | null;
    attributes: Record<string, string>;
    image?: ProductImage;
  }

  export interface OrderLineItem {
    id: Core.ID;
    productId: Core.ID;
    variationId?: Core.ID;
    name: string;
    quantity: number;
    price: Core.Money;
    subtotal: Core.Money;
    total: Core.Money;
    tax: Core.Money;
    sku?: string;
    metadata: Record<string, string>;
  }

  export interface CartItem {
    productId: Core.ID;
    variationId?: Core.ID;
    quantity: number;
    price: Core.Money;
    metadata: Record<string, string>;
  }

  export interface Address {
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email?: Core.Email;
    phone?: string;
  }

  // Enums as const objects (better than TypeScript enums)
  export const OrderStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    ON_HOLD: 'on-hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    FAILED: 'failed'
  } as const;
  export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

  export const UserRole = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    ANALYST: 'analyst',
    CUSTOMER: 'customer',
    GUEST: 'guest'
  } as const;
  export type UserRole = typeof UserRole[keyof typeof UserRole];

  export const Permission = {
    ADMIN_FULL: 'admin.full',
    PRODUCTS_READ: 'products.read',
    PRODUCTS_WRITE: 'products.write',
    ORDERS_READ: 'orders.read',
    ORDERS_WRITE: 'orders.write',
    USERS_READ: 'users.read',
    USERS_WRITE: 'users.write',
    ANALYTICS_VIEW: 'analytics.view',
    REPORTS_GENERATE: 'reports.generate'
  } as const;
  export type Permission = typeof Permission[keyof typeof Permission];

  export const Currency = {
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    KES: 'KES'
  } as const;
  export type Currency = typeof Currency[keyof typeof Currency];

  // Metadata types (discriminated unions)
  export type ProductMetadata = {
    type: 'product';
    source: 'woocommerce' | 'manual' | 'import';
    lastSyncedAt?: Core.ISODate;
    syncVersion?: string;
  };

  export type OrderMetadata = {
    type: 'order';
    source: 'website' | 'pos' | 'phone' | 'marketplace';
    channel?: string;
    affiliateId?: string;
  };

  export type UserMetadata = {
    type: 'user';
    source: 'registration' | 'import' | 'social';
    referralCode?: string;
    preferences?: Record<string, string>;
  };
}

// ============================================================================
// API TYPES (External Integration)
// ============================================================================

export namespace API {
  /**
   * Standard API Response
   * Owner: @platform-team
   * Approved: 2024-01-26
   */
  export interface Response<T> {
    success: boolean;
    data?: T;
    error?: ErrorResponse;
    metadata: ResponseMetadata;
  }

  export interface ErrorResponse {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string; // Only in development
  }

  export interface ResponseMetadata {
    timestamp: Core.ISODate;
    requestId: string;
    version: string;
    duration?: number;
  }

  /**
   * Pagination
   * Owner: @platform-team
   * Approved: 2024-01-26
   */
  export interface PaginatedResponse<T> extends Response<T[]> {
    pagination: {
      page: number;
      pageSize: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }

  export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }

  /**
   * Search
   * Owner: @search-team
   * Approved: 2024-01-26
   */
  export interface SearchParams extends PaginationParams {
    query: string;
    filters?: SearchFilter[];
    facets?: string[];
  }

  export interface SearchFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like';
    value: number | boolean | (number)[];
  }

  export interface SearchResult<T> extends PaginatedResponse<T> {
    facets?: SearchFacet[];
    suggestions?: string[];
    executionTime: number;
  }

  export interface SearchFacet {
    field: string;
    values: Array<{
      value: number;
      count: number;
    }>;
  }
}

// ============================================================================
// UI TYPES (Component Props)
// ============================================================================

export namespace UI {
  /**
   * Common UI Props
   * Owner: @ui-team
   * Approved: 2024-01-26
   */
  export interface BaseComponentProps {
    className?: string;
    id?: string;
    testId?: string;
    children?: React.ReactNode;
  }

  export interface InteractiveComponentProps extends BaseComponentProps {
    disabled?: boolean;
    loading?: boolean;
    onClick?: (event: React.MouseEvent) => void;
    onFocus?: (event: React.FocusEvent) => void;
    onBlur?: (event: React.FocusEvent) => void;
  }

  export interface FormComponentProps<T = unknown> extends BaseComponentProps {
    name: string;
    value: T;
    onChange: (value: T) => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    helpText?: string;
  }
}

// ============================================================================
// INFRASTRUCTURE TYPES (System)
// ============================================================================

export namespace Infrastructure {
  /**
   * Cache Entry - SINGLE DEFINITION
   * Owner: @platform-team
   * Approved: 2024-01-26
   */
  export interface CacheEntry<T> {
    key: string;
    value: T;
    timestamp: Core.Timestamp;
    expiresAt: Core.Timestamp;
    accessCount: number;
    lastAccessedAt: Core.Timestamp;
    tags?: string[];
  }

  /**
   * Authentication - SINGLE DEFINITION
   * Owner: @auth-team
   * Approved: 2024-01-26
   */
  export interface AuthResult {
    isAuthenticated: boolean;
    user?: Domain.User;
    token?: string;
    refreshToken?: string;
    expiresAt?: Core.ISODate;
    error?: string;
  }

  export interface Session {
    id: Core.ID;
    userId: Core.ID;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Core.ISODate;
    expiresAt: Core.ISODate;
    lastActivityAt: Core.ISODate;
  }

  /**
   * Events - SINGLE DEFINITION
   * Owner: @analytics-team
   * Approved: 2024-01-26
   */
  export const EventType = {
    // Product Events
    PRODUCT_VIEWED: 'product.viewed',
    PRODUCT_ADDED_TO_CART: 'product.added_to_cart',
    PRODUCT_REMOVED_FROM_CART: 'product.removed_from_cart',
    PRODUCT_PURCHASED: 'product.purchased',

    // User Events
    USER_REGISTERED: 'user.registered',
    USER_LOGGED_IN: 'user.logged_in',
    USER_LOGGED_OUT: 'user.logged_out',

    // Order Events
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    ORDER_COMPLETED: 'order.completed',
    ORDER_CANCELLED: 'order.cancelled',

    // Search Events
    SEARCH_PERFORMED: 'search.performed',
    SEARCH_RESULT_CLICKED: 'search.result_clicked'
  } as const;
  export type EventType = typeof EventType[keyof typeof EventType];

  export interface Event<T = unknown> {
    id: Core.ID;
    type: EventType;
    timestamp: Core.Timestamp;
    userId?: Core.ID;
    sessionId: string;
    payload: T;
    metadata?: Record<string, string>;
  }
}

// ============================================================================
// TYPE GUARDS AND VALIDATORS
// ============================================================================

export namespace Guards {
  export function isID(value: unknown): value is Core.ID {
    return typeof value === 'string' && value.length > 0;
  }

  export function isMoney(value: unknown): value is Core.Money {
    return typeof value === 'number' && value >= 0 && Number.isInteger(value);
  }

  export function isEmail(value: unknown): value is Core.Email {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  export function isISODate(value: unknown): value is Core.ISODate {
    return typeof value === 'string' && !isNaN(Date.parse(value));
  }

  export function isProduct(value: unknown): value is Domain.Product {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'name' in value &&
      'price' in value
    );
  }

  export function isOrder(value: unknown): value is Domain.Order {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'orderNumber' in value &&
      'total' in value
    );
  }

  export function isUser(value: unknown): value is Domain.User {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'email' in value &&
      'role' in value
    );
  }
}

// ============================================================================
// TYPE REGISTRY VALIDATION
// ============================================================================

/**
 * Add this to your build process to validate type usage
 */
export const TYPE_REGISTRY_VERSION = '1.0.0';
export const TYPE_REGISTRY_HASH = 'sha256:abc123...'; // Generate from content

/**
 * All registered types with their metadata
 * This ensures documentation and ownership is tracked
 */
export const REGISTERED_TYPES: TypeRegistration[] = [
  {
    name: 'Domain.Product',
    category: 'domain',
    owner: '@product-team',
    approved: true,
    approvedBy: '@lead-architect',
    approvalDate: '2024-01-26',
    businessJustification: 'Core e-commerce product entity',
    duplicateCheck: {
      searched: true,
      similarTypes: ['WCProduct', 'WooCommerceProduct'],
      whyNotReused: 'Consolidated all product types into single definition'
    }
  },
  // ... add registration for each type
];

// TypeRegistration already exported above as interface