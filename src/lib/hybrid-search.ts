// Hybrid Search Implementation - Combines Semantic and Keyword Search
import { searchByText } from './pinecone';
import { logger } from '@/lib/logger';
// Define specific interface for hybrid search analytics
interface HybridSearchAnalytics {
  query: string;
  mode: string;
  semanticResults: number;
  keywordResults: number;
  hybridResults: number;
  executionTime: number;
}

import { keywordSearch, buildSearchIndex, KeywordSearchResult, SearchIndex, KeywordSearchOptions } from './keyword-search';
import { getAllProducts } from './woocommerce';

export interface HybridSearchOptions {
  // Search mode configuration
  mode?: 'hybrid' | 'semantic_only' | 'keyword_only';
  
  // Weight configuration for hybrid mode (should sum to 1.0)
  semanticWeight?: number;
  keywordWeight?: number;
  
  // Result configuration
  maxResults?: number;
  minSemanticScore?: number;
  minKeywordScore?: number;
  
  // Filtering options
  category?: string;
  inStock?: boolean;
  featured?: boolean;
  priceRange?: { min: number; max: number };
  
  // Keyword search options
  keywordOptions?: KeywordSearchOptions;
  
  // Semantic search options
  semanticTopK?: number;
  includeMetadata?: boolean;
}

export interface HybridSearchResult {
  productId: number;
  slug: string;
  title: string;
  price: string;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  
  // Scoring information
  hybridScore: number;
  semanticScore?: number;
  keywordScore?: number;
  
  // Match information
  searchMethod: 'semantic' | 'keyword' | 'hybrid';
  matchedFields?: string[];
  matchedTerms?: string[];
  relevanceScore?: number; // For backwards compatibility
  
  // Additional metadata
  timestamp?: string;
  description?: string;
}

let searchIndexCache: SearchIndex[] | null = null;
let searchIndexTimestamp: number = 0;
const SEARCH_INDEX_TTL = 5 * 60 * 1000; // 5 minutes

// Build or refresh search index
async function getSearchIndex(): Promise<SearchIndex[]> {
  const now = Date.now();
  
  if (searchIndexCache && (now - searchIndexTimestamp) < SEARCH_INDEX_TTL) {
    return searchIndexCache;
  }

  logger.info('?? Rebuilding keyword search index...');
  const products = await getAllProducts({ per_page: 100 }); // Get more products for comprehensive search
  searchIndexCache = buildSearchIndex(products);
  searchIndexTimestamp = now;
  logger.info(`? Built search index with ${searchIndexCache.length} products`);
  
  return searchIndexCache;
}

