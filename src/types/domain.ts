/**
 * Clean domain types for internal use (camelCase)
 * These are separate from external API types (WooCommerce, etc.)
 */

// ============================================
// Product Domain
// ============================================

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  status: ProductStatus;
  featured: boolean;
  catalogVisibility: CatalogVisibility;

  // Pricing
  price: number;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;

  // Inventory
  manageStock: boolean;
  stockQuantity: number | null;
  stockStatus: StockStatus;
  backordersAllowed: boolean;

  // Classification
  type: ProductType;
  virtual: boolean;
  downloadable: boolean;

  // Organization
  categories: Category[];
  tags: Tag[];
  attributes: ProductAttribute[];

  // Media
  images: ProductImage[];

  // Dimensions
  weight: number | null;
  dimensions: ProductDimensions | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductStatus {
  PUBLISH = 'publish',
  DRAFT = 'draft',
  PRIVATE = 'private',
  PENDING = 'pending',
}

export enum CatalogVisibility {
  VISIBLE = 'visible',
  CATALOG = 'catalog',
  SEARCH = 'search',
  HIDDEN = 'hidden',
}

export enum StockStatus {
  IN_STOCK = 'instock',
  OUT_OF_STOCK = 'outofstock',
  ON_BACKORDER = 'onbackorder',
}

export enum ProductType {
  SIMPLE = 'simple',
  GROUPED = 'grouped',
  EXTERNAL = 'external',
  VARIABLE = 'variable',
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'm' | 'mm';
}

export interface ProductAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface ProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
  position: number;
}

// ============================================
// Category & Tag Domain
// ============================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  description: string;
  display: 'default' | 'products' | 'subcategories' | 'both';
  image: CategoryImage | null;
  menuOrder: number;
  count: number;
}

export interface CategoryImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

// ============================================
// Cart Domain
// ============================================

export interface Cart {
  id: string;
  sessionId: string;
  userId: string | null;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  appliedCoupons: string[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CartItem {
  productId: number;
  productName: string;
  productSlug: string;
  variantId: number | null;
  quantity: number;
  price: number;
  subtotal: number;
  sku: string;
  image: string | null;
  attributes: CartItemAttribute[];
}

export interface CartItemAttribute {
  name: string;
  value: string;
}

// ============================================
// Order Domain
// ============================================

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  currency: string;

  // Totals
  subtotal: number;
  totalTax: number;
  totalShipping: number;
  totalDiscount: number;
  total: number;

  // Items
  lineItems: OrderLineItem[];
  shippingLines: ShippingLine[];
  taxLines: TaxLine[];
  feeLines: FeeLine[];
  couponLines: CouponLine[];

  // Customer
  customerId: number | null;
  customerNote: string;

  // Addresses
  billing: BillingAddress;
  shipping: ShippingAddress;

  // Payment
  paymentMethod: string;
  paymentMethodTitle: string;
  transactionId: string | null;
  paidAt: Date | null;

  // Fulfillment
  shippingMethod: string;
  shippingMethodTitle: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export interface OrderLineItem {
  id: number;
  productId: number;
  productName: string;
  variantId: number | null;
  quantity: number;
  subtotal: number;
  total: number;
  tax: number;
  sku: string;
  price: number;
  attributes: OrderItemAttribute[];
}

export interface OrderItemAttribute {
  name: string;
  value: string;
}

export interface ShippingLine {
  id: number;
  methodTitle: string;
  methodId: string;
  total: number;
  totalTax: number;
}

export interface TaxLine {
  id: number;
  code: string;
  title: string;
  total: number;
  compound: boolean;
}

export interface FeeLine {
  id: number;
  name: string;
  total: number;
  totalTax: number;
}

export interface CouponLine {
  id: number;
  code: string;
  discount: number;
  discountTax: number;
}

// ============================================
// Address Domain
// ============================================

export interface Address {
  firstName: string;
  lastName: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface BillingAddress extends Address {
  email: string;
}

export interface ShippingAddress extends Address {
  // Shipping-specific fields if needed
}

// ============================================
// Customer Domain
// ============================================

export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: CustomerRole;

  // Addresses
  billing: BillingAddress;
  shipping: ShippingAddress;

  // Stats
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;

  // Metadata
  createdAt: Date;
  lastOrderAt: Date | null;

  // Preferences
  isPayingCustomer: boolean;
  acceptsMarketing: boolean;
}

export enum CustomerRole {
  CUSTOMER = 'customer',
  SUBSCRIBER = 'subscriber',
  SHOP_MANAGER = 'shop_manager',
  ADMINISTRATOR = 'administrator',
}

// ============================================
// Review Domain
// ============================================

export interface Review {
  id: number;
  productId: number;
  customerId: number | null;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5
  review: string;
  verified: boolean;
  status: ReviewStatus;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReviewStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  SPAM = 'spam',
  TRASH = 'trash',
}

// ============================================
// Search Domain
// ============================================

export interface SearchQuery {
  query: string;
  filters: SearchFilters;
  sort: SearchSort;
  pagination: SearchPagination;
}

export interface SearchFilters {
  categories: number[];
  tags: number[];
  priceRange: PriceRange | null;
  inStock: boolean | null;
  onSale: boolean | null;
  featured: boolean | null;
  attributes: AttributeFilter[];
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface AttributeFilter {
  name: string;
  values: string[];
}

export interface SearchSort {
  field: SearchSortField;
  direction: 'asc' | 'desc';
}

export enum SearchSortField {
  RELEVANCE = 'relevance',
  PRICE = 'price',
  NAME = 'name',
  DATE = 'date',
  SALES = 'sales',
  RATING = 'rating',
}

export interface SearchPagination {
  page: number;
  perPage: number;
}

export interface SearchResult {
  query: SearchQuery;
  products: Product[];
  totalResults: number;
  totalPages: number;
  facets: SearchFacets;
  executionTime: number;
}

export interface SearchFacets {
  categories: FacetBucket[];
  tags: FacetBucket[];
  priceRanges: PriceFacetBucket[];
  attributes: AttributeFacetBucket[];
}

export interface FacetBucket {
  id: number;
  name: string;
  count: number;
}

export interface PriceFacetBucket {
  min: number;
  max: number;
  count: number;
}

export interface AttributeFacetBucket {
  name: string;
  values: FacetBucket[];
}

// ============================================
// Analytics Domain
// ============================================

export interface AnalyticsEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;
  sessionId: string;
  userId: string | null;
  properties: AnalyticsProperties;
}

export interface AnalyticsProperties {
  [key: string]: number | boolean | Date | null;
}

export interface AnalyticsSession {
  sessionId: string;
  userId: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  pageViews: number;
  events: AnalyticsEvent[];
  source: string;
  medium: string;
  campaign: string | null;
  device: DeviceInfo;
  location: LocationInfo;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  screenResolution: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

// ============================================
// Recommendation Domain
// ============================================

export interface ProductRecommendation {
  productId: number;
  score: number;
  reason: RecommendationReason;
  algorithm: RecommendationAlgorithm;
}

export enum RecommendationReason {
  FREQUENTLY_BOUGHT_TOGETHER = 'frequently_bought_together',
  SIMILAR_PRODUCTS = 'similar_products',
  TRENDING = 'trending',
  PERSONALIZED = 'personalized',
  COMPLEMENTARY = 'complementary',
}

export enum RecommendationAlgorithm {
  COLLABORATIVE_FILTERING = 'collaborative_filtering',
  CONTENT_BASED = 'content_based',
  HYBRID = 'hybrid',
  POPULARITY = 'popularity',
}

// ============================================
// Validation Domain
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}