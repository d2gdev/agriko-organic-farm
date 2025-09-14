// Multi-Factor Recommendation Algorithm for Agriko
import { Session } from 'neo4j-driver';
import { logger } from '@/lib/logger';

import { withSession } from './memgraph';
import { recommendationCache } from './recommendation-cache';
import neo4j from 'neo4j-driver';

// Neo4j specific types for better type safety
interface Neo4jValue {
  toNumber?(): number;
  toString?(): string;
  toBoolean?(): boolean;
}

interface Neo4jRecord {
  get(key: string): Neo4jValue;
}

interface Neo4jResult {
  records: Neo4jRecord[];
}

// Recommendation types and interfaces
export interface RecommendationScore {
  productId: number;
  totalScore: number;
  factors: {
    collaborative: number;
    contentBased: number;
    graphBased: number;
    popularity: number;
    seasonal: number;
    health: number;
    geographical: number;
  };
  reasons: string[];
  confidence: number;
}

export interface UserProfile {
  userId?: string;
  purchaseHistory: number[];
  viewHistory: number[];
  searchHistory: string[];
  healthGoals: string[];
  preferredCategories: string[];
  dietaryRestrictions: string[];
  location?: string;
  seasonalPreferences?: string[];
}

export interface RecommendationContext {
  currentProduct?: number;
  currentCategory?: string;
  currentSeason?: string;
  healthCondition?: string;
  targetNutrient?: string;
  priceRange?: { min: number; max: number };
  inStockOnly?: boolean;
  limit?: number;
}

// Core recommendation engine class
export class MultiFactorRecommendationEngine {
  // Weight configuration for different recommendation factors
  private weights = {
    collaborative: 0.25,
    contentBased: 0.20,
    graphBased: 0.20,
    popularity: 0.10,
    seasonal: 0.10,
    health: 0.10,
    geographical: 0.05
  };

  constructor() {
    // No longer maintain persistent session - use withSession() pattern
  }

