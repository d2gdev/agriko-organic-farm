// Nutritional Enrichment Pipeline for Product Knowledge Enhancement
import { logger } from './logger';
import { WCProduct } from '@/types/woocommerce';
import { withSession } from './memgraph';

// Nutritional data structure
export interface NutritionalProfile {
  // Macronutrients (per 100g)
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;

  // Vitamins
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  thiamine?: number;
  riboflavin?: number;
  niacin?: number;
  vitaminB6?: number;
  folate?: number;
  vitaminB12?: number;

  // Minerals
  calcium?: number;
  iron?: number;
  magnesium?: number;
  phosphorus?: number;
  potassium?: number;
  sodium?: number;
  zinc?: number;
  copper?: number;
  manganese?: number;
  selenium?: number;

  // Phytonutrients
  antioxidants?: string[];
  polyphenols?: number;
  flavonoids?: number;
  carotenoids?: number;
}

export interface HealthBenefit {
  name: string;
  category: 'preventive' | 'therapeutic' | 'nutritional' | 'wellness';
  description: string;
  evidence?: 'strong' | 'moderate' | 'emerging' | 'traditional';
  conditions?: string[];
}

export interface ExtractedEntity {
  type: 'nutrient' | 'compound' | 'benefit' | 'property' | 'usage';
  name: string;
  value?: string | number;
  unit?: string;
  confidence: number;
}

// Common nutritional database for agricultural products
const NUTRITIONAL_DATABASE: Record<string, Partial<NutritionalProfile>> = {
  'turmeric': {
    calories: 312,
    protein: 9.68,
    carbohydrates: 67.14,
    fat: 3.25,
    fiber: 22.7,
    vitaminC: 0.7,
    vitaminE: 4.43,
    vitaminK: 13.4,
    calcium: 168,
    iron: 55,
    magnesium: 208,
    phosphorus: 299,
    potassium: 2080,
    sodium: 27,
    zinc: 4.5,
    manganese: 19.8,
    antioxidants: ['curcumin', 'demethoxycurcumin', 'bisdemethoxycurcumin'],
  },
  'ginger': {
    calories: 80,
    protein: 1.82,
    carbohydrates: 17.77,
    fat: 0.75,
    fiber: 2,
    vitaminC: 5,
    vitaminB6: 0.16,
    magnesium: 43,
    potassium: 415,
    manganese: 0.229,
    antioxidants: ['gingerol', 'shogaol', 'paradol'],
  },
  'cinnamon': {
    calories: 247,
    protein: 3.99,
    carbohydrates: 80.59,
    fat: 1.24,
    fiber: 53.1,
    vitaminK: 31.2,
    calcium: 1002,
    iron: 8.32,
    magnesium: 60,
    phosphorus: 64,
    potassium: 431,
    manganese: 17.466,
    antioxidants: ['cinnamaldehyde', 'cinnamic acid', 'cinnamate'],
  },
  'black-pepper': {
    calories: 251,
    protein: 10.39,
    carbohydrates: 63.95,
    fat: 3.26,
    fiber: 25.3,
    vitaminK: 163.7,
    calcium: 443,
    iron: 9.71,
    magnesium: 171,
    phosphorus: 158,
    potassium: 1329,
    manganese: 12.753,
    antioxidants: ['piperine', 'limonene', 'alpha-pinene'],
  },
  'honey': {
    calories: 304,
    carbohydrates: 82.4,
    sugar: 82.12,
    protein: 0.3,
    vitaminC: 0.5,
    calcium: 6,
    iron: 0.42,
    magnesium: 2,
    phosphorus: 4,
    potassium: 52,
    antioxidants: ['flavonoids', 'phenolic acids', 'enzymes'],
  },
};

// Health benefit patterns
const BENEFIT_PATTERNS: Record<string, HealthBenefit[]> = {
  'anti-inflammatory': [{
    name: 'Anti-inflammatory',
    category: 'therapeutic',
    description: 'Helps reduce inflammation in the body',
    evidence: 'strong',
    conditions: ['arthritis', 'joint pain', 'muscle soreness'],
  }],
  'antioxidant': [{
    name: 'Antioxidant',
    category: 'preventive',
    description: 'Neutralizes free radicals and prevents oxidative stress',
    evidence: 'strong',
    conditions: ['aging', 'cellular damage', 'chronic diseases'],
  }],
  'immune': [{
    name: 'Immune Support',
    category: 'wellness',
    description: 'Strengthens immune system function',
    evidence: 'moderate',
    conditions: ['infections', 'cold', 'flu'],
  }],
  'digestive': [{
    name: 'Digestive Health',
    category: 'therapeutic',
    description: 'Supports healthy digestion and gut health',
    evidence: 'strong',
    conditions: ['indigestion', 'bloating', 'IBS'],
  }],
  'heart': [{
    name: 'Cardiovascular Health',
    category: 'preventive',
    description: 'Supports heart health and circulation',
    evidence: 'moderate',
    conditions: ['hypertension', 'cholesterol', 'heart disease'],
  }],
};

