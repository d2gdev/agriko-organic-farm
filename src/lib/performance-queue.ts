// Performance Queue System for Batch Processing and Optimization
import { logger } from './logger';
import { WCProduct } from '@/types/woocommerce';
import { generateMultiVectorEmbedding } from './multi-vector-embeddings';
import { enrichProductWithNutrition } from './nutritional-enrichment';
import { getEmbeddingCache } from './embedding-cache';

export interface QueueItem<T = unknown> {
  id: string;
  type: 'embedding' | 'enrichment' | 'search' | 'recommendation' | 'graph-update';
  data: T;
  priority: number; // Higher is more important
  timestamp: number;
  retryCount?: number;
  maxRetries?: number;
}

export interface QueueOptions {
  maxConcurrent: number;
  batchSize: number;
  processingInterval: number; // ms
  maxQueueSize: number;
  enablePriority: boolean;
}

export interface ProcessingResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  processingTime: number;
}

/**
 * High-performance queue for batch processing
 */
export class PerformanceQueue<T = unknown> {
  private queue: QueueItem<T>[] = [];
  private processing = false;
  private options: QueueOptions;
  private processingCount = 0;
  private processedCount = 0;
  private errorCount = 0;
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(options: Partial<QueueOptions> = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 5,
      batchSize: options.batchSize || 10,
      processingInterval: options.processingInterval || 1000,
      maxQueueSize: options.maxQueueSize || 1000,
      enablePriority: options.enablePriority !== false,
    };

