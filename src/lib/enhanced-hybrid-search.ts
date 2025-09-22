// Enhanced Hybrid Search with Query Expansion and Re-ranking
import { logger } from './logger';
import { searchByText } from './qdrant';
import { keywordSearch, buildSearchIndex } from './keyword-search';
import { getAllProducts } from './woocommerce';
import { withSession } from './memgraph';
import { getCachedSearchResults } from './embedding-cache';
// import { generateQueryMultiVectorEmbedding, searchWithMultiVectors } from './multi-vector-embeddings';

export interface EnhancedSearchOptions {
  // Search configuration
  mode?: 'hybrid' | 'semantic' | 'keyword' | 'graph-enhanced';

  // Weights for different components
  semanticWeight?: number;
  keywordWeight?: number;
  graphWeight?: number;
  popularityWeight?: number;

  // Result configuration
  limit?: number;
  offset?: number;

  // Filtering
  categories?: string[];
  priceRange?: { min: number; max: number };
  inStock?: boolean;
  featured?: boolean;

  // Query expansion
  expandQuery?: boolean;
  expansionDepth?: number;

  // Re-ranking
  usePageRank?: boolean;
  usePersonalization?: boolean;
  userPreferences?: string[];

  // Faceting
  includeFacets?: boolean;
  facetFields?: string[];

  // Allow additional properties for serialization
  [key: string]: unknown;
}

export interface EnhancedSearchResult {
  productId: number;
  name: string;
  slug: string;
  price: number;
  description?: string;
  categories: string[];

  // Scoring
  finalScore: number;
  semanticScore?: number;
  keywordScore?: number;
  graphScore?: number;
  popularityScore?: number;

  // Metadata
  matchedTerms?: string[];
  expansionTerms?: string[];
  relationshipPath?: string[];
  explanation?: string;
}

