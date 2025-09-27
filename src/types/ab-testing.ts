// A/B Testing type definitions

import type { WCProduct } from './woocommerce';

// ============================================
// Variant Configuration Types
// ============================================

export interface ButtonVariantConfig {
  type: 'button';
  color: string;
  size: 'small' | 'medium' | 'large';
  text: string;
  icon?: string;
}

export interface LayoutVariantConfig {
  type: 'layout';
  template: string;
  columns: number;
  spacing: number;
  showSidebar: boolean;
}

export interface PricingVariantConfig {
  type: 'pricing';
  displayFormat: 'simple' | 'detailed' | 'comparison';
  showDiscount: boolean;
  showSavings: boolean;
}

export interface ContentVariantConfig {
  type: 'content';
  headline: string;
  description: string;
  ctaText: string;
}

export type VariantConfiguration =
  | ButtonVariantConfig
  | LayoutVariantConfig
  | PricingVariantConfig
  | ContentVariantConfig;

export interface ABTestVariant {
  id: string;
  name: string;
  traffic: number; // Percentage 0-100
  config: VariantConfiguration;
}

export interface ABTestConfiguration {
  id: string;
  name: string;
  variants: ABTestVariant[];
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
}

// ============================================
// Event Data Types
// ============================================

export interface ABTestEventData {
  elementId?: string;
  elementType?: string;
  value?: number;
  timestamp: number;
  metadata?: {
    source?: string;
    category?: string;
    label?: string;
  };
}

export interface ABTestResult {
  variant: string;
  isInTest: boolean;
  trackConversion: (eventType: string, data?: ABTestEventData) => void;
  trackEvent: (eventType: string, data?: ABTestEventData) => void;
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
  data: ABTestEventData;
  timestamp: number;
}