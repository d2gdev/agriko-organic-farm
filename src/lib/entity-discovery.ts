// Entity Discovery System - Automatically identify and extract entities from various sources
import { WCProduct } from '@/types/woocommerce';
import { logger } from '@/lib/logger';

import { getAllProducts } from './woocommerce';
import { getSession } from './memgraph';
import { GraphProduct } from './memgraph';
import neo4j from 'neo4j-driver';

// Neo4j type interfaces
interface Neo4jValue {
  toNumber?(): number;
  toString?(): string;
}

interface Neo4jNode {
  properties: Record<string, unknown>;
}

interface Neo4jRecord {
  get(key: string): unknown;
}

// Helper functions for safe Neo4j record access
function getStringFromRecord(record: Neo4jRecord, key: string): string {
  const value = record.get(key);
  return typeof value === 'string' ? value : '';
}

function getNodeFromRecord(record: Neo4jRecord, key: string): Neo4jNode | null {
  const value = record.get(key);
  return value && typeof value === 'object' && value !== null && 'properties' in value 
    ? value as Neo4jNode 
    : null;
}

function getNumberFromValue(value: unknown): number {
  if (value && typeof value === 'object' && 'toNumber' in value) {
    const numberValue = (value as Neo4jValue).toNumber?.();
    return typeof numberValue === 'number' ? numberValue : 0;
  }
  return typeof value === 'number' ? value : 0;
}

// Entity types that can be discovered
export type EntityType = 
  | 'Product'
  | 'Ingredient'
  | 'Region'
  | 'Season'
  | 'Condition'
  | 'Nutrient'
  | 'Category';

// Discovered entity interface
export interface DiscoveredEntity {
  id: string;
  name: string;
  type: EntityType;
  source: string;
  confidence: number;
  properties?: Record<string, unknown>;
  createdAt: Date;
}

// Text extraction result
export interface TextExtractionResult {
  entities: DiscoveredEntity[];
  statistics: {
    totalEntities: number;
    byType: Record<EntityType, number>;
    confidenceAvg: number;
  };
}

