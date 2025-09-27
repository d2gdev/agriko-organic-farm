// Background Job Processor for Automatic Data Persistence
import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import type {
  ProductSyncData,
  SearchSyncData,
  UserBehaviorSyncData,
  QdrantProductData,
  QdrantSearchData,
  QdrantBehaviorData
} from '@/types/business-intelligence-types';
import {
  BaseEvent,
  EventType,
  ProductEvent,
  SearchEvent,
  PageEvent,
  OrderEvent
} from './event-system';
import { validateProductSyncData, ProductSyncDataSchema } from '@/types/validators';
import { z } from 'zod';

// Database persistence modules
// Removed unused import: addProductToGraph
// import { upsertProductEmbedding } from './qdrant'; // Not used
// Enhanced auto-sync modules
import { autoSyncProductToMemgraph, autoSyncUserBehaviorToMemgraph, autoSyncSearchToMemgraph } from './memgraph-auto-sync';
import { autoSyncProductToQdrant, autoSyncUserSearchToQdrant, autoSyncUserBehaviorToQdrant } from './qdrant-auto-sync';

// Job types for background processing
export enum JobType {
  PERSIST_TO_MEMGRAPH = 'persist.memgraph',
  PERSIST_TO_QDRANT = 'persist.qdrant',
  PERSIST_ANALYTICS_TO_MEMGRAPH = 'persist.analytics.memgraph',
  UPDATE_USER_PROFILE = 'update.user_profile',
  GENERATE_RECOMMENDATIONS = 'generate.recommendations',
  SYNC_WOOCOMMERCE = 'sync.woocommerce',
  CLEANUP_OLD_DATA = 'cleanup.old_data',
  PROCESS_EVENT = 'process_event',
}

interface Job {
  id: string;
  type: JobType;
  data: unknown;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  scheduledFor?: number;
}

export class JobProcessor {
  private redis: Redis;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  // Start processing background jobs
  async start(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    logger.info('🚀 Starting background job processor');

    // Process events every 5 seconds
    this.processingInterval = setInterval(async () => {
      await this.processEventQueue();
      await this.processJobQueue();
    }, 5000);

    // Setup event listeners for automatic job creation
    this.setupEventListeners();
  }

  // Stop processing
  async stop(): Promise<void> {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    logger.info('⏹️ Stopped background job processor');
  }

  // Public method to enqueue jobs
  async enqueue(type: JobType, data: unknown, delay: number = 0): Promise<void> {
    await this.addJob(type, data, delay);
  }

  // Process events from the event queue
  private async processEventQueue(): Promise<void> {
    try {
      while (true) {
        const eventData = await this.redis.brpop('events:queue', 1);
        if (!eventData) break;

        const event: BaseEvent = JSON.parse(eventData[1]);
        await this.handleEvent(event);
      }
    } catch (error) {
      logger.error('Error processing event queue:', error as Record<string, unknown>);
    }
  }

  // Handle individual events and create appropriate jobs
  private async handleEvent(event: BaseEvent): Promise<void> {
    try {
      logger.info(`Processing event: ${event.type}`, { eventId: event.id });

      // Create jobs based on event type
      switch (event.type) {
        case EventType.PRODUCT_VIEWED:
        case EventType.PRODUCT_ADDED_TO_CART:
        case EventType.PRODUCT_PURCHASED:
          await this.createPersistenceJobs(event as ProductEvent);
          break;

        case EventType.SEARCH_PERFORMED:
          await this.handleSearchEvent(event as SearchEvent);
          break;

        case EventType.PAGE_VIEWED:
          await this.handlePageViewEvent(event as PageEvent);
          break;

        case EventType.ORDER_CREATED:
          await this.handleOrderEvent(event as OrderEvent);
          break;

        case EventType.USER_REGISTERED:
        case EventType.USER_LOGIN:
          await this.handleUserEvent(event);
          break;

        default:
          // Generic analytics persistence
          await this.addJob(JobType.PERSIST_ANALYTICS_TO_MEMGRAPH, event);
      }

    } catch (error) {
      logger.error(`Error handling event ${event.type}:`, error as Record<string, unknown>);
    }
  }

