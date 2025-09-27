// Main Product Intelligence Engine - Orchestration Layer
import { logger } from '@/lib/logger';
import { semanticSearchService } from '../../services/semantic-search';
import { dataAccessLayer } from './data-access';
import { similarityAnalyzer } from './similarity-analyzer';
import { competitiveAnalyzer } from './competitive-analyzer';
import { featureAnalyzer } from './feature-analyzer';
import { pricingAnalyzer } from './pricing-analyzer';
import { strategicAnalyzer } from './strategic-analyzer';
import { clusteringAnalyzer } from './clustering-analyzer';
import { generateAnalysisId, delay } from './utils';
import type {
  ProductSimilarityAnalysis,
  ProductIntelligenceReport,
  ProductClusterAnalysis,
  SimilarityAnalysisType,
  ClusteringMethod
} from './types';

export class ProductIntelligenceEngine {
  private static instance: ProductIntelligenceEngine | null = null;

  public static getInstance(): ProductIntelligenceEngine {
    if (!ProductIntelligenceEngine.instance) {
      ProductIntelligenceEngine.instance = new ProductIntelligenceEngine();
    }
    return ProductIntelligenceEngine.instance;
  }

  /**
   * Analyze product similarity using AI and semantic analysis
   */
  async analyzeProductSimilarity(
    sourceProductId: string,
    targetProductId: string,
    analysisType: SimilarityAnalysisType = 'feature_based'
  ): Promise<ProductSimilarityAnalysis> {
    try {
      logger.debug('Analyzing product similarity', {
        sourceProductId,
        targetProductId,
        analysisType
      });

      // Get product data
      const sourceProduct = await dataAccessLayer.getProductData(sourceProductId);
      const targetProduct = await dataAccessLayer.getProductData(targetProductId);

      if (!sourceProduct || !targetProduct) {
        throw new Error('Product data not found');
      }

      // Perform different types of similarity analysis
      const featureAnalysis = await similarityAnalyzer.analyzeFeatureSimilarity(sourceProduct, targetProduct);
      const pricingAnalysis = await similarityAnalyzer.analyzePricingSimilarity(sourceProduct, targetProduct);
      const marketAnalysis = await similarityAnalyzer.analyzeMarketSimilarity(sourceProduct, targetProduct);
      const semanticAnalysis = await similarityAnalyzer.analyzeSemanticSimilarity(sourceProduct, targetProduct);

      // Calculate overall similarity score
      const similarityScore = similarityAnalyzer.calculateOverallSimilarity(
        featureAnalysis.score,
        pricingAnalysis.score,
        marketAnalysis.score,
        semanticAnalysis.score,
        analysisType
      );

      // Determine competitive relationship
      const competitiveRelationship = similarityAnalyzer.determineCompetitiveRelationship(
        similarityScore,
        featureAnalysis,
        pricingAnalysis,
        marketAnalysis
      );

      // Generate AI-powered strategic insights
      const aiInsights = await strategicAnalyzer.generateProductInsights(
        sourceProduct,
        targetProduct,
        {
          features: featureAnalysis,
          pricing: pricingAnalysis,
          market: marketAnalysis,
          semantic: semanticAnalysis
        }
      );

      // Generate strategic implications
      const strategicImplications = await strategicAnalyzer.generateStrategicImplications(
        sourceProduct,
        targetProduct,
        competitiveRelationship,
        aiInsights
      );

      const analysisId = generateAnalysisId('similarity');

      const analysis: ProductSimilarityAnalysis = {
        id: analysisId,
        sourceProductId,
        targetProductId,
        similarityScore,
        similarityType: analysisType,
        dimensions: {
          features: featureAnalysis,
          pricing: pricingAnalysis,
          market: marketAnalysis,
          semantic: semanticAnalysis
        },
        competitiveRelationship,
        strategicImplications,
        confidence: similarityAnalyzer.calculateAnalysisConfidence([
          featureAnalysis.score,
          pricingAnalysis.score,
          marketAnalysis.score,
          semanticAnalysis.score
        ]),
        analysisDate: new Date(),
        aiInsights
      };

      // Store analysis results
      await dataAccessLayer.storeSimilarityAnalysis(analysis);

      logger.info('Product similarity analysis completed', {
        analysisId,
        similarityScore,
        competitiveRelationship,
        confidence: analysis.confidence
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze product similarity:', {
        sourceProductId,
        targetProductId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive product intelligence report
   */
  async generateProductIntelligenceReport(productId: string): Promise<ProductIntelligenceReport> {
    try {
      logger.debug('Generating product intelligence report', { productId });

      const product = await dataAccessLayer.getProductData(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Find similar products for competitive analysis
      const similarProducts = await semanticSearchService.findCompetingProducts(productId, 20, 0.3);

      // Analyze competitive landscape
      const competitiveLandscape = await competitiveAnalyzer.analyzeCompetitiveLandscape(product, similarProducts);

      // Analyze market position
      const marketPosition = await competitiveAnalyzer.analyzeMarketPosition(product, similarProducts);

      // Analyze features and gaps
      const featureAnalysis = await featureAnalyzer.analyzeProductFeatures(product, similarProducts);

      // Analyze pricing position
      const pricingAnalysis = await pricingAnalyzer.analyzeProductPricing(product, similarProducts);

      // Identify innovation opportunities
      const innovationOpportunities = await featureAnalyzer.identifyInnovationOpportunities(
        product,
        similarProducts,
        featureAnalysis
      );

      // Assess threats
      const threatAssessment = await competitiveAnalyzer.assessProductThreats(product, similarProducts);

      // Generate strategic recommendations using AI
      const strategicRecommendations = await strategicAnalyzer.generateStrategicRecommendations(
        product,
        competitiveLandscape,
        featureAnalysis,
        pricingAnalysis,
        innovationOpportunities,
        threatAssessment
      );

      const report: ProductIntelligenceReport = {
        productId,
        productName: product.name,
        competitorId: product.competitorId,
        analysisDate: new Date(),
        marketPosition,
        competitiveLandscape,
        featureAnalysis,
        pricingAnalysis,
        innovationOpportunities,
        threatAssessment,
        strategicRecommendations,
        confidence: competitiveAnalyzer.calculateReportConfidence([
          competitiveLandscape,
          featureAnalysis,
          pricingAnalysis,
          innovationOpportunities
        ])
      };

      // Store report
      await dataAccessLayer.storeIntelligenceReport(report);

      logger.info('Product intelligence report generated', {
        productId,
        confidence: report.confidence,
        competitorCount: competitiveLandscape.directCompetitors.length
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate product intelligence report:', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Perform product clustering analysis
   */
  async performProductClustering(
    productIds: string[],
    clusteringMethod: ClusteringMethod = 'feature_based'
  ): Promise<ProductClusterAnalysis[]> {
    try {
      logger.debug('Performing product clustering', {
        productCount: productIds.length,
        method: clusteringMethod
      });

      // Get product data
      const products = await dataAccessLayer.getMultipleProducts(productIds);

      if (products.length === 0) {
        throw new Error('No valid products found for clustering');
      }

      // Perform clustering based on method
      const clusters = await clusteringAnalyzer.performProductClustering(products, clusteringMethod);

      // Analyze each cluster
      const clusterAnalyses = await Promise.all(
        clusters.map(cluster => clusteringAnalyzer.analyzeProductCluster(cluster))
      );

      logger.info('Product clustering completed', {
        clusterCount: clusterAnalyses.length,
        totalProducts: products.length
      });

      return clusterAnalyses;
    } catch (error) {
      logger.error('Failed to perform product clustering:', {
        productCount: productIds.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Batch analyze product similarities
   */
  async batchAnalyzeSimilarities(
    productPairs: Array<{ sourceId: string; targetId: string }>,
    analysisType: SimilarityAnalysisType = 'feature_based'
  ): Promise<ProductSimilarityAnalysis[]> {
    const analyses: ProductSimilarityAnalysis[] = [];

    logger.info('Starting batch similarity analysis', {
      pairCount: productPairs.length,
      analysisType
    });

    for (const pair of productPairs) {
      try {
        const analysis = await this.analyzeProductSimilarity(
          pair.sourceId,
          pair.targetId,
          analysisType
        );
        analyses.push(analysis);

        // Add delay to prevent API rate limiting
        await delay(500);
      } catch (error) {
        logger.error('Batch similarity analysis failed for pair:', {
          sourceId: pair.sourceId,
          targetId: pair.targetId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        continue;
      }
    }

    logger.info('Batch similarity analysis completed', {
      successCount: analyses.length,
      totalRequested: productPairs.length
    });

    return analyses;
  }

  /**
   * Generate SWOT analysis for a product
   */
  async generateSWOTAnalysis(productId: string): Promise<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }> {
    try {
      const product = await dataAccessLayer.getProductData(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const similarProducts = await semanticSearchService.findCompetingProducts(productId, 20, 0.3);
      const featureAnalysis = await featureAnalyzer.analyzeProductFeatures(product, similarProducts);
      const pricingAnalysis = await pricingAnalyzer.analyzeProductPricing(product, similarProducts);

      return await strategicAnalyzer.generateSWOTAnalysis(
        product,
        similarProducts,
        featureAnalysis,
        pricingAnalysis
      );
    } catch (error) {
      logger.error('Failed to generate SWOT analysis:', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate competitive positioning recommendations
   */
  async generateCompetitivePositioning(productId: string): Promise<{
    currentPositioning: string;
    recommendedPositioning: string;
    positioningStrategy: string[];
    differentiationOpportunities: string[];
  }> {
    try {
      const product = await dataAccessLayer.getProductData(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const similarProducts = await semanticSearchService.findCompetingProducts(productId, 20, 0.3);
      const competitiveLandscape = await competitiveAnalyzer.analyzeCompetitiveLandscape(product, similarProducts);
      const marketPosition = await competitiveAnalyzer.analyzeMarketPosition(product, similarProducts);

      return strategicAnalyzer.generateCompetitivePositioning(
        product,
        competitiveLandscape,
        marketPosition
      );
    } catch (error) {
      logger.error('Failed to generate competitive positioning:', {
        productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get recent analysis history
   */
  async getAnalysisHistory(limit: number = 10): Promise<{
    similarities: ProductSimilarityAnalysis[];
    reports: ProductIntelligenceReport[];
  }> {
    try {
      const [similarities, reports] = await Promise.all([
        dataAccessLayer.getRecentSimilarityAnalyses(limit),
        dataAccessLayer.getRecentIntelligenceReports(limit)
      ]);

      return { similarities, reports };
    } catch (error) {
      logger.error('Failed to get analysis history:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Health check for the product intelligence engine
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      productCount: number;
      recentAnalyses: number;
      semanticServiceStatus: string;
      lastError?: string;
    };
  }> {
    try {
      // Count products
      const productCount = await dataAccessLayer.getProductCount();

      // Count recent analyses
      const recentAnalyses = await dataAccessLayer.getRecentAnalysisCount();

      // Check semantic service health
      const semanticHealth = await semanticSearchService.healthCheck();

      return {
        status: 'healthy',
        details: {
          productCount,
          recentAnalyses,
          semanticServiceStatus: semanticHealth.status
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          productCount: 0,
          recentAnalyses: 0,
          semanticServiceStatus: 'unhealthy',
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // Utility methods are now imported from utils module
}

export const productIntelligenceEngine = ProductIntelligenceEngine.getInstance();