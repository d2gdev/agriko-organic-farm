import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { getGraphStats } from '@/lib/memgraph';
import { getSession } from '@/lib/memgraph';
import { getExtendedGraphStats } from '@/lib/extended-graph-schema';

export async function GET() {
  try {
    logger.info('📊 Fetching knowledge graph statistics...');
    
    // Get basic graph stats
    const basicStats = await getGraphStats();
    
    // Get extended graph stats
    const extendedStats = await getExtendedGraphStats();
    
    // Get additional insights
    const session = await getSession();
    try {
      // Top health benefits by product count
      const topBenefits = await session.run(`
        MATCH (h:HealthBenefit)<-[:PROVIDES]-(p:Product)
        WITH h.name as benefit, COUNT(p) as productCount
        ORDER BY productCount DESC
        LIMIT 5
        RETURN benefit, productCount
      `);
      
      // Top categories by product count  
      const topCategories = await session.run(`
        MATCH (c:Category)<-[:BELONGS_TO]-(p:Product)
        WITH c.name as category, COUNT(p) as productCount
        ORDER BY productCount DESC
        LIMIT 5
        RETURN category, productCount
      `);
      
      // Sample product-health benefit relationships
      const sampleRelationships = await session.run(`
        MATCH (p:Product)-[:PROVIDES]->(h:HealthBenefit)
        RETURN p.name as product, h.name as benefit
        LIMIT 10
      `);
      
      const insights = {
        topHealthBenefits: topBenefits.records.map(record => ({
          benefit: record.get('benefit'),
          productCount: record.get('productCount'),
        })),
        topCategories: topCategories.records.map(record => ({
          category: record.get('category'),
          productCount: record.get('productCount'),
        })),
        sampleRelationships: sampleRelationships.records.map(record => ({
          product: record.get('product'),
          benefit: record.get('benefit'),
        })),
      };
      
      return NextResponse.json({
        success: true,
        stats: {
          ...basicStats,
          ...extendedStats
        },
        insights,
      });
      
    } catch (insightError) {
      logger.error('❌ Failed to fetch graph insights:', insightError as Record<string, unknown>);
      
      // Return basic stats even if insights fail
      return NextResponse.json({
        success: true,
        stats: {
          ...basicStats,
          ...extendedStats
        },
        insights: {
          topHealthBenefits: [],
          topCategories: [],
          sampleRelationships: [],
        },
      });
    }

  } catch (error) {
    logger.error('❌ Graph stats error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch graph statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}