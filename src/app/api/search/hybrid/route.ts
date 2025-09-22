import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { performHybridSearch } from '@/lib/hybrid-search';
import { contextualSearch } from '@/lib/contextual-search';
import { trackSearchEvent } from '@/lib/search-quality-metrics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const expandQuery = searchParams.get('expand') !== 'false';
    const category = searchParams.get('category') || undefined;
    const inStockOnly = searchParams.get('inStock') !== 'false';

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required'
      }, { status: 400 });
    }

    logger.info(`🔍 Enhanced hybrid search API called: "${query}"`);

    // Generate session ID for tracking
    const sessionId = request.headers.get('x-session-id') ||
                      request.headers.get('x-forwarded-for') ||
                      `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Use enhanced contextual search with hybrid capabilities
      const { results: contextualResults, contextualInsights, qualityMetrics } = await contextualSearch(query, {
        sessionId,
        userId: searchParams.get('userId') || undefined,
        limit,
        category,
        inStockOnly,
        enablePersonalization: searchParams.get('personalization') !== 'false',
        enableSemanticClustering: true,
        enableIntentAnalysis: true,
        enableQueryExpansion: expandQuery
      });

      // Track search event
      trackSearchEvent({
        sessionId,
        query,
        searchType: 'hybrid',
        results: contextualResults.slice(0, 10).map((result, index) => ({
          productId: result.product.id,
          position: index + 1,
          score: result.score,
          title: result.product.name,
          relevanceScore: result.score,
          personalizationBoost: result.personalizationBoost
        })),
        userActions: {
          clickedResults: [],
          purchasedResults: [],
          dwellTimes: {},
          abandonedSession: false
        },
        metadata: {
          responseTime: 0,
          totalResults: contextualResults.length
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          query,
          count: contextualResults.length,
          results: contextualResults,
          insights: {
            intent: (contextualInsights as any).searchIntent,
            clusters: (contextualInsights as any).semanticClusters?.slice(0, 3),
            personalizedBoosts: Object.keys(contextualInsights.personalizedBoosts).length,
            qualityScore: (qualityMetrics as any)?.relevanceScore
          }
        }
      });

    } catch (contextualError) {
      logger.warn('Enhanced search failed, falling back to basic hybrid:', contextualError as Record<string, unknown>);

      // Fallback to basic hybrid search
      const results = await performHybridSearch(query, {
        limit,
        expandQuery,
        category,
        inStockOnly
      });

      return NextResponse.json({
        success: true,
        data: {
          query,
          count: results.length,
          results,
          fallback: true
        }
      });
    }

  } catch (error) {
    logger.error('❌ Hybrid search API error:', error as Record<string, unknown>);
    return NextResponse.json({
      success: false,
      error: 'Failed to perform hybrid search',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}