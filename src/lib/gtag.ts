import { logger } from '@/lib/logger';
// Google Analytics 4 configuration and event tracking

// Define the EcommerceItem interface
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  category?: string;
  quantity: number;
  price: number;
  [key: string]: string | number | boolean | undefined;
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID ?? process.env.GOOGLE_ANALYTICS_ID ?? '';

// Helper to check if running on localhost
const isLocalhost = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.startsWith('192.168.');
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  // Skip tracking on localhost
  if (isLocalhost()) {
    logger.debug('GA pageview skipped on localhost:', { url });
    return;
  }

  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    logger.debug('GA pageview:', { url, trackingId: GA_TRACKING_ID });
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  } else {
    logger.warn('GA pageview failed:', {
      hasWindow: typeof window !== 'undefined',
      hasGtag: !!(typeof window !== 'undefined' && window.gtag),
      hasTrackingId: !!GA_TRACKING_ID
    });
  }
};

// Define the GtagEventParameters interface
export interface GtagEventParameters {
  [key: string]: string | number | boolean | Array<unknown> | Record<string, unknown> | undefined;
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (action: string, parameters: GtagEventParameters) => {
  // Skip tracking on localhost
  if (isLocalhost()) {
    logger.debug('GA event skipped on localhost:', { action, parameters });
    return;
  }

  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    try {
      logger.debug('GA event:', { action, parameters, trackingId: GA_TRACKING_ID });
      window.gtag('event', action, parameters);
    } catch (error) {
      logger.error('Error sending gtag event:', error as Record<string, unknown>);
    }
  } else {
    logger.warn('GA event failed:', {
      action,
      hasWindow: typeof window !== 'undefined',
      hasGtag: !!(typeof window !== 'undefined' && window.gtag),
      hasTrackingId: !!GA_TRACKING_ID
    });
  }
};

// E-commerce events for GA4
export const ecommerceEvent = {
  // View item event
  viewItem: (productId: string, productName: string, category: string, price: number) => {
    event('view_item', {
      currency: 'USD',
      value: price,
      items: [{
        item_id: productId,
        item_name: productName,
        category: category,
        quantity: 1,
        price: price
      }]
    });
  },

  // Add to cart event
  addToCart: (productId: string, productName: string, category: string, price: number, quantity: number) => {
    event('add_to_cart', {
      currency: 'USD',
      value: price * quantity,
      items: [{
        item_id: productId,
        item_name: productName,
        category: category,
        quantity: quantity,
        price: price
      }]
    });
  },

  // Remove from cart event
  removeFromCart: (productId: string, productName: string, category: string, price: number, quantity: number) => {
    event('remove_from_cart', {
      currency: 'USD',
      value: price * quantity,
      items: [{
        item_id: productId,
        item_name: productName,
        category: category,
        quantity: quantity,
        price: price
      }]
    });
  },

  // Begin checkout event
  beginCheckout: (items: EcommerceItem[], totalValue: number) => {
    event('begin_checkout', {
      currency: 'USD',
      value: totalValue,
      items: items
    });
  },

  // Purchase event
  purchase: (transactionId: string, items: EcommerceItem[], totalValue: number, tax?: number, shipping?: number) => {
    event('purchase', {
      transaction_id: transactionId,
      currency: 'USD',
      value: totalValue,
      tax: tax ?? 0,
      shipping: shipping ?? 0,
      items: items
    });
  },

  // Search event
  search: (searchTerm: string, resultsCount?: number) => {
    event('search', {
      search_term: searchTerm,
      ...(resultsCount !== undefined && { search_results: resultsCount })
    });
  },

  // Custom event for semantic search
  semanticSearch: (searchTerm: string, resultsCount: number, avgRelevance: number) => {
    event('semantic_search', {
      search_term: searchTerm,
      search_results: resultsCount,
      avg_relevance_score: avgRelevance,
      search_type: 'semantic'
    });
  },

  // Custom event for autocomplete selections
  searchAutocomplete: (searchTerm: string, suggestionType: string) => {
    event('search_autocomplete_select', {
      search_term: searchTerm,
      suggestion_type: suggestionType
    });
  }
};

