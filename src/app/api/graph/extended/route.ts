// Extended Graph API endpoints for advanced relationship modeling
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import {
  getProductsByNutrient,
  getProductsForCondition,
  getSeasonalProducts,
  getExtendedGraphStats,
  getProductsByIngredient,
  getIngredientsByProduct,
  getProductsByRegion,
  addIngredient,
  addRegion,
  addCondition,
  addNutrient,
  createProductContainsIngredient,
  createProductGrownInRegion,
  createHealthBenefitTreatsCondition,
  createIngredientRichInNutrient,
  Ingredient,
  Region,
  Condition,
  Nutrient
} from '@/lib/extended-graph-schema';
import {
  batchImportExtendedData,
  validateGraphData,
  cleanupIncompleteData,
  buildProductIngredientRelationships,
  buildRegionalGrowingRelationships,
  buildHealthBenefitRelationships,
  buildNutritionalRelationships
} from '@/lib/graph-data-import';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const productId = searchParams.get('productId');
    const ingredientId = searchParams.get('ingredientId');
    const nutrientName = searchParams.get('nutrient');
    const conditionId = searchParams.get('condition');
    const region = searchParams.get('region');
    const season = searchParams.get('season');
    const limit = parseInt(searchParams.get('limit') ?? '10');

    logger.info(`🔍 Extended graph API GET: action=${action}`);

    switch (action) {
      case 'products_by_ingredient':
        if (!ingredientId) {
          return NextResponse.json(
            { error: 'ingredientId parameter is required' },
            { status: 400 }
          );
        }
        const ingredientProducts = await getProductsByIngredient(ingredientId, limit);
        return NextResponse.json({
          success: true,
          action,
          ingredientId,
          products: ingredientProducts,
          count: ingredientProducts.length
        });

      case 'ingredients_by_product':
        if (!productId) {
          return NextResponse.json(
            { error: 'productId parameter is required' },
            { status: 400 }
          );
        }
        const productIngredients = await getIngredientsByProduct(parseInt(productId), limit);
        return NextResponse.json({
          success: true,
          action,
          productId: parseInt(productId),
          ingredients: productIngredients,
          count: productIngredients.length
        });

      case 'products_by_nutrient':
        if (!nutrientName) {
          return NextResponse.json(
            { error: 'nutrient parameter is required' },
            { status: 400 }
          );
        }
        const minAmountStr = searchParams.get('minAmount');
        const minAmount = minAmountStr ? parseFloat(minAmountStr) : undefined;
        const nutrientProducts = await getProductsByNutrient(nutrientName, minAmount, limit);
        return NextResponse.json({
          success: true,
          action,
          nutrient: nutrientName,
          minAmount,
          products: nutrientProducts,
          count: nutrientProducts.length
        });

      case 'products_for_condition':
        if (!conditionId) {
          return NextResponse.json(
            { error: 'condition parameter is required' },
            { status: 400 }
          );
        }
        const conditionProducts = await getProductsForCondition(conditionId, undefined, limit);
        return NextResponse.json({
          success: true,
          action,
          condition: conditionId,
          products: conditionProducts,
          count: conditionProducts.length
        });

      case 'seasonal_products':
        const monthParam = searchParams.get('month');
        const currentMonth = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1;
        const seasonalProducts = await getSeasonalProducts(currentMonth.toString(), undefined, limit);
        return NextResponse.json({
          success: true,
          action,
          month: currentMonth,
          products: seasonalProducts,
          count: seasonalProducts.length
        });

      case 'regional_products':
        if (!region) {
          return NextResponse.json(
            { error: 'region parameter is required' },
            { status: 400 }
          );
        }
        // Fix: Convert null to undefined for the season parameter
        const seasonValue = season === null ? undefined : season;
        const regionalProducts = await getProductsByRegion(region, seasonValue, limit);
        return NextResponse.json({
          success: true,
          action,
          region,
          season,
          products: regionalProducts,
          count: regionalProducts.length
        });

      case 'stats':
        const stats = await getExtendedGraphStats();
        return NextResponse.json({
          success: true,
          action,
          stats
        });

      case 'validate':
        const validation = await validateGraphData();
        return NextResponse.json({
          success: true,
          action,
          validation
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: products_by_ingredient, ingredients_by_product, products_by_nutrient, products_for_condition, seasonal_products, regional_products, stats, validate' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ Extended graph GET error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Extended graph query failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

interface IngredientData {
  id: string;
  name: string;
  description?: string;
  properties?: Record<string, unknown>;
}

interface RegionData {
  id: string;
  name: string;
  country?: string;
  properties?: Record<string, unknown>;
}

interface ConditionData {
  id: string;
  name: string;
  category?: string;
  properties?: Record<string, unknown>;
}

interface NutrientData {
  id: string;
  name: string;
  unit?: string;
  properties?: Record<string, unknown>;
}

interface BatchImportData {
  ingredients?: IngredientData[];
  regions?: RegionData[];
  conditions?: ConditionData[];
  nutrients?: NutrientData[];
  relationships?: Array<{
    type: string;
    from: string;
    to: string;
    properties?: Record<string, unknown>;
  }>;
}

interface PostRequestBody {
  ingredient?: IngredientData;
  region?: RegionData;
  condition?: ConditionData;
  nutrient?: NutrientData;
  productId?: string | number;
  ingredientId?: string;
  regionId?: string;
  conditionId?: string;
  nutrientId?: string;
  properties?: Record<string, unknown>;
  grownInProperties?: Record<string, unknown>;
  treatsProperties?: Record<string, unknown>;
  richInProperties?: Record<string, unknown>;
  data?: BatchImportData;
  relationshipType?: string;
  mappings?: Array<Record<string, unknown>>;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'unknown';
    const body = await request.json() as PostRequestBody;

    logger.info(`🔧 Extended graph API POST: action=${action}`);

    switch (action) {
      case 'add_ingredient':
        const { ingredient } = body;
        if (!ingredient?.id || !ingredient.name) {
          return NextResponse.json(
            { error: 'Valid ingredient object with id and name is required' },
            { status: 400 }
          );
        }
        
        // Transform IngredientData to Ingredient by providing default values for required fields
        const ingredientWithDefaults: Ingredient = {
          id: ingredient.id,
          name: ingredient.name,
          type: 'other', // Default type since it's required but not provided in IngredientData
          description: ingredient.description,
          harvestSeason: [],
          nutritionalProfile: {},
          preparations: [],
          ...(ingredient.properties || {})
        };
        
        const ingredientSuccess = await addIngredient(ingredientWithDefaults);
        return NextResponse.json({
          success: ingredientSuccess,
          action,
          ingredient: ingredient.id,
          message: ingredientSuccess ? 'Ingredient added successfully' : 'Failed to add ingredient'
        });

      case 'add_region':
        const { region } = body;
        if (!region?.id || !region.name) {
          return NextResponse.json(
            { error: 'Valid region object with id and name is required' },
            { status: 400 }
          );
        }
        
        // Transform RegionData to Region by providing default values for required fields
        const regionWithDefaults: Region = {
          id: region.id,
          name: region.name,
          country: region.country || 'Unknown', // Default country since it's required
          climate: 'temperate', // Default climate since it's required
          characteristics: [], // Default empty array since it's required
          seasonality: {},
          ...(region.properties || {})
        };
        
        const regionSuccess = await addRegion(regionWithDefaults);
        return NextResponse.json({
          success: regionSuccess,
          action,
          region: region.id,
          message: regionSuccess ? 'Region added successfully' : 'Failed to add region'
        });

      case 'add_condition':
        const { condition } = body;
        if (!condition?.id || !condition.name) {
          return NextResponse.json(
            { error: 'Valid condition object with id and name is required' },
            { status: 400 }
          );
        }
        
        // Transform ConditionData to Condition by providing default values for required fields
        const conditionWithDefaults: Condition = {
          id: condition.id,
          name: condition.name,
          category: (condition.category as 'chronic' | 'acute' | 'preventive' | 'wellness') || 'wellness', // Default category
          symptoms: [], // Default empty array since it's required
          affectedSystems: [], // Default empty array since it's required
          severity: 'moderate', // Default severity since it's required
          ...(condition.properties || {})
        };
        
        const conditionSuccess = await addCondition(conditionWithDefaults);
        return NextResponse.json({
          success: conditionSuccess,
          action,
          condition: condition.id,
          message: conditionSuccess ? 'Condition added successfully' : 'Failed to add condition'
        });

      case 'add_nutrient':
        const { nutrient } = body;
        if (!nutrient?.id || !nutrient.name) {
          return NextResponse.json(
            { error: 'Valid nutrient object with id and name is required' },
            { status: 400 }
          );
        }
        
        // Transform NutrientData to Nutrient by providing default values for required fields
        const nutrientWithDefaults: Nutrient = {
          id: nutrient.id,
          name: nutrient.name,
          type: 'other', // Default type since it's required
          unit: nutrient.unit || 'mg', // Default unit since it's required
          functions: [], // Default empty array since it's required
          sources: [], // Default empty array since it's required
          ...(nutrient.properties || {})
        };
        
        const nutrientSuccess = await addNutrient(nutrientWithDefaults);
        return NextResponse.json({
          success: nutrientSuccess,
          action,
          nutrient: nutrient.id,
          message: nutrientSuccess ? 'Nutrient added successfully' : 'Failed to add nutrient'
        });

      case 'create_contains_relationship':
        const { productId, ingredientId, properties } = body;
        if (!productId || !ingredientId) {
          return NextResponse.json(
            { error: 'productId and ingredientId are required' },
            { status: 400 }
          );
        }
        const containsSuccess = await createProductContainsIngredient(
          typeof productId === 'string' ? parseInt(productId) : productId, 
          ingredientId, 
          {
            concentrationLevel: 'moderate', // Default required value
            ...(properties ?? {})
          }
        );
        return NextResponse.json({
          success: containsSuccess,
          action,
          productId: typeof productId === 'string' ? productId : productId.toString(),
          ingredientId,
          message: containsSuccess ? 'CONTAINS relationship created' : 'Failed to create CONTAINS relationship'
        });

      case 'create_grown_in_relationship':
        const { ingredientId: ingId, regionId, grownInProperties } = body;
        if (!ingId || !regionId) {
          return NextResponse.json(
            { error: 'ingredientId and regionId are required' },
            { status: 400 }
          );
        }
        const grownInSuccess = await createProductGrownInRegion(
          typeof ingId === 'string' ? parseInt(ingId) : ingId, 
          regionId, 
          {
            quality: 'good', // Default required value
            sustainability: 'conventional', // Default required value
            ...(grownInProperties ?? {})
          }
        );
        return NextResponse.json({
          success: grownInSuccess,
          action,
          ingredientId: typeof ingId === 'string' ? parseInt(ingId) : ingId,
          regionId,
          message: grownInSuccess ? 'GROWN_IN relationship created' : 'Failed to create GROWN_IN relationship'
        });

      case 'create_treats_relationship':
        const { productId: prodId, conditionId: condId, treatsProperties } = body;
        if (!prodId || !condId) {
          return NextResponse.json(
            { error: 'productId and conditionId are required' },
            { status: 400 }
          );
        }
        const treatsSuccess = await createHealthBenefitTreatsCondition(
          typeof prodId === 'number' ? prodId.toString() : prodId, 
          condId, 
          {
            effectiveness: 'potential', // Default required value
            evidenceLevel: 'traditional', // Default required value
            ...(treatsProperties ?? {})
          }
        );
        return NextResponse.json({
          success: treatsSuccess,
          action,
          productId: typeof prodId === 'number' ? prodId.toString() : prodId,
          conditionId: condId,
          message: treatsSuccess ? 'TREATS relationship created' : 'Failed to create TREATS relationship'
        });

      case 'create_rich_in_relationship':
        const { productId: pId, nutrientId, richInProperties } = body;
        if (!pId || !nutrientId) {
          return NextResponse.json(
            { error: 'productId and nutrientId are required' },
            { status: 400 }
          );
        }
        const richInSuccess = await createIngredientRichInNutrient(
          typeof pId === 'number' ? pId.toString() : pId, 
          nutrientId, 
          {
            amount: 0, // Default required value
            unit: 'mg', // Default required value
            form: 'natural', // Default required value
            ...(richInProperties ?? {})
          }
        );
        return NextResponse.json({
          success: richInSuccess,
          action,
          productId: typeof pId === 'number' ? pId.toString() : pId,
          nutrientId,
          message: richInSuccess ? 'RICH_IN relationship created' : 'Failed to create RICH_IN relationship'
        });

      case 'batch_import':
        const { data } = body;
        if (!data) {
          return NextResponse.json(
            { error: 'data object is required for batch import' },
            { status: 400 }
          );
        }
        
        // Transform BatchImportData to the format expected by batchImportExtendedData
        const transformedData: Record<string, unknown> = {};
        
        // Transform ingredients
        if (data.ingredients) {
          transformedData.ingredients = data.ingredients.map((ingredient: IngredientData) => ({
            id: ingredient.id,
            name: ingredient.name,
            type: 'other', // Default type
            description: ingredient.description,
            harvestSeason: [],
            nutritionalProfile: {},
            preparations: [],
            ...(ingredient.properties || {})
          }));
        }
        
        // Transform regions
        if (data.regions) {
          transformedData.regions = data.regions.map((region: RegionData) => ({
            id: region.id,
            name: region.name,
            country: region.country || 'Unknown',
            climate: 'temperate',
            characteristics: [],
            seasonality: {},
            ...(region.properties || {})
          }));
        }
        
        // Transform conditions
        if (data.conditions) {
          transformedData.conditions = data.conditions.map((condition: ConditionData) => ({
            id: condition.id,
            name: condition.name,
            category: (condition.category as 'chronic' | 'acute' | 'preventive' | 'wellness') || 'wellness',
            symptoms: [],
            affectedSystems: [],
            severity: 'moderate',
            ...(condition.properties || {})
          }));
        }
        
        // Transform nutrients
        if (data.nutrients) {
          transformedData.nutrients = data.nutrients.map((nutrient: NutrientData) => ({
            id: nutrient.id,
            name: nutrient.name,
            type: 'other',
            unit: nutrient.unit || 'mg',
            functions: [],
            sources: [],
            ...(nutrient.properties || {})
          }));
        }
        
        const importResults = await batchImportExtendedData(transformedData);
        return NextResponse.json({
          success: importResults.errors.length === 0,
          action,
          results: importResults,
          message: importResults.errors.length === 0 ? 'Batch import completed' : 'Batch import completed with errors'
        });

      case 'build_relationships':
        const { relationshipType, mappings } = body;
        if (!relationshipType || !mappings || !Array.isArray(mappings)) {
          return NextResponse.json(
            { error: 'relationshipType and mappings array are required' },
            { status: 400 }
          );
        }

        let relationshipsCreated = 0;
        switch (relationshipType) {
          case 'product_ingredient':
            // Transform mappings to the expected format
            const productIngredientMappings = mappings.map(mapping => ({
              productId: typeof mapping.productId === 'string' ? parseInt(mapping.productId) : (mapping.productId as number),
              ingredientId: mapping.ingredientId as string,
              properties: {
                concentrationLevel: 'moderate' as const,
                ...(mapping.properties || {})
              }
            }));
            relationshipsCreated = await buildProductIngredientRelationships(productIngredientMappings);
            break;
          case 'regional_growing':
            // Transform mappings to the expected format
            const regionalGrowingMappings = mappings.map(mapping => ({
              ingredientId: mapping.ingredientId as string,
              regionId: mapping.regionId as string,
              properties: {
                quality: 'good' as const,
                sustainability: 'conventional' as const,
                ...(mapping.properties || {})
              }
            }));
            relationshipsCreated = await buildRegionalGrowingRelationships(regionalGrowingMappings);
            break;
          case 'health_benefits':
            // Transform mappings to the expected format
            const healthBenefitMappings = mappings.map(mapping => ({
              productId: typeof mapping.productId === 'string' ? parseInt(mapping.productId) : (mapping.productId as number),
              conditionId: mapping.conditionId as string,
              properties: {
                effectiveness: 'potential' as const,
                evidenceLevel: 'traditional' as const,
                ...(mapping.properties || {})
              }
            }));
            relationshipsCreated = await buildHealthBenefitRelationships(healthBenefitMappings);
            break;
          case 'nutritional':
            // Transform mappings to the expected format
            const nutritionalMappings = mappings.map(mapping => ({
              productId: typeof mapping.productId === 'string' ? parseInt(mapping.productId) : (mapping.productId as number),
              nutrientId: mapping.nutrientId as string,
              properties: {
                amount: 0,
                unit: 'mg',
                form: 'natural' as const,
                ...(mapping.properties || {})
              }
            }));
            relationshipsCreated = await buildNutritionalRelationships(nutritionalMappings);
            break;
          default:
            return NextResponse.json(
              { error: 'Invalid relationshipType. Supported: product_ingredient, regional_growing, health_benefits, nutritional' },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: relationshipsCreated > 0,
          action,
          relationshipType,
          relationshipsCreated,
          message: `Created ${relationshipsCreated} ${relationshipType} relationships`
        });

      case 'cleanup':
        const cleanupResults = await cleanupIncompleteData();
        return NextResponse.json({
          success: true,
          action,
          results: cleanupResults,
          message: `Cleaned up ${cleanupResults.nodesRemoved} nodes and ${cleanupResults.relationshipsRemoved} relationships`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: add_ingredient, add_region, add_condition, add_nutrient, create_*_relationship, batch_import, build_relationships, cleanup' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ Extended graph POST error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Extended graph operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const nodeType = searchParams.get('nodeType');
    const nodeId = searchParams.get('nodeId');

    if (!action || !nodeType || !nodeId) {
      return NextResponse.json(
        { error: 'action, nodeType, and nodeId parameters are required' },
        { status: 400 }
      );
    }

    logger.info(`🗑️ Extended graph DELETE: ${nodeType}:${nodeId}`);

    // For now, we'll implement basic node deletion
    // In production, you might want more sophisticated deletion with relationship handling
    const { getSession } = await import('@/lib/memgraph');
    const session = await getSession();
    
    try {
      interface DeleteResult {
        records: Array<{
          get(key: string): { toNumber(): number } | null;
        }>;
      }
      
      const result = await session.run(`
        MATCH (n:${nodeType} {id: $nodeId})
        DETACH DELETE n
        RETURN COUNT(n) as deleted
      `, { nodeId }) as DeleteResult;

      const deletedValue = result.records[0]?.get('deleted');
      const deletedCount = deletedValue?.toNumber() ?? 0;

      return NextResponse.json({
        success: deletedCount > 0,
        action,
        nodeType,
        nodeId,
        deletedCount,
        message: deletedCount > 0 ? `${nodeType} deleted successfully` : `${nodeType} not found`
      });

    } finally {
      await session.close();
    }

  } catch (error) {
    logger.error('❌ Extended graph DELETE error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Extended graph deletion failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}