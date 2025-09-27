import { NextRequest, NextResponse } from 'next/server';
import {
  getGlobalCacheStatus,
  forceGlobalCacheCleanup,
  updateGlobalMemoryLimit
} from '@/lib/global-cache-coordinator';
import { logger } from '@/lib/logger';
import { validateApiAuthSecure } from '@/lib/unified-auth';

export const runtime = 'nodejs';

/**
 * GET /api/cache/status - Get global cache status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication for sensitive cache information
    const authResult = await validateApiAuthSecure(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const status = getGlobalCacheStatus();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...status
    });
    
  } catch (error) {
    logger.error('Error getting global cache status:', error as Record<string, unknown>);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get cache status'
    }, { status: 500 });
  }
}

/**
 * POST /api/cache/status - Perform cache operations
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
    const { action, aggressive = false } = body;

    switch (action) {
      case 'cleanup': {
        logger.info('Manual cache cleanup initiated', {
          aggressive,
          initiatedBy: authResult.user?.userId
        });

        await forceGlobalCacheCleanup(aggressive);
        const statusAfterCleanup = getGlobalCacheStatus();

        return NextResponse.json({
          success: true,
          message: `Cache cleanup completed (${aggressive ? 'aggressive' : 'gentle'})`,
          status: statusAfterCleanup
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: cleanup'
        }, { status: 400 });
    }
    
  } catch (error) {
    logger.error('Error performing cache operation:', error as Record<string, unknown>);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform cache operation',
      details: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * PUT /api/cache/status - Update cache configuration
 */
export async function PUT(request: NextRequest) {
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
    const { maxMemoryMB } = body;

    if (typeof maxMemoryMB === 'number' && maxMemoryMB > 0) {
      logger.info('Updating global cache memory limit', { 
        newLimit: maxMemoryMB,
        updatedBy: authResult.user?.userId 
      });
      
      updateGlobalMemoryLimit(maxMemoryMB);
      const updatedStatus = getGlobalCacheStatus();
      
      return NextResponse.json({
        success: true,
        message: `Memory limit updated to ${maxMemoryMB}MB`,
        status: updatedStatus
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid maxMemoryMB value. Must be a positive number.'
      }, { status: 400 });
    }
    
  } catch (error) {
    logger.error('Error updating cache configuration:', error as Record<string, unknown>);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update cache configuration',
      details: (error as Error).message
    }, { status: 500 });
  }
}