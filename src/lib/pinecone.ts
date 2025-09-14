import { Pinecone, Index } from '@pinecone-database/pinecone';
import { generateEmbedding } from './embeddings';
import { logger } from './logger';
import { handleError } from './error-sanitizer';
import type { 
  PineconeVector, 
  PineconeQueryResponse, 
  PineconeUpsertResponse, 
  PineconeIndexStats 
} from '@/types/api-responses';

let _pinecone: Pinecone | null = null;
let _index: Index | null = null;

// Define type for Pinecone index stats
interface PineconeIndexStatsResponse {
  totalRecordCount?: number;
  totalVectorCount?: number;
  dimension?: number;
  indexFullness?: number;
  namespaces?: Record<string, unknown>;
}

// Define a response type that includes success status
type SearchVectorsResponse = {
  success: boolean;
  matches?: Array<{
    id: string;
    score?: number;
    values?: number[];
    metadata?: Record<string, unknown>;
  }>;
  error?: unknown;
  configurationIssue?: boolean;
  configurationError?: string;
}

/**
 * Validate Pinecone configuration before operations
 */
function validatePineconeConfig(): { isValid: boolean; error?: string } {
  const { PINECONE_API_KEY, PINECONE_INDEX_NAME } = process.env;
  
  if (!PINECONE_API_KEY) {
    return { isValid: false, error: 'PINECONE_API_KEY environment variable is required' };
  }
  
  if (!PINECONE_INDEX_NAME) {
    return { isValid: false, error: 'PINECONE_INDEX_NAME environment variable is required' };
  }
  
  if (PINECONE_API_KEY.length < 20) {
    return { isValid: false, error: 'PINECONE_API_KEY appears to be invalid (too short)' };
  }
  
  return { isValid: true };
}

/**
 * Public function to check if Pinecone is properly configured
 * Use this before attempting Pinecone operations to prevent silent failures
 */
export function isPineconeConfigured(): { configured: boolean; error?: string } {
  const configCheck = validatePineconeConfig();
  return { 
    configured: configCheck.isValid, 
    error: configCheck.error 
  };
}

function ensureIndex(): Index {
  const configCheck = validatePineconeConfig();
  if (!configCheck.isValid) {
    const error = new Error(`Pinecone configuration error: ${configCheck.error}`);
    logger.error('❌ Pinecone configuration validation failed:', handleError(error, 'ensureIndex'));
    throw error;
  }

  const { PINECONE_API_KEY, PINECONE_INDEX_NAME } = process.env;
  
  try {
    if (PINECONE_API_KEY && PINECONE_INDEX_NAME) {
      _pinecone ??= new Pinecone({ apiKey: PINECONE_API_KEY });
      if (!_index && _pinecone) {
        _index = _pinecone.Index(PINECONE_INDEX_NAME);
      }
    }
    
    if (!_index) {
      throw new Error('Failed to initialize Pinecone index - index is null');
    }
    
    return _index;
  } catch (error) {
    const errorData = handleError(error, 'ensureIndex', { 
      hasApiKey: !!PINECONE_API_KEY, 
      hasIndexName: !!PINECONE_INDEX_NAME 
    });
    logger.error('❌ Pinecone index initialization failed:', errorData);
    throw error;
  }
}

