// React Hooks for Automatic Event Tracking
import { useEffect, useRef, useCallback } from 'react';
import {
  trackProductView,
  trackSearch,
  trackOrder,
  eventBus,
  EventType,
  SearchEvent,
  BaseEvent,
  ProductEvent,
  PageEvent
} from '@/lib/client-event-system';

// Session management
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('agriko_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('agriko_session_id', sessionId);
  }
  return sessionId;
};

const getUserId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('agriko_user_id') || undefined;
};

const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { deviceType: 'unknown', browserType: 'unknown' };

  const userAgent = navigator.userAgent;
  const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop';
  const browserType = userAgent.includes('Chrome') ? 'chrome'
    : userAgent.includes('Firefox') ? 'firefox'
    : userAgent.includes('Safari') ? 'safari'
    : userAgent.includes('Edge') ? 'edge'
    : 'other';

  return { deviceType, browserType };
};

// Auto page tracking hook
export const usePageTracking = () => {
  const previousPath = useRef<string>('');

  useEffect(() => {
    const handlePageView = () => {
      const sessionId = getSessionId();
      const userId = getUserId();
      const { deviceType, browserType } = getDeviceInfo();

      const currentPath = window.location.pathname;

      // Avoid duplicate tracking
      if (currentPath === previousPath.current) return;
      previousPath.current = currentPath;

      // Track the page view using the imported function
      eventBus.emit({
        id: `page_view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: EventType.PAGE_VIEWED,
        timestamp: Date.now(),
        sessionId,
        userId,
        pageUrl: currentPath,
        pageTitle: document.title,
        referrer: document.referrer || undefined,
        deviceType,
        browserType,
        metadata: {
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }
      } as PageEvent);
    };

    // Track initial page load
    handlePageView();

    // Track route changes (for SPA navigation)
    const _handleRouteChange = () => {
      setTimeout(handlePageView, 100); // Small delay to ensure title is updated
    };

    // Listen for browser navigation
    window.addEventListener('popstate', handlePageView);

    // For Next.js route changes, we'll track on page focus
    window.addEventListener('focus', handlePageView);

    return () => {
      window.removeEventListener('popstate', handlePageView);
      window.removeEventListener('focus', handlePageView);
    };
  }, []);
};

// Product tracking hook
export const useProductTracking = () => {
  const trackProduct = useCallback(async (action: 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase', productData: {
    id: number;
    name: string;
    price: number;
    category: string;
    quantity?: number;
    variantId?: number;
  }) => {
    const sessionId = getSessionId();
    const userId = getUserId();

    const eventData = {
      productId: productData.id,
      productName: productData.name,
      productPrice: productData.price,
      productCategory: productData.category,
      sessionId,
      userId,
      metadata: {
        quantity: productData.quantity || 1,
        variantId: productData.variantId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }
    };

    switch (action) {
      case 'view':
        await trackProductView(eventData);
        break;
      case 'add_to_cart':
        await eventBus.emit({
          id: `cart_add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: EventType.PRODUCT_ADDED_TO_CART,
          timestamp: Date.now(),
          ...eventData
        } satisfies ProductEvent);
        break;
      case 'remove_from_cart':
        await eventBus.emit({
          id: `cart_remove_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: EventType.PRODUCT_REMOVED_FROM_CART,
          timestamp: Date.now(),
          ...eventData
        } satisfies ProductEvent);
        break;
      case 'purchase':
        await eventBus.emit({
          id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: EventType.PRODUCT_PURCHASED,
          timestamp: Date.now(),
          ...eventData
        } satisfies ProductEvent);
        break;
    }
  }, []);

  return { trackProduct };
};

// Search tracking hook
export const useSearchTracking = () => {
  const trackSearchQuery = useCallback(async (query: string, resultsCount: number, filters?: Record<string, unknown>) => {
    const sessionId = getSessionId();
    const userId = getUserId();

    await trackSearch({
      query,
      resultsCount,
      sessionId,
      userId,
      filters,
      metadata: {
        timestamp: Date.now(),
        queryLength: query.length,
        hasFilters: !!filters && Object.keys(filters).length > 0,
      }
    });
  }, []);

  const trackSearchClick = useCallback(async (query: string, resultId: number, position: number) => {
    const sessionId = getSessionId();
    const userId = getUserId();

    await eventBus.emit({
      id: `search_click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: EventType.SEARCH_RESULT_CLICKED,
      timestamp: Date.now(),
      sessionId,
      userId,
      query,
      resultsCount: 0, // Default value for search clicks
      clickedResultId: resultId,
      clickedPosition: position,
      metadata: {
        timestamp: Date.now(),
      }
    } as SearchEvent);
  }, []);

  return { trackSearchQuery, trackSearchClick };
};

// Order tracking hook
export const useOrderTracking = () => {
  const trackOrderCreated = useCallback(async (orderData: {
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
  }) => {
    const sessionId = getSessionId();
    const userId = getUserId();

    await trackOrder({
      ...orderData,
      sessionId,
      userId,
      metadata: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }
    });
  }, []);

  return { trackOrderCreated };
};

