// Extended Graph Schema - Advanced Relationship Modeling for MemGraph
import { logger } from '@/lib/logger';

import { getSession } from './memgraph';

// Extended node type interfaces
export interface Ingredient {
  id: string;
  name: string;
  type: 'herb' | 'spice' | 'fruit' | 'vegetable' | 'grain' | 'protein' | 'fat' | 'other';
  description?: string;
  scientificName?: string;
  origin?: string;
  harvestSeason?: string[];
  nutritionalProfile?: Record<string, number>;
  preparations?: string[]; // dried, fresh, powdered, extract, etc.
}

export interface Region {
  id: string;
  name: string;
  country: string;
  climate: 'tropical' | 'temperate' | 'arid' | 'mountain' | 'coastal';
  coordinates?: { latitude: number; longitude: number };
  characteristics: string[];
  seasonality?: Record<string, string[]>; // season -> typical products
}

export interface Season {
  id: string;
  name: 'spring' | 'summer' | 'autumn' | 'winter' | 'dry' | 'wet';
  months: number[]; // 1-12
  characteristics: string[];
  typicalProducts: string[];
  healthFocus: string[]; // what health benefits are emphasized this season
}

export interface Condition {
  id: string;
  name: string;
  category: 'chronic' | 'acute' | 'preventive' | 'wellness';
  symptoms: string[];
  affectedSystems: string[]; // cardiovascular, digestive, immune, etc.
  severity: 'mild' | 'moderate' | 'severe';
  prevalence?: string;
  description?: string;
}

export interface Nutrient {
  id: string;
  name: string;
  type: 'vitamin' | 'mineral' | 'amino_acid' | 'fatty_acid' | 'antioxidant' | 'fiber' | 'other';
  unit: string; // mg, g, IU, etc.
  dailyValue?: number;
  functions: string[];
  deficiencySymptoms?: string[];
  sources: string[]; // natural food sources
}

export interface PreprationMethod {
  id: string;
  name: string;
  type: 'raw' | 'cooked' | 'dried' | 'fermented' | 'extracted' | 'processed';
  description: string;
  nutritionalImpact: 'neutral' | 'enhanced' | 'reduced';
  timeRequired?: string;
  equipment?: string[];
}

// Extended relationship properties
export interface ContainsRelationship {
  percentage?: number;
  extractionMethod?: string;
  bioavailability?: number;
  concentrationLevel: 'trace' | 'low' | 'moderate' | 'high' | 'very_high';
}

export interface GrownInRelationship {
  quality: 'poor' | 'fair' | 'good' | 'excellent' | 'premium';
  sustainability: 'conventional' | 'sustainable' | 'organic' | 'biodynamic';
  certifications?: string[];
  harvestMethods?: string[];
}

export interface TreatsRelationship {
  effectiveness: 'potential' | 'traditional' | 'clinical' | 'proven';
  dosage?: string;
  duration?: string;
  contraindications?: string[];
  evidenceLevel: 'folklore' | 'traditional' | 'preliminary' | 'clinical' | 'established';
}

export interface RichInRelationship {
  amount: number;
  unit: string;
  per100g?: number;
  bioavailability?: number;
  form: 'natural' | 'added' | 'fortified';
}

