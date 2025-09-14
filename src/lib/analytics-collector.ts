// Advanced Analytics Data Collection System
import { getSession } from './memgraph';
import neo4j, { Session } from 'neo4j-driver';
import { logger } from './logger';

// Analytics event types
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  type: string;
  data: Record<string, unknown>;
  metadata?: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    viewport?: { width: number; height: number };
    device?: 'mobile' | 'tablet' | 'desktop';
  };
}

// Specific event types
export interface ProductViewEvent extends AnalyticsEvent {
  type: 'product_view';
  data: {
    productId: number;
    productName: string;
    category: string;
    price: number;
    source: 'search' | 'recommendation' | 'category' | 'direct' | 'featured';
    recommendationType?: string;
    dwellTime?: number;
  };
}

export interface RecommendationEvent extends AnalyticsEvent {
  type: 'recommendation_shown' | 'recommendation_clicked';
  data: {
    recommendationType: string;
    productId: number;
    position: number;
    score: number;
    confidence: number;
    factors: Record<string, number>;
    context?: Record<string, unknown>;
  };
}

export interface SearchEvent extends AnalyticsEvent {
  type: 'search_performed';
  data: {
    query: string;
    resultsCount: number;
    searchType: 'keyword' | 'semantic' | 'hybrid';
    clickedResults: number[];
    timeToFirstClick?: number;
  };
}

export interface CartEvent extends AnalyticsEvent {
  type: 'add_to_cart' | 'remove_from_cart' | 'cart_viewed' | 'checkout_started' | 'purchase_completed';
  data: {
    productId?: number;
    quantity?: number;
    cartValue?: number;
    cartItems?: Array<{ productId: number; quantity: number; price: number }>;
    orderId?: string;
    paymentMethod?: string;
  };
}

export interface UserBehaviorEvent extends AnalyticsEvent {
  type: 'page_view' | 'session_start' | 'session_end' | 'scroll_depth' | 'time_on_page';
  data: {
    path?: string;
    title?: string;
    scrollPercentage?: number;
    timeSpent?: number;
    exitIntent?: boolean;
  };
}

// Analytics collector class
export class AnalyticsCollector {
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startBatchFlush();
  }

  // Track individual events
  async track(event: AnalyticsEvent): Promise<void> {
    // Add to queue for batch processing
    this.eventQueue.push({
      ...event,
      id: event.id ?? this.generateEventId(),
      timestamp: event.timestamp ?? new Date()
    });

    // Flush immediately for critical events
    const criticalEvents = ['purchase_completed', 'checkout_started', 'error'];
    if (criticalEvents.includes(event.type)) {
      await this.flush();
    }

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  // Batch flush events to storage
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await Promise.all([
        this.storeEventsInGraph(events),
        this.storeEventsInMemory(events),
        this.updateRealTimeMetrics(events)
      ]);

      logger.debug(`Flushed ${events.length} analytics events`, { count: events.length }, 'analytics');
    } catch (error) {
      logger.error('Failed to flush analytics events', error as Record<string, unknown>, 'analytics');
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  // Store events in MemGraph for complex analysis
  private async storeEventsInGraph(events: AnalyticsEvent[]): Promise<void> {
    const session = await getSession();
    
    try {
      for (const event of events) {
        await session.run(`
          MERGE (e:AnalyticsEvent {id: $id})
          SET e.userId = $userId,
              e.sessionId = $sessionId,
              e.timestamp = $timestamp,
              e.type = $type,
              e.data = $data,
              e.metadata = $metadata
        `, {
          id: event.id,
          userId: event.userId ?? null,
          sessionId: event.sessionId,
          timestamp: event.timestamp.toISOString(),
          type: event.type,
          data: JSON.stringify(event.data),
          metadata: JSON.stringify(event.metadata ?? {})
        });

        // Create relationships based on event type
        await this.createEventRelationships(session, event);
      }
    } finally {
      await session.close();
    }
  }

  // Create graph relationships for events
  private async createEventRelationships(session: Session, event: AnalyticsEvent): Promise<void> {
    switch (event.type) {
      case 'product_view':
      case 'recommendation_clicked':
        interface ProductEventData {
          productId?: number;
        }
        const productData = event.data as ProductEventData;
        const productId = productData.productId;
        if (productId) {
          await session.run(`
            MATCH (e:AnalyticsEvent {id: $eventId})
            MATCH (p:Product {id: $productId})
            MERGE (e)-[:RELATES_TO]->(p)
          `, { eventId: event.id, productId: neo4j.int(productId) });
        }
        break;

      case 'search_performed':
        // Create search query nodes for analysis
        interface SearchEventData {
          query?: string;
        }
        const searchData = event.data as SearchEventData;
        const query = searchData.query;
        if (query) {
          await session.run(`
            MATCH (e:AnalyticsEvent {id: $eventId})
            MERGE (q:SearchQuery {text: $query})
            MERGE (e)-[:SEARCHED_FOR]->(q)
          `, { eventId: event.id, query });
        }
        break;

      case 'recommendation_shown':
        // Track recommendation context
        interface RecommendationEventData {
          recommendationType?: string;
        }
        const recData = event.data as RecommendationEventData;
        const recType = recData.recommendationType;
        if (recType) {
          await session.run(`
            MATCH (e:AnalyticsEvent {id: $eventId})
            MERGE (rt:RecommendationType {name: $recType})
            MERGE (e)-[:USED_RECOMMENDATION]->(rt)
          `, { eventId: event.id, recType });
        }
        break;
    }
  }

  // Store events in memory for fast access
  private async storeEventsInMemory(events: AnalyticsEvent[]): Promise<void> {
    // This would typically go to Redis or another in-memory store
    // For now, we'll use a simple in-memory cache
    events.forEach(event => {
      analyticsCache.addEvent(event);
    });
  }

  // Update real-time metrics
  private async updateRealTimeMetrics(events: AnalyticsEvent[]): Promise<void> {
    const metrics = realTimeMetrics;

    for (const event of events) {
      switch (event.type) {
        case 'product_view':
          metrics.incrementProductViews();
          break;
        case 'recommendation_clicked':
          metrics.incrementRecommendationClicks();
          break;
        case 'search_performed':
          metrics.incrementSearches();
          break;
        case 'add_to_cart':
          metrics.incrementCartAdditions();
          break;
        case 'purchase_completed':
          interface CartEventData {
            cartValue?: number;
          }
          const cartData = event.data as CartEventData;
          const orderValue = cartData.cartValue ?? 0;
          metrics.incrementPurchases(orderValue);
          break;
      }
    }
  }

  // Start batch flush timer
  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => logger.error('Auto-flush failed', error, 'analytics'));
    }, this.flushInterval);
  }

  // Stop collector
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush().catch(error => logger.error('Final flush failed', error, 'analytics'));
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get queue status
  getQueueStatus(): { queued: number; batchSize: number } {
    return {
      queued: this.eventQueue.length,
      batchSize: this.batchSize
    };
  }
}

