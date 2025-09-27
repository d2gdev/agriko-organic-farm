// Proper event architecture with discriminated unions

export enum EventType {
  // Product events
  PRODUCT_VIEWED = 'product.viewed',
  PRODUCT_ADDED_TO_CART = 'product.added_to_cart',
  PRODUCT_REMOVED_FROM_CART = 'product.removed_from_cart',

  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',

  // Search events
  SEARCH_PERFORMED = 'search.performed',
  SEARCH_RESULT_CLICKED = 'search.result_clicked',

  // Page events
  PAGE_VIEWED = 'page.viewed',
  PAGE_EXITED = 'page.exited',
}

// Base event properties
interface BaseEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

// Product event with proper fields
export interface ProductViewedEvent extends BaseEvent {
  type: EventType.PRODUCT_VIEWED;
  productId: number;
  productName: string;
  category: string;
  price: number;
}

export interface ProductAddedToCartEvent extends BaseEvent {
  type: EventType.PRODUCT_ADDED_TO_CART;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  variantId?: number;
}

// Order event with consistent naming
export interface OrderCreatedEvent extends BaseEvent {
  type: EventType.ORDER_CREATED;
  orderId: string;
  orderTotal: number;  // Single source of truth for order value
  currency: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  customer: {
    email: string;
    customerId?: number;
  };
  payment: {
    method: string;
    transactionId?: string;
  };
  shipping?: {
    method: string;
    cost: number;
    address: {
      city: string;
      state: string;
      country: string;
      postcode: string;
    };
  };
}

// Search events
export interface SearchPerformedEvent extends BaseEvent {
  type: EventType.SEARCH_PERFORMED;
  query: string;
  resultsCount: number;
  filters?: {
    categories?: string[];
    priceRange?: { min: number; max: number };
    attributes?: Record<string, string[]>;
  };
}

export interface SearchResultClickedEvent extends BaseEvent {
  type: EventType.SEARCH_RESULT_CLICKED;
  query: string;
  resultId: number;
  resultPosition: number;
}

// Page events
export interface PageViewedEvent extends BaseEvent {
  type: EventType.PAGE_VIEWED;
  pageUrl: string;
  pageTitle: string;
  referrer?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

// Discriminated union of all events
export type DomainEvent =
  | ProductViewedEvent
  | ProductAddedToCartEvent
  | OrderCreatedEvent
  | SearchPerformedEvent
  | SearchResultClickedEvent
  | PageViewedEvent;

// Type guards
export function isProductEvent(event: DomainEvent): event is ProductViewedEvent | ProductAddedToCartEvent {
  return event.type === EventType.PRODUCT_VIEWED ||
         event.type === EventType.PRODUCT_ADDED_TO_CART;
}

export function isOrderEvent(event: DomainEvent): event is OrderCreatedEvent {
  return event.type === EventType.ORDER_CREATED;
}

export function isSearchEvent(event: DomainEvent): event is SearchPerformedEvent | SearchResultClickedEvent {
  return event.type === EventType.SEARCH_PERFORMED ||
         event.type === EventType.SEARCH_RESULT_CLICKED;
}

// Event factory with proper typing
export function createEvent<T extends EventType>(
  type: T,
  data: Omit<Extract<DomainEvent, { type: T }>, 'id' | 'timestamp' | 'type'>
): Extract<DomainEvent, { type: T }> {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    ...data
  } as Extract<DomainEvent, { type: T }>;
}