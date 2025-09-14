import { NextRequest, NextResponse } from 'next/server';
import { getRemoteLoggingStatus, logRemote } from '@/lib/remote-logging';
import { logger } from '@/lib/logger';
import { validateApiAuthSecure } from '@/lib/unified-auth';

/**
 * GET /api/logging/status - Get remote logging status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await validateApiAuthSecure(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const status = getRemoteLoggingStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting remote logging status:', error as Record<string, unknown>);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get logging status'
    }, { status: 500 });
  }
}

/**
 * POST /api/logging/status - Test remote logging
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await validateApiAuthSecure(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { level = 'info', message = 'Remote logging test', testData } = body;

    // Validate log level
    if (!['debug', 'info', 'warn', 'error'].includes(level)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid log level'
      }, { status: 400 });
    }

    // Send test log
    await logRemote(
      level,
      message,
      { 
        test: true, 
        timestamp: new Date().toISOString(),
        requestedBy: authResult.user?.userId,
        ...testData 
      },
      'api-test',
      {
        userId: authResult.user?.userId,
        tags: ['test', 'api']
      }
    );

    logger.info('Remote logging test initiated', {
      level,
      message,
      initiatedBy: authResult.user?.userId
    });

    return NextResponse.json({
      success: true,
      message: 'Test log sent to remote logging service',
      testDetails: {
        level,
        message,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error testing remote logging:', error as Record<string, unknown>);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test remote logging',
      details: (error as Error).message
    }, { status: 500 });
  }
}