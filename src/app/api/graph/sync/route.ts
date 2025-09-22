import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// In-memory store for sync timestamps - in production, use a database
const MAX_TIMESTAMP_ENTRIES = 100; // Limit the number of stored timestamps
const syncTimestamps = new Map<string, Date>();

// Helper function to manage timestamp storage with bounds
function setSyncTimestamp(key: string, timestamp: Date) {
  // Remove oldest entries if we're at the limit
  if (syncTimestamps.size >= MAX_TIMESTAMP_ENTRIES) {
    const oldestKey = syncTimestamps.keys().next().value;
    if (oldestKey) {
      syncTimestamps.delete(oldestKey);
    }
  }
  syncTimestamps.set(key, timestamp);
}

import { getAllProducts, getAllCategories } from '@/lib/woocommerce';
import { WCProduct, WCCategory, WCTag } from '@/types/woocommerce';
import { 
  addProductToGraph, 
  addHealthBenefitToProduct, 
  createIndexes,
  testMemgraphConnection,
  getGraphStats 
} from '@/lib/memgraph';

// POST /api/graph/sync - Sync WooCommerce data to MemGraph
export async function POST(_request: NextRequest) {
  try {
    logger.info('🔄 Starting graph database sync...');

    // Test connection first
    const connectionTest = await testMemgraphConnection();
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to MemGraph',
        details: connectionTest.error
      }, { status: 500 });
    }

    // Create indexes if they don't exist
    await createIndexes();

    // Get data from WooCommerce
    logger.info('📦 Fetching products from WooCommerce...');
    const products = await getAllProducts();
    
    logger.info('🏷️ Fetching categories from WooCommerce...');
    const categories = await getAllCategories();

    let syncedProducts = 0;
    let failedProducts = 0;

    // Sync products to graph
    for (const product of products) {
      try {
        const graphProduct = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: parseFloat(product.price || '0'),
          categories: product.categories?.map(cat => cat.name) || [],
          description: product.short_description || product.description || '',
          inStock: product.stock_status === 'instock',
          featured: Boolean(product.featured)
        };

        const success = await addProductToGraph(graphProduct);
        
        if (success) {
          syncedProducts++;
          
          // Add health benefits based on product attributes or categories
          await addHealthBenefitsForProduct(product);
          
        } else {
          failedProducts++;
        }
      } catch (error) {
        logger.error(`❌ Failed to sync product ${product.id}:`, error as Record<string, unknown>);
        failedProducts++;
      }
    }

    // Get final stats
    const stats = await getGraphStats();

    // Store sync timestamp
    const now = new Date();
    setSyncTimestamp('lastSync', now);

    logger.info('✅ Graph sync completed!', {
      syncedProducts,
      failedProducts,
      totalProducts: products.length,
      graphStats: stats,
      timestamp: now.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Graph database sync completed',
      data: {
        syncedProducts,
        failedProducts,
        totalProducts: products.length,
        categories: categories.length,
        stats,
        lastSync: now.toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Graph sync error:', error as Record<string, unknown>);
    return NextResponse.json({
      success: false,
      error: 'Graph sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/graph/sync - Get sync status and stats
export async function GET(_request: NextRequest) {
  try {
    const connectionTest = await testMemgraphConnection();
    const stats = await getGraphStats();
    const lastSync = syncTimestamps.get('lastSync');

    return NextResponse.json({
      success: true,
      data: {
        connected: connectionTest.success,
        stats,
        lastSync: lastSync ? lastSync.toISOString() : null
      }
    });
  } catch (error) {
    logger.error('❌ Graph status error:', error as Record<string, unknown>);
    return NextResponse.json({
      success: false,
      error: 'Failed to get graph status'
    }, { status: 500 });
  }
}

// Helper function to add health benefits based on product attributes
async function addHealthBenefitsForProduct(product: WCProduct): Promise<void> {
  try {
    // Health benefits mapping based on product names, categories, and tags
    const healthBenefitMappings = [
      {
        keywords: ['turmeric', 'curcumin'],
        benefits: [
          { name: 'Anti-inflammatory', description: 'Reduces inflammation in the body' },
          { name: 'Antioxidant', description: 'Rich in antioxidants that fight free radicals' },
          { name: 'Immune Support', description: 'Supports healthy immune system function' }
        ]
      },
      {
        keywords: ['black rice', 'purple rice'],
        benefits: [
          { name: 'Antioxidant', description: 'High in anthocyanins and antioxidants' },
          { name: 'Heart Health', description: 'Supports cardiovascular health' },
          { name: 'Fiber Rich', description: 'High in dietary fiber for digestive health' }
        ]
      },
      {
        keywords: ['brown rice', 'whole grain'],
        benefits: [
          { name: 'Fiber Rich', description: 'Excellent source of dietary fiber' },
          { name: 'B Vitamins', description: 'Rich in B-complex vitamins' },
          { name: 'Energy', description: 'Provides sustained energy release' }
        ]
      },
      {
        keywords: ['quinoa'],
        benefits: [
          { name: 'Complete Protein', description: 'Contains all essential amino acids' },
          { name: 'Gluten Free', description: 'Naturally gluten-free grain alternative' },
          { name: 'Mineral Rich', description: 'High in iron, magnesium, and other minerals' }
        ]
      },
      {
        keywords: ['organic', 'natural'],
        benefits: [
          { name: 'Pesticide Free', description: 'Grown without synthetic pesticides' },
          { name: 'Chemical Free', description: 'No artificial chemicals or preservatives' }
        ]
      },
      {
        keywords: ['herb', 'herbal', 'tea'],
        benefits: [
          { name: 'Digestive Health', description: 'Supports healthy digestion' },
          { name: 'Relaxation', description: 'Promotes relaxation and stress relief' }
        ]
      },
      {
        keywords: ['honey', 'raw honey'],
        benefits: [
          { name: 'Natural Sweetener', description: 'Healthier alternative to refined sugar' },
          { name: 'Antibacterial', description: 'Natural antibacterial properties' },
          { name: 'Energy', description: 'Quick source of natural energy' }
        ]
      }
    ];

    const productText = `${product.name} ${product.description} ${product.short_description}`.toLowerCase();
    const categories = product.categories?.map((cat: WCCategory) => cat.name.toLowerCase()) || [];
    const tags = product.tags?.map((tag: WCTag) => tag.name.toLowerCase()) || [];

    for (const mapping of healthBenefitMappings) {
      const hasKeyword = mapping.keywords.some(keyword => 
        productText.includes(keyword) || 
        categories.some((cat: string) => cat.includes(keyword)) ||
        tags.some((tag: string) => tag.includes(keyword))
      );

      if (hasKeyword) {
        for (const benefit of mapping.benefits) {
          await addHealthBenefitToProduct(product.id, benefit.name, benefit.description);
        }
      }
    }
  } catch (error) {
    logger.error(`❌ Failed to add health benefits for product ${product.id}:`, error as Record<string, unknown>);
  }
}