export interface SearchFacets {
  categories: Array<{ name: string; count: number }>;
  priceRanges: Array<{ range: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  ratings: Array<{ rating: number; count: number }>;
}

/**
 * Expand query using graph relationships and synonyms
 */
async function expandQuery(
  query: string,
  _depth: number = 1
): Promise<{ original: string; expanded: string[]; synonyms: string[] }> {
  const expanded: string[] = [];
  const synonyms: string[] = [];

  // Synonym mapping for common terms
  const synonymMap: Record<string, string[]> = {
    'organic': ['natural', 'pure', 'bio', 'ecological'],
    'spice': ['seasoning', 'condiment', 'flavoring'],
    'herb': ['botanical', 'plant', 'medicinal plant'],
    'tea': ['infusion', 'brew', 'tisane', 'beverage'],
    'honey': ['nectar', 'sweetener', 'bee product'],
    'oil': ['extract', 'essence', 'fat'],
    'supplement': ['vitamin', 'mineral', 'nutrient', 'dietary supplement'],
    'health': ['wellness', 'wellbeing', 'vitality', 'fitness'],
    'energy': ['stamina', 'vigor', 'vitality', 'strength'],
    'immune': ['immunity', 'defense', 'resistance', 'protection'],
  };

  // Extract keywords from query
  const keywords = query.toLowerCase().split(/\s+/);

  // Add synonyms
  for (const keyword of keywords) {
    if (synonymMap[keyword]) {
      synonyms.push(...synonymMap[keyword]);
    }
  }

  // Use graph to find related concepts
  try {
    const graphExpansion = await withSession(
      async (session) => {
        const result = await session.run(`
          MATCH (c:Category)
          WHERE toLower(c.name) CONTAINS $query
          MATCH (c)<-[:BELONGS_TO]-(p:Product)-[:BELONGS_TO]->(related:Category)
          RETURN DISTINCT related.name as relatedCategory
          LIMIT 5
        `, { query: query.toLowerCase() });

        return result.records.map((r: unknown) => (r as { get: (key: string) => string }).get('relatedCategory'));
      },
      async () => []
    );

    expanded.push(...graphExpansion);
  } catch (error) {
    logger.error('Query expansion failed:', error as Record<string, unknown>);
  }

  return {
    original: query,
    expanded,
    synonyms,
  };
}

/**
 * Calculate graph-based relevance score
 */
async function calculateGraphScore(
  productId: number,
  queryTerms: string[]
): Promise<number> {
  try {
    return await withSession(
      async (session) => {
        // Check how many query terms match the product's graph neighborhood
        const result = await session.run(`
          MATCH (p:Product {id: $productId})
          OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category)
          OPTIONAL MATCH (p)-[:PROVIDES]->(b:HealthBenefit)
          OPTIONAL MATCH (p)-[:SAME_BRAND]->(brand:Brand)
          WITH p,
               COLLECT(DISTINCT toLower(c.name)) as categories,
               COLLECT(DISTINCT toLower(b.name)) as benefits,
               COLLECT(DISTINCT toLower(brand.name)) as brands
          RETURN p.pageRank as pageRank,
                 categories,
                 benefits,
                 brands
        `, { productId });

        if (result.records.length === 0) return 0;

        const record = result.records[0];
        if (!record) return 0;

        const pageRank = record.get('pageRank') || 0;
        const categories = record.get('categories') || [];
        const benefits = record.get('benefits') || [];
        const brands = record.get('brands') || [];

        // Calculate match score
        let matchCount = 0;
        const allTerms = [...categories, ...benefits, ...brands];

        for (const term of queryTerms) {
          if (allTerms.some(t => t.includes(term.toLowerCase()))) {
            matchCount++;
          }
        }

        // Combine match score with PageRank
        const matchScore = matchCount / Math.max(queryTerms.length, 1);
        return (matchScore * 0.7) + (pageRank * 0.3);
      },
      async () => 0
    );
  } catch (error) {
    logger.error('Graph score calculation failed:', error as Record<string, unknown>);
    return 0;
  }
}

/**
 * Re-rank results using multiple signals
 */
interface BaseSearchResult {
  productId: number;
  name?: string;
  title?: string;
  slug: string;
  price: number;
  description?: string;
  categories?: string[];
  semanticScore?: number;
  keywordScore?: number;
  matchedTerms?: string[];
  [key: string]: unknown;
}

async function reRankResults(
  results: BaseSearchResult[],
  options: EnhancedSearchOptions,
  queryTerms: string[]
): Promise<EnhancedSearchResult[]> {
  const {
    semanticWeight = 0.4,
    keywordWeight = 0.2,
    graphWeight = 0.2,
    popularityWeight = 0.2,
    usePageRank: _usePageRank = true,
  } = options;
  void _usePageRank; // Preserved for future PageRank implementation

  const enhancedResults: EnhancedSearchResult[] = [];

  for (const result of results) {
    // Get graph score
    const graphScore = await calculateGraphScore(result.productId, queryTerms);

    // Get popularity score (from ratings, reviews, sales)
    const popularityScore = calculatePopularityScore(result);

    // Calculate final score
    const scores = {
      semantic: result.semanticScore || 0,
      keyword: result.keywordScore || 0,
      graph: graphScore,
      popularity: popularityScore,
    };

    const finalScore =
      scores.semantic * semanticWeight +
      scores.keyword * keywordWeight +
      scores.graph * graphWeight +
      scores.popularity * popularityWeight;

    enhancedResults.push({
      productId: result.productId,
      name: result.name || result.title || 'Unknown Product',
      slug: result.slug,
      price: result.price,
      description: result.description,
      categories: result.categories || [],
      finalScore,
      semanticScore: scores.semantic,
      keywordScore: scores.keyword,
      graphScore: scores.graph,
      popularityScore: scores.popularity,
      matchedTerms: result.matchedTerms,
      explanation: generateExplanation(scores, result),
    });
  }

  // Sort by final score
  enhancedResults.sort((a, b) => b.finalScore - a.finalScore);

  return enhancedResults;
}

/**
 * Generate facets from search results
 */
function generateFacets(results: EnhancedSearchResult[]): SearchFacets {
  const categoryCount = new Map<string, number>();
  const priceRanges = new Map<string, number>();
  const brandCount = new Map<string, number>();
  const ratingCount = new Map<number, number>();

  for (const result of results) {
    // Count categories
    for (const category of result.categories) {
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    }

    // Count price ranges
    const priceRange = getPriceRange(result.price);
    priceRanges.set(priceRange, (priceRanges.get(priceRange) || 0) + 1);
  }

  return {
    categories: Array.from(categoryCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    priceRanges: Array.from(priceRanges.entries())
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => a.range.localeCompare(b.range)),
    brands: Array.from(brandCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    ratings: Array.from(ratingCount.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => b.rating - a.rating),
  };
}

/**
 * Main enhanced hybrid search function
 */
export async function enhancedHybridSearch(
  query: string,
  options: EnhancedSearchOptions = {}
): Promise<{
  results: EnhancedSearchResult[];
  facets?: SearchFacets;
  totalCount: number;
  executionTime: number;
  queryExpansion?: {
    original: string;
    expanded: string[];
    synonyms: string[];
  };
}> {
  const startTime = Date.now();

  try {
    // Try to get cached results first
    const _cacheKey = `enhanced:${query}:${JSON.stringify(options)}`;
    void _cacheKey; // Preserved for future caching implementation
    const cached = await getCachedSearchResults<EnhancedSearchResult>(
      query,
      options,
      async () => {
        const searchResult = await performSearch(query, options);
        return searchResult.results;
      }
    );

    if (cached && cached.length > 0) {
      return {
        results: cached,
        totalCount: cached.length,
        executionTime: Date.now() - startTime,
      };
    }

    return await performSearch(query, options);
  } catch (error) {
    logger.error('Enhanced hybrid search failed:', error as Record<string, unknown>);
    return {
      results: [],
      totalCount: 0,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Perform the actual search
 */
async function performSearch(
  query: string,
  options: EnhancedSearchOptions
): Promise<{
  results: EnhancedSearchResult[];
  facets?: SearchFacets;
  totalCount: number;
  executionTime: number;
  queryExpansion?: {
    original: string;
    expanded: string[];
    synonyms: string[];
  };
}> {
  const startTime = Date.now();

  // Query expansion
  let queryExpansion;
  let expandedQuery = query;

  if (options.expandQuery) {
    queryExpansion = await expandQuery(query, options.expansionDepth);
    expandedQuery = [
      query,
      ...queryExpansion.expanded,
      ...queryExpansion.synonyms,
    ].join(' ');

    logger.info(`Query expanded from "${query}" to "${expandedQuery}"`);
  }

  // Perform multi-modal search
  const [semanticResults, keywordResults] = await Promise.all([
    // Semantic search with multi-vector
    searchByText(expandedQuery, {
      limit: options.limit ? options.limit * 2 : 50,
      category: options.categories?.[0],
      inStock: options.inStock,
      minPrice: options.priceRange?.min,
      maxPrice: options.priceRange?.max,
    }),

    // Keyword search
    (async () => {
      const products = await getAllProducts({ per_page: 100 });
      const index = buildSearchIndex(products);
      const keywordResults = keywordSearch(expandedQuery, index, {});
      // Limit results manually since KeywordSearchOptions doesn't have a limit
      return keywordResults.slice(0, options.limit || 20);
    })(),
  ]);

  // Merge results
  const mergedResults = mergeSearchResults(
    semanticResults as unknown as Record<string, unknown>[],
    keywordResults as unknown as Record<string, unknown>[]
  );

  // Re-rank with graph and popularity signals
  const queryTerms = expandedQuery.toLowerCase().split(/\s+/);
  const reRankedResults = await reRankResults(mergedResults, options, queryTerms);

  // Apply pagination
  const paginatedResults = reRankedResults.slice(
    options.offset || 0,
    (options.offset || 0) + (options.limit || 20)
  );

  // Generate facets if requested
  let facets;
  if (options.includeFacets) {
    facets = generateFacets(reRankedResults);
  }

  return {
    results: paginatedResults,
    facets,
    totalCount: reRankedResults.length,
    executionTime: Date.now() - startTime,
    queryExpansion,
  };
}

// Helper functions

function mergeSearchResults(semanticResults: Record<string, unknown>[], keywordResults: Record<string, unknown>[]): BaseSearchResult[] {
  const merged = new Map<number, BaseSearchResult>();

  // Add semantic results
  for (const result of semanticResults) {
    const payload = result.payload as Record<string, unknown> | undefined;
    const productId = payload?.productId || result.id;
    if (productId) {
      merged.set(productId as number, {
        ...result,
        productId,
        semanticScore: result.score || 0,
      } as BaseSearchResult);
    }
  }

  // Merge keyword results
  for (const result of keywordResults) {
    const existing = merged.get(result.productId as number);
    if (existing) {
      existing.keywordScore = (result.score as number) || 0;
      existing.matchedTerms = (result.matchedTerms as string[]) || [];
    } else {
      merged.set(result.productId as number, {
        ...result,
        keywordScore: result.score || 0,
      } as BaseSearchResult);
    }
  }

  return Array.from(merged.values());
}

function calculatePopularityScore(product: Record<string, unknown>): number {
  const rating = (product.averageRating as number) || 0;
  const reviewCount = (product.reviewCount as number) || 0;
  const featured = product.featured ? 1 : 0;

  // Logarithmic scaling for review count
  const reviewScore = Math.log10(reviewCount + 1) / 3;

  return (rating / 5) * 0.5 + reviewScore * 0.3 + featured * 0.2;
}

function getPriceRange(price: number): string {
  if (price < 10) return '$0-10';
  if (price < 25) return '$10-25';
  if (price < 50) return '$25-50';
  if (price < 100) return '$50-100';
  return '$100+';
}

function generateExplanation(scores: Record<string, unknown>, result: Record<string, unknown>): string {
  const explanations: string[] = [];

  if ((scores.semantic as number) > 0.7) {
    explanations.push('High semantic relevance');
  }

  if ((scores.keyword as number) > 0.5) {
    const matchedTerms = result.matchedTerms as string[] | undefined;
    explanations.push(`Matched keywords: ${matchedTerms?.join(', ')}`);
  }

  if ((scores.graph as number) > 0.6) {
    explanations.push('Strong graph connections');
  }

  if ((scores.popularity as number) > 0.8) {
    explanations.push('Popular product');
  }

  return explanations.join('; ');
}

/**
 * Personalized search with user preferences
 */
export async function personalizedSearch(
  query: string,
  userId: string,
  options: EnhancedSearchOptions = {}
): Promise<{
  results: EnhancedSearchResult[];
  facets?: SearchFacets;
  totalCount: number;
}> {
  // Get user preferences from graph
  const userPreferences = await getUserPreferences(userId);

  // Add user preferences to search options
  const personalizedOptions: EnhancedSearchOptions = {
    ...options,
    usePersonalization: true,
    userPreferences,
  };

  return enhancedHybridSearch(query, personalizedOptions);
}

async function getUserPreferences(userId: string): Promise<string[]> {
  try {
    return await withSession(
      async (session) => {
        const result = await session.run(`
          MATCH (u:Customer {id: $userId})-[:PURCHASED]->(o:Order)-[:CONTAINS]->(p:Product)
          MATCH (p)-[:BELONGS_TO]->(c:Category)
          RETURN DISTINCT c.name as category
          LIMIT 10
        `, { userId });

        return result.records.map((r: unknown) => (r as { get: (key: string) => string }).get('category'));
      },
      async () => []
    );
  } catch (error) {
    logger.error('Failed to get user preferences:', error as Record<string, unknown>);
    return [];
  }
}