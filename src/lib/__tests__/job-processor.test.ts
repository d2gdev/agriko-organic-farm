// Job Processor Tests
import { JobProcessor, JobType } from '../job-processor';
import { EventType, createEvent } from '../event-system';

// Mock Redis
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      lpush: jest.fn().mockResolvedValue(1),
      brpop: jest.fn().mockResolvedValue(['jobs:queue', JSON.stringify({
        id: 'test-job-1',
        type: 'persist.memgraph',
        data: { test: 'data' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now()
      })]),
    })),
  };
});

// Mock auto-sync modules
jest.mock('../memgraph-auto-sync', () => ({
  autoSyncProductToMemgraph: jest.fn().mockResolvedValue(undefined),
  autoSyncUserBehaviorToMemgraph: jest.fn().mockResolvedValue(undefined),
  autoSyncSearchToMemgraph: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../qdrant-auto-sync', () => ({
  autoSyncProductToQdrant: jest.fn().mockResolvedValue(undefined),
  autoSyncUserSearchToQdrant: jest.fn().mockResolvedValue(undefined),
  autoSyncUserBehaviorToQdrant: jest.fn().mockResolvedValue(undefined),
}));

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Job Processor', () => {
  let jobProcessor: JobProcessor;

  beforeEach(() => {
    jobProcessor = new JobProcessor();
  });

  describe('Event Handling', () => {
    it('should create persistence jobs for product events', async () => {
      const productEvent = createEvent(EventType.PRODUCT_VIEWED, {
        productId: 123,
        productName: 'Organic Rice',
        productPrice: 25.99,
        category: 'Grains',
      }, 'user123', 'session456');

      await (jobProcessor as any).handleEvent(productEvent);

      // Verify Redis lpush was called for job creation
      expect(jobProcessor['redis'].lpush).toHaveBeenCalled();
    });

    it('should handle search events with Qdrant persistence', async () => {
      const searchEvent = createEvent(EventType.SEARCH_PERFORMED, {
        query: 'organic turmeric',
        resultsCount: 12,
        filters: { category: 'spices' },
      }, 'user123', 'session456');

      await (jobProcessor as any).handleEvent(searchEvent);

      // Verify both analytics and search pattern jobs were created
      expect(jobProcessor['redis'].lpush).toHaveBeenCalledTimes(2);
    });

    it('should handle order events with high priority', async () => {
      const orderEvent = createEvent(EventType.ORDER_CREATED, {
        orderId: 'order-789',
        userId: 'user123',
        items: [
          { productId: 1, quantity: 2, price: 25.99 },
          { productId: 2, quantity: 1, price: 15.50 }
        ],
        orderValue: 67.48,
      }, 'user123', 'session456');

      await (jobProcessor as any).handleEvent(orderEvent);

      // Verify multiple jobs were created for order processing
      expect(jobProcessor['redis'].lpush).toHaveBeenCalled();
    });
  });

  describe('Job Execution', () => {
    it('should execute Memgraph persistence jobs', async () => {
      const job = {
        id: 'test-job-1',
        type: JobType.PERSIST_TO_MEMGRAPH,
        data: {
          eventType: 'product.viewed',
          productId: 123,
          userId: 'user123',
          sessionId: 'session456',
          timestamp: Date.now(),
        },
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now()
      };

      await jobProcessor['executeJob'](job);

      // Verify auto-sync was called
      const { autoSyncProductToMemgraph } = require('../memgraph-auto-sync');
      expect(autoSyncProductToMemgraph).toHaveBeenCalledWith(job.data);
    });

    it('should execute Qdrant persistence jobs', async () => {
      const job = {
        id: 'test-job-2',
        type: JobType.PERSIST_TO_QDRANT,
        data: {
          productId: 123,
          eventType: 'product.viewed',
          metadata: { category: 'grains' }
        },
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now()
      };

      await jobProcessor['executeJob'](job);

      // Verify auto-sync was called
      const { autoSyncProductToQdrant } = require('../qdrant-auto-sync');
      expect(autoSyncProductToQdrant).toHaveBeenCalledWith(job.data);
    });

    it('should execute analytics persistence jobs', async () => {
      const job = {
        id: 'test-job-3',
        type: JobType.PERSIST_ANALYTICS_TO_MEMGRAPH,
        data: {
          type: 'page.viewed',
          userId: 'user123',
          sessionId: 'session456',
          metadata: { page: '/products' }
        },
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now()
      };

      await jobProcessor['executeJob'](job);

      // Verify analytics persistence was called
      const { autoSyncUserBehaviorToMemgraph } = require('../memgraph-auto-sync');
      expect(autoSyncUserBehaviorToMemgraph).toHaveBeenCalled();
    });

    it('should handle unknown job types gracefully', async () => {
      const job = {
        id: 'test-job-4',
        type: 'unknown.job.type' as JobType,
        data: { test: 'data' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now()
      };

      await jobProcessor['executeJob'](job);

      // Should log warning for unknown job type
      const { logger } = require('../logger');
      expect(logger.warn).toHaveBeenCalledWith('Unknown job type: unknown.job.type');
    });
  });

  describe('Error Handling and Retry', () => {
    it('should retry failed jobs with exponential backoff', async () => {
      // Mock auto-sync to throw error
      const { autoSyncProductToMemgraph } = require('../memgraph-auto-sync');
      autoSyncProductToMemgraph.mockRejectedValueOnce(new Error('Database connection failed'));

      const job = {
        id: 'test-job-retry',
        type: JobType.PERSIST_TO_MEMGRAPH,
        data: { eventType: 'product.viewed' },
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now()
      };

      await jobProcessor['executeJob'](job);

      // Verify error was logged and job was retried
      const { logger } = require('../logger');
      expect(logger.error).toHaveBeenCalled();

      // Job should be added back to delayed queue
      expect(jobProcessor['redis'].lpush).toHaveBeenCalledWith(
        'jobs:delayed',
        expect.stringContaining('test-job-retry')
      );
    });

    it('should stop retrying after max attempts', async () => {
      const job = {
        id: 'test-job-max-retry',
        type: JobType.PERSIST_TO_MEMGRAPH,
        data: { eventType: 'product.viewed' },
        attempts: 3, // Already at max attempts
        maxAttempts: 3,
        createdAt: Date.now()
      };

      // Mock failure
      const { autoSyncProductToMemgraph } = require('../memgraph-auto-sync');
      autoSyncProductToMemgraph.mockRejectedValueOnce(new Error('Persistent failure'));

      await jobProcessor['executeJob'](job);

      // Should not add to delayed queue
      expect(jobProcessor['redis'].lpush).not.toHaveBeenCalledWith(
        'jobs:delayed',
        expect.any(String)
      );
    });
  });

  describe('Job Queue Management', () => {
    it('should add jobs to queue with proper structure', async () => {
      const data = { test: 'data' };
      await jobProcessor['addJob'](JobType.PERSIST_TO_MEMGRAPH, data);

      expect(jobProcessor['redis'].lpush).toHaveBeenCalledWith(
        'jobs:queue',
        expect.stringContaining(JobType.PERSIST_TO_MEMGRAPH)
      );
    });

    it('should handle delayed jobs', async () => {
      const data = { test: 'data' };
      const delay = 5000;

      await jobProcessor['addJob'](JobType.PERSIST_TO_MEMGRAPH, data, delay);

      expect(jobProcessor['redis'].lpush).toHaveBeenCalledWith(
        'jobs:delayed',
        expect.stringContaining(JobType.PERSIST_TO_MEMGRAPH)
      );
    });
  });
});