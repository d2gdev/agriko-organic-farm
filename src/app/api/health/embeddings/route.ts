import { NextResponse } from 'next/server';
import { embeddingsHealthCheck } from '@/lib/startup-embeddings';
import { logger } from '@/lib/logger';

/**
 * GET /api/health/embeddings - Embedding service health check
 */
export async function GET() {
  try {
    const healthStatus = await embeddingsHealthCheck();
    
    const httpStatus = healthStatus.status === 'healthy' ? 200 :
                      healthStatus.status === 'loading' ? 202 : 503;
    
    return NextResponse.json({
      service: 'embeddings',
      timestamp: new Date().toISOString(),
      ...healthStatus
    }, { status: httpStatus });
    
  } catch (error) {
    logger.error('Embedding health check API error:', error as Record<string, unknown>);
    
    return NextResponse.json({
      service: 'embeddings',
      timestamp: new Date().toISOString(),
      status: 'error',
      ready: false,
      loading: false,
      error: 'Health check failed'
    }, { status: 500 });
  }
}