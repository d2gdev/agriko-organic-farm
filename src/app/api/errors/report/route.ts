import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json();

    // Log the error for monitoring
    logger.error('Client-side error reported:', {
      message: errorReport.message,
      stack: errorReport.stack,
      componentStack: errorReport.componentStack,
      url: errorReport.url,
      userAgent: errorReport.userAgent,
      timestamp: errorReport.timestamp
    });

    // In production, you would send this to a monitoring service like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - New Relic
    // - Custom logging service

    // For now, just acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Error reported successfully'
    });

  } catch (error) {
    logger.error('Failed to process error report:', error as Record<string, unknown>);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to report error'
      },
      { status: 500 }
    );
  }
}