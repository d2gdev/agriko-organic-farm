/**
 * Comprehensive type safety definitions for the Agriko project
 * This file contains strict type definitions to replace all 'any' types
 */

// ============================================
// Business Intelligence Types
// ============================================

export interface CompetitorData {
  id: string;
  name: string;
  url?: string;
  pricing?: number;
  rating?: number;
  marketShare?: number;
  products?: CompetitorProduct[];
  channels?: ChannelData[];
  lastUpdated: Date;
}

export interface CompetitorProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  features?: string[];
}

export interface ChannelData {
  type: 'online' | 'physical' | 'marketplace' | 'social';
  name: string;
  url?: string;
  performance: {
    traffic?: number;
    conversion?: number;
    revenue?: number;
  };
  trends: TrendData[];
}

export interface TrendData {
  period: string;
  metric: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MarketChannelData {
  segment: string;
  channels: ChannelData[];
  opportunities: MarketOpportunity[];
  recommendations: string[];
}

export interface MarketOpportunity {
  channel: string;
  potential: 'high' | 'medium' | 'low';
  investment: number;
  expectedReturn: number;
  timeframe: string;
  risks: string[];
}

// ============================================
// Analytics Event Types
// ============================================

export interface UserJourneyData {
  userId: string;
  sessionId: string;
  events: JourneyEvent[];
  startTime: Date;
  endTime?: Date;
  completionStatus: 'active' | 'completed' | 'abandoned';
  conversionValue?: number;
}

export interface JourneyEvent {
  timestamp: Date;
  type: 'page_view' | 'interaction' | 'conversion' | 'exit';
  page: string;
  action?: string;
  value?: number;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  [key: string]: string | number | boolean | undefined;
}

// ============================================
// API Response Types
// ============================================

export interface ReviewData {
  id: string;
  productId: number;
  userId?: string;
  rating: number;
  comment: string;
  verified: boolean;
  helpful: number;
  images?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface MetricsData {
  orders: OrderMetric[];
  revenue: RevenueMetric;
  customers: CustomerMetric;
  products: ProductMetric[];
}

export interface OrderMetric {
  id: string;
  total: number;
  status: string;
  date: string;
  items: number;
  customerId?: string;
}

export interface RevenueMetric {
  today: number;
  week: number;
  month: number;
  year: number;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface CustomerMetric {
  total: number;
  active: number;
  new: number;
  returning: number;
  churnRate: number;
}

export interface ProductMetric {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  stock: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================
// Form Validation Types
// ============================================

export interface FormValidationResult<T = unknown> {
  isValid: boolean;
  errors: ValidationError[];
  sanitized?: T;
  warnings?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  severity: 'error' | 'warning';
}

export interface InputValidationRule {
  type: 'required' | 'email' | 'phone' | 'url' | 'number' | 'date' | 'regex' | 'custom';
  message: string;
  value?: number | RegExp;
  validator?: (value: unknown) => boolean;
}

// ============================================
// Runtime Type Guards
// ============================================

export function isCompetitorData(value: unknown): value is CompetitorData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'lastUpdated' in value
  );
}

export function isChannelData(value: unknown): value is ChannelData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'name' in value &&
    'performance' in value
  );
}

export function isUserJourneyData(value: unknown): value is UserJourneyData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'sessionId' in value &&
    'events' in value &&
    Array.isArray((value as Record<string, unknown>).events)
  );
}

export function isReviewData(value: unknown): value is ReviewData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'productId' in value &&
    'rating' in value &&
    typeof (value as Record<string, unknown>).rating === 'number'
  );
}

export function isOrderMetric(value: unknown): value is OrderMetric {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'total' in value &&
    'status' in value &&
    'date' in value
  );
}

// ============================================
// Strict API Request/Response Types
// ============================================

export interface ApiRequest<T = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: T;
  query?: Record<string, number | boolean>;
  params?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  status: number;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  duration: number;
  version?: string;
}

// ============================================
// Database Query Types
// ============================================

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  fields?: FieldInfo[];
  command?: string;
  duration?: number;
}

export interface FieldInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: unknown;
}

// ============================================
// Strict Window Extension Types
// ============================================

export interface AgrikoWindow extends Omit<Window, 'gtag'> {
  agrikoTracking?: {
    isReady: boolean;
    track: (event: string, data: Record<string, unknown>) => void;
    getSessionId: () => string;
    getUserId: () => string | null;
    getStats: () => unknown;
    getHealth: () => unknown;
    forceHealthCheck: () => Promise<unknown>;
    getSlowQueries: () => Promise<unknown>;
  };
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
}

// ============================================
// Search Result Types
// ============================================

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  facets?: SearchFacet[];
  suggestions?: string[];
  executionTime?: number;
}

export interface SearchFacet {
  field: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: number;
  count: number;
  selected?: boolean;
}

// ============================================
// Validation Schemas
// ============================================

export const ValidationSchemas = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w\s.-]*)*\/?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  decimal: /^[0-9]+(\.[0-9]+)?$/,
};

// ============================================
// Type Utilities
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type ExtractArrayType<T> = T extends Array<infer U> ? U : never;
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Type-safe object keys
export type SafeKeys<T> = keyof T extends never ? string : keyof T;

// Type-safe property access
export type SafeGet<T, K extends keyof T> = T[K] extends undefined ? never : T[K];

// Strict discriminated unions
export type StrictUnion<T, K extends keyof T> = T extends unknown
  ? T & { [P in K]: T[K] }
  : never;
