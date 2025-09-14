// API route for recommendation explanations
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { MultiFactorRecommendationEngine, UserProfile } from '@/lib/multi-factor-recommendations';
import { getProduct } from '@/lib/woocommerce';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userProfile } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile is required' },
        { status: 400 }
      );
    }

    const engine = new MultiFactorRecommendationEngine();
    
    try {
      // Get explanation from the recommendation engine
      const explanation = await engine.getRecommendationExplanation(
        parseInt(productId),
        userProfile as UserProfile
      );

      // Get full product details from WooCommerce
      const wooProduct = await getProduct(parseInt(productId));

      return NextResponse.json({
        success: true,
        productId: parseInt(productId),
        product: wooProduct,
        explanation: explanation.explanation,
        factors: explanation.factors,
        graphProduct: explanation.product,
        timestamp: new Date().toISOString()
      });

    } catch (innerError) {
      logger.error('❌ Engine error:', innerError as Record<string, unknown>);
      return NextResponse.json(
        { 
          error: 'Failed to generate recommendation explanation',
          details: innerError instanceof Error ? innerError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('❌ Recommendation explanation API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendation explanation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // For GET requests, provide a basic explanation without user context
    const engine = new MultiFactorRecommendationEngine();
    
    try {
      const basicUserProfile: UserProfile = {
        purchaseHistory: [],
        viewHistory: [],
        searchHistory: [],
        healthGoals: [],
        preferredCategories: [],
        dietaryRestrictions: []
      };

      const explanation = await engine.getRecommendationExplanation(
        parseInt(productId),
        basicUserProfile
      );

      const wooProduct = await getProduct(parseInt(productId));

      return NextResponse.json({
        success: true,
        productId: parseInt(productId),
        product: wooProduct,
        explanation: 'This product is recommended based on its general appeal and quality.',
        factors: ['featured product', 'high quality', 'popular choice'],
        graphProduct: explanation.product,
        timestamp: new Date().toISOString()
      });

    } catch (innerError) {
      logger.error('❌ Basic explanation error:', innerError as Record<string, unknown>);
      return NextResponse.json(
        { 
          error: 'Failed to generate basic explanation',
          details: innerError instanceof Error ? innerError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('❌ Recommendation explanation API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendation explanation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}