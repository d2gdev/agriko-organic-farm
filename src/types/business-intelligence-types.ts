/**
 * Comprehensive type definitions for Business Intelligence system
 * These replace all the lazy 'as any' casts with proper types
 */

// ============= Dashboard Types =============
export interface DashboardProduct {
  id: number;
  name: string;
  price: number;
  sales?: number;
  revenue?: number;
  category?: string;
  stock?: number;
  image?: string;
}

// ============= Competitor Types =============
export interface CompetitorBase {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
}

export interface CompetitorWithStatus extends CompetitorBase {
  is_active: boolean;
  domain?: string;
  industry?: string;
}

export interface CompetitorConfig extends CompetitorBase {
  baseUrl: string;
  selectors?: Record<string, string>;
  headers?: Record<string, string>;
}

// ============= Chart Types =============
export interface ChartDataPoint {
  date: string;
  sales: number;
  orders: number;
  revenue?: number;
  [key: string]: string | number | undefined;
}

// ============= Memgraph Enums =============
export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise'
}

export enum CompetitorCategory {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
  POTENTIAL = 'potential',
  GENERAL = 'general'
}

export enum MonitoringScope {
  BASIC = 'basic',
  STANDARD = 'standard',
  ADVANCED = 'advanced',
  COMPREHENSIVE = 'comprehensive'
}

export enum MonitoringFrequency {
  REALTIME = 'realtime',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum CompetitorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
  SUBSCRIPTION = 'subscription'
}

export enum CampaignType {
  MARKETING = 'marketing',
  SALES = 'sales',
  AWARENESS = 'awareness',
  RETENTION = 'retention'
}

// ============= Change Detection Types =============
export type ChangeEntityType = 'competitor' | 'product' | 'channel' | 'campaign';

export interface ChangeEvent {
  id: string;
  type: string;
  entityId: string;
  entityType: ChangeEntityType;
  changeType: string;
  timestamp: Date;
  newValue?: Record<string, unknown>;
  confidence: number;
  significance: string;
  description: string;
  source: string;
  metadata: Record<string, unknown>;
}

// ============= Sync Data Types =============
export interface ProductSyncData {
  eventType: string;
  productId: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface SearchSyncData {
  query: string;
  resultsCount: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  clickedResultId?: number;
}

export interface UserBehaviorSyncData {
  userId: string;
  sessionId: string;
  pageUrl: string;
  timestamp: number;
  eventType: string;
  metadata: Record<string, unknown>;
}

export interface QdrantProductData {
  productId: number;
  eventType: string;
  metadata?: Record<string, unknown>;
}

export interface QdrantSearchData {
  query: string;
  userId?: string;
  sessionId: string;
  resultsCount: number;
  clickedResults?: number[];
  timestamp: number;
}

export interface QdrantBehaviorData {
  userId: string;
  sessionId: string;
  interactions: Array<{
    productId: number;
    type: string;
    timestamp: number;
    duration?: number;
  }>;
}

// ============= Cache Types =============
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

// ============= User Behavior Types =============
export interface UserBehaviorData {
  totalSessions: number;
  averageSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  deviceTypes: Array<{ type: string; count: number }>;
}

// ============= Helper Types =============
export interface IndexableObject {
  [key: string]: unknown;
}

export type SyncEventType =
  | 'product.view'
  | 'product.add'
  | 'product.remove'
  | 'search.perform'
  | 'search.click'
  | 'user.login'
  | 'user.logout'
  | 'page.view';

// ============= WooCommerce Extended Types =============
export interface ShippingAddressWithEmail {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
}

export interface WooCommerceOrderData {
  id: number;
  status: string;
  total: string;
  currency: string;
  date_created: string;
  line_items: Array<{
    id: number;
    product_id: number;
    quantity: number;
    total: string;
  }>;
}

export type WooCommerceEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.completed'
  | 'product.created'
  | 'product.updated'
  | 'customer.created'
  | 'customer.updated';

// ============= Redis Client Types =============
export interface RedisClientWithCommands {
  ping: () => Promise<string>;
  quit: () => Promise<void>;
  connect: () => Promise<void>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { EX?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
  keys: (pattern: string) => Promise<string[]>;
  on: (event: string, callback: Function) => void;
}

// ============= Scraper Types =============
export interface ScraperSelectors {
  title?: string;
  price?: string;
  description?: string;
  image?: string;
  availability?: string;
  [key: string]: string | undefined;
}

export interface ScraperHeaders {
  'User-Agent'?: string;
  'Accept'?: string;
  'Accept-Language'?: string;
  [key: string]: string | undefined;
}

export interface ScraperCookieJar {
  setCookie: (cookie: string, url: string) => Promise<void>;
  getCookies: (url: string) => Promise<string[]>;
}

// ============= Webhook Types =============
export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  headers?: Record<string, string>;
}

// ============= Type Guards =============
export function isCompanySize(value: unknown): value is CompanySize {
  return Object.values(CompanySize).includes(value as CompanySize);
}

export function isCompetitorCategory(value: unknown): value is CompetitorCategory {
  return Object.values(CompetitorCategory).includes(value as CompetitorCategory);
}

export function isMonitoringScope(value: unknown): value is MonitoringScope {
  return Object.values(MonitoringScope).includes(value as MonitoringScope);
}

export function isMonitoringFrequency(value: unknown): value is MonitoringFrequency {
  return Object.values(MonitoringFrequency).includes(value as MonitoringFrequency);
}

export function isCompetitorStatus(value: unknown): value is CompetitorStatus {
  return Object.values(CompetitorStatus).includes(value as CompetitorStatus);
}

export function isCampaignStatus(value: unknown): value is CampaignStatus {
  return Object.values(CampaignStatus).includes(value as CampaignStatus);
}

export function isProductType(value: unknown): value is ProductType {
  return Object.values(ProductType).includes(value as ProductType);
}

export function isCampaignType(value: unknown): value is CampaignType {
  return Object.values(CampaignType).includes(value as CampaignType);
}

export function isChangeEntityType(value: unknown): value is ChangeEntityType {
  return ['competitor', 'product', 'channel', 'campaign'].includes(value as string);
}

// ============= Conversion Helpers =============
export function toCompanySize(value: unknown): CompanySize {
  if (isCompanySize(value)) return value;
  return CompanySize.MEDIUM; // default
}

export function toCompetitorCategory(value: unknown): CompetitorCategory {
  if (isCompetitorCategory(value)) return value;
  return CompetitorCategory.GENERAL; // default
}

export function toMonitoringScope(value: unknown): MonitoringScope {
  if (isMonitoringScope(value)) return value;
  return MonitoringScope.BASIC; // default
}

export function toMonitoringFrequency(value: unknown): MonitoringFrequency {
  if (isMonitoringFrequency(value)) return value;
  return MonitoringFrequency.DAILY; // default
}

export function toCompetitorStatus(value: unknown): CompetitorStatus {
  if (isCompetitorStatus(value)) return value;
  return CompetitorStatus.ACTIVE; // default
}

export function toCampaignStatus(value: unknown): CampaignStatus {
  if (isCampaignStatus(value)) return value;
  return CampaignStatus.DRAFT; // default
}

export function toProductType(value: unknown): ProductType {
  if (isProductType(value)) return value;
  return ProductType.PHYSICAL; // default
}

export function toCampaignType(value: unknown): CampaignType {
  if (isCampaignType(value)) return value;
  return CampaignType.MARKETING; // default
}