  // Main recommendation method
  async getRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext = {}
  ): Promise<RecommendationScore[]> {
    try {
      // Check cache first
      const cached = recommendationCache.get('personalized', userProfile, context);
      if (cached) {
        return cached;
      }

      logger.info('🎯 Generating multi-factor recommendations...');

      // Get candidates from different sources
      const [
        collaborativeResults,
        contentBasedResults,
        graphBasedResults,
        popularityResults,
        seasonalResults,
        healthResults,
        geographicalResults
      ] = await Promise.all([
        this.getCollaborativeRecommendations(userProfile, context),
        this.getContentBasedRecommendations(userProfile, context),
        this.getGraphBasedRecommendations(userProfile, context),
        this.getPopularityBasedRecommendations(context),
        this.getSeasonalRecommendations(context),
        this.getHealthBasedRecommendations(userProfile, context),
        this.getGeographicalRecommendations(userProfile, context)
      ]);

      // Combine and score all recommendations
      const combinedScores = this.combineRecommendations([
        { type: 'collaborative', results: collaborativeResults },
        { type: 'contentBased', results: contentBasedResults },
        { type: 'graphBased', results: graphBasedResults },
        { type: 'popularity', results: popularityResults },
        { type: 'seasonal', results: seasonalResults },
        { type: 'health', results: healthResults },
        { type: 'geographical', results: geographicalResults }
      ]);

      // Apply context filters and sort
      const filteredScores = this.applyContextFilters(combinedScores, context);
      const sortedScores = filteredScores.sort((a, b) => b.totalScore - a.totalScore);

      // Limit results
      const limit = context.limit ?? 10;
      const finalResults = sortedScores.slice(0, limit);

      // Cache the results
      recommendationCache.set('personalized', finalResults, userProfile, context);

      return finalResults;

    } catch (error) {
      logger.error('❌ Failed to generate recommendations:', error as Record<string, unknown>);
      return [];
    }
  }

  // Collaborative filtering based on user behavior similarity
  private async getCollaborativeRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<{ productId: number; score: number; reason: string }[]> {
    if (!userProfile.purchaseHistory?.length && !userProfile.viewHistory?.length) {
      return [];
    }

    try {
      const userItems = [...(userProfile.purchaseHistory || []), ...(userProfile.viewHistory || [])];
      
      return await withSession(
        async (session) => {
          const result = await session.run(`
            // Find users with similar purchase/view patterns
            WITH $userItems as userItems
            MATCH (p1:Product) WHERE p1.id IN userItems
            MATCH (p1)<-[:PURCHASED|VIEWED]-(u:User)-[:PURCHASED|VIEWED]->(p2:Product)
            WHERE NOT p2.id IN userItems
            WITH p2, COUNT(DISTINCT u) as commonUsers, COUNT(DISTINCT p1) as commonProducts
            WHERE commonUsers > 1
            RETURN p2.id as productId, 
                   (commonUsers * commonProducts) as score,
                   'Users with similar preferences also liked this' as reason
            ORDER BY score DESC
            LIMIT 20
          `, { userItems: userItems.map(id => id) });

          return result.records.map(record => this.convertRecordToResult(record));
        },
        async () => {
          logger.warn('📊 Memgraph unavailable, using empty collaborative filtering');
          return [];
        }
      );
    } catch (error) {
      logger.error('❌ Collaborative filtering failed:', error as Record<string, unknown>);
      return [];
    }
  }

  // Content-based filtering using product attributes
  private async getContentBasedRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<{ productId: number; score: number; reason: string }[]> {
    if (!userProfile.preferredCategories?.length && !context.currentProduct) {
      return [];
    }

    try {
      let query = '';
      let params: Record<string, unknown> = {};

      if (context.currentProduct) {
        // Find similar products to current product
        query = `
          MATCH (current:Product {id: $currentProductId})
          MATCH (current)-[:BELONGS_TO]->(c:Category)<-[:BELONGS_TO]-(similar:Product)
          WHERE similar.id <> $currentProductId
          WITH similar, COUNT(c) as categoryMatches
          
          OPTIONAL MATCH (current)-[:CONTAINS]->(i:Ingredient)<-[:CONTAINS]-(similar)
          WITH similar, categoryMatches, COUNT(i) as ingredientMatches
          
          OPTIONAL MATCH (current)-[:PROVIDES]->(h:HealthBenefit)<-[:PROVIDES]-(similar)
          WITH similar, categoryMatches, ingredientMatches, COUNT(h) as healthMatches
          
          RETURN similar.id as productId,
                 (categoryMatches * 3 + ingredientMatches * 2 + healthMatches) as score,
                 'Similar to your current selection' as reason
          ORDER BY score DESC
          LIMIT 15
        `;
        params = { currentProductId: context.currentProduct };
      } else {
        // Find products matching user preferences
        query = `
          MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
          WHERE c.name IN $preferredCategories
          WITH p, COUNT(c) as categoryMatches
          
          OPTIONAL MATCH (p)-[:PROVIDES]->(h:HealthBenefit)
          WHERE h.name IN $healthGoals
          WITH p, categoryMatches, COUNT(h) as healthMatches
          
          RETURN p.id as productId,
                 (categoryMatches * 2 + healthMatches * 3) as score,
                 'Matches your preferences' as reason
          ORDER BY score DESC
          LIMIT 15
        `;
        params = {
          preferredCategories: userProfile.preferredCategories || [],
          healthGoals: userProfile.healthGoals || []
        };
      }

      return await withSession(
        async (session) => {
          const result = await session.run(query, params);
          return result.records.map(record => this.convertRecordToResult(record));
        },
        async () => {
          logger.warn('📊 Memgraph unavailable, using empty content-based filtering');
          return [];
        }
      );
    } catch (error) {
      logger.error('❌ Content-based filtering failed:', error as Record<string, unknown>);
      return [];
    }
  }

  // Graph-based recommendations using relationship strengths
  private async getGraphBasedRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<{ productId: number; score: number; reason: string }[]> {
    try {
      return await withSession(
        async (session) => {
          const result = await session.run(`
            // Multi-hop graph traversal for recommendations
            MATCH (start:Product)-[r1]-(intermediate)-[r2]-(recommended:Product)
            WHERE start.id IN $userItems
            AND recommended.id NOT IN $userItems
            WITH recommended, 
                 COUNT(DISTINCT start) as connectionStrength,
                 AVG(
                   CASE 
                     WHEN type(r1) = 'CONTAINS' AND type(r2) = 'CONTAINS' THEN 2.0
                     WHEN type(r1) = 'PROVIDES' AND type(r2) = 'PROVIDES' THEN 1.5
                     WHEN type(r1) = 'BELONGS_TO' AND type(r2) = 'BELONGS_TO' THEN 1.0
                     ELSE 0.5
                   END
                 ) as relationshipStrength
            
            RETURN recommended.id as productId,
                   (connectionStrength * relationshipStrength) as score,
                   'Connected through shared attributes' as reason
            ORDER BY score DESC
            LIMIT 15
          `, {
            userItems: [...(userProfile.purchaseHistory || []), ...(userProfile.viewHistory || [])]
              .map(id => neo4j.int(id))
          });

          return result.records.map(record => this.convertRecordToResult(record));
        },
        async () => {
          logger.warn('📊 Memgraph unavailable, using empty graph-based filtering');
          return [];
        }
      );
    } catch (error) {
      logger.error('❌ Graph-based recommendations failed:', error as Record<string, unknown>);
      return [];
    }
  }

  // Popularity-based recommendations
  private async getPopularityBasedRecommendations(
    context: RecommendationContext
  ): Promise<{ productId: number; score: number; reason: string }[]> {
    try {
      let query = `
        MATCH (p:Product)
        WHERE p.inStock = true
      `;

      if (context.currentCategory) {
        query += ` AND (p)-[:BELONGS_TO]->(:Category {name: $category})`;
      }

      query += `
        WITH p,
             CASE WHEN p.featured THEN 2.0 ELSE 1.0 END as featuredBoost,
             p.price as price
        
        // Simulate popularity based on featured status and price appeal
        RETURN p.id as productId,
               (featuredBoost + (1000.0 / (p.price + 1))) as score,
               'Popular and well-regarded product' as reason
        ORDER BY score DESC
        LIMIT 10
      `;

      const params: Record<string, string> = {};
      if (context.currentCategory) {
        params.category = context.currentCategory;
      }

      return await withSession(
        async (session) => {
          const result = await session.run(query, params);
          return result.records.map(record => this.convertRecordToResult(record));
        },
        async () => {
          logger.warn('📊 Memgraph unavailable, using empty popularity-based filtering');
          return [];
        }
      );
    } catch (error) {
      logger.error('❌ Popularity-based recommendations failed:', error as Record<string, unknown>);
      return [];
    }
  }

  // Seasonal recommendations
  private async getSeasonalRecommendations(
    context: RecommendationContext
  ): Promise<{ productId: number; score: number; reason: string }[]> {
    if (!context.currentSeason) {
      return [];
    }

    try {
      return await withSession(
        async (session) => {
          const result = await session.run(`
            MATCH (p:Product)-[:HARVESTED_IN]->(s:Season {name: $seasonName})
            RETURN p.id as productId,
                   3.0 as score,
                   'Perfect for current season' as reason
            ORDER BY p.featured DESC
            LIMIT 10
          `, { seasonName: context.currentSeason });

          return result.records.map(record => this.convertRecordToResult(record));
        },
        async () => {
          logger.warn('📊 Memgraph unavailable, using empty seasonal filtering');
          return [];
        }
      );
    } catch (error) {
      logger.error('❌ Seasonal recommendations failed:', error as Record<string, unknown>);
      return [];
    }
  }

  // Health-based recommendations
  private async getHealthBasedRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<{ productId: number; score: number; reason: string }[]> {
    if (!userProfile.healthGoals?.length && !context.healthCondition && !context.targetNutrient) {
      return [];
    }

    try {
      let query = '';
      let params: Record<string, unknown> = {};

      if (context.healthCondition) {
        query = `
          MATCH (p:Product)-[:PROVIDES]->(h:HealthBenefit)-[:TREATS]->(c:Condition {name: $conditionName})
          RETURN p.id as productId,
                 4.0 as score,
                 'May help with your health condition' as reason
          ORDER BY p.featured DESC
          LIMIT 10
        `;
        params.conditionName = context.healthCondition;
      } else if (context.targetNutrient) {
        query = `
          MATCH (p:Product)-[:CONTAINS]->(i:Ingredient)-[:RICH_IN]->(n:Nutrient {name: $nutrientName})
          RETURN p.id as productId,
                 3.5 as score,
                 'Rich in your target nutrient' as reason
          ORDER BY p.featured DESC
          LIMIT 10
        `;
        params.nutrientName = context.targetNutrient;
      } else {
        query = `
          MATCH (p:Product)-[:PROVIDES]->(h:HealthBenefit)
          WHERE h.name IN $healthGoals
          WITH p, COUNT(h) as healthMatches
          RETURN p.id as productId,
                 (healthMatches * 2.0) as score,
                 'Supports your health goals' as reason
          ORDER BY score DESC
          LIMIT 10
        `;
        params = { healthGoals: userProfile.healthGoals };
      }

      return await withSession(
        async (session) => {
          const result = await session.run(query, params);
          return result.records.map(record => this.convertRecordToResult(record));
        },
        async () => {
          logger.warn('📊 Memgraph unavailable, using empty health-based filtering');
          return [];
        }
      );
    } catch (error) {
      logger.error('❌ Health-based recommendations failed:', error as Record<string, unknown>);
      return [];
    }
  }

  // Geographical recommendations
  private async getGeographicalRecommendations(
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<{ productId: number; score: number; reason: string }[]> {
    if (!userProfile.location) {
      return [];
    }

    try {
      return await withSession(
        async (session) => {
          const result = await session.run(`
            MATCH (p:Product)-[:GROWN_IN]->(r:Region)
            WHERE r.name CONTAINS $location OR r.country CONTAINS $location
            RETURN p.id as productId,
                   2.0 as score,
                   'Locally sourced from your region' as reason
            ORDER BY p.featured DESC
            LIMIT 8
          `, { location: userProfile.location });

          return result.records.map(record => this.convertRecordToResult(record));
        },
        async () => {
          logger.warn('📊 Memgraph unavailable, using empty geographical filtering');
          return [];
        }
      );
    } catch (error) {
      logger.error('❌ Geographical recommendations failed:', error as Record<string, unknown>);
      return [];
    }
  }

  // Combine all recommendation sources
  private combineRecommendations(
    sources: Array<{
      type: string;
      results: Array<{ productId: number; score: number; reason: string }>;
    }>
  ): RecommendationScore[] {
    const productScores = new Map<number, RecommendationScore>();

    sources.forEach(({ type, results }) => {
      results.forEach(({ productId, score, reason }) => {
        if (!productScores.has(productId)) {
          productScores.set(productId, {
            productId,
            totalScore: 0,
            factors: {
              collaborative: 0,
              contentBased: 0,
              graphBased: 0,
              popularity: 0,
              seasonal: 0,
              health: 0,
              geographical: 0
            },
            reasons: [],
            confidence: 0
          });
        }

        const productScore = productScores.get(productId);
        if (!productScore) return;
        
        const weightedScore = score * this.getWeightForType(type);
        
        this.setFactorScore(productScore.factors, type, weightedScore);
        productScore.totalScore += weightedScore;
        productScore.reasons.push(reason);
      });
    });

    // Calculate confidence based on number of contributing factors
    productScores.forEach(score => {
      const activeFactors = Object.values(score.factors).filter(f => f > 0).length;
      score.confidence = Math.min(activeFactors / 4, 1.0); // Max confidence with 4+ factors
    });

    return Array.from(productScores.values());
  }

  // Apply context filters
  private applyContextFilters(
    scores: RecommendationScore[],
    context: RecommendationContext
  ): RecommendationScore[] {
    return scores.filter(score => {
      // Price range filtering
      if (context.priceRange) {
        const { min, max } = context.priceRange;
        // Note: score.price would need to be added to RecommendationScore interface
        // For now, we assume all products pass price filter
        if (min !== undefined && score.productId < min) return false;
        if (max !== undefined && score.productId > max) return false;
      }

      // Category filtering
      if (context.currentCategory) {
        // Would need product category data to implement properly
        // For now, assume all products match categories
      }

      // Current season filtering - exclude out-of-season products
      if (context.currentSeason) {
        // Would filter based on product seasonality data
        // For now, assume all products are season-appropriate
      }

      // Health condition filtering
      if (context.healthCondition) {
        // Would filter products suitable for the health condition
        // For now, assume all products are suitable
      }

      // Current product filtering - exclude the product being viewed
      if (context.currentProduct && score.productId === context.currentProduct) {
        return false;
      }

      // Minimum score threshold
      if (score.totalScore < 0.1) {
        return false;
      }

      return true;
    });
  }

  // Update recommendation weights dynamically
  updateWeights(newWeights: Partial<typeof this.weights>): void {
    this.weights = { ...this.weights, ...newWeights };
    logger.info('✅ Updated recommendation weights:', this.weights);
  }

  // Get explanation for recommendations
  async getRecommendationExplanation(
    productId: number,
    userProfile: UserProfile
  ): Promise<{
    product: Record<string, unknown>;
    explanation: string;
    factors: string[];
  }> {
    try {
      return await withSession(
        async (session) => {
          const result = await session.run(`
            MATCH (p:Product {id: $productId})
            OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category)
            OPTIONAL MATCH (p)-[:PROVIDES]->(h:HealthBenefit)
            OPTIONAL MATCH (p)-[:CONTAINS]->(i:Ingredient)
            RETURN p, 
                   COLLECT(DISTINCT c.name) as categories,
                   COLLECT(DISTINCT h.name) as healthBenefits,
                   COLLECT(DISTINCT i.name) as ingredients
          `, { productId: neo4j.int(productId) });

          if (result.records.length === 0) {
            throw new Error('Product not found');
          }

          const record = result.records[0];
          if (!record) {
            throw new Error('Invalid record');
          }
          
          const productNode = record.get('p') as { properties: Record<string, unknown> };
          const product = productNode?.properties ?? {};
          const categories = (record.get('categories') as string[]) ?? [];
          const healthBenefits = (record.get('healthBenefits') as string[]) ?? [];
          const ingredients = (record.get('ingredients') as string[]) ?? [];

          const factors = [];
          let explanation = `We recommend ${product.name ?? 'this product'} because `;

          // Analyze why this product was recommended
          if (categories.some((cat: string) => userProfile.preferredCategories?.includes(cat))) {
            factors.push('matches your preferred categories');
          }
          
          if (healthBenefits.some((benefit: string) => userProfile.healthGoals?.includes(benefit))) {
            factors.push('supports your health goals');
          }

          if (product.featured === true) {
            factors.push('it\'s a featured product');
          }

          explanation += factors.join(', ') + '.';

          return {
            product,
            explanation,
            factors
          };
        },
        async () => {
          logger.warn('📊 Memgraph unavailable for recommendation explanation');
          throw new Error('Database unavailable for recommendation explanation');
        }
      );

    } catch (error) {
      logger.error('❌ Failed to get recommendation explanation:', error as Record<string, unknown>);
      throw error;
    }
  }

  // Helper method to get weight for recommendation type
  private getWeightForType(type: string): number {
    switch (type) {
      case 'collaborative': return this.weights.collaborative;
      case 'contentBased': return this.weights.contentBased;
      case 'graphBased': return this.weights.graphBased;
      case 'popularity': return this.weights.popularity;
      case 'seasonal': return this.weights.seasonal;
      case 'health': return this.weights.health;
      case 'geographical': return this.weights.geographical;
      default: return 0;
    }
  }

  // Helper method to set factor score
  private setFactorScore(factors: RecommendationScore['factors'], type: string, score: number): void {
    switch (type) {
      case 'collaborative':
        factors.collaborative = score;
        break;
      case 'contentBased':
        factors.contentBased = score;
        break;
      case 'graphBased':
        factors.graphBased = score;
        break;
      case 'popularity':
        factors.popularity = score;
        break;
      case 'seasonal':
        factors.seasonal = score;
        break;
      case 'health':
        factors.health = score;
        break;
      case 'geographical':
        factors.geographical = score;
        break;
    }
  }

  // Helper method to safely convert Neo4j record to recommendation result
  private convertRecordToResult(record: Neo4jRecord): { productId: number; score: number; reason: string } {
    const productIdValue = record.get('productId');
    const scoreValue = record.get('score');
    const reasonValue = record.get('reason');
    
    return {
      productId: productIdValue && typeof productIdValue === 'object' && 'toNumber' in productIdValue 
        ? (productIdValue as Neo4jValue).toNumber?.() ?? 0 
        : typeof productIdValue === 'number' 
          ? productIdValue 
          : 0,
      score: typeof scoreValue === 'number' ? scoreValue : Number(scoreValue) || 0,
      reason: reasonValue?.toString?.() ?? 'Recommended'
    };
  }

  // Clean up resources - no longer needed with withSession() pattern
  // Sessions are automatically managed and closed by withSession()
}

