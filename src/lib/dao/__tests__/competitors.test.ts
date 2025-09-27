import { CompetitorDAO } from '../competitors';
import { Core } from '@/types/TYPE_REGISTRY';
import { query, CacheManager } from '../../database';
import { Competitor } from '../types';

// Mock dependencies
jest.mock('../../database');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCacheManager = {
  getInstance: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  generateKey: jest.fn()
} as any;

// Mock CacheManager
(CacheManager as any).getInstance = jest.fn(() => mockCacheManager);

describe('CompetitorDAO', () => {
  let competitorDAO: CompetitorDAO;

  beforeEach(() => {
    jest.clearAllMocks();
    competitorDAO = new CompetitorDAO();

    // Setup default mock implementations
    mockCacheManager.generateKey.mockImplementation((...args: string[]) => args.join(':'));
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.set.mockResolvedValue(undefined);
    mockCacheManager.del.mockResolvedValue(undefined);
  });

  const mockCompetitor: Competitor = {
    id: 'comp-123',
    name: 'Test Corporation',
    domain: 'test.com',
    industry: 'Technology',
    size_category: 'Enterprise',
    country: 'USA',
    is_active: true,
    scraping_config: { interval: 3600, enabled: true, frequency: 'hourly' },
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01')
  };

  describe('findAll', () => {
    it('should return paginated competitors with default filter', async () => {
      const mockResults = {
        competitors: [mockCompetitor],
        total: 1,
        page: 1,
        totalPages: 1
      };

      // Mock count query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: '1' }],
        rowCount: 1
      });

      // Mock data query
      mockQuery.mockResolvedValueOnce({
        rows: [mockCompetitor],
        rowCount: 1
      });

      const result = await competitorDAO.findAll();

      expect(result).toEqual(mockResults);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      const filter = {
        industry: 'Technology',
        country: 'USA',
        is_active: true,
        page: 2,
        limit: 10
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '25' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockCompetitor], rowCount: 1 });

      const result = await competitorDAO.findAll(filter);

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3); // 25 total / 10 per page = 3 pages

      // Check that the WHERE clause includes filters
      const countQuery = mockQuery.mock.calls[0]?.[0] as string;
      expect(countQuery).toContain('WHERE');
      expect(countQuery).toContain('is_active = $1');
      expect(countQuery).toContain('industry ILIKE $2');
      expect(countQuery).toContain('country ILIKE $3');
    });

    it('should return cached results when available', async () => {
      const cachedResult = {
        competitors: [mockCompetitor],
        total: 1,
        page: 1,
        totalPages: 1
      };

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await competitorDAO.findAll();

      expect(result).toEqual(cachedResult);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return competitor by ID', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockCompetitor],
        rowCount: 1
      });

      const result = await competitorDAO.findById('comp-123');

      expect(result).toEqual(mockCompetitor);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM competitors WHERE id = $1',
        ['comp-123']
      );
    });

    it('should return null for non-existent competitor', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const result = await competitorDAO.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should use cache when available', async () => {
      mockCacheManager.get.mockResolvedValue(mockCompetitor);

      const result = await competitorDAO.findById('comp-123');

      expect(result).toEqual(mockCompetitor);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('findByDomain', () => {
    it('should return competitor by domain', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockCompetitor],
        rowCount: 1
      });

      const result = await competitorDAO.findByDomain('test.com');

      expect(result).toEqual(mockCompetitor);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM competitors WHERE domain = $1',
        ['test.com']
      );
    });
  });

  describe('create', () => {
    it('should create a new competitor', async () => {
      const newCompetitorData = {
        name: 'New Corp',
        domain: 'newcorp.com',
        industry: 'Finance',
        size_category: 'Startup',
        country: 'Canada',
        is_active: true,
        scraping_config: { interval: 7200, enabled: true, frequency: 'biHourly' }
      };

      const createdCompetitor = {
        ...newCompetitorData,
        id: 'comp-456',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockQuery.mockResolvedValueOnce({
        rows: [createdCompetitor],
        rowCount: 1
      });

      const result = await competitorDAO.create(newCompetitorData);

      expect(result).toEqual(createdCompetitor);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO competitors'),
        expect.arrayContaining([
          newCompetitorData.name,
          newCompetitorData.domain,
          newCompetitorData.industry,
          newCompetitorData.size_category,
          newCompetitorData.country,
          newCompetitorData.is_active,
          JSON.stringify(newCompetitorData.scraping_config)
        ])
      );
      expect(mockCacheManager.del).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update competitor successfully', async () => {
      const updates = {
        name: 'Updated Corp',
        industry: 'Healthcare'
      };

      const updatedCompetitor = {
        ...mockCompetitor,
        ...updates,
        updated_at: new Date()
      };

      mockQuery.mockResolvedValueOnce({
        rows: [updatedCompetitor],
        rowCount: 1
      });

      const result = await competitorDAO.update('comp-123', updates);

      expect(result).toEqual(updatedCompetitor);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE competitors'),
        expect.arrayContaining(['Updated Corp', 'Healthcare', 'comp-123'])
      );
      expect(mockCacheManager.del).toHaveBeenCalledTimes(2); // Individual and list cache
    });

    it('should return existing competitor when no updates provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockCompetitor],
        rowCount: 1
      });

      const result = await competitorDAO.update('comp-123', {});

      expect(result).toEqual(mockCompetitor);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM competitors WHERE id = $1',
        ['comp-123']
      );
    });
  });

  describe('delete', () => {
    it('should delete competitor successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1
      });

      const result = await competitorDAO.delete('comp-123');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM competitors WHERE id = $1',
        ['comp-123']
      );
      expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
    });

    it('should return false when competitor not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const result = await competitorDAO.delete('nonexistent');

      expect(result).toBe(false);
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    it('should return competitor summary', async () => {
      const mockSummary = {
        id: 'comp-123',
        name: 'Test Corp',
        domain: 'test.com',
        industry: 'Technology',
        product_count: 10,
        avg_price: 99.99 as Core.Money,
        last_updated: new Date()
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockSummary],
        rowCount: 1
      });

      const result = await competitorDAO.getSummary();

      expect(result).toEqual([mockSummary]);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM competitor_summary ORDER BY product_count DESC, name ASC'
      );
    });
  });

  describe('getActiveCount', () => {
    it('should return count of active competitors', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '5' }],
        rowCount: 1
      });

      const result = await competitorDAO.getActiveCount();

      expect(result).toBe(5);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM competitors WHERE is_active = true'
      );
    });
  });

  describe('updateScrapingConfig', () => {
    it('should update scraping configuration', async () => {
      const newConfig = { interval: 1800, enabled: true };

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1
      });

      const result = await competitorDAO.updateScrapingConfig('comp-123', newConfig);

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE competitors SET scraping_config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(newConfig), 'comp-123']
      );
      expect(mockCacheManager.del).toHaveBeenCalled();
    });
  });
});