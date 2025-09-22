/**
 * Hybrid Search Module
 * Combines semantic search with keyword search for better results
 */

import { logger } from '@/lib/logger';
import { getAllProducts } from '@/lib/woocommerce';
import { WCProduct } from '@/types/woocommerce';

// Simple synonym mapping for query expansion
const SYNONYM_MAP: Record<string, string[]> = {
  'organic': ['natural', 'pure', 'chemical-free'],
  'fresh': ['farm-fresh', 'crisp', 'newly harvested'],
  'vegetable': ['veggie', 'produce', 'greens'],
  'fruit': ['produce', 'fresh fruit'],
  'tomato': ['tomatoes', 'cherry tomato'],
  'potato': ['potatoes', 'spud'],
  'carrot': ['carrots'],
  'apple': ['apples'],
  'banana': ['bananas'],
};

export interface HybridSearchResult {
  product: WCProduct;
  score: number;
  source: 'semantic' | 'keyword' | 'hybrid';
  explanation?: string;
}

export interface HybridSearchOptions {
  limit?: number;
  expandQuery?: boolean;
  category?: string;
  inStockOnly?: boolean;
}

/**
 * Expand query with synonyms
 */
function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(' ');
  const expanded = new Set<string>([query]);

  words.forEach(word => {
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].forEach(synonym => {
        expanded.add(query.replace(word, synonym));
      });
    }
  });

  return Array.from(expanded).slice(0, 3); // Limit to 3 queries
}

/**
 * Calculate relevance score for a product
 */
function calculateScore(product: WCProduct, query: string, semanticScore?: number): number {
  let score = 0;
  const queryLower = query.toLowerCase();

  // Name match (0-40 points)
  if (product.name.toLowerCase().includes(queryLower)) {
    score += 40;
  } else {
    const words = queryLower.split(' ');
    const matches = words.filter(w => product.name.toLowerCase().includes(w)).length;
    score += (matches / words.length) * 25;
  }

  // Description match (0-20 points)
  if (product.description?.toLowerCase().includes(queryLower)) {
    score += 20;
  } else if (product.short_description?.toLowerCase().includes(queryLower)) {
    score += 15;
  }

  // Semantic score (0-30 points)
  if (semanticScore) {
    score += semanticScore * 30;
  }

  // Popularity boost (0-10 points) - using average_rating as proxy
  if (product.average_rating && parseFloat(product.average_rating) > 4) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Perform hybrid search combining semantic and keyword search
 */
export async function performHybridSearch(
  query: string,
  options: HybridSearchOptions = {}
): Promise<HybridSearchResult[]> {
  try {
    const {
      limit = 20,
      expandQuery: shouldExpand = true,
      category
    } = options;

    const resultsMap = new Map<number, HybridSearchResult>();

    // 1. Try semantic search through the API
    try {
      const response = await fetch(`/api/search/semantic?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.results) {
          data.data.results.forEach((result: { product: WCProduct; score: number }) => {
            const score = calculateScore(result.product, query, result.score);
            resultsMap.set(result.product.id, {
              product: result.product,
              score,
              source: 'semantic',
              explanation: `Semantic match: ${(result.score * 100).toFixed(1)}%`
            });
          });
          logger.info(`✅ Semantic search found ${data.data.results.length} results`);
        }
      }
    } catch (error) {
      logger.warn('⚠️ Semantic search failed, continuing with keyword search', error as Record<string, unknown>);
    }

    // 2. Keyword search with query expansion
    const queries = shouldExpand ? expandQuery(query) : [query];

    for (const expandedQuery of queries) {
      try {
        const keywordResults = await getAllProducts({
          search: expandedQuery,
          per_page: 10,
          category
        });

        keywordResults.forEach((product: WCProduct) => {
          if (!resultsMap.has(product.id)) {
            const score = calculateScore(product, query);
            resultsMap.set(product.id, {
              product,
              score,
              source: 'keyword',
              explanation: `Keyword match: "${expandedQuery}"`
            });
          } else {
            // Boost score if found in both searches
            const existing = resultsMap.get(product.id);
            if (!existing) return;
            existing.score = Math.min(100, existing.score + 15);
            existing.source = 'hybrid';
            existing.explanation = 'Found in both semantic and keyword search';
          }
        });
      } catch (error) {
        logger.warn(`⚠️ Keyword search failed for query: ${expandedQuery}`, error as Record<string, unknown>);
      }
    }

    // Sort by score and limit results
    const results = Array.from(resultsMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    logger.info(`✅ Hybrid search completed: ${results.length} results returned`);

    return results;
  } catch (error) {
    logger.error('❌ Hybrid search error:', error as Record<string, unknown>);
    throw error;
  }
}

// Export a simplified function for other modules to avoid circular deps
export async function hybridSearch(
  query: string,
  options?: HybridSearchOptions
): Promise<{ results: HybridSearchResult[]; searchStats?: { totalResults: number; searchType: string } }> {
  const results = await performHybridSearch(query, options);
  return {
    results,
    searchStats: {
      totalResults: results.length,
      searchType: 'hybrid'
    }
  };
}