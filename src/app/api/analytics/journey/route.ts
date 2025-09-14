import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { getSession } from '@/lib/memgraph';
import { generateRecommendationReason } from '@/lib/deepseek';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { startProductId?: number; journeyType?: string };
    const { startProductId, journeyType = 'health-benefits' } = body;
    
    if (!startProductId) {
      return NextResponse.json(
        { success: false, error: 'startProductId is required' },
        { status: 400 }
      );
    }
    
    logger.info(`🗺️ Analyzing customer journey from product ID: ${startProductId}`);
    logger.info(`   Journey type: ${journeyType}`);
    
    const session = await getSession();
    const journey = [];
    
    try {
      // Get starting product info
      const startProductResult = await session.run(`
        MATCH (p:Product {id: $productId})
        RETURN p.name as name, p.id as id, p.price as price
      `, { productId: startProductId });
      
      if (!startProductResult.records.length) {
        throw new Error('Starting product not found');
      }
      
      const startProduct = startProductResult.records[0];
      if (!startProduct) {
        throw new Error('Could not retrieve product data');
      }
      journey.push({
        step: 1,
        action: 'start',
        productId: startProductId,
        productName: startProduct.get('name'),
        price: startProduct.get('price'),
        reasoning: 'Customer lands on this product page',
      });
      
      if (journeyType === 'health-benefits') {
        // Health-benefit based journey
        logger.info('🍃 Analyzing health-benefit based journey...');
        
        // Step 2: Find health benefits of starting product
        const benefitsResult = await session.run(`
          MATCH (p:Product {id: $productId})-[:PROVIDES]->(h:HealthBenefit)
          RETURN h.name as benefit
          LIMIT 3
        `, { productId: startProductId });
        
        const benefits = benefitsResult.records.map(r => r.get('benefit'));
        
        if (benefits.length > 0) {
          journey.push({
            step: 2,
            action: 'discover_benefits',
            benefits: benefits,
            reasoning: `Customer learns about health benefits: ${benefits.join(', ')}`,
          });
          
          // Step 3: Find other products with similar benefits
          const relatedResult = await session.run(`
            MATCH (p1:Product {id: $productId})-[:PROVIDES]->(h:HealthBenefit)<-[:PROVIDES]-(p2:Product)
            WHERE p2.id <> $productId
            WITH p2, COUNT(h) as sharedBenefits
            ORDER BY sharedBenefits DESC
            LIMIT 3
            RETURN p2.name as name, p2.id as id, p2.price as price, sharedBenefits
          `, { productId: startProductId });
          
          const relatedProducts = relatedResult.records.map(record => ({
            productId: record.get('id') as number,
            productName: record.get('name') as string,
            price: record.get('price') as number,
            sharedBenefits: record.get('sharedBenefits') as number,
          }));
          
          journey.push({
            step: 3,
            action: 'explore_related',
            products: relatedProducts,
            reasoning: 'Customer explores products with similar health benefits',
          });
        }
        
      } else if (journeyType === 'categories') {
        // Category-based journey
        logger.info('📂 Analyzing category-based journey...');
        
        // Step 2: Find categories of starting product
        const categoriesResult = await session.run(`
          MATCH (p:Product {id: $productId})-[:BELONGS_TO]->(c:Category)
          RETURN c.name as category
        `, { productId: startProductId });
        
        const categories = categoriesResult.records.map(r => r.get('category'));
        
        if (categories.length > 0) {
          journey.push({
            step: 2,
            action: 'explore_categories',
            categories: categories,
            reasoning: `Customer browses categories: ${categories.join(', ')}`,
          });
          
          // Step 3: Find other products in same categories
          const categoryProductsResult = await session.run(`
            MATCH (p1:Product {id: $productId})-[:BELONGS_TO]->(c:Category)<-[:BELONGS_TO]-(p2:Product)
            WHERE p2.id <> $productId
            WITH p2, COUNT(c) as sharedCategories
            ORDER BY sharedCategories DESC, p2.featured DESC
            LIMIT 3
            RETURN p2.name as name, p2.id as id, p2.price as price, sharedCategories
          `, { productId: startProductId });
          
          const categoryProducts = categoryProductsResult.records.map(record => ({
            productId: record.get('id') as number,
            productName: record.get('name') as string,
            price: record.get('price') as number,
            sharedCategories: record.get('sharedCategories') as number,
          }));
          
          journey.push({
            step: 3,
            action: 'discover_similar',
            products: categoryProducts,
            reasoning: 'Customer discovers products in similar categories',
          });
        }
      }
      
      // Step 4: Generate final recommendations using AI
      const lastStep = journey[journey.length - 1];
      if (lastStep?.products && lastStep.products.length > 0) {
        const topRecommendation = lastStep.products[0];
        if (!topRecommendation) {
          const summary = `Customer journey with ${journey.length} steps`;
          return NextResponse.json({ success: true, data: { journey, summary } });
        }
        const aiReason = await generateRecommendationReason(
          (startProduct?.get('name') as string) ?? 'Unknown Product',
          topRecommendation.productName,
          journeyType === 'health-benefits' ? 'shared health benefits' : 'similar categories'
        );
        
        journey.push({
          step: journey.length + 1,
          action: 'ai_recommendation',
          recommendedProduct: topRecommendation,
          reasoning: aiReason,
        });
      }
      
      logger.info(`✅ Customer journey analysis completed with ${journey.length} steps`);
      
      return NextResponse.json({
        success: true,
        startProductId: startProductId,
        journeyType,
        journey,
        totalSteps: journey.length,
      });
      
    } catch (error) {
      throw error;
    }
    
  } catch (error) {
    logger.error('❌ Customer journey analysis failed:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze customer journey',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}