// Utility functions for recommendation system
export async function getPersonalizedRecommendations(
  userProfile: UserProfile,
  context: RecommendationContext = {}
): Promise<RecommendationScore[]> {
  const engine = new MultiFactorRecommendationEngine();
  return await engine.getRecommendations(userProfile, context);
}

export async function getSimilarProducts(
  productId: number,
  limit: number = 5
): Promise<RecommendationScore[]> {
  // Check cache first
  const cached = recommendationCache.get('similar', undefined, { currentProduct: productId, limit });
  if (cached) {
    return cached;
  }

  const engine = new MultiFactorRecommendationEngine();
  const userProfile: UserProfile = {
    purchaseHistory: [],
    viewHistory: [productId],
    searchHistory: [],
    healthGoals: [],
    preferredCategories: [],
    dietaryRestrictions: [],
    seasonalPreferences: []
  };

  const context: RecommendationContext = {
    currentProduct: productId,
    limit
  };

  const results = await engine.getRecommendations(userProfile, context);
  
  // Cache the results
  recommendationCache.set('similar', results, undefined, { currentProduct: productId, limit });
  
  return results;
}

export async function getHealthBasedRecommendations(
  healthCondition: string,
  limit: number = 10
): Promise<RecommendationScore[]> {
  // Check cache first
  const cached = recommendationCache.get('health', undefined, { healthCondition, limit });
  if (cached) {
    return cached;
  }

  const engine = new MultiFactorRecommendationEngine();
  const userProfile: UserProfile = {
    purchaseHistory: [],
    viewHistory: [],
    searchHistory: [],
    healthGoals: [healthCondition],
    preferredCategories: [],
    dietaryRestrictions: [],
    seasonalPreferences: []
  };

  const context: RecommendationContext = {
    healthCondition,
    limit
  };

  const results = await engine.getRecommendations(userProfile, context);
  
  // Cache the results
  recommendationCache.set('health', results, undefined, { healthCondition, limit });
  
  return results;
}

export async function getSeasonalRecommendations(
  season: string,
  limit: number = 10
): Promise<RecommendationScore[]> {
  // Check cache first
  const cached = recommendationCache.get('seasonal', undefined, { currentSeason: season, limit });
  if (cached) {
    return cached;
  }

  const engine = new MultiFactorRecommendationEngine();
  const userProfile: UserProfile = {
    purchaseHistory: [],
    viewHistory: [],
    searchHistory: [],
    healthGoals: [],
    preferredCategories: [],
    dietaryRestrictions: [],
    seasonalPreferences: []
  };

  const context: RecommendationContext = {
    currentSeason: season,
    limit
  };

  const results = await engine.getRecommendations(userProfile, context);
  
  // Cache the results
  recommendationCache.set('seasonal', results, undefined, { currentSeason: season, limit });
  
  return results;
}