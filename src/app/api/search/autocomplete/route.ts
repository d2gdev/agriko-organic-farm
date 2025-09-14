// Search Autocomplete API - Provides intelligent search suggestions
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { getAllProducts } from '@/lib/woocommerce';
import { extractHealthKeywords } from '@/lib/embeddings';
import { expandSearchQuery, getSeasonalBoost } from '@/lib/search-analytics';
import { autocompleteCache, generateAutocompleteCacheKey, queryOptimizer } from '@/lib/search-cache';

interface AutocompleteSuggestion {
  id: string;
  type: 'product' | 'category' | 'query' | 'health_benefit' | 'brand';
  text: string;
  description?: string;
  icon?: string;
  score: number;
  trending?: boolean;
  count?: number;
}

// Popular search queries from analytics (would come from real analytics in production)
const popularQueries = [
  { text: 'organic turmeric powder', count: 156, trending: true },
  { text: 'natural honey sweetener', count: 143, trending: true },
  { text: 'moringa superfood benefits', count: 128, trending: false },
  { text: 'black rice antioxidants', count: 112, trending: true },
  { text: 'ginger tea inflammation', count: 98, trending: false },
  { text: 'coconut oil cooking', count: 87, trending: false },
  { text: 'organic brown rice', count: 76, trending: false },
  { text: 'herbal tea blends', count: 65, trending: false }
];

// Health benefit keywords with descriptions
const healthBenefits = [
  { text: 'anti-inflammatory', description: 'Helps reduce inflammation', icon: '🩹' },
  { text: 'immune support', description: 'Boosts immune system', icon: '🛡️' },
  { text: 'digestive health', description: 'Improves digestion', icon: '🫄' },
  { text: 'heart health', description: 'Supports cardiovascular health', icon: '❤️' },
  { text: 'energy boost', description: 'Increases energy levels', icon: '⚡' },
  { text: 'brain health', description: 'Enhances cognitive function', icon: '🧠' },
  { text: 'weight management', description: 'Helps maintain healthy weight', icon: '⚖️' },
  { text: 'antioxidant rich', description: 'High in antioxidants', icon: '🌿' },
  { text: 'blood sugar control', description: 'Helps regulate blood sugar', icon: '📊' },
  { text: 'skin health', description: 'Promotes healthy skin', icon: '✨' },
  { text: 'bone health', description: 'Strengthens bones', icon: '🦴' },
  { text: 'respiratory health', description: 'Supports lung function', icon: '🫁' }
];

// Common product categories with counts
const categories = [
  { text: 'organic spices', count: 45, icon: '🌶️' },
  { text: 'natural honey', count: 12, icon: '🍯' },
  { text: 'herbal teas', count: 28, icon: '🫖' },
  { text: 'superfood powders', count: 16, icon: '🥄' },
  { text: 'organic rice', count: 8, icon: '🍚' },
  { text: 'medicinal herbs', count: 34, icon: '🌿' },
  { text: 'coconut products', count: 19, icon: '🥥' },
  { text: 'traditional remedies', count: 23, icon: '💊' }
];