/**
 * Extract entities from product description
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const lowerText = text.toLowerCase();

  // Extract nutrients
  const nutrientPatterns = [
    { pattern: /(\d+(?:\.\d+)?)\s*(?:mg|g|mcg|iu)\s+(?:of\s+)?(\w+)/gi, type: 'nutrient' as const },
    { pattern: /rich\s+in\s+(\w+)/gi, type: 'nutrient' as const },
    { pattern: /contains\s+(\w+)/gi, type: 'nutrient' as const },
    { pattern: /source\s+of\s+(\w+)/gi, type: 'nutrient' as const },
  ];

  for (const { pattern, type } of nutrientPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type,
        name: match[2] || match[1] || '',
        value: match[1] ? parseFloat(match[1]) : undefined,
        unit: match[0].match(/(mg|g|mcg|iu)/i)?.[1],
        confidence: 0.8,
      });
    }
  }

  // Extract health benefits
  Object.keys(BENEFIT_PATTERNS).forEach(keyword => {
    if (lowerText.includes(keyword)) {
      entities.push({
        type: 'benefit',
        name: keyword,
        confidence: 0.7,
      });
    }
  });

  // Extract properties
  const propertyKeywords = ['organic', 'raw', 'pure', 'natural', 'fresh', 'dried', 'powdered', 'extract'];
  propertyKeywords.forEach(property => {
    if (lowerText.includes(property)) {
      entities.push({
        type: 'property',
        name: property,
        confidence: 0.9,
      });
    }
  });

  return entities;
}

/**
 * Enrich product with nutritional data
 */
export async function enrichProductWithNutrition(
  product: WCProduct
): Promise<{
  nutritionalProfile?: NutritionalProfile;
  healthBenefits: HealthBenefit[];
  extractedEntities: ExtractedEntity[];
}> {
  try {
    const productName = product.name.toLowerCase();
    const description = (product.description || product.short_description || '').toLowerCase();

    // Look up nutritional data
    let nutritionalProfile: NutritionalProfile | undefined;

    // Check if product matches any in our database
    for (const [key, profile] of Object.entries(NUTRITIONAL_DATABASE)) {
      if (productName.includes(key) || description.includes(key)) {
        nutritionalProfile = profile as NutritionalProfile;
        break;
      }
    }

    // Extract entities from description
    const extractedEntities = extractEntities(
      `${product.name} ${product.description || ''} ${product.short_description || ''}`
    );

    // Determine health benefits
    const healthBenefits: HealthBenefit[] = [];
    const benefitKeywords = extractedEntities
      .filter(e => e.type === 'benefit')
      .map(e => e.name);

    for (const keyword of benefitKeywords) {
      const benefits = BENEFIT_PATTERNS[keyword];
      if (benefits) {
        healthBenefits.push(...benefits);
      }
    }

    // Store in graph database
    await storeEnrichmentInGraph(product.id, {
      nutritionalProfile,
      healthBenefits,
      extractedEntities,
    });

    logger.info(`✅ Enriched product ${product.name} with nutritional data`);

    return {
      nutritionalProfile,
      healthBenefits,
      extractedEntities,
    };
  } catch (error) {
    logger.error(`Failed to enrich product ${product.id}:`, error as Record<string, unknown>);
    return {
      healthBenefits: [],
      extractedEntities: [],
    };
  }
}

/**
 * Store enrichment data in graph database
 */
