import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { getAllProducts } from '@/lib/woocommerce';
import { keywordSearch, buildSearchIndex, getSearchSuggestions, KeywordSearchOptions, SearchIndex } from '@/lib/keyword-search';

// Cache for search index
let searchIndexCache: SearchIndex[] | null = null;
let searchIndexTimestamp: number = 0;
const SEARCH_INDEX_TTL = 5 * 60 * 1000; // 5 minutes

async function getSearchIndex() {
  const now = Date.now();
  
  if (searchIndexCache && (now - searchIndexTimestamp) < SEARCH_INDEX_TTL) {
    return searchIndexCache;
  }

  logger.info('🔄 Rebuilding keyword search index...');
  const products = await getAllProducts({ per_page: 100 });
  searchIndexCache = buildSearchIndex(products);
  searchIndexTimestamp = now;
  logger.info(`✅ Built search index with ${searchIndexCache.length} products`);
  
  return searchIndexCache;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const fuzzyMatch = searchParams.get('fuzzy') !== 'false'; // Default true
    const stemming = searchParams.get('stemming') !== 'false'; // Default true
    const minScore = parseFloat(searchParams.get('minScore') || '0.1');
    const getSuggestions = searchParams.get('suggestions') === 'true';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    logger.info(`🔤 Keyword search: "${query}"`);

    const searchIndex = await getSearchIndex();

    // Handle search suggestions
    if (getSuggestions) {
      const suggestions = getSearchSuggestions(query, searchIndex, 5);
      return NextResponse.json({
        success: true,
        query,
        suggestions,
        searchType: 'keyword_suggestions'
      });
    }

    // Perform keyword search
    const options: KeywordSearchOptions = {
      fuzzyMatch,
      stemming,
      minScore,
      boost: {
        title: 3.0,
        description: 1.0,
        categories: 2.0,
        tags: 1.5
      }
    };

    const results = keywordSearch(query, searchIndex, options);
    const limitedResults = results.slice(0, limit);

    // Transform results to match expected format
    const transformedResults = limitedResults.map(result => ({
      productId: result.productId,
      slug: result.slug,
      title: result.title,
      price: result.price,
      categories: result.categories,
      inStock: result.inStock,
      featured: result.featured,
      relevanceScore: result.score,
      matchedFields: result.matchedFields,
      matchedTerms: result.matchedTerms,
      searchMethod: 'keyword'
    }));

    return NextResponse.json({
      success: true,
      query,
      results: transformedResults,
      count: transformedResults.length,
      searchType: 'keyword',
      searchOptions: options,
      stats: {
        totalMatches: results.length,
        avgScore: results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0,
        topScore: results.length > 0 ? results[0]?.score || 0 : 0
      }
    });

  } catch (error) {
    logger.error('❌ Keyword search API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Keyword search failed', 
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
      options = {},
      filters = {},
      limit = 20 
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required in request body' },
        { status: 400 }
      );
    }

    logger.info(`🔤 Advanced keyword search: "${query}"`);
    logger.info('🎯 Options:', options);

    const searchIndex = await getSearchIndex();

    const searchOptions: KeywordSearchOptions = {
      fuzzyMatch: true,
      stemming: true,
      minScore: 0.1,
      boost: {
        title: 3.0,
        description: 1.0,
        categories: 2.0,
        tags: 1.5
      },
      ...options
    };

    let results = keywordSearch(query, searchIndex, searchOptions);

    // Apply filters
    if (filters.category) {
      results = results.filter(result => 
        result.categories.some(cat => cat.toLowerCase().includes(filters.category.toLowerCase()))
      );
    }

    if (filters.inStock === true) {
      results = results.filter(result => result.inStock);
    }

    if (filters.featured === true) {
      results = results.filter(result => result.featured);
    }

    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      results = results.filter(result => {
        const price = typeof result.price === 'number' ? result.price : 0;
        return price >= min && price <= max;
      });
    }

    const limitedResults = results.slice(0, limit);

    const transformedResults = limitedResults.map(result => ({
      productId: result.productId,
      slug: result.slug,
      title: result.title,
      price: result.price,
      categories: result.categories,
      inStock: result.inStock,
      featured: result.featured,
      relevanceScore: result.score,
      matchedFields: result.matchedFields,
      matchedTerms: result.matchedTerms,
      searchMethod: 'keyword'
    }));

    return NextResponse.json({
      success: true,
      query,
      options: searchOptions,
      filters,
      results: transformedResults,
      count: transformedResults.length,
      searchType: 'keyword_advanced',
      stats: {
        totalMatches: results.length,
        avgScore: results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0,
        topScore: results.length > 0 ? results[0]?.score || 0 : 0
      }
    });

  } catch (error) {
    logger.error('❌ Advanced keyword search API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Advanced keyword search failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}