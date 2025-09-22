import { NextRequest, NextResponse } from 'next/server';
import { BaseEvent } from '@/lib/client-event-system';
import { jobProcessor, JobType } from '@/lib/job-processor';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { events }: { events: BaseEvent[] } = await request.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      );
    }

    // Process events through the job processor
    for (const event of events) {
      await jobProcessor.enqueue(JobType.PROCESS_EVENT, {
        eventData: event,
        priority: 'normal'
      });
    }

    logger.info(`Processed ${events.length} events from client`);

    return NextResponse.json({
      success: true,
      processed: events.length
    });

  } catch (error) {
    logger.error('Failed to process client events:', error as Record<string, unknown>);

    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    );
  }
}