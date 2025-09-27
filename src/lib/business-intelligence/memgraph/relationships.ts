// Business Intelligence - Memgraph Relationship Operations
import { logger } from '@/lib/logger';
import { memgraphBI } from './connection';
import { RELATIONSHIP_TEMPLATES } from './schema';

// Relationship operation interfaces
export interface CompetitorRelationship {
  sourceId: string;
  targetId: string;
  type: 'COMPETES_WITH' | 'PARTNERS_WITH';
  properties: Record<string, unknown>;
  createdAt: Date;
}

export interface MarketRelationship {
  entityId: string;
  entityType: 'competitor' | 'product' | 'channel' | 'campaign';
  targetId: string;
  targetType: 'industry' | 'segment' | 'region' | 'technology';
  relationshipType: string;
  properties: Record<string, unknown>;
  createdAt: Date;
}

export interface ProductRelationship {
  sourceProductId: string;
  targetProductId: string;
  type: 'COMPETES_WITH' | 'SUBSTITUTES' | 'COMPLEMENTS';
  properties: Record<string, unknown>;
  createdAt: Date;
}

// Memgraph result item interfaces
interface MemgraphRelationshipItem {
  competitor?: {
    properties: {
      id: string;
      name: string;
    };
  };
  industry?: {
    properties: {
      name: string;
    };
  };
  segment?: {
    properties: {
      id: string;
      name: string;
    };
  };
  region?: {
    properties: {
      id: string;
      name: string;
    };
  };
  technology?: {
    properties: {
      name: string;
    };
  };
  product?: {
    properties: {
      id: string;
      name: string;
      price?: number;
    };
  };
  relationship: {
    type: string;
    properties: Record<string, unknown>;
  };
}

