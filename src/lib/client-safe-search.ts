// Client-safe search wrapper that prevents worker spawning
// This module can be safely imported on the client side

export interface SearchResult {
  productId: number;
  slug: string;
  title: string;
  price: string;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  relevanceScore: number;
  matchedTerms: string[];
  image: string;
  shortDescription: string;
  timestamp: string;
}

export interface SearchOptions {
  limit?: number;
  category?: string;
  inStockOnly?: boolean;
  enablePersonalization?: boolean;
  sessionId?: string;
  userId?: string;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  count: number;
  searchType: string;
  qualityMetrics?: any;
  contextualInsights?: any;
}

/**
 * Client-safe search function that uses fetch to call API routes
 * This prevents any worker processes from being spawned on the client
 */
export async function performClientSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  try {
    const searchParams = new URLSearchParams({
      q: query,
      limit: String(options.limit || 20),
      ...(options.category && { category: options.category }),
      ...(options.inStockOnly !== undefined && { inStock: String(options.inStockOnly) }),
      ...(options.enablePersonalization !== undefined && { personalization: String(options.enablePersonalization) }),
      ...(options.sessionId && { sessionId: options.sessionId }),
      ...(options.userId && { userId: options.userId })
    });

    const response = await fetch(`/api/search/contextual?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Client search error:', error);
    return {
      success: false,
      query,
      results: [],
      count: 0,
      searchType: 'client_error',
    };
  }
}

/**
 * Client-safe semantic search with fallback
 */
export async function performSemanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  try {
    const searchParams = new URLSearchParams({
      q: query,
      limit: String(options.limit || 20),
      ...(options.category && { category: options.category }),
      ...(options.inStockOnly !== undefined && { inStock: String(options.inStockOnly) }),
    });

    const response = await fetch(`/api/search/semantic?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Semantic search failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Client semantic search error:', error);
    return {
      success: false,
      query,
      results: [],
      count: 0,
      searchType: 'semantic_error',
    };
  }
}

/**
 * Client-safe hybrid search
 */
export async function performHybridClientSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  try {
    const searchParams = new URLSearchParams({
      q: query,
      limit: String(options.limit || 20),
      ...(options.category && { category: options.category }),
      ...(options.inStockOnly !== undefined && { inStock: String(options.inStockOnly) }),
      expand: 'true',
    });

    const response = await fetch(`/api/search/hybrid?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Hybrid search failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform hybrid response to match SearchResponse interface
    return {
      success: data.success,
      query: data.data.query,
      results: data.data.results,
      count: data.data.count,
      searchType: 'hybrid',
      contextualInsights: data.data.insights,
    };
  } catch (error) {
    console.error('Client hybrid search error:', error);
    return {
      success: false,
      query,
      results: [],
      count: 0,
      searchType: 'hybrid_error',
    };
  }
}

/**
 * Check if we're running on the client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if we're running on the server side
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Safe import wrapper that only works on server side
 */
export async function safeServerImport<T>(
  importFn: () => Promise<T>
): Promise<T | null> {
  if (isServer()) {
    try {
      return await importFn();
    } catch (error) {
      console.error('Server import failed:', error);
      return null;
    }
  }
  return null;
}