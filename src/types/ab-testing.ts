// A/B Testing type definitions

import type { WCProduct } from './woocommerce';

export interface ABTestVariant {
  id: string;
  name: string;
  traffic: number; // Percentage 0-100
  config: Record<string, unknown>;
}

export interface ABTestConfiguration {
  id: string;
  name: string;
  variants: ABTestVariant[];
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
}

export interface ABTestResult {
  variant: string;
  isInTest: boolean;
  trackConversion: (eventType: string, data?: Record<string, unknown>) => void;
  trackEvent: (eventType: string, data?: Record<string, unknown>) => void;
}

export interface ProductCardABTestProps {
  product: WCProduct;
  userId?: string;
  sessionId?: string;
}

export interface SearchInterfaceABTestProps {
  onSearch: (query: string) => void;
  userId?: string;
  sessionId?: string;
}

export interface RecommendationABTestProps {
  productId: number;
  userId?: string;
  sessionId?: string;
  limit?: number;
}

export interface ABTestEvent {
  testId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  eventType: string;
  data: Record<string, unknown>;
  timestamp: number;
}