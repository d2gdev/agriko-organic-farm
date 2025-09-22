import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { 
  getEmbedderStatus, 
  initializeEmbedder, 
  reinitializeEmbedder,
  isEmbedderReady 
} from '@/lib/embeddings';

/**
 * GET /api/embeddings/status - Check embedding model status
 */
export async function GET() {
  try {
    const status = getEmbedderStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Error getting embedder status:', error as Record<string, unknown>);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get embedder status',
      status: {
        ready: false,
        loading: false,
        error: 'Unknown error',
        retryCount: 0
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/embeddings/status - Initialize or reinitialize embedding model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reinitialize') {
      logger.info('Reinitializing embedding model via API');
      await reinitializeEmbedder();
    } else {
      // Default action: initialize
      logger.info('Initializing embedding model via API');
      await initializeEmbedder();
    }

    const status = getEmbedderStatus();

    return NextResponse.json({
      success: true,
      message: action === 'reinitialize' ? 'Model reinitialized' : 'Model initialized',
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error initializing embedder:', error as Record<string, unknown>);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize embedder',
      message: (error as Error).message,
      status: getEmbedderStatus()
    }, { status: 500 });
  }
}

/**
 * PUT /api/embeddings/status - Warm up the embedding model with a test embedding
 */
export async function PUT() {
  try {
    if (!isEmbedderReady()) {
      return NextResponse.json({
        success: false,
        error: 'Embedder not ready',
        status: getEmbedderStatus()
      }, { status: 503 });
    }

    // Warm up with a test embedding
    const embedder = await initializeEmbedder();
    const testText = "This is a test embedding to warm up the model.";
    
    const startTime = Date.now();
    const result = await embedder(testText, { pooling: 'mean', normalize: true });
    const endTime = Date.now();
    
    logger.info('Embedding model warmed up successfully', {
      testText,
      processingTime: endTime - startTime,
      dimensions: result.dims || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: 'Model warmed up successfully',
      warmupTime: endTime - startTime,
      dimensions: result.dims,
      testEmbeddingLength: Array.isArray(result.data) ? result.data.length : result.data?.length,
      status: getEmbedderStatus()
    });
  } catch (error) {
    logger.error('Error warming up embedder:', error as Record<string, unknown>);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to warm up embedder',
      message: (error as Error).message,
      status: getEmbedderStatus()
    }, { status: 500 });
  }
}