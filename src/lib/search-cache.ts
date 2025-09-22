import { logger } from '@/lib/logger';
// Search Performance and Caching Utilities
// Implements intelligent caching for search results and query optimization

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
  ttl: number;
}

export interface SearchCacheConfig {
  maxSize: number;
  defaultTTL: number;
  enableLRU: boolean;
  enableCompression: boolean;
  enableMetrics: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  averageResponseTime: number;
  hitRate: number;
}

export class SearchCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: SearchCacheConfig;
  private metrics: CacheMetrics;

  constructor(config: Partial<SearchCacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      enableLRU: true,
      enableCompression: false,
      enableMetrics: true,
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      averageResponseTime: 0,
      hitRate: 0
    };
  }

  // Get item from cache
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateMetrics();
      return null;
    }

    // Update access information
    entry.hits++;
    entry.lastAccessed = Date.now();
    
    this.metrics.hits++;
    this.updateMetrics();
    
    return entry.data;
  }

  // Set item in cache
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl ?? this.config.defaultTTL;

    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      hits: 0,
      lastAccessed: now,
      ttl: entryTTL
    };

    this.cache.set(key, entry);
    this.metrics.totalSize = this.cache.size;
  }

  // Remove item from cache
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.metrics.totalSize = this.cache.size;
    return result;
  }

  // Clear entire cache
  clear(): void {
    this.cache.clear();
    this.metrics.totalSize = 0;
  }

  // Evict least recently used item
  private evictLRU(): void {
    if (!this.config.enableLRU || this.cache.size === 0) return;

    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.metrics.evictions++;
    }
  }

  // Update cache metrics
  private updateMetrics(): void {
    if (!this.config.enableMetrics) return;

    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  // Get cache metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Get all keys (for debugging)
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
    this.metrics.totalSize = this.cache.size;
  }
}

// Search query optimization utilities
export class QueryOptimizer {
  private stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
    'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 
    'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 
    'may', 'might', 'must', 'shall', 'a', 'an'
  ]);

  private synonyms = new Map([
    ['healthy', ['nutritious', 'wholesome', 'beneficial', 'good']],
    ['organic', ['natural', 'pure', 'chemical-free', 'pesticide-free']],
    ['spicy', ['hot', 'fiery', 'pungent', 'zesty']],
    ['sweet', ['sugary', 'honeyed', 'syrupy', 'saccharine']],
    ['fresh', ['new', 'crisp', 'recently-made', 'just-picked']]
  ]);

  // Optimize query for better search results
  optimizeQuery(query: string): {
    optimized: string;
    suggestions: string[];
    corrections: string[];
  } {
    const original = query.trim().toLowerCase();
    let optimized = original;
    const suggestions: string[] = [];
    const corrections: string[] = [];

    // Remove excessive whitespace
    optimized = optimized.replace(/\s+/g, ' ');

    // Basic spell correction (simplified)
    const corrected = this.correctCommonMisspellings(optimized);
    if (corrected !== optimized) {
      corrections.push(corrected);
      optimized = corrected;
    }

    // Generate query variations with synonyms
    const synonymVariations = this.generateSynonymVariations(optimized);
    suggestions.push(...synonymVariations);

    // Remove stop words for semantic search
    const withoutStopWords = this.removeStopWords(optimized);
    if (withoutStopWords !== optimized && withoutStopWords.length > 0) {
      suggestions.push(withoutStopWords);
    }

    return {
      optimized,
      suggestions: [...new Set(suggestions)].slice(0, 5), // Limit and dedupe
      corrections
    };
  }

  // Remove stop words from query
  removeStopWords(query: string): string {
    const words = query.split(' ').filter(word => 
      word.length > 2 && !this.stopWords.has(word)
    );
    return words.join(' ');
  }

  // Generate query variations using synonyms
  generateSynonymVariations(query: string): string[] {
    const variations: string[] = [];
    const _words = query.split(' ');
    void _words; // Preserved for future word-level synonym replacement

    for (const [word, synonymList] of this.synonyms.entries()) {
      if (query.includes(word)) {
        for (const synonym of synonymList) {
          const variation = query.replace(new RegExp(word, 'g'), synonym);
          variations.push(variation);
        }
      }
    }

    return variations;
  }

  // Basic spell correction for common misspellings
  correctCommonMisspellings(query: string): string {
    const corrections = new Map([
      ['tumeric', 'turmeric'],
      ['cinamon', 'cinnamon'],
      ['orgaic', 'organic'],
      ['honny', 'honey'],
      ['ginger', 'ginger'], // Keep as is
      ['inflamation', 'inflammation'],
      ['imune', 'immune'],
      ['digestiv', 'digestive'],
      ['antioxident', 'antioxidant']
    ]);

    let corrected = query;
    for (const [wrong, right] of corrections.entries()) {
      corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
    }

    return corrected;
  }

  // Extract intent from query
  extractIntent(query: string): {
    type: 'product' | 'health' | 'category' | 'general';
    confidence: number;
    keywords: string[];
  } {
    const lowerQuery = query.toLowerCase();
    const keywords: string[] = [];

    // Health-related intent
    const healthKeywords = ['health', 'benefits', 'good for', 'helps with', 'cure', 'treat', 'remedy'];
    const healthScore = healthKeywords.filter(keyword => lowerQuery.includes(keyword)).length;

    // Category intent
    const categoryKeywords = ['spices', 'honey', 'rice', 'tea', 'herbs', 'oils'];
    const categoryScore = categoryKeywords.filter(keyword => lowerQuery.includes(keyword)).length;

    // Product-specific intent
    const productKeywords = ['buy', 'price', 'organic', 'natural', 'pure', 'fresh'];
    const productScore = productKeywords.filter(keyword => lowerQuery.includes(keyword)).length;

    // Extract meaningful keywords
    const words = query.split(' ').filter(word => 
      word.length > 2 && !this.stopWords.has(word.toLowerCase())
    );
    keywords.push(...words);

    // Determine primary intent
    const scores = {
      health: healthScore,
      category: categoryScore,
      product: productScore,
      general: 1 // Base score
    };

    const maxScore = Math.max(...Object.values(scores));
    const intentEntry = Object.entries(scores).find(([, score]) => score === maxScore);
    const primaryIntent = intentEntry?.[0] ?? 'general';
    
    // Ensure the primaryIntent is one of the allowed types
    const validTypes = ['category', 'product', 'health', 'general'] as const;
    type ValidIntentType = typeof validTypes[number];
    const intentType: ValidIntentType = validTypes.includes(primaryIntent as ValidIntentType) 
      ? (primaryIntent as ValidIntentType) 
      : 'general';
    
    return {
      type: intentType,
      confidence: maxScore / (query.split(' ').length + 1), // Normalize by query length
      keywords
    };
  }
}

