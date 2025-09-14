import { logger } from '@/lib/logger';
import { productCacheSafe, apiCacheSafe } from '@/lib/thread-safe-cache';
import { monitoring } from '@/lib/monitoring-service';
import { config } from '@/lib/unified-config';

// Real analytics data structures
export interface AnalyticsEvent {
  id: string;
  type: 'page_view' | 'product_view' | 'search_performed' | 'recommendation_clicked' | 'cart_addition' | 'purchase' | 'review_submitted';
  timestamp: number;
  sessionId: string;
  userId?: string;
  data: Record<string, unknown>;
  source: 'web' | 'api' | 'system';
}

export interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  userId?: string;
  events: string[]; // Event IDs
  pageViews: number;
  conversions: number;
  source: string;
  userAgent?: string;
  ip?: string;
}

export interface ProductAnalytics {
  productId: number;
  views: number;
  searches: number;
  recommendationClicks: number;
  cartAdditions: number;
  purchases: number;
  revenue: number;
  averageRating: number;
  reviewCount: number;
  lastUpdated: number;
}

export interface SearchAnalytics {
  query: string;
  timestamp: number;
  resultCount: number;
  clicked: boolean;
  clickedProductId?: number;
  searchType: 'keyword' | 'semantic' | 'hybrid';
  userId?: string;
  sessionId: string;
}

export interface RecommendationAnalytics {
  recommendationType: 'similar' | 'personalized' | 'health' | 'seasonal' | 'category';
  sourceProductId?: number;
  recommendedProductId: number;
  shown: number;
  clicked: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

// Real-time analytics collector
export class RealAnalyticsCollector {
  private static instance: RealAnalyticsCollector;
  private events = new Map<string, AnalyticsEvent>();
  private sessions = new Map<string, UserSession>();
  private productMetrics = new Map<number, ProductAnalytics>();
  private searchMetrics: SearchAnalytics[] = [];
  private recommendationMetrics: RecommendationAnalytics[] = [];
  private readonly MAX_EVENTS = 10000;
  private readonly MAX_SESSIONS = 1000;
  private readonly MAX_SEARCHES = 5000;

  static getInstance(): RealAnalyticsCollector {
    if (!RealAnalyticsCollector.instance) {
      RealAnalyticsCollector.instance = new RealAnalyticsCollector();
    }
    return RealAnalyticsCollector.instance;
  }

  // Track various events
  trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const eventId = this.generateEventId();
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: eventId,
      timestamp: Date.now()
    };

    // Store event
    this.events.set(eventId, fullEvent);
    
    // Update session
    this.updateSession(event.sessionId, eventId, event.type);
    
    // Update product metrics if relevant
    if (event.data.productId) {
      this.updateProductMetrics(Number(event.data.productId), event.type, event.data);
    }

    // Cleanup old events
    this.cleanupEvents();