// Main hybrid search function
export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {}
): Promise<{ results: HybridSearchResult[]; searchStats: HybridSearchAnalytics }> {
  const {
    mode = 'hybrid',
    semanticWeight = 0.6,
    keywordWeight = 0.4,
    maxResults = 20,
    minSemanticScore = 0.3,
    minKeywordScore = 0.1,
    semanticTopK = 50,
    includeMetadata = true,
    keywordOptions = {}
  } = options;

  logger.info(`?? Hybrid search: "${query}" (mode: ${mode})`);
  
  const searchStats = {
    query,
    mode,
    semanticResults: 0,
    keywordResults: 0,
    hybridResults: 0,
    executionTime: 0
  };

  const startTime = Date.now();
  let semanticResults: Array<{
    score?: number;
    metadata?: {
      productId?: number;
      slug?: string;
      title?: string;
      price?: string;
      categories?: string[];
      inStock?: boolean;
      featured?: boolean;
      timestamp?: string;
      description?: string;
    };
  }> = [];
  let keywordResults: KeywordSearchResult[] = [];

  try {
    // Execute searches based on mode
    if (mode === 'semantic_only' || mode === 'hybrid') {
      logger.info('  ?? Running semantic search...');
      
      // Build filter for semantic search
      const filter: Record<string, { $in?: string[]; $eq?: boolean }> = {};
      if (options.category) filter.categories = { $in: [options.category] };
      if (options.inStock === true) filter.inStock = { $eq: true };
      if (options.featured === true) filter.featured = { $eq: true };

      const semanticResponse = await searchByText(query, {
        topK: semanticTopK,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        includeMetadata: true,
        minScore: minSemanticScore,
      });

      if (semanticResponse.success && semanticResponse.matches) {
        semanticResults = semanticResponse.matches.filter((match) => match.score && match.score >= minSemanticScore);
        searchStats.semanticResults = semanticResults.length;
        logger.info(`    ? Found ${semanticResults.length} semantic matches`);
      }
    }

    if (mode === 'keyword_only' || mode === 'hybrid') {
      logger.info('  ?? Running keyword search...');
      const searchIndex = await getSearchIndex();
      
      keywordResults = keywordSearch(query, searchIndex, {
        minScore: minKeywordScore,
        ...keywordOptions
      });
      
      // Apply filters to keyword results
      keywordResults = applyFilters(keywordResults, options);
      
      searchStats.keywordResults = keywordResults.length;
      logger.info(`    ? Found ${keywordResults.length} keyword matches`);
    }

    // Merge and rank results based on mode
    let finalResults: HybridSearchResult[] = [];

    if (mode === 'semantic_only') {
      finalResults = semanticResults.map(result => ({
        productId: result.metadata?.productId ?? 0,
        slug: result.metadata?.slug ?? '',
        title: result.metadata?.title ?? 'Untitled Product',
        price: result.metadata?.price ?? '0',
        categories: result.metadata?.categories ?? [],
        inStock: result.metadata?.inStock ?? false,
        featured: result.metadata?.featured ?? false,
        hybridScore: result.score ?? 0,
        semanticScore: result.score,
        searchMethod: 'semantic' as const,
        relevanceScore: result.score,
        timestamp: result.metadata?.timestamp,
        description: result.metadata?.description
      })).filter(result => result.productId && result.productId > 0); // Filter out results without valid productId
    } else if (mode === 'keyword_only') {
      finalResults = keywordResults.map(result => ({
        productId: result.productId,
        slug: result.slug,
        title: result.title,
        price: result.price,
        categories: result.categories,
        inStock: result.inStock,
        featured: result.featured,
        hybridScore: result.score ?? 0,
        keywordScore: result.score,
        searchMethod: 'keyword' as const,
        matchedFields: result.matchedFields,
        matchedTerms: result.matchedTerms,
        relevanceScore: result.score
      }));
    } else {
      // Hybrid mode - merge and re-rank
      finalResults = mergeSearchResults(semanticResults, keywordResults, semanticWeight, keywordWeight);
    }

    // Sort by hybrid score and limit results
    finalResults.sort((a, b) => (b.hybridScore || 0) - (a.hybridScore || 0));
    finalResults = finalResults.slice(0, maxResults);

    searchStats.hybridResults = finalResults.length;
    searchStats.executionTime = Date.now() - startTime;

    logger.info(`  ? Hybrid search completed: ${finalResults.length} results in ${searchStats.executionTime}ms`);

    return {
      results: finalResults,
      searchStats
    };

  } catch (error) {
    logger.error('? Hybrid search failed:', error as Record<string, unknown>);
    throw error;
  }
}

// Define semantic result type for better type safety
type SemanticResult = {
  score?: number;
  metadata?: {
    productId?: number;
    slug?: string;
    title?: string;
    price?: string;
    categories?: string[];
    inStock?: boolean;
    featured?: boolean;
    timestamp?: string;
    description?: string;
  };
};

