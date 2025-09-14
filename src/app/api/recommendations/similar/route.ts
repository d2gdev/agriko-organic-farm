import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { findSimilarProducts } from '@/lib/memgraph';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '5');
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId parameter is required' },
        { status: 400 }
      );
    }
    
    logger.info(`🔍 Finding similar products for product ID: ${productId}`);
    
    const similarProducts = await findSimilarProducts(parseInt(productId), limit);
    
    logger.info(`✅ Found ${similarProducts.length} similar products`);
    
    return NextResponse.json({
      success: true,
      productId: parseInt(productId),
      similar: similarProducts,
      count: similarProducts.length,
    });
    
  } catch (error) {
    logger.error('❌ Similar products API error:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to find similar products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}