// Cache for product-based suggestions
let productSuggestionsCache: AutocompleteSuggestion[] | null = null;
let productCacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '8');
    const includeProducts = searchParams.get('products') !== 'false';
    const includeCategories = searchParams.get('categories') !== 'false';
    const includeQueries = searchParams.get('queries') !== 'false';
    const includeHealthBenefits = searchParams.get('health') !== 'false';

    logger.info(`🔍 Autocomplete request: "${query}" (limit: ${limit})`);

    // Check cache first
    const cacheKey = generateAutocompleteCacheKey(query, { limit, includeProducts, includeCategories, includeQueries, includeHealthBenefits });
    const cachedResult = autocompleteCache.get(cacheKey);
    
    if (cachedResult) {
      logger.info(`  ✅ Cache hit for autocomplete: "${query}"`);
      return NextResponse.json(cachedResult);
    }

    if (!query || query.length < 1) {
      // Return trending suggestions when no query
      const trendingSuggestions = getTrendingSuggestions(limit);
      const result = {
        success: true,
        query: '',
        suggestions: trendingSuggestions,
        timestamp: Date.now()
      };
      
      // Cache trending suggestions for 5 minutes
      autocompleteCache.set(cacheKey, result, 5 * 60 * 1000);
      return NextResponse.json(result);
    }

    // Optimize the query
    const { optimized, suggestions: querySuggestions } = queryOptimizer.optimizeQuery(query);
    logger.info(`  🔧 Query optimized: "${query}" -> "${optimized}"`);
    
    // Use optimized query for search
    const searchQuery = optimized || query;

    const suggestions: AutocompleteSuggestion[] = [];

    // 1. Health benefit suggestions
    if (includeHealthBenefits) {
      const healthSuggestions = getHealthBenefitSuggestions(searchQuery);
      suggestions.push(...healthSuggestions);
    }

    // 2. Category suggestions
    if (includeCategories) {
      const categorySuggestions = getCategorySuggestions(searchQuery);
      suggestions.push(...categorySuggestions);
    }

    // 3. Popular query suggestions
    if (includeQueries) {
      const queryBasedSuggestions = getQuerySuggestions(searchQuery);
      suggestions.push(...queryBasedSuggestions);
      
      // Add query optimization suggestions
      querySuggestions.forEach((suggestion, index) => {
        suggestions.push({
          id: `opt-${index}`,
          type: 'query',
          text: suggestion,
          description: 'Optimized suggestion',
          score: 0.8
        });
      });
    }

    // 4. Product-based suggestions
    if (includeProducts) {
      const productSuggestions = await getProductSuggestions(searchQuery);
      suggestions.push(...productSuggestions);
    }

    // Apply seasonal boosting
    suggestions.forEach(suggestion => {
      const seasonalBoost = getSeasonalBoost(suggestion.text);
      suggestion.score *= seasonalBoost;
    });

    // Sort by score and relevance, then limit results
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // Prioritize exact matches and high scores
        const aExact = a.text.toLowerCase().startsWith(query) ? 1 : 0;
        const bExact = b.text.toLowerCase().startsWith(query) ? 1 : 0;
        
        if (aExact !== bExact) return bExact - aExact;
        return b.score - a.score;
      })
      .slice(0, limit);

    // Remove duplicate texts
    const uniqueSuggestions = sortedSuggestions.filter((suggestion, index, arr) => 
      arr.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase()) === index
    );

    logger.info(`  ✅ Generated ${uniqueSuggestions.length} autocomplete suggestions`);

    const result = {
      success: true,
      query,
      originalQuery: query,
      optimizedQuery: searchQuery,
      suggestions: uniqueSuggestions,
      timestamp: Date.now()
    };

    // Cache the result for 10 minutes
    autocompleteCache.set(cacheKey, result, 10 * 60 * 1000);

    return NextResponse.json(result);

  } catch (error) {
    logger.error('❌ Autocomplete API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Autocomplete failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Get trending suggestions for empty queries
function getTrendingSuggestions(limit: number): AutocompleteSuggestion[] {
  const trending: AutocompleteSuggestion[] = [
    {
      id: 'trend-1',
      type: 'query',
      text: 'turmeric for inflammation',
      description: 'Popular health search',
      icon: '🔥',
      score: 1.0,
      trending: true
    },
    {
      id: 'trend-2',
      type: 'query', 
      text: 'organic honey natural sweetener',
      description: 'Trending this week',
      icon: '📈',
      score: 0.9,
      trending: true
    },
    {
      id: 'trend-3',
      type: 'category',
      text: 'superfood powders',
      description: 'Popular category',
      icon: '⭐',
      score: 0.8,
      count: 16
    },
    {
      id: 'trend-4',
      type: 'health_benefit',
      text: 'immune support',
      description: 'Health trend',
      icon: '🛡️',
      score: 0.7
    }
  ];

  return trending.slice(0, limit);
}

// Get health benefit suggestions
function getHealthBenefitSuggestions(query: string): AutocompleteSuggestion[] {
  return healthBenefits
    .filter(benefit => 
      benefit.text.toLowerCase().includes(query) ||
      benefit.description.toLowerCase().includes(query)
    )
    .map((benefit, index) => ({
      id: `health-${index}`,
      type: 'health_benefit' as const,
      text: benefit.text,
      description: benefit.description,
      icon: benefit.icon,
      score: calculateMatchScore(benefit.text, query) + 0.1 // Slight boost for health benefits
    }));
}

// Get category suggestions
function getCategorySuggestions(query: string): AutocompleteSuggestion[] {
  return categories
    .filter(category => category.text.toLowerCase().includes(query))
    .map((category, index) => ({
      id: `cat-${index}`,
      type: 'category' as const,
      text: category.text,
      icon: category.icon,
      count: category.count,
      score: calculateMatchScore(category.text, query) + 0.05 // Small boost for categories
    }));
}

// Get popular query suggestions
function getQuerySuggestions(query: string): AutocompleteSuggestion[] {
  return popularQueries
    .filter(pq => pq.text.toLowerCase().includes(query))
    .map((pq, index) => ({
      id: `query-${index}`,
      type: 'query' as const,
      text: pq.text,
      description: `${pq.count} searches`,
      trending: pq.trending,
      score: calculateMatchScore(pq.text, query) + (pq.trending ? 0.2 : 0)
    }));
}

// Get product-based suggestions from WooCommerce
async function getProductSuggestions(query: string): Promise<AutocompleteSuggestion[]> {
  try {
    // Check cache first
    if (!productSuggestionsCache || (Date.now() - productCacheTimestamp) > CACHE_TTL) {
      await refreshProductSuggestionsCache();
    }

    if (!productSuggestionsCache) return [];

    // Filter cached suggestions based on query
    return productSuggestionsCache
      .filter(suggestion => 
        suggestion.text.toLowerCase().includes(query) ||
        (suggestion.description?.toLowerCase().includes(query))
      )
      .map(suggestion => ({
        ...suggestion,
        score: calculateMatchScore(suggestion.text, query)
      }))
      .slice(0, 3); // Limit product suggestions

  } catch (error) {
    logger.error('Failed to get product suggestions:', error as Record<string, unknown>);
    return [];
  }
}

// Refresh product suggestions cache
async function refreshProductSuggestionsCache(): Promise<void> {
  try {
    logger.info('🔄 Refreshing product suggestions cache...');
    const products = await getAllProducts({ per_page: 50 });
    
    productSuggestionsCache = products.map((product, index) => ({
      id: `prod-${product.id}`,
      type: 'product' as const,
      text: product.name,
      description: `₱${product.price}`,
      icon: '🛍️',
      score: 0.5 // Base score for products
    }));

    // Add brand suggestions from products
    const brands = new Set<string>();
    products.forEach(product => {
      // Extract brand from product name (simplified)
      const nameParts = product.name.split(' ');
      if (nameParts.length > 1 && nameParts[0]) {
        brands.add(nameParts[0]);
      }
    });

    brands.forEach((brand, index) => {
      if (productSuggestionsCache) {
        productSuggestionsCache.push({
          id: `brand-${index}`,
          type: 'brand',
          text: brand,
          description: 'Brand',
          icon: '🏷️',
          score: 0.3
        });
      }
    });

    productCacheTimestamp = Date.now();
    logger.info(`✅ Cached ${productSuggestionsCache.length} product suggestions`);

  } catch (error) {
    logger.error('Failed to refresh product cache:', error as Record<string, unknown>);
    productSuggestionsCache = [];
  }
}

// Calculate match score based on string similarity
function calculateMatchScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText === lowerQuery) return 1.0;
  if (lowerText.startsWith(lowerQuery)) return 0.9;
  if (lowerText.includes(lowerQuery)) return 0.7;

  // Calculate word-based similarity
  const textWords = lowerText.split(/\s+/);
  const queryWords = lowerQuery.split(/\s+/);
  
  let matchingWords = 0;
  for (const queryWord of queryWords) {
    if (textWords.some(textWord => textWord.includes(queryWord) || queryWord.includes(textWord))) {
      matchingWords++;
    }
  }

  return queryWords.length > 0 ? (matchingWords / queryWords.length) * 0.6 : 0;
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}