// Merge semantic and keyword results for hybrid ranking
function mergeSearchResults(
  semanticResults: SemanticResult[],
  keywordResults: KeywordSearchResult[],
  semanticWeight: number,
  keywordWeight: number
): HybridSearchResult[] {
  const resultMap = new Map<number, HybridSearchResult>();

  // Process semantic results
  for (const semantic of semanticResults) {
    const productId = semantic.metadata?.productId;
    if (!productId) continue;

    resultMap.set(productId, {
      productId,
      slug: semantic.metadata?.slug ?? '',
      title: semantic.metadata?.title ?? 'Untitled Product',
      price: semantic.metadata?.price ?? '0',
      categories: semantic.metadata?.categories ?? [],
      inStock: semantic.metadata?.inStock ?? false,
      featured: semantic.metadata?.featured ?? false,
      hybridScore: (semantic.score ?? 0) * semanticWeight,
      semanticScore: semantic.score,
      searchMethod: 'semantic' as const,
      relevanceScore: semantic.score,
      timestamp: semantic.metadata?.timestamp,
      description: semantic.metadata?.description
    });
  }

  // Process keyword results and merge with semantic
  for (const keyword of keywordResults) {
    const productId = keyword.productId;
    
    if (resultMap.has(productId)) {
      // Product found in both - create hybrid result
      const existing = resultMap.get(productId);
      if (!existing) continue;
      existing.hybridScore = (existing.semanticScore ?? 0) * semanticWeight + (keyword.score ?? 0) * keywordWeight;
      existing.keywordScore = keyword.score;
      existing.searchMethod = 'hybrid';
      existing.matchedFields = keyword.matchedFields;
      existing.matchedTerms = keyword.matchedTerms;
      existing.relevanceScore = existing.hybridScore;
    } else {
      // Keyword-only result
      resultMap.set(productId, {
        productId: keyword.productId,
        slug: keyword.slug,
        title: keyword.title,
        price: keyword.price,
        categories: keyword.categories,
        inStock: keyword.inStock,
        featured: keyword.featured,
        hybridScore: (keyword.score ?? 0) * keywordWeight,
        keywordScore: keyword.score,
        searchMethod: 'keyword' as const,
        matchedFields: keyword.matchedFields,
        matchedTerms: keyword.matchedTerms,
        relevanceScore: keyword.score
      });
    }
  }

  return Array.from(resultMap.values());
}

// Apply filters to keyword search results
function applyFilters(
  results: KeywordSearchResult[],
  options: HybridSearchOptions
): KeywordSearchResult[] {
  let filtered = results;

  if (options.category) {
    filtered = filtered.filter(result => 
      result.categories.some(cat => cat.toLowerCase().includes(options.category?.toLowerCase() ?? ''))
    );
  }

  if (options.inStock === true) {
    filtered = filtered.filter(result => result.inStock);
  }

  if (options.featured === true) {
    filtered = filtered.filter(result => result.featured);
  }

  if (options.priceRange) {
    const { min, max } = options.priceRange;
    filtered = filtered.filter(result => {
      const price = parseFloat(result.price);
      return !isNaN(price) && price >= min && price <= max;
    });
  }

  return filtered;
}

// A/B testing support for search algorithms
export async function runSearchExperiment(
  query: string,
  experiments: Array<{ name: string; options: HybridSearchOptions }>,
  maxResults: number = 10
): Promise<{
  experiments: Array<{
    name: string;
    results: HybridSearchResult[];
    stats: HybridSearchAnalytics;
  }>;
  comparison: {
    totalQuery: string;
    experiments: Array<{
      name: string;
      resultCount: number;
      avgScore: number;
      executionTime: number;
    }>;
  };
}> {
  const experimentResults = [];

  for (const experiment of experiments) {
    logger.info(`?? Running experiment: ${experiment.name}`);
    const { results, searchStats } = await hybridSearch(query, {
      ...experiment.options,
      maxResults
    });

    experimentResults.push({
      name: experiment.name,
      results,
      stats: searchStats
    });
  }

  // Simple comparison metrics
  const comparison = {
    totalQuery: query,
    experiments: experimentResults.map(exp => ({
      name: exp.name,
      resultCount: exp.results.length,
      avgScore: exp.results.length > 0 ? 
        exp.results.reduce((sum, r) => sum + (r.hybridScore ?? 0), 0) / exp.results.length : 0,
      executionTime: exp.stats.executionTime
    }))
  };

  return { experiments: experimentResults, comparison };
}

// Clear search index cache (useful for testing)
export function clearSearchIndexCache(): void {
  searchIndexCache = null;
  searchIndexTimestamp = 0;
  logger.info('??? Search index cache cleared');
}

