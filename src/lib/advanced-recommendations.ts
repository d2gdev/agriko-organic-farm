// Advanced Recommendation Features with Explanations and Personalization
import { logger } from './logger';
import { withSession } from './memgraph';
import { getMultiVectorCache } from './embedding-cache';

export interface RecommendationExplanation {
  type: 'similarity' | 'complementary' | 'nutritional' | 'popularity' | 'graph-path';
  reason: string;
  confidence: number;
  details?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  healthGoals?: string[];
  dietaryRestrictions?: string[];
  preferredCategories?: string[];
  purchaseHistory?: number[];
  viewHistory?: number[];
  nutritionalNeeds?: {
    targetCalories?: number;
    targetProtein?: number;
    targetFiber?: number;
    limitSodium?: number;
    limitSugar?: number;
  };
}

export interface PersonalizedRecommendation {
  productId: number;
  score: number;
  explanations: RecommendationExplanation[];
  matchedGoals?: string[];
  nutritionalFit?: number;
  graphDistance?: number;
}

/**
 * Generate explanation for a recommendation
 */
export async function generateRecommendationExplanation(
  sourceProductId: number,
  recommendedProductId: number,
  _recommendationType: string
): Promise<RecommendationExplanation[]> {
  const explanations: RecommendationExplanation[] = [];

  try {
    // Get graph-based explanation
    const graphExplanation = await getGraphPathExplanation(sourceProductId, recommendedProductId);
    if (graphExplanation) {
      explanations.push(graphExplanation);
    }

    // Get similarity-based explanation
    const similarityExplanation = await getSimilarityExplanation(sourceProductId, recommendedProductId);
    if (similarityExplanation) {
      explanations.push(similarityExplanation);
    }

    // Get nutritional explanation
    const nutritionalExplanation = await getNutritionalExplanation(sourceProductId, recommendedProductId);
    if (nutritionalExplanation) {
      explanations.push(nutritionalExplanation);
    }

    logger.info(`Generated ${explanations.length} explanations for recommendation`);
    return explanations;

  } catch (error) {
    logger.error('Failed to generate recommendation explanation:', error as Record<string, unknown>);
    return [{
      type: 'similarity',
      reason: 'Similar product based on content analysis',
      confidence: 0.5,
    }];
  }
}

/**
 * Get graph path explanation
 */
async function getGraphPathExplanation(
  sourceId: number,
  targetId: number
): Promise<RecommendationExplanation | null> {
  try {
    return await withSession(
      async (session) => {
        // Find shortest path between products
        const result = await session.run(`
          MATCH path = shortestPath((p1:Product {id: $sourceId})-[*..5]-(p2:Product {id: $targetId}))
          RETURN path,
                 length(path) as distance,
                 [rel in relationships(path) | type(rel)] as relationshipTypes,
                 [node in nodes(path) | labels(node)[0]] as nodeTypes
        `, { sourceId, targetId });

        if (result.records.length === 0) return null;

        const record = result.records[0];
        if (!record) return null;

        const distance = record.get('distance');
        const relationshipTypes = record.get('relationshipTypes');
        const nodeTypes = record.get('nodeTypes');

        // Generate human-readable explanation
        let reason = 'Related through: ';
        const uniqueRels = [...new Set(relationshipTypes)];

        if (uniqueRels.includes('COMPLEMENTS')) {
          reason = 'Complements this product well';
        } else if (uniqueRels.includes('SUBSTITUTES_FOR')) {
          reason = 'Alternative option for similar needs';
        } else if (uniqueRels.includes('FREQUENTLY_BOUGHT_WITH')) {
          reason = 'Frequently purchased together';
        } else if (uniqueRels.includes('IN_CATEGORY')) {
          reason = 'From the same category';
        } else {
          reason += uniqueRels.join(', ');
        }

        return {
          type: 'graph-path',
          reason,
          confidence: Math.max(0.3, 1 - (distance * 0.15)),
          details: {
            distance,
            path: relationshipTypes,
            nodeTypes,
          },
        };
      },
      async () => null
    );
  } catch (error) {
    logger.error('Failed to get graph path explanation:', error as Record<string, unknown>);
    return null;
  }
}

