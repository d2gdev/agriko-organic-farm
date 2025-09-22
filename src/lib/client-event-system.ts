// Client-Safe Event System for Automatic Data Persistence
'use client';

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
  sessionId?: string;
  userId?: string;
  anonymousId?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductEvent extends BaseEvent {
  productId: number;
  productName: string;
  productPrice: number;
  productCategory: string;
  variantId?: number;
}

export interface SearchEvent extends BaseEvent {
  query: string;
  resultsCount: number;
  filters?: Record<string, unknown>;
  clickedResultId?: number;
  clickedPosition?: number;
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

export interface PageEvent extends BaseEvent {
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
  timeSpent?: number;
  deviceType?: string;
  browserType?: string;
}

export interface UserEvent extends BaseEvent {
  userEmail?: string;
  userSegment?: string;
}

// Client-side event queue for collecting events
class ClientEventBus {
  private events: BaseEvent[] = [];
  private maxQueueSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize events array regardless of environment
    this.events = [];

    if (typeof window !== 'undefined') {
      this.startAutoFlush();

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  async emit(event: BaseEvent): Promise<void> {
    // Ensure events array is initialized
    if (!this.events) {
      this.events = [];
    }

    // Add to queue
    this.events.push(event);

    // Prevent memory issues
    if (this.events.length > this.maxQueueSize) {
      this.events = this.events.slice(-this.maxQueueSize);
    }

    // Immediate flush for critical events
    if (this.isCriticalEvent(event.type)) {
      await this.flush();
    }
  }

  private isCriticalEvent(eventType: EventType): boolean {
    return [
      EventType.ORDER_CREATED,
      EventType.PAYMENT_COMPLETED,
      EventType.PRODUCT_PURCHASED,
      EventType.USER_REGISTERED
    ].includes(eventType);
  }

  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    // Ensure events array is initialized
    if (!this.events) {
      this.events = [];
    }

    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Send events to API endpoint
      await fetch('/api/events/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch {
      // Re-queue events on failure (but prevent infinite growth)
      if (this.events.length < this.maxQueueSize / 2) {
        this.events.unshift(...eventsToSend.slice(0, this.maxQueueSize / 2));
      }
    }
  }

  getQueueSize(): number {
    // Ensure events array is initialized
    if (!this.events) {
      this.events = [];
    }
    return this.events.length;
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// Lazy initialization of global event bus instance
let _eventBus: ClientEventBus | null = null;

export const getEventBus = (): ClientEventBus => {
  if (!_eventBus) {
    _eventBus = new ClientEventBus();
  }
  return _eventBus;
};

// Export for backward compatibility - use getter to avoid SSR issues
export const eventBus = {
  get emit() { return getEventBus().emit.bind(getEventBus()); },
  get getQueueSize() { return getEventBus().getQueueSize.bind(getEventBus()); },
  get destroy() { return getEventBus().destroy.bind(getEventBus()); }
};

// Helper functions for tracking common events
export const trackProductView = async (data: Omit<ProductEvent, 'id' | 'type' | 'timestamp'>) => {
  await getEventBus().emit({
    id: `product_view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.PRODUCT_VIEWED,
    timestamp: Date.now(),
    ...data
  });
};

export const trackSearch = async (data: Omit<SearchEvent, 'id' | 'type' | 'timestamp'>) => {
  await getEventBus().emit({
    id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.SEARCH_PERFORMED,
    timestamp: Date.now(),
    ...data
  });
};

export const trackPageView = async (data: Omit<PageEvent, 'id' | 'type' | 'timestamp'>) => {
  await getEventBus().emit({
    id: `page_view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.PAGE_VIEWED,
    timestamp: Date.now(),
    ...data
  });
};

export const trackOrder = async (data: Omit<OrderEvent, 'id' | 'type' | 'timestamp'>) => {
  await getEventBus().emit({
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: EventType.ORDER_CREATED,
    timestamp: Date.now(),
    ...data
  });
};