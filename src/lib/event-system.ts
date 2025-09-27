// Comprehensive Event System for Automatic Data Persistence
import { logger } from '@/lib/logger';
import { Redis } from 'ioredis';
import {
  EventType,
  BaseEvent,
  ProductEvent,
  UserEvent,
  SearchEvent,
  NavigationEvent,
  OrderEvent,
  PageEvent
} from '@/types/events';

// Re-export for backward compatibility
export { EventType };
export type {
  BaseEvent,
  ProductEvent,
  UserEvent,
  SearchEvent,
  NavigationEvent,
  OrderEvent,
  PageEvent
};

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
    orderTotal: data.orderValue,
    items: data.items,
    metadata: {
      ...(data.metadata || {}),
      itemCount: data.itemCount,
      paymentMethod: data.paymentMethod,
      shippingMethod: data.shippingMethod
    },
  } as OrderEvent);
};