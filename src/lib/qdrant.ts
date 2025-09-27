// Qdrant vector database integration for semantic search
import { logger } from '@/lib/logger';
import { WCProduct } from '@/types/woocommerce';
import { Core } from '@/types/TYPE_REGISTRY';
// Removed APP_CONSTANTS import due to dependency issues

// Qdrant client configuration
interface QdrantConfig {
  url: string;
  apiKey?: string;
  collectionName: string;
}

interface QdrantPoint {
  id: number;
  vector: number[];
  payload: Record<string, unknown>;
}

interface QdrantSearchResult {
  id: number;
  score: number;
  payload: Record<string, unknown>;
}

class QdrantClient {
  private config: QdrantConfig;
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: QdrantConfig) {
    this.config = config;
    this.baseUrl = config.url.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.apiKey && { 'api-key': config.apiKey })
    };
  }

  // Create collection if it doesn't exist
  async createCollection(vectorSize: number = 768): Promise<void> {
    try {
      // Check if collection exists
      const checkResponse = await fetch(
        `${this.baseUrl}/collections/${this.config.collectionName}`,
        { headers: this.headers }
      );

      if (checkResponse.ok) {
        logger.info(`Collection ${this.config.collectionName} already exists`);
        return;
      }

      // Create collection
      const response = await fetch(
        `${this.baseUrl}/collections/${this.config.collectionName}`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            vectors: {
              size: vectorSize,
              distance: 'Cosine'
            },
            optimizers_config: {
              default_segment_number: 2
            },
            replication_factor: 1
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create collection: ${response.statusText}`);
      }

      logger.info(`Created Qdrant collection: ${this.config.collectionName}`);
    } catch (error) {
      logger.error('Failed to create Qdrant collection:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Upsert points (add or update vectors)
  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${this.config.collectionName}/points`,
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
        const errorText = await response.text();
        logger.error('Qdrant upsert error details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: response.url
        });
        throw new Error(`Failed to upsert points: ${response.statusText} - ${errorText}`);
      }

      logger.info(`Upserted ${points.length} points to Qdrant`);
    } catch (error) {
      logger.error('Failed to upsert points:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Search for similar vectors
  async search(
    vector: number[],
    limit: number = 10,
    filter?: Record<string, unknown>
  ): Promise<QdrantSearchResult[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${this.config.collectionName}/points/search`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            vector,
            limit,
            filter,
            with_payload: true,
            with_vector: false
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      logger.error('Qdrant search failed:', error as Record<string, unknown>);
      return [];
    }
  }

  // Delete points by IDs
  async deletePoints(ids: (number)[]): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/collections/${this.config.collectionName}/points/delete`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            points: ids
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete points: ${response.statusText}`);
      }

      logger.info(`Deleted ${ids.length} points from Qdrant`);
    } catch (error) {
      logger.error('Failed to delete points:', error as Record<string, unknown>);
      throw error;
    }
  }
}

// Initialize Qdrant client
let qdrantClient: QdrantClient | null = null;

export function initializeQdrant(): QdrantClient {
  if (!qdrantClient) {
    const config: QdrantConfig = {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.QDRANT_COLLECTION || 'agriko_products'
    };

    qdrantClient = new QdrantClient(config);
  }

  return qdrantClient;
}

// Simple text embedding using TF-IDF (fallback when no embedding model)
function createSimpleEmbedding(text: string, dimensions: number = 768): number[] {
  // This is a simple hash-based embedding for demonstration
  // In production, use a proper embedding model like:
  // - OpenAI embeddings
  // - Sentence Transformers
  // - Universal Sentence Encoder

  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(dimensions).fill(0);

  words.forEach((word) => {
    // Simple hash function to distribute words across dimensions
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Distribute word impact across embedding
    const baseIdx = Math.abs(hash) % dimensions;
    embedding[baseIdx] += 1.0 / Math.sqrt(words.length);

    // Add some neighboring dimensions for smoothness
    if (baseIdx > 0) embedding[baseIdx - 1] += 0.5 / Math.sqrt(words.length);
    if (baseIdx < dimensions - 1) embedding[baseIdx + 1] += 0.5 / Math.sqrt(words.length);
  });

  // Normalize the vector
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    return embedding.map(val => val / norm);
  }

  return embedding;
}

// Create embedding for a product
export function createProductEmbedding(product: WCProduct): number[] {
  // Combine relevant text fields
  const textParts = [
    product.name,
    product.short_description?.replace(/<[^>]*>/g, ''),
    product.categories?.map(c => c.name).join(' '),
    product.tags?.map(t => t.name).join(' '),
    product.attributes?.map(a => a.options?.join(' ')).join(' ')
  ].filter(Boolean).join(' ');

  return createSimpleEmbedding(textParts);
}

// Index products in Qdrant
export async function indexProducts(products: WCProduct[]): Promise<void> {
  const client = initializeQdrant();

  // Create collection if needed (768 dimensions for MPNet)
  await client.createCollection(768);

  // Create points for each product
  const points: QdrantPoint[] = products.map(product => ({
    id: product.id,
    vector: createProductEmbedding(product),
    payload: {
      name: product.name,
      slug: product.slug,
      price: product.price ? parseFloat(product.price.toString()) : (0 as Core.Money),
      sale_price: product.sale_price ? parseFloat(product.sale_price.toString()) : null,
      categories: product.categories?.map(c => c.slug) || [],
      tags: product.tags?.map(t => t.slug) || [],
      in_stock: product.stock_status === 'instock',
      featured: ('featured' in product && product.featured) || false,
      image: product.images?.[0]?.src || '',
      short_description: product.short_description?.replace(/<[^>]*>/g, '').slice(0, 200),
      total_sales: ('total_sales' in product && typeof product.total_sales === 'number' ? product.total_sales : 0),
      average_rating: product.average_rating || '0',
      indexed_at: new Date().toISOString()
    }
  }));

  // Batch upload in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < points.length; i += chunkSize) {
    const chunk = points.slice(i, i + chunkSize);
    await client.upsertPoints(chunk);
  }

  logger.info(`Indexed ${products.length} products in Qdrant`);
}

// Search products using Qdrant
export async function searchWithQdrant(
  query: string,
  options: {
    limit?: number;
    category?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<Array<QdrantSearchResult & { product?: WCProduct }>> {
  const client = initializeQdrant();

  // Create query embedding
  const queryVector = createSimpleEmbedding(query);

  // Build filter
  const must: Record<string, unknown>[] = [];

  if (options.category) {
    must.push({
      key: 'categories',
      match: { any: [options.category] }
    });
  }

  if (options.inStock !== undefined) {
    must.push({
      key: 'in_stock',
      match: { value: options.inStock }
    });
  }

  if (options.minPrice !== undefined) {
    must.push({
      key: 'price',
      range: { gte: options.minPrice }
    });
  }

  if (options.maxPrice !== undefined) {
    must.push({
      key: 'price',
      range: { lte: options.maxPrice }
    });
  }

  const filter = must.length > 0 ? { must } : undefined;

  // Perform search
  const results = await client.search(
    queryVector,
    options.limit || 20,
    filter
  );

  return results;
}

// Hybrid search combining Qdrant vector search with keyword matching
export async function hybridQdrantSearch(
  query: string,
  options: {
    limit?: number;
    category?: string;
    inStock?: boolean;
    semanticWeight?: number; // 0-1, how much to weight semantic vs keyword
  } = {}
): Promise<Array<{
  id: number;
  score: number;
  payload: Record<string, unknown>;
  matchType: 'semantic' | 'keyword' | 'hybrid';
}>> {
  const { limit = 20, semanticWeight = 0.7 } = options;

  // Get semantic results from Qdrant
  const semanticResults = await searchWithQdrant(query, {
    ...options,
    limit: limit * 2 // Get more to allow for merging
  });

  // Simple keyword matching on the payloads
  const queryWords = query.toLowerCase().split(/\s+/);
  const keywordScores = new Map<number, number>();

  semanticResults.forEach(result => {
    let keywordScore = 0;
    const name = (typeof result.payload.name === 'string' ? result.payload.name : '').toLowerCase();
    const description = (typeof result.payload.short_description === 'string' ? result.payload.short_description : '').toLowerCase();

    queryWords.forEach(word => {
      if (name.includes(word)) keywordScore += 2;
      if (description.includes(word)) keywordScore += 1;
    });

    if (keywordScore > 0) {
      keywordScores.set(result.id, keywordScore / (queryWords.length * 3)); // Normalize
    }
  });

  // Combine scores
  const combinedResults = semanticResults.map(result => {
    const semanticScore = result.score;
    const keywordScore = keywordScores.get(result.id) || 0;

    const combinedScore = (semanticScore * semanticWeight) +
                         (keywordScore * (1 - semanticWeight));

    const matchType: 'semantic' | 'keyword' | 'hybrid' = keywordScore > 0 && semanticScore > 0 ? 'hybrid' :
                     keywordScore > 0 ? 'keyword' : 'semantic';

    return {
      ...result,
      score: combinedScore,
      matchType
    };
  });

  // Sort by combined score and limit
  combinedResults.sort((a, b) => b.score - a.score);
  return combinedResults.slice(0, limit);
}

// Safe wrapper for upserting vectors with error handling
export async function safeUpsertVectors(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: Record<string, unknown>;
  }>,
  collectionName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = initializeQdrant();

    // Use blog collection for blog posts, default collection for products
    const targetCollection = collectionName || process.env.QDRANT_COLLECTION || 'agriko_products';

    // Determine dimensions based on collection type
    const dimensions = targetCollection.includes('blog') ? 768 : 384;

    // Create a new client instance for the target collection
    const blogClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: targetCollection
    });

    // Ensure collection exists with correct dimensions
    await blogClient.createCollection(dimensions);

    // Convert to Qdrant point format
    const points: QdrantPoint[] = vectors.map(v => ({
      id: typeof v.id === 'string' ? parseInt(v.id, 10) || Date.now() : v.id,
      vector: v.values,
      payload: v.metadata
    }));

    // Upsert points
    await blogClient.upsertPoints(points);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to upsert vectors to Qdrant:', {
      error: errorMessage,
      collectionName: collectionName || 'default'
    });
    return { success: false, error: errorMessage };
  }
}

// Search by text query (simple wrapper for searchWithQdrant)
export async function searchByText(
  query: string,
  options: {
    limit?: number;
    category?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<Array<QdrantSearchResult & { product?: WCProduct }>> {
  return searchWithQdrant(query, options);
}

// Search for similar vectors with advanced filtering (for blog posts)
export async function searchSimilarVectors(options: {
  vector: number[];
  limit?: number;
  filter?: Record<string, unknown>;
}): Promise<{ success: boolean; results?: QdrantSearchResult[]; error?: string }> {
  try {
    const client = initializeQdrant();

    const results = await client.search(
      options.vector,
      options.limit || 10,
      options.filter
    );

    return { success: true, results };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to search similar vectors:', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

// Delete vectors by IDs (for blog post cleanup)
export async function deleteVectors(ids: (number)[]): Promise<{ success: boolean; error?: string }> {
  try {
    const client = initializeQdrant();
    await client.deletePoints(ids);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to delete vectors:', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

// Health check for Qdrant
export async function checkQdrantHealth(): Promise<boolean> {
  try {
    const client = initializeQdrant();
    const response = await fetch(
      `${client.baseUrl}/collections`,
      { headers: client.headers }
    );
    return response.ok;
  } catch (error) {
    logger.error('Qdrant health check failed:', error);
    return false;
  }
}