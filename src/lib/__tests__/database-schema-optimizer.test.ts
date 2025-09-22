// Database Schema Optimizer Tests
import {
  DatabaseSchemaOptimizer,
  databaseOptimizer,
  initializeDatabaseOptimizations,
  schedulePerformanceMonitoring
} from '../database-schema-optimizer';

// Mock neo4j-driver
jest.mock('neo4j-driver', () => {
  const mockSession = {
    run: jest.fn().mockResolvedValue({
      records: [
        {
          get: jest.fn((key: string) => {
            if (key === 'nodeCount' || key === 'relCount') {
              return { toNumber: () => 1000 };
            }
            return 'mock-value';
          })
        }
      ]
    }),
    close: jest.fn().mockResolvedValue(undefined)
  };

  const mockDriver = {
    session: jest.fn(() => mockSession),
    close: jest.fn().mockResolvedValue(undefined)
  };

  return {
    __esModule: true,
    default: {
      driver: jest.fn(() => mockDriver),
      auth: {
        basic: jest.fn()
      }
    }
  };
});

// Mock qdrant
jest.mock('../qdrant', () => ({
  initializeQdrant: jest.fn(() => ({
    createCollection: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
    upsertPoints: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Database Schema Optimizer', () => {
  let optimizer: DatabaseSchemaOptimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = new DatabaseSchemaOptimizer();
  });

  describe('Initialization', () => {
    it('should initialize database optimizations', async () => {
      await optimizer.initializeOptimizations();

      const neo4j = require('neo4j-driver');
      const mockSession = neo4j.default.driver().session();

      // Should run index creation queries
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX ON :User(id)')
      );

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX ON :Product(id)')
      );

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE CONSTRAINT ON (u:User) ASSERT u.id IS UNIQUE')
      );
    });

    it('should handle index creation errors gracefully', async () => {
      const neo4j = require('neo4j-driver');
      const mockSession = neo4j.default.driver().session();
      mockSession.run.mockRejectedValueOnce(new Error('Index already exists'));

      await expect(optimizer.initializeOptimizations()).resolves.not.toThrow();
    });
  });

  describe('Performance Tracking', () => {
    it('should track Memgraph query performance', async () => {
      await optimizer.trackQueryPerformance('test_query', 150, 'memgraph');
      await optimizer.trackQueryPerformance('test_query', 200, 'memgraph');

      const stats = await optimizer.getPerformanceStats();

      expect(stats.memgraph.queryExecutionTimes['test_query']).toEqual([150, 200]);
    });

    it('should track Qdrant search performance', async () => {
      await optimizer.trackQueryPerformance('vector_search', 50, 'qdrant');
      await optimizer.trackQueryPerformance('vector_search', 75, 'qdrant');

      const stats = await optimizer.getPerformanceStats();

      expect(stats.qdrant.searchLatency).toEqual([50, 75]);
    });

    it('should limit performance history to 100 entries', async () => {
      // Add 105 entries
      for (let i = 0; i < 105; i++) {
        await optimizer.trackQueryPerformance('test_query', i, 'memgraph');
      }

      const stats = await optimizer.getPerformanceStats();

      expect(stats.memgraph.queryExecutionTimes['test_query']).toHaveLength(100);
      expect(stats.memgraph.queryExecutionTimes['test_query']?.[0]).toBe(5); // First 5 should be removed
    });
  });

  describe('Performance Analysis', () => {
    it('should identify slow Memgraph queries', async () => {
      // Add slow query times
      await optimizer.trackQueryPerformance('slow_analytics_query', 1500, 'memgraph');
      await optimizer.trackQueryPerformance('slow_analytics_query', 2000, 'memgraph');
      await optimizer.trackQueryPerformance('fast_query', 100, 'memgraph');

      const analysis = await optimizer.analyzeSlowQueries();

      expect(analysis.memgraph).toHaveLength(1);
      expect(analysis.memgraph[0]).toEqual({
        query: 'slow_analytics_query',
        avgTime: 1750,
        suggestion: 'Consider time-based partitioning for analytics queries'
      });
    });

    it('should identify slow Qdrant searches', async () => {
      // Add slow search times
      await optimizer.trackQueryPerformance('vector_search', 600, 'qdrant');
      await optimizer.trackQueryPerformance('vector_search', 800, 'qdrant');

      const analysis = await optimizer.analyzeSlowQueries();

      expect(analysis.qdrant).toHaveLength(1);
      expect(analysis.qdrant[0]).toEqual({
        operation: 'vector_search',
        avgTime: 700,
        suggestion: 'Consider optimizing HNSW parameters or using quantization'
      });
    });

    it('should provide different suggestions for different query types', async () => {
      await optimizer.trackQueryPerformance('slow_relationship_query', 1500, 'memgraph');
      await optimizer.trackQueryPerformance('slow_search_query', 1200, 'memgraph');

      const analysis = await optimizer.analyzeSlowQueries();

      const relationshipQuery = analysis.memgraph.find(q => q.query === 'slow_relationship_query');
      const searchQuery = analysis.memgraph.find(q => q.query === 'slow_search_query');

      expect(relationshipQuery?.suggestion).toBe('Consider relationship direction optimization');
      expect(searchQuery?.suggestion).toBe('Consider full-text search indexes');
    });
  });

  describe('Health Check', () => {
    it('should perform successful health check', async () => {
      const healthCheck = await optimizer.performHealthCheck();

      expect(healthCheck.memgraph.status).toBe('healthy');
      expect(healthCheck.memgraph.details).toContain('Memgraph connection successful');

      expect(healthCheck.qdrant.status).toBe('healthy');
      expect(healthCheck.qdrant.details).toContain('Qdrant connection successful');
    });

    it('should detect Memgraph connection issues', async () => {
      const neo4j = require('neo4j-driver');
      const mockSession = neo4j.default.driver().session();
      mockSession.run.mockRejectedValueOnce(new Error('Connection failed'));

      const healthCheck = await optimizer.performHealthCheck();

      expect(healthCheck.memgraph.status).toBe('critical');
      expect(healthCheck.memgraph.details[0]).toContain('Memgraph health check failed');
    });

    it('should detect performance warnings', async () => {
      // Simulate high search latency
      await optimizer.trackQueryPerformance('search', 1500, 'qdrant');

      const healthCheck = await optimizer.performHealthCheck();

      expect(healthCheck.qdrant.status).toBe('warning');
      expect(healthCheck.qdrant.details).toContain('High search latency detected');
    });
  });

  describe('Performance Statistics', () => {
    it('should update and return performance statistics', async () => {
      const stats = await optimizer.getPerformanceStats();

      expect(stats).toHaveProperty('memgraph');
      expect(stats).toHaveProperty('qdrant');
      expect(stats).toHaveProperty('lastUpdated');

      expect(stats.memgraph).toHaveProperty('nodeCount');
      expect(stats.memgraph).toHaveProperty('relationshipCount');
      expect(stats.memgraph).toHaveProperty('queryExecutionTimes');

      expect(stats.qdrant).toHaveProperty('vectorCount');
      expect(stats.qdrant).toHaveProperty('searchLatency');
    });

    it('should handle database metric collection errors', async () => {
      const neo4j = require('neo4j-driver');
      const mockSession = neo4j.default.driver().session();
      mockSession.run.mockRejectedValueOnce(new Error('Query failed'));

      // Should not throw, should handle error gracefully
      await expect(optimizer.getPerformanceStats()).resolves.not.toThrow();
    });
  });

  describe('Module Functions', () => {
    it('should initialize global database optimizations', async () => {
      await expect(initializeDatabaseOptimizations()).resolves.not.toThrow();
    });

    it('should handle initialization errors', async () => {
      const neo4j = require('neo4j-driver');
      const mockSession = neo4j.default.driver().session();
      mockSession.run.mockRejectedValueOnce(new Error('Database error'));

      await expect(initializeDatabaseOptimizations()).resolves.not.toThrow();
    });

    it('should schedule performance monitoring', () => {
      const originalSetInterval = global.setInterval;
      const mockSetInterval = jest.fn();
      global.setInterval = mockSetInterval;

      schedulePerformanceMonitoring();

      // Should set up two intervals: performance monitoring and health checks
      expect(mockSetInterval).toHaveBeenCalledTimes(2);

      // First call should be for performance monitoring (5 minutes)
      expect(mockSetInterval).toHaveBeenNthCalledWith(1, expect.any(Function), 5 * 60 * 1000);

      // Second call should be for health checks (15 minutes)
      expect(mockSetInterval).toHaveBeenNthCalledWith(2, expect.any(Function), 15 * 60 * 1000);

      global.setInterval = originalSetInterval;
    });
  });

  describe('Error Handling', () => {
    it('should handle Qdrant optimization errors', async () => {
      const { initializeQdrant } = require('../qdrant');
      initializeQdrant.mockImplementationOnce(() => {
        throw new Error('Qdrant connection failed');
      });

      await expect(optimizer.initializeOptimizations()).rejects.toThrow('Qdrant connection failed');
    });

    it('should handle performance tracking errors gracefully', async () => {
      // Invalid database parameter should not cause errors
      await expect(
        optimizer.trackQueryPerformance('test', 100, 'invalid' as any)
      ).resolves.not.toThrow();
    });
  });
});