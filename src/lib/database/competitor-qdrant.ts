/**
 * Competitor Data Storage using Qdrant Vector Database
 * This replaces the SQLite/Prisma implementation with semantic search capabilities
 */

import { qdrantClient } from '@/lib/qdrant-extended';
import { logger } from '@/lib/logger';
import { generateEmbedding } from '@/lib/embeddings';
import { handleError } from '@/lib/error-sanitizer';

// Collection names
const COMPETITORS_COLLECTION = 'competitors';
const PRODUCTS_COLLECTION = 'competitor_products';
const JOBS_COLLECTION = 'scraping_jobs';

// Types
interface Competitor {
  id: string;
  key: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  selectors: Record<string, string>;
  currency: string;
  currencySymbol: string;
  decimalSeparator: string;
  rateLimitMs: number;
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

interface ScrapingJob {
  id: string;
  competitorId: string;
  competitor?: Competitor;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalUrls: number;
  successCount: number;
  errorCount: number;
  urls: string[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface ScrapedProduct {
  id: string;
  competitorId: string;
  jobId?: string;
  url: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  availability: string;
  stockLevel?: number;
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  category?: string;
  tags?: string[];
  embedding?: number[]; // Vector embedding for semantic search
  scrapedAt: Date;
  lastChecked: Date;
}

// Initialize collections
async function initializeCollections() {
  try {
    // Create competitors collection (smaller vectors for metadata)
    await qdrantClient.createCollection(COMPETITORS_COLLECTION, {
      vectorSize: 384, // Smaller embedding for competitor metadata
      onDiskPayload: false
    });

    // Create products collection (larger vectors for semantic search)
    await qdrantClient.createCollection(PRODUCTS_COLLECTION, {
      vectorSize: 768, // Standard embedding size for product descriptions
      onDiskPayload: true,
      indexingThreshold: 10000
    });

    // Create jobs collection
    await qdrantClient.createCollection(JOBS_COLLECTION, {
      vectorSize: 128, // Small embedding for job metadata
      onDiskPayload: false
    });

    logger.info('Qdrant collections initialized for competitor data');
  } catch (error) {
    logger.error('Failed to initialize Qdrant collections:', handleError(error, 'competitor-qdrant-init'));
    throw error;
  }
}

// Competitor CRUD operations
export const competitorDb = {
  // Get all competitors
  async getAll(includeDisabled = false): Promise<Competitor[]> {
    try {
      const filter = includeDisabled ? {} : { must: [{ key: 'enabled', match: { value: true } }] };

      const results = await qdrantClient.scroll(COMPETITORS_COLLECTION, {
        filter,
        limit: 100,
        with_payload: true,
        with_vector: false
      });

      return results.points.map(point => ({
        id: String(point.id),
        ...point.payload as Omit<Competitor, 'id'>
      }));
    } catch (error) {
      logger.error('Failed to get competitors:', handleError(error, 'competitor-get-all'));
      return [];
    }
  },

  // Get competitor by key
  async getByKey(key: string): Promise<Competitor | null> {
    try {
      const results = await qdrantClient.search(COMPETITORS_COLLECTION, {
        filter: {
          must: [{ key: 'key', match: { value: key } }]
        },
        limit: 1,
        with_payload: true
      });

      if (results.length === 0) return null;

      const result = results && results[0];
      if (!result) return null;

      return {
        id: String(result.id),
        ...result.payload as Omit<Competitor, 'id'>
      };
    } catch (error) {
      logger.error(`Failed to get competitor by key ${key}:`, handleError(error, 'competitor-get-by-key'));
      return null;
    }
  },

  // Create competitor
  async create(data: Omit<Competitor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Competitor> {
    const competitor: Competitor = {
      ...data,
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Generate embedding for competitor metadata
      const embedding = await generateEmbedding(
        `${competitor.name} ${competitor.baseUrl} ${competitor.key}`
      );

      await qdrantClient.upsert(COMPETITORS_COLLECTION, [{
        id: parseInt(competitor.id, 10) || Date.now(),
        vector: embedding,
        payload: competitor as any
      }]);

      logger.info(`Created competitor: ${competitor.name}`);
      return competitor;
    } catch (error) {
      logger.error('Failed to create competitor:', handleError(error, 'competitor-create'));
      throw error;
    }
  },

  // Update competitor
  async update(key: string, data: Partial<Omit<Competitor, 'id' | 'key' | 'createdAt'>>): Promise<Competitor> {
    const existing = await this.getByKey(key);
    if (!existing) {
      throw new Error('Competitor not found');
    }

    const updated: Competitor = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    try {
      // Update embedding if name/URL changed
      if (data.name || data.baseUrl) {
        const embedding = await generateEmbedding(
          `${updated.name} ${updated.baseUrl} ${updated.key}`
        );

        await qdrantClient.upsert(COMPETITORS_COLLECTION, [{
          id: parseInt(updated.id, 10) || Date.now(),
          vector: embedding,
          payload: updated as any
        }]);
      } else {
        // Just update payload
        await qdrantClient.setPayload(COMPETITORS_COLLECTION, {
          points: [parseInt(updated.id, 10) || Date.now()],
          payload: updated as any
        });
      }

      logger.info(`Updated competitor: ${updated.name}`);
      return updated;
    } catch (error) {
      logger.error('Failed to update competitor:', handleError(error, 'competitor-update'));
      throw error;
    }
  },

  // Delete competitor
  async delete(key: string): Promise<void> {
    const competitor = await this.getByKey(key);
    if (!competitor) {
      throw new Error('Competitor not found');
    }

    try {
      await qdrantClient.delete(COMPETITORS_COLLECTION, {
        points: [parseInt(competitor.id, 10) || Date.now()]
      });

      logger.info(`Deleted competitor: ${competitor.name}`);
    } catch (error) {
      logger.error('Failed to delete competitor:', handleError(error, 'competitor-delete'));
      throw error;
    }
  },

  // Toggle enabled status
  async toggleEnabled(key: string, enabled: boolean): Promise<Competitor> {
    return this.update(key, { enabled });
  }
};

// Scraping Job operations
export const scrapingJobDb = {
  // Create job (accepts competitorKey and urls for compatibility)
  async create(competitorKey: string, urls: string[]): Promise<ScrapingJob> {
    // Get competitor by key to get ID
    const competitor = await competitorDb.getByKey(competitorKey);
    if (!competitor) {
      throw new Error(`Competitor not found: ${competitorKey}`);
    }

    const data = {
      competitorId: competitor.id,
      totalUrls: urls.length,
      urls,
      status: 'pending'
    };

    return this.createJob(data);
  },

  // Create job with data object
  async createJob(data: {
    competitorId: string;
    totalUrls: number;
    urls: string[];
    status?: string;
  }): Promise<ScrapingJob> {
    const job: ScrapingJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      competitorId: data.competitorId,
      status: (data.status || 'pending') as ScrapingJob['status'],
      totalUrls: data.totalUrls,
      urls: data.urls,
      successCount: 0,
      errorCount: 0,
      createdAt: new Date()
    };

    try {
      // Simple embedding for job metadata
      const embedding = new Array(128).fill(0).map(() => Math.random());

      await qdrantClient.upsert(JOBS_COLLECTION, [{
        id: parseInt(job.id, 10) || Date.now(),
        vector: embedding,
        payload: job as any
      }]);

      logger.info(`Created scraping job: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('Failed to create job:', handleError(error, 'scraping-job-create'));
      throw error;
    }
  },

  // Update job status (compatibility method)
  async updateStatus(id: string, status: ScrapingJob['status'], additionalData?: Record<string, unknown>): Promise<ScrapingJob> {
    return this.update(id, {
      status,
      ...(additionalData || {})
    });
  },

  // Update job
  async update(id: string, data: Partial<Omit<ScrapingJob, 'id' | 'createdAt'>>): Promise<ScrapingJob> {
    try {
      const points = await qdrantClient.retrieve(JOBS_COLLECTION, {
        ids: [parseInt(id, 10)],
        with_payload: true
      });

      if (points.length === 0) {
        throw new Error('Job not found');
      }

      const updated = {
        ...points[0]?.payload,
        ...data
      };

      await qdrantClient.setPayload(JOBS_COLLECTION, {
        points: [parseInt(id, 10)],
        payload: updated as any
      });

      return updated as ScrapingJob;
    } catch (error) {
      logger.error('Failed to update job:', handleError(error, 'scraping-job-update'));
      throw error;
    }
  },

  // Complete job
  async complete(id: string, successCount: number, errorCount: number): Promise<ScrapingJob> {
    return this.update(id, {
      status: 'completed',
      successCount,
      errorCount,
      completedAt: new Date()
    });
  },

  // Get pending jobs
  async getPending(limit = 10): Promise<ScrapingJob[]> {
    try {
      const results = await qdrantClient.scroll(JOBS_COLLECTION, {
        filter: {
          must: [{ key: 'status', match: { value: 'pending' } }]
        },
        limit,
        with_payload: true,
        with_vector: false,
        order_by: { key: 'createdAt', direction: 'asc' }
      });

      const jobs = results.points.map(point => ({
        id: String(point.id),
        ...point.payload as Omit<ScrapingJob, 'id'>
      }));

      // Attach competitor data
      for (const job of jobs) {
        const competitor = await competitorDb.getByKey(job.competitorId);
        if (competitor) {
          job.competitor = competitor;
        }
      }

      return jobs;
    } catch (error) {
      logger.error('Failed to get pending jobs:', handleError(error, 'scraping-job-get-pending'));
      return [];
    }
  },

  // Get recent jobs
  async getRecent(limit = 20): Promise<ScrapingJob[]> {
    try {
      const results = await qdrantClient.scroll(JOBS_COLLECTION, {
        limit,
        with_payload: true,
        with_vector: false,
        order_by: { key: 'createdAt', direction: 'desc' }
      });

      // Fetch competitors for each job
      const jobs = results.points.map(point => ({
        id: String(point.id),
        ...point.payload as Omit<ScrapingJob, 'id'>
      }));

      // Attach competitor data
      for (const job of jobs) {
        const competitor = await competitorDb.getByKey(job.competitorId);
        if (competitor) {
          job.competitor = competitor;
        }
      }

      return jobs;
    } catch (error) {
      logger.error('Failed to get recent jobs:', handleError(error, 'scraping-job-get-recent'));
      return [];
    }
  }
};

// Scraped Product operations
export const scrapedProductDb = {
  // Save scraped products (accepts competitorKey for compatibility)
  async saveMany(
    competitorKey: string,
    jobId: string,
    productsData: Array<Omit<ScrapedProduct, 'id' | 'competitorId' | 'jobId' | 'scrapedAt' | 'lastChecked' | 'embedding'>>
  ): Promise<ScrapedProduct[]> {
    // Get competitor by key to get ID
    const competitor = await competitorDb.getByKey(competitorKey);
    if (!competitor) {
      throw new Error(`Competitor not found: ${competitorKey}`);
    }

    return this.saveManyByCompetitorId(competitor.id, jobId, productsData);
  },

  // Save scraped products by competitor ID
  async saveManyByCompetitorId(
    competitorId: string,
    jobId: string,
    productsData: Array<Omit<ScrapedProduct, 'id' | 'competitorId' | 'jobId' | 'scrapedAt' | 'lastChecked' | 'embedding'>>
  ): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    for (const data of productsData) {
      const product: ScrapedProduct = {
        ...data,
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        competitorId,
        jobId,
        scrapedAt: new Date(),
        lastChecked: new Date()
      };

      try {
        // Generate embedding for semantic search
        const textForEmbedding = `${product.title} ${product.description || ''} ${product.brand || ''} ${product.category || ''} ${(product.tags || []).join(' ')}`;
        product.embedding = await generateEmbedding(textForEmbedding);

        await qdrantClient.upsert(PRODUCTS_COLLECTION, [{
          id: parseInt(product.id, 10) || Date.now(),
          vector: product.embedding,
          payload: {
            ...product,
            embedding: undefined // Don't store embedding in payload
          }
        }]);

        products.push(product);
        logger.info(`Saved product: ${product.title} from ${competitorId}`);
      } catch (error) {
        logger.error(`Failed to save product ${data.title}:`, handleError(error, 'scraped-product-save'));
      }
    }

    return products;
  },

  // Search products semantically
  async searchSemantic(query: string, limit = 20): Promise<ScrapedProduct[]> {
    try {
      const queryEmbedding = await generateEmbedding(query);

      const results = await qdrantClient.search(PRODUCTS_COLLECTION, {
        vector: queryEmbedding,
        limit,
        with_payload: true
      });

      return results.map(result => ({
        id: String(result.id),
        ...result.payload as Omit<ScrapedProduct, 'id'>,
        score: result.score
      }));
    } catch (error) {
      logger.error('Failed to search products:', handleError(error, 'scraped-product-search-semantic'));
      return [];
    }
  },

  // Get products by competitor
  async getByCompetitor(competitorId: string, limit = 50): Promise<ScrapedProduct[]> {
    try {
      const results = await qdrantClient.scroll(PRODUCTS_COLLECTION, {
        filter: {
          must: [{ key: 'competitorId', match: { value: competitorId } }]
        },
        limit,
        with_payload: true,
        with_vector: false,
        order_by: { key: 'scrapedAt', direction: 'desc' }
      });

      return results.points.map(point => ({
        id: String(point.id),
        ...point.payload as Omit<ScrapedProduct, 'id'>
      }));
    } catch (error) {
      logger.error(`Failed to get products for competitor ${competitorId}:`, handleError(error, 'scraped-product-get-by-competitor'));
      return [];
    }
  },

  // Get recent products
  async getRecent(limit = 50): Promise<ScrapedProduct[]> {
    try {
      const results = await qdrantClient.scroll(PRODUCTS_COLLECTION, {
        limit,
        with_payload: true,
        with_vector: false,
        order_by: { key: 'scrapedAt', direction: 'desc' }
      });

      return results.points.map(point => ({
        id: String(point.id),
        ...point.payload as Omit<ScrapedProduct, 'id'>
      }));
    } catch (error) {
      logger.error('Failed to get recent products:', handleError(error, 'scraped-product-get-recent'));
      return [];
    }
  },

  // Find similar products
  async findSimilar(productId: string, limit = 10): Promise<ScrapedProduct[]> {
    try {
      // Get the product's embedding
      const product = await qdrantClient.retrieve(PRODUCTS_COLLECTION, {
        ids: [parseInt(productId, 10)],
        with_vector: true
      });

      if (product.length === 0) return [];

      // Search for similar products
      const results = await qdrantClient.search(PRODUCTS_COLLECTION, {
        vector: product[0]?.vector,
        limit: limit + 1, // Include self
        with_payload: true,
        filter: {
          must_not: [{ key: 'id', match: { value: productId } }] // Exclude self
        }
      });

      return results.map(result => ({
        id: String(result.id),
        ...result.payload as Omit<ScrapedProduct, 'id'>,
        similarity: result.score
      }));
    } catch (error) {
      logger.error(`Failed to find similar products for ${productId}:`, handleError(error, 'scraped-product-find-similar'));
      return [];
    }
  },

  // Price comparison across competitors
  async comparePrices(productName: string): Promise<Array<{
    competitor: string;
    product: ScrapedProduct;
    priceMatch: number;
  }>> {
    try {
      // Search for similar products across all competitors
      const products = await this.searchSemantic(productName, 50);

      // Group by competitor and find best match per competitor
      const competitorProducts = new Map<string, ScrapedProduct & { score?: number }>();

      for (const product of products) {
        const existing = competitorProducts.get(product.competitorId);
        if (!existing || ((product as { score?: number }).score && (product as { score?: number }).score! > ((existing as { score?: number }).score || 0))) {
          competitorProducts.set(product.competitorId, product);
        }
      }

      // Get competitor names
      const results = [];
      for (const [competitorId, product] of competitorProducts) {
        const competitor = await competitorDb.getByKey(competitorId);
        if (competitor) {
          results.push({
            competitor: competitor.name,
            product,
            priceMatch: (product as { score?: number }).score || 0
          });
        }
      }

      // Sort by price
      return results.sort((a, b) => a.product.price - b.product.price);
    } catch (error) {
      logger.error('Failed to compare prices:', handleError(error, 'scraped-product-compare-prices'));
      return [];
    }
  }
};

// Default competitors initialization
async function initializeDefaultCompetitors() {
  const defaultCompetitors = [
    {
      key: 'whole_foods',
      name: 'Whole Foods Market',
      baseUrl: 'https://www.wholefoodsmarket.com',
      enabled: true,
      selectors: {
        title: 'h1.product-title',
        price: '.product-price',
        availability: '.availability-status'
      },
      currency: 'USD',
      currencySymbol: '$',
      decimalSeparator: '.',
      rateLimitMs: 2000,
      headers: {}
    },
    {
      key: 'natures_basket',
      name: "Nature's Basket",
      baseUrl: 'https://www.naturesbasket.co.in',
      enabled: true,
      selectors: {
        title: '.product-name',
        price: '.product-price',
        availability: '.stock-status'
      },
      currency: 'INR',
      currencySymbol: '₹',
      decimalSeparator: '.',
      rateLimitMs: 2000,
      headers: {}
    }
  ];

  for (const competitor of defaultCompetitors) {
    try {
      const existing = await competitorDb.getByKey(competitor.key);
      if (!existing) {
        await competitorDb.create(competitor);
        logger.info(`Created default competitor: ${competitor.name}`);
      }
    } catch (error) {
      logger.error(`Failed to create default competitor ${competitor.name}:`, handleError(error, 'competitor-default-init'));
    }
  }
}

// Initialize database
export async function initializeDatabase() {
  logger.info('Initializing Qdrant competitor database...');

  await initializeCollections();
  await initializeDefaultCompetitors();

  logger.info('Qdrant competitor database initialized');
}

export default {
  competitor: competitorDb,
  job: scrapingJobDb,
  product: scrapedProductDb,
  initialize: initializeDatabase
};