    // Start processing loop
    this.startProcessingLoop();
  }

  /**
   * Add item to queue
   */
  enqueue(item: Omit<QueueItem<T>, 'timestamp'>): boolean {
    if (this.queue.length >= this.options.maxQueueSize) {
      logger.warn(`Queue full (${this.options.maxQueueSize} items), rejecting new item`);
      return false;
    }

    const queueItem: QueueItem<T> = {
      ...item,
      timestamp: Date.now(),
      retryCount: item.retryCount || 0,
      maxRetries: item.maxRetries || 3,
    };

    if (this.options.enablePriority) {
      // Insert based on priority
      const insertIndex = this.queue.findIndex(qi => qi.priority < queueItem.priority);
      if (insertIndex === -1) {
        this.queue.push(queueItem);
      } else {
        this.queue.splice(insertIndex, 0, queueItem);
      }
    } else {
      this.queue.push(queueItem);
    }

    logger.debug(`Item ${queueItem.id} added to queue (priority: ${queueItem.priority})`);
    return true;
  }

  /**
   * Process next batch of items
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const batch = this.queue.splice(0, this.options.batchSize);
      const startTime = Date.now();

      logger.debug(`Processing batch of ${batch.length} items`);

      // Process items concurrently with concurrency limit
      const results = await this.processConcurrent(batch);

      // Handle results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const item = batch[i];

        if (!result || !item) continue;

        if (result.success) {
          this.processedCount++;
          logger.debug(`Item ${item.id} processed successfully`);
        } else {
          this.errorCount++;
          logger.error(`Item ${item.id} failed:`, { error: result.error });

          // Retry if needed
          if ((item.retryCount || 0) < (item.maxRetries || 3)) {
            item.retryCount = (item.retryCount || 0) + 1;
            item.priority = Math.max(0, item.priority - 1); // Lower priority for retries
            this.enqueue(item);
            logger.info(`Item ${item.id} requeued for retry (${item.retryCount}/${item.maxRetries})`);
          }
        }
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Batch processed in ${processingTime}ms (${this.processedCount} success, ${this.errorCount} errors)`);

    } finally {
      this.processing = false;
    }
  }

  /**
   * Process items with concurrency control
   */
  private async processConcurrent(
    items: QueueItem<T>[]
  ): Promise<ProcessingResult<unknown>[]> {
    const results: ProcessingResult<unknown>[] = [];
    const chunks: QueueItem<T>[][] = [];

    // Split into chunks based on max concurrent
    for (let i = 0; i < items.length; i += this.options.maxConcurrent) {
      chunks.push(items.slice(i, i + this.options.maxConcurrent));
    }

    // Process each chunk
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(item => this.processItem(item))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Process individual item
   */
  private async processItem(item: QueueItem<T>): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      let result: unknown;

      switch (item.type) {
        case 'embedding':
          result = await this.processEmbedding(item.data);
          break;
        case 'enrichment':
          result = await this.processEnrichment(item.data);
          break;
        case 'search':
          result = await this.processSearch(item.data);
          break;
        case 'recommendation':
          result = await this.processRecommendation(item.data);
          break;
        case 'graph-update':
          result = await this.processGraphUpdate(item.data);
          break;
        default:
          throw new Error(`Unknown queue item type: ${item.type}`);
      }

      return {
        success: true,
        data: result,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        error: error as Error,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Process embedding generation
   */
  private async processEmbedding(data: unknown): Promise<unknown> {
    const { product } = data as { product: WCProduct };
    return generateMultiVectorEmbedding(product);
  }

  /**
   * Process nutritional enrichment
   */
  private async processEnrichment(data: unknown): Promise<unknown> {
    const { product } = data as { product: WCProduct };
    return enrichProductWithNutrition(product);
  }

  /**
   * Process search request
   */
  private async processSearch(data: unknown): Promise<unknown> {
    // Implement cached search processing
    const cache = getEmbeddingCache();
    const cacheKey = `search:${JSON.stringify(data)}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform actual search (placeholder)
    const result = { query: (data as { query: string }).query, results: [] as number[] };
    cache.set(cacheKey, result.results);

    return result;
  }

  /**
   * Process recommendation request
   */
  private async processRecommendation(data: unknown): Promise<unknown> {
    // Implement recommendation processing
    return { productId: (data as { productId: string }).productId, recommendations: [] };
  }

  /**
   * Process graph update
   */
  private async processGraphUpdate(_data: unknown): Promise<unknown> {
    // Implement graph update processing
    return { success: true };
  }

  /**
   * Start the processing loop
   */
  private startProcessingLoop(): void {
    if (this.intervalHandle) {
      return;
    }

    this.intervalHandle = setInterval(() => {
      this.processBatch().catch(error => {
        logger.error('Queue processing error:', error as Record<string, unknown>);
      });
    }, this.options.processingInterval);

    logger.info(`Queue processing loop started (interval: ${this.options.processingInterval}ms)`);
  }

  /**
   * Stop the processing loop
   */
  stopProcessingLoop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info('Queue processing loop stopped');
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueLength: number;
    processedCount: number;
    errorCount: number;
    processingActive: boolean;
  } {
    return {
      queueLength: this.queue.length,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      processingActive: this.processing,
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    logger.info('Queue cleared');
  }
}

// Global queue instances
let embeddingQueue: PerformanceQueue | null = null;
let enrichmentQueue: PerformanceQueue | null = null;
let searchQueue: PerformanceQueue | null = null;

/**
 * Get or create embedding queue
 */
export function getEmbeddingQueue(): PerformanceQueue {
  if (!embeddingQueue) {
    embeddingQueue = new PerformanceQueue({
      maxConcurrent: 3,
      batchSize: 5,
      processingInterval: 2000,
      maxQueueSize: 500,
    });
  }
  return embeddingQueue;
}

/**
 * Get or create enrichment queue
 */
export function getEnrichmentQueue(): PerformanceQueue {
  if (!enrichmentQueue) {
    enrichmentQueue = new PerformanceQueue({
      maxConcurrent: 5,
      batchSize: 10,
      processingInterval: 3000,
      maxQueueSize: 200,
    });
  }
  return enrichmentQueue;
}

/**
 * Get or create search queue
 */
export function getSearchQueue(): PerformanceQueue {
  if (!searchQueue) {
    searchQueue = new PerformanceQueue({
      maxConcurrent: 10,
      batchSize: 20,
      processingInterval: 500,
      maxQueueSize: 100,
      enablePriority: true,
    });
  }
  return searchQueue;
}

/**
 * Batch process products with queuing
 */
export async function batchProcessProductsWithQueue(
  products: WCProduct[],
  processType: 'embedding' | 'enrichment',
  options: {
    priority?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<void> {
  const queue = processType === 'embedding' ? getEmbeddingQueue() : getEnrichmentQueue();
  const priority = options.priority || 5;

  // Enqueue all products
  let enqueued = 0;
  for (const product of products) {
    const success = queue.enqueue({
      id: `${processType}-${product.id}`,
      type: processType,
      data: { product },
      priority,
    });

    if (success) {
      enqueued++;
    }
  }

  logger.info(`Enqueued ${enqueued}/${products.length} products for ${processType}`);

  // Monitor progress if callback provided
  if (options.onProgress) {
    const checkInterval = setInterval(() => {
      const stats = queue.getStats();
      const processed = stats.processedCount;

      options.onProgress?.(processed, products.length);

      if (processed >= enqueued) {
        clearInterval(checkInterval);
      }
    }, 1000);
  }
}

/**
 * Optimize database queries with connection pooling
 */
export class ConnectionPoolManager {
  private pools: Map<string, unknown[]> = new Map();
  private maxPoolSize = 10;
  private connectionTimeout = 30000;

  /**
   * Get connection from pool
   */
  async getConnection(poolName: string): Promise<unknown> {
    if (!this.pools.has(poolName)) {
      this.pools.set(poolName, []);
    }

    const pool = this.pools.get(poolName);
    if (!pool) return null;

    // Reuse existing connection
    if (pool.length > 0) {
      return pool.pop();
    }

    // Create new connection (placeholder)
    return this.createConnection(poolName);
  }

  /**
   * Return connection to pool
   */
  releaseConnection(poolName: string, connection: unknown): void {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    if (pool.length < this.maxPoolSize) {
      pool.push(connection);
    }
  }

  /**
   * Create new connection
   */
  private async createConnection(poolName: string): Promise<unknown> {
    // Placeholder for actual connection creation
    return { id: Date.now(), pool: poolName };
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    for (const [poolName, pool] of this.pools.entries()) {
      logger.info(`Closing ${pool.length} connections in pool ${poolName}`);
      pool.length = 0;
    }
    this.pools.clear();
  }
}

// Export global connection pool manager
export const connectionPool = new ConnectionPoolManager();

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * Record metric
   */
  record(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const values = this.metrics.get(metricName);
    if (values) {
      values.push(value);

      // Keep only last 100 values
      if (values.length > 100) {
        values.shift();
      }
    }
  }

  /**
   * Get metric statistics
   */
  getStats(metricName: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      average: sum / sorted.length,
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
    };
  }

  /**
   * Get all metrics
   */
  getAllStats(): Map<string, unknown> {
    const allStats = new Map();

    for (const [name] of this.metrics.entries()) {
      allStats.set(name, this.getStats(name));
    }

    return allStats;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

// Export global performance monitor
export const performanceMonitor = new PerformanceMonitor();