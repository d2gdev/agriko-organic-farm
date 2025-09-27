// Shared Event Types for the Application

import { EntityMetadata, SearchFilterValues } from './common';

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
  metadata?: EntityMetadata;
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
  filters?: SearchFilterValues;
  clickedResultId?: number;
  clickedPosition?: number;
}

export interface UserEvent extends BaseEvent {
  userId: string;
  userEmail?: string;
  userSegment?: string;
}

export interface NavigationEvent extends BaseEvent {
  pageUrl: string;
  pageTitle?: string;
  referrer?: string;
  duration?: number;
}

export interface OrderEvent extends BaseEvent {
  orderId: string;
  orderTotal: number;
  orderStatus?: string;
  items?: Array<{
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