// Data Access Layer for Product Intelligence
import { logger } from '@/lib/logger';
import { memgraphBI } from '../../memgraph/connection';
import type { CompetitorProduct } from '../../types/competitor';
import type {
  ProductSimilarityAnalysis,
  ProductIntelligenceReport
} from './types';

export class DataAccessLayer {
  /**
   * Get product data by ID from the database
   */
  async getProductData(productId: string): Promise<CompetitorProduct | null> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (p:Product {id: $productId})
        RETURN p
      `, { productId });

      if (result.records.length === 0) {
        return null;
      }

      const props = result.records[0]?.get('p')?.properties;
      if (!props) return null;

      return {
        id: props.id,
        competitorId: props.competitorId,
        name: props.name,
        description: props.description,
        category: props.category,
        price: props.price,
        currency: props.currency,
        url: props.url,
        features: JSON.parse(props.features || '[]'),
        imageUrl: props.imageUrl,
        inStock: props.inStock,
        createdAt: new Date(props.createdAt),
        updatedAt: new Date(props.updatedAt)
      };
    } catch (error) {
      logger.error('Failed to get product data:', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get multiple products by IDs
   */
  async getMultipleProducts(productIds: string[]): Promise<CompetitorProduct[]> {
    try {
      const products = await Promise.all(
        productIds.map(id => this.getProductData(id))
      );

      return products.filter(p => p !== null) as CompetitorProduct[];
    } catch (error) {
      logger.error('Failed to get multiple products:', {
        productIds,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Store similarity analysis results
   */
  async storeSimilarityAnalysis(analysis: ProductSimilarityAnalysis): Promise<void> {
    try {
      await memgraphBI.executeQuery(`
        CREATE (a:ProductSimilarityAnalysis {
          id: $id,
          sourceProductId: $sourceProductId,
          targetProductId: $targetProductId,
          similarityScore: $similarityScore,
          similarityType: $similarityType,
          dimensions: $dimensions,
          competitiveRelationship: $competitiveRelationship,
          strategicImplications: $strategicImplications,
          confidence: $confidence,
          analysisDate: $analysisDate,
          aiInsights: $aiInsights,
          createdAt: $createdAt
        })
        RETURN a
      `, {
        id: analysis.id,
        sourceProductId: analysis.sourceProductId,
        targetProductId: analysis.targetProductId,
        similarityScore: analysis.similarityScore,
        similarityType: analysis.similarityType,
        dimensions: JSON.stringify(analysis.dimensions),
        competitiveRelationship: analysis.competitiveRelationship,
        strategicImplications: JSON.stringify(analysis.strategicImplications),
        confidence: analysis.confidence,
        analysisDate: analysis.analysisDate.toISOString(),
        aiInsights: JSON.stringify(analysis.aiInsights),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to store similarity analysis:', {
        analysisId: analysis.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Store intelligence report
   */
  async storeIntelligenceReport(report: ProductIntelligenceReport): Promise<void> {
    try {
      await memgraphBI.executeQuery(`
        CREATE (r:ProductIntelligenceReport {
          productId: $productId,
          productName: $productName,
          competitorId: $competitorId,
          analysisDate: $analysisDate,
          marketPosition: $marketPosition,
          competitiveLandscape: $competitiveLandscape,
          featureAnalysis: $featureAnalysis,
          pricingAnalysis: $pricingAnalysis,
          innovationOpportunities: $innovationOpportunities,
          threatAssessment: $threatAssessment,
          strategicRecommendations: $strategicRecommendations,
          confidence: $confidence,
          createdAt: $createdAt
        })
        RETURN r
      `, {
        productId: report.productId,
        productName: report.productName,
        competitorId: report.competitorId,
        analysisDate: report.analysisDate.toISOString(),
        marketPosition: JSON.stringify(report.marketPosition),
        competitiveLandscape: JSON.stringify(report.competitiveLandscape),
        featureAnalysis: JSON.stringify(report.featureAnalysis),
        pricingAnalysis: JSON.stringify(report.pricingAnalysis),
        innovationOpportunities: JSON.stringify(report.innovationOpportunities),
        threatAssessment: JSON.stringify(report.threatAssessment),
        strategicRecommendations: JSON.stringify(report.strategicRecommendations),
        confidence: report.confidence,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to store intelligence report:', {
        productId: report.productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get recent similarity analyses
   */
  async getRecentSimilarityAnalyses(limit: number = 10): Promise<ProductSimilarityAnalysis[]> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (a:ProductSimilarityAnalysis)
        RETURN a
        ORDER BY a.createdAt DESC
        LIMIT $limit
      `, { limit });

      return result.records.map(record => {
        const props = record.get('a').properties;
        return {
          id: props.id,
          sourceProductId: props.sourceProductId,
          targetProductId: props.targetProductId,
          similarityScore: props.similarityScore,
          similarityType: props.similarityType,
          dimensions: JSON.parse(props.dimensions),
          competitiveRelationship: props.competitiveRelationship,
          strategicImplications: JSON.parse(props.strategicImplications),
          confidence: props.confidence,
          analysisDate: new Date(props.analysisDate),
          aiInsights: JSON.parse(props.aiInsights)
        };
      });
    } catch (error) {
      logger.error('Failed to get recent similarity analyses:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get recent intelligence reports
   */
  async getRecentIntelligenceReports(limit: number = 10): Promise<ProductIntelligenceReport[]> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (r:ProductIntelligenceReport)
        RETURN r
        ORDER BY r.createdAt DESC
        LIMIT $limit
      `, { limit });

      return result.records.map(record => {
        const props = record.get('r').properties;
        return {
          productId: props.productId,
          productName: props.productName,
          competitorId: props.competitorId,
          analysisDate: new Date(props.analysisDate),
          marketPosition: JSON.parse(props.marketPosition),
          competitiveLandscape: JSON.parse(props.competitiveLandscape),
          featureAnalysis: JSON.parse(props.featureAnalysis),
          pricingAnalysis: JSON.parse(props.pricingAnalysis),
          innovationOpportunities: JSON.parse(props.innovationOpportunities),
          threatAssessment: JSON.parse(props.threatAssessment),
          strategicRecommendations: JSON.parse(props.strategicRecommendations),
          confidence: props.confidence
        };
      });
    } catch (error) {
      logger.error('Failed to get recent intelligence reports:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Count products in database
   */
  async getProductCount(): Promise<number> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (p:Product)
        RETURN count(p) as count
      `);
      return result.records[0]?.get('count')?.toNumber?.() || 0;
    } catch (error) {
      logger.error('Failed to get product count:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Count recent analyses (last 24 hours)
   */
  async getRecentAnalysisCount(): Promise<number> {
    try {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await memgraphBI.executeQuery(`
        MATCH (a:ProductSimilarityAnalysis)
        WHERE datetime(a.analysisDate) > datetime($dayAgo)
        RETURN count(a) as count
      `, { dayAgo: dayAgo.toISOString() });
      return result.records[0]?.get('count')?.toNumber?.() || 0;
    } catch (error) {
      logger.error('Failed to get recent analysis count:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, limit: number = 50): Promise<CompetitorProduct[]> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (p:Product {category: $category})
        RETURN p
        ORDER BY p.updatedAt DESC
        LIMIT $limit
      `, { category, limit });

      return result.records.map(record => {
        const props = record.get('p').properties;
        return {
          id: props.id,
          competitorId: props.competitorId,
          name: props.name,
          description: props.description,
          category: props.category,
          price: props.price,
          currency: props.currency,
          url: props.url,
          features: JSON.parse(props.features || '[]'),
          imageUrl: props.imageUrl,
          inStock: props.inStock,
          createdAt: new Date(props.createdAt),
          updatedAt: new Date(props.updatedAt)
        };
      });
    } catch (error) {
      logger.error('Failed to get products by category:', {
        category,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get products within price range
   */
  async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
    limit: number = 50
  ): Promise<CompetitorProduct[]> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (p:Product)
        WHERE p.price >= $minPrice AND p.price <= $maxPrice
        RETURN p
        ORDER BY p.price ASC
        LIMIT $limit
      `, { minPrice, maxPrice, limit });

      return result.records.map(record => {
        const props = record.get('p').properties;
        return {
          id: props.id,
          competitorId: props.competitorId,
          name: props.name,
          description: props.description,
          category: props.category,
          price: props.price,
          currency: props.currency,
          url: props.url,
          features: JSON.parse(props.features || '[]'),
          imageUrl: props.imageUrl,
          inStock: props.inStock,
          createdAt: new Date(props.createdAt),
          updatedAt: new Date(props.updatedAt)
        };
      });
    } catch (error) {
      logger.error('Failed to get products by price range:', {
        minPrice,
        maxPrice,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }
}

export const dataAccessLayer = new DataAccessLayer();