export async function testConnection() {
  try {
    // Validate configuration first to provide clear error messages
    const configCheck = validatePineconeConfig();
    if (!configCheck.isValid) {
      const error = new Error(`❌ Pinecone configuration error: ${configCheck.error}`);
      const errorData = handleError(error, 'testConnection');
      logger.error('❌ Pinecone configuration validation failed during connection test:', errorData);
      return {
        success: false,
        error: configCheck.error,
        configurationIssue: true,
      };
    }

    const index = ensureIndex();
    const stats = await index.describeIndexStats() as PineconeIndexStatsResponse;
    const vectorCount = stats.totalRecordCount ?? stats.totalVectorCount ?? 0;
    
    logger.info('✅ Pinecone connection successful', {
      totalVectorCount: vectorCount,
      dimension: stats.dimension ?? 0,
      indexFullness: stats.indexFullness,
    }, 'pinecone');
    
    return {
      success: true,
      totalVectorCount: vectorCount,
      dimension: stats.dimension ?? 0,
      namespaces: stats.namespaces ?? {},
    };
  } catch (error) {
    const errorData = handleError(error, 'testConnection');
    logger.error('❌ Pinecone connection test failed:', errorData);
    
    // Check if this is a configuration issue
    const configCheck = validatePineconeConfig();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      configurationIssue: !configCheck.isValid,
      configurationError: configCheck.error,
    };
  }
}

export async function safeUpsertVectors(vectors: PineconeVector[]) {
  if (!vectors || vectors.length === 0) {
    logger.warn('⚠️ Attempted to upsert empty vector array', undefined, 'pinecone');
    return { success: true, count: 0, message: 'No vectors to upsert' };
  }

  try {
    const index = ensureIndex();
    const vectorsWithSource = vectors.map(vector => ({
      ...vector,
      id: `agriko_${vector.id}`,
      metadata: {
        ...vector.metadata,
        source: 'agriko',
        timestamp: new Date().toISOString(),
      },
    }));

    await index.upsert(vectorsWithSource);
    logger.info(`✅ Successfully upserted ${vectors.length} vectors with agriko_ prefix`, undefined, 'pinecone');
    return { success: true, count: vectors.length };
  } catch (error) {
    const errorData = handleError(error, 'safeUpsertVectors', { 
      vectorCount: vectors.length,
      firstVectorId: vectors[0]?.id 
    });
    logger.error('❌ Vector upsert failed - this will affect search functionality:', errorData);
    
    // Check if this is a configuration issue
    const configCheck = validatePineconeConfig();
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      configurationIssue: !configCheck.isValid,
      configurationError: configCheck.error,
      count: 0 
    };
  }
}

export async function searchVectors(
  vector: number[],
  options: {
    topK?: number;
    filter?: Record<string, unknown>;
    includeMetadata?: boolean;
    includeValues?: boolean;
    minScore?: number;
  } = {}
): Promise<SearchVectorsResponse> {
  if (!vector || vector.length === 0) {
    logger.warn('⚠️ Attempted to search with empty vector', undefined, 'pinecone');
    return { success: false, error: 'Empty vector provided for search', matches: [] };
  }

  try {
    const index = ensureIndex();
    const defaultFilter = { source: { $eq: 'agriko' } };
    const filter = options.filter
      ? { $and: [defaultFilter, options.filter] }
      : defaultFilter;

    const results = await index.query({
      vector,
      topK: options.topK ?? 10,
      filter,
      includeMetadata: options.includeMetadata !== false,
      includeValues: options.includeValues ?? false,
    });

    const minScore = options.minScore ?? 0.3;
    const filteredMatches = (results.matches ?? []).filter((match) => (match.score ?? 0) >= minScore);

    logger.debug(`✅ Vector search: ${results.matches?.length || 0} total matches, ${filteredMatches.length} above threshold (${minScore})`, undefined, 'pinecone');

    return { success: true, matches: filteredMatches };
  } catch (error) {
    const errorData = handleError(error, 'searchVectors', { 
      vectorLength: vector.length,
      topK: options.topK,
      hasFilter: !!options.filter 
    });
    logger.error('❌ Vector search failed - search functionality unavailable:', errorData);
    
    // Check if this is a configuration issue
    const configCheck = validatePineconeConfig();
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      configurationIssue: !configCheck.isValid,
      configurationError: configCheck.error,
      matches: [] 
    };
  }
}