/**
 * Get similarity explanation
 */
async function getSimilarityExplanation(
  sourceId: number,
  targetId: number
): Promise<RecommendationExplanation | null> {
  try {
    const cache = getMultiVectorCache();

    // Get embeddings for both products
    const sourceEmbedding = cache.get(`multi-vector:${sourceId}`);
    const targetEmbedding = cache.get(`multi-vector:${targetId}`);

    if (!sourceEmbedding || !targetEmbedding) {
      return null;
    }

    // Calculate cosine similarity for different aspects
    const titleSim = cosineSimilarity(sourceEmbedding.titleEmbedding, targetEmbedding.titleEmbedding);
    const descSim = cosineSimilarity(sourceEmbedding.descriptionEmbedding, targetEmbedding.descriptionEmbedding);
    const catSim = cosineSimilarity(sourceEmbedding.categoryEmbedding, targetEmbedding.categoryEmbedding);

    const avgSimilarity = (titleSim + descSim + catSim) / 3;

    let reason = '';
    if (titleSim > 0.8) {
      reason = 'Very similar product type';
    } else if (catSim > 0.8) {
      reason = 'From similar categories';
    } else if (descSim > 0.7) {
      reason = 'Similar characteristics and benefits';
    } else {
      reason = 'Related product';
    }

    return {
      type: 'similarity',
      reason,
      confidence: avgSimilarity,
      details: {
        titleSimilarity: titleSim,
        descriptionSimilarity: descSim,
        categorySimilarity: catSim,
      },
    };
  } catch (error) {
    logger.error('Failed to get similarity explanation:', error as Record<string, unknown>);
    return null;
  }
}

/**
 * Get nutritional explanation
 */
async function getNutritionalExplanation(
  sourceId: number,
  targetId: number
): Promise<RecommendationExplanation | null> {
  try {
    return await withSession(
      async (session) => {
        // Get nutritional profiles
        const result = await session.run(`
          MATCH (p1:Product {id: $sourceId})
          MATCH (p2:Product {id: $targetId})
          OPTIONAL MATCH (p1)-[:CONTAINS_NUTRIENT]->(n1:Nutrient)
          OPTIONAL MATCH (p2)-[:CONTAINS_NUTRIENT]->(n2:Nutrient)
          WITH p1, p2,
               COLLECT(DISTINCT n1.name) as nutrients1,
               COLLECT(DISTINCT n2.name) as nutrients2
          RETURN nutrients1, nutrients2,
                 p1.calories as calories1, p2.calories as calories2,
                 p1.protein as protein1, p2.protein as protein2,
                 p1.fiber as fiber1, p2.fiber as fiber2
        `, { sourceId, targetId });

        if (result.records.length === 0) return null;

        const record = result.records[0];
        if (!record) return null;

        const nutrients1 = record.get('nutrients1');
        const nutrients2 = record.get('nutrients2');

        // Find complementary nutrients
        const commonNutrients = nutrients1.filter((n: string) => nutrients2.includes(n));
        const uniqueNutrients = nutrients2.filter((n: string) => !nutrients1.includes(n));

        let reason = '';
        if (uniqueNutrients.length > 2) {
          reason = `Provides additional nutrients: ${uniqueNutrients.slice(0, 3).join(', ')}`;
        } else if (commonNutrients.length > 3) {
          reason = 'Similar nutritional profile';
        } else {
          reason = 'Complementary nutritional benefits';
        }

        return {
          type: 'nutritional',
          reason,
          confidence: 0.7,
          details: {
            commonNutrients,
            uniqueNutrients,
          },
        };
      },
      async () => null
    );
  } catch (error) {
    logger.error('Failed to get nutritional explanation:', error as Record<string, unknown>);
    return null;
  }
}

/**
 * Get personalized recommendations based on user profile
 */
