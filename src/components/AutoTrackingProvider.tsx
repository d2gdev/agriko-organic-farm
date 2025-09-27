'use client';

// Provider component for automatic tracking across the entire application
import React, { createContext, useContext, ReactNode } from 'react';
import { useAutoTracking } from '@/hooks/useAutoTracking';
import { EventType } from '@/lib/client-event-system';

interface AutoTrackingContextType {
  trackProduct: (action: 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase', productData: {
    id: number;
    name: string;
    price: number;
    category: string;
    quantity?: number;
    variantId?: number;
  }) => Promise<void>;
  trackSearchQuery: (query: string, resultsCount: number, filters?: Record<string, unknown>) => Promise<void>;
  trackSearchClick: (query: string, resultId: number, position: number) => Promise<void>;
  trackOrderCreated: (orderData: {
    orderId: string;
    orderTotal: number;
    itemCount: number;
    paymentMethod?: string;
    shippingMethod?: string;
    items: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
  }) => Promise<void>;
  trackCustomEvent: (eventType: EventType, data: Record<string, unknown>) => Promise<void>;
}

const AutoTrackingContext = createContext<AutoTrackingContextType | null>(null);

export const useTracking = () => {
  const context = useContext(AutoTrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within AutoTrackingProvider');
  }
  return context;
};

interface AutoTrackingProviderProps {
  children: ReactNode;
}

export const AutoTrackingProvider: React.FC<AutoTrackingProviderProps> = ({ children }) => {
  const trackingMethods = useAutoTracking();

  return (
    <AutoTrackingContext.Provider value={trackingMethods}>
      {children}
    </AutoTrackingContext.Provider>
  );
};