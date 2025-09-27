/**
 * Unified Qdrant Database Client
 * Single source of truth for ALL data storage
 */

import { QdrantClient } from '@qdrant/qdrant-js';
import { logger } from '@/lib/logger';
import { config } from '@/core/config/env.config';
import { handleError } from '@/lib/error-sanitizer';

// Collection definitions - Updated to match remote instance
export const COLLECTIONS = {
  users: { size: 384, distance: 'Cosine' },
  products: { size: 768, distance: 'Cosine' }, // Existing collection with 7 points
  agriko_products: { size: 1536, distance: 'Cosine' }, // Existing collection
  competitors: { size: 384, distance: 'Cosine' },
  scraped_products: { size: 768, distance: 'Cosine' },
  analytics: { size: 256, distance: 'Euclid' },
  sessions: { size: 128, distance: 'Cosine' },
  cache: { size: 128, distance: 'Euclid' },
  graph_edges: { size: 256, distance: 'Cosine' }
} as const;

export type CollectionName = keyof typeof COLLECTIONS;

class QdrantDatabase {
  private client: QdrantClient;
  private initialized = false;

  constructor() {
    this.client = new QdrantClient({
      url: config.QDRANT_URL,
      apiKey: config.QDRANT_API_KEY,
    });
  }

  /**
   * Initialize all collections
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check connection
      const health = await this.client.getCollections();
      logger.info('Qdrant connection established', { collections: health.collections?.length || 0 });

      // Create collections if they don't exist
      for (const [name, config] of Object.entries(COLLECTIONS)) {
        await this.createCollection(name as CollectionName, config);
      }

      // Create indexes for common queries
      await this.createIndexes();

      this.initialized = true;
      logger.info('Qdrant database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Qdrant', handleError(error, 'qdrant-initialize'));
      throw new Error('Database initialization failed');
    }
  }

  /**
   * Create a collection if it doesn't exist
   */
  private async createCollection(
    name: CollectionName,
    config: { size: number; distance: string }
  ): Promise<void> {
    try {
      await this.client.getCollection(name);
      logger.info(`Collection ${name} already exists`);
    } catch (_error) {
      // Collection doesn't exist, create it
      await this.client.createCollection(name, {
        vectors: {
          size: config.size,
          distance: config.distance as 'Cosine' | 'Euclid' | 'Dot',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 2,
      });
      logger.info(`Created collection ${name}`);
    }
  }

  /**
   * Create indexes for efficient queries
   */
  private async createIndexes(): Promise<void> {
    // Create payload indexes for common filters
    const indexes = [
      { collection: 'users', field: 'email' },
      { collection: 'users', field: 'role' },
      { collection: 'sessions', field: 'userId' },
      { collection: 'sessions', field: 'expiresAt' },
      { collection: 'products', field: 'sku' },
      { collection: 'products', field: 'category' },
      { collection: 'scraped_products', field: 'domain' },
      { collection: 'analytics', field: 'event' },
      { collection: 'analytics', field: 'userId' },
      { collection: 'graph_edges', field: 'fromId' },
      { collection: 'graph_edges', field: 'toId' },
      { collection: 'graph_edges', field: 'type' },
    ];

    for (const { collection, field } of indexes) {
      try {
        await this.client.createPayloadIndex(collection, {
          field_name: field,
          field_schema: 'keyword',
        });
        logger.info(`Created index for ${collection}.${field}`);
      } catch (_error) {
        // Index might already exist
        logger.debug(`Index ${collection}.${field} may already exist`);
      }
    }
  }

  /**
   * Upsert points with automatic embedding
   */
  async upsert<T extends Record<string, unknown>>(
    collection: CollectionName,
    points: Array<{
      id: number;
      vector: number[];
      payload: T;
    }>
  ): Promise<void> {
    await this.client.upsert(collection, {
      wait: true,
      points,
    });
  }

  /**
   * Search with vector similarity
   */
  async search<T = Record<string, unknown>>(
    collection: CollectionName,
    params: {
      vector?: number[];
      filter?: Record<string, unknown>;
      limit?: number;
      offset?: number;
      with_payload?: boolean;
      with_vector?: boolean;
    }
  ): Promise<Array<{
    id: number;
    score?: number;
    payload?: T;
    vector?: number[];
  }>> {
    if (params.vector) {
      const result = await this.client.search(collection, {
        vector: params.vector,
        filter: params.filter,
        limit: params.limit || 10,
        offset: params.offset,
        with_payload: params.with_payload !== false,
        with_vector: params.with_vector,
      });
      // Convert null payloads to undefined and handle vector types
      return result.map(point => ({
        id: typeof point.id === 'string' ? parseInt(point.id, 10) : point.id,
        score: point.score,
        payload: point.payload === null ? undefined : (point.payload as T),
        vector: Array.isArray(point.vector) && Array.isArray(point.vector[0])
          ? undefined // Skip multi-dimensional vectors
          : Array.isArray(point.vector)
            ? (point.vector as number[])
            : undefined
      }));
    } else {
      // Scroll without vector (filter-only query)
      const result = await this.client.scroll(collection, {
        filter: params.filter,
        limit: params.limit || 10,
        offset: params.offset,
        with_payload: params.with_payload !== false,
        with_vector: params.with_vector,
      });
      // Convert null payloads to undefined and ensure proper return format
      const points = result.points || [];
      return points.map(point => ({
        id: typeof point.id === 'string' ? parseInt(point.id, 10) : point.id,
        score: undefined, // scroll doesn't return scores
        payload: point.payload === null ? undefined : (point.payload as T),
        vector: Array.isArray(point.vector) && Array.isArray(point.vector[0])
          ? undefined // Skip multi-dimensional vectors
          : Array.isArray(point.vector)
            ? (point.vector as number[])
            : undefined
      }));
    }
  }

  /**
   * Get points by IDs
   */
  async get<T = Record<string, unknown>>(
    collection: CollectionName,
    ids: Array<number>
  ): Promise<Array<{
    id: number;
    payload?: T;
    vector?: number[];
  }>> {
    const result = await this.client.retrieve(collection, {
      ids,
      with_payload: true,
      with_vector: false,
    });
    // Convert null payloads to undefined and handle vector types
    return result.map(point => ({
      id: typeof point.id === 'string' ? parseInt(point.id, 10) : point.id,
      payload: point.payload === null ? undefined : (point.payload as T),
      vector: Array.isArray(point.vector) && Array.isArray(point.vector[0])
        ? undefined // Skip multi-dimensional vectors
        : Array.isArray(point.vector)
          ? (point.vector as number[])
          : undefined
    }));
  }

  /**
   * Delete points
   */
  async delete(
    collection: CollectionName,
    ids: Array<number>
  ): Promise<void> {
    await this.client.delete(collection, {
      wait: true,
      points: ids,
    });
  }

  /**
   * Count points with filter
   */
  async count(
    collection: CollectionName,
    filter?: Record<string, unknown>
  ): Promise<number> {
    const result = await this.client.count(collection, {
      filter,
      exact: true,
    });
    return result.count;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    const now = Date.now();
    await this.client.delete('cache', {
      wait: true,
      filter: {
        must: [
          {
            key: 'expiresAt',
            range: {
              lt: now,
            },
          },
        ],
      },
    });
  }

  /**
   * Clear expired sessions
   */
  async clearExpiredSessions(): Promise<void> {
    const now = Date.now();
    await this.client.delete('sessions', {
      wait: true,
      filter: {
        must: [
          {
            key: 'expiresAt',
            range: {
              lt: now,
            },
          },
        ],
      },
    });
  }

  /**
   * Get client for advanced operations
   */
  getClient(): QdrantClient {
    return this.client;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (_error) {
      return false;
    }
  }
}

// Export singleton instance
export const qdrantDb = new QdrantDatabase();

// Initialize on import in production
if (process.env.NODE_ENV === 'production') {
  qdrantDb.initialize().catch((error) => {
    logger.error('Failed to initialize Qdrant on startup', handleError(error, 'qdrant-startup'));
    process.exit(1);
  });
}