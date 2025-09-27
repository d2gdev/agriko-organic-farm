// Proper metadata architecture - PROPOSED REFACTOR

// Base metadata that all entities share
export interface BaseMetadata {
  timestamp?: number;
  correlationId?: string;
  requestId?: string;
  environment?: 'development' | 'staging' | 'production';
  region?: string;
  tenant?: string;
}

// Domain-specific metadata types
export interface ProductMetadata extends BaseMetadata {
  productId: number;
  variantId?: number;
  sku?: string;
  categoryId?: number;
}

export interface OrderMetadata extends BaseMetadata {
  orderId: string;
  orderValue: number;
  itemCount: number;
  paymentMethod?: string;
  shippingMethod?: string;
}

export interface SearchMetadata extends BaseMetadata {
  searchQuery: string;
  queryLength: number;
  hasFilters: boolean;
  clickedResults?: number[];
  resultsCount?: number;
}

export interface UserMetadata extends BaseMetadata {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface SyncMetadata extends BaseMetadata {
  syncSource: string;
  autoSync?: boolean;
  realTimeSync?: boolean;
  priority?: string;
}

export interface PageMetadata extends BaseMetadata {
  pageUrl: string;
  referrer?: string;
  entryType?: string;
  startTime?: number;
}

// Discriminated union for type safety
export type EntityMetadata =
  | ({ type: 'product' } & ProductMetadata)
  | ({ type: 'order' } & OrderMetadata)
  | ({ type: 'search' } & SearchMetadata)
  | ({ type: 'user' } & UserMetadata)
  | ({ type: 'sync' } & SyncMetadata)
  | ({ type: 'page' } & PageMetadata)
  | ({ type: 'generic' } & BaseMetadata);

// Type guards
export function isProductMetadata(meta: EntityMetadata): meta is { type: 'product' } & ProductMetadata {
  return meta.type === 'product';
}

export function isOrderMetadata(meta: EntityMetadata): meta is { type: 'order' } & OrderMetadata {
  return meta.type === 'order';
}

// Helper to create metadata with proper typing
export function createMetadata<T extends EntityMetadata['type']>(
  type: T,
  data: Omit<Extract<EntityMetadata, { type: T }>, 'type'>
): Extract<EntityMetadata, { type: T }> {
  return { type, ...data } as Extract<EntityMetadata, { type: T }>;
}