    logger.debug('📊 Analytics event tracked', { 
      type: event.type, 
      sessionId: event.sessionId,
      productId: event.data.productId
    });
  }

  // Track page views
  trackPageView(sessionId: string, path: string, userId?: string, userAgent?: string, ip?: string): void {
    this.trackEvent({
      type: 'page_view',
      sessionId,
      userId,
      data: { path, userAgent, ip },
      source: 'web'
    });
  }

  // Track product views
  trackProductView(sessionId: string, productId: number, productName?: string, userId?: string): void {
    this.trackEvent({
      type: 'product_view',
      sessionId,
      userId,
      data: { productId, productName },
      source: 'web'
    });
  }

  // Track search events
  trackSearch(sessionId: string, query: string, resultCount: number, searchType: SearchAnalytics['searchType'], userId?: string): void {
    const searchEvent: SearchAnalytics = {
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
      resultCount,
      clicked: false,
      searchType,
      userId,
      sessionId
    };

    this.searchMetrics.push(searchEvent);
    
    // Cleanup old searches
    if (this.searchMetrics.length > this.MAX_SEARCHES) {
      this.searchMetrics = this.searchMetrics.slice(-this.MAX_SEARCHES * 0.8);
    }

    this.trackEvent({
      type: 'search_performed',
      sessionId,
      userId,
      data: { query, resultCount, searchType },
      source: 'web'
    });
  }

  // Track recommendation interactions
  trackRecommendationClick(
    sessionId: string, 
    recommendationType: RecommendationAnalytics['recommendationType'],
    recommendedProductId: number,
    sourceProductId?: number,
    userId?: string
  ): void {
    // Find existing recommendation metric or create new one
    const existingMetric = this.recommendationMetrics.find(r => 
      r.recommendationType === recommendationType && 
      r.recommendedProductId === recommendedProductId &&
      r.sourceProductId === sourceProductId
    );

    if (existingMetric) {
      existingMetric.clicked++;
    } else {
      this.recommendationMetrics.push({
        recommendationType,
        sourceProductId,
        recommendedProductId,
        shown: 1,
        clicked: 1,
        timestamp: Date.now(),
        sessionId,
        userId
      });
    }

    this.trackEvent({
      type: 'recommendation_clicked',
      sessionId,
      userId,
      data: { recommendationType, recommendedProductId, sourceProductId },
      source: 'web'
    });
  }

  // Track purchases
  trackPurchase(sessionId: string, productId: number, quantity: number, price: number, userId?: string): void {
    this.trackEvent({
      type: 'purchase',
      sessionId,
      userId,
      data: { productId, quantity, price, revenue: quantity * price },
      source: 'web'
    });
  }

  // Get dashboard analytics
  async getDashboardAnalytics(timeRange: string = '24h'): Promise<Record<string, unknown>> {
    const cutoffTime = this.getTimeRangeCutoff(timeRange);
    const recentEvents = Array.from(this.events.values()).filter(e => e.timestamp > cutoffTime);
    const recentSessions = Array.from(this.sessions.values()).filter(s => s.lastActivity > cutoffTime);

    // Real-time metrics
    const realTimeMetrics = this.calculateRealTimeMetrics(recentEvents, recentSessions);

    // Historical trends
    const historicalMetrics = this.calculateHistoricalMetrics(recentEvents, timeRange);

    // Product performance
    const productMetrics = this.calculateProductMetrics(cutoffTime);

    // Search analytics
    const searchMetrics = this.calculateSearchMetrics(cutoffTime);

    // Recommendation performance
    const recommendationMetrics = this.calculateRecommendationMetrics(cutoffTime);

    // System metrics from monitoring
    const systemMetrics = monitoring.getCurrentMetrics();

    return {
      realTime: realTimeMetrics,
      historical: historicalMetrics,
      products: productMetrics,
      search: searchMetrics,
      recommendations: recommendationMetrics,
      system: systemMetrics ? {
        memory: systemMetrics.memory,
        cpu: systemMetrics.cpu,
        cache: systemMetrics.cache,
        database: systemMetrics.database,
        errors: systemMetrics.errors
      } : null,
      summary: {
        totalEvents: recentEvents.length,
        activeSessions: recentSessions.length,
        timeRange,
        lastUpdated: new Date().toISOString(),
        dataSource: 'real_analytics'
      }
    };
  }

  // Private helper methods
  private updateSession(sessionId: string, eventId: string, eventType: AnalyticsEvent['type']): void {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = {
        sessionId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        events: [],
        pageViews: 0,
        conversions: 0,
        source: 'web'
      };
      this.sessions.set(sessionId, session);
    }

    session.lastActivity = Date.now();
    session.events.push(eventId);

    if (eventType === 'page_view') {
      session.pageViews++;
    } else if (eventType === 'purchase') {
      session.conversions++;
    }

    // Cleanup old sessions
    if (this.sessions.size > this.MAX_SESSIONS) {
      const oldestSessions = Array.from(this.sessions.entries())
        .sort(([,a], [,b]) => a.lastActivity - b.lastActivity)
        .slice(0, this.MAX_SESSIONS * 0.2);
      
      oldestSessions.forEach(([sessionId]) => this.sessions.delete(sessionId));
    }
  }

  private updateProductMetrics(productId: number, eventType: AnalyticsEvent['type'], data: Record<string, unknown>): void {
    let metrics = this.productMetrics.get(productId);
    
    if (!metrics) {
      metrics = {
        productId,
        views: 0,
        searches: 0,
        recommendationClicks: 0,
        cartAdditions: 0,
        purchases: 0,
        revenue: 0,
        averageRating: 0,
        reviewCount: 0,
        lastUpdated: Date.now()
      };
      this.productMetrics.set(productId, metrics);
    }

    switch (eventType) {
      case 'product_view':
        metrics.views++;
        break;
      case 'search_performed':
        metrics.searches++;
        break;
      case 'recommendation_clicked':
        metrics.recommendationClicks++;
        break;
      case 'cart_addition':
        metrics.cartAdditions++;
        break;
      case 'purchase':
        metrics.purchases++;
        metrics.revenue += Number(data.revenue) ?? 0;
        break;
    }

    metrics.lastUpdated = Date.now();
  }

  private calculateRealTimeMetrics(events: AnalyticsEvent[], sessions: UserSession[]): Record<string, unknown> {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    const recentEvents = events.filter(e => e.timestamp > lastHour);

    const productViews = recentEvents.filter(e => e.type === 'product_view').length;
    const searches = recentEvents.filter(e => e.type === 'search_performed').length;
    const recommendationClicks = recentEvents.filter(e => e.type === 'recommendation_clicked').length;
    const cartAdditions = recentEvents.filter(e => e.type === 'cart_addition').length;
    const purchases = recentEvents.filter(e => e.type === 'purchase').length;
    
    const revenue = recentEvents
      .filter(e => e.type === 'purchase')
      .reduce((sum, e) => sum + (Number(e.data.revenue) ?? 0), 0);

    const activeSessions = sessions.filter(s => s.lastActivity > lastHour).length;
    const conversions = sessions.reduce((sum, s) => sum + s.conversions, 0);
    const totalPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0);

    return {
      productViews,
      searches,
      recommendationClicks,
      cartAdditions,
      purchases,
      revenue: Math.round(revenue * 100) / 100,
      activeUsers: activeSessions,
      activeSessions,
      conversionRate: totalPageViews > 0 ? ((conversions / totalPageViews) * 100).toFixed(2) : '0.00',
      recommendationCTR: recommendationClicks > 0 ? ((recommendationClicks / productViews) * 100).toFixed(2) : '0.00'
    };
  }

  private calculateHistoricalMetrics(events: AnalyticsEvent[], timeRange: string): Record<string, unknown> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;
    const dailyMetrics: Array<{day: string, eventType: string, count: number}> = [];

    // Group events by day
    const eventsByDay = new Map<string, Map<string, number>>();
    
    events.forEach(event => {
      // Check if timestamp exists before using it
      if (!event.timestamp) return;
      
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      if (day && !eventsByDay.has(day)) {
        eventsByDay.set(day, new Map());
      }
      if (day) {
        const dayEvents = eventsByDay.get(day);
        if (dayEvents) {
          dayEvents.set(event.type, (dayEvents.get(event.type) ?? 0) + 1);
        }
      }
    });

    // Convert to array format
    eventsByDay.forEach((eventCounts, day) => {
      eventCounts.forEach((count, eventType) => {
        dailyMetrics.push({ day, eventType, count });
      });
    });

    // Get top products
    const topProducts = Array.from(this.productMetrics.entries())
      .sort(([,a], [,b]) => b.views - a.views)
      .slice(0, 5)
      .map(([productId, metrics]) => ({
        productId,
        productName: `Product ${productId}`, // Would be populated from product data
        views: metrics.views
      }));

    return {
      dailyMetrics: dailyMetrics.slice(0, days * 3), // Limit results
      topProducts
    };
  }

  private calculateProductMetrics(cutoffTime: number): Record<string, unknown> {
    const recentProducts = Array.from(this.productMetrics.values())
      .filter(p => p.lastUpdated > cutoffTime)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      topProducts: recentProducts,
      totalProducts: this.productMetrics.size,
      averageViews: recentProducts.length > 0 
        ? Math.round(recentProducts.reduce((sum, p) => sum + p.views, 0) / recentProducts.length) 
        : 0
    };
  }

  private calculateSearchMetrics(cutoffTime: number): Record<string, unknown> {
    const recentSearches = this.searchMetrics.filter(s => s.timestamp > cutoffTime);
    
    // Group by query
    const queryStats = new Map<string, { count: number, clicked: number }>();
    recentSearches.forEach(search => {
      const stats = queryStats.get(search.query) ?? { count: 0, clicked: 0 };
      stats.count++;
      if (search.clicked) stats.clicked++;
      queryStats.set(search.query, stats);
    });

    const topQueries = Array.from(queryStats.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([query, stats]) => ({
        query,
        searches: stats.count,
        successRate: stats.count > 0 ? (stats.clicked / stats.count) : 0
      }));

    // Group by search type
    const searchTypes = new Map<string, number>();
    recentSearches.forEach(search => {
      searchTypes.set(search.searchType, (searchTypes.get(search.searchType) || 0) + 1);
    });

    return {
      topQueries,
      searchTypes: Array.from(searchTypes.entries()).map(([type, count]) => ({ searchType: type, count })),
      totalSearches: recentSearches.length
    };
  }

  private calculateRecommendationMetrics(cutoffTime: number): Record<string, unknown> {
    const recentRecommendations = this.recommendationMetrics.filter(r => r.timestamp > cutoffTime);
    
    // Group by type
    const performanceByType = new Map<string, { shown: number, clicked: number }>();
    recentRecommendations.forEach(rec => {
      const stats = performanceByType.get(rec.recommendationType) ?? { shown: 0, clicked: 0 };
      stats.shown += rec.shown;
      stats.clicked += rec.clicked;
      performanceByType.set(rec.recommendationType, stats);
    });

    return {
      performanceByType: Array.from(performanceByType.entries()).map(([type, stats]) => ({
        recommendationType: type,
        shown: stats.shown,
        clicked: stats.clicked,
        ctr: stats.shown > 0 ? ((stats.clicked / stats.shown) * 100).toFixed(2) : '0.00'
      }))
    };
  }

  private getTimeRangeCutoff(timeRange: string): number {
    const now = Date.now();
    switch (timeRange) {
      case '1h': return now - 60 * 60 * 1000;
      case '24h': return now - 24 * 60 * 60 * 1000;
      case '7d': return now - 7 * 24 * 60 * 60 * 1000;
      case '30d': return now - 30 * 24 * 60 * 60 * 1000;
      default: return now - 24 * 60 * 60 * 1000;
    }
  }

  private cleanupEvents(): void {
    if (this.events.size > this.MAX_EVENTS) {
      const eventEntries = Array.from(this.events.entries());
      eventEntries.sort(([,a], [,b]) => b.timestamp - a.timestamp);
      
      // Keep most recent events
      const eventsToKeep = eventEntries.slice(0, Math.floor(this.MAX_EVENTS * 0.8));
      this.events.clear();
      eventsToKeep.forEach(([id, event]) => this.events.set(id, event));
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public utility methods
  getStats() {
    return {
      events: this.events.size,
      sessions: this.sessions.size,
      products: this.productMetrics.size,
      searches: this.searchMetrics.length,
      recommendations: this.recommendationMetrics.length
    };
  }

  clearData(): void {
    this.events.clear();
    this.sessions.clear();
    this.productMetrics.clear();
    this.searchMetrics = [];
    this.recommendationMetrics = [];
    logger.info('🗑️ Analytics data cleared');
  }
}

// Export singleton instance
export const realAnalytics = RealAnalyticsCollector.getInstance();

// Helper functions for external use
export function trackPageView(sessionId: string, path: string, userId?: string, userAgent?: string, ip?: string): void {
  realAnalytics.trackPageView(sessionId, path ?? '', userId, userAgent, ip);
}

export function trackProductView(sessionId: string, productId: number, productName?: string, userId?: string): void {
  realAnalytics.trackProductView(sessionId, productId, productName, userId);
}

export function trackSearch(sessionId: string, query: string, resultCount: number, searchType: SearchAnalytics['searchType'], userId?: string): void {
  // Add null checks for the parameters
  realAnalytics.trackSearch(sessionId, query ?? '', resultCount, searchType ?? 'keyword', userId);
}

export function trackRecommendationClick(
  sessionId: string, 
  recommendationType: RecommendationAnalytics['recommendationType'],
  recommendedProductId: number,
  sourceProductId?: number,
  userId?: string
): void {
  // Add null checks for the parameters
  realAnalytics.trackRecommendationClick(sessionId, recommendationType ?? 'similar', recommendedProductId, sourceProductId, userId);
}

export function trackPurchase(sessionId: string, productId: number, quantity: number, price: number, userId?: string): void {
  realAnalytics.trackPurchase(sessionId, productId, quantity, price, userId);
}

export default realAnalytics;