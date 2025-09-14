import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { getProductsByHealthBenefit } from '@/lib/memgraph';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const benefit = searchParams.get('benefit');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!benefit) {
      return NextResponse.json(
        { success: false, error: 'benefit parameter is required' },
        { status: 400 }
      );
    }
    
    logger.info(`🍃 Finding products with health benefit: ${benefit}`);
    
    const products = await getProductsByHealthBenefit(benefit, limit);
    
    logger.info(`✅ Found ${products.length} products with benefit: ${benefit}`);
    
    return NextResponse.json({
      success: true,
      healthBenefit: benefit,
      products,
      count: products.length,
    });
    
  } catch (error) {
    logger.error('❌ Health benefits API error:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to find products by health benefit',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}