// In-memory analytics cache
class AnalyticsCache {
  private events: AnalyticsEvent[] = [];
  private maxSize = 10000;

  addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxSize) {
      this.events = this.events.slice(-this.maxSize);
    }
  }

  getEvents(filter?: Partial<AnalyticsEvent>): AnalyticsEvent[] {
    if (!filter) return [...this.events];

    return this.events.filter(event => {
      return Object.keys(filter).every(key => 
        event[key as keyof AnalyticsEvent] === filter[key as keyof AnalyticsEvent]
      );
    });
  }

  getEventsByTimeRange(start: Date, end: Date): AnalyticsEvent[] {
    return this.events.filter(event => 
      event.timestamp >= start && event.timestamp <= end
    );
  }

  clear(): void {
    this.events = [];
  }

  getStats(): { totalEvents: number; eventTypes: Record<string, number> } {
    const eventTypes: Record<string, number> = {};
    
    this.events.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] ?? 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventTypes
    };
  }
}

// Real-time metrics tracking
class RealTimeMetrics {
  private metrics = {
    productViews: 0,
    recommendationClicks: 0,
    searches: 0,
    cartAdditions: 0,
    purchases: 0,
    revenue: 0,
    activeUsers: new Set<string>(),
    activeSessions: new Set<string>()
  };

  private hourlyMetrics: Array<{
    hour: string;
    productViews: number;
    recommendationClicks: number;
    searches: number;
    cartAdditions: number;
    purchases: number;
    revenue: number;
  }> = [];

  incrementProductViews(): void {
    this.metrics.productViews++;
    this.updateHourlyMetrics('productViews');
  }

  incrementRecommendationClicks(): void {
    this.metrics.recommendationClicks++;
    this.updateHourlyMetrics('recommendationClicks');
  }

  incrementSearches(): void {
    this.metrics.searches++;
    this.updateHourlyMetrics('searches');
  }

  incrementCartAdditions(): void {
    this.metrics.cartAdditions++;
    this.updateHourlyMetrics('cartAdditions');
  }

  incrementPurchases(revenue: number = 0): void {
    this.metrics.purchases++;
    this.metrics.revenue += revenue;
    this.updateHourlyMetrics('purchases');
    this.updateHourlyMetrics('revenue', revenue);
  }

