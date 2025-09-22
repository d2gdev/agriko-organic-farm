import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { improvedSearch, searchHealthProducts, searchSeasonalProducts } from '@/lib/improved-search';
import { hybridQdrantSearch, checkQdrantHealth } from '@/lib/qdrant';
import { checkEndpointRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { contextualSearch } from '@/lib/contextual-search';
import { trackSearchEvent } from '@/lib/search-quality-metrics';
import type { WCCategory, WCTag, WCImage } from '@/types/woocommerce';

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

    const query = searchParams.get('q') ?? '';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50);
    const category = searchParams.get('category') ?? undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true :
                    searchParams.get('inStock') === 'false' ? false : undefined;
    const searchType = searchParams.get('type') ?? 'general';

    if (!query.trim() && searchType === 'general') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = JSON.stringify({ q: query, limit, category, inStock, searchType });
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.body);
    }

    logger.info(`🔍 Semantic search for: "${query}" (type: ${searchType})`);

    let searchResults;

    // Try Qdrant first if available
    const qdrantHealthy = await checkQdrantHealth();

    // Generate a session ID for search tracking
    const sessionId = request.headers.get('x-session-id') ||
                      request.headers.get('x-forwarded-for') ||
                      `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (qdrantHealthy && searchType === 'general') {
      // Use enhanced contextual search for general queries
      try {
        const { results: contextualResults } = await contextualSearch(query, {
          sessionId,
          userId: searchParams.get('userId') || undefined,
          limit,
          category,
          inStockOnly: inStock,
          enablePersonalization: searchParams.get('personalization') !== 'false',
          enableSemanticClustering: true,
          enableIntentAnalysis: true
        });

        // Track search event for quality metrics
        trackSearchEvent({
          sessionId,
          query,
          searchType: 'semantic',
          results: contextualResults.slice(0, 10).map((result, index) => ({
            productId: result.product.id,
            position: index + 1,
            score: result.score,
            title: result.product.name,
            relevanceScore: result.score,
            personalizationBoost: result.personalizedScore
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

        searchResults = contextualResults.map(result => ({
          product: result.product,
          score: result.score,
          matchedTerms: (result as any).matchedTerms || ['semantic'],
          semanticRelevance: (result as any).semanticRelevance,
          personalizedScore: result.personalizedScore
        }));
      } catch (contextualError) {
        logger.warn('Contextual search failed, falling back to Qdrant:', contextualError as Record<string, unknown>);

        // Fallback to Qdrant hybrid search
        const qdrantResults = await hybridQdrantSearch(query, {
          limit,
          category,
          inStock,
          semanticWeight: 0.7
        });

        searchResults = qdrantResults.map(result => ({
          product: {
            id: result.id as number,
            slug: result.payload.slug,
            name: result.payload.name,
            price: String(result.payload.price),
            sale_price: result.payload.sale_price ? String(result.payload.sale_price) : '',
            categories: Array.isArray(result.payload.categories) ? result.payload.categories.map((c: string) => ({ name: c, slug: c })) : [],
            tags: Array.isArray(result.payload.tags) ? result.payload.tags.map((t: string) => ({ name: t, slug: t })) : [],
            in_stock: result.payload.in_stock,
            stock_status: result.payload.in_stock ? 'instock' : 'outofstock',
            featured: result.payload.featured,
            images: result.payload.image ? [{ src: result.payload.image }] : [],
            short_description: result.payload.short_description,
            average_rating: result.payload.average_rating,
            total_sales: result.payload.total_sales
          },
          score: result.score,
          matchedTerms: [result.matchType as string]
        }));
      }
    } else {
      // Fallback to improved text search
      switch (searchType) {
        case 'health':
          searchResults = await searchHealthProducts(query, limit);
          break;
        case 'seasonal':
          searchResults = await searchSeasonalProducts(limit);
          break;
        default:
          searchResults = await improvedSearch(query, {
            limit,
            category,
            inStock,
            sortBy: 'relevance'
          });
      }
    }

    // Format results for frontend
    const formattedResults = searchResults.map(result => ({
      productId: result.product.id,
      slug: result.product.slug,
      title: result.product.name,
      price: result.product.price,
      categories: result.product.categories?.map((c: string | { name: string }) => typeof c === 'string' ? c : c.name) ?? [],
      inStock: result.product.stock_status === 'instock',
      featured: result.product.featured,
      relevanceScore: result.score,
      matchedTerms: result.matchedTerms,
      image: result.product.images?.[0]?.src ?? '',
      shortDescription: typeof result.product.short_description === 'string' ? result.product.short_description.replace(/<[^>]*>/g, '').slice(0, 100) : '',
      timestamp: new Date().toISOString()
    }));

    const responseBody: SearchResultData = {
      success: true,
      query,
      results: formattedResults,
      count: formattedResults.length,
      searchType: searchType === 'general' ? 'semantic' : searchType,
      filters: { category, inStock },
      totalMatches: searchResults.length
    };

    // Cache the result
    getCache.set(cacheKey, {
      body: responseBody,
      expiresAt: Date.now() + GET_TTL_MS
    });

    // Clean old cache entries periodically
    if (Math.random() < 0.1) {
      const now = Date.now();
      for (const [key, entry] of getCache.entries()) {
        if (entry.expiresAt < now) {
          getCache.delete(key);
        }
      }
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    logger.error('Semantic search error:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rl = checkEndpointRateLimit(request, 'search');
    if (!rl.success) {
      return createRateLimitResponse(rl);
    }

    const body = await request.json();

    const {
      query = '',
      limit = 10,
      filters = {},
      searchType = 'general'
    } = body;

    const safeLimit = Math.min(limit, 50);

    logger.info(`🔍 POST semantic search: "${query}" (type: ${searchType})`);

    let searchResults;

    switch (searchType) {
      case 'health':
        searchResults = await searchHealthProducts(query, safeLimit);
        break;
      case 'seasonal':
        searchResults = await searchSeasonalProducts(safeLimit);
        break;
      default:
        searchResults = await improvedSearch(query, {
          limit: safeLimit,
          category: filters.category,
          inStock: filters.inStock,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          sortBy: filters.sortBy ?? 'relevance'
        });
    }

    // Format for response
    const formattedResults = searchResults.map(result => ({
      productId: result.product.id,
      slug: result.product.slug,
      title: result.product.name,
      price: result.product.price,
      salePrice: result.product.sale_price,
      categories: result.product.categories?.map((c: WCCategory) => c.name) ?? [],
      tags: result.product.tags?.map((t: WCTag) => t.name) ?? [],
      inStock: result.product.stock_status === 'instock',
      featured: result.product.featured,
      relevanceScore: result.score,
      matchedTerms: result.matchedTerms,
      image: result.product.images?.[0]?.src ?? '',
      gallery: result.product.images?.map((img: WCImage) => img.src) ?? [],
      shortDescription: result.product.short_description?.replace(/<[^>]*>/g, '').slice(0, 150),
      attributes: result.product.attributes,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      query,
      results: formattedResults,
      count: formattedResults.length,
      searchType,
      filters,
      suggestions: searchResults.length === 0 ?
        ['Try different keywords', 'Check spelling', 'Use more general terms'] :
        []
    });

  } catch (error) {
    logger.error('POST semantic search error:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}