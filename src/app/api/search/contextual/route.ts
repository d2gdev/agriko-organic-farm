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
      mode: (searchParams.get('mode') as 'hybrid' | 'semantic_only' | 'keyword_only' | null) || 'hybrid',
      maxResults: parseInt(searchParams.get('limit') || '20'),
      category: searchParams.get('category') || undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
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

    const { results, searchStats, contextualInsights } = await contextualSearch(query, options);

    return NextResponse.json({
      success: true,
      query,
      sessionId,
      results,
      count: results.length,
      searchType: 'contextual',
      stats: searchStats,
      contextualInsights,
      appliedContext: contextualInsights.appliedContext
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
      mode: options.mode || 'hybrid',
      semanticWeight: options.semanticWeight || 0.6,
      keywordWeight: options.keywordWeight || 0.4,
      maxResults: options.maxResults || 20,
      minSemanticScore: options.minSemanticScore,
      minKeywordScore: options.minKeywordScore,
      category: options.category,
      inStock: options.inStock,
      featured: options.featured,
      priceRange: options.priceRange,
      enablePersonalization: options.enablePersonalization !== false,
      enableSeasonalBoost: options.enableSeasonalBoost !== false,
      enableQueryExpansion: options.enableQueryExpansion !== false,
      userAgent: request.headers.get('user-agent') || undefined,
      keywordOptions: options.keywordOptions || {}
    };

    const { results, searchStats, contextualInsights } = await contextualSearch(query, contextualOptions);

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
      configuration: {
        personalization: contextualOptions.enablePersonalization,
        seasonalBoost: contextualOptions.enableSeasonalBoost,
        queryExpansion: contextualOptions.enableQueryExpansion,
        searchMode: contextualOptions.mode
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