// Business Intelligence - Memgraph Schema Definitions
import { logger } from '@/lib/logger';
import { memgraphBI } from './connection';

// Schema Creation Queries
export const SCHEMA_QUERIES = {
  // Competitor node creation
  CREATE_COMPETITOR_INDEX: `
    CREATE INDEX ON :Competitor(id);
  `,

  CREATE_COMPETITOR_CONSTRAINTS: `
    CREATE CONSTRAINT ON (c:Competitor) ASSERT c.id IS UNIQUE;
  `,

  // Product node creation
  CREATE_PRODUCT_INDEX: `
    CREATE INDEX ON :Product(id);
  `,

  CREATE_PRODUCT_CONSTRAINTS: `
    CREATE CONSTRAINT ON (p:Product) ASSERT p.id IS UNIQUE;
  `,

  // Channel node creation
  CREATE_CHANNEL_INDEX: `
    CREATE INDEX ON :Channel(id);
  `,

  CREATE_CHANNEL_CONSTRAINTS: `
    CREATE CONSTRAINT ON (ch:Channel) ASSERT ch.id IS UNIQUE;
  `,

  // Campaign node creation
  CREATE_CAMPAIGN_INDEX: `
    CREATE INDEX ON :Campaign(id);
  `,

  CREATE_CAMPAIGN_CONSTRAINTS: `
    CREATE CONSTRAINT ON (ca:Campaign) ASSERT ca.id IS UNIQUE;
  `,

  // Market Segment node creation
  CREATE_MARKET_SEGMENT_INDEX: `
    CREATE INDEX ON :MarketSegment(id);
  `,

  CREATE_MARKET_SEGMENT_CONSTRAINTS: `
    CREATE CONSTRAINT ON (ms:MarketSegment) ASSERT ms.id IS UNIQUE;
  `,

  // Industry node creation
  CREATE_INDUSTRY_INDEX: `
    CREATE INDEX ON :Industry(name);
  `,

  CREATE_INDUSTRY_CONSTRAINTS: `
    CREATE CONSTRAINT ON (i:Industry) ASSERT i.name IS UNIQUE;
  `,

  // Geographic Region node creation
  CREATE_REGION_INDEX: `
    CREATE INDEX ON :GeographicRegion(id);
  `,

  CREATE_REGION_CONSTRAINTS: `
    CREATE CONSTRAINT ON (gr:GeographicRegion) ASSERT gr.id IS UNIQUE;
  `,

  // Technology Stack node creation
  CREATE_TECH_STACK_INDEX: `
    CREATE INDEX ON :TechnologyStack(name);
  `,

  CREATE_TECH_STACK_CONSTRAINTS: `
    CREATE CONSTRAINT ON (ts:TechnologyStack) ASSERT ts.name IS UNIQUE;
  `,

  // Additional indexes for performance
  CREATE_COMPETITOR_DOMAIN_INDEX: `
    CREATE INDEX ON :Competitor(domain);
  `,

  CREATE_COMPETITOR_INDUSTRY_INDEX: `
    CREATE INDEX ON :Competitor(industry);
  `,

  CREATE_COMPETITOR_STATUS_INDEX: `
    CREATE INDEX ON :Competitor(status);
  `,

  CREATE_PRODUCT_SKU_INDEX: `
    CREATE INDEX ON :Product(sku);
  `,

  CREATE_PRODUCT_CATEGORY_INDEX: `
    CREATE INDEX ON :Product(category);
  `,

  CREATE_CHANNEL_TYPE_INDEX: `
    CREATE INDEX ON :Channel(type);
  `,

  CREATE_CAMPAIGN_STATUS_INDEX: `
    CREATE INDEX ON :Campaign(status);
  `,

  CREATE_TIMESTAMP_INDEXES: `
    CREATE INDEX ON :Competitor(createdAt);
    CREATE INDEX ON :Competitor(updatedAt);
    CREATE INDEX ON :Product(createdAt);
    CREATE INDEX ON :Product(updatedAt);
    CREATE INDEX ON :Channel(createdAt);
    CREATE INDEX ON :Campaign(startDate);
    CREATE INDEX ON :Campaign(endDate);
  `
};

