import { NextResponse } from 'next/server';
import { resetCircuitBreaker, getCircuitBreakerStats } from '@/lib/retry-handler';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    logger.info('🔄 Manual circuit breaker reset requested');

    // Get current stats
    const stats = getCircuitBreakerStats();
    const circuitBreakerKeys = Object.keys(stats);

    if (circuitBreakerKeys.length === 0) {
      logger.info('✅ No active circuit breakers found');
      return NextResponse.json({
        success: true,
        message: 'No active circuit breakers to reset',
        resetCount: 0
      });
    }

    // Reset all circuit breakers
    let resetCount = 0;
    circuitBreakerKeys.forEach(key => {
      resetCircuitBreaker(key);
      resetCount++;
      logger.info(`✅ Reset circuit breaker: ${key}`);
    });

    logger.info(`🔄 Reset ${resetCount} circuit breakers`);

    return NextResponse.json({
      success: true,
      message: `Successfully reset ${resetCount} circuit breakers`,
      resetCount,
      resetKeys: circuitBreakerKeys
    });

  } catch (error) {
    logger.error('❌ Failed to reset circuit breakers:', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      message: 'Failed to reset circuit breakers',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

export async function GET() {
  try {
    const stats = getCircuitBreakerStats();

    return NextResponse.json({
      success: true,
      circuitBreakers: stats,
      count: Object.keys(stats).length
    });
  } catch (error) {
    logger.error('❌ Failed to get circuit breaker stats:', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      success: false,
      message: 'Failed to get circuit breaker stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}