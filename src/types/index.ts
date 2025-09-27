/**
 * Centralized Type Definitions
 * Single source of truth for all application types
 */

// ============================================================================
// Core Domain Types
// ============================================================================

// Re-export WooCommerce types (excluding conflicts)
export type {
  WCProduct,
  WCCategory,
  WCOrder,
  CheckoutData
} from './woocommerce';

// Re-export Event types
export * from './events';
export { EventType } from './events';

// Re-export Analytics types
export type {
  AnalyticsEvent,
  AnalyticsMetadata,
  PageAnalyticsData,
  SearchAnalyticsData,
  UserBehaviorData
} from './analytics';

// Re-export AB Testing types
export * from './ab-testing';

// Re-export Auth types
export * from './auth';

// Re-export Common types (if they exist)
// export * from './common';
// export * from './domain';

// ============================================================================
// Business Intelligence Types
// ============================================================================

// Re-export from business intelligence types with explicit type exports
export type {
  // Product types
  DashboardProduct,
  ProductSyncData,
  QdrantProductData,

  // Search types
  SearchSyncData,
  QdrantSearchData,

  // User behavior types
  UserBehaviorSyncData,
  QdrantBehaviorData,

  // Order types
  WooCommerceOrderData,
  WooCommerceEventType
} from './business-intelligence-types';

// Re-export competitor types
export * from '@/lib/business-intelligence/types/competitor';

// ============================================================================
// Validators and Runtime Type Guards
// ============================================================================

// Re-export validators excluding AnalyticsEvent conflict
export type {
  ProductSyncData as ValidatedProductSyncData,
  WooCommerceOrderData as ValidatedWooCommerceOrderData,
  DashboardProduct as ValidatedDashboardProduct,
  MemgraphNodeProps
} from './validators';

// Re-export Zod schemas for direct use
export {
  CompanySizeSchema,
  CompetitorCategorySchema,
  MonitoringScopeSchema,
  MonitoringFrequencySchema,
  CompetitorStatusSchema,
  ChannelTypeSchema,
  CampaignTypeSchema,
  CampaignStatusSchema,
  EventTypeSchema,
  ProductSyncDataSchema,
  WooCommerceOrderDataSchema,
  DashboardProductSchema,
  AnalyticsEventSchema,
  MemgraphNodePropsSchema
} from './validators';

// Re-export type guards
export {
  isCompanySize,
  isCompetitorCategory,
  isMonitoringScope,
  isMonitoringFrequency,
  isCompetitorStatus,
  isCampaignType,
  isCampaignStatus,
  isChannelType,
  isEventType
} from './validators';

// Re-export safe parsing functions
export {
  parseCompanySize,
  parseCompetitorCategory,
  parseMonitoringScope,
  parseMonitoringFrequency,
  parseCompetitorStatus,
  parseCampaignType,
  parseCampaignStatus,
  parseChannelType,
  parseEventType,
  validateProductSyncData,
  validateWooCommerceOrderData,
  validateDashboardProduct,
  validateAnalyticsEvent
} from './validators';

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * Make all properties in T required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[]
    ? DeepRequired<U>[]
    : T[P] extends object | undefined
    ? DeepRequired<T[P]>
    : T[P];
};

/**
 * Extract the type of a single element from an array type
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Make specified keys required while keeping others optional
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specified keys optional while keeping others required
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Exclude null and undefined from T
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Type-safe Object.keys
 */
export function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/**
 * Type-safe Object.entries
 */
export function typedEntries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

/**
 * Assert that a value is not null or undefined
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}