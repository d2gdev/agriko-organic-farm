import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { syncProductsToQdrant, vectorizeSingleProduct } from '@/lib/vectorization';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'sync', 
      productId, 
      batchSize = 20, 
      maxProducts = 100, 
      featuredOnly = false 
    } = body;

    // Verify this is an admin request (you may want to add proper auth)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.includes('admin')) {
      logger.info('⚠️ Vectorization attempted without proper authorization');
      // For development, we'll allow it, but add proper auth in production
    }

    if (action === 'single' && productId) {
      logger.info(`🎯 Single product vectorization requested: ${productId}`);
      
      const success = await vectorizeSingleProduct(parseInt(productId));
      
      return NextResponse.json({
        success,
        action: 'single_product',
        productId: parseInt(productId),
        message: success ? 'Product vectorized successfully' : 'Product vectorization failed'
      });

    } else if (action === 'sync') {
      logger.info('🚀 Bulk product vectorization started');
      
      const result = await syncProductsToQdrant({
        batchSize,
        maxProducts,
        featuredOnly,
      });

      return NextResponse.json({
        success: result.success,
        action: 'bulk_sync',
        processed: result.processed || 0,
        maxProducts,
        featuredOnly,
        message: result.success 
          ? `Successfully processed ${result.processed} products` 
          : 'Vectorization failed',
        error: result.error || undefined,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "sync" for bulk or "single" with productId' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('❌ Vectorization API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Vectorization API - Use POST with action "sync" or "single"',
    endpoints: {
      'POST /api/vectorize': {
        description: 'Vectorize products',
        actions: {
          sync: 'Bulk vectorize products',
          single: 'Vectorize single product (requires productId)',
        },
        parameters: {
          action: 'sync | single',
          productId: 'number (required for single action)',
          batchSize: 'number (default: 20, for sync action)',
          maxProducts: 'number (default: 100, for sync action)',
          featuredOnly: 'boolean (default: false, for sync action)',
        },
      },
    },
    status: 'ready',
  });
}