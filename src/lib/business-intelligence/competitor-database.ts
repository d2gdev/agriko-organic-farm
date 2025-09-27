// Business Intelligence Competitor Database
import { logger } from '@/lib/logger';
import { apiCache } from '@/lib/cache-manager';
import type {
  Competitor,
  CreateCompetitorRequest,
  UpdateCompetitorRequest,
  CompetitorListResponse
} from './types/competitor';
import { CompetitorStatus } from './types/competitor';

interface CompetitorFilters {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

class CompetitorDatabase {
  private static instance: CompetitorDatabase;
  private readonly CACHE_PREFIX = 'competitor:';
  private readonly INDEX_KEY = 'competitor:index';
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {
    logger.info('CompetitorDatabase initialized');
  }

  static getInstance(): CompetitorDatabase {
    if (!CompetitorDatabase.instance) {
      CompetitorDatabase.instance = new CompetitorDatabase();
    }
    return CompetitorDatabase.instance;
  }

  // Create a new competitor
  async createCompetitor(data: CreateCompetitorRequest): Promise<Competitor> {
    try {
      const competitorId = `comp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const competitor: Competitor = {
        id: competitorId,
        name: data.name,
        domain: data.domain,
        industry: data.industry,
        size: data.size,
        founded: data.founded,
        category: data.category,
        monitoringScope: data.monitoringScope,
        monitoringFrequency: data.monitoringFrequency,
        status: CompetitorStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in cache
      await apiCache.set(
        `${this.CACHE_PREFIX}${competitorId}`,
        competitor as unknown as Record<string, unknown>,
        this.CACHE_TTL
      );

      // Update index
      await this.updateCompetitorIndex(competitor);

      logger.info('Competitor created', {
        competitorId,
        name: data.name,
        domain: data.domain
      }, 'competitor-db');

      return competitor;
    } catch (error) {
      logger.error('Failed to create competitor', {
        error,
        data
      }, 'competitor-db');
      throw error;
    }
  }

  // Get all competitors with filters
  async getAllCompetitors(filters?: CompetitorFilters): Promise<CompetitorListResponse> {
    try {
      // Get all competitor IDs from index
      const index = (await apiCache.get(this.INDEX_KEY) as unknown as string[]) || [];

      // Load all competitors
      const allCompetitors: Competitor[] = [];
      for (const competitorId of index) {
        const competitor = await apiCache.get(
          `${this.CACHE_PREFIX}${competitorId}`
        ) as unknown as Competitor;

        if (competitor) {
          allCompetitors.push(competitor);
        }
      }

      // Apply filters
      let filteredCompetitors = [...allCompetitors];

      if (filters?.category) {
        filteredCompetitors = filteredCompetitors.filter(
          c => c.category === filters.category
        );
      }

      if (filters?.status) {
        filteredCompetitors = filteredCompetitors.filter(
          c => c.status === filters.status
        );
      }

      // Sort by creation date (newest first)
      filteredCompetitors.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const offset = filters?.offset || 0;
      const limit = filters?.limit || 20;
      const paginatedCompetitors = filteredCompetitors.slice(offset, offset + limit);

      return {
        competitors: paginatedCompetitors,
        total: filteredCompetitors.length,
        page: Math.floor(offset / limit) + 1,
        limit
      };
    } catch (error) {
      logger.error('Failed to get competitors', { error, filters }, 'competitor-db');
      throw error;
    }
  }

  // Get a single competitor by ID
  async getCompetitorById(competitorId: string): Promise<Competitor | null> {
    try {
      const competitor = await apiCache.get(
        `${this.CACHE_PREFIX}${competitorId}`
      ) as unknown as Competitor;

      return competitor || null;
    } catch (error) {
      logger.error('Failed to get competitor', { error, competitorId }, 'competitor-db');
      throw error;
    }
  }

  // Update a competitor
  async updateCompetitor(
    competitorId: string,
    updates: UpdateCompetitorRequest
  ): Promise<Competitor | null> {
    try {
      const existing = await this.getCompetitorById(competitorId);
      if (!existing) {
        return null;
      }

      const updated: Competitor = {
        ...existing,
        ...updates,
        id: competitorId, // Ensure ID doesn't change
        createdAt: existing.createdAt, // Preserve creation date
        updatedAt: new Date()
      };

      // Update in cache
      await apiCache.set(
        `${this.CACHE_PREFIX}${competitorId}`,
        updated as unknown as Record<string, unknown>,
        this.CACHE_TTL
      );

      logger.info('Competitor updated', {
        competitorId,
        updates: Object.keys(updates)
      }, 'competitor-db');

      return updated;
    } catch (error) {
      logger.error('Failed to update competitor', {
        error,
        competitorId,
        updates
      }, 'competitor-db');
      throw error;
    }
  }

  // Delete a competitor
  async deleteCompetitor(competitorId: string): Promise<boolean> {
    try {
      const existing = await this.getCompetitorById(competitorId);
      if (!existing) {
        return false;
      }

      // Remove from cache
      await apiCache.delete(`${this.CACHE_PREFIX}${competitorId}`);

      // Update index
      const index = (await apiCache.get(this.INDEX_KEY) as unknown as string[]) || [];
      const updatedIndex = index.filter(id => id !== competitorId);
      await apiCache.set(this.INDEX_KEY, updatedIndex as unknown as Record<string, unknown>, this.CACHE_TTL);

      logger.info('Competitor deleted', { competitorId }, 'competitor-db');

      return true;
    } catch (error) {
      logger.error('Failed to delete competitor', {
        error,
        competitorId
      }, 'competitor-db');
      throw error;
    }
  }

  // Update competitor index
  private async updateCompetitorIndex(competitor: Competitor): Promise<void> {
    try {
      const index = (await apiCache.get(this.INDEX_KEY) as unknown as string[]) || [];

      if (!index.includes(competitor.id)) {
        index.push(competitor.id);
        await apiCache.set(this.INDEX_KEY, index as unknown as Record<string, unknown>, this.CACHE_TTL);
      }
    } catch (error) {
      logger.error('Failed to update competitor index', {
        error,
        competitorId: competitor.id
      }, 'competitor-db');
      throw error;
    }
  }

  // Get competitors by category
  async getCompetitorsByCategory(category: string): Promise<Competitor[]> {
    try {
      const result = await this.getAllCompetitors({ category });
      return result.competitors;
    } catch (error) {
      logger.error('Failed to get competitors by category', {
        error,
        category
      }, 'competitor-db');
      throw error;
    }
  }

  // Get active competitors
  async getActiveCompetitors(): Promise<Competitor[]> {
    try {
      const result = await this.getAllCompetitors({
        status: CompetitorStatus.ACTIVE
      });
      return result.competitors;
    } catch (error) {
      logger.error('Failed to get active competitors', { error }, 'competitor-db');
      throw error;
    }
  }

  // Search competitors by name or domain
  async searchCompetitors(query: string): Promise<Competitor[]> {
    try {
      const result = await this.getAllCompetitors();
      const searchTerm = query.toLowerCase();

      return result.competitors.filter(competitor =>
        competitor.name.toLowerCase().includes(searchTerm) ||
        competitor.domain.toLowerCase().includes(searchTerm) ||
        (competitor.industry && competitor.industry.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      logger.error('Failed to search competitors', { error, query }, 'competitor-db');
      throw error;
    }
  }
}

// Export singleton instance
export const competitorDB = CompetitorDatabase.getInstance();