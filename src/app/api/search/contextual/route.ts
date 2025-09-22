import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { contextualSearch, getContextualSuggestions, ContextualSearchOptions } from '@/lib/contextual-search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action') || 'search';
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId parameter is required for contextual search' },
        { status: 400 }
      );
    }

    // Handle suggestions
    if (action === 'suggestions') {
      if (!query) {
        return NextResponse.json(
          { error: 'Query parameter "q" is required for suggestions' },
          { status: 400 }
        );
      }

      const location = {
        country: searchParams.get('country') || undefined,
        region: searchParams.get('region') || undefined,
        city: searchParams.get('city') || undefined
      };

      const suggestions = getContextualSuggestions(query, sessionId, location);

      return NextResponse.json({
        success: true,
        query,
        suggestions,
        searchType: 'contextual_suggestions'
      });
    }

    // Handle contextual search
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    logger.info(`🎯 Contextual search GET: "${query}" for session ${sessionId}`);

    const options: ContextualSearchOptions = {
      sessionId,
      userId: searchParams.get('userId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      category: searchParams.get('category') || undefined,
      inStockOnly: searchParams.get('inStock') === 'true' ? true : undefined,
      location: {
        country: searchParams.get('country') || undefined,
        region: searchParams.get('region') || undefined,
        city: searchParams.get('city') || undefined
      },
      enablePersonalization: searchParams.get('personalization') !== 'false',
      enableSeasonalBoost: searchParams.get('seasonal') !== 'false',
      enableQueryExpansion: searchParams.get('expansion') !== 'false',
      userAgent: request.headers.get('user-agent') || undefined
    };

    const { results, searchStats, contextualInsights, qualityMetrics } = await contextualSearch(query, options);

    return NextResponse.json({
      success: true,
      query,
      sessionId,
      results,
      count: results.length,
      searchType: 'contextual',
      stats: searchStats,
      contextualInsights,
      qualityMetrics,
      appliedContext: contextualInsights.appliedContext,
      semanticClusters: contextualInsights.semanticClusters?.slice(0, 5), // Top 5 clusters
      personalizedBoosts: contextualInsights.personalizedBoosts,
      intent: contextualInsights.searchIntent
    });

  } catch (error) {
    logger.error('❌ Contextual search GET error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Contextual search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      sessionId,
      userId,
      location,
      preferences = {},
      options = {}
    } = body;

    if (!query || !sessionId) {
      return NextResponse.json(
        { error: 'Query and sessionId are required in request body' },
        { status: 400 }
      );
    }

    logger.info(`🎯 Advanced contextual search POST: "${query}"`);
    logger.info('🎯 Location:', location);
    logger.info('🎯 Preferences:', { keys: Object.keys(preferences) });

    const contextualOptions: ContextualSearchOptions = {
      sessionId,
      userId,
      location,
      limit: options.limit || 20,
      category: options.category,
      inStockOnly: options.inStockOnly,
      enablePersonalization: options.enablePersonalization !== false,
      enableSeasonalBoost: options.enableSeasonalBoost !== false,
      enableQueryExpansion: options.enableQueryExpansion !== false,
      userAgent: request.headers.get('user-agent') || undefined
    };

    const { results, searchStats, contextualInsights, qualityMetrics } = await contextualSearch(query, contextualOptions);

    return NextResponse.json({
      success: true,
      query,
      sessionId,
      location,
      results,
      count: results.length,
      searchType: 'contextual_advanced',
      stats: searchStats,
      contextualInsights: {
        ...contextualInsights,
        enhancementsApplied: contextualInsights.appliedContext.length,
        personalizedBoostCount: Object.keys(contextualInsights.personalizedBoosts).length,
        regionalBoostCount: Object.keys(contextualInsights.regionalBoosts).length
      },
      qualityMetrics,
      semanticAnalysis: {
        intent: contextualInsights.searchIntent,
        clusters: contextualInsights.semanticClusters?.slice(0, 3),
        facets: contextualInsights.semanticFacets
      },
      configuration: {
        personalization: contextualOptions.enablePersonalization,
        seasonalBoost: contextualOptions.enableSeasonalBoost,
        queryExpansion: contextualOptions.enableQueryExpansion,
        searchMode: 'hybrid'
      }
    });

  } catch (error) {
    logger.error('❌ Advanced contextual search POST error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Advanced contextual search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}