// User engagement tracking hook
export const useEngagementTracking = () => {
  const pageStartTime = useRef<number>(Date.now());
  const lastActiveTime = useRef<number>(Date.now());

  useEffect(() => {
    const updateActiveTime = () => {
      lastActiveTime.current = Date.now();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActiveTime, true);
    });

    // Send engagement data on page unload
    const handleBeforeUnload = () => {
      const timeSpent = lastActiveTime.current - pageStartTime.current;
      const sessionId = getSessionId();
      const userId = getUserId();

      // Send engagement data
      eventBus.emit({
        id: `engagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: EventType.PAGE_EXITED,
        timestamp: Date.now(),
        sessionId,
        userId,
        pageUrl: window.location.pathname,
        timeSpent,
        metadata: {
          totalTimeSpent: timeSpent,
          activeTime: lastActiveTime.current - pageStartTime.current,
        }
      } as PageEvent);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActiveTime, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const trackCustomEvent = useCallback(async (eventType: EventType, data: Record<string, unknown>) => {
    const sessionId = getSessionId();
    const userId = getUserId();

    await eventBus.emit({
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: Date.now(),
      sessionId,
      userId,
      metadata: data
    } satisfies BaseEvent);
  }, []);

  return { trackCustomEvent };
};

// Performance tracking hook
export const usePerformanceTracking = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const trackPerformance = () => {
      const sessionId = getSessionId();
      const userId = getUserId();

      // Track Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          eventBus.emit({
            id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'performance.metric' as EventType,
            timestamp: Date.now(),
            sessionId,
            userId,
            metadata: {
              name: entry.name,
              value: (entry as Record<string, any>).duration || 0,
              entryType: entry.entryType,
              startTime: entry.startTime,
              pageUrl: window.location.pathname,
            }
          } satisfies BaseEvent);
        }
      });

      // Observe different performance metrics
      try {
        observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch {
        // Fallback for browsers that don't support all metrics
        try {
          observer.observe({ entryTypes: ['navigation', 'paint'] });
        } catch {
          // Performance observer not supported - continuing without it
        }
      }

      return () => observer.disconnect();
    };

    const cleanup = trackPerformance();
    return cleanup;
  }, []);
};

// Master tracking hook that combines all tracking
export const useAutoTracking = () => {
  usePageTracking();
  useEngagementTracking();
  usePerformanceTracking();

  const { trackProduct } = useProductTracking();
  const { trackSearchQuery, trackSearchClick } = useSearchTracking();
  const { trackOrderCreated } = useOrderTracking();
  const { trackCustomEvent } = useEngagementTracking();

  return {
    trackProduct,
    trackSearchQuery,
    trackSearchClick,
    trackOrderCreated,
    trackCustomEvent,
  };
};