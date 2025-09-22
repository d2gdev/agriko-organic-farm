import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getAllProducts } from '@/lib/woocommerce';
import { indexProducts, checkQdrantHealth } from '@/lib/qdrant';
import { URL_CONSTANTS } from '@/lib/url-constants';

export async function POST(_request: NextRequest) {
  try {
    // Check if Qdrant is available
    const isHealthy = await checkQdrantHealth();
    if (!isHealthy) {
      return NextResponse.json(
        {
          error: 'Qdrant service is not available',
          message: 'Please ensure Qdrant is running and configured correctly'
        },
        { status: 503 }
      );
    }

    logger.info('Starting product indexing in Qdrant...');

    // Fetch all products from WooCommerce
    const products = await getAllProducts();

    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          error: 'No products found',
          message: 'Please ensure WooCommerce has products'
        },
        { status: 404 }
      );
    }

    // Index products in Qdrant
    await indexProducts(products);

    logger.info(`Successfully indexed ${products.length} products in Qdrant`);

    return NextResponse.json({
      success: true,
      message: `Indexed ${products.length} products`,
      count: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to index products in Qdrant:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        error: 'Indexing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Health check for Qdrant
    const isHealthy = await checkQdrantHealth();

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      qdrant: {
        url: URL_CONSTANTS.API.QDRANT,
        collection: process.env.QDRANT_COLLECTION || 'agriko_products',
        configured: !!process.env.QDRANT_URL
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Qdrant health check failed:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}