// Node Creation Templates
export const NODE_TEMPLATES = {
  COMPETITOR: `
    CREATE (c:Competitor {
      id: $id,
      name: $name,
      domain: $domain,
      industry: $industry,
      size: $size,
      founded: $founded,
      category: $category,
      monitoringScope: $monitoringScope,
      monitoringFrequency: $monitoringFrequency,
      status: $status,
      description: $description,
      headquarters: $headquarters,
      employeeCount: $employeeCount,
      revenue: $revenue,
      marketCap: $marketCap,
      fundingStage: $fundingStage,
      totalFunding: $totalFunding,
      keyPersonnel: $keyPersonnel,
      businessModel: $businessModel,
      targetMarket: $targetMarket,
      coreCompetencies: $coreCompetencies,
      weaknesses: $weaknesses,
      strategicPartnerships: $strategicPartnerships,
      recentNews: $recentNews,
      socialMediaPresence: $socialMediaPresence,
      websiteTraffic: $websiteTraffic,
      searchVisibility: $searchVisibility,
      brandMentions: $brandMentions,
      customerSentiment: $customerSentiment,
      innovationIndex: $innovationIndex,
      marketPosition: $marketPosition,
      threatLevel: $threatLevel,
      opportunityScore: $opportunityScore,
      lastAnalyzed: $lastAnalyzed,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN c
  `,

  PRODUCT: `
    CREATE (p:Product {
      id: $id,
      competitorId: $competitorId,
      name: $name,
      description: $description,
      sku: $sku,
      category: $category,
      subcategory: $subcategory,
      price: $price,
      currency: $currency,
      availability: $availability,
      stockLevel: $stockLevel,
      features: $features,
      specifications: $specifications,
      images: $images,
      reviews: $reviews,
      rating: $rating,
      reviewCount: $reviewCount,
      tags: $tags,
      dimensions: $dimensions,
      weight: $weight,
      warranty: $warranty,
      shippingInfo: $shippingInfo,
      promotions: $promotions,
      crossSellProducts: $crossSellProducts,
      bundleProducts: $bundleProducts,
      variants: $variants,
      seasonality: $seasonality,
      launchDate: $launchDate,
      discontinuedDate: $discontinuedDate,
      salesRank: $salesRank,
      competitiveAdvantage: $competitiveAdvantage,
      marketShare: $marketShare,
      priceHistory: $priceHistory,
      demandTrend: $demandTrend,
      customerSegment: $customerSegment,
      distributionChannels: $distributionChannels,
      marketingMessages: $marketingMessages,
      brandPositioning: $brandPositioning,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN p
  `,

  CHANNEL: `
    CREATE (ch:Channel {
      id: $id,
      competitorId: $competitorId,
      name: $name,
      type: $type,
      url: $url,
      platform: $platform,
      description: $description,
      isActive: $isActive,
      followerCount: $followerCount,
      engagementRate: $engagementRate,
      postFrequency: $postFrequency,
      contentTypes: $contentTypes,
      primaryAudience: $primaryAudience,
      geographicReach: $geographicReach,
      languageSupport: $languageSupport,
      brandingConsistency: $brandingConsistency,
      customerServiceLevel: $customerServiceLevel,
      conversionTracking: $conversionTracking,
      analytics: $analytics,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN ch
  `,

  CAMPAIGN: `
    CREATE (ca:Campaign {
      id: $id,
      competitorId: $competitorId,
      name: $name,
      type: $type,
      status: $status,
      objective: $objective,
      description: $description,
      targetAudience: $targetAudience,
      budget: $budget,
      currency: $currency,
      startDate: $startDate,
      endDate: $endDate,
      channels: $channels,
      creativeAssets: $creativeAssets,
      messaging: $messaging,
      callToAction: $callToAction,
      landingPages: $landingPages,
      trackingParameters: $trackingParameters,
      kpis: $kpis,
      performance: $performance,
      reach: $reach,
      impressions: $impressions,
      clicks: $clicks,
      conversions: $conversions,
      cost: $cost,
      roi: $roi,
      sentimentAnalysis: $sentimentAnalysis,
      competitiveResponse: $competitiveResponse,
      learnings: $learnings,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN ca
  `,

  MARKET_SEGMENT: `
    CREATE (ms:MarketSegment {
      id: $id,
      name: $name,
      description: $description,
      size: $size,
      growthRate: $growthRate,
      characteristics: $characteristics,
      needsAndPainPoints: $needsAndPainPoints,
      buyingBehavior: $buyingBehavior,
      demographics: $demographics,
      psychographics: $psychographics,
      geographicDistribution: $geographicDistribution,
      seasonality: $seasonality,
      pricesensitivity: $pricesensitivity,
      brandLoyalty: $brandLoyalty,
      channelPreferences: $channelPreferences,
      influencers: $influencers,
      competitiveIntensity: $competitiveIntensity,
      barrierToEntry: $barrierToEntry,
      regulatoryFactors: $regulatoryFactors,
      technologyAdoption: $technologyAdoption,
      trends: $trends,
      opportunities: $opportunities,
      threats: $threats,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN ms
  `,

  INDUSTRY: `
    CREATE (i:Industry {
      name: $name,
      description: $description,
      marketSize: $marketSize,
      growthRate: $growthRate,
      maturityStage: $maturityStage,
      keyTrends: $keyTrends,
      disruptiveForces: $disruptiveForces,
      regulatoryEnvironment: $regulatoryEnvironment,
      keySuccessFactors: $keySuccessFactors,
      valueChain: $valueChain,
      supplierPower: $supplierPower,
      buyerPower: $buyerPower,
      threatOfSubstitutes: $threatOfSubstitutes,
      threatOfNewEntrants: $threatOfNewEntrants,
      competitiveRivalry: $competitiveRivalry,
      profitabilityFactors: $profitabilityFactors,
      innovationRate: $innovationRate,
      globalPresence: $globalPresence,
      sustainability: $sustainability,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN i
  `,

  GEOGRAPHIC_REGION: `
    CREATE (gr:GeographicRegion {
      id: $id,
      name: $name,
      type: $type,
      country: $country,
      state: $state,
      city: $city,
      coordinates: $coordinates,
      population: $population,
      economicIndicators: $economicIndicators,
      marketCharacteristics: $marketCharacteristics,
      culturalFactors: $culturalFactors,
      languagePreferences: $languagePreferences,
      regulatoryEnvironment: $regulatoryEnvironment,
      businessEnvironment: $businessEnvironment,
      competitiveLandscape: $competitiveLandscape,
      customerBehavior: $customerBehavior,
      distributionChannels: $distributionChannels,
      mediaConsumption: $mediaConsumption,
      ecommerceAdoption: $ecommerceAdoption,
      paymentPreferences: $paymentPreferences,
      logisticsInfrastructure: $logisticsInfrastructure,
      marketOpportunities: $marketOpportunities,
      marketChallenges: $marketChallenges,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN gr
  `,

  TECHNOLOGY_STACK: `
    CREATE (ts:TechnologyStack {
      name: $name,
      category: $category,
      description: $description,
      vendor: $vendor,
      version: $version,
      purpose: $purpose,
      features: $features,
      advantages: $advantages,
      limitations: $limitations,
      cost: $cost,
      implementation: $implementation,
      integrations: $integrations,
      security: $security,
      scalability: $scalability,
      performance: $performance,
      support: $support,
      documentation: $documentation,
      communitySize: $communitySize,
      adoptionRate: $adoptionRate,
      marketShare: $marketShare,
      alternatives: $alternatives,
      futureRoadmap: $futureRoadmap,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN ts
  `
};