async function storeEnrichmentInGraph(
  productId: number,
  enrichment: {
    nutritionalProfile?: NutritionalProfile;
    healthBenefits: HealthBenefit[];
    extractedEntities: ExtractedEntity[];
  }
): Promise<void> {
  try {
    await withSession(
      async (session) => {
        // Store nutritional profile
        if (enrichment.nutritionalProfile) {
          const profile = enrichment.nutritionalProfile;

          await session.run(`
            MATCH (p:Product {id: $productId})
            SET p.calories = $calories,
                p.protein = $protein,
                p.carbohydrates = $carbohydrates,
                p.fat = $fat,
                p.fiber = $fiber,
                p.hasNutritionalData = true,
                p.nutritionalUpdateTime = datetime()
          `, {
            productId,
            calories: profile.calories,
            protein: profile.protein,
            carbohydrates: profile.carbohydrates,
            fat: profile.fat,
            fiber: profile.fiber,
          });

          // Create nutrient nodes and relationships
          const nutrients = [
            { name: 'Protein', value: profile.protein, unit: 'g' },
            { name: 'Carbohydrates', value: profile.carbohydrates, unit: 'g' },
            { name: 'Fat', value: profile.fat, unit: 'g' },
            { name: 'Fiber', value: profile.fiber, unit: 'g' },
            { name: 'Vitamin C', value: profile.vitaminC, unit: 'mg' },
            { name: 'Iron', value: profile.iron, unit: 'mg' },
            { name: 'Calcium', value: profile.calcium, unit: 'mg' },
            { name: 'Potassium', value: profile.potassium, unit: 'mg' },
          ].filter(n => n.value !== undefined);

          for (const nutrient of nutrients) {
            await session.run(`
              MATCH (p:Product {id: $productId})
              MERGE (n:Nutrient {name: $nutrientName})
              MERGE (p)-[r:CONTAINS_NUTRIENT]->(n)
              SET r.value = $value,
                  r.unit = $unit,
                  r.per100g = true
            `, {
              productId,
              nutrientName: nutrient.name,
              value: nutrient.value,
              unit: nutrient.unit,
            });
          }
        }

        // Store health benefits
        for (const benefit of enrichment.healthBenefits) {
          await session.run(`
            MATCH (p:Product {id: $productId})
            MERGE (b:HealthBenefit {name: $benefitName})
            SET b.category = $category,
                b.description = $description,
                b.evidence = $evidence
            MERGE (p)-[r:PROVIDES]->(b)
            SET r.confidence = 0.8,
                r.source = 'enrichment_pipeline'
          `, {
            productId,
            benefitName: benefit.name,
            category: benefit.category,
            description: benefit.description,
            evidence: benefit.evidence || 'traditional',
          });
        }

        // Store extracted entities
        for (const entity of enrichment.extractedEntities) {
          if (entity.type === 'compound') {
            await session.run(`
              MATCH (p:Product {id: $productId})
              MERGE (c:Compound {name: $compoundName})
              SET c.type = $type
              MERGE (p)-[r:CONTAINS_COMPOUND]->(c)
              SET r.confidence = $confidence
            `, {
              productId,
              compoundName: entity.name,
              type: entity.type,
              confidence: entity.confidence,
            });
          }
        }

        logger.info(`✅ Stored enrichment data for product ${productId} in graph`);
      },
      async () => {
        logger.warn('⚠️ Memgraph unavailable - enrichment not stored');
      }
    );
  } catch (error) {
    logger.error('Failed to store enrichment in graph:', error as Record<string, unknown>);
  }
}

/**
 * Batch enrich products
 */
export async function batchEnrichProducts(
  products: WCProduct[],
  batchSize: number = 10
): Promise<Map<number, {
  nutritionalProfile?: NutritionalProfile;
  healthBenefits: HealthBenefit[];
  extractedEntities: ExtractedEntity[];
}>> {
  const enrichmentMap = new Map();

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    logger.info(`Enriching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);

    const enrichments = await Promise.all(
      batch.map(product => enrichProductWithNutrition(product))
    );

    batch.forEach((product, index) => {
      enrichmentMap.set(product.id, enrichments[index]);
    });
  }

  logger.info(`✅ Enriched ${products.length} products with nutritional data`);
  return enrichmentMap;
}

/**
 * Calculate nutritional score
 */
export function calculateNutritionalScore(profile: NutritionalProfile): number {
  let score = 0;
  const maxScore = 100;

  // Positive factors
  if (profile.protein && profile.protein > 5) score += 10;
  if (profile.fiber && profile.fiber > 3) score += 15;
  if (profile.vitaminC && profile.vitaminC > 10) score += 10;
  if (profile.iron && profile.iron > 2) score += 10;
  if (profile.potassium && profile.potassium > 200) score += 10;
  if (profile.antioxidants && profile.antioxidants.length > 0) score += 15;

  // Negative factors
  if (profile.sodium && profile.sodium > 500) score -= 10;
  if (profile.sugar && profile.sugar > 20) score -= 10;
  if (profile.fat && profile.fat > 30) score -= 5;

  // Normalize to 0-1 range
  return Math.max(0, Math.min(score, maxScore)) / maxScore;
}

/**
 * Get nutrition-based recommendations
 */
export async function getNutritionBasedRecommendations(
  productId: number,
  _userGoals?: string[]
): Promise<number[]> {
  try {
    return await withSession(
      async (session) => {
        // Find products with complementary nutritional profiles
        const result = await session.run(`
          MATCH (p1:Product {id: $productId})-[:CONTAINS_NUTRIENT]->(n1:Nutrient)
          MATCH (p2:Product)-[:CONTAINS_NUTRIENT]->(n2:Nutrient)
          WHERE p2.id <> $productId
            AND p2.hasNutritionalData = true
          WITH p2,
               COUNT(DISTINCT n2) as nutrientDiversity,
               COLLECT(DISTINCT n2.name) as nutrients
          ORDER BY nutrientDiversity DESC
          LIMIT 10
          RETURN p2.id as productId
        `, { productId });

        return result.records.map(record => record.get('productId'));
      },
      async () => []
    );
  } catch (error) {
    logger.error('Failed to get nutrition-based recommendations:', error as Record<string, unknown>);
    return [];
  }
}

// All functions are already exported above