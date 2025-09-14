import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { 
  findDirectRelationships,
  findMultiHopPaths,
  findConnectedEntities,
  findTransitiveRelationships,
  getRelationshipStatistics,
  discoverAllRelationships
} from '@/lib/relationship-discovery';
import { 
  discoverEntitiesFromProducts,
  discoverEntitiesFromGraph,
  autoCreateDiscoveredEntities
} from '@/lib/entity-discovery';
import { getAllProducts } from '@/lib/woocommerce';
import { DiscoveredEntity } from '@/lib/entity-discovery';

// GET /api/graph/relationships - Get relationship statistics
export async function GET() {
  try {
    const stats = await getRelationshipStatistics();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ Relationship stats error:', error as Record<string, unknown>);
    return NextResponse.json({
      success: false,
      error: 'Failed to get relationship statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/graph/relationships - Discover relationships or entities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sourceId, sourceType, targetType, maxDepth = 3, limit = 50, autoCreate = false } = body;
    
    let result: unknown = null;
    
    switch (action) {
      case 'find-direct':
        if (!sourceId || !sourceType || !targetType) {
          return NextResponse.json({
            success: false,
            error: 'sourceId, sourceType, and targetType are required for find-direct action'
          }, { status: 400 });
        }
        result = await findDirectRelationships(sourceId, sourceType, targetType, limit);
        break;
        
      case 'find-paths':
        if (!sourceId || !sourceType || !targetType) {
          return NextResponse.json({
            success: false,
            error: 'sourceId, sourceType, and targetType are required for find-paths action'
          }, { status: 400 });
        }
        result = await findMultiHopPaths(sourceId, sourceType, targetType, maxDepth, limit);
        break;
        
      case 'find-connected':
        if (!sourceId || !sourceType) {
          return NextResponse.json({
            success: false,
            error: 'sourceId and sourceType are required for find-connected action'
          }, { status: 400 });
        }
        result = await findConnectedEntities(sourceId, sourceType, limit);
        break;
        
      case 'find-transitive':
        result = await findTransitiveRelationships(limit);
        break;
        
      case 'discover-all':
        result = await discoverAllRelationships(limit);
        break;
        
      case 'discover-entities':
        // Discover entities from all sources
        const [productEntities, graphEntities] = await Promise.all([
          getAllProducts().then(discoverEntitiesFromProducts),
          discoverEntitiesFromGraph()
        ]);
        
        // Combine and deduplicate entities
        const entityMap = new Map<string, DiscoveredEntity>();
        [...productEntities, ...graphEntities].forEach(entity => {
          entityMap.set(entity.id, entity);
        });
        const discoveredEntities = Array.from(entityMap.values());
        
        // Auto-create entities if requested
        let creationResult = null;
        if (autoCreate && discoveredEntities.length > 0) {
          creationResult = await autoCreateDiscoveredEntities(discoveredEntities);
        }
        
        result = {
          entities: discoveredEntities,
          count: discoveredEntities.length,
          created: creationResult
        };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: find-direct, find-paths, find-connected, find-transitive, discover-all, or discover-entities'
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('❌ Relationship discovery error:', error as Record<string, unknown>);
    return NextResponse.json({
      success: false,
      error: 'Failed to discover relationships',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}