// Initialize extended schema
export async function initializeExtendedSchema(): Promise<void> {
  const sessionPromise = getSession();
  
  try {
    logger.info('🔧 Initializing extended graph schema...');

    // Create indexes for new node types
    const indexCommands = [
      // Ingredient indexes
      'CREATE INDEX ON :Ingredient(id)',
      'CREATE INDEX ON :Ingredient(name)',
      'CREATE INDEX ON :Ingredient(type)',
      'CREATE INDEX ON :Ingredient(scientificName)',
      
      // Region indexes  
      'CREATE INDEX ON :Region(id)',
      'CREATE INDEX ON :Region(name)',
      'CREATE INDEX ON :Region(country)',
      'CREATE INDEX ON :Region(climate)',
      
      // Season indexes
      'CREATE INDEX ON :Season(id)',
      'CREATE INDEX ON :Season(name)',
      
      // Condition indexes
      'CREATE INDEX ON :Condition(id)',
      'CREATE INDEX ON :Condition(name)',
      'CREATE INDEX ON :Condition(category)',
      'CREATE INDEX ON :Condition(severity)',
      
      // Nutrient indexes
      'CREATE INDEX ON :Nutrient(id)',
      'CREATE INDEX ON :Nutrient(name)',
      'CREATE INDEX ON :Nutrient(type)',
      
      // Preparation method indexes
      'CREATE INDEX ON :PreparationMethod(id)',
      'CREATE INDEX ON :PreparationMethod(name)',
      'CREATE INDEX ON :PreparationMethod(type)'
    ];

    const session = await sessionPromise;
    for (const command of indexCommands) {
      try {
        await session.run(command);
      } catch {
        // Index might already exist, continue
        logger.info(`Index creation skipped: ${command}`);
      }
    }

    logger.info('✅ Extended schema indexes created');
    
    // Create constraint for uniqueness
    const constraintCommands = [
      'CREATE CONSTRAINT ON (i:Ingredient) ASSERT i.id IS UNIQUE',
      'CREATE CONSTRAINT ON (r:Region) ASSERT r.id IS UNIQUE', 
      'CREATE CONSTRAINT ON (s:Season) ASSERT s.id IS UNIQUE',
      'CREATE CONSTRAINT ON (c:Condition) ASSERT c.id IS UNIQUE',
      'CREATE CONSTRAINT ON (n:Nutrient) ASSERT n.id IS UNIQUE',
      'CREATE CONSTRAINT ON (p:PreparationMethod) ASSERT p.id IS UNIQUE'
    ];

    for (const command of constraintCommands) {
      try {
        await session.run(command);
      } catch {
        // Constraint might already exist, continue
      }
    }

    logger.info('✅ Extended schema constraints created');

  } catch (error) {
    logger.error('❌ Failed to initialize extended schema:', error as Record<string, unknown>);
    throw error;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Add ingredient to graph
export async function addIngredient(ingredient: Ingredient): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MERGE (i:Ingredient {id: $id})
      SET i.name = $name,
          i.type = $type,
          i.description = $description,
          i.scientificName = $scientificName,
          i.origin = $origin,
          i.harvestSeason = $harvestSeason,
          i.nutritionalProfile = $nutritionalProfile,
          i.preparations = $preparations
    `, ingredient);
    
    logger.info(`✅ Added ingredient: ${ingredient.name}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to add ingredient ${ingredient.name}:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Add region to graph
export async function addRegion(region: Region): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MERGE (r:Region {id: $id})
      SET r.name = $name,
          r.country = $country,
          r.climate = $climate,
          r.coordinates = $coordinates,
          r.characteristics = $characteristics,
          r.seasonality = $seasonality
    `, region);
    
    logger.info(`✅ Added region: ${region.name}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to add region ${region.name}:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Add season to graph
export async function addSeason(season: Season): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MERGE (s:Season {id: $id})
      SET s.name = $name,
          s.months = $months,
          s.characteristics = $characteristics,
          s.typicalProducts = $typicalProducts,
          s.healthFocus = $healthFocus
    `, season);
    
    logger.info(`✅ Added season: ${season.name}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to add season ${season.name}:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Add condition to graph
export async function addCondition(condition: Condition): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MERGE (c:Condition {id: $id})
      SET c.name = $name,
          c.category = $category,
          c.symptoms = $symptoms,
          c.affectedSystems = $affectedSystems,
          c.severity = $severity,
          c.prevalence = $prevalence,
          c.description = $description
    `, condition);
    
    logger.info(`✅ Added condition: ${condition.name}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to add condition ${condition.name}:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Add nutrient to graph
export async function addNutrient(nutrient: Nutrient): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MERGE (n:Nutrient {id: $id})
      SET n.name = $name,
          n.type = $type,
          n.unit = $unit,
          n.dailyValue = $dailyValue,
          n.functions = $functions,
          n.deficiencySymptoms = $deficiencySymptoms,
          n.sources = $sources
    `, nutrient);
    
    logger.info(`✅ Added nutrient: ${nutrient.name}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to add nutrient ${nutrient.name}:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Create advanced relationships
export async function createProductContainsIngredient(
  productId: number, 
  ingredientId: string, 
  properties: ContainsRelationship
): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MATCH (p:Product {id: $productId})
      MATCH (i:Ingredient {id: $ingredientId})
      MERGE (p)-[r:CONTAINS]->(i)
      SET r.percentage = $percentage,
          r.extractionMethod = $extractionMethod,
          r.bioavailability = $bioavailability,
          r.concentrationLevel = $concentrationLevel
    `, {
      productId,
      ingredientId,
      ...properties
    });
    
    logger.info(`✅ Created CONTAINS relationship: Product ${productId} -> Ingredient ${ingredientId}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to create CONTAINS relationship:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

export async function createProductGrownInRegion(
  productId: number, 
  regionId: string, 
  properties: GrownInRelationship
): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MATCH (p:Product {id: $productId})
      MATCH (r:Region {id: $regionId})
      MERGE (p)-[rel:GROWN_IN]->(r)
      SET rel.quality = $quality,
          rel.sustainability = $sustainability,
          rel.certifications = $certifications,
          rel.harvestMethods = $harvestMethods
    `, {
      productId,
      regionId,
      ...properties
    });
    
    logger.info(`✅ Created GROWN_IN relationship: Product ${productId} -> Region ${regionId}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to create GROWN_IN relationship:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

export async function createProductHarvestedInSeason(
  productId: number, 
  seasonId: string
): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MATCH (p:Product {id: $productId})
      MATCH (s:Season {id: $seasonId})
      MERGE (p)-[:HARVESTED_IN]->(s)
    `, { productId, seasonId });
    
    logger.info(`✅ Created HARVESTED_IN relationship: Product ${productId} -> Season ${seasonId}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to create HARVESTED_IN relationship:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

export async function createHealthBenefitTreatsCondition(
  healthBenefitName: string, 
  conditionId: string, 
  properties: TreatsRelationship
): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MATCH (h:HealthBenefit {name: $healthBenefitName})
      MATCH (c:Condition {id: $conditionId})
      MERGE (h)-[r:TREATS]->(c)
      SET r.effectiveness = $effectiveness,
          r.dosage = $dosage,
          r.duration = $duration,
          r.contraindications = $contraindications,
          r.evidenceLevel = $evidenceLevel
    `, {
      healthBenefitName,
      conditionId,
      ...properties
    });
    
    logger.info(`✅ Created TREATS relationship: HealthBenefit ${healthBenefitName} -> Condition ${conditionId}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to create TREATS relationship:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

export async function createIngredientRichInNutrient(
  ingredientId: string, 
  nutrientId: string, 
  properties: RichInRelationship
): Promise<boolean> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    await session.run(`
      MATCH (i:Ingredient {id: $ingredientId})
      MATCH (n:Nutrient {id: $nutrientId})
      MERGE (i)-[r:RICH_IN]->(n)
      SET r.amount = $amount,
          r.unit = $unit,
          r.per100g = $per100g,
          r.bioavailability = $bioavailability,
          r.form = $form
    `, {
      ingredientId,
      nutrientId,
      ...properties
    });
    
    logger.info(`✅ Created RICH_IN relationship: Ingredient ${ingredientId} -> Nutrient ${nutrientId}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to create RICH_IN relationship:`, error as Record<string, unknown>);
    return false;
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Define interfaces for the return types
export interface ProductNutrientInfo {
  product: Record<string, unknown>;
  ingredient: Record<string, unknown>;
  amount: number | null;
  unit: string | null;
}

export interface SeasonalProductInfo {
  product: Record<string, unknown>;
  season: Record<string, unknown>;
  region: Record<string, unknown> | null;
}

export interface ConditionProductInfo {
  product: Record<string, unknown>;
  healthBenefit: Record<string, unknown>;
  effectiveness: string | null;
  evidence: string | null;
}

// Complex query functions using the extended schema
export async function getProductsByNutrient(
  nutrientName: string, 
  minAmount?: number, 
  limit: number = 10
): Promise<ProductNutrientInfo[]> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    const query = minAmount 
      ? `
        MATCH (p:Product)-[:CONTAINS]->(i:Ingredient)-[r:RICH_IN]->(n:Nutrient {name: $nutrientName})
        WHERE r.amount >= $minAmount
        RETURN p, i, r.amount as amount, r.unit as unit
        ORDER BY r.amount DESC
        LIMIT $limit
      `
      : `
        MATCH (p:Product)-[:CONTAINS]->(i:Ingredient)-[:RICH_IN]->(n:Nutrient {name: $nutrientName})
        RETURN p, i
        ORDER BY p.featured DESC, p.name ASC
        LIMIT $limit
      `;

    const result = await session.run(query, { 
      nutrientName, 
      minAmount: minAmount ?? 0, 
      limit 
    });
    
    return result.records.map(record => {
      const p = record.get('p') as { properties: Record<string, unknown> } | undefined;
      const i = record.get('i') as { properties: Record<string, unknown> } | undefined;
      return {
        product: p?.properties ?? {},
        ingredient: i?.properties ?? {},
        amount: record.has('amount') ? (record.get('amount') as number | null) : null,
        unit: record.has('unit') ? (record.get('unit') as string | null) : null
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to get products by nutrient ${nutrientName}:`, error as Record<string, unknown>);
    return [];
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

export async function getSeasonalProducts(
  seasonName: string, 
  regionName?: string, 
  limit: number = 20
): Promise<SeasonalProductInfo[]> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    const query = regionName 
      ? `
        MATCH (p:Product)-[:HARVESTED_IN]->(s:Season {name: $seasonName})
        MATCH (p)-[:GROWN_IN]->(r:Region {name: $regionName})
        RETURN p, s, r
        ORDER BY p.featured DESC, p.name ASC
        LIMIT $limit
      `
      : `
        MATCH (p:Product)-[:HARVESTED_IN]->(s:Season {name: $seasonName})
        RETURN p, s
        ORDER BY p.featured DESC, p.name ASC
        LIMIT $limit
      `;

    const result = await session.run(query, { seasonName, regionName, limit });
    
    return result.records.map(record => {
      const p = record.get('p') as { properties: Record<string, unknown> } | undefined;
      const s = record.get('s') as { properties: Record<string, unknown> } | undefined;
      const r = record.has('r') ? record.get('r') as { properties: Record<string, unknown> } | undefined : null;
      return {
        product: p?.properties ?? {},
        season: s?.properties ?? {},
        region: r?.properties ?? null
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to get seasonal products:`, error as Record<string, unknown>);
    return [];
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

export async function getProductsForCondition(
  conditionName: string, 
  effectivenessFilter?: string,
  limit: number = 10
): Promise<ConditionProductInfo[]> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    const query = effectivenessFilter
      ? `
        MATCH (p:Product)-[:PROVIDES]->(h:HealthBenefit)-[t:TREATS]->(c:Condition {name: $conditionName})
        WHERE t.effectiveness = $effectivenessFilter
        RETURN p, h, t.effectiveness as effectiveness, t.evidenceLevel as evidence
        ORDER BY t.effectiveness DESC, p.featured DESC
        LIMIT $limit
      `
      : `
        MATCH (p:Product)-[:PROVIDES]->(h:HealthBenefit)-[:TREATS]->(c:Condition {name: $conditionName})
        RETURN p, h
        ORDER BY p.featured DESC, p.name ASC
        LIMIT $limit
      `;

    const result = await session.run(query, { 
      conditionName, 
      effectivenessFilter, 
      limit 
    });
    
    return result.records.map(record => {
      const p = record.get('p') as { properties: Record<string, unknown> } | undefined;
      const h = record.get('h') as { properties: Record<string, unknown> } | undefined;
      return {
        product: p?.properties ?? {},
        healthBenefit: h?.properties ?? {},
        effectiveness: record.has('effectiveness') ? (record.get('effectiveness') as string | null) : null,
        evidence: record.has('evidence') ? (record.get('evidence') as string | null) : null
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to get products for condition ${conditionName}:`, error as Record<string, unknown>);
    return [];
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Get extended graph statistics
export async function getExtendedGraphStats(): Promise<{
  nodeCount: {
    products: number;
    categories: number;
    healthBenefits: number;
    ingredients: number;
    regions: number;
    seasons: number;
    conditions: number;
    nutrients: number;
  };
  relationshipCount: {
    total: number;
    contains: number;
    grownIn: number;
    treats: number;
    richIn: number;
  };
}> {
  const sessionPromise = getSession();
  
  try {
    const session = await sessionPromise;
    const results = await Promise.all([
      session.run('MATCH (p:Product) RETURN COUNT(p) as count'),
      session.run('MATCH (c:Category) RETURN COUNT(c) as count'),
      session.run('MATCH (h:HealthBenefit) RETURN COUNT(h) as count'),
      session.run('MATCH (i:Ingredient) RETURN COUNT(i) as count'),
      session.run('MATCH (r:Region) RETURN COUNT(r) as count'),
      session.run('MATCH (s:Season) RETURN COUNT(s) as count'),
      session.run('MATCH (cond:Condition) RETURN COUNT(cond) as count'),
      session.run('MATCH (n:Nutrient) RETURN COUNT(n) as count'),
      session.run('MATCH ()-[rel]-() RETURN COUNT(rel) as count'),
      session.run('MATCH ()-[rel:CONTAINS]-() RETURN COUNT(rel) as count'),
      session.run('MATCH ()-[rel:GROWN_IN]-() RETURN COUNT(rel) as count'),
      session.run('MATCH ()-[rel:TREATS]-() RETURN COUNT(rel) as count'),
      session.run('MATCH ()-[rel:RICH_IN]-() RETURN COUNT(rel) as count')
    ]);

    return {
      nodeCount: {
        products: Number(((results && results[0]) || {})?.records?.[0]?.get('count') ?? 0),
        categories: Number(results[1]?.records[0]?.get('count') ?? 0),
        healthBenefits: Number(results[2]?.records[0]?.get('count') ?? 0),
        ingredients: Number(results[3]?.records[0]?.get('count') ?? 0),
        regions: Number(results[4]?.records[0]?.get('count') ?? 0),
        seasons: Number(results[5]?.records[0]?.get('count') ?? 0),
        conditions: Number(results[6]?.records[0]?.get('count') ?? 0),
        nutrients: Number(results[7]?.records[0]?.get('count') ?? 0)
      },
      relationshipCount: {
        total: Number(results[8]?.records[0]?.get('count')),
        contains: Number(results[9]?.records[0]?.get('count')),
        grownIn: Number(results[10]?.records[0]?.get('count')),
        treats: Number(results[11]?.records[0]?.get('count')),
        richIn: Number(results[12]?.records[0]?.get('count'))
      }
    };
  } catch (error) {
    logger.error('❌ Failed to get extended graph stats:', error as Record<string, unknown>);
    return {
      nodeCount: { products: 0, categories: 0, healthBenefits: 0, ingredients: 0, regions: 0, seasons: 0, conditions: 0, nutrients: 0 },
      relationshipCount: { total: 0, contains: 0, grownIn: 0, treats: 0, richIn: 0 }
    };
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

// Additional missing functions for graph endpoints

export interface ProductIngredientInfo {
  product: Record<string, unknown>;
  ingredient: Record<string, unknown>;
  relationship: Record<string, unknown>;
}

export interface IngredientProductInfo {
  ingredient: Record<string, unknown>;
  product: Record<string, unknown>;
  relationship: Record<string, unknown>;
}

export interface RegionalProductInfo {
  product: Record<string, unknown>;
  region: Record<string, unknown>;
  relationship: Record<string, unknown>;
}

/**
 * Get products that contain a specific ingredient
 */
export async function getProductsByIngredient(
  ingredientId: string, 
  limit: number = 20
): Promise<ProductIngredientInfo[]> {
  const sessionPromise = getSession();
  
  try {
    logger.info(`📊 Getting products containing ingredient: ${ingredientId}`);
    const session = await sessionPromise;

    const query = `
      MATCH (p:Product)-[r:CONTAINS]->(i:Ingredient {id: $ingredientId})
      RETURN p, i, r
      ORDER BY p.featured DESC, p.name ASC
      LIMIT $limit
    `;

    const result = await session.run(query, { 
      ingredientId, 
      limit 
    });
    
    return result.records.map(record => {
      const p = record.get('p') as { properties: Record<string, unknown> } | undefined;
      const i = record.get('i') as { properties: Record<string, unknown> } | undefined;
      const r = record.get('r') as { properties: Record<string, unknown> } | undefined;
      
      return {
        product: p?.properties ?? {},
        ingredient: i?.properties ?? {},
        relationship: r?.properties ?? {}
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to get products by ingredient ${ingredientId}:`, error as Record<string, unknown>);
    return [];
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

/**
 * Get ingredients contained in a specific product
 */
export async function getIngredientsByProduct(
  productId: number, 
  limit: number = 20
): Promise<IngredientProductInfo[]> {
  const sessionPromise = getSession();
  
  try {
    logger.info(`📊 Getting ingredients for product: ${productId}`);
    const session = await sessionPromise;

    const query = `
      MATCH (p:Product {id: $productId})-[r:CONTAINS]->(i:Ingredient)
      RETURN p, i, r
      ORDER BY i.name ASC
      LIMIT $limit
    `;

    const result = await session.run(query, { 
      productId, 
      limit 
    });
    
    return result.records.map(record => {
      const p = record.get('p') as { properties: Record<string, unknown> } | undefined;
      const i = record.get('i') as { properties: Record<string, unknown> } | undefined;
      const r = record.get('r') as { properties: Record<string, unknown> } | undefined;
      
      return {
        ingredient: i?.properties ?? {},
        product: p?.properties ?? {},
        relationship: r?.properties ?? {}
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to get ingredients by product ${productId}:`, error as Record<string, unknown>);
    return [];
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}

/**
 * Get products grown in a specific region
 */
export async function getProductsByRegion(
  regionId: string, 
  seasonName?: string,
  limit: number = 20
): Promise<RegionalProductInfo[]> {
  const sessionPromise = getSession();
  
  try {
    logger.info(`📊 Getting products from region: ${regionId}${seasonName ? ` in season: ${seasonName}` : ''}`);
    const session = await sessionPromise;

    const query = seasonName 
      ? `
        MATCH (p:Product)-[r:GROWN_IN]->(reg:Region {id: $regionId})
        MATCH (p)-[:HARVESTED_IN]->(s:Season {name: $seasonName})
        RETURN p, reg, r, s
        ORDER BY p.featured DESC, p.name ASC
        LIMIT $limit
      `
      : `
        MATCH (p:Product)-[r:GROWN_IN]->(reg:Region {id: $regionId})
        RETURN p, reg, r
        ORDER BY p.featured DESC, p.name ASC
        LIMIT $limit
      `;

    const result = await session.run(query, { 
      regionId, 
      seasonName,
      limit 
    });
    
    return result.records.map(record => {
      const p = record.get('p') as { properties: Record<string, unknown> } | undefined;
      const reg = record.get('reg') as { properties: Record<string, unknown> } | undefined;
      const r = record.get('r') as { properties: Record<string, unknown> } | undefined;
      const s = record.has('s') ? record.get('s') as { properties: Record<string, unknown> } | undefined : undefined;
      
      return {
        product: p?.properties ?? {},
        region: reg?.properties ?? {},
        relationship: {
          ...r?.properties ?? {},
          ...(s ? { season: s.properties } : {})
        }
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to get products by region ${regionId}:`, error as Record<string, unknown>);
    return [];
  } finally {
    const session = await sessionPromise;
    await session.close();
  }
}