  // Create persistence jobs for product events
  private async createPersistenceJobs(event: ProductEvent): Promise<void> {
    // Save to Memgraph (relationships)
    await this.addJob(JobType.PERSIST_TO_MEMGRAPH, {
      eventType: event.type,
      productId: event.productId,
      userId: event.userId,
      sessionId: event.sessionId,
      timestamp: event.timestamp,
      metadata: event.metadata,
    });

    // Save analytics to Memgraph as graph nodes
    await this.addJob(JobType.PERSIST_ANALYTICS_TO_MEMGRAPH, event);

    // If new product interaction, trigger recommendation update
    if (event.userId) {
      await this.addJob(JobType.GENERATE_RECOMMENDATIONS, {
        userId: event.userId,
        productId: event.productId,
        interactionType: event.type,
      });
    }
  }

  // Handle search events
  private async handleSearchEvent(event: SearchEvent): Promise<void> {
    // Save search analytics to Memgraph
    await this.addJob(JobType.PERSIST_ANALYTICS_TO_MEMGRAPH, event);

    // Save search patterns to Qdrant
    await this.addJob(JobType.PERSIST_TO_QDRANT, {
      type: 'search_pattern',
      query: event.query,
      userId: event.userId,
      sessionId: event.sessionId,
      resultsCount: event.resultsCount,
      timestamp: event.timestamp
    });

    // If no results, log for product discovery
    if (event.resultsCount === 0) {
      await this.addJob(JobType.PERSIST_ANALYTICS_TO_MEMGRAPH, {
        ...event,
        type: 'search.no_results.analysis',
        priority: 'high',
      });
    }
  }

  // Handle page view events
  private async handlePageViewEvent(event: PageEvent): Promise<void> {
    await this.addJob(JobType.PERSIST_ANALYTICS_TO_MEMGRAPH, event);

    // Update user journey
    if (event.userId) {
      await this.addJob(JobType.UPDATE_USER_PROFILE, {
        userId: event.userId,
        pageUrl: event.pageUrl,
        timestamp: event.timestamp,
        deviceType: event.deviceType,
        browserType: event.browserType,
      });
    }
  }

  // Handle order events
  private async handleOrderEvent(event: OrderEvent): Promise<void> {
    // High priority - save order relationships to Memgraph
    await this.addJob(JobType.PERSIST_TO_MEMGRAPH, {
      eventType: event.type,
      orderId: event.orderId,
      userId: event.userId,
      items: event.items || [],
      orderValue: event.orderTotal,  // OrderEvent has orderTotal, not orderValue
      timestamp: event.timestamp,
    }, 0); // High priority

    // Save comprehensive analytics to Memgraph
    await this.addJob(JobType.PERSIST_ANALYTICS_TO_MEMGRAPH, event);

    // Update product relationships based on purchase
    if (event.items) {
      for (const item of event.items) {
      await this.addJob(JobType.PERSIST_TO_MEMGRAPH, {
        eventType: 'product.purchased.relationship',
        productId: item.productId,
        orderId: event.orderId,
        quantity: item.quantity,
        price: item.price,
        coProducts: event.items?.filter(i => i.productId !== item.productId) || [],
      });
      }
    }
  }

  // Handle user events
  private async handleUserEvent(event: BaseEvent): Promise<void> {
    await this.addJob(JobType.PERSIST_ANALYTICS_TO_MEMGRAPH, event);

    if (event.userId) {
      await this.addJob(JobType.UPDATE_USER_PROFILE, {
        userId: event.userId,
        eventType: event.type,
        timestamp: event.timestamp,
        metadata: event.metadata,
      });
    }
  }

  // Add job to queue
  private async addJob(
    type: JobType,
    data: unknown,
    delay: number = 0
  ): Promise<void> {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxAttempts: 3,
      createdAt: Date.now(),
      scheduledFor: delay > 0 ? Date.now() + delay : undefined,
    };

