// Comprehensive Event System for Automatic Data Persistence
import { logger } from '@/lib/logger';
import { Redis } from 'ioredis';

// Event types for automatic persistence
export enum EventType {
  // Product Events
  PRODUCT_VIEWED = 'product.viewed',
  PRODUCT_ADDED_TO_CART = 'product.added_to_cart',
  PRODUCT_REMOVED_FROM_CART = 'product.removed_from_cart',
  PRODUCT_PURCHASED = 'product.purchased',
  PRODUCT_REVIEWED = 'product.reviewed',
  PRODUCT_WISHLISTED = 'product.wishlisted',

  // User Journey Events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PROFILE_UPDATED = 'user.profile_updated',

  // Search Events
  SEARCH_PERFORMED = 'search.performed',
  SEARCH_RESULT_CLICKED = 'search.result_clicked',
  SEARCH_NO_RESULTS = 'search.no_results',

  // Navigation Events
  PAGE_VIEWED = 'page.viewed',
  PAGE_EXITED = 'page.exited',
  NAVIGATION_EVENT = 'navigation.event',

  // E-commerce Events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',

  // Engagement Events
  NEWSLETTER_SUBSCRIBED = 'newsletter.subscribed',
  SOCIAL_SHARE = 'social.share',
  REVIEW_HELPFUL_VOTED = 'review.helpful_voted',

  // Admin Events
  PRODUCT_CREATED = 'admin.product.created',
  PRODUCT_UPDATED = 'admin.product.updated',
  PRODUCT_DELETED = 'admin.product.deleted',

  // System Events
  TRACKING_ERROR = 'tracking.error',
  NAVIGATION_CLICK = 'navigation.click',
  SEARCH_OPEN = 'search.open',
  CART_TOGGLE = 'cart.toggle',
  TEST_EVENT = 'test.event',
  NESTED_TEST = 'nested.test',
}

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  anonymousId?: string;
  metadata: Record<string, unknown>;
}

export interface ProductEvent extends BaseEvent {
  productId: number;
  productName: string;
  productPrice: number;
  productCategory: string;
  variantId?: number;
}

export interface UserEvent extends BaseEvent {
  userId: string;
  userEmail?: string;
  userSegment?: string;
}

export interface SearchEvent extends BaseEvent {
  query: string;
  resultsCount: number;
  filters?: Record<string, unknown>;
  clickedResultId?: number;
  clickedPosition?: number;
}

export interface PageEvent extends BaseEvent {
  pageUrl: string;
  pageTitle: string;
  referrer?: string;
  timeSpent?: number;
  deviceType: string;
  browserType: string;
}

export interface OrderEvent extends BaseEvent {
  orderId: string;
  orderValue: number;
  itemCount: number;
  paymentMethod?: string;
  shippingMethod?: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}

// Event Bus for handling automatic persistence
export class EventBus {
  private redis: Redis;
  private listeners: Map<EventType, Function[]> = new Map();

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  // Emit event for automatic processing
  async emit(event: BaseEvent): Promise<void> {
    try {
      // Validate event
      if (!event.id || !event.type || !event.timestamp) {
        throw new Error('Invalid event structure');
      }

      // Add to processing queue
      await this.redis.lpush('events:queue', JSON.stringify(event));

      // Trigger immediate listeners
      const listeners = this.listeners.get(event.type) || [];
      await Promise.all(listeners.map(listener => listener(event)));

      logger.info(`Event emitted: ${event.type}`, { eventId: event.id });
    } catch (error) {
      logger.error('Failed to emit event:', error as Record<string, unknown>);
    }
  }

  // Register event listener
  on(eventType: EventType, listener: Function): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(listener);
  }

  // Remove event listener
  off(eventType: EventType, listener: Function): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Singleton event bus instance
export const eventBus = new EventBus();

// Generic helper function to create events
export const createEvent = (
  type: EventType,
  metadata: Record<string, unknown>,
  userId?: string,
  sessionId?: string
): BaseEvent => {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    sessionId: sessionId || `session_${Date.now()}`,
    userId,
    metadata,
  };
};

// Helper functions for common event emissions
export const trackProductView = async (data: {
  productId: number;
  productName: string;
  productPrice: number;
  productCategory: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) => {
  await eventBus.emit({
    id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.PRODUCT_VIEWED,
    timestamp: Date.now(),
    sessionId: data.sessionId,
    userId: data.userId,
    productId: data.productId,
    productName: data.productName,
    productPrice: data.productPrice,
    productCategory: data.productCategory,
    metadata: data.metadata || {},
  } as ProductEvent);
};

export const trackSearch = async (data: {
  query: string;
  resultsCount: number;
  sessionId: string;
  userId?: string;
  filters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) => {
  await eventBus.emit({
    id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.SEARCH_PERFORMED,
    timestamp: Date.now(),
    sessionId: data.sessionId,
    userId: data.userId,
    query: data.query,
    resultsCount: data.resultsCount,
    filters: data.filters,
    metadata: data.metadata || {},
  } as SearchEvent);
};

export const trackPageView = async (data: {
  pageUrl: string;
  pageTitle: string;
  sessionId: string;
  userId?: string;
  referrer?: string;
  deviceType: string;
  browserType: string;
  metadata?: Record<string, unknown>;
}) => {
  await eventBus.emit({
    id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.PAGE_VIEWED,
    timestamp: Date.now(),
    sessionId: data.sessionId,
    userId: data.userId,
    pageUrl: data.pageUrl,
    pageTitle: data.pageTitle,
    referrer: data.referrer,
    deviceType: data.deviceType,
    browserType: data.browserType,
    metadata: data.metadata || {},
  } as PageEvent);
};

export const trackOrder = async (data: {
  orderId: string;
  orderValue: number;
  itemCount: number;
  sessionId: string;
  userId?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, unknown>;
}) => {
  await eventBus.emit({
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.ORDER_CREATED,
    timestamp: Date.now(),
    sessionId: data.sessionId,
    userId: data.userId,
    orderId: data.orderId,
    orderValue: data.orderValue,
    itemCount: data.itemCount,
    paymentMethod: data.paymentMethod,
    shippingMethod: data.shippingMethod,
    items: data.items,
    metadata: data.metadata || {},
  } as OrderEvent);
};