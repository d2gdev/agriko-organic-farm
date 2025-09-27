// Business Intelligence - Semantic Database Integration with Qdrant
import { logger } from '@/lib/logger';
import type { ExtractedData } from './data-processor';

// Qdrant integration interfaces
interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

interface QdrantSearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

interface QdrantCollection {
  name: string;
  vectorSize: number;
  distance: 'Cosine' | 'Euclidean' | 'Dot';
}

interface SemanticAnalysisResult {
  similarity: number;
  relatedCompetitors: Array<{
    id: string;
    name: string;
    similarity: number;
    reasons: string[];
  }>;
  marketSegments: Array<{
    segment: string;
    relevance: number;
    keywords: string[];
  }>;
  strategicInsights: Array<{
    type: 'opportunity' | 'threat' | 'trend';
    description: string;
    confidence: number;
  }>;
}

export class SemanticSearchService {
  private baseUrl: string;
  private apiKey: string;
  private static instance: SemanticSearchService | null = null;

  // Collection names for different data types
  private readonly collections = {
    competitors: 'bi_competitors',
    products: 'bi_products',
    market_segments: 'bi_market_segments',
    industry_analysis: 'bi_industry_analysis',
    news_sentiment: 'bi_news_sentiment'
  };

  private constructor() {
    this.baseUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    this.apiKey = process.env.QDRANT_API_KEY || '';

    logger.info('Semantic search service initialized', {
      baseUrl: this.baseUrl,
      hasApiKey: Boolean(this.apiKey)
    });
  }

