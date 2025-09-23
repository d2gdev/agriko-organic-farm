// Enhanced Embedding Cache with Semantic Similarity and Redis Support
import { logger } from './logger';
import { MultiVectorEmbedding, cosineSimilarity } from './multi-vector-embeddings';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  searchQueries?: string[];
  metadata?: Record<string, unknown>;
  category?: string;
  text?: string;
}

interface EnhancedCacheConfig {
  maxSize: number;
  ttlMinutes: number;
  similarityThreshold: number;
  useSemanticLookup: boolean;
  precomputePopular: boolean;
  redisEnabled: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

export class EmbeddingCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private config: EnhancedCacheConfig;
  private ttl: number;
  private stats: CacheStats;
  private queryFrequency: Map<string, { count: number; lastUsed: number }>;

  constructor(
    maxSize: number = 1000,
    ttlMinutes: number = 60,
    options: Partial<EnhancedCacheConfig> = {}
  ) {
    this.cache = new Map();
    this.config = {
      maxSize,
      ttlMinutes,
      similarityThreshold: 0.95,
      useSemanticLookup: true,
      precomputePopular: false,
      redisEnabled: false,
      ...options
    };
    this.ttl = ttlMinutes * 60 * 1000;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
    };
    this.queryFrequency = new Map();
  }

  /**
   * Get an item from cache with enhanced lookup
   */
  get(key: string, searchQuery?: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    // Track search query association
    if (searchQuery && entry.searchQueries) {
      if (!entry.searchQueries.includes(searchQuery)) {
        entry.searchQueries.push(searchQuery);
        entry.searchQueries = entry.searchQueries.slice(-5); // Keep last 5 queries
      }
    }

    return entry.data;
  }

  /**
   * Smart semantic lookup for embeddings
   */
  semanticGet(targetEmbedding: number[], threshold?: number, category?: string): T | null {
    if (!this.config.useSemanticLookup) {
      return null;
    }

    const similarityThreshold = threshold ?? this.config.similarityThreshold;
    let bestMatch: { entry: CacheEntry<T>; similarity: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      // Skip expired entries
      if (Date.now() - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        continue;
      }

      // Category filtering
      if (category && entry.category && entry.category !== category) {
        continue;
      }

      // Check if this is an embedding entry
      if (Array.isArray(entry.data) && typeof entry.data[0] === 'number') {
        const similarity = cosineSimilarity(targetEmbedding, entry.data as number[]);

        if (similarity >= similarityThreshold) {
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = { entry, similarity };
          }
        }
      }
    }

    if (bestMatch) {
      // Update access stats for semantic hit
      bestMatch.entry.accessCount++;
      bestMatch.entry.lastAccessed = Date.now();
      this.stats.hits++;

      logger.info(`Semantic cache hit with similarity: ${bestMatch.similarity.toFixed(3)}`);
      return bestMatch.entry.data;
    }

    return null;
  }

  /**
   * Set an item in cache with enhanced metadata
   */
  set(
    key: string,
    value: T,
    options: {
      text?: string;
      category?: string;
      metadata?: Record<string, unknown>;
      searchQuery?: string;
    } = {}
  ): void {
    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      text: options.text,
      category: options.category,
      metadata: options.metadata,
      searchQueries: options.searchQuery ? [options.searchQuery] : [],
    });

    // Track query frequency for precomputation
    if (options.searchQuery) {
      this.trackQueryFrequency(options.searchQuery);
    }

    this.stats.size = this.cache.size;
  }

  /**
   * Track query frequency for popular query identification
   */
  private trackQueryFrequency(query: string): void {
    const existing = this.queryFrequency.get(query);
    if (existing) {
      existing.count++;
      existing.lastUsed = Date.now();
    } else {
      this.queryFrequency.set(query, {
        count: 1,
        lastUsed: Date.now(),
      });
    }

    // Limit query tracking size
    if (this.queryFrequency.size > 500) {
      const sorted = Array.from(this.queryFrequency.entries())
        .sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

      // Remove oldest 10%
      const toRemove = Math.floor(sorted.length * 0.1);
      for (let i = 0; i < toRemove; i++) {
        const entry = sorted[i];
        if (entry) {
          this.queryFrequency.delete(entry[0]);
        }
      }
    }
  }

  /**
   * Get popular queries for precomputation
   */
  getPopularQueries(minCount: number = 3, limit: number = 20): string[] {
    return Array.from(this.queryFrequency.entries())
      .filter(([, data]) => data.count >= minCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([query]) => query);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.size--;
      return false;
    }

    return true;
  }

  /**
   * Delete an item from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.stats.size--;
    }
    return result;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get hit rate percentage
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestTime = Date.now();
    let oldestKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size--;
      logger.debug(`Evicted cache entry: ${oldestKey}`);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.size = this.cache.size;
      logger.info(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Warm up cache with frequently accessed items
   */
  async warmUp(loader: () => Promise<Array<{ key: string; value: T }>>): Promise<void> {
    try {
      logger.info('Warming up cache...');
      const items = await loader();

      for (const { key, value } of items) {
        this.set(key, value);
      }

      logger.info(`Cache warmed up with ${items.length} items`);
    } catch (error) {
      logger.error('Cache warm-up failed:', error as Record<string, unknown>);
    }
  }
}

// Singleton instances for different cache types
let embeddingCache: EmbeddingCache<number[]> | null = null;
let multiVectorCache: EmbeddingCache<MultiVectorEmbedding> | null = null;
let searchResultCache: EmbeddingCache<unknown[]> | null = null;

// Interval references for cleanup
let embeddingCleanupInterval: NodeJS.Timeout | null = null;
let multiVectorCleanupInterval: NodeJS.Timeout | null = null;
let searchResultCleanupInterval: NodeJS.Timeout | null = null;