// Extract entities from product data
export async function discoverEntitiesFromProducts(
  products: WCProduct[]
): Promise<DiscoveredEntity[]> {
  const entities: DiscoveredEntity[] = [];
  const entityMap = new Map<string, DiscoveredEntity>();
  
  for (const product of products) {
    // Extract categories as entities
    if (product.categories) {
      for (const category of product.categories) {
        const key = `category:${category.name.toLowerCase()}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, {
            id: key,
            name: category.name,
            type: 'Category',
            source: 'product-categories',
            confidence: 0.9,
            createdAt: new Date()
          });
        }
      }
    }
    
    // Extract potential ingredients from product name/description
    const potentialIngredients = extractPotentialIngredients(
      product.name + ' ' + (product.description || '')
    );
    
    for (const ingredient of potentialIngredients) {
      const key = `ingredient:${ingredient.toLowerCase()}`;
      if (!entityMap.has(key)) {
        entityMap.set(key, {
          id: key,
          name: ingredient,
          type: 'Ingredient',
          source: 'product-content',
          confidence: 0.7,
          createdAt: new Date()
        });
      }
    }
  }
  
  return Array.from(entityMap.values());
}

// Simple heuristic to extract potential ingredients from text
function extractPotentialIngredients(text: string): string[] {
  // Common words that are likely to be ingredients
  const ingredientPatterns = [
    /\b\w+(?:\s+\w+)?\s*(?:fruit|berry|herb|spice|seed|nut|leaf|root|flower|oil|extract|powder)\b/gi,
    /\b(?:organic|fresh|dried|wild)\s+\w+(?:\s+\w+)?\b/gi,
    /\b\w+(?:\s+\w+)?\s*(?:tea|juice|syrup|vinegar|honey|salt|sugar|flour)\b/gi
  ];
  
  const ingredients: string[] = [];
  for (const pattern of ingredientPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      ingredients.push(...matches.map(m => m.replace(/^\w/, c => c.toUpperCase())));
    }
  }
  
  // Remove duplicates and filter out common non-ingredient words
  const commonWords = ['Organic', 'Fresh', 'Dried', 'Wild', 'With', 'And', 'The', 'For'];
  return [...new Set(
    ingredients.filter(ingredient => 
      !commonWords.includes(ingredient) && 
      ingredient.length > 2 &&
      !/^\d+$/.test(ingredient)
    )
  )];
}

// Extract entities from existing graph data
export async function discoverEntitiesFromGraph(): Promise<DiscoveredEntity[]> {
  const session = await getSession();
  const entities: DiscoveredEntity[] = [];
  const entityMap = new Map<string, DiscoveredEntity>();
  
  try {
    // Extract entities from existing relationships
    const result = await session.run(`
      MATCH (n)
      WHERE n:Ingredient OR n:Region OR n:Season OR n:Condition OR n:Nutrient OR n:Category
      RETURN DISTINCT labels(n)[0] as type, n.name as name, n
    `);
    
    for (const record of result.records) {
      const type = getStringFromRecord(record as Neo4jRecord, 'type');
      const name = getStringFromRecord(record as Neo4jRecord, 'name');
      
      // Skip if we already have this entity or if data is invalid
      if (!type || !name) continue;
      const key = `${type}:${name.toLowerCase()}`;
      if (entityMap.has(key)) continue;
      
      // Map Neo4j labels to our entity types
      let entityType: EntityType;
      switch (type) {
        case 'Ingredient': entityType = 'Ingredient'; break;
        case 'Region': entityType = 'Region'; break;
        case 'Season': entityType = 'Season'; break;
        case 'Condition': entityType = 'Condition'; break;
        case 'Nutrient': entityType = 'Nutrient'; break;
        case 'Category': entityType = 'Category'; break;
        default: continue; // Skip unknown types
      }
      
      const nodeData = getNodeFromRecord(record as Neo4jRecord, 'n');
      
      entityMap.set(key, {
        id: key,
        name,
        type: entityType,
        source: 'existing-graph',
        confidence: 0.95,
        properties: nodeData?.properties,
        createdAt: new Date()
      });
    }
    
    return Array.from(entityMap.values());
  } catch (error) {
    logger.error('❌ Failed to discover entities from graph:', error as Record<string, unknown>);
    return [];
  } finally {
    await session.close();
  }
}

// Extract entities from text content
export async function discoverEntitiesFromText(content: string): Promise<TextExtractionResult> {
  // Extract potential entities using regex patterns
  const patterns: Record<EntityType, RegExp> = {
    Product: /\b(?:product|item)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
    Ingredient: /\b(?:ingredient|contains?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi,
    Region: /\b(?:region|origin|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi,
    Season: /\b(?:season|harvest)\s+([A-Z][a-z]+)\b/gi,
    Condition: /\b(?:treats?|helps?|benefits?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi,
    Nutrient: /\b(?:rich in|contains?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi,
    Category: /\b(?:category|type)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi
  };
  
  const entities: DiscoveredEntity[] = [];
  const typeCounts: Record<EntityType, number> = {
    Product: 0,
    Ingredient: 0,
    Region: 0,
    Season: 0,
    Condition: 0,
    Nutrient: 0,
    Category: 0
  };
  
  let totalConfidence = 0;
  
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const name = match[1];
      if (name && name.length > 1) {
        const key = `${type}:${name.toLowerCase()}`;
        entities.push({
          id: key,
          name,
          type: type as EntityType,
          source: 'text-content',
          confidence: 0.6,
          createdAt: new Date()
        });
        typeCounts[type as EntityType]++;
        totalConfidence += 0.6;
      }
    }
  }
  
  return {
    entities,
    statistics: {
      totalEntities: entities.length,
      byType: typeCounts,
      confidenceAvg: entities.length > 0 ? totalConfidence / entities.length : 0
    }
  };
}

// Auto-create discovered entities in the graph database
export async function autoCreateDiscoveredEntities(
  entities: DiscoveredEntity[]
): Promise<{
  success: boolean;
  created: number;
  errors: string[];
}> {
  const session = await getSession();
  let created = 0;
  const errors: string[] = [];
  
  try {
    for (const entity of entities) {
      try {
        let label = entity.type;
        
        // Special handling for some entity types
        if (entity.type === 'Category') {
          label = 'Category';
        } else if (entity.type === 'Product') {
          // Products should be handled separately
          continue;
        }
        
        // Create the entity node
        await session.run(`
          MERGE (n:${label} {name: $name})
          SET n.source = $source,
              n.discoveredAt = datetime(),
              n.confidence = $confidence
        `, {
          name: entity.name,
          source: entity.source,
          confidence: entity.confidence
        });
        
        created++;
      } catch (error) {
        errors.push(`Failed to create ${entity.type} "${entity.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      success: errors.length === 0,
      created,
      errors
    };
  } catch (error) {
    return {
      success: false,
      created: 0,
      errors: [`General error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  } finally {
    await session.close();
  }
}

// Get entity discovery statistics
export async function getEntityDiscoveryStats(): Promise<{
  totalEntities: number;
  byType: Record<EntityType, number>;
  sources: Record<string, number>;
}> {
  const session = await getSession();
  
  try {
    // Get counts by type
    const typeResult = await session.run(`
      MATCH (n)
      WHERE n:Ingredient OR n:Region OR n:Season OR n:Condition OR n:Nutrient OR n:Category
      RETURN DISTINCT labels(n)[0] as type, COUNT(n) as count
    `);
    
    const byType: Record<EntityType, number> = {
      Product: 0,
      Ingredient: 0,
      Region: 0,
      Season: 0,
      Condition: 0,
      Nutrient: 0,
      Category: 0
    };
    
    for (const record of typeResult.records) {
      const type = getStringFromRecord(record as Neo4jRecord, 'type');
      const countValue = (record as Neo4jRecord).get('count');
      const count = getNumberFromValue(countValue);
      
      switch (type) {
        case 'Ingredient': byType.Ingredient = count; break;
        case 'Region': byType.Region = count; break;
        case 'Season': byType.Season = count; break;
        case 'Condition': byType.Condition = count; break;
        case 'Nutrient': byType.Nutrient = count; break;
        case 'Category': byType.Category = count; break;
      }
    }
    
    // Get counts by source
    const sourceResult = await session.run(`
      MATCH (n)
      WHERE n:Ingredient OR n:Region OR n:Season OR n:Condition OR n:Nutrient OR n:Category
      RETURN n.source as source, COUNT(n) as count
    `);
    
    const sources: Record<string, number> = {};
    for (const record of sourceResult.records) {
      const sourceValue = (record as Neo4jRecord).get('source');
      const source = typeof sourceValue === 'string' ? sourceValue : 'unknown';
      const countValue = (record as Neo4jRecord).get('count');
      const count = getNumberFromValue(countValue);
      sources[source] = count;
    }
    
    const totalEntities = Object.values(byType).reduce((sum, count) => sum + count, 0);
    
    return {
      totalEntities,
      byType,
      sources
    };
  } catch (error) {
    logger.error('❌ Failed to get entity discovery stats:', error as Record<string, unknown>);
    return {
      totalEntities: 0,
      byType: {
        Product: 0,
        Ingredient: 0,
        Region: 0,
        Season: 0,
        Condition: 0,
        Nutrient: 0,
        Category: 0
      },
      sources: {}
    };
  } finally {
    await session.close();
  }
}