  public static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService();
    }
    return SemanticSearchService.instance;
  }

  // Initialize collections for business intelligence
  async initializeCollections(): Promise<void> {
    try {
      logger.info('Initializing Qdrant collections for business intelligence...');

      const collectionsToCreate: QdrantCollection[] = [
        {
          name: this.collections.competitors,
          vectorSize: 384, // Using sentence-transformers/all-MiniLM-L6-v2 dimensions
          distance: 'Cosine'
        },
        {
          name: this.collections.products,
          vectorSize: 384,
          distance: 'Cosine'
        },
        {
          name: this.collections.market_segments,
          vectorSize: 384,
          distance: 'Cosine'
        },
        {
          name: this.collections.industry_analysis,
          vectorSize: 384,
          distance: 'Cosine'
        },
        {
          name: this.collections.news_sentiment,
          vectorSize: 384,
          distance: 'Cosine'
        }
      ];

      for (const collection of collectionsToCreate) {
        await this.createCollectionIfNotExists(collection);
      }

      logger.info('Qdrant collections initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Qdrant collections:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Store competitor semantic data
  async storeCompetitorVector(
    competitorId: string,
    competitorData: {
      name: string;
      description: string;
      industry: string;
      keywords: string[];
      extractedData: ExtractedData;
    }
  ): Promise<void> {
    try {
      logger.debug('Storing competitor vector', { competitorId, name: competitorData.name });

      // Create text representation for embedding
      const textForEmbedding = this.createCompetitorText(competitorData);

      // Generate embedding (in real implementation, this would call an embedding service)
      const vector = await this.generateEmbedding(textForEmbedding);

      const point: QdrantPoint = {
        id: competitorId,
        vector,
        payload: {
          name: competitorData.name,
          description: competitorData.description,
          industry: competitorData.industry,
          keywords: competitorData.keywords,
          urls: competitorData.extractedData.urls,
          socialMedia: competitorData.extractedData.socialMedia,
          createdAt: new Date().toISOString(),
          type: 'competitor'
        }
      };

      await this.upsertPoint(this.collections.competitors, point);

      logger.info('Competitor vector stored successfully', { competitorId });
    } catch (error) {
      logger.error('Failed to store competitor vector:', {
        competitorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Store product semantic data
  async storeProductVector(
    productId: string,
    productData: {
      name: string;
      description: string;
      category: string;
      features: string[];
      competitorId: string;
      price?: number;
    }
  ): Promise<void> {
    try {
      logger.debug('Storing product vector', { productId, name: productData.name });

      const textForEmbedding = this.createProductText(productData);
      const vector = await this.generateEmbedding(textForEmbedding);

      const point: QdrantPoint = {
        id: productId,
        vector,
        payload: {
          name: productData.name,
          description: productData.description,
          category: productData.category,
          features: productData.features,
          competitorId: productData.competitorId,
          price: productData.price,
          createdAt: new Date().toISOString(),
          type: 'product'
        }
      };

      await this.upsertPoint(this.collections.products, point);

      logger.info('Product vector stored successfully', { productId });
    } catch (error) {
      logger.error('Failed to store product vector:', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Find similar competitors
  async findSimilarCompetitors(
    competitorId: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<Array<{
    id: string;
    name: string;
    similarity: number;
    industry: string;
  }>> {
    try {
      logger.debug('Finding similar competitors', { competitorId, limit, threshold });

      const results = await this.searchSimilar(
        this.collections.competitors,
        competitorId,
        limit + 1, // +1 to exclude self
        threshold
      );

      // Filter out the input competitor and format results
      const similarCompetitors = results
        .filter(result => result.id !== competitorId)
        .slice(0, limit)
        .map(result => ({
          id: result.id,
          name: result.payload.name as string,
          similarity: result.score,
          industry: result.payload.industry as string
        }));

      logger.info('Similar competitors found', {
        competitorId,
        foundCount: similarCompetitors.length
      });

      return similarCompetitors;
    } catch (error) {
      logger.error('Failed to find similar competitors:', {
        competitorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  // Find competing products
  async findCompetingProducts(
    productId: string,
    limit: number = 10,
    threshold: number = 0.6
  ): Promise<Array<{
    id: string;
    name: string;
    similarity: number;
    category: string;
    competitorId: string;
  }>> {
    try {
      logger.debug('Finding competing products', { productId, limit, threshold });

      const results = await this.searchSimilar(
        this.collections.products,
        productId,
        limit + 1,
        threshold
      );

      const competingProducts = results
        .filter(result => result.id !== productId)
        .slice(0, limit)
        .map(result => ({
          id: result.id,
          name: result.payload.name as string,
          similarity: result.score,
          category: result.payload.category as string,
          competitorId: result.payload.competitorId as string
        }));

      logger.info('Competing products found', {
        productId,
        foundCount: competingProducts.length
      });

      return competingProducts;
    } catch (error) {
      logger.error('Failed to find competing products:', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  // Perform semantic analysis on competitor landscape
  async analyzeCompetitorLandscape(
    industry: string,
    keywords: string[] = []
  ): Promise<SemanticAnalysisResult> {
    try {
      logger.debug('Analyzing competitor landscape', { industry, keywords });

      // Create search query from industry and keywords
      const queryText = `${industry} ${keywords.join(' ')}`;
      const queryVector = await this.generateEmbedding(queryText);

      // Search across competitors
      const competitors = await this.searchByVector(
        this.collections.competitors,
        queryVector,
        20,
        0.5
      );

      // Analyze patterns and relationships
      const analysis: SemanticAnalysisResult = {
        similarity: 0,
        relatedCompetitors: [],
        marketSegments: [],
        strategicInsights: []
      };

      // Process competitor similarities
      analysis.relatedCompetitors = competitors.map(comp => ({
        id: comp.id,
        name: comp.payload.name as string,
        similarity: comp.score,
        reasons: this.generateSimilarityReasons(comp.payload, industry, keywords)
      }));

      // Extract market segments from competitor data
      analysis.marketSegments = this.extractMarketSegments(competitors);

      // Generate strategic insights
      analysis.strategicInsights = this.generateStrategicInsights(competitors, industry);

      // Calculate overall similarity score
      analysis.similarity = competitors.length > 0
        ? competitors.reduce((sum, comp) => sum + comp.score, 0) / competitors.length
        : 0;

      logger.info('Competitor landscape analysis completed', {
        industry,
        competitorCount: analysis.relatedCompetitors.length,
        segmentCount: analysis.marketSegments.length,
        insightCount: analysis.strategicInsights.length
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze competitor landscape:', {
        industry,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        similarity: 0,
        relatedCompetitors: [],
        marketSegments: [],
        strategicInsights: []
      };
    }
  }

  // Store and analyze industry news/trends
  async storeNewsVector(
    newsId: string,
    newsData: {
      title: string;
      content: string;
      source: string;
      publishedAt: Date;
      industry: string;
      sentiment: 'positive' | 'negative' | 'neutral';
    }
  ): Promise<void> {
    try {
      const textForEmbedding = `${newsData.title} ${newsData.content}`;
      const vector = await this.generateEmbedding(textForEmbedding);

      const point: QdrantPoint = {
        id: newsId,
        vector,
        payload: {
          title: newsData.title,
          content: newsData.content.substring(0, 1000), // Limit content length
          source: newsData.source,
          publishedAt: newsData.publishedAt.toISOString(),
          industry: newsData.industry,
          sentiment: newsData.sentiment,
          type: 'news'
        }
      };

      await this.upsertPoint(this.collections.news_sentiment, point);

      logger.debug('News vector stored successfully', { newsId });
    } catch (error) {
      logger.error('Failed to store news vector:', {
        newsId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Private helper methods
  private async createCollectionIfNotExists(collection: QdrantCollection): Promise<void> {
    try {
      // Check if collection exists
      const response = await fetch(`${this.baseUrl}/collections/${collection.name}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.status === 404) {
        // Collection doesn't exist, create it
        const createResponse = await fetch(`${this.baseUrl}/collections/${collection.name}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({
            vectors: {
              size: collection.vectorSize,
              distance: collection.distance
            },
            optimizers_config: {
              default_segment_number: 2
            },
            replication_factor: 1
          })
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create collection: ${createResponse.statusText}`);
        }

        logger.info('Created Qdrant collection', { name: collection.name });
      } else if (response.ok) {
        logger.debug('Qdrant collection already exists', { name: collection.name });
      } else {
        throw new Error(`Failed to check collection: ${response.statusText}`);
      }
    } catch (error) {
      logger.error('Failed to create/check collection:', {
        collection: collection.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async upsertPoint(collectionName: string, point: QdrantPoint): Promise<void> {
    const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        points: [point]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to upsert point: ${response.statusText}`);
    }
  }

  private async searchSimilar(
    collectionName: string,
    pointId: string,
    limit: number,
    threshold: number
  ): Promise<QdrantSearchResult[]> {
    const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/recommend`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        positive: [pointId],
        limit,
        score_threshold: threshold,
        with_payload: true
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to search similar: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result || [];
  }

  private async searchByVector(
    collectionName: string,
    vector: number[],
    limit: number,
    threshold: number
  ): Promise<QdrantSearchResult[]> {
    const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        vector,
        limit,
        score_threshold: threshold,
        with_payload: true
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to search by vector: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result || [];
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['api-key'] = this.apiKey;
    }

    return headers;
  }

  // Generate embeddings using configured embedding service
  private async generateEmbedding(text: string): Promise<number[]> {
    logger.debug('Generating embedding for text', { textLength: text.length });

    // Try different embedding services in order of preference
    const embeddingService = process.env.EMBEDDING_SERVICE || 'huggingface';

    try {
      switch (embeddingService) {
        case 'openai':
          return await this.generateOpenAIEmbedding(text);
        case 'huggingface':
          return await this.generateHuggingFaceEmbedding(text);
        case 'local':
          return await this.generateLocalEmbedding(text);
        default:
          logger.warn('Unknown embedding service, falling back to deterministic hash', { embeddingService });
          return this.generateDeterministicEmbedding(text);
      }
    } catch (error) {
      logger.error('Embedding generation failed, falling back to deterministic method:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        embeddingService
      });
      return this.generateDeterministicEmbedding(text);
    }
  }

  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8192), // Limit input length
        dimensions: 384
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  private async generateHuggingFaceEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const model = process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';

    if (!apiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    const response = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text.substring(0, 512), // HuggingFace has token limits
        options: { wait_for_model: true }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const embedding = await response.json();
    return Array.isArray(embedding[0]) ? embedding[0] : embedding;
  }

  private async generateLocalEmbedding(text: string): Promise<number[]> {
    // For local deployment, this could integrate with a local embedding server
    // like sentence-transformers running locally or Ollama embeddings
    const localEndpoint = process.env.LOCAL_EMBEDDING_ENDPOINT || 'http://localhost:11434/api/embeddings';

    const response = await fetch(localEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.LOCAL_EMBEDDING_MODEL || 'nomic-embed-text',
        prompt: text.substring(0, 2048)
      })
    });

    if (!response.ok) {
      throw new Error(`Local embedding service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  private generateDeterministicEmbedding(text: string): number[] {
    // Improved deterministic embedding using multiple hash functions
    // This is still a fallback but more sophisticated than the simple version
    const vector: number[] = [];
    const textBytes = new TextEncoder().encode(text);

    for (let i = 0; i < 384; i++) {
      let hash = 0;
      for (let j = 0; j < textBytes.length; j++) {
        const byte = textBytes[j];
        hash = ((hash << 5) - hash + (byte || 0) + i) & 0xffffffff;
      }
      // Normalize to [-1, 1] for better semantic properties
      vector.push((hash / 0x7fffffff) * 0.5);
    }

    // Apply L2 normalization for cosine similarity
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? vector.map(val => val / norm) : vector;
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private createCompetitorText(data: {
    name: string;
    description: string;
    industry: string;
    keywords: string[];
  }): string {
    return `${data.name} ${data.description} ${data.industry} ${data.keywords.join(' ')}`;
  }

  private createProductText(data: {
    name: string;
    description: string;
    category: string;
    features: string[];
  }): string {
    return `${data.name} ${data.description} ${data.category} ${data.features.join(' ')}`;
  }

  private generateSimilarityReasons(payload: Record<string, unknown>, industry: string, keywords: string[]): string[] {
    const reasons: string[] = [];

    if (payload.industry === industry) {
      reasons.push('Same industry sector');
    }

    const compKeywords = payload.keywords as string[] || [];
    const commonKeywords = keywords.filter(k => compKeywords.includes(k));
    if (commonKeywords.length > 0) {
      reasons.push(`Shared keywords: ${commonKeywords.join(', ')}`);
    }

    if (reasons.length === 0) {
      reasons.push('Similar business characteristics');
    }

    return reasons;
  }

  private extractMarketSegments(competitors: QdrantSearchResult[]): Array<{
    segment: string;
    relevance: number;
    keywords: string[];
  }> {
    const segmentMap = new Map<string, { count: number; keywords: Set<string> }>();

    competitors.forEach(comp => {
      const industry = comp.payload.industry as string;
      const keywords = comp.payload.keywords as string[] || [];

      if (!segmentMap.has(industry)) {
        segmentMap.set(industry, { count: 0, keywords: new Set() });
      }

      const segment = segmentMap.get(industry);
      if (segment) {
        segment.count++;
        keywords.forEach(kw => segment.keywords.add(kw));
      }
    });

    return Array.from(segmentMap.entries()).map(([segment, data]) => ({
      segment,
      relevance: data.count / competitors.length,
      keywords: Array.from(data.keywords).slice(0, 10)
    }));
  }

  private generateStrategicInsights(competitors: QdrantSearchResult[], industry: string): Array<{
    type: 'opportunity' | 'threat' | 'trend';
    description: string;
    confidence: number;
  }> {
    const insights: Array<{
      type: 'opportunity' | 'threat' | 'trend';
      description: string;
      confidence: number;
    }> = [];

    if (competitors.length > 10) {
      insights.push({
        type: 'threat',
        description: `Highly competitive market in ${industry} with ${competitors.length} similar players`,
        confidence: 0.8
      });
    } else if (competitors.length < 3) {
      insights.push({
        type: 'opportunity',
        description: `Emerging market opportunity in ${industry} with limited competition`,
        confidence: 0.7
      });
    }

    // Analyze keyword trends
    const allKeywords = competitors.flatMap(comp => comp.payload.keywords as string[] || []);
    const keywordCounts = allKeywords.reduce((acc, kw) => {
      acc[kw] = (acc[kw] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendingKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([kw]) => kw);

    if (trendingKeywords.length > 0) {
      insights.push({
        type: 'trend',
        description: `Trending themes in ${industry}: ${trendingKeywords.join(', ')}`,
        confidence: 0.6
      });
    }

    return insights;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      collectionsReady: boolean;
      lastError?: string;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const connected = response.ok;
      let collectionsReady = false;

      if (connected) {
        // Check if main collections exist
        const collectionsResponse = await fetch(`${this.baseUrl}/collections`, {
          method: 'GET',
          headers: this.getHeaders()
        });

        if (collectionsResponse.ok) {
          const data = await collectionsResponse.json();
          const existingCollections = data.result?.collections || [];
          const requiredCollections = Object.values(this.collections);

          collectionsReady = requiredCollections.every(name =>
            existingCollections.some((col: { name: string }) => col.name === name)
          );
        }
      }

      return {
        status: connected && collectionsReady ? 'healthy' : 'unhealthy',
        details: {
          connected,
          collectionsReady
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          collectionsReady: false,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export singleton instance
export const semanticSearchService = SemanticSearchService.getInstance();