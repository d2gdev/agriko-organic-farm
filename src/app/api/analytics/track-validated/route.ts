import { NextRequest, NextResponse } from 'next/server';
import { validateAnalyticsEvent, safeValidateAnalyticsEvent } from '@/lib/validation-schemas';
import { logger } from '@/lib/logger';
import type { AnalyticsEvent } from '@/lib/validation-schemas';

// POST /api/analytics/track-validated - Type-safe analytics tracking
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Use safe validation to avoid throwing
    const result = safeValidateAnalyticsEvent(body);
    
    if (!result.success) {
      logger.warn('Invalid analytics event received', {
        errors: result.error.errors,
        receivedData: body
      });
      
      return NextResponse.json({
        success: false,
        error: 'Invalid analytics event format',
        details: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    // Now we have type-safe data
    const event: AnalyticsEvent = result.data;
    
    // Process the validated event
    await processAnalyticsEvent(event);
    
    logger.info('Analytics event processed successfully', {
      eventType: event.eventType,
      sessionId: event.sessionId,
      userId: event.userId
    });
    
    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      eventId: generateEventId(event)
    });
    
  } catch (error) {
    logger.error('Analytics tracking error:', error as Record<string, unknown>);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Type-safe event processing
async function processAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  // All properties are now type-safe
  const { eventType, userId, sessionId, timestamp, data, metadata } = event;
  
  // Type-safe data access
  if (metadata?.device) {
    logger.debug(`Event from ${metadata.device} device`);
  }
  
  if (metadata?.utm) {
    logger.debug('UTM parameters present', metadata.utm);
  }
  
  // Store in database (type-safe)
  // await storeAnalyticsEvent(event);
  
  // Send to external analytics services (type-safe)
  // await sendToGoogleAnalytics(event);
}

function generateEventId(event: AnalyticsEvent): string {
  return `${event.sessionId}_${event.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
}