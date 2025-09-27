// Pricing Data Store - Database operations
import { logger } from '../../../logger';
import { memgraphBI } from '../../memgraph/connection';
import type { PricingDataPoint, PricingAnalysis } from './types';

export class PricingDataStore {
  async storePricingData(dataPoint: Omit<PricingDataPoint, 'id'>): Promise<string> {
    try {
      const id = `pricing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.debug('Storing pricing data point', {
        competitorId: dataPoint.competitorId,
        productId: dataPoint.productId,
        price: dataPoint.price
      });

      await memgraphBI.executeQuery(`
        CREATE (p:PricingData {
          id: $id,
          competitorId: $competitorId,
          competitorName: $competitorName,
          productId: $productId,
          productName: $productName,
          price: $price,
          currency: $currency,
          priceType: $priceType,
          billingPeriod: $billingPeriod,
          features: $features,
          marketSegment: $marketSegment,
          geographicRegion: $geographicRegion,
          lastUpdated: $lastUpdated,
          confidence: $confidence,
          source: $source,
          metadata: $metadata,
          createdAt: $createdAt
        })
        RETURN p
      `, {
        id,
        competitorId: dataPoint.competitorId,
        competitorName: dataPoint.competitorName,
        productId: dataPoint.productId,
        productName: dataPoint.productName,
        price: dataPoint.price,
        currency: dataPoint.currency,
        priceType: dataPoint.priceType,
        billingPeriod: dataPoint.billingPeriod || null,
        features: JSON.stringify(dataPoint.features),
        marketSegment: dataPoint.marketSegment,
        geographicRegion: dataPoint.geographicRegion,
        lastUpdated: dataPoint.lastUpdated.toISOString(),
        confidence: dataPoint.confidence,
        source: dataPoint.source,
        metadata: JSON.stringify(dataPoint.metadata),
        createdAt: new Date().toISOString()
      });

      logger.info('Pricing data point stored successfully', { id, price: dataPoint.price });
      return id;
    } catch (error) {
      logger.error('Failed to store pricing data point:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getPricingData(
    competitorId: string,
    productCategory: string
  ): Promise<PricingDataPoint[]> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (p:PricingData)
        WHERE p.competitorId = $competitorId
          AND p.marketSegment = $productCategory
        RETURN p
        ORDER BY p.lastUpdated DESC
        LIMIT 100
      `, { competitorId, productCategory });

      return (result.records || []).map((record: any) => ({
        id: record.p.id,
        competitorId: record.p.competitorId,
        competitorName: record.p.competitorName,
        productId: record.p.productId,
        productName: record.p.productName,
        price: record.p.price,
        currency: record.p.currency,
        priceType: record.p.priceType,
        billingPeriod: record.p.billingPeriod,
        features: JSON.parse(record.p.features || '[]'),
        marketSegment: record.p.marketSegment,
        geographicRegion: record.p.geographicRegion,
        lastUpdated: new Date(record.p.lastUpdated),
        confidence: record.p.confidence,
        source: record.p.source,
        metadata: JSON.parse(record.p.metadata || '{}')
      }));
    } catch (error) {
      logger.error('Failed to fetch pricing data:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async getMarketPricingData(productCategory: string): Promise<PricingDataPoint[]> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (p:PricingData)
        WHERE p.marketSegment = $productCategory
        RETURN p
        ORDER BY p.lastUpdated DESC
        LIMIT 500
      `, { productCategory });

      return (result.records || []).map((record: any) => ({
        id: record.p.id,
        competitorId: record.p.competitorId,
        competitorName: record.p.competitorName,
        productId: record.p.productId,
        productName: record.p.productName,
        price: record.p.price,
        currency: record.p.currency,
        priceType: record.p.priceType,
        billingPeriod: record.p.billingPeriod,
        features: JSON.parse(record.p.features || '[]'),
        marketSegment: record.p.marketSegment,
        geographicRegion: record.p.geographicRegion,
        lastUpdated: new Date(record.p.lastUpdated),
        confidence: record.p.confidence,
        source: record.p.source,
        metadata: JSON.parse(record.p.metadata || '{}')
      }));
    } catch (error) {
      logger.error('Failed to fetch market pricing data:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async storePricingAnalysis(analysis: PricingAnalysis): Promise<void> {
    try {
      await memgraphBI.executeQuery(`
        CREATE (a:PricingAnalysis {
          id: $id,
          analysisDate: $analysisDate,
          competitorId: $competitorId,
          productCategory: $productCategory,
          strategy: $strategy,
          marketPosition: $marketPosition,
          elasticity: $elasticity,
          recommendations: $recommendations,
          trends: $trends,
          threats: $threats,
          opportunities: $opportunities,
          aiInsights: $aiInsights
        })
        RETURN a
      `, {
        id: analysis.id,
        analysisDate: analysis.analysisDate.toISOString(),
        competitorId: analysis.competitorId,
        productCategory: analysis.productCategory,
        strategy: JSON.stringify(analysis.strategy),
        marketPosition: JSON.stringify(analysis.marketPosition),
        elasticity: JSON.stringify(analysis.elasticity),
        recommendations: JSON.stringify(analysis.recommendations),
        trends: JSON.stringify(analysis.trends),
        threats: JSON.stringify(analysis.threats),
        opportunities: JSON.stringify(analysis.opportunities),
        aiInsights: JSON.stringify(analysis.aiInsights)
      });

      logger.info('Pricing analysis stored successfully', { id: analysis.id });
    } catch (error) {
      logger.error('Failed to store pricing analysis:', { error: error instanceof Error ? error.message : String(error) });
      // Don't throw - allow analysis to continue
    }
  }

  async cleanupOldData(daysToKeep: number = 180): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await memgraphBI.executeQuery(`
        MATCH (p:PricingData)
        WHERE p.lastUpdated < $cutoffDate
        DELETE p
        RETURN count(p) as deletedCount
      `, { cutoffDate: cutoffDate.toISOString() });

      const deletedCount = (result as any).records?.[0]?.deletedCount || 0;
      logger.info('Cleaned up old pricing data', { deletedCount, daysToKeep });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old pricing data:', { error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }
}