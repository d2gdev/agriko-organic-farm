import { logger } from '@/lib/logger';
import SafeLocalStorage from '@/lib/safe-localstorage';
import type {
  AnalyticsEvent,
  AnalyticsMetadata
} from '@/types/analytics';
// Client-side analytics tracking for user behavior
'use client';

class ClientAnalytics {
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimer?: NodeJS.Timeout;
  private scrollTimer?: NodeJS.Timeout;
  private timeTimer?: NodeJS.Timeout;
  private isTracking = true;
  private pageStartTime = Date.now();
  private scrollDepth = 0;
  private maxScrollDepth = 0;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initializeTracking();
  }

  // Initialize tracking systems
  private initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page views
    this.trackPageView();

    // Track scroll depth
    this.initScrollTracking();

    // Track time on page
    this.initTimeTracking();

    // Track exit intent
    this.initExitIntentTracking();

    // Track clicks on recommendation items
    this.initRecommendationTracking();

    // Start batch processing
    this.startBatchProcessing();

    // Track when user leaves
    window.addEventListener('beforeunload', () => {
      this.trackTimeOnPage();
      this.flush();
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackTimeOnPage();
      } else {
        this.pageStartTime = Date.now();
      }
    });
  }

  // Get or create session ID
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'ssr_session';

    const stored = SafeLocalStorage.getItem('analytics_session_id');
    const sessionExpiry = SafeLocalStorage.getItem('analytics_session_expiry');
    
    if (stored && sessionExpiry && Date.now() < parseInt(sessionExpiry)) {
      return stored;
    }

    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiryTime = Date.now() + 30 * 60 * 1000; // 30 minutes

    SafeLocalStorage.setItem('analytics_session_id', newSessionId);
    SafeLocalStorage.setItem('analytics_session_expiry', expiryTime.toString());

    return newSessionId;
  }

  // Set user ID for personalized tracking
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Track generic event
  track(eventType: string, data: Record<string, unknown> = {}): void {
    if (!this.isTracking) return;

    const event: AnalyticsEvent = {
      eventType: eventType,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      data,
      metadata: this.getMetadata()
    };

    this.eventQueue.push(event);

    // Immediate flush for critical events
    if (['purchase_completed', 'checkout_started', 'error'].includes(eventType)) {
      this.flush();
    }
  }

  // Track page view
  trackPageView(): void {
    this.track('page_view', {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer
    });
  }

  // Track product view
  trackProductView(productId: number, productData: {
    name: string;
    category: string;
    price: number;
    source: 'search' | 'recommendation' | 'category' | 'direct' | 'featured';
    recommendationType?: string;
  }): void {
    this.track('product_view', {
      productId,
      productName: productData.name,
      category: productData.category,
      price: productData.price,
      source: productData.source,
      recommendationType: productData.recommendationType
    });
  }

  // Track recommendation interaction
  trackRecommendationClick(productId: number, recommendationData: {
    type: string;
    position: number;
    score: number;
    confidence: number;
    factors: Record<string, number>;
  }): void {
    this.track('recommendation_clicked', {
      productId,
      recommendationType: recommendationData.type,
      position: recommendationData.position,
      score: recommendationData.score,
      confidence: recommendationData.confidence,
      factors: recommendationData.factors
    });
  }

  // Track search
  trackSearch(query: string, searchData: {
    resultsCount: number;
    searchType: 'keyword' | 'semantic' | 'hybrid';
    clickedResults?: number[];
  }): void {
    this.track('search_performed', {
      query,
      resultsCount: searchData.resultsCount,
      searchType: searchData.searchType,
      clickedResults: searchData.clickedResults ?? []
    });
  }

  // Track cart actions
  trackCartAction(action: 'add_to_cart' | 'remove_from_cart' | 'cart_viewed', data: {
    productId?: number;
    quantity?: number;
    cartValue?: number;
  }): void {
    this.track(action, data);
  }

  // Track checkout events
  trackCheckout(action: 'checkout_started' | 'purchase_completed', data: {
    cartValue: number;
    cartItems: Array<{ productId: number; quantity: number; price: number }>;
    orderId?: string;
    paymentMethod?: string;
  }): void {
    this.track(action, data);
  }

  // Initialize scroll tracking
  private initScrollTracking(): void {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const windowHeight = window.innerHeight;
      
      this.scrollDepth = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
      this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth);

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(trackScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Track scroll milestones
    const scrollMilestones = [25, 50, 75, 90];
    let trackedMilestones: number[] = [];

    const checkScrollMilestones = () => {
      scrollMilestones.forEach(milestone => {
        if (this.scrollDepth >= milestone && !trackedMilestones.includes(milestone)) {
          trackedMilestones.push(milestone);
          this.track('scroll_depth', { 
            percentage: milestone,
            path: window.location.pathname
          });
        }
      });
    };

    this.scrollTimer = setInterval(checkScrollMilestones, 1000);
  }

  // Initialize time tracking
  private initTimeTracking(): void {
    if (typeof window === 'undefined') return;

    this.timeTimer = setInterval(() => {
      if (!document.hidden) {
        this.trackTimeOnPage();
      }
    }, 15000); // Track every 15 seconds
  }

  // Track time spent on current page
  private trackTimeOnPage(): void {
    const timeSpent = Date.now() - this.pageStartTime;
    
    if (timeSpent > 5000) { // Only track if more than 5 seconds
      this.track('time_on_page', {
        path: window.location.pathname,
        timeSpent: Math.round(timeSpent / 1000), // in seconds
        scrollDepth: this.maxScrollDepth
      });

      this.pageStartTime = Date.now(); // Reset timer
    }
  }

  // Initialize exit intent tracking
  private initExitIntentTracking(): void {
    if (typeof window === 'undefined') return;

    let exitIntentTriggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentTriggered) {
        exitIntentTriggered = true;
        this.track('exit_intent', {
          path: window.location.pathname,
          timeOnPage: Math.round((Date.now() - this.pageStartTime) / 1000),
          scrollDepth: this.maxScrollDepth
        });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
  }

  // Initialize recommendation tracking
  private initRecommendationTracking(): void {
    if (typeof window === 'undefined') return;

    // Use event delegation to track clicks on recommendation items
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const recElement = target.closest('[data-recommendation]');
      
      if (recElement) {
        const dataset = (recElement as HTMLElement).dataset;
        const productId = parseInt(dataset.productId ?? '0');
        const recType = dataset.recommendationType ?? 'unknown';
        const position = parseInt(dataset.position ?? '0');
        const score = parseFloat(dataset.score ?? '0');
        const confidence = parseFloat(dataset.confidence ?? '0');

        if (productId) {
          this.trackRecommendationClick(productId, {
            type: recType,
            position,
            score,
            confidence,
            factors: JSON.parse(dataset.factors ?? '{}') as Record<string, number>
          });
        }
      }
    });
  }

  // Get browser metadata
  private getMetadata(): AnalyticsMetadata {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device: this.getDeviceType(),
      referrer: document.referrer,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Detect device type
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Start batch processing
  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, 10000); // Flush every 10 seconds
  }

  // Flush events to server
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        keepalive: true // Important for unload events
      });

      logger.info(`📊 Sent ${events.length} analytics events`);
    } catch (error) {
      logger.error('❌ Failed to send analytics events:', error as Record<string, unknown>);
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  // Stop tracking
  stop(): void {
    this.isTracking = false;
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    if (this.scrollTimer) {
      clearInterval(this.scrollTimer);
    }
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
    }
    this.flush();
  }

  // Get current session data
  getSessionInfo(): { sessionId: string; userId?: string } {
    return {
      sessionId: this.sessionId,
      userId: this.userId
    };
  }

  // Manual scroll depth tracking
  getCurrentScrollDepth(): number {
    return this.scrollDepth;
  }

  // Debug mode - log events instead of sending
  enableDebugMode(): void {
    this.track = (eventType: string, data: Record<string, unknown> = {}) => {
      logger.info('🔍 Analytics Event:', { eventType, data, sessionId: this.sessionId });
    };
  }
}

