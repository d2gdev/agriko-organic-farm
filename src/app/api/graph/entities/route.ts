import { NextRequest, NextResponse } from 'next/server';
import { 
  discoverEntitiesFromProducts,
  discoverEntitiesFromGraph,
  discoverEntitiesFromText,
  autoCreateDiscoveredEntities,
  getEntityDiscoveryStats,
  DiscoveredEntity
} from '@/lib/entity-discovery';
import { getAllProducts } from '@/lib/woocommerce';

// GET /api/graph/entities - Get entity discovery statistics
export async function GET() {
  try {
    const stats = await getEntityDiscoveryStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    const { handleApiError } = await import('@/lib/error-sanitizer');
    return handleApiError(error as Error, 'Failed to get entity discovery statistics');
  }
}

// POST /api/graph/entities - Discover and optionally create entities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    
    // Validate request body with Zod schema
    const { graphEntitiesApiSchema } = await import('@/lib/validation');
    const validation = graphEntitiesApiSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }, { status: 400 });
    }
    
    const { action, autoCreate, content } = validation.data;
    let discoveredEntities = [];
    
    switch (action) {
      case 'discover-from-products': {
        // Get all products from WooCommerce
        const products = await getAllProducts();
        discoveredEntities = await discoverEntitiesFromProducts(products);
        break;
      }
        
      case 'discover-from-graph':
        discoveredEntities = await discoverEntitiesFromGraph();
        break;
        
      case 'discover-from-text': {
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'Content is required for text extraction'
          }, { status: 400 });
        }
        const textResult = await discoverEntitiesFromText(content);
        discoveredEntities = textResult.entities;
        break;
      }
        
      case 'discover-all': {
        // Run all discovery methods
        const [productEntities, graphEntities] = await Promise.all([
          getAllProducts().then(discoverEntitiesFromProducts),
          discoverEntitiesFromGraph()
        ]);

        // Combine and deduplicate entities
        const entityMap = new Map<string, DiscoveredEntity>();
        [...productEntities, ...graphEntities].forEach(entity => {
          entityMap.set(entity.id, entity);
        });
        discoveredEntities = Array.from(entityMap.values());
        break;
      }
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: discover-from-products, discover-from-graph, discover-from-text, or discover-all'
        }, { status: 400 });
    }
    
    // Auto-create entities if requested
    let creationResult = null;
    if (autoCreate && discoveredEntities.length > 0) {
      creationResult = await autoCreateDiscoveredEntities(discoveredEntities);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        entities: discoveredEntities,
        count: discoveredEntities.length,
        created: creationResult
      }
    });
  } catch (error) {
    const { handleApiError } = await import('@/lib/error-sanitizer');
    return handleApiError(error as Error, 'Failed to discover entities');
  }
}