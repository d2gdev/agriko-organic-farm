import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { hybridSearch, runSearchExperiment, HybridSearchOptions } from '@/lib/hybrid-search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const mode = searchParams.get('mode') as 'hybrid' | 'semantic_only' | 'keyword_only' || 'hybrid';
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const inStock = searchParams.get('inStock');
    const featured = searchParams.get('featured');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    logger.info(`🔍 Hybrid search GET: "${query}" (mode: ${mode})`);

    const options: HybridSearchOptions = {
      mode,
      maxResults: limit,
      category: category || undefined,
      inStock: inStock === 'true' ? true : undefined,
      featured: featured === 'true' ? true : undefined,
    };

    const { results, searchStats } = await hybridSearch(query, options);

    return NextResponse.json({
      success: true,
      query,
      mode,
      results,
      count: results.length,
      searchType: 'hybrid',
      stats: searchStats,
    });

  } catch (error) {
    logger.error('❌ Hybrid search GET error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Hybrid search failed', 
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
      mode = 'hybrid',
      semanticWeight = 0.6,
      keywordWeight = 0.4,
      maxResults = 20,
      filters = {},
      keywordOptions = {},
      runExperiment = false,
      experiments = []
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required in request body' },
        { status: 400 }
      );
    }

    logger.info(`🔍 Advanced hybrid search POST: "${query}"`);
    logger.info('🎯 Options:', { mode, semanticWeight, keywordWeight, filters });

    // Handle A/B testing experiment mode
    if (runExperiment && experiments.length > 0) {
      logger.info('🧪 Running search experiments...');
      
      const experimentResults = await runSearchExperiment(query, experiments, maxResults);
      
      return NextResponse.json({
        success: true,
        query,
        experimentMode: true,
        experiments: experimentResults.experiments,
        comparison: experimentResults.comparison,
        searchType: 'hybrid_experiment'
      });
    }

    // Standard hybrid search
    const options: HybridSearchOptions = {
      mode,
      semanticWeight,
      keywordWeight,
      maxResults,
      ...filters,
      keywordOptions
    };

    const { results, searchStats } = await hybridSearch(query, options);

    return NextResponse.json({
      success: true,
      query,
      mode,
      weights: { semantic: semanticWeight, keyword: keywordWeight },
      results,
      count: results.length,
      searchType: 'hybrid_advanced',
      stats: searchStats,
      filters
    });

  } catch (error) {
    logger.error('❌ Advanced hybrid search POST error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Advanced hybrid search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS support
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}