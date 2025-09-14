// Advanced Graph Data Import Utilities for Extended Schema
import { getSession } from './memgraph';
import { logger } from '@/lib/logger';

import { 
  Ingredient as GraphIngredient, 
  Region as GraphRegion, 
  Season as GraphSeason, 
  Condition as GraphCondition, 
  Nutrient as GraphNutrient, 
  PreprationMethod as GraphPreparationMethod,
  ContainsRelationship,
  GrownInRelationship,
  TreatsRelationship,
  RichInRelationship
} from './extended-graph-schema';
import neo4j, { Integer } from 'neo4j-driver';

// Data import interface for batch operations
export interface BatchImportResults {
  ingredientsImported: number;
  regionsImported: number;
  seasonsImported: number;
  conditionsImported: number;
  nutrientsImported: number;
  preparationMethodsImported: number;
  relationshipsCreated: number;
  errors: string[];
}

// Import ingredients from JSON data
export async function importIngredients(ingredients: GraphIngredient[]): Promise<number> {
  const session = await getSession();
  let imported = 0;

  try {
    for (const ingredient of ingredients) {
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
      `, {
        id: ingredient.id,
        name: ingredient.name,
        type: ingredient.type,
        description: ingredient.description ?? '',
        scientificName: ingredient.scientificName ?? '',
        origin: ingredient.origin ?? '',
        harvestSeason: ingredient.harvestSeason ?? [],
        nutritionalProfile: JSON.stringify(ingredient.nutritionalProfile ?? {}),
        preparations: ingredient.preparations ?? []
      });
      imported++;
    }

    logger.info(`✅ Imported ${imported} ingredients`);
    return imported;
  } catch (error) {
    logger.error('❌ Failed to import ingredients:', error as Record<string, unknown>);
    throw error;
  } finally {
    await session.close();
  }
}

// Import regions with geographical data
export async function importRegions(regions: GraphRegion[]): Promise<number> {
  const session = await getSession();
  let imported = 0;

  try {
    for (const region of regions) {
      await session.run(`
        MERGE (r:Region {id: $id})
        SET r.name = $name,
            r.country = $country,
            r.climate = $climate,
            r.coordinates = $coordinates,
            r.characteristics = $characteristics,
            r.seasonality = $seasonality
      `, {
        id: region.id,
        name: region.name,
        country: region.country,
        climate: region.climate ?? '',
        coordinates: JSON.stringify(region.coordinates ?? {}),
        characteristics: region.characteristics ?? [],
        seasonality: JSON.stringify(region.seasonality ?? {})
      });
      imported++;
    }

    logger.info(`✅ Imported ${imported} regions`);
    return imported;
  } catch (error) {
    logger.error('❌ Failed to import regions:', error as Record<string, unknown>);
    throw error;
  } finally {
    await session.close();
  }
}

// Import seasonal data
export async function importSeasons(seasons: GraphSeason[]): Promise<number> {
  const session = await getSession();
  let imported = 0;

  try {
    for (const season of seasons) {
      await session.run(`
        MERGE (s:Season {id: $id})
        SET s.name = $name,
            s.months = $months,
            s.characteristics = $characteristics,
            s.typicalProducts = $typicalProducts,
            s.healthFocus = $healthFocus
      `, {
        id: season.id,
        name: season.name,
        months: season.months ?? [],
        characteristics: season.characteristics ?? [],
        typicalProducts: season.typicalProducts ?? [],
        healthFocus: season.healthFocus ?? []
      });
      imported++;
    }

    logger.info(`✅ Imported ${imported} seasons`);
    return imported;
  } catch (error) {
    logger.error('❌ Failed to import seasons:', error as Record<string, unknown>);
    throw error;
  } finally {
    await session.close();
  }
}

// Import health conditions
export async function importConditions(conditions: GraphCondition[]): Promise<number> {
  const session = await getSession();
  let imported = 0;

  try {
    for (const condition of conditions) {
      await session.run(`
        MERGE (c:Condition {id: $id})
        SET c.name = $name,
            c.category = $category,
            c.severity = $severity,
            c.symptoms = $symptoms,
            c.affectedSystems = $affectedSystems,
            c.prevalence = $prevalence,
            c.description = $description
      `, {
        id: condition.id,
        name: condition.name,
        category: condition.category,
        severity: condition.severity ?? 'moderate',
        symptoms: condition.symptoms ?? [],
        affectedSystems: condition.affectedSystems ?? [],
        prevalence: condition.prevalence ?? '',
        description: condition.description ?? ''
      });
      imported++;
    }

    logger.info(`✅ Imported ${imported} conditions`);
    return imported;
  } catch (error) {
    logger.error('❌ Failed to import conditions:', error as Record<string, unknown>);
    throw error;
  } finally {
    await session.close();
  }
}

// Import nutrients with detailed information
export async function importNutrients(nutrients: GraphNutrient[]): Promise<number> {
  const session = await getSession();
  let imported = 0;

  try {
    for (const nutrient of nutrients) {
      await session.run(`
        MERGE (n:Nutrient {id: $id})
        SET n.name = $name,
            n.type = $type,
            n.unit = $unit,
            n.dailyValue = $dailyValue,
            n.functions = $functions,
            n.deficiencySymptoms = $deficiencySymptoms,
            n.sources = $sources
      `, {
        id: nutrient.id,
        name: nutrient.name,
        type: nutrient.type,
        unit: nutrient.unit,
        dailyValue: nutrient.dailyValue ?? 0,
        functions: nutrient.functions ?? [],
        deficiencySymptoms: nutrient.deficiencySymptoms ?? [],
        sources: nutrient.sources ?? []
      });
      imported++;
    }

    logger.info(`✅ Imported ${imported} nutrients`);
    return imported;
  } catch (error) {
    logger.error('❌ Failed to import nutrients:', error as Record<string, unknown>);
    throw error;
  } finally {
    await session.close();
  }
}

// Import preparation methods
export async function importPreparationMethods(methods: GraphPreparationMethod[]): Promise<number> {
  const session = await getSession();
  let imported = 0;

  try {
    for (const method of methods) {
      await session.run(`
        MERGE (p:PreparationMethod {id: $id})
        SET p.name = $name,
            p.type = $type,
            p.description = $description,
            p.nutritionalImpact = $nutritionalImpact,
            p.timeRequired = $timeRequired,
            p.equipment = $equipment
      `, {
        id: method.id,
        name: method.name,
        type: method.type,
        description: method.description ?? '',
        nutritionalImpact: method.nutritionalImpact ?? 'neutral',
        timeRequired: method.timeRequired ?? '',
        equipment: method.equipment ?? []
      });
      imported++;
    }

    logger.info(`✅ Imported ${imported} preparation methods`);
    return imported;
  } catch (error) {
    logger.error('❌ Failed to import preparation methods:', error as Record<string, unknown>);
    throw error;
  } finally {
    await session.close();
  }
}

// Relationship building algorithms
export async function buildProductIngredientRelationships(
  productIngredientMappings: Array<{
    productId: number;
    ingredientId: string;
    properties: ContainsRelationship;
  }>
): Promise<number> {
  const session = await getSession();
  let created = 0;

  try {
    for (const mapping of productIngredientMappings) {
      await session.run(`
        MATCH (p:Product {id: $productId})
        MATCH (i:Ingredient {id: $ingredientId})
        MERGE (p)-[r:CONTAINS]->(i)
        SET r.percentage = $percentage,
            r.extractionMethod = $extractionMethod,
            r.bioavailability = $bioavailability,
            r.concentrationLevel = $concentrationLevel
      `, {
        productId: mapping.productId,
        ingredientId: mapping.ingredientId,
        percentage: mapping.properties.percentage || 0,
        extractionMethod: mapping.properties.extractionMethod || '',
        bioavailability: mapping.properties.bioavailability || 0.8,
        concentrationLevel: mapping.properties.concentrationLevel || 'moderate'
      });
      created++;
    }

    logger.info(`✅ Created ${created} product-ingredient relationships`);
    return created;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Failed to create product-ingredient relationships:', { error: errorMessage });
    throw error;
  } finally {
    await session.close();
  }
}

// Build regional growing relationships
export async function buildRegionalGrowingRelationships(
  mappings: Array<{
    ingredientId: string;
    regionId: string;
    properties: GrownInRelationship;
  }>
): Promise<number> {
  const session = await getSession();
  let created = 0;

  try {
    for (const mapping of mappings) {
      await session.run(`
        MATCH (i:Ingredient {id: $ingredientId})
        MATCH (r:Region {id: $regionId})
        MERGE (i)-[rel:GROWN_IN]->(r)
        SET rel.quality = $quality,
            rel.sustainability = $sustainability,
            rel.certifications = $certifications,
            rel.harvestMethods = $harvestMethods
      `, {
        ingredientId: mapping.ingredientId,
        regionId: mapping.regionId,
        quality: mapping.properties.quality || 'good',
        sustainability: mapping.properties.sustainability || 'conventional',
        certifications: mapping.properties.certifications || [],
        harvestMethods: mapping.properties.harvestMethods || []
      });
      created++;
    }

    logger.info(`✅ Created ${created} regional growing relationships`);
    return created;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Failed to create regional growing relationships:', { error: errorMessage });
    throw error;
  }
}

// Build health benefit relationships
export async function buildHealthBenefitRelationships(
  mappings: Array<{
    productId: number;
    conditionId: string;
    properties: TreatsRelationship;
  }>
): Promise<number> {
  const session = await getSession();
  let created = 0;

  try {
    for (const mapping of mappings) {
      await session.run(`
        MATCH (p:Product {id: $productId})
        MATCH (c:Condition {id: $conditionId})
        MERGE (p)-[rel:TREATS]->(c)
        SET rel.effectiveness = $effectiveness,
            rel.evidenceLevel = $evidenceLevel,
            rel.dosage = $dosage,
            rel.duration = $duration,
            rel.contraindications = $contraindications
      `, {
        productId: mapping.productId,
        conditionId: mapping.conditionId,
        effectiveness: mapping.properties.effectiveness || 'moderate',
        evidenceLevel: mapping.properties.evidenceLevel || 'preliminary',
        dosage: mapping.properties.dosage || '',
        duration: mapping.properties.duration || '',
        contraindications: mapping.properties.contraindications || []
      });
      created++;
    }

    logger.info(`✅ Created ${created} health benefit relationships`);
    return created;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Failed to create health benefit relationships:', { error: errorMessage });
    throw error;
  }
}

// Build nutritional content relationships
export async function buildNutritionalRelationships(
  mappings: Array<{
    productId: number;
    nutrientId: string;
    properties: RichInRelationship;
  }>
): Promise<number> {
  const session = await getSession();
  let created = 0;

  try {
    for (const mapping of mappings) {
      await session.run(`
        MATCH (p:Product {id: $productId})
        MATCH (n:Nutrient {id: $nutrientId})
        MERGE (p)-[rel:RICH_IN]->(n)
        SET rel.amount = $amount,
            rel.unit = $unit,
            rel.per100g = $per100g,
            rel.bioavailability = $bioavailability,
            rel.form = $form
      `, {
        productId: mapping.productId,
        nutrientId: mapping.nutrientId,
        amount: mapping.properties.amount || 0,
        unit: mapping.properties.unit || 'mg',
        per100g: mapping.properties.per100g || 0,
        bioavailability: mapping.properties.bioavailability || 1.0,
        form: mapping.properties.form || 'natural'
      });
      created++;
    }

    logger.info(`✅ Created ${created} nutritional relationships`);
    return created;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Failed to create nutritional relationships:', { error: errorMessage });
    throw error;
  }
}

// Comprehensive batch import function
export async function batchImportExtendedData(data: {
  ingredients?: GraphIngredient[];
  regions?: GraphRegion[];
  seasons?: GraphSeason[];
  conditions?: GraphCondition[];
  nutrients?: GraphNutrient[];
  preparationMethods?: GraphPreparationMethod[];
}): Promise<BatchImportResults> {
  const results: BatchImportResults = {
    ingredientsImported: 0,
    regionsImported: 0,
    seasonsImported: 0,
    conditionsImported: 0,
    nutrientsImported: 0,
    preparationMethodsImported: 0,
    relationshipsCreated: 0,
    errors: []
  };

  try {
    logger.info('🚀 Starting batch import of extended graph data...');

    if (data.ingredients?.length) {
      results.ingredientsImported = await importIngredients(data.ingredients);
    }

    if (data.regions?.length) {
      results.regionsImported = await importRegions(data.regions);
    }

    if (data.seasons?.length) {
      results.seasonsImported = await importSeasons(data.seasons);
    }

    if (data.conditions?.length) {
      results.conditionsImported = await importConditions(data.conditions);
    }

    if (data.nutrients?.length) {
      results.nutrientsImported = await importNutrients(data.nutrients);
    }

    if (data.preparationMethods?.length) {
      results.preparationMethodsImported = await importPreparationMethods(data.preparationMethods);
    }

    logger.info('✅ Batch import completed successfully');
    return results;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.errors.push(errorMessage);
    logger.error('❌ Batch import failed:', { error: errorMessage });
    return results;
  }
}

// Data validation utilities
export async function validateGraphData(): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  const session = await getSession();
  const issues: string[] = [];
  const suggestions: string[] = [];

  try {
    // Check for orphaned nodes
    const orphanedProducts = await session.run(`
      MATCH (p:Product)
      WHERE NOT (p)-[:CONTAINS]->(:Ingredient)
      RETURN COUNT(p) as count
    `);
    
    const orphanedCountValue = orphanedProducts.records[0]?.get('count');
    const orphanedCount = orphanedCountValue ? 
      (typeof orphanedCountValue === 'object' && orphanedCountValue !== null && 'toNumber' in orphanedCountValue 
        ? (orphanedCountValue as Integer).toNumber() 
        : Number(orphanedCountValue)) : 0;
    
    if (orphanedCount > 0) {
      issues.push(`${orphanedCount} products have no ingredient relationships`);
      suggestions.push('Run ingredient analysis to populate missing CONTAINS relationships');
    }

    // Check for missing nutritional data
    const productsWithoutNutrients = await session.run(`
      MATCH (p:Product)
      WHERE NOT (p)-[:RICH_IN]->(:Nutrient)
      RETURN COUNT(p) as count
    `);
    
    const missingNutrientCountValue = productsWithoutNutrients.records[0]?.get('count');
    const missingNutrientCount = missingNutrientCountValue ? 
      (typeof missingNutrientCountValue === 'object' && missingNutrientCountValue !== null && 'toNumber' in missingNutrientCountValue 
        ? (missingNutrientCountValue as Integer).toNumber() 
        : Number(missingNutrientCountValue)) : 0;
    
    if (missingNutrientCount > 0) {
      issues.push(`${missingNutrientCount} products have no nutritional data`);
      suggestions.push('Import nutritional analysis data for products');
    }

    // Check regional coverage
    const ingredientsWithoutRegions = await session.run(`
      MATCH (i:Ingredient)
      WHERE NOT (i)-[:GROWN_IN]->(:Region)
      RETURN COUNT(i) as count
    `);
    
    const missingRegionCountValue = ingredientsWithoutRegions.records[0]?.get('count');
    const missingRegionCount = missingRegionCountValue ? 
      (typeof missingRegionCountValue === 'object' && missingRegionCountValue !== null && 'toNumber' in missingRegionCountValue 
        ? (missingRegionCountValue as Integer).toNumber() 
        : Number(missingRegionCountValue)) : 0;
    
    if (missingRegionCount > 0) {
      issues.push(`${missingRegionCount} ingredients have no regional data`);
      suggestions.push('Add regional growing information for ingredients');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Data validation failed:', { error: errorMessage });
    return {
      isValid: false,
      issues: ['Validation query failed'],
      suggestions: ['Check database connectivity and schema']
    };
  }
}

// Cleanup utilities
export async function cleanupIncompleteData(): Promise<{
  nodesRemoved: number;
  relationshipsRemoved: number;
}> {
  const session = await getSession();
  let nodesRemoved = 0;
  let relationshipsRemoved = 0;

  try {
    // Remove duplicate nodes
    const duplicateIngredients = await session.run(`
      MATCH (i1:Ingredient), (i2:Ingredient)
      WHERE i1.name = i2.name AND i1.id > i2.id
      DETACH DELETE i1
      RETURN COUNT(i1) as removed
    `);
    
    const duplicateCountValue = duplicateIngredients.records[0]?.get('removed');
    nodesRemoved += duplicateCountValue ? 
      (typeof duplicateCountValue === 'object' && duplicateCountValue !== null && 'toNumber' in duplicateCountValue 
        ? (duplicateCountValue as Integer).toNumber() 
        : Number(duplicateCountValue)) : 0;

    // Remove relationships without valid properties
    const invalidRelationships = await session.run(`
      MATCH ()-[r:CONTAINS]->()
      WHERE r.percentage IS NULL OR r.percentage < 0
      DELETE r
      RETURN COUNT(r) as removed
    `);
    
    const invalidCountValue = invalidRelationships.records[0]?.get('removed');
    relationshipsRemoved += invalidCountValue ? 
      (typeof invalidCountValue === 'object' && invalidCountValue !== null && 'toNumber' in invalidCountValue 
        ? (invalidCountValue as Integer).toNumber() 
        : Number(invalidCountValue)) : 0;

    logger.info(`🧹 Cleaned up ${nodesRemoved} nodes and ${relationshipsRemoved} relationships`);

    return { nodesRemoved, relationshipsRemoved };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Cleanup failed:', { error: errorMessage });
    return { nodesRemoved: 0, relationshipsRemoved: 0 };
  } finally {
    await session.close();
  }
}