// Create singleton instance
export const clientAnalytics = new ClientAnalytics();

// Export tracking functions for easy use
export const trackPageView = () => clientAnalytics.trackPageView();

export const trackProductView = (productId: number, productData: {
    name: string;
    category: string;
    price: number;
    source: 'search' | 'recommendation' | 'category' | 'direct' | 'featured';
    recommendationType?: string;
  }) => 
  clientAnalytics.trackProductView(productId, productData);

export const trackRecommendationClick = (productId: number, recData: {
    type: string;
    position: number;
    score: number;
    confidence: number;
    factors: Record<string, number>;
  }) => 
  clientAnalytics.trackRecommendationClick(productId, recData);

export const trackSearch = (query: string, searchData: {
    resultsCount: number;
    searchType: 'keyword' | 'semantic' | 'hybrid';
    clickedResults?: number[];
  }) => 
  clientAnalytics.trackSearch(query, searchData);

export const trackCartAction = (action: 'add_to_cart' | 'remove_from_cart' | 'cart_viewed', data: {
    productId?: number;
    quantity?: number;
    cartValue?: number;
  }) => 
  clientAnalytics.trackCartAction(action, data);

export const trackCheckout = (action: 'checkout_started' | 'purchase_completed', data: {
    cartValue: number;
    cartItems: Array<{ productId: number; quantity: number; price: number }>;
    orderId?: string;
    paymentMethod?: string;
  }) => 
  clientAnalytics.trackCheckout(action, data);

// React hook for analytics
export function useAnalytics() {
  const track = (eventType: string, data: Record<string, unknown> = {}) => {
    clientAnalytics.track(eventType, data);
  };

  const setUserId = (userId: string) => {
    clientAnalytics.setUserId(userId);
  };

  const getSessionInfo = () => {
    return clientAnalytics.getSessionInfo();
  };

  return {
    track,
    setUserId,
    getSessionInfo,
    trackPageView,
    trackProductView,
    trackRecommendationClick,
    trackSearch,
    trackCartAction,
    trackCheckout
  };
}

export default clientAnalytics;