// Global cache instances
export const searchResultsCache = new SearchCache({
  maxSize: 500,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  enableLRU: true,
  enableMetrics: true
});

export const autocompleteCache = new SearchCache({
  maxSize: 1000,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  enableLRU: true,
  enableMetrics: true
});

export const productCache = new SearchCache({
  maxSize: 200,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  enableLRU: true,
  enableMetrics: true
});

// Global query optimizer
export const queryOptimizer = new QueryOptimizer();

// Cache key generation utilities
export function generateSearchCacheKey(query: string, filters: Record<string, unknown>, searchType: 'product' | 'health' | 'category' | 'general'): string {
  const filterKey = JSON.stringify(filters ?? {});
  const hash = btoa(encodeURIComponent(`${query}:${filterKey}:${searchType}`));
  return `search:${hash}`;
}

export function generateAutocompleteCacheKey(query: string, options: Record<string, unknown>): string {
  const optionsKey = JSON.stringify(options ?? {});
  const hash = btoa(encodeURIComponent(`${query}:${optionsKey}`));
  return `autocomplete:${hash}`;
}

// Periodic cleanup function
export function initializeSearchCacheCleanup(): void {
  // Clean up expired entries every 5 minutes
  const searchCleanupInterval = setInterval(() => {
    searchResultsCache.cleanup();
    autocompleteCache.cleanup();
    productCache.cleanup();
    
    logger.info('🧹 Search cache cleanup completed:', {
      searchResults: searchResultsCache.size(),
      autocomplete: autocompleteCache.size(),
      products: productCache.size()
    });
  }, 5 * 60 * 1000);

  // Cleanup on process termination
  if (typeof process !== 'undefined') {
    const cleanup = () => {
      clearInterval(searchCleanupInterval);
    };
    
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('exit', cleanup);
  }

  logger.info('✅ Search cache cleanup initialized');
}

// Get overall cache statistics
export function getSearchCacheStats(): {
  searchResults: CacheMetrics;
  autocomplete: CacheMetrics;
  products: CacheMetrics;
  total: {
    size: number;
    hitRate: number;
    memoryUsage: string;
  };
} {
  const searchStats = searchResultsCache.getMetrics();
  const autocompleteStats = autocompleteCache.getMetrics();
  const productStats = productCache.getMetrics();

  const totalHits = searchStats.hits + autocompleteStats.hits + productStats.hits;
  const totalMisses = searchStats.misses + autocompleteStats.misses + productStats.misses;
  const totalRequests = totalHits + totalMisses;

  return {
    searchResults: searchStats,
    autocomplete: autocompleteStats,
    products: productStats,
    total: {
      size: searchResultsCache.size() + autocompleteCache.size() + productCache.size(),
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      memoryUsage: `~${Math.round((searchResultsCache.size() + autocompleteCache.size() + productCache.size()) * 0.1)}KB`
    }
  };
}