  trackUser(userId: string): void {
    this.metrics.activeUsers.add(userId);
  }

  trackSession(sessionId: string): void {
    this.metrics.activeSessions.add(sessionId);
  }

  private updateHourlyMetrics(metric: string, value: number = 1): void {
    const currentHour = new Date().toISOString().slice(0, 13);
    let hourlyEntry = this.hourlyMetrics.find(entry => entry.hour === currentHour);
    
    if (!hourlyEntry) {
      hourlyEntry = {
        hour: currentHour,
        productViews: 0,
        recommendationClicks: 0,
        searches: 0,
        cartAdditions: 0,
        purchases: 0,
        revenue: 0
      };
      this.hourlyMetrics.push(hourlyEntry);
      
      // Keep only last 24 hours
      if (this.hourlyMetrics.length > 24) {
        this.hourlyMetrics.shift();
      }
    }

    // Update specific metrics instead of casting
    switch (metric) {
      case 'productViews':
        hourlyEntry.productViews += value;
        break;
      case 'recommendationClicks':
        hourlyEntry.recommendationClicks += value;
        break;
      case 'searches':
        hourlyEntry.searches += value;
        break;
      case 'cartAdditions':
        hourlyEntry.cartAdditions += value;
        break;
      case 'purchases':
        hourlyEntry.purchases += value;
        break;
      case 'revenue':
        hourlyEntry.revenue += value;
        break;
    }
  }

  getMetrics() {
    const metrics = this.metrics;
    const hourlyMetrics = this.hourlyMetrics;
    
    return {
      ...metrics,
      activeUsers: metrics.activeUsers.size,
      activeSessions: metrics.activeSessions.size,
      hourlyMetrics: [...hourlyMetrics]
    };
  }

  getConversionRate(): number {
    return this.metrics.productViews > 0 
      ? (this.metrics.purchases / this.metrics.productViews) * 100 
      : 0;
  }

  getRecommendationCTR(): number {
    return this.metrics.recommendationClicks > 0 
      ? (this.metrics.recommendationClicks / (this.metrics.productViews ?? 1)) * 100 
      : 0;
  }

  reset(): void {
    this.metrics = {
      productViews: 0,
      recommendationClicks: 0,
      searches: 0,
      cartAdditions: 0,
      purchases: 0,
      revenue: 0,
      activeUsers: new Set<string>(),
      activeSessions: new Set<string>()
    };
  }
}

// Singleton instances
export const analyticsCollector = new AnalyticsCollector();
export const analyticsCache = new AnalyticsCache();
export const realTimeMetrics = new RealTimeMetrics();

// Utility functions for common tracking scenarios
export const trackProductView = (productId: number, options: {
  productName: string;
  category: string;
  price: number;
  source: 'search' | 'recommendation' | 'category' | 'direct' | 'featured';
  userId?: string;
  sessionId: string;
  recommendationType?: string;
  dwellTime?: number;
}): void => {
  analyticsCollector.track({
    id: '',
    userId: options.userId,
    sessionId: options.sessionId,
    timestamp: new Date(),
    type: 'product_view',
    data: {
      productId,
      productName: options.productName,
      category: options.category,
      price: options.price,
      source: options.source,
      recommendationType: options.recommendationType,
      dwellTime: options.dwellTime
    }
  });
};

export const trackRecommendationClick = (productId: number, options: {
  recommendationType: string;
  position: number;
  score: number;
  confidence: number;
  factors: Record<string, number>;
  userId?: string;
  sessionId: string;
  context?: Record<string, unknown>;
}): void => {
  analyticsCollector.track({
    id: '',
    userId: options.userId,
    sessionId: options.sessionId,
    timestamp: new Date(),
    type: 'recommendation_clicked',
    data: {
      productId,
      recommendationType: options.recommendationType,
      position: options.position,
      score: options.score,
      confidence: options.confidence,
      factors: options.factors,
      context: options.context
    }
  });
};

export const trackSearch = (query: string, options: {
  resultsCount: number;
  searchType: 'keyword' | 'semantic' | 'hybrid';
  userId?: string;
  sessionId: string;
  clickedResults?: number[];
  timeToFirstClick?: number;
}): void => {
  analyticsCollector.track({
    id: '',
    userId: options.userId,
    sessionId: options.sessionId,
    timestamp: new Date(),
    type: 'search_performed',
    data: {
      query,
      resultsCount: options.resultsCount,
      searchType: options.searchType,
      clickedResults: options.clickedResults ?? [],
      timeToFirstClick: options.timeToFirstClick
    }
  });
};