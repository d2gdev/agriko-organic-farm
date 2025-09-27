/**
 * Proper metadata architecture with discriminated unions
 * This replaces the old EntityMetadata grab-bag
 */

// Base metadata shared by all entities
export interface BaseMetadata {
  timestamp?: number;
  correlationId?: string;
  requestId?: string;
  environment?: 'development' | 'staging' | 'production';
  region?: string;
  tenant?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
  tags?: string[];
  source?: string;
}

// Product-specific metadata
export interface ProductMetadata extends BaseMetadata {
  type: 'product';
  productId: number;
  variantId?: number;
  sku?: string;
  categoryId?: number;
}

// Order-specific metadata
export interface OrderMetadata extends BaseMetadata {
  type: 'order';
  orderId: string;
  orderTotal: number;
  itemCount: number;
  paymentMethod?: string;
  shippingMethod?: string;
}

// Search-specific metadata
export interface SearchMetadata extends BaseMetadata {
  type: 'search';
  searchQuery: string;
  queryLength: number;
  hasFilters: boolean;
  clickedResults?: number[];
  resultsCount?: number;
}

// User/Session metadata
export interface UserMetadata extends BaseMetadata {
  type: 'user';
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

// Sync operation metadata
export interface SyncMetadata extends BaseMetadata {
  type: 'sync';
  syncSource: string;
  autoSync?: boolean;
  realTimeSync?: boolean;
  priority?: string;
}

// Page/Navigation metadata
export interface PageMetadata extends BaseMetadata {
  type: 'page';
  pageUrl: string;
  referrer?: string;
  entryType?: string;
  startTime?: number;
}

// Analytics metadata
export interface AnalyticsMetadata extends BaseMetadata {
  type: 'analytics';
  eventName?: string;
  eventValue?: number;
  category?: string;
  label?: string;
}

// Validation metadata
export interface ValidationMetadata extends BaseMetadata {
  type: 'validation';
  validatedAt: number;
  validationErrors?: string[];
  validationWarnings?: string[];
}

// Generic metadata for untyped scenarios
export interface GenericMetadata extends BaseMetadata {
  type: 'generic';
  name?: string;
  value?: number;
  [key: string]: unknown; // Only allow in generic type
}

// Discriminated union of all metadata types
export type EntityMetadata =
  | ProductMetadata
  | OrderMetadata
  | SearchMetadata
  | UserMetadata
  | SyncMetadata
  | PageMetadata
  | AnalyticsMetadata
  | ValidationMetadata
  | GenericMetadata;

// Type guards
export function isProductMetadata(meta: EntityMetadata): meta is ProductMetadata {
  return meta.type === 'product';
}

export function isOrderMetadata(meta: EntityMetadata): meta is OrderMetadata {
  return meta.type === 'order';
}

export function isSearchMetadata(meta: EntityMetadata): meta is SearchMetadata {
  return meta.type === 'search';
}

export function isUserMetadata(meta: EntityMetadata): meta is UserMetadata {
  return meta.type === 'user';
}

export function isSyncMetadata(meta: EntityMetadata): meta is SyncMetadata {
  return meta.type === 'sync';
}

export function isPageMetadata(meta: EntityMetadata): meta is PageMetadata {
  return meta.type === 'page';
}

export function isAnalyticsMetadata(meta: EntityMetadata): meta is AnalyticsMetadata {
  return meta.type === 'analytics';
}

export function isValidationMetadata(meta: EntityMetadata): meta is ValidationMetadata {
  return meta.type === 'validation';
}

export function isGenericMetadata(meta: EntityMetadata): meta is GenericMetadata {
  return meta.type === 'generic';
}

// Factory functions for creating metadata with proper typing
export function createProductMetadata(data: Omit<ProductMetadata, 'type'>): ProductMetadata {
  return { type: 'product', ...data };
}

export function createOrderMetadata(data: Omit<OrderMetadata, 'type'>): OrderMetadata {
  return { type: 'order', ...data };
}

export function createSearchMetadata(data: Omit<SearchMetadata, 'type'>): SearchMetadata {
  return { type: 'search', ...data };
}

export function createUserMetadata(data: Omit<UserMetadata, 'type'>): UserMetadata {
  return { type: 'user', ...data };
}

export function createSyncMetadata(data: Omit<SyncMetadata, 'type'>): SyncMetadata {
  return { type: 'sync', ...data };
}

export function createPageMetadata(data: Omit<PageMetadata, 'type'>): PageMetadata {
  return { type: 'page', ...data };
}

export function createAnalyticsMetadata(data: Omit<AnalyticsMetadata, 'type'>): AnalyticsMetadata {
  return { type: 'analytics', ...data };
}

export function createValidationMetadata(data: Omit<ValidationMetadata, 'type'>): ValidationMetadata {
  return { type: 'validation', ...data };
}

export function createGenericMetadata(data: Omit<GenericMetadata, 'type'>): GenericMetadata {
  return { type: 'generic', ...data };
}

// Utility to migrate from old EntityMetadata to new structure
import type { EntityMetadata as OldEntityMetadata } from './common';

export function migrateFromLegacyMetadata(old: OldEntityMetadata): EntityMetadata {
  // Analyze the old metadata to determine the appropriate type

  // Check for product metadata
  if ('productId' in old && old.productId !== undefined) {
    return createProductMetadata({
      productId: old.productId,
      timestamp: old.timestamp,
      correlationId: old.correlationId,
      requestId: old.requestId,
      environment: old.environment,
      region: old.region,
      tenant: old.tenant,
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
      createdBy: old.createdBy,
      updatedBy: old.updatedBy,
      version: old.version,
      tags: old.tags,
      source: old.source,
    });
  }

  // Check for order metadata
  if ('orderId' in old && old.orderId !== undefined) {
    return createOrderMetadata({
      orderId: old.orderId,
      orderTotal: old.orderTotal || 0,
      itemCount: old.itemCount || 0,
      paymentMethod: old.paymentMethod,
      shippingMethod: old.shippingMethod,
      timestamp: old.timestamp,
      correlationId: old.correlationId,
      requestId: old.requestId,
      environment: old.environment,
      region: old.region,
      tenant: old.tenant,
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
      createdBy: old.createdBy,
      updatedBy: old.updatedBy,
      version: old.version,
      tags: old.tags,
      source: old.source,
    });
  }

  // Check for search metadata
  if ('searchQuery' in old && old.searchQuery !== undefined) {
    return createSearchMetadata({
      searchQuery: old.searchQuery,
      queryLength: old.queryLength || old.searchQuery.length,
      hasFilters: old.hasFilters || false,
      clickedResults: old.clickedResults,
      timestamp: old.timestamp,
      correlationId: old.correlationId,
      requestId: old.requestId,
      environment: old.environment,
      region: old.region,
      tenant: old.tenant,
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
      createdBy: old.createdBy,
      updatedBy: old.updatedBy,
      version: old.version,
      tags: old.tags,
      source: old.source,
    });
  }

  // Check for sync metadata
  if ('syncSource' in old && old.syncSource !== undefined) {
    return createSyncMetadata({
      syncSource: old.syncSource,
      autoSync: old.autoSync,
      realTimeSync: old.realTimeSync,
      priority: old.priority,
      timestamp: old.timestamp,
      correlationId: old.correlationId,
      requestId: old.requestId,
      environment: old.environment,
      region: old.region,
      tenant: old.tenant,
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
      createdBy: old.createdBy,
      updatedBy: old.updatedBy,
      version: old.version,
      tags: old.tags,
      source: old.source,
    });
  }

  // Check for page metadata
  if ('pageUrl' in old && old.pageUrl !== undefined) {
    return createPageMetadata({
      pageUrl: old.pageUrl,
      entryType: old.entryType,
      startTime: old.startTime,
      timestamp: old.timestamp,
      correlationId: old.correlationId,
      requestId: old.requestId,
      environment: old.environment,
      region: old.region,
      tenant: old.tenant,
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
      createdBy: old.createdBy,
      updatedBy: old.updatedBy,
      version: old.version,
      tags: old.tags,
      source: old.source,
    });
  }

  // Check for user metadata
  if (('userId' in old && old.userId !== undefined) ||
      ('sessionId' in old && old.sessionId !== undefined)) {
    return createUserMetadata({
      userId: ('userId' in old ? old.userId : undefined) as string | undefined,
      sessionId: ('sessionId' in old ? old.sessionId : undefined) as string | undefined,
      userAgent: old.userAgent,
      ipAddress: old.ipAddress,
      timestamp: old.timestamp,
      correlationId: old.correlationId,
      requestId: old.requestId,
      environment: old.environment,
      region: old.region,
      tenant: old.tenant,
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
      createdBy: old.createdBy,
      updatedBy: old.updatedBy,
      version: old.version,
      tags: old.tags,
      source: old.source,
    });
  }

  // Check for validation metadata
  if ('validatedAt' in old && old.validatedAt !== undefined) {
    return createValidationMetadata({
      validatedAt: old.validatedAt,
      timestamp: old.timestamp,
      correlationId: old.correlationId,
      requestId: old.requestId,
      environment: old.environment,
      region: old.region,
      tenant: old.tenant,
      createdAt: old.createdAt,
      updatedAt: old.updatedAt,
      createdBy: old.createdBy,
      updatedBy: old.updatedBy,
      version: old.version,
      tags: old.tags,
      source: old.source,
    });
  }

  // Default to generic metadata
  return createGenericMetadata({
    name: old.name,
    value: old.value,
    timestamp: old.timestamp,
    correlationId: old.correlationId,
    requestId: old.requestId,
    environment: old.environment,
    region: old.region,
    tenant: old.tenant,
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
    createdBy: old.createdBy,
    updatedBy: old.updatedBy,
    version: old.version,
    tags: old.tags,
    source: old.source,
  });
}