// Relationship Operations Class
export class RelationshipOperations {
  // Competitor-to-Competitor Relationships
  async createCompetitorRelationship(
    competitor1Id: string,
    competitor2Id: string,
    relationshipType: 'COMPETES_WITH' | 'PARTNERS_WITH',
    properties: Record<string, unknown> = {}
  ): Promise<CompetitorRelationship> {
    try {
      logger.debug('Creating competitor relationship', {
        competitor1Id,
        competitor2Id,
        relationshipType
      });

      const template = relationshipType === 'COMPETES_WITH'
        ? RELATIONSHIP_TEMPLATES.COMPETITOR_COMPETES_WITH
        : RELATIONSHIP_TEMPLATES.COMPETITOR_PARTNERS_WITH;

      const params = {
        competitor1Id,
        competitor2Id,
        ...properties,
        createdAt: new Date().toISOString()
      };

      const result = await memgraphBI.executeQuery(template, params);

      if (result.records.length === 0) {
        throw new Error('Failed to create competitor relationship');
      }

      const relationship: CompetitorRelationship = {
        sourceId: competitor1Id,
        targetId: competitor2Id,
        type: relationshipType,
        properties,
        createdAt: new Date()
      };

      logger.info('Competitor relationship created successfully', {
        competitor1Id,
        competitor2Id,
        relationshipType
      });

      return relationship;
    } catch (error) {
      logger.error('Failed to create competitor relationship:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Industry/Market Relationships
  async linkCompetitorToIndustry(
    competitorId: string,
    industryName: string,
    properties: {
      since?: Date;
      marketShare?: number;
      position?: string;
    } = {}
  ): Promise<MarketRelationship> {
    try {
      logger.debug('Linking competitor to industry', { competitorId, industryName });

      const params = {
        competitorId,
        industryName,
        since: properties.since?.toISOString() || new Date().toISOString(),
        marketShare: properties.marketShare || null,
        position: properties.position || '',
        createdAt: new Date().toISOString()
      };

      await memgraphBI.executeQuery(RELATIONSHIP_TEMPLATES.COMPETITOR_OPERATES_IN_INDUSTRY, params);

      const relationship: MarketRelationship = {
        entityId: competitorId,
        entityType: 'competitor',
        targetId: industryName,
        targetType: 'industry',
        relationshipType: 'OPERATES_IN',
        properties,
        createdAt: new Date()
      };

      logger.info('Competitor linked to industry successfully', { competitorId, industryName });
      return relationship;
    } catch (error) {
      logger.error('Failed to link competitor to industry:', error as Record<string, unknown>);
      throw error;
    }
  }

  async linkCompetitorToSegment(
    competitorId: string,
    segmentId: string,
    properties: {
      priority?: string;
      approach?: string;
      effectiveness?: number;
      since?: Date;
    } = {}
  ): Promise<MarketRelationship> {
    try {
      logger.debug('Linking competitor to market segment', { competitorId, segmentId });

      const params = {
        competitorId,
        segmentId,
        priority: properties.priority || '',
        approach: properties.approach || '',
        effectiveness: properties.effectiveness || null,
        since: properties.since?.toISOString() || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await memgraphBI.executeQuery(RELATIONSHIP_TEMPLATES.COMPETITOR_TARGETS_SEGMENT, params);

      const relationship: MarketRelationship = {
        entityId: competitorId,
        entityType: 'competitor',
        targetId: segmentId,
        targetType: 'segment',
        relationshipType: 'TARGETS',
        properties,
        createdAt: new Date()
      };

      logger.info('Competitor linked to market segment successfully', { competitorId, segmentId });
      return relationship;
    } catch (error) {
      logger.error('Failed to link competitor to market segment:', error as Record<string, unknown>);
      throw error;
    }
  }

  async linkCompetitorToRegion(
    competitorId: string,
    regionId: string,
    properties: {
      since?: Date;
      marketShare?: number;
      investment?: number;
      strategy?: string;
    } = {}
  ): Promise<MarketRelationship> {
    try {
      logger.debug('Linking competitor to geographic region', { competitorId, regionId });

      const params = {
        competitorId,
        regionId,
        since: properties.since?.toISOString() || new Date().toISOString(),
        marketShare: properties.marketShare || null,
        investment: properties.investment || null,
        strategy: properties.strategy || '',
        createdAt: new Date().toISOString()
      };

      await memgraphBI.executeQuery(RELATIONSHIP_TEMPLATES.COMPETITOR_OPERATES_IN_REGION, params);

      const relationship: MarketRelationship = {
        entityId: competitorId,
        entityType: 'competitor',
        targetId: regionId,
        targetType: 'region',
        relationshipType: 'OPERATES_IN',
        properties,
        createdAt: new Date()
      };

      logger.info('Competitor linked to geographic region successfully', { competitorId, regionId });
      return relationship;
    } catch (error) {
      logger.error('Failed to link competitor to geographic region:', error as Record<string, unknown>);
      throw error;
    }
  }

  async linkCompetitorToTechnology(
    competitorId: string,
    technologyName: string,
    properties: {
      since?: Date;
      implementation?: string;
      purpose?: string;
      effectiveness?: number;
    } = {}
  ): Promise<MarketRelationship> {
    try {
      logger.debug('Linking competitor to technology', { competitorId, technologyName });

      const params = {
        competitorId,
        techName: technologyName,
        since: properties.since?.toISOString() || new Date().toISOString(),
        implementation: properties.implementation || '',
        purpose: properties.purpose || '',
        effectiveness: properties.effectiveness || null,
        createdAt: new Date().toISOString()
      };

      await memgraphBI.executeQuery(RELATIONSHIP_TEMPLATES.COMPETITOR_USES_TECHNOLOGY, params);

      const relationship: MarketRelationship = {
        entityId: competitorId,
        entityType: 'competitor',
        targetId: technologyName,
        targetType: 'technology',
        relationshipType: 'USES_TECHNOLOGY',
        properties,
        createdAt: new Date()
      };

      logger.info('Competitor linked to technology successfully', { competitorId, technologyName });
      return relationship;
    } catch (error) {
      logger.error('Failed to link competitor to technology:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Product Relationships
  async createProductRelationship(
    product1Id: string,
    product2Id: string,
    relationshipType: 'COMPETES_WITH' | 'SUBSTITUTES' | 'COMPLEMENTS',
    properties: Record<string, unknown> = {}
  ): Promise<ProductRelationship> {
    try {
      logger.debug('Creating product relationship', {
        product1Id,
        product2Id,
        relationshipType
      });

      let template: string;
      switch (relationshipType) {
        case 'COMPETES_WITH':
          template = RELATIONSHIP_TEMPLATES.PRODUCT_COMPETES_WITH;
          break;
        case 'SUBSTITUTES':
          template = RELATIONSHIP_TEMPLATES.PRODUCT_SUBSTITUTES;
          break;
        case 'COMPLEMENTS':
          template = RELATIONSHIP_TEMPLATES.PRODUCT_COMPLEMENTS;
          break;
        default:
          throw new Error(`Unknown product relationship type: ${relationshipType}`);
      }

      const params = {
        product1Id,
        product2Id,
        ...properties,
        createdAt: new Date().toISOString()
      };

      const result = await memgraphBI.executeQuery(template, params);

      if (result.records.length === 0) {
        throw new Error('Failed to create product relationship');
      }

      const relationship: ProductRelationship = {
        sourceProductId: product1Id,
        targetProductId: product2Id,
        type: relationshipType,
        properties,
        createdAt: new Date()
      };

      logger.info('Product relationship created successfully', {
        product1Id,
        product2Id,
        relationshipType
      });

      return relationship;
    } catch (error) {
      logger.error('Failed to create product relationship:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Linking Products to Market Elements
  async linkProductToSegment(
    productId: string,
    segmentId: string,
    properties: {
      fitScore?: number;
      positioning?: string;
      messaging?: string;
    } = {}
  ): Promise<MarketRelationship> {
    try {
      logger.debug('Linking product to market segment', { productId, segmentId });

      const params = {
        productId,
        segmentId,
        fitScore: properties.fitScore || null,
        positioning: properties.positioning || '',
        messaging: properties.messaging || '',
        createdAt: new Date().toISOString()
      };

      await memgraphBI.executeQuery(RELATIONSHIP_TEMPLATES.PRODUCT_TARGETS_SEGMENT, params);

      const relationship: MarketRelationship = {
        entityId: productId,
        entityType: 'product',
        targetId: segmentId,
        targetType: 'segment',
        relationshipType: 'TARGETS',
        properties,
        createdAt: new Date()
      };

      logger.info('Product linked to market segment successfully', { productId, segmentId });
      return relationship;
    } catch (error) {
      logger.error('Failed to link product to market segment:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Query Relationships
  async getCompetitorRelationships(competitorId: string): Promise<{
    competitors: Array<{
      id: string;
      name: string;
      relationshipType: string;
      properties: Record<string, unknown>;
    }>;
    industries: Array<{
      name: string;
      properties: Record<string, unknown>;
    }>;
    segments: Array<{
      id: string;
      name: string;
      properties: Record<string, unknown>;
    }>;
    regions: Array<{
      id: string;
      name: string;
      properties: Record<string, unknown>;
    }>;
    technologies: Array<{
      name: string;
      properties: Record<string, unknown>;
    }>;
  }> {
    try {
      logger.debug('Fetching competitor relationships', { competitorId });

      const result = await memgraphBI.executeQuery(`
        MATCH (c:Competitor {id: $competitorId})
        OPTIONAL MATCH (c)-[r1:COMPETES_WITH|PARTNERS_WITH]-(other:Competitor)
        OPTIONAL MATCH (c)-[r2:OPERATES_IN]->(i:Industry)
        OPTIONAL MATCH (c)-[r3:TARGETS]->(ms:MarketSegment)
        OPTIONAL MATCH (c)-[r4:OPERATES_IN]->(gr:GeographicRegion)
        OPTIONAL MATCH (c)-[r5:USES_TECHNOLOGY]->(ts:TechnologyStack)
        RETURN
          collect(DISTINCT {competitor: other, relationship: r1}) as competitors,
          collect(DISTINCT {industry: i, relationship: r2}) as industries,
          collect(DISTINCT {segment: ms, relationship: r3}) as segments,
          collect(DISTINCT {region: gr, relationship: r4}) as regions,
          collect(DISTINCT {technology: ts, relationship: r5}) as technologies
      `, { competitorId });

      if (result.records.length === 0) {
        return {
          competitors: [],
          industries: [],
          segments: [],
          regions: [],
          technologies: []
        };
      }

      const record = result.records[0];
      if (!record) {
        throw new Error('No records found');
      }

      const relationships = {
        competitors: (record.get('competitors') || [] as MemgraphRelationshipItem[])
          .filter((item: MemgraphRelationshipItem) => item.competitor)
          .map((item: MemgraphRelationshipItem) => ({
            id: item.competitor!.properties.id,
            name: item.competitor!.properties.name,
            relationshipType: item.relationship.type,
            properties: item.relationship.properties
          })),

        industries: (record.get('industries') || [] as MemgraphRelationshipItem[])
          .filter((item: MemgraphRelationshipItem) => item.industry)
          .map((item: MemgraphRelationshipItem) => ({
            name: item.industry!.properties.name,
            properties: item.relationship.properties
          })),

        segments: (record.get('segments') || [] as MemgraphRelationshipItem[])
          .filter((item: MemgraphRelationshipItem) => item.segment)
          .map((item: MemgraphRelationshipItem) => ({
            id: item.segment!.properties.id,
            name: item.segment!.properties.name,
            properties: item.relationship.properties
          })),

        regions: (record.get('regions') || [] as MemgraphRelationshipItem[])
          .filter((item: MemgraphRelationshipItem) => item.region)
          .map((item: MemgraphRelationshipItem) => ({
            id: item.region!.properties.id,
            name: item.region!.properties.name,
            properties: item.relationship.properties
          })),

        technologies: (record.get('technologies') || [] as MemgraphRelationshipItem[])
          .filter((item: MemgraphRelationshipItem) => item.technology)
          .map((item: MemgraphRelationshipItem) => ({
            name: item.technology!.properties.name,
            properties: item.relationship.properties
          }))
      };

      logger.debug('Competitor relationships fetched successfully', {
        competitorId,
        competitorCount: relationships.competitors.length,
        industryCount: relationships.industries.length,
        segmentCount: relationships.segments.length,
        regionCount: relationships.regions.length,
        technologyCount: relationships.technologies.length
      });

      return relationships;
    } catch (error) {
      logger.error('Failed to fetch competitor relationships:', error as Record<string, unknown>);
      throw error;
    }
  }

  async getProductRelationships(productId: string): Promise<{
    competitors: Array<{
      id: string;
      name: string;
      relationship: string;
      properties: Record<string, unknown>;
    }>;
    substitutes: Array<{
      id: string;
      name: string;
      properties: Record<string, unknown>;
    }>;
    complements: Array<{
      id: string;
      name: string;
      properties: Record<string, unknown>;
    }>;
  }> {
    try {
      logger.debug('Fetching product relationships', { productId });

      const result = await memgraphBI.executeQuery(`
        MATCH (p:Product {id: $productId})
        OPTIONAL MATCH (p)-[r1:COMPETES_WITH]-(competitor:Product)
        OPTIONAL MATCH (p)-[r2:SUBSTITUTES]-(substitute:Product)
        OPTIONAL MATCH (p)-[r3:COMPLEMENTS]-(complement:Product)
        RETURN
          collect(DISTINCT {product: competitor, relationship: r1}) as competitors,
          collect(DISTINCT {product: substitute, relationship: r2}) as substitutes,
          collect(DISTINCT {product: complement, relationship: r3}) as complements
      `, { productId });

      if (result.records.length === 0) {
        return {
          competitors: [],
          substitutes: [],
          complements: []
        };
      }

      const record = result.records[0];
      if (!record) {
        throw new Error('No records found');
      }

      const relationships = {
        competitors: (record.get('competitors') || [])
          .filter((item: MemgraphRelationshipItem) => item.product)
          .map((item: MemgraphRelationshipItem) => ({
            id: item.product!.properties.id,
            name: item.product!.properties.name,
            relationship: 'COMPETES_WITH',
            properties: item.relationship.properties
          })),

        substitutes: (record.get('substitutes') || [])
          .filter((item: MemgraphRelationshipItem) => item.product)
          .map((item: MemgraphRelationshipItem) => ({
            id: item.product!.properties.id,
            name: item.product!.properties.name,
            properties: item.relationship.properties
          })),

        complements: (record.get('complements') || [])
          .filter((item: MemgraphRelationshipItem) => item.product)
          .map((item: MemgraphRelationshipItem) => ({
            id: item.product!.properties.id,
            name: item.product!.properties.name,
            properties: item.relationship.properties
          }))
      };

      logger.debug('Product relationships fetched successfully', {
        productId,
        competitorCount: relationships.competitors.length,
        substituteCount: relationships.substitutes.length,
        complementCount: relationships.complements.length
      });

      return relationships;
    } catch (error) {
      logger.error('Failed to fetch product relationships:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Remove relationships
  async removeCompetitorRelationship(
    competitor1Id: string,
    competitor2Id: string,
    relationshipType?: string
  ): Promise<boolean> {
    try {
      logger.debug('Removing competitor relationship', {
        competitor1Id,
        competitor2Id,
        relationshipType
      });

      const typeFilter = relationshipType ? `:${relationshipType}` : '';

      const result = await memgraphBI.executeQuery(`
        MATCH (c1:Competitor {id: $competitor1Id})-[r${typeFilter}]-(c2:Competitor {id: $competitor2Id})
        DELETE r
        RETURN count(r) as deletedCount
      `, { competitor1Id, competitor2Id });

      const deletedCount = result.records[0]?.get('deletedCount')?.toNumber?.() || 0;

      logger.info('Competitor relationship removed', {
        competitor1Id,
        competitor2Id,
        deletedCount
      });

      return deletedCount > 0;
    } catch (error) {
      logger.error('Failed to remove competitor relationship:', error as Record<string, unknown>);
      throw error;
    }
  }

  async removeProductRelationship(
    product1Id: string,
    product2Id: string,
    relationshipType?: string
  ): Promise<boolean> {
    try {
      logger.debug('Removing product relationship', {
        product1Id,
        product2Id,
        relationshipType
      });

      const typeFilter = relationshipType ? `:${relationshipType}` : '';

      const result = await memgraphBI.executeQuery(`
        MATCH (p1:Product {id: $product1Id})-[r${typeFilter}]-(p2:Product {id: $product2Id})
        DELETE r
        RETURN count(r) as deletedCount
      `, { product1Id, product2Id });

      const deletedCount = result.records[0]?.get('deletedCount')?.toNumber?.() || 0;

      logger.info('Product relationship removed', {
        product1Id,
        product2Id,
        deletedCount
      });

      return deletedCount > 0;
    } catch (error) {
      logger.error('Failed to remove product relationship:', error as Record<string, unknown>);
      throw error;
    }
  }
}

// Export singleton instance
export const relationshipOperations = new RelationshipOperations();