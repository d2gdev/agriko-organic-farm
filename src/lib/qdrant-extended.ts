/**
 * Extended Qdrant client with additional methods for competitor data
 */

import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-sanitizer';

// Generic payload type for better type safety
type QdrantPayload = Record<string, unknown>;

// Search result type
interface QdrantSearchResult {
  id: number;
  score: number;
  payload?: QdrantPayload;
  vector?: number[];
}

interface QdrantRetrieveResult {
  id: number;
  payload?: QdrantPayload;
  vector?: number[];
}

// Extended Qdrant configuration
interface QdrantConfig {
  url: string;
  apiKey?: string;
  collectionName?: string;
}

interface CreateCollectionOptions {
  vectorSize: number;
  onDiskPayload?: boolean;
  indexingThreshold?: number;
}

interface QdrantPoint {
  id: number;
  vector: number[];
  payload: QdrantPayload;
}

interface ScrollOptions {
  filter?: QdrantPayload;
  limit?: number;
  offset?: number;
  with_payload?: boolean;
  with_vector?: boolean;
  order_by?: {
    key: string;
    direction: 'asc' | 'desc';
  };
}

interface SearchOptions {
  vector?: number[];
  filter?: QdrantPayload;
  limit?: number;
  offset?: number;
  with_payload?: boolean;
  with_vector?: boolean;
}

interface ScrollResult {
  points: Array<{
    id: number;
    payload?: QdrantPayload;
    vector?: number[];
  }>;
  next_page_offset?: number;
}

export class QdrantExtendedClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: QdrantConfig) {
    this.baseUrl = (config.url || process.env.QDRANT_URL || 'http://localhost:6333').replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.apiKey && { 'api-key': config.apiKey })
    };
  }

  // Create collection with options
  async createCollection(collectionName: string, options: CreateCollectionOptions): Promise<void> {
    try {
      // Check if collection exists
      const checkResponse = await fetch(
        `${this.baseUrl}/collections/${collectionName}`,
        { headers: this.headers }
      );

      if (checkResponse.ok) {
        logger.info(`Collection ${collectionName} already exists`);
        return;
      }

      // Create collection
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            vectors: {
              size: options.vectorSize,
              distance: 'Cosine'
            },
            on_disk_payload: options.onDiskPayload || false,
            optimizers_config: {
              default_segment_number: 2,
              indexing_threshold: options.indexingThreshold || 20000
            },
            replication_factor: 1
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create collection: ${error}`);
      }

      logger.info(`Created Qdrant collection: ${collectionName}`);
    } catch (error) {
      logger.error('Failed to create Qdrant collection:', handleError(error, 'qdrant-extended-create-collection'));
      throw error;
    }
  }

  // Upsert points
  async upsert(collectionName: string, points: QdrantPoint[]): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}/points`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            points: points.map(point => ({
              id: point.id,
              vector: point.vector,
              payload: point.payload
            }))
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upsert points: ${error}`);
      }

      logger.debug(`Upserted ${points.length} points to ${collectionName}`);
    } catch (error) {
      logger.error('Failed to upsert points:', handleError(error, 'qdrant-extended-upsert'));
      throw error;
    }
  }

  // Scroll through points
  async scroll(collectionName: string, options: ScrollOptions = {}): Promise<ScrollResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}/points/scroll`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            filter: options.filter,
            limit: options.limit || 10,
            offset: options.offset,
            with_payload: options.with_payload !== false,
            with_vector: options.with_vector || false,
            order_by: options.order_by
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to scroll points: ${error}`);
      }

      const data = await response.json();
      return {
        points: data.result?.points || [],
        next_page_offset: data.result?.next_page_offset
      };
    } catch (error) {
      logger.error('Failed to scroll points:', handleError(error, 'qdrant-extended-scroll'));
      return { points: [] };
    }
  }

  // Search for similar vectors
  async search(collectionName: string, options: SearchOptions): Promise<QdrantSearchResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}/points/search`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            vector: options.vector,
            filter: options.filter,
            limit: options.limit || 10,
            offset: options.offset || 0,
            with_payload: options.with_payload !== false,
            with_vector: options.with_vector || false
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Search failed: ${error}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      logger.error('Qdrant search failed:', handleError(error, 'qdrant-extended-search'));
      return [];
    }
  }

  // Retrieve specific points
  async retrieve(collectionName: string, options: { ids: (number)[], with_payload?: boolean, with_vector?: boolean }): Promise<QdrantRetrieveResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}/points`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            ids: options.ids,
            with_payload: options.with_payload !== false,
            with_vector: options.with_vector || false
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to retrieve points: ${error}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      logger.error('Failed to retrieve points:', handleError(error, 'qdrant-extended-retrieve'));
      return [];
    }
  }

  // Set payload for points
  async setPayload(collectionName: string, options: { points: (number)[], payload: QdrantPayload }): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}/points/payload`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            points: options.points,
            payload: options.payload
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to set payload: ${error}`);
      }

      logger.debug(`Updated payload for ${options.points.length} points`);
    } catch (error) {
      logger.error('Failed to set payload:', handleError(error, 'qdrant-extended-set-payload'));
      throw error;
    }
  }

  // Delete points
  async delete(collectionName: string, options: { points?: (number)[], filter?: QdrantPayload }): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}/points/delete`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            points: options.points,
            filter: options.filter
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete points: ${error}`);
      }

      logger.debug(`Deleted points from ${collectionName}`);
    } catch (error) {
      logger.error('Failed to delete points:', handleError(error, 'qdrant-extended-delete'));
      throw error;
    }
  }

  // Count points in collection
  async count(collectionName: string, filter?: QdrantPayload): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}/points/count`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            filter: filter,
            exact: true
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to count points: ${error}`);
      }

      const data = await response.json();
      return data.result?.count || 0;
    } catch (error) {
      logger.error('Failed to count points:', handleError(error, 'qdrant-extended-count'));
      return 0;
    }
  }

  // Delete collection
  async deleteCollection(collectionName: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}`,
        {
          method: 'DELETE',
          headers: this.headers
        }
      );

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Failed to delete collection: ${error}`);
      }

      logger.info(`Deleted collection: ${collectionName}`);
    } catch (error) {
      logger.error('Failed to delete collection:', handleError(error, 'qdrant-extended-delete-collection'));
      throw error;
    }
  }

  // Check collection existence
  async collectionExists(collectionName: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionName}`,
        { headers: this.headers }
      );

      return response.ok;
    } catch (error) {
      logger.error('Failed to check collection existence:', handleError(error, 'qdrant-extended-collection-exists'));
      return false;
    }
  }
}

// Create singleton instance
export const qdrantClient = new QdrantExtendedClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY
});