import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import {
  findSimilarProducts,
  getProductsByHealthBenefit,
  getProductsByCategory,
  getComplementaryProducts,
  getFrequentlyBoughtTogether
} from '@/lib/memgraph';

// GET /api/graph/recommendations - Get product recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const healthBenefit = searchParams.get('healthBenefit');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '5');
    const type = searchParams.get('type') || 'similar';
    const includeExplanation = searchParams.get('explain') === 'true';

    let recommendations = [];
    let explanation = '';

    switch (type) {
      case 'similar':
        if (!productId) {
          return NextResponse.json({
            success: false,
            error: 'Product ID is required for similar recommendations'
          }, { status: 400 });
        }
        recommendations = await findSimilarProducts(parseInt(productId), limit);
        explanation = 'Products with similar health benefits and categories';
        break;

      case 'complementary':
        if (!productId) {
          return NextResponse.json({
            success: false,
            error: 'Product ID is required for complementary recommendations'
          }, { status: 400 });
        }
        recommendations = await getComplementaryProducts(parseInt(productId), limit);
        explanation = 'Products that work well together with your selection';
        break;

      case 'health-benefit':
        if (!healthBenefit) {
          return NextResponse.json({
            success: false,
            error: 'Health benefit is required for health-benefit recommendations'
          }, { status: 400 });
        }
        recommendations = await getProductsByHealthBenefit(healthBenefit, limit);
        explanation = `Products that support ${healthBenefit}`;
        break;

      case 'category':
        if (!category) {
          return NextResponse.json({
            success: false,
            error: 'Category is required for category recommendations'
          }, { status: 400 });
        }
        recommendations = await getProductsByCategory(category, limit);
        explanation = `More products in ${category}`;
        break;

      case 'frequently-bought':
        if (!productId) {
          return NextResponse.json({
            success: false,
            error: 'Product ID is required for frequently-bought recommendations'
          }, { status: 400 });
        }
        recommendations = await getFrequentlyBoughtTogether(parseInt(productId), limit);
        explanation = 'Customers who bought this also bought';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid recommendation type. Use: similar, complementary, health-benefit, category, or frequently-bought'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        recommendations,
        count: recommendations.length,
        ...(includeExplanation && { explanation })
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