    const queueName = delay > 0 ? 'jobs:delayed' : 'jobs:queue';
    await this.redis.lpush(queueName, JSON.stringify(job));
  }

  // Process job queue
  private async processJobQueue(): Promise<void> {
    try {
      // Process immediate jobs
      while (true) {
        const jobData = await this.redis.brpop('jobs:queue', 1);
        if (!jobData) break;

        const job: Job = JSON.parse(jobData[1]);
        await this.executeJob(job);
      }

      // Process delayed jobs that are ready
      await this.processDelayedJobs();
    } catch (error) {
      logger.error('Error processing job queue:', error as Record<string, unknown>);
    }
  }

  // Process delayed jobs
  private async processDelayedJobs(): Promise<void> {
    const now = Date.now();
    const delayedJobs = await this.redis.lrange('jobs:delayed', 0, -1);

    for (let i = 0; i < delayedJobs.length; i++) {
      const jobData = delayedJobs[i];
      if (!jobData) continue;
      const job: Job = JSON.parse(jobData);

      if (!job.scheduledFor || job.scheduledFor <= now) {
        // Move to immediate queue
        await this.redis.lrem('jobs:delayed', 1, jobData);
        await this.redis.lpush('jobs:queue', JSON.stringify(job));
      }
    }
  }

  // Execute individual job
  private async executeJob(job: Job): Promise<void> {
    try {
      logger.info(`Executing job: ${job.type}`, { jobId: job.id });

      switch (job.type) {
        case JobType.PERSIST_TO_MEMGRAPH:
          await this.persistToMemgraph(job.data as Record<string, unknown>);
          break;

        case JobType.PERSIST_TO_QDRANT:
          await this.persistToQdrant(job.data as Record<string, unknown>);
          break;

        case JobType.PERSIST_ANALYTICS_TO_MEMGRAPH:
          await this.persistAnalyticsToMemgraph(job.data as Record<string, unknown>);
          break;

        case JobType.UPDATE_USER_PROFILE:
          await this.updateUserProfile(job.data);
          break;

        case JobType.GENERATE_RECOMMENDATIONS:
          await this.generateRecommendations(job.data);
          break;

        case JobType.SYNC_WOOCOMMERCE:
          await this.syncWooCommerce(job.data);
          break;

        case JobType.CLEANUP_OLD_DATA:
          await this.cleanupOldData(job.data);
          break;

        case JobType.PROCESS_EVENT:
          await this.processEvent(job.data);
          break;

        default:
          logger.warn(`Unknown job type: ${job.type}`);
      }

      logger.info(`Job completed: ${job.type}`, { jobId: job.id });
    } catch (error) {
      logger.error(`Job failed: ${job.type}`, {
        jobId: job.id,
        error: error as Record<string, unknown>
      });

      // Retry logic
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        // Add back to queue with delay
        job.scheduledFor = Date.now() + (job.attempts * 30000); // Exponential backoff
        await this.redis.lpush('jobs:delayed', JSON.stringify(job));
      } else {
        // Move to failed queue
        await this.redis.lpush('jobs:failed', JSON.stringify(job));
      }
    }
  }

  // Job execution methods
  private async persistToMemgraph(data: Record<string, unknown>): Promise<void> {
    try {
      if (data.eventType) {
        // Validate and parse the data with Zod
        const productData = validateProductSyncData({
          eventType: data.eventType,
          productId: data.productId,
          userId: data.userId,
          sessionId: data.sessionId,
          timestamp: data.timestamp,
          metadata: data.metadata || {}
        });
        await autoSyncProductToMemgraph(productData);
      } else if (data.query) {
        // Search event
        const searchData: SearchSyncData = {
          query: String(data.query),
          resultsCount: Number(data.resultsCount),
          userId: data.userId ? String(data.userId) : undefined,
          sessionId: String(data.sessionId),
          timestamp: Number(data.timestamp),
          clickedResultId: data.clickedResultId ? Number(data.clickedResultId) : undefined
        };
        await autoSyncSearchToMemgraph(searchData);
      } else {
        // Generic user behavior
        const behaviorData: UserBehaviorSyncData = {
          userId: String(data.userId),
          sessionId: String(data.sessionId),
          pageUrl: String(data.pageUrl),
          timestamp: Number(data.timestamp),
          eventType: String(data.eventType),
          metadata: (data.metadata || {}) as Record<string, unknown>
        };
        await autoSyncUserBehaviorToMemgraph(behaviorData);
      }
      logger.info('Successfully persisted to Memgraph:', { type: data.eventType || data.type });
    } catch (error) {
      logger.error('Failed to persist to Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  private async persistToQdrant(data: Record<string, unknown>): Promise<void> {
    try {
      if (data.productId) {
        // Product event
        const qdrantProductData: QdrantProductData = {
          productId: Number(data.productId),
          eventType: String(data.eventType),
          metadata: data.metadata as Record<string, unknown> | undefined
        };
        await autoSyncProductToQdrant(qdrantProductData);
      } else if (data.query || data.type === 'search_pattern') {
        // Search event
        const qdrantSearchData: QdrantSearchData = {
          query: String(data.query),
          userId: data.userId ? String(data.userId) : undefined,
          sessionId: String(data.sessionId),
          resultsCount: Number(data.resultsCount),
          clickedResults: data.clickedResults as number[] | undefined,
          timestamp: Number(data.timestamp)
        };
        await autoSyncUserSearchToQdrant(qdrantSearchData);
      } else {
        // User behavior event
        const qdrantBehaviorData: QdrantBehaviorData = {
          userId: String(data.userId),
          sessionId: String(data.sessionId),
          interactions: (data.interactions || []) as Array<{
            productId: number;
            type: string;
            timestamp: number;
            duration?: number;
          }>
        };
        await autoSyncUserBehaviorToQdrant(qdrantBehaviorData);
      }
      logger.info('Successfully persisted to Qdrant:', { type: data.eventType || data.type });
    } catch (error) {
      logger.error('Failed to persist to Qdrant:', error as Record<string, unknown>);
      throw error;
    }
  }

  private async persistAnalyticsToMemgraph(data: Record<string, unknown>): Promise<void> {
    try {
      // Store analytics data as graph nodes in Memgraph
      // This will be implemented in the memgraph-analytics.ts file
      await autoSyncUserBehaviorToMemgraph({
        userId: String(data.userId || `anonymous_${data.sessionId}`),
        sessionId: String(data.sessionId),
        pageUrl: String(data.pageUrl || '/'),
        timestamp: Number(data.timestamp),
        eventType: String(data.type),
        metadata: (data.metadata as Record<string, unknown>) || {}
      });
      logger.info('Successfully persisted analytics to Memgraph:', { type: data.type });
    } catch (error) {
      logger.error('Failed to persist analytics to Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  private async updateUserProfile(data: unknown): Promise<void> {
    // Implementation for user profile updates
    logger.info('Updating user profile:', data as Record<string, unknown>);
  }

  private async generateRecommendations(data: unknown): Promise<void> {
    // Implementation for recommendation generation
    logger.info('Generating recommendations:', data as Record<string, unknown>);
  }

  private async syncWooCommerce(data: unknown): Promise<void> {
    // Implementation for WooCommerce sync
    logger.info('Syncing WooCommerce:', data as Record<string, unknown>);
  }

  private async cleanupOldData(data: unknown): Promise<void> {
    // Implementation for data cleanup
    logger.info('Cleaning up old data:', data as Record<string, unknown>);
  }

  private async processEvent(data: unknown): Promise<void> {
    // Process event data from the event tracking API
    const eventData = data as { eventData: BaseEvent; priority: string };
    if (eventData?.eventData) {
      await this.handleEvent(eventData.eventData);
    } else {
      logger.warn('Invalid event data structure:', data as Record<string, unknown>);
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // This would be called during application startup
    logger.info('Setting up event listeners for automatic persistence');
  }
}

// Singleton job processor
export const jobProcessor = new JobProcessor();