// Relationship Creation Templates
export const RELATIONSHIP_TEMPLATES = {
  // Competitor relationships
  COMPETITOR_OPERATES_IN_INDUSTRY: `
    MATCH (c:Competitor {id: $competitorId}), (i:Industry {name: $industryName})
    CREATE (c)-[r:OPERATES_IN {
      since: $since,
      marketShare: $marketShare,
      position: $position,
      createdAt: $createdAt
    }]->(i)
    RETURN r
  `,

  COMPETITOR_TARGETS_SEGMENT: `
    MATCH (c:Competitor {id: $competitorId}), (ms:MarketSegment {id: $segmentId})
    CREATE (c)-[r:TARGETS {
      priority: $priority,
      approach: $approach,
      effectiveness: $effectiveness,
      since: $since,
      createdAt: $createdAt
    }]->(ms)
    RETURN r
  `,

  COMPETITOR_OPERATES_IN_REGION: `
    MATCH (c:Competitor {id: $competitorId}), (gr:GeographicRegion {id: $regionId})
    CREATE (c)-[r:OPERATES_IN {
      since: $since,
      marketShare: $marketShare,
      investment: $investment,
      strategy: $strategy,
      createdAt: $createdAt
    }]->(gr)
    RETURN r
  `,

  COMPETITOR_USES_TECHNOLOGY: `
    MATCH (c:Competitor {id: $competitorId}), (ts:TechnologyStack {name: $techName})
    CREATE (c)-[r:USES_TECHNOLOGY {
      since: $since,
      implementation: $implementation,
      purpose: $purpose,
      effectiveness: $effectiveness,
      createdAt: $createdAt
    }]->(ts)
    RETURN r
  `,

  // Product relationships
  COMPETITOR_OFFERS_PRODUCT: `
    MATCH (c:Competitor {id: $competitorId}), (p:Product {id: $productId})
    CREATE (c)-[r:OFFERS {
      launchDate: $launchDate,
      priority: $priority,
      salesContribution: $salesContribution,
      createdAt: $createdAt
    }]->(p)
    RETURN r
  `,

  PRODUCT_TARGETS_SEGMENT: `
    MATCH (p:Product {id: $productId}), (ms:MarketSegment {id: $segmentId})
    CREATE (p)-[r:TARGETS {
      fitScore: $fitScore,
      positioning: $positioning,
      messaging: $messaging,
      createdAt: $createdAt
    }]->(ms)
    RETURN r
  `,

  PRODUCT_AVAILABLE_IN_REGION: `
    MATCH (p:Product {id: $productId}), (gr:GeographicRegion {id: $regionId})
    CREATE (p)-[r:AVAILABLE_IN {
      launchDate: $launchDate,
      price: $price,
      currency: $currency,
      availability: $availability,
      createdAt: $createdAt
    }]->(gr)
    RETURN r
  `,

  // Channel relationships
  COMPETITOR_USES_CHANNEL: `
    MATCH (c:Competitor {id: $competitorId}), (ch:Channel {id: $channelId})
    CREATE (c)-[r:USES_CHANNEL {
      since: $since,
      investment: $investment,
      effectiveness: $effectiveness,
      reach: $reach,
      createdAt: $createdAt
    }]->(ch)
    RETURN r
  `,

  CHANNEL_REACHES_SEGMENT: `
    MATCH (ch:Channel {id: $channelId}), (ms:MarketSegment {id: $segmentId})
    CREATE (ch)-[r:REACHES {
      reach: $reach,
      engagement: $engagement,
      conversion: $conversion,
      effectiveness: $effectiveness,
      createdAt: $createdAt
    }]->(ms)
    RETURN r
  `,

  CHANNEL_OPERATES_IN_REGION: `
    MATCH (ch:Channel {id: $channelId}), (gr:GeographicRegion {id: $regionId})
    CREATE (ch)-[r:OPERATES_IN {
      reach: $reach,
      localization: $localization,
      performance: $performance,
      createdAt: $createdAt
    }]->(gr)
    RETURN r
  `,

  // Campaign relationships
  COMPETITOR_RUNS_CAMPAIGN: `
    MATCH (c:Competitor {id: $competitorId}), (ca:Campaign {id: $campaignId})
    CREATE (c)-[r:RUNS {
      budget: $budget,
      priority: $priority,
      objectives: $objectives,
      createdAt: $createdAt
    }]->(ca)
    RETURN r
  `,

  CAMPAIGN_TARGETS_SEGMENT: `
    MATCH (ca:Campaign {id: $campaignId}), (ms:MarketSegment {id: $segmentId})
    CREATE (ca)-[r:TARGETS {
      allocation: $allocation,
      messaging: $messaging,
      channels: $channels,
      performance: $performance,
      createdAt: $createdAt
    }]->(ms)
    RETURN r
  `,

  CAMPAIGN_RUNS_IN_REGION: `
    MATCH (ca:Campaign {id: $campaignId}), (gr:GeographicRegion {id: $regionId})
    CREATE (ca)-[r:RUNS_IN {
      budget: $budget,
      reach: $reach,
      localization: $localization,
      performance: $performance,
      createdAt: $createdAt
    }]->(gr)
    RETURN r
  `,

  CAMPAIGN_PROMOTES_PRODUCT: `
    MATCH (ca:Campaign {id: $campaignId}), (p:Product {id: $productId})
    CREATE (ca)-[r:PROMOTES {
      emphasis: $emphasis,
      messaging: $messaging,
      creativeAssets: $creativeAssets,
      performance: $performance,
      createdAt: $createdAt
    }]->(p)
    RETURN r
  `,

  CAMPAIGN_USES_CHANNEL: `
    MATCH (ca:Campaign {id: $campaignId}), (ch:Channel {id: $channelId})
    CREATE (ca)-[r:USES_CHANNEL {
      budget: $budget,
      duration: $duration,
      reach: $reach,
      performance: $performance,
      createdAt: $createdAt
    }]->(ch)
    RETURN r
  `,

  // Competitor-to-competitor relationships
  COMPETITOR_COMPETES_WITH: `
    MATCH (c1:Competitor {id: $competitor1Id}), (c2:Competitor {id: $competitor2Id})
    CREATE (c1)-[r:COMPETES_WITH {
      intensity: $intensity,
      directness: $directness,
      marketOverlap: $marketOverlap,
      productOverlap: $productOverlap,
      targetAudienceOverlap: $targetAudienceOverlap,
      geographicOverlap: $geographicOverlap,
      competitiveAdvantages: $competitiveAdvantages,
      competitiveDisadvantages: $competitiveDisadvantages,
      relationshipType: $relationshipType,
      since: $since,
      createdAt: $createdAt
    }]->(c2)
    RETURN r
  `,

  COMPETITOR_PARTNERS_WITH: `
    MATCH (c1:Competitor {id: $competitor1Id}), (c2:Competitor {id: $competitor2Id})
    CREATE (c1)-[r:PARTNERS_WITH {
      partnershipType: $partnershipType,
      scope: $scope,
      since: $since,
      value: $value,
      strategicImportance: $strategicImportance,
      exclusivity: $exclusivity,
      createdAt: $createdAt
    }]->(c2)
    RETURN r
  `,

  // Product-to-product relationships
  PRODUCT_COMPETES_WITH: `
    MATCH (p1:Product {id: $product1Id}), (p2:Product {id: $product2Id})
    CREATE (p1)-[r:COMPETES_WITH {
      similarity: $similarity,
      priceComparison: $priceComparison,
      featureComparison: $featureComparison,
      marketOverlap: $marketOverlap,
      customerPreference: $customerPreference,
      competitiveAdvantage: $competitiveAdvantage,
      createdAt: $createdAt
    }]->(p2)
    RETURN r
  `,

  PRODUCT_SUBSTITUTES: `
    MATCH (p1:Product {id: $product1Id}), (p2:Product {id: $product2Id})
    CREATE (p1)-[r:SUBSTITUTES {
      substitutability: $substitutability,
      switchingCost: $switchingCost,
      customerBehavior: $customerBehavior,
      threatLevel: $threatLevel,
      createdAt: $createdAt
    }]->(p2)
    RETURN r
  `,

  PRODUCT_COMPLEMENTS: `
    MATCH (p1:Product {id: $product1Id}), (p2:Product {id: $product2Id})
    CREATE (p1)-[r:COMPLEMENTS {
      synergy: $synergy,
      crossSellPotential: $crossSellPotential,
      bundleOpportunity: $bundleOpportunity,
      customerValue: $customerValue,
      createdAt: $createdAt
    }]->(p2)
    RETURN r
  `
};