export async function getPersonalizedRecommendations(
  userProfile: UserProfile,
  limit: number = 10
): Promise<PersonalizedRecommendation[]> {
  try {
    const recommendations: PersonalizedRecommendation[] = [];

    // Get collaborative filtering recommendations
    if (userProfile.purchaseHistory && userProfile.purchaseHistory.length > 0) {
      const collabRecs = await getCollaborativeRecommendations(userProfile.purchaseHistory);
      recommendations.push(...collabRecs);
    }

    // Get health goal-based recommendations
    if (userProfile.healthGoals && userProfile.healthGoals.length > 0) {
      const healthRecs = await getHealthGoalRecommendations(userProfile.healthGoals);
      recommendations.push(...healthRecs);
    }

    // Get nutritional need-based recommendations
    if (userProfile.nutritionalNeeds) {
      const nutritionalRecs = await getNutritionalNeedRecommendations(userProfile.nutritionalNeeds);
      recommendations.push(...nutritionalRecs);
    }

    // Deduplicate and sort by score
    const uniqueRecs = new Map<number, PersonalizedRecommendation>();
    for (const rec of recommendations) {
      const existing = uniqueRecs.get(rec.productId);
      if (!existing || existing.score < rec.score) {
        uniqueRecs.set(rec.productId, rec);
      }
    }

    return Array.from(uniqueRecs.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    logger.error('Failed to get personalized recommendations:', error as Record<string, unknown>);
    return [];
  }
}

/**
 * Get collaborative filtering recommendations
 */
async function getCollaborativeRecommendations(
  purchaseHistory: number[]
): Promise<PersonalizedRecommendation[]> {
  try {
    return await withSession(
      async (session) => {
        // Find products frequently bought with user's purchase history
        const result = await session.run(`
          MATCH (p1:Product)
          WHERE p1.id IN $purchaseHistory
          MATCH (p1)-[:FREQUENTLY_BOUGHT_WITH]-(p2:Product)
          WHERE NOT p2.id IN $purchaseHistory
          WITH p2, COUNT(*) as frequency
          ORDER BY frequency DESC
          LIMIT 20
          RETURN p2.id as productId, frequency
        `, { purchaseHistory });

        return result.records.map(record => ({
          productId: record.get('productId'),
          score: Math.min(1, record.get('frequency') / 10),
          explanations: [{
            type: 'popularity' as const,
            reason: 'Frequently bought with products you purchased',
            confidence: 0.8,
            details: { frequency: record.get('frequency') },
          }],
        }));
      },
      async () => []
    );
  } catch (error) {
    logger.error('Failed to get collaborative recommendations:', error as Record<string, unknown>);
    return [];
  }
}

/**
 * Get health goal-based recommendations
 */
async function getHealthGoalRecommendations(
  healthGoals: string[]
): Promise<PersonalizedRecommendation[]> {
  try {
    return await withSession(
      async (session) => {
        // Find products that match health goals
        const result = await session.run(`
          MATCH (p:Product)-[:PROVIDES]->(b:HealthBenefit)
          WHERE b.name IN $healthGoals OR b.category IN $healthGoals
          WITH p, COLLECT(b.name) as matchedBenefits, COUNT(*) as benefitCount
          ORDER BY benefitCount DESC
          LIMIT 20
          RETURN p.id as productId, matchedBenefits, benefitCount
        `, { healthGoals });

        return result.records.map(record => ({
          productId: record.get('productId'),
          score: Math.min(1, record.get('benefitCount') / 5),
          matchedGoals: record.get('matchedBenefits'),
          explanations: [{
            type: 'nutritional' as const,
            reason: `Supports your health goals: ${record.get('matchedBenefits').join(', ')}`,
            confidence: 0.85,
            details: { benefitCount: record.get('benefitCount') },
          }],
        }));
      },
      async () => []
    );
  } catch (error) {
    logger.error('Failed to get health goal recommendations:', error as Record<string, unknown>);
    return [];
  }
}

/**
 * Get nutritional need-based recommendations
 */
async function getNutritionalNeedRecommendations(
  nutritionalNeeds: UserProfile['nutritionalNeeds']
): Promise<PersonalizedRecommendation[]> {
  if (!nutritionalNeeds) return [];

  try {
    return await withSession(
      async (session) => {
        // Build dynamic query based on nutritional needs
        const whereClause = [];
        const params: Record<string, unknown> = { ...nutritionalNeeds };

        if (nutritionalNeeds.targetProtein) {
          whereClause.push('p.protein >= $targetProtein');
        }
        if (nutritionalNeeds.targetFiber) {
          whereClause.push('p.fiber >= $targetFiber');
        }
        if (nutritionalNeeds.limitSodium) {
          whereClause.push('(p.sodium IS NULL OR p.sodium <= $limitSodium)');
        }
        if (nutritionalNeeds.limitSugar) {
          whereClause.push('(p.sugar IS NULL OR p.sugar <= $limitSugar)');
        }

        if (whereClause.length === 0) return [];

        const query = `
          MATCH (p:Product)
          WHERE p.hasNutritionalData = true
            AND ${whereClause.join(' AND ')}
          WITH p,
               CASE
                 WHEN p.protein IS NOT NULL THEN p.protein * 0.25
                 ELSE 0
               END +
               CASE
                 WHEN p.fiber IS NOT NULL THEN p.fiber * 0.3
                 ELSE 0
               END as nutritionalScore
          ORDER BY nutritionalScore DESC
          LIMIT 20
          RETURN p.id as productId, nutritionalScore,
                 p.protein as protein, p.fiber as fiber,
                 p.sodium as sodium, p.sugar as sugar
        `;

        const result = await session.run(query, params);

        return result.records.map(record => {
          const score = record.get('nutritionalScore');
          const explanations: RecommendationExplanation[] = [];

          if (nutritionalNeeds.targetProtein && record.get('protein') >= nutritionalNeeds.targetProtein) {
            explanations.push({
              type: 'nutritional',
              reason: `High protein content (${record.get('protein')}g)`,
              confidence: 0.9,
            });
          }

          if (nutritionalNeeds.targetFiber && record.get('fiber') >= nutritionalNeeds.targetFiber) {
            explanations.push({
              type: 'nutritional',
              reason: `Good source of fiber (${record.get('fiber')}g)`,
              confidence: 0.9,
            });
          }

          return {
            productId: record.get('productId'),
            score: Math.min(1, score / 10),
            nutritionalFit: score,
            explanations,
          };
        });
      },
      async () => []
    );
  } catch (error) {
    logger.error('Failed to get nutritional need recommendations:', error as Record<string, unknown>);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    const v1 = vec1[i] ?? 0;
    const v2 = vec2[i] ?? 0;
    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Get contextual recommendations based on current context
 */
export async function getContextualRecommendations(
  context: {
    currentProduct?: number;
    currentCategory?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    season?: 'spring' | 'summer' | 'fall' | 'winter';
    occasion?: string;
  },
  limit: number = 10
): Promise<PersonalizedRecommendation[]> {
  const recommendations: PersonalizedRecommendation[] = [];

  try {
    // Get time-based recommendations
    if (context.timeOfDay) {
      const timeRecs = await getTimeBasedRecommendations(context.timeOfDay);
      recommendations.push(...timeRecs);
    }

    // Get seasonal recommendations
    if (context.season) {
      const seasonalRecs = await getSeasonalRecommendations(context.season);
      recommendations.push(...seasonalRecs);
    }

    // Get category-based recommendations
    if (context.currentCategory) {
      const categoryRecs = await getCategoryRecommendations(context.currentCategory);
      recommendations.push(...categoryRecs);
    }

    // Deduplicate and return
    const uniqueRecs = new Map<number, PersonalizedRecommendation>();
    for (const rec of recommendations) {
      const existing = uniqueRecs.get(rec.productId);
      if (!existing || existing.score < rec.score) {
        uniqueRecs.set(rec.productId, rec);
      }
    }

    return Array.from(uniqueRecs.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    logger.error('Failed to get contextual recommendations:', error as Record<string, unknown>);
    return [];
  }
}

/**
 * Get time-based recommendations
 */
async function getTimeBasedRecommendations(
  timeOfDay: string
): Promise<PersonalizedRecommendation[]> {
  // Map time of day to relevant product properties
  const timePreferences: Record<string, string[]> = {
    morning: ['energy', 'breakfast', 'caffeine'],
    afternoon: ['lunch', 'snack', 'boost'],
    evening: ['dinner', 'relaxation', 'calm'],
  };

  const keywords = timePreferences[timeOfDay] || [];

  try {
    return await withSession(
      async (session) => {
        const result = await session.run(`
          MATCH (p:Product)
          WHERE ANY(keyword IN $keywords WHERE
            toLower(p.name) CONTAINS keyword OR
            toLower(p.description) CONTAINS keyword
          )
          RETURN p.id as productId
          LIMIT 10
        `, { keywords });

        return result.records.map(record => ({
          productId: record.get('productId'),
          score: 0.7,
          explanations: [{
            type: 'popularity' as const,
            reason: `Recommended for ${timeOfDay}`,
            confidence: 0.7,
          }],
        }));
      },
      async () => []
    );
  } catch (error) {
    logger.error('Failed to get time-based recommendations:', error as Record<string, unknown>);
    return [];
  }
}

/**
 * Get seasonal recommendations
 */
async function getSeasonalRecommendations(
  season: string
): Promise<PersonalizedRecommendation[]> {
  // Map seasons to relevant products
  const seasonalKeywords: Record<string, string[]> = {
    spring: ['fresh', 'detox', 'cleanse', 'allergy'],
    summer: ['cooling', 'hydration', 'light', 'refreshing'],
    fall: ['immune', 'warming', 'harvest', 'comfort'],
    winter: ['warming', 'immune', 'comfort', 'hearty'],
  };

  const keywords = seasonalKeywords[season] || [];

  try {
    return await withSession(
      async (session) => {
        const result = await session.run(`
          MATCH (p:Product)
          WHERE ANY(keyword IN $keywords WHERE
            toLower(p.description) CONTAINS keyword
          )
          RETURN p.id as productId
          LIMIT 10
        `, { keywords });

        return result.records.map(record => ({
          productId: record.get('productId'),
          score: 0.65,
          explanations: [{
            type: 'popularity' as const,
            reason: `Perfect for ${season}`,
            confidence: 0.65,
          }],
        }));
      },
      async () => []
    );
  } catch (error) {
    logger.error('Failed to get seasonal recommendations:', error as Record<string, unknown>);
    return [];
  }
}

/**
 * Get category-based recommendations
 */
async function getCategoryRecommendations(
  category: string
): Promise<PersonalizedRecommendation[]> {
  try {
    return await withSession(
      async (session) => {
        const result = await session.run(`
          MATCH (c:Category {name: $category})<-[:IN_CATEGORY]-(p:Product)
          OPTIONAL MATCH (p)-[:FREQUENTLY_BOUGHT_WITH]-(related:Product)
          WITH p, COUNT(related) as popularity
          ORDER BY popularity DESC
          LIMIT 10
          RETURN p.id as productId, popularity
        `, { category });

        return result.records.map(record => ({
          productId: record.get('productId'),
          score: Math.min(1, 0.5 + (record.get('popularity') / 20)),
          explanations: [{
            type: 'popularity' as const,
            reason: `Popular in ${category}`,
            confidence: 0.75,
          }],
        }));
      },
      async () => []
    );
  } catch (error) {
    logger.error('Failed to get category recommendations:', error as Record<string, unknown>);
    return [];
  }
}

// Export all functions
export {
  getHealthGoalRecommendations,
  getNutritionalNeedRecommendations,
  getCollaborativeRecommendations,
  getTimeBasedRecommendations,
  getSeasonalRecommendations,
  getCategoryRecommendations,
};