export async function searchByText(
  query: string,
  options: {
    topK?: number;
    filter?: Record<string, unknown>;
    includeMetadata?: boolean;
    minScore?: number;
  } = {}
) {
  if (!query || query.trim().length === 0) {
    logger.warn('⚠️ Attempted to search with empty query', undefined, 'pinecone');
    return { success: false, error: 'Empty query provided for search', matches: [] };
  }

  try {
    logger.debug(`🔍 Generating embedding for search query: "${query}"`, undefined, 'pinecone');
    const queryVector = await generateEmbedding(query);

    const results = await searchVectors(queryVector, options);

    // Check if searchVectors failed
    if (!results.success) {
      const error = new Error(`Search vectors failed: ${results.error}`);
      const errorData = handleError(error, 'searchByText', { 
        query, 
        originalError: results.error,
        configurationIssue: results.configurationIssue 
      });
      logger.error('❌ Text search failed due to vector search failure:', errorData);
      
      return { 
        success: false, 
        error: `Text search unavailable: ${String(results.error)}`,
        configurationIssue: Boolean(results.configurationIssue),
        configurationError: results.configurationError ? String(results.configurationError) : undefined,
        matches: [] 
      };
    }

    if (!results.matches || results.matches.length === 0) {
      logger.info(`ℹ️ No relevant results found for query: "${query}"`, { query }, 'pinecone');
      return { success: true, matches: [] };
    }

    logger.info(`✅ Found ${results.matches.length} semantic matches for query: "${query}"`, undefined, 'pinecone');
    return { success: true, matches: results.matches };
  } catch (error) {
    const errorData = handleError(error, 'searchByText', { 
      query, 
      queryLength: query.length,
      options 
    });
    logger.error('❌ Text search failed - semantic search unavailable:', errorData);
    
    // Check if this is a configuration issue
    const configCheck = validatePineconeConfig();
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      configurationIssue: !configCheck.isValid,
      configurationError: configCheck.error,
      matches: [] 
    };
  }
}

export async function searchSimilarProducts(
  productId: string,
  limit: number = 5
) {
  try {
    logger.debug(`Finding similar products to: ${productId}`, undefined, 'pinecone');
    const index = ensureIndex();
    // Retrieve base vector by querying with id
    const base = await index.query({
      id: `agriko_${productId}`,
      topK: 1,
      includeValues: true,
      includeMetadata: true,
    });
    const baseMatch = base.matches?.[0];
    if (!baseMatch?.values) {
      return [];
    }
    // Query by vector for similar items
    const similar = await index.query({
      vector: baseMatch.values,
      topK: limit + 1,
      includeMetadata: true,
    });
    const results = (similar.matches ?? [])
      .filter((m) => m.id !== `agriko_${productId}`)
      .slice(0, limit)
      .map((m) => ({
        id: m.metadata?.productId ?? m.id?.replace('agriko_', ''),
        title: m.metadata?.title ?? 'Unknown Product',
        slug: m.metadata?.slug ?? '',
        price: m.metadata?.price ?? 0,
        categories: m.metadata?.categories ?? [],
        inStock: m.metadata?.inStock ?? false,
        featured: m.metadata?.featured ?? false,
        relevanceScore: m.score ?? 0,
      }));
    logger.info(`Found ${results.length} similar products`, undefined, 'pinecone');
    return results;
  } catch (error) {
    logger.error('Similar products search failed', error as Record<string, unknown>, 'pinecone');
    return [];
  }
}

// Helper to extract numeric product IDs from Pinecone matches
export function extractProductIdsFromMatches(matches: Array<{ metadata?: Record<string, unknown> }>): number[] {
  return matches
    .filter(match => {
      const meta = match.metadata;
      return meta?.type === 'product' || meta?.productId !== undefined || meta?.id !== undefined;
    })
    .map(match => {
      const meta = match.metadata ?? {};
      const idValue = meta.productId ?? meta.id;
      if (typeof idValue === 'string') {
        const parsed = parseInt(idValue, 10);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      if (typeof idValue === 'number') {
        return idValue;
      }
      return 0;
    })
    .filter((id: number) => Number.isFinite(id) && id > 0);
}