// Business Intelligence - Memgraph Database Operations
import { logger } from '@/lib/logger';
import { memgraphBI } from './connection';
import { NODE_TEMPLATES } from './schema';
import type {
  Competitor,
  CompetitorProduct,
  CompetitorChannel,
  CompetitorCampaign,
  CreateCompetitorRequest,
  UpdateCompetitorRequest,
  CompetitorListResponse,
  CompetitorDetailsResponse
} from '../types/competitor';
import {
  CompetitorStatus,
  CompanySize,
  CompetitorCategory,
  MonitoringScope,
  MonitoringFrequency,
  ChannelType,
  CampaignType,
  CampaignStatus
} from '../types/competitor';
import {
  parseCompanySize,
  parseCompetitorCategory,
  parseMonitoringScope,
  parseMonitoringFrequency,
  parseCompetitorStatus,
  parseCampaignType,
  parseCampaignStatus,
  parseChannelType
} from '@/types/validators';

// Memgraph node interfaces
interface MemgraphNode {
  id: number;
  labels: string[];
  properties: Record<string, unknown>;
}

// Unused interface
// interface MemgraphRelationship {
//   id: number;
//   type: string;
//   startNodeId: number;
//   endNodeId: number;
//   properties: Record<string, unknown>;
// }

// Competitor CRUD Operations
export class CompetitorOperations {
  // Create a new competitor
  async createCompetitor(data: CreateCompetitorRequest): Promise<Competitor> {
    try {
      logger.debug('Creating competitor in Memgraph', { name: data.name, domain: data.domain });

      const competitorId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const result = await memgraphBI.executeQuery(NODE_TEMPLATES.COMPETITOR, {
        id: competitorId,
        name: data.name,
        domain: data.domain,
        industry: data.industry || '',
        size: data.size || '',
        founded: data.founded || null,
        category: data.category || '',
        monitoringScope: data.monitoringScope || '',
        monitoringFrequency: data.monitoringFrequency || '',
        status: CompetitorStatus.ACTIVE,
        description: '',
        headquarters: '',
        employeeCount: null,
        revenue: null,
        marketCap: null,
        fundingStage: '',
        totalFunding: null,
        keyPersonnel: JSON.stringify([]),
        businessModel: '',
        targetMarket: JSON.stringify([]),
        coreCompetencies: JSON.stringify([]),
        weaknesses: JSON.stringify([]),
        strategicPartnerships: JSON.stringify([]),
        recentNews: JSON.stringify([]),
        socialMediaPresence: JSON.stringify({}),
        websiteTraffic: JSON.stringify({}),
        searchVisibility: JSON.stringify({}),
        brandMentions: JSON.stringify({}),
        customerSentiment: JSON.stringify({}),
        innovationIndex: null,
        marketPosition: '',
        threatLevel: '',
        opportunityScore: null,
        lastAnalyzed: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });

      if (result.records.length === 0) {
        throw new Error('Failed to create competitor in Memgraph');
      }

      const competitorNode = result.records[0]?.get('c');
      if (!competitorNode) {
        throw new Error('Failed to retrieve competitor node');
      }
      const competitor = this.nodeToCompetitor(competitorNode);

      logger.info('Competitor created successfully in Memgraph', { competitorId, name: data.name });
      return competitor;
    } catch (error) {
      logger.error('Failed to create competitor in Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Get competitor by ID
  async getCompetitorById(id: string): Promise<Competitor | null> {
    try {
      logger.debug('Fetching competitor from Memgraph', { competitorId: id });

      const result = await memgraphBI.executeQuery(
        'MATCH (c:Competitor {id: $id}) RETURN c',
        { id }
      );

      if (result.records.length === 0) {
        logger.debug('Competitor not found in Memgraph', { competitorId: id });
        return null;
      }

      const competitorNode = result.records[0]?.get('c');
      if (!competitorNode) {
        throw new Error('Failed to retrieve competitor node');
      }
      const competitor = this.nodeToCompetitor(competitorNode);

      logger.debug('Competitor fetched successfully from Memgraph', { competitorId: id });
      return competitor;
    } catch (error) {
      logger.error('Failed to fetch competitor from Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Get competitor details with relationships
  async getCompetitorDetails(id: string): Promise<CompetitorDetailsResponse | null> {
    try {
      logger.debug('Fetching competitor details from Memgraph', { competitorId: id });

      // Get competitor with related products, channels, and campaigns
      const result = await memgraphBI.executeQuery(`
        MATCH (c:Competitor {id: $id})
        OPTIONAL MATCH (c)-[:OFFERS]->(p:Product)
        OPTIONAL MATCH (c)-[:USES_CHANNEL]->(ch:Channel)
        OPTIONAL MATCH (c)-[:RUNS]->(ca:Campaign)
        RETURN c,
               collect(DISTINCT p) as products,
               collect(DISTINCT ch) as channels,
               collect(DISTINCT ca) as campaigns
      `, { id });

      if (result.records.length === 0) {
        logger.debug('Competitor details not found in Memgraph', { competitorId: id });
        return null;
      }

      const record = result.records[0];
      if (!record) {
        throw new Error('No records found');
      }
      const competitorNode = record.get('c');
      const productNodes = record.get('products') || [];
      const channelNodes = record.get('channels') || [];
      const campaignNodes = record.get('campaigns') || [];

      const competitor = this.nodeToCompetitor(competitorNode);
      const products = productNodes.map((node: MemgraphNode) => this.nodeToProduct(node));
      const channels = channelNodes.map((node: MemgraphNode) => this.nodeToChannel(node));
      const campaigns = campaignNodes.map((node: MemgraphNode) => this.nodeToCampaign(node));

      const details: CompetitorDetailsResponse = {
        ...competitor,
        products,
        channels,
        campaigns,
        monitoringStats: {
          totalProducts: products.length,
          totalChannels: channels.length,
          activeCampaigns: campaigns.filter((c: { status: string }) => c.status === 'active').length,
          lastPriceChanges: 0 // TODO: Implement price change tracking
        }
      };

      logger.debug('Competitor details fetched successfully from Memgraph', { competitorId: id });
      return details;
    } catch (error) {
      logger.error('Failed to fetch competitor details from Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  // List competitors with filters
  async listCompetitors(options: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    industry?: string;
  } = {}): Promise<CompetitorListResponse> {
    try {
      const { page = 1, limit = 20, category, status, industry } = options;
      const skip = (page - 1) * limit;

      logger.debug('Listing competitors from Memgraph', { page, limit, category, status, industry });

      // Build filter conditions
      const filters: string[] = [];
      const params: Record<string, unknown> = { limit, skip };

      if (category) {
        filters.push('c.category = $category');
        params.category = category;
      }

      if (status) {
        filters.push('c.status = $status');
        params.status = status;
      }

      if (industry) {
        filters.push('c.industry = $industry');
        params.industry = industry;
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      // Get competitors with count
      const countResult = await memgraphBI.executeQuery(`
        MATCH (c:Competitor)
        ${whereClause}
        RETURN count(c) as total
      `, params);

      const total = countResult.records[0]?.get('total')?.toNumber() || 0;

      const competitorsResult = await memgraphBI.executeQuery(`
        MATCH (c:Competitor)
        ${whereClause}
        RETURN c
        ORDER BY c.createdAt DESC
        SKIP $skip
        LIMIT $limit
      `, params);

      const competitors = competitorsResult.records.map(record => {
        const competitorNode = record.get('c');
        return this.nodeToCompetitor(competitorNode);
      });

      const response: CompetitorListResponse = {
        competitors,
        total,
        page,
        limit
      };

      logger.debug('Competitors listed successfully from Memgraph', {
        count: competitors.length,
        total,
        page
      });

      return response;
    } catch (error) {
      logger.error('Failed to list competitors from Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Update competitor
  async updateCompetitor(id: string, data: UpdateCompetitorRequest): Promise<Competitor> {
    try {
      logger.debug('Updating competitor in Memgraph', { competitorId: id, fields: Object.keys(data) });

      // Build SET clauses for non-null values
      const setClauses: string[] = [];
      const params: Record<string, unknown> = { id };

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          setClauses.push(`c.${key} = $${key}`);
          if (typeof value === 'object' && value !== null) {
            params[key] = JSON.stringify(value);
          } else {
            params[key] = value;
          }
        }
      });

      setClauses.push('c.updatedAt = $updatedAt');
      params.updatedAt = new Date().toISOString();

      if (setClauses.length === 1) { // Only updatedAt
        throw new Error('No valid fields to update');
      }

      const result = await memgraphBI.executeQuery(`
        MATCH (c:Competitor {id: $id})
        SET ${setClauses.join(', ')}
        RETURN c
      `, params);

      if (result.records.length === 0) {
        throw new Error('Competitor not found for update');
      }

      const competitorNode = result.records[0]?.get('c');
      if (!competitorNode) {
        throw new Error('Failed to retrieve competitor node');
      }
      const competitor = this.nodeToCompetitor(competitorNode);

      logger.info('Competitor updated successfully in Memgraph', { competitorId: id });
      return competitor;
    } catch (error) {
      logger.error('Failed to update competitor in Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Delete competitor
  async deleteCompetitor(id: string): Promise<boolean> {
    try {
      logger.debug('Deleting competitor from Memgraph', { competitorId: id });

      const result = await memgraphBI.executeQuery(`
        MATCH (c:Competitor {id: $id})
        DETACH DELETE c
        RETURN count(c) as deletedCount
      `, { id });

      const deletedCount = result.records[0]?.get('deletedCount')?.toNumber?.() || 0;

      if (deletedCount === 0) {
        logger.warn('Competitor not found for deletion', { competitorId: id });
        return false;
      }

      logger.info('Competitor deleted successfully from Memgraph', { competitorId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete competitor from Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Search competitors by text
  async searchCompetitors(query: string, limit: number = 20): Promise<Competitor[]> {
    try {
      logger.debug('Searching competitors in Memgraph', { query, limit });

      const result = await memgraphBI.executeQuery(`
        MATCH (c:Competitor)
        WHERE toLower(c.name) CONTAINS toLower($query)
           OR toLower(c.domain) CONTAINS toLower($query)
           OR toLower(c.industry) CONTAINS toLower($query)
           OR toLower(c.description) CONTAINS toLower($query)
        RETURN c
        ORDER BY c.name
        LIMIT $limit
      `, { query, limit });

      const competitors = result.records.map(record => {
        const competitorNode = record.get('c');
        return this.nodeToCompetitor(competitorNode);
      });

      logger.debug('Competitor search completed', {
        query,
        resultCount: competitors.length
      });

      return competitors;
    } catch (error) {
      logger.error('Failed to search competitors in Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Helper method to convert Memgraph node to Competitor object
  private nodeToCompetitor(node: MemgraphNode): Competitor {
    const props = node.properties;

    return {
      id: String(props.id || ''),
      name: String(props.name || ''),
      domain: String(props.domain || ''),
      industry: String(props.industry || ''),
      size: parseCompanySize(props.size),
      founded: props.founded ? Number(props.founded) : undefined,
      category: parseCompetitorCategory(props.category),
      monitoringScope: parseMonitoringScope(props.monitoringScope),
      monitoringFrequency: parseMonitoringFrequency(props.monitoringFrequency),
      status: parseCompetitorStatus(props.status),
      createdAt: new Date(props.createdAt ? String(props.createdAt) : Date.now()),
      updatedAt: new Date(props.updatedAt ? String(props.updatedAt) : Date.now())
    };
  }

  // Helper method to convert Memgraph node to Product object
  private nodeToProduct(node: MemgraphNode): CompetitorProduct {
    const props = node.properties;

    return {
      id: String(props.id || ''),
      competitorId: String(props.competitorId || ''),
      name: String(props.name || ''),
      description: String(props.description || ''),
      category: String(props.category || ''),
      price: props.price ? Number(props.price) : 0,
      currency: String(props.currency || 'USD'),
      url: props.url ? String(props.url) : undefined,
      features: this.parseJsonField(props.features ? String(props.features) : null, []),
      imageUrl: props.imageUrl ? String(props.imageUrl) : undefined,
      inStock: Boolean(props.inStock),
      createdAt: new Date(props.createdAt ? String(props.createdAt) : Date.now()),
      updatedAt: new Date(props.updatedAt ? String(props.updatedAt) : Date.now())
    };
  }

  // Helper method to convert Memgraph node to Channel object
  private nodeToChannel(node: MemgraphNode): CompetitorChannel {
    const props = node.properties;

    return {
      id: String(props.id || ''),
      competitorId: String(props.competitorId || ''),
      name: String(props.name || ''),
      type: parseChannelType(props.type),
      region: String(props.region || ''),
      url: props.url ? String(props.url) : undefined,
      description: props.description ? String(props.description) : undefined,
      isActive: Boolean(props.isActive),
      createdAt: new Date(props.createdAt ? String(props.createdAt) : Date.now()),
      updatedAt: new Date(props.updatedAt ? String(props.updatedAt) : Date.now())
    };
  }

  // Helper method to convert Memgraph node to Campaign object
  private nodeToCampaign(node: MemgraphNode): CompetitorCampaign {
    const props = node.properties;

    return {
      id: String(props.id || ''),
      competitorId: String(props.competitorId || ''),
      name: String(props.name || ''),
      type: parseCampaignType(props.type),
      budget: props.budget ? Number(props.budget) : undefined,
      startDate: new Date(props.startDate ? String(props.startDate) : Date.now()),
      endDate: props.endDate ? new Date(String(props.endDate)) : undefined,
      description: props.description ? String(props.description) : undefined,
      targetAudience: props.targetAudience ? String(props.targetAudience) : undefined,
      channels: this.parseJsonField(props.channels ? String(props.channels) : null, []),
      status: parseCampaignStatus(props.status),
      createdAt: new Date(props.createdAt ? String(props.createdAt) : Date.now()),
      updatedAt: new Date(props.updatedAt ? String(props.updatedAt) : Date.now())
    };
  }

  // Helper method to safely parse JSON fields
  private parseJsonField<T>(value: string | undefined | null, defaultValue: T | string): T {
    if (!value) {
      if (typeof defaultValue === 'string') {
        try {
          return JSON.parse(defaultValue);
        } catch {
          return {} as T;
        }
      }
      return defaultValue as T;
    }

    try {
      return JSON.parse(value);
    } catch {
      if (typeof defaultValue === 'string') {
        try {
          return JSON.parse(defaultValue);
        } catch {
          return {} as T;
        }
      }
      return defaultValue as T;
    }
  }
}

// Export singleton instance
export const competitorOperations = new CompetitorOperations();