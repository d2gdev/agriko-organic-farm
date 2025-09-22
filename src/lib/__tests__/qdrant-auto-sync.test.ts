// Qdrant Auto-Sync Tests
import {
  autoSyncProductToQdrant,
  autoSyncUserSearchToQdrant,
  autoSyncUserBehaviorToQdrant
} from '../qdrant-auto-sync';

// Mock qdrant client
const mockUpsertPoints = jest.fn().mockResolvedValue(undefined);
const mockSetPayload = jest.fn().mockResolvedValue(undefined);

jest.mock('../qdrant', () => ({
  initializeQdrant: jest.fn(() => ({
    upsertPoints: mockUpsertPoints,
    setPayload: mockSetPayload
  }))
}));

// Mock embeddings
jest.mock('../embeddings', () => ({
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5])
}));

// Mock woocommerce
jest.mock('../woocommerce', () => ({
  getProduct: jest.fn().mockResolvedValue({
    id: 123,
    name: 'Organic Rice',
    slug: 'organic-rice',
    price: '25.99',
    categories: [{ name: 'Grains' }],
    tags: [{ name: 'Organic' }],
    stock_status: 'instock',
    featured: false,
    short_description: 'Premium organic rice',
    description: 'High quality organic rice from sustainable farms',
    images: [{ src: 'image.jpg' }]
  })
}));

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Qdrant Auto-Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpsertPoints.mockClear();
    mockSetPayload.mockClear();
  });

  describe('Product Auto-Sync', () => {
    it('should call auto-sync functions without errors', async () => {
      const productData = {
        productId: 123,
        eventType: 'product.viewed',
        metadata: { category: 'grains' }
      };

      await expect(autoSyncProductToQdrant(productData)).resolves.not.toThrow();

      const { getProduct } = require('../woocommerce');
      expect(getProduct).toHaveBeenCalledWith(123);
    });

    it('should handle missing product gracefully', async () => {
      const { getProduct } = require('../woocommerce');
      getProduct.mockResolvedValueOnce(null);

      const productData = {
        productId: 999,
        eventType: 'product.viewed',
        metadata: {}
      };

      await autoSyncProductToQdrant(productData);

      const { logger } = require('../logger');
      expect(logger.warn).toHaveBeenCalledWith(
        'Product 999 not found for Qdrant sync'
      );
    });

    it('should handle product sync errors', async () => {
      const { getProduct } = require('../woocommerce');
      getProduct.mockRejectedValueOnce(new Error('API error'));

      const productData = {
        productId: 123,
        eventType: 'product.viewed',
        metadata: {}
      };

      await expect(autoSyncProductToQdrant(productData)).rejects.toThrow('API error');
    });
  });

  describe('User Search Auto-Sync', () => {
    it('should sync search patterns to Qdrant', async () => {
      const searchData = {
        query: 'organic turmeric',
        userId: 'user123',
        sessionId: 'session456',
        resultsCount: 12,
        clickedResults: [123, 456],
        timestamp: Date.now()
      };

      await autoSyncUserSearchToQdrant(searchData);

      expect(mockUpsertPoints).toHaveBeenCalledWith([
        expect.objectContaining({
          vector: [0.1, 0.2, 0.3, 0.4, 0.5],
          payload: expect.objectContaining({
            query: 'organic turmeric',
            user_id: 'user123',
            results_count: 12,
            clicked_results: [123, 456],
            intent: expect.any(String)
          })
        })
      ]);
    });

    it('should classify search intent correctly', async () => {
      const transactionalSearch = {
        query: 'buy organic rice',
        userId: 'user123',
        sessionId: 'session456',
        resultsCount: 5,
        timestamp: Date.now()
      };

      await autoSyncUserSearchToQdrant(transactionalSearch);

      expect(mockUpsertPoints).toHaveBeenCalledWith([
        expect.objectContaining({
          payload: expect.objectContaining({
            intent: 'transactional'
          })
        })
      ]);
    });

    it('should update product relevance scores for clicked results', async () => {
      const searchData = {
        query: 'organic rice',
        userId: 'user123',
        sessionId: 'session456',
        resultsCount: 10,
        clickedResults: [123],
        timestamp: Date.now()
      };

      await autoSyncUserSearchToQdrant(searchData);

      expect(mockSetPayload).toHaveBeenCalledWith(
        'product_123',
        expect.objectContaining({
          query_relevance: expect.objectContaining({
            'organic rice': expect.objectContaining({
              clicked: true,
              timestamp: expect.any(Number)
            })
          })
        })
      );
    });
  });

  describe('User Behavior Auto-Sync', () => {
    it('should sync user behavior patterns to Qdrant', async () => {
      const behaviorData = {
        userId: 'user123',
        sessionId: 'session456',
        interactions: [
          {
            productId: 123,
            type: 'view',
            timestamp: Date.now(),
            duration: 30000
          },
          {
            productId: 456,
            type: 'add_to_cart',
            timestamp: Date.now()
          }
        ]
      };

      await autoSyncUserBehaviorToQdrant(behaviorData);

      expect(mockUpsertPoints).toHaveBeenCalledWith([
        expect.objectContaining({
          vector: [0.1, 0.2, 0.3, 0.4, 0.5],
          payload: expect.objectContaining({
            user_id: 'user123',
            session_id: 'session456',
            interaction_count: 2,
            interaction_types: ['view', 'add_to_cart']
          })
        })
      ]);
    });

    it('should analyze browsing patterns correctly', async () => {
      const behaviorData = {
        userId: 'user123',
        sessionId: 'session456',
        interactions: [
          { productId: 1, type: 'purchase', timestamp: Date.now() }
        ]
      };

      await autoSyncUserBehaviorToQdrant(behaviorData);

      expect(mockUpsertPoints).toHaveBeenCalledWith([
        expect.objectContaining({
          payload: expect.objectContaining({
            browsing_pattern: 'converter'
          })
        })
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should handle embedding generation errors', async () => {
      const { generateEmbedding } = require('../embeddings');
      generateEmbedding.mockRejectedValueOnce(new Error('Embedding failed'));

      const productData = {
        productId: 123,
        eventType: 'product.viewed',
        metadata: {}
      };

      await expect(autoSyncProductToQdrant(productData)).rejects.toThrow('Embedding failed');
    });

    it('should handle Qdrant client errors', async () => {
      mockUpsertPoints.mockRejectedValueOnce(new Error('Qdrant error'));

      const searchData = {
        query: 'test query',
        sessionId: 'session123',
        resultsCount: 0,
        timestamp: Date.now()
      };

      await expect(autoSyncUserSearchToQdrant(searchData)).rejects.toThrow('Qdrant error');
    });
  });

  describe('Helper Functions', () => {
    it('should extract search entities correctly', async () => {
      const searchData = {
        query: 'organic red rice large',
        sessionId: 'session123',
        resultsCount: 5,
        timestamp: Date.now()
      };

      await autoSyncUserSearchToQdrant(searchData);

      expect(mockUpsertPoints).toHaveBeenCalledWith([
        expect.objectContaining({
          payload: expect.objectContaining({
            entities: expect.objectContaining({
              colors: expect.arrayContaining(['red']),
              sizes: expect.arrayContaining(['large']),
              categories: expect.arrayContaining(['rice'])
            })
          })
        })
      ]);
    });

    it('should analyze activity time patterns', async () => {
      const behaviorData = {
        userId: 'user123',
        sessionId: 'session456',
        interactions: [
          {
            productId: 1,
            type: 'view',
            timestamp: new Date('2023-01-01T02:00:00Z').getTime() // Night
          }
        ]
      };

      await autoSyncUserBehaviorToQdrant(behaviorData);

      expect(mockUpsertPoints).toHaveBeenCalledWith([
        expect.objectContaining({
          payload: expect.objectContaining({
            activity_time_pattern: expect.any(String)
          })
        })
      ]);
    });
  });
});