// Enhanced funnel tracking events
export const funnelEvent = {
  // User engagement funnel
  viewHomepage: () => {
    event('funnel_homepage_view', {
      funnel_step: 1,
      funnel_name: 'purchase_journey'
    });
  },

  viewProductCategory: (categoryName: string) => {
    event('funnel_category_view', {
      funnel_step: 2,
      funnel_name: 'purchase_journey',
      category: categoryName
    });
  },

  viewProductDetail: (productId: string, productName: string) => {
    event('funnel_product_view', {
      funnel_step: 3,
      funnel_name: 'purchase_journey',
      product_id: productId,
      product_name: productName
    });
  },

  addToCart: (productId: string, productName: string, value: number) => {
    event('funnel_add_to_cart', {
      funnel_step: 4,
      funnel_name: 'purchase_journey',
      product_id: productId,
      product_name: productName,
      value: value
    });
  },

  viewCart: (itemCount: number, totalValue: number) => {
    event('funnel_view_cart', {
      funnel_step: 5,
      funnel_name: 'purchase_journey',
      items_count: itemCount,
      cart_value: totalValue
    });
  },

  beginCheckout: (totalValue: number, itemCount: number) => {
    event('funnel_begin_checkout', {
      funnel_step: 6,
      funnel_name: 'purchase_journey',
      cart_value: totalValue,
      items_count: itemCount
    });
  },

  completePurchase: (transactionId: string, totalValue: number) => {
    event('funnel_purchase_complete', {
      funnel_step: 7,
      funnel_name: 'purchase_journey',
      transaction_id: transactionId,
      purchase_value: totalValue
    });
  }
};

// User behavior tracking events
export const behaviorEvent = {
  // Time on page tracking
  timeOnPage: (pagePath: string, timeSpent: number) => {
    event('page_time_spent', {
      page_path: pagePath,
      time_seconds: Math.round(timeSpent / 1000),
      engagement_category: timeSpent > 30000 ? 'high' : timeSpent > 10000 ? 'medium' : 'low'
    });
  },

  // Scroll depth tracking
  scrollDepth: (pagePath: string, depth: number) => {
    event('scroll_depth', {
      page_path: pagePath,
      scroll_percentage: depth,
      engagement_milestone: depth >= 75 ? 'deep' : depth >= 50 ? 'medium' : 'shallow'
    });
  },

  // Feature usage tracking
  featureUsage: (featureName: string, action: string, context?: string) => {
    event('feature_usage', {
      feature_name: featureName,
      action: action,
      ...(context && { context: context })
    });
  },

  // Search behavior
  siteSearch: (searchTerm: string, resultsCount: number, searchType: 'traditional' | 'semantic') => {
    event('site_search_performed', {
      search_term: searchTerm,
      search_results: resultsCount,
      search_type: searchType,
      search_quality: resultsCount > 0 ? 'successful' : 'no_results'
    });
  },

  // Exit intent tracking
  exitIntent: (pagePath: string, timeOnPage: number) => {
    event('exit_intent_detected', {
      page_path: pagePath,
      time_on_page: Math.round(timeOnPage / 1000),
      exit_trigger: 'mouse_leave'
    });
  }
};

// Performance tracking events
export const performanceEvent = {
  // Page load performance
  pageLoad: (pagePath: string, loadTime: number, coreWebVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
  }) => {
    event('page_performance', {
      page_path: pagePath,
      load_time_ms: Math.round(loadTime),
      lcp: coreWebVitals.lcp ? Math.round(coreWebVitals.lcp) : undefined,
      fid: coreWebVitals.fid ? Math.round(coreWebVitals.fid) : undefined,
      cls: coreWebVitals.cls ? Math.round(coreWebVitals.cls * 1000) / 1000 : undefined,
      performance_score: loadTime < 2000 ? 'good' : loadTime < 4000 ? 'needs_improvement' : 'poor'
    });
  },

  // API performance tracking
  apiCall: (endpoint: string, method: string, responseTime: number, status: number) => {
    event('api_performance', {
      api_endpoint: endpoint,
      http_method: method,
      response_time_ms: Math.round(responseTime),
      status_code: status,
      api_performance: responseTime < 500 ? 'fast' : responseTime < 1000 ? 'medium' : 'slow'
    });
  }
};

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: "config" | "event",
      targetId: string,
      config?: GtagEventParameters
    ) => void;
  }
}

export {};