/**
 * Get or create embedding cache instance
 */
export function getEmbeddingCache(): EmbeddingCache<number[]> {
  if (!embeddingCache) {
    embeddingCache = new EmbeddingCache<number[]>(2000, 120); // 2000 items, 2 hours TTL

    // Clear existing interval if any
    if (embeddingCleanupInterval) {
      clearInterval(embeddingCleanupInterval);
    }

    // Set up periodic cleanup
    embeddingCleanupInterval = setInterval(() => {
      embeddingCache?.cleanup();
    }, 30 * 60 * 1000); // Clean up every 30 minutes
  }

  return embeddingCache;
}

/**
 * Get or create multi-vector cache instance
 */
export function getMultiVectorCache(): EmbeddingCache<MultiVectorEmbedding> {
  if (!multiVectorCache) {
    multiVectorCache = new EmbeddingCache<MultiVectorEmbedding>(500, 60); // 500 items, 1 hour TTL

    // Clear existing interval if any
    if (multiVectorCleanupInterval) {
      clearInterval(multiVectorCleanupInterval);
    }

    // Set up periodic cleanup
    multiVectorCleanupInterval = setInterval(() => {
      multiVectorCache?.cleanup();
    }, 15 * 60 * 1000); // Clean up every 15 minutes
  }

  return multiVectorCache;
}

/**
 * Get or create search result cache instance
 */
export function getSearchResultCache(): EmbeddingCache<unknown[]> {
  if (!searchResultCache) {
    searchResultCache = new EmbeddingCache<unknown[]>(100, 10); // 100 items, 10 minutes TTL

    // Clear existing interval if any
    if (searchResultCleanupInterval) {
      clearInterval(searchResultCleanupInterval);
    }

    // Set up periodic cleanup
    searchResultCleanupInterval = setInterval(() => {
      searchResultCache?.cleanup();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  return searchResultCache;
}

/**
 * Cached embedding generation wrapper
 */
export async function getCachedEmbedding(
  text: string,
  generator: (text: string) => Promise<number[]>
): Promise<number[]> {
  const cache = getEmbeddingCache();
  const cacheKey = `emb:${hashText(text)}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for embedding: ${cacheKey}`);
    return cached;
  }

  // Generate and cache
  logger.debug(`Cache miss for embedding: ${cacheKey}`);
  const embedding = await generator(text);
  cache.set(cacheKey, embedding);

  return embedding;
}

/**
 * Cached multi-vector embedding wrapper
 */
export async function getCachedMultiVectorEmbedding(
  productId: number,
  generator: () => Promise<MultiVectorEmbedding>
): Promise<MultiVectorEmbedding> {
  const cache = getMultiVectorCache();
  const cacheKey = `mv:${productId}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for multi-vector: ${cacheKey}`);
    return cached;
  }

  // Generate and cache
  logger.debug(`Cache miss for multi-vector: ${cacheKey}`);
  const embedding = await generator();
  cache.set(cacheKey, embedding);

  return embedding;
}

/**
 * Cached search results wrapper
 */
export async function getCachedSearchResults<T>(
  query: string,
  options: Record<string, unknown>,
  searcher: () => Promise<T[]>
): Promise<T[]> {
  const cache = getSearchResultCache();
  const cacheKey = `search:${hashText(query)}:${JSON.stringify(options)}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for search: ${query}`);
    return cached as T[];
  }

  // Search and cache
  logger.debug(`Cache miss for search: ${query}`);
  const results = await searcher();
  cache.set(cacheKey, results);

  return results;
}

/**
 * Simple hash function for text
 */
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Batch process with caching
 */
export async function batchProcessWithCache<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  getCacheKey: (item: T) => string,
  batchSize: number = 10
): Promise<R[]> {
  const cache = getEmbeddingCache();
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchPromises = batch.map(async (item) => {
      const cacheKey = getCacheKey(item);

      // Check cache
      const cached = cache.get(cacheKey);
      if (cached) {
        return cached as R;
      }

      // Process and cache
      const result = await processor(item);
      cache.set(cacheKey, result as number[]);
      return result;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    logger.debug(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
  }

  return results;
}

/**
 * Cache statistics reporter
 */
export function reportCacheStats(): void {
  const embCache = getEmbeddingCache();
  const mvCache = getMultiVectorCache();
  const searchCache = getSearchResultCache();

  logger.info('Cache Statistics:', {
    embedding: {
      ...embCache.getStats(),
      hitRate: `${embCache.getHitRate().toFixed(2)}%`,
    },
    multiVector: {
      ...mvCache.getStats(),
      hitRate: `${mvCache.getHitRate().toFixed(2)}%`,
    },
    search: {
      ...searchCache.getStats(),
      hitRate: `${searchCache.getHitRate().toFixed(2)}%`,
    },
  });
}

// Stop all cleanup intervals
export function stopEmbeddingCacheCleanup(): void {
  if (embeddingCleanupInterval) {
    clearInterval(embeddingCleanupInterval);
    embeddingCleanupInterval = null;
  }
  if (multiVectorCleanupInterval) {
    clearInterval(multiVectorCleanupInterval);
    multiVectorCleanupInterval = null;
  }
  if (searchResultCleanupInterval) {
    clearInterval(searchResultCleanupInterval);
    searchResultCleanupInterval = null;
  }
  logger.info('🛑 Embedding cache cleanup stopped');
}

// Graceful shutdown handler
const cleanup = () => {
  logger.info('🧹 Cleaning up embedding caches...');
  stopEmbeddingCacheCleanup();
};

// Register cleanup handlers
if (typeof process !== 'undefined') {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}

// Cache management functions are already exported above