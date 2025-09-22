// Analytics tracking API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { 
  analyticsCollector, 
  realTimeMetrics,
  trackProductView,
  trackRecommendationClick,
  trackSearch,
  AnalyticsEvent 
} from '@/lib/analytics-collector';
import { analyticsEventSchema, batchAnalyticsSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    
    // Validate request body structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { events, event } = body;

    // Handle batch events
    if (events && Array.isArray(events)) {
      // Validate batch events
      const batchValidation = batchAnalyticsSchema.safeParse({ events });
      if (!batchValidation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid batch events', 
            details: batchValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        );
      }

      for (const evt of batchValidation.data.events) {
        await processEvent(evt, request);
      }
      
      return NextResponse.json({
        success: true,
        message: `Tracked ${events.length} events`,
        timestamp: new Date().toISOString()
      });
    }

    // Handle single event
    if (event) {
      // Validate single event
      const eventValidation = analyticsEventSchema.safeParse(event);
      if (!eventValidation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid event data', 
            details: eventValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        );
      }

      await processEvent(eventValidation.data, request);
      
      return NextResponse.json({
        success: true,
        message: 'Event tracked successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'No events provided' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('❌ Analytics tracking error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Failed to track analytics event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

interface EventData {
  id?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string | Date;
  type: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

async function processEvent(eventData: EventData, request: NextRequest): Promise<void> {
  // Extract metadata from request
  const metadata = {
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip: request.headers.get('x-forwarded-for') ?? 
         request.headers.get('x-real-ip') ?? 
         undefined,
    referrer: request.headers.get('referer') ?? undefined
  };

  // Enhance event with metadata
  const event: AnalyticsEvent = {
    id: eventData.id ?? generateEventId(),
    userId: eventData.userId,
    sessionId: eventData.sessionId ?? generateSessionId(),
    timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
    type: eventData.type,
    data: eventData.data ?? {},
    metadata: { ...metadata, ...eventData.metadata }
  };

  // Track user activity
  if (event.userId) {
    realTimeMetrics.trackUser(event.userId);
  }
  realTimeMetrics.trackSession(event.sessionId);

  // Use specific tracking functions for better type safety
  switch (event.type) {
    case 'product_view':
      if (event.data.productId && event.data.productName) {
        trackProductView(Number(event.data.productId), {
          productName: typeof event.data.productName === 'string' ? event.data.productName : '',
          category: typeof event.data.category === 'string' ? event.data.category : 'Unknown',
          price: typeof event.data.price === 'number' ? event.data.price : 0,
          source: typeof event.data.source === 'string' && 
                  ['search', 'category', 'recommendation', 'direct', 'featured'].includes(event.data.source) 
                  ? event.data.source as 'search' | 'category' | 'recommendation' | 'direct' | 'featured' 
                  : 'direct',
          userId: event.userId,
          sessionId: typeof event.sessionId === 'string' ? event.sessionId : '',
          recommendationType: typeof event.data.recommendationType === 'string' ? event.data.recommendationType : undefined,
          dwellTime: typeof event.data.dwellTime === 'number' ? event.data.dwellTime : undefined
        });
      }
      break;

    case 'recommendation_clicked':
      if (event.data.productId && event.data.recommendationType) {
        trackRecommendationClick(Number(event.data.productId), {
          recommendationType: typeof event.data.recommendationType === 'string' ? event.data.recommendationType : '',
          position: typeof event.data.position === 'number' ? event.data.position : 0,
          score: typeof event.data.score === 'number' ? event.data.score : 0,
          confidence: typeof event.data.confidence === 'number' ? event.data.confidence : 0,
          factors: typeof event.data.factors === 'object' && event.data.factors !== null 
                   ? event.data.factors as Record<string, number>
                   : {},
          userId: event.userId,
          sessionId: typeof event.sessionId === 'string' ? event.sessionId : '',
          context: typeof event.data.context === 'object' && event.data.context !== null 
                   ? event.data.context as Record<string, unknown>
                   : undefined
        });
      }
      break;

    case 'search_performed':
      if (typeof event.data.query === 'string' && event.data.query) {
        trackSearch(event.data.query, {
          resultsCount: typeof event.data.resultsCount === 'number' ? event.data.resultsCount : 0,
          searchType: typeof event.data.searchType === 'string' &&
                      ['keyword', 'semantic', 'hybrid'].includes(event.data.searchType)
                      ? event.data.searchType as 'keyword' | 'semantic' | 'hybrid'
                      : 'keyword',
          userId: event.userId,
          sessionId: typeof event.sessionId === 'string' ? event.sessionId : '',
          clickedResults: Array.isArray(event.data.clickedResults) ? event.data.clickedResults : undefined,
          timeToFirstClick: typeof event.data.timeToFirstClick === 'number' ? event.data.timeToFirstClick : undefined
        });
      }
      break;

    default:
      // Track generic event
      await analyticsCollector.track(event);
      break;
  }
}

function generateEventId(): string {
  // Use crypto.randomUUID() for better uniqueness and collision resistance
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `evt_${crypto.randomUUID()}`;
  }
  
  // Fallback for environments without crypto.randomUUID
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substr(2, 9);
  const processId = typeof process !== 'undefined' && process.pid ? process.pid : Math.floor(Math.random() * 10000);
  return `evt_${timestamp}_${processId}_${randomPart}`;
}

function generateSessionId(): string {
  // Use crypto.randomUUID() for better uniqueness and collision resistance
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `sess_${crypto.randomUUID()}`;
  }
  
  // Fallback for environments without crypto.randomUUID
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substr(2, 9);
  const processId = typeof process !== 'undefined' && process.pid ? process.pid : Math.floor(Math.random() * 10000);
  return `sess_${timestamp}_${processId}_${randomPart}`;
}

// GET endpoint for health check
export async function GET() {
  const queueStatus = analyticsCollector.getQueueStatus();
  const metrics = realTimeMetrics.getMetrics();

  return NextResponse.json({
    success: true,
    status: 'Analytics tracking is operational',
    queue: queueStatus,
    realTimeMetrics: {
      productViews: metrics.productViews,
      recommendationClicks: metrics.recommendationClicks,
      searches: metrics.searches,
      cartAdditions: metrics.cartAdditions,
      purchases: metrics.purchases,
      revenue: metrics.revenue,
      activeUsers: metrics.activeUsers,
      activeSessions: metrics.activeSessions,
      conversionRate: realTimeMetrics.getConversionRate(),
      recommendationCTR: realTimeMetrics.getRecommendationCTR()
    },
    timestamp: new Date().toISOString()
  });
}