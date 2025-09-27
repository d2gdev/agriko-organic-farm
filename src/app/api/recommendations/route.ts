// API route for multi-factor recommendations
import { NextRequest, NextResponse } from 'next/server';
import { 
  getPersonalizedRecommendations,
  getSimilarProducts,
  getHealthBasedRecommendations,
  getSeasonalRecommendations,
  UserProfile,
  RecommendationContext
} from '@/lib/multi-factor-recommendations';
import { getProductsByIds } from '@/lib/woocommerce';
import { checkEndpointRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting for recommendation endpoints
  const rl = checkEndpointRateLimit(request, 'public');
  if (!rl.success) {
    return createRateLimitResponse(rl);
  }

  try {
    const body = await request.json();
    
    // Validate request body with Zod schema
    const { recommendationApiSchema } = await import('@/lib/validation');
    const validation = recommendationApiSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const { type, userProfile, context, productId, healthCondition, season } = validation.data;
    let recommendations;
    
    switch (type) {
      case 'personalized': {
        if (!userProfile) {
          return NextResponse.json(
            { error: 'User profile is required for personalized recommendations' },
            { status: 400 }
          );
        }

        // Convert the validated userProfile to the expected UserProfile interface
        const completeUserProfile: UserProfile = {
          userId: userProfile.userId,
          purchaseHistory: userProfile.purchaseHistory || [],
          viewHistory: [], // Not in the schema, so default to empty
          searchHistory: [], // Not in the schema, so default to empty
          healthGoals: userProfile.preferences || [], // Map preferences to healthGoals
          preferredCategories: [], // Not in the schema, so default to empty
          dietaryRestrictions: [], // Not in the schema, so default to empty
          location: userProfile.demographics?.location,
          // seasonalPreferences not in schema, so omit
        };

        // Convert context to proper RecommendationContext type
        let recommendationContext: RecommendationContext | undefined;
        if (context) {
          recommendationContext = {
            limit: context.limit,
            currentSeason: context.season, // Fix: use currentSeason instead of season
            // Only include priceRange if both min and max are defined
            ...(context.priceRange?.min !== undefined && context.priceRange?.max !== undefined && {
              priceRange: {
                min: context.priceRange.min,
                max: context.priceRange.max
              }
            })
          };
        }

        recommendations = await getPersonalizedRecommendations(completeUserProfile, recommendationContext);
        break;
      }

      case 'similar':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required for similar product recommendations' },
            { status: 400 }
          );
        }
        // Validate productId is a positive integer within safe bounds
        if (!Number.isInteger(productId) || productId <= 0 || productId > Number.MAX_SAFE_INTEGER) {
          return NextResponse.json(
            { error: 'Product ID must be a positive integer within safe bounds' },
            { status: 400 }
          );
        }
        recommendations = await getSimilarProducts(productId, context?.limit || 5);
        break;

      case 'health':
        if (!healthCondition) {
          return NextResponse.json(
            { error: 'Health condition is required for health-based recommendations' },
            { status: 400 }
          );
        }
        recommendations = await getHealthBasedRecommendations(healthCondition, context?.limit || 10);
        break;

      case 'seasonal':
        if (!season) {
          return NextResponse.json(
            { error: 'Season is required for seasonal recommendations' },
            { status: 400 }
          );
        }
        recommendations = await getSeasonalRecommendations(season, context?.limit || 10);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid recommendation type. Use: personalized, similar, health, or seasonal' },
          { status: 400 }
        );
    }

    // Get full product details from WooCommerce
    const productIds = recommendations.map(r => r.productId);
    const products = await getProductsByIds(productIds);
    
    // Combine recommendation scores with product data
    const enrichedRecommendations = recommendations.map(rec => {
      const product = products.find(p => p.id === rec.productId);
      return {
        ...rec,
        product: product || null
      };
    }).filter(rec => rec.product !== null); // Remove products that couldn't be found

    return NextResponse.json({
      success: true,
      type,
      recommendations: enrichedRecommendations,
      count: enrichedRecommendations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const { handleApiError } = await import('@/lib/error-sanitizer');
    return handleApiError(error as Error, 'Failed to generate recommendations');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const productIdStr = searchParams.get('productId');
    const healthCondition = searchParams.get('healthCondition');
    const season = searchParams.get('season');
    const limitStr = searchParams.get('limit') || '10';
    
    // Validate and parse parameters
    const limit = parseInt(limitStr);
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 50' },
        { status: 400 }
      );
    }
    
    // Validate productId string format before parsing
    if (productIdStr && !/^\d+$/.test(productIdStr)) {
      return NextResponse.json(
        { error: 'Product ID must be a positive integer' },
        { status: 400 }
      );
    }
    
    const productId = productIdStr ? parseInt(productIdStr) : null;
    if (productId === null || isNaN(productId) || productId <= 0 || productId > Number.MAX_SAFE_INTEGER) {
      return NextResponse.json(
        { error: 'Product ID must be a positive integer within safe bounds' },
        { status: 400 }
      );
    }

    let recommendations;

    switch (type) {
      case 'similar':
        if (!productId) {
          return NextResponse.json(
            { error: 'Product ID is required for similar product recommendations' },
            { status: 400 }
          );
        }
        recommendations = await getSimilarProducts(productId, limit);
        break;

      case 'health':
        if (!healthCondition) {
          return NextResponse.json(
            { error: 'Health condition is required for health-based recommendations' },
            { status: 400 }
          );
        }
        recommendations = await getHealthBasedRecommendations(healthCondition, limit);
        break;

      case 'seasonal':
        if (!season) {
          return NextResponse.json(
            { error: 'Season is required for seasonal recommendations' },
            { status: 400 }
          );
        }
        recommendations = await getSeasonalRecommendations(season, limit);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid or missing recommendation type. Use: similar, health, or seasonal' },
          { status: 400 }
        );
    }

    // Get full product details
    const productIds = recommendations.map(r => r.productId);
    const products = await getProductsByIds(productIds);
    
    const enrichedRecommendations = recommendations.map(rec => {
      const product = products.find(p => p.id === rec.productId);
      return {
        ...rec,
        product: product || null
      };
    }).filter(rec => rec.product !== null);

    return NextResponse.json({
      success: true,
      type,
      recommendations: enrichedRecommendations,
      count: enrichedRecommendations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const { handleApiError } = await import('@/lib/error-sanitizer');
    return handleApiError(error as Error, 'Failed to generate recommendations');
  }
}