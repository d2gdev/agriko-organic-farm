// Analytics and tracking type definitions

export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  sessionId: string;
  timestamp: number;
  data: Record<string, unknown>;
  metadata?: AnalyticsMetadata;
}

export interface AnalyticsMetadata {
  userAgent?: string;
  screen?: {
    width: number;
    height: number;
  };
  viewport?: {
    width: number;
    height: number;
  };
  device?: 'mobile' | 'tablet' | 'desktop';
  referrer?: string;
  language?: string;
  timezone?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

export interface PageAnalyticsData {
  pageUrl: string;
  pageTitle: string;
  timeOnPage: number;
  scrollDepth: number;
  clickEvents: ClickEvent[];
  exitIntent?: boolean;
  bounceRate?: number;
}

export interface ClickEvent {
  element: string;
  timestamp: number;
  coordinates: {
    x: number;
    y: number;
  };
  elementText?: string;
  elementId?: string;
  elementClass?: string;
}

export interface ConversionEvent {
  type: 'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase';
  productId?: number;
  value?: number;
  currency?: string;
  quantity?: number;
  step?: number;
}

export interface SearchAnalyticsData {
  query: string;
  resultsCount: number;
  clickedResults: number[];
  searchType: 'keyword' | 'semantic' | 'hybrid';
  filters?: Record<string, unknown>;
  timestamp: number;
}

export interface UserBehaviorData {
  sessionDuration: number;
  pageViews: number;
  interactions: number;
  lastActivity: number;
  isReturning: boolean;
  previousSessions?: number;
}