// Schema initialization class
export class MemgraphBISchema {
  private static instance: MemgraphBISchema | null = null;

  public static getInstance(): MemgraphBISchema {
    if (!MemgraphBISchema.instance) {
      MemgraphBISchema.instance = new MemgraphBISchema();
    }
    return MemgraphBISchema.instance;
  }

  // Initialize the complete schema
  public async initializeSchema(): Promise<boolean> {
    try {
      logger.info('Initializing Business Intelligence Memgraph schema...');

      // Create constraints and indexes
      const schemaQueries = Object.values(SCHEMA_QUERIES);

      for (const query of schemaQueries) {
        try {
          await memgraphBI.executeQuery(query.trim());
          logger.debug('Schema query executed successfully');
        } catch {
          // Some constraints/indexes might already exist, log but continue
          logger.debug('Schema query resulted in expected constraint/index existence');
        }
      }

      logger.info('Business Intelligence Memgraph schema initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Business Intelligence Memgraph schema:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Verify schema exists
  public async verifySchema(): Promise<{
    status: 'healthy' | 'partial' | 'missing';
    details: {
      indexes: string[];
      constraints: string[];
      missingElements: string[];
    };
  }> {
    try {
      logger.debug('Verifying Business Intelligence Memgraph schema...');

      // Check indexes
      const indexResult = await memgraphBI.executeQuery('SHOW INDEX INFO;');
      const indexes = indexResult.records.map(record => record.get('index name') || record.get('name') || 'unknown');

      // Check constraints
      const constraintResult = await memgraphBI.executeQuery('SHOW CONSTRAINT INFO;');
      const constraints = constraintResult.records.map(record => record.get('constraint name') || record.get('name') || 'unknown');

      // Expected elements (simplified check)
      const expectedIndexes = ['Competitor', 'Product', 'Channel', 'Campaign', 'MarketSegment', 'Industry', 'GeographicRegion', 'TechnologyStack'];
      const expectedConstraints = ['Competitor', 'Product', 'Channel', 'Campaign', 'MarketSegment', 'Industry', 'GeographicRegion', 'TechnologyStack'];

      const missingIndexes = expectedIndexes.filter(expected =>
        !indexes.some(existing => existing.includes(expected))
      );
      const missingConstraints = expectedConstraints.filter(expected =>
        !constraints.some(existing => existing.includes(expected))
      );

      const missingElements = [...missingIndexes.map(i => `Index: ${i}`), ...missingConstraints.map(c => `Constraint: ${c}`)];

      let status: 'healthy' | 'partial' | 'missing';
      if (missingElements.length === 0) {
        status = 'healthy';
      } else if (missingElements.length < (expectedIndexes.length + expectedConstraints.length) / 2) {
        status = 'partial';
      } else {
        status = 'missing';
      }

      logger.info('Business Intelligence Memgraph schema verification completed', {
        status,
        indexCount: indexes.length,
        constraintCount: constraints.length,
        missingCount: missingElements.length
      });

      return {
        status,
        details: {
          indexes,
          constraints,
          missingElements
        }
      };
    } catch (error) {
      logger.error('Failed to verify Business Intelligence Memgraph schema:', error as Record<string, unknown>);
      return {
        status: 'missing',
        details: {
          indexes: [],
          constraints: [],
          missingElements: ['Schema verification failed']
        }
      };
    }
  }

  // Drop all schema elements (for testing/reset)
  public async dropSchema(): Promise<boolean> {
    try {
      logger.warn('Dropping Business Intelligence Memgraph schema...');

      // Drop all nodes and relationships
      await memgraphBI.executeQuery('MATCH (n) DETACH DELETE n;');

      // Drop constraints and indexes
      const constraintResult = await memgraphBI.executeQuery('SHOW CONSTRAINT INFO;');
      for (const record of constraintResult.records) {
        const constraintName = record.get('constraint name') || record.get('name');
        if (constraintName) {
          try {
            await memgraphBI.executeQuery(`DROP CONSTRAINT ${constraintName};`);
          } catch {
            logger.debug('Constraint drop may have failed (expected):', { constraintName });
          }
        }
      }

      const indexResult = await memgraphBI.executeQuery('SHOW INDEX INFO;');
      for (const record of indexResult.records) {
        const indexName = record.get('index name') || record.get('name');
        if (indexName) {
          try {
            await memgraphBI.executeQuery(`DROP INDEX ${indexName};`);
          } catch {
            logger.debug('Index drop may have failed (expected):', { indexName });
          }
        }
      }

      logger.warn('Business Intelligence Memgraph schema dropped successfully');
      return true;
    } catch (error) {
      logger.error('Failed to drop Business Intelligence Memgraph schema:', error as Record<string, unknown>);
      throw error;
    }
  }
}

// Export singleton instance
export const memgraphBISchema = MemgraphBISchema.getInstance();