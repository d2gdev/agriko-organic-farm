import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { searchByText } from '@/lib/pinecone';
import { semanticSearchApiSchema, semanticSearchBodySchema } from '@/lib/validation';
import { checkEndpointRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

// Simple in-memory cache for GET queries (short TTL)
interface SearchResultData {
  success: boolean;
  query: string;
  results: Array<Record<string, unknown>>;
  count: number;
  searchType: string;
  filters?: Record<string, unknown>;
  totalMatches?: number;
}

type CacheEntry = { body: SearchResultData; expiresAt: number };
const getCache = new Map<string, CacheEntry>();
const GET_TTL_MS = 10_000; // 10 seconds

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for search endpoints
    const rl = checkEndpointRateLimit(request, 'search');
    if (!rl.success) {
      return createRateLimitResponse(rl);
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const rawParams = {
      q: searchParams.get('q'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit') ?? '10') : 10,
      category: searchParams.get('category'),
      inStock: searchParams.get('inStock') === 'true' ? true : searchParams.get('inStock') === 'false' ? false : undefined,
      minScore: searchParams.get('minScore') ? parseFloat(searchParams.get('minScore') ?? '0.3') : 0.3
    };

    // Validate with Zod schema
    const validation = semanticSearchApiSchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters', 
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const { q: query, limit, category, inStock, minScore } = validation.data;

    // Apply an explicit upper bound even after validation
    const safeLimit = Math.min(limit, 50);

    // Check cache
    const cacheKey = JSON.stringify({ q: query, limit: safeLimit, category, inStock, minScore });
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.body);
    }

    // Build filter for search
    const filter: Record<string, unknown> = {};
    
    if (category) {
      filter.categories = { $in: [category] };
    }
    
    if (inStock === true) {
      filter.inStock = { $eq: true };
    }

    logger.info(`🔍 Semantic search for: "${query}" (threshold: ${minScore})`);
    
    const results = await searchByText(query, {
      topK: safeLimit,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      includeMetadata: true,
      minScore,
    });

    if (!results.success) {
      return NextResponse.json(
        { error: 'Search failed', details: results.error },
        { status: 500 }
      );
    }

    // Check if we have matches before accessing them
    if (!results.matches || results.matches.length === 0) {
      const body = {
        success: true,
        query,
        results: [],
        count: 0,
        totalMatches: 0,
        searchType: 'semantic',
      };
      getCache.set(cacheKey, { body, expiresAt: Date.now() + GET_TTL_MS });
      return NextResponse.json(body);
    }

    // Transform results for frontend
    const products = results.matches.map((match: { metadata?: Record<string, unknown>; score?: number }) => ({
      productId: match.metadata?.productId,
      slug: match.metadata?.slug,
      title: match.metadata?.title || 'Untitled Product',
      price: match.metadata?.price,
      categories: match.metadata?.categories || [],
      inStock: match.metadata?.inStock || false,
      featured: match.metadata?.featured || false,
      relevanceScore: match.score || 0,
      timestamp: match.metadata?.timestamp,
    }));

    const body = {
      success: true,
      query,
      results: products,
      count: products.length,
      totalMatches: results.matches.length,
      searchType: 'semantic',
    };
    getCache.set(cacheKey, { body, expiresAt: Date.now() + GET_TTL_MS });
    return NextResponse.json(body);

  } catch (error) {
    logger.error('❌ Semantic search API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for search endpoints
    const rl = checkEndpointRateLimit(request, 'search');
    if (!rl.success) {
      return createRateLimitResponse(rl);
    }

    const body = await request.json();
    const validation = semanticSearchBodySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const { query, filters, minScore = 0.3 } = validation.data;
    const safeLimit = Math.min(validation.data.limit ?? 10, 50);

    logger.info(`🔍 Advanced semantic search for: "${query}" (threshold: ${minScore})`);

    // Build allowlisted Pinecone filter
    const pineconeFilter: Record<string, unknown> = {};
    if (filters?.categories && filters.categories.length > 0) {
      pineconeFilter.categories = { $in: filters.categories };
    }
    if (filters?.inStock === true) {
      pineconeFilter.inStock = { $eq: true };
    }
    if (filters?.featured === true) {
      pineconeFilter.featured = { $eq: true };
    }
    if (filters?.priceRange && (filters.priceRange.min != null || filters.priceRange.max != null)) {
      const priceCond: Record<string, number> = {};
      if (filters.priceRange.min != null) priceCond.$gte = filters.priceRange.min;
      if (filters.priceRange.max != null) priceCond.$lte = filters.priceRange.max;
      pineconeFilter.price = priceCond;
    }

    const results = await searchByText(query, {
      topK: safeLimit,
      filter: Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
      includeMetadata: true,
      minScore,
    });

    if (!results.success) {
      return NextResponse.json(
        { error: 'Search failed', details: results.error },
        { status: 500 }
      );
    }

    // Check if we have matches before accessing them
    if (!results.matches || results.matches.length === 0) {
      return NextResponse.json({
        success: true,
        query,
        filters,
        results: [],
        count: 0,
        totalMatches: 0,
        searchType: 'semantic_advanced',
      });
    }

    const products = results.matches.map((match: { metadata?: Record<string, unknown>; score?: number }) => ({
      productId: match.metadata?.productId,
      slug: match.metadata?.slug,
      title: match.metadata?.title || 'Untitled Product',
      price: match.metadata?.price,
      categories: match.metadata?.categories || [],
      inStock: match.metadata?.inStock || false,
      featured: match.metadata?.featured || false,
      relevanceScore: match.score || 0,
      timestamp: match.metadata?.timestamp,
    }));

    return NextResponse.json({
      success: true,
      query,
      filters,
      results: products,
      count: products.length,
      totalMatches: results.matches.length,
      searchType: 'semantic_advanced',
    });

  } catch (error) {
    logger.error('❌ Advanced semantic search API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
