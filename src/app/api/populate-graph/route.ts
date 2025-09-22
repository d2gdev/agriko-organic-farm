import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { getAllProducts } from '@/lib/woocommerce';
import { addProductToGraph, addHealthBenefitToProduct } from '@/lib/memgraph';
import { extractHealthBenefits, generateProductInsights } from '@/lib/deepseek';

export async function POST() {
  try {
    logger.info('🚀 Starting knowledge graph population...');
    
    // Fetch products from WooCommerce
    logger.info('📦 Fetching products from WooCommerce...');
    const products = await getAllProducts({ per_page: 100 });
    logger.info(`✅ Found ${products.length} products`);
    
    interface ProductInsight {
      productId: number;
      productName: string;
      healthBenefits: string[];
      insights: {
        primaryUses: string[];
        targetAudience: string[];
        complementaryProducts: string[];
        seasonality?: string;
      };
    }
    
    const results = {
      totalProducts: products.length,
      processed: 0,
      healthBenefitsAdded: 0,
      errors: [] as string[],
      productInsights: [] as ProductInsight[],
    };
    
    for (const product of products) {
      try {
        logger.info(`\n🔄 Processing: ${product.name}`);
        
        // Add product to graph
        const productData = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: parseFloat(product.price as string) || 0,
          categories: product.categories?.map(cat => cat.name) || [],
          description: product.description || product.short_description || '',
          inStock: product.stock_status === 'instock',
          featured: Boolean(product.featured),
        };
        
        const addedToGraph = await addProductToGraph(productData);
        if (!addedToGraph) {
          results.errors.push(`Failed to add ${product.name} to graph`);
          continue;
        }
        
        // Extract health benefits using DeepSeek AI
        logger.info(`🧠 Extracting health benefits for: ${product.name}`);
        const healthBenefits = await extractHealthBenefits(
          product.name, 
          product.description || product.short_description || ''
        );
        
        // Add health benefits to graph
        for (const benefit of healthBenefits) {
          const added = await addHealthBenefitToProduct(product.id, benefit);
          if (added) {
            results.healthBenefitsAdded++;
          }
        }
        
        // Generate product insights using DeepSeek AI
        logger.info(`🔍 Generating insights for: ${product.name}`);
        const insights = await generateProductInsights(
          product.name,
          product.description || product.short_description || ''
        );
        
        results.productInsights.push({
          productId: product.id,
          productName: product.name,
          healthBenefits,
          insights,
        });
        
        results.processed++;
        logger.info(`✅ Completed processing: ${product.name}`);
        logger.info(`   Health benefits: ${healthBenefits.length}`);
        logger.info(`   Primary uses: ${insights.primaryUses?.length || 0}`);
        logger.info(`   Target audiences: ${insights.targetAudience?.length || 0}`);
        
      } catch (error) {
        const errorMsg = `Error processing ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        logger.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }
    
    logger.info(`\n🎉 Knowledge graph population completed!`);
    logger.info(`📊 Summary:`);
    logger.info(`   Products processed: ${results.processed}/${results.totalProducts}`);
    logger.info(`   Health benefits added: ${results.healthBenefitsAdded}`);
    logger.info(`   Errors: ${results.errors.length}`);
    
    return NextResponse.json({
      success: true,
      message: 'Knowledge graph populated successfully',
      results,
    });
    
  } catch (error) {
    logger.error('❌ Knowledge graph population failed:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to populate knowledge graph',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}