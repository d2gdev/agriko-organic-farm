/**
 * Runtime Type Validators and Type Predicates
 * Uses Zod for runtime validation and provides type guards
 */

import { z } from 'zod';
import {
  CompanySize,
  CompetitorCategory,
  MonitoringScope,
  MonitoringFrequency,
  CompetitorStatus,
  ChannelType,
  CampaignType,
  CampaignStatus
} from '@/lib/business-intelligence/types/competitor';
import { EventType } from '@/types/events';

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

// Competitor Enums as Zod schemas
export const CompanySizeSchema = z.nativeEnum(CompanySize);
export const CompetitorCategorySchema = z.nativeEnum(CompetitorCategory);
export const MonitoringScopeSchema = z.nativeEnum(MonitoringScope);
export const MonitoringFrequencySchema = z.nativeEnum(MonitoringFrequency);
export const CompetitorStatusSchema = z.nativeEnum(CompetitorStatus);
export const ChannelTypeSchema = z.nativeEnum(ChannelType);
export const CampaignTypeSchema = z.nativeEnum(CampaignType);
export const CampaignStatusSchema = z.nativeEnum(CampaignStatus);
export const EventTypeSchema = z.nativeEnum(EventType);

// Product Sync Data Schema
export const ProductSyncDataSchema = z.object({
  eventType: z.string(),
  productId: z.number(),
  userId: z.string().optional(),
  sessionId: z.string(),
  timestamp: z.number(),
  metadata: z.record(z.unknown())
});

// WooCommerce Order Data Schema
export const WooCommerceOrderDataSchema = z.object({
  id: z.number(),
  status: z.string(),
  total: z.string(),
  currency: z.string(),
  date_created: z.string(),
  date_modified: z.string(),
  customer_id: z.number(),
  billing: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone: z.string().optional()
  }).passthrough(),
  line_items: z.array(z.object({
    id: z.number(),
    product_id: z.number(),
    name: z.string(),
    quantity: z.number(),
    total: z.string(),
    price: z.number().optional()
  }).passthrough())
}).passthrough();

// Dashboard Product Schema
export const DashboardProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  sales: z.number().optional(),
  revenue: z.number().optional()
});

// Analytics Event Schema
export const AnalyticsEventSchema = z.object({
  id: z.string(),
  type: EventTypeSchema,
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  metadata: z.record(z.unknown())
});

// Memgraph Node Properties Schema
export const MemgraphNodePropsSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  founded: z.number().optional(),
  category: z.string().optional(),
  monitoringScope: z.string().optional(),
  monitoringFrequency: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).passthrough();

// ============================================================================
// Type Guards / Type Predicates
// ============================================================================

/**
 * Type guard for CompanySize
 */
export function isCompanySize(value: unknown): value is CompanySize {
  return CompanySizeSchema.safeParse(value).success;
}

/**
 * Type guard for CompetitorCategory
 */
export function isCompetitorCategory(value: unknown): value is CompetitorCategory {
  return CompetitorCategorySchema.safeParse(value).success;
}

/**
 * Type guard for MonitoringScope
 */
export function isMonitoringScope(value: unknown): value is MonitoringScope {
  return MonitoringScopeSchema.safeParse(value).success;
}

/**
 * Type guard for MonitoringFrequency
 */
export function isMonitoringFrequency(value: unknown): value is MonitoringFrequency {
  return MonitoringFrequencySchema.safeParse(value).success;
}

/**
 * Type guard for CompetitorStatus
 */
export function isCompetitorStatus(value: unknown): value is CompetitorStatus {
  return CompetitorStatusSchema.safeParse(value).success;
}

/**
 * Type guard for CampaignType
 */
export function isCampaignType(value: unknown): value is CampaignType {
  return CampaignTypeSchema.safeParse(value).success;
}

/**
 * Type guard for CampaignStatus
 */
export function isCampaignStatus(value: unknown): value is CampaignStatus {
  return CampaignStatusSchema.safeParse(value).success;
}

/**
 * Type guard for ChannelType
 */
export function isChannelType(value: unknown): value is ChannelType {
  return ChannelTypeSchema.safeParse(value).success;
}

/**
 * Type guard for EventType
 */
export function isEventType(value: unknown): value is EventType {
  return EventTypeSchema.safeParse(value).success;
}

// ============================================================================
// Safe Parsing Functions
// ============================================================================

/**
 * Safely parse and validate CompanySize
 */
export function parseCompanySize(value: unknown): CompanySize {
  const result = CompanySizeSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return CompanySize.MEDIUM; // Default fallback
}

/**
 * Safely parse and validate CompetitorCategory
 */
export function parseCompetitorCategory(value: unknown): CompetitorCategory {
  const result = CompetitorCategorySchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return CompetitorCategory.DIRECT; // Default fallback
}

/**
 * Safely parse and validate MonitoringScope
 */
export function parseMonitoringScope(value: unknown): MonitoringScope {
  const result = MonitoringScopeSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return MonitoringScope.FULL_MONITORING; // Default fallback
}

/**
 * Safely parse and validate MonitoringFrequency
 */
export function parseMonitoringFrequency(value: unknown): MonitoringFrequency {
  const result = MonitoringFrequencySchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return MonitoringFrequency.DAILY; // Default fallback
}

/**
 * Safely parse and validate CompetitorStatus
 */
export function parseCompetitorStatus(value: unknown): CompetitorStatus {
  const result = CompetitorStatusSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return CompetitorStatus.ACTIVE; // Default fallback
}

/**
 * Safely parse and validate CampaignType
 */
export function parseCampaignType(value: unknown): CampaignType {
  const result = CampaignTypeSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return CampaignType.ADVERTISING; // Default fallback
}

/**
 * Safely parse and validate CampaignStatus
 */
export function parseCampaignStatus(value: unknown): CampaignStatus {
  const result = CampaignStatusSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return CampaignStatus.ACTIVE; // Default fallback
}

/**
 * Safely parse and validate ChannelType
 */
export function parseChannelType(value: unknown): ChannelType {
  const result = ChannelTypeSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return ChannelType.WEBSITE; // Default fallback
}

/**
 * Safely parse and validate EventType
 */
export function parseEventType(value: unknown): EventType {
  const result = EventTypeSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return EventType.PAGE_VIEWED; // Default fallback
}

/**
 * Validate and parse ProductSyncData
 */
export function validateProductSyncData(data: unknown): z.infer<typeof ProductSyncDataSchema> {
  return ProductSyncDataSchema.parse(data);
}

/**
 * Validate and parse WooCommerce Order Data
 */
export function validateWooCommerceOrderData(data: unknown): z.infer<typeof WooCommerceOrderDataSchema> {
  return WooCommerceOrderDataSchema.parse(data);
}

/**
 * Validate and parse Dashboard Product
 */
export function validateDashboardProduct(data: unknown): z.infer<typeof DashboardProductSchema> {
  return DashboardProductSchema.parse(data);
}

/**
 * Validate and parse Analytics Event
 */
export function validateAnalyticsEvent(data: unknown): z.infer<typeof AnalyticsEventSchema> {
  return AnalyticsEventSchema.parse(data);
}

// ============================================================================
// Type Exports
// ============================================================================

export type ProductSyncData = z.infer<typeof ProductSyncDataSchema>;
export type WooCommerceOrderData = z.infer<typeof WooCommerceOrderDataSchema>;
export type DashboardProduct = z.infer<typeof DashboardProductSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type MemgraphNodeProps = z.infer<typeof MemgraphNodePropsSchema>;