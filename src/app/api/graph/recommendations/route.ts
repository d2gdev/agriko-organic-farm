import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { findSimilarProducts, getProductsByHealthBenefit, getProductsByCategory } from '@/lib/memgraph';

// GET /api/graph/recommendations - Get product recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const healthBenefit = searchParams.get('healthBenefit');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '5');
    const type = searchParams.get('type') || 'similar';

    let recommendations = [];

    switch (type) {
      case 'similar':
        if (!productId) {
          return NextResponse.json({
            success: false,
            error: 'Product ID is required for similar recommendations'
          }, { status: 400 });
        }
        recommendations = await findSimilarProducts(parseInt(productId), limit);
        break;

      case 'health-benefit':
        if (!healthBenefit) {
          return NextResponse.json({
            success: false,
            error: 'Health benefit is required for health-benefit recommendations'
          }, { status: 400 });
        }
        recommendations = await getProductsByHealthBenefit(healthBenefit, limit);
        break;

      case 'category':
        if (!category) {
          return NextResponse.json({
            success: false,
            error: 'Category is required for category recommendations'
          }, { status: 400 });
        }
        recommendations = await getProductsByCategory(category, limit);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid recommendation type. Use: similar, health-benefit, or category'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        recommendations,
        count: recommendations.length
      }
    });

  } catch (error) {
    logger.error('❌ Graph recommendations error:', error as Record<string, unknown>);
    return NextResponse.json({
      success: false,
      error: 'Failed to get recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}