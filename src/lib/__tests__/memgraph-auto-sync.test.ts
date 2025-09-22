// Memgraph Auto-Sync Tests
import {
  autoSyncProductToMemgraph,
  autoSyncUserBehaviorToMemgraph,
  autoSyncSearchToMemgraph
} from '../memgraph-auto-sync';

// Mock memgraph
jest.mock('../memgraph', () => ({
  withSession: jest.fn((callback) => callback({
    run: jest.fn().mockResolvedValue({ records: [] })
  }))
}));

// Mock memgraph-analytics
jest.mock('../memgraph-analytics', () => ({
  createAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
  createPageView: jest.fn().mockResolvedValue(undefined),
}));

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Memgraph Auto-Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product Auto-Sync', () => {
    it('should sync product events to Memgraph', async () => {
      const productData = {
        eventType: 'product.viewed',
        productId: 123,
        userId: 'user123',
        sessionId: 'session456',
        timestamp: Date.now(),
        metadata: { category: 'grains' }
      };

      await autoSyncProductToMemgraph(productData);

      const { withSession } = require('../memgraph');
      expect(withSession).toHaveBeenCalled();

      const { createAnalyticsEvent } = require('../memgraph-analytics');
      expect(createAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: productData.eventType,
          userId: productData.userId,
          productId: productData.productId
        })
      );
    });

    it('should handle product sync without user ID', async () => {
      const productData = {
        eventType: 'product.viewed',
        productId: 123,
        sessionId: 'session456',
        timestamp: Date.now(),
        metadata: {}
      };

      await autoSyncProductToMemgraph(productData);

      const { withSession } = require('../memgraph');
      expect(withSession).toHaveBeenCalled();

      // Should not create analytics event without user ID
      const { createAnalyticsEvent } = require('../memgraph-analytics');
      expect(createAnalyticsEvent).not.toHaveBeenCalled();
    });
  });

  describe('User Behavior Auto-Sync', () => {
    it('should sync user behavior to Memgraph', async () => {
      const behaviorData = {
        userId: 'user123',
        sessionId: 'session456',
        pageUrl: '/products/organic-rice',
        timestamp: Date.now(),
        eventType: 'page.viewed',
        metadata: { scrollDepth: 0.8 }
      };

      await autoSyncUserBehaviorToMemgraph(behaviorData);

      const { withSession } = require('../memgraph');
      expect(withSession).toHaveBeenCalled();

      const { createPageView } = require('../memgraph-analytics');
      expect(createPageView).toHaveBeenCalledWith(
        expect.objectContaining({
          path: behaviorData.pageUrl,
          userId: behaviorData.userId,
          sessionId: behaviorData.sessionId
        })
      );
    });
  });

  describe('Search Auto-Sync', () => {
    it('should sync search events to Memgraph', async () => {
      const searchData = {
        query: 'organic turmeric',
        resultsCount: 12,
        userId: 'user123',
        sessionId: 'session456',
        timestamp: Date.now(),
        clickedResultId: 456
      };

      await autoSyncSearchToMemgraph(searchData);

      const { withSession } = require('../memgraph');
      expect(withSession).toHaveBeenCalled();

      const { createAnalyticsEvent } = require('../memgraph-analytics');
      expect(createAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'search.performed',
          userId: searchData.userId,
          metadata: expect.objectContaining({
            query: searchData.query,
            resultsCount: searchData.resultsCount
          })
        })
      );
    });

    it('should handle search without user ID', async () => {
      const searchData = {
        query: 'organic turmeric',
        resultsCount: 12,
        sessionId: 'session456',
        timestamp: Date.now()
      };

      await autoSyncSearchToMemgraph(searchData);

      const { withSession } = require('../memgraph');
      expect(withSession).toHaveBeenCalled();

      // Should not create analytics event without user ID
      const { createAnalyticsEvent } = require('../memgraph-analytics');
      expect(createAnalyticsEvent).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle product sync errors', async () => {
      const { withSession } = require('../memgraph');
      withSession.mockRejectedValueOnce(new Error('Database error'));

      const productData = {
        eventType: 'product.viewed',
        productId: 123,
        sessionId: 'session456',
        timestamp: Date.now(),
        metadata: {}
      };

      await expect(autoSyncProductToMemgraph(productData)).rejects.toThrow('Database error');
    });

    it('should handle search sync errors', async () => {
      const { withSession } = require('../memgraph');
      withSession.mockRejectedValueOnce(new Error('Database error'));

      const searchData = {
        query: 'test query',
        resultsCount: 5,
        sessionId: 'session456',
        timestamp: Date.now()
      };

      await expect(autoSyncSearchToMemgraph(searchData)).rejects.toThrow('Database error');
    });
  });
});