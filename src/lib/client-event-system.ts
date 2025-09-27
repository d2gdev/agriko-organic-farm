// Client-Safe Event System for Automatic Data Persistence
'use client';

import {
  EventType,
  BaseEvent,
  ProductEvent,
  SearchEvent,
  UserEvent,
  NavigationEvent,
  OrderEvent,
  PageEvent
} from '@/types/events';

// Re-export for backward compatibility
export { EventType };
export type {
  BaseEvent,
  ProductEvent,
  SearchEvent,
  UserEvent,
  NavigationEvent,
  OrderEvent,
  PageEvent
};

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