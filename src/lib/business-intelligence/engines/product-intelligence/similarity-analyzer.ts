// Product Similarity Analysis Module
import { logger } from '@/lib/logger';
import { semanticSearchService } from '../../services/semantic-search';
import type { CompetitorProduct } from '../../types/competitor';
import type {
  ProductSimilarityAnalysis,
  SimilarityAnalysisType,
  CompetitiveRelationship
} from './types';
import { calculateJaccardSimilarity, normalizeConfidence } from './utils';

export class SimilarityAnalyzer {
  /**
   * Analyze feature similarity between two products
   */
  async analyzeFeatureSimilarity(
    sourceProduct: CompetitorProduct,
    targetProduct: CompetitorProduct
  ): Promise<ProductSimilarityAnalysis['dimensions']['features']> {
    const sourceFeatures = new Set(sourceProduct.features);
    const targetFeatures = new Set(targetProduct.features);

    const jaccardSimilarity = calculateJaccardSimilarity(sourceFeatures, targetFeatures);
    const intersection = new Set([...sourceFeatures].filter(f => targetFeatures.has(f)));

    return {
      score: jaccardSimilarity,
      matchingFeatures: Array.from(intersection),
      uniqueFeatures: {
        source: [...sourceFeatures].filter(f => !targetFeatures.has(f)),
        target: [...targetFeatures].filter(f => !sourceFeatures.has(f))
      }
    };
  }

  /**
   * Analyze pricing similarity between two products
   */
  async analyzePricingSimilarity(
    sourceProduct: CompetitorProduct,
    targetProduct: CompetitorProduct
  ): Promise<ProductSimilarityAnalysis['dimensions']['pricing']> {
    const priceDifference = Math.abs(sourceProduct.price - targetProduct.price);
    const avgPrice = (sourceProduct.price + targetProduct.price) / 2;
    const relativeDifference = avgPrice === 0 ? 0 : priceDifference / avgPrice;

    // Similarity decreases as relative price difference increases
    const score = Math.max(0, 1 - relativeDifference);

    let priceComparison: 'higher' | 'lower' | 'similar';
    if (relativeDifference < 0.1) {
      priceComparison = 'similar';
    } else if (sourceProduct.price > targetProduct.price) {
      priceComparison = 'higher';
    } else {
      priceComparison = 'lower';
    }

    return {
      score,
      priceComparison,
      priceDifference,
      valueProposition: this.generateValueProposition(sourceProduct, targetProduct, priceComparison)
    };
  }

  /**
   * Analyze market similarity between two products
   */
  async analyzeMarketSimilarity(
    sourceProduct: CompetitorProduct,
    targetProduct: CompetitorProduct
  ): Promise<ProductSimilarityAnalysis['dimensions']['market']> {
    // Simplified market analysis - in production, this would use more sophisticated methods
    const categoryMatch = sourceProduct.category === targetProduct.category ? 1 : 0;

    return {
      score: categoryMatch,
      targetAudienceOverlap: categoryMatch, // Simplified
      marketPositioning: categoryMatch === 1 ? 'Same category' : 'Different categories',
      competitiveAdvantage: this.identifyCompetitiveAdvantages(sourceProduct, targetProduct)
    };
  }

  /**
   * Analyze semantic similarity between two products
   */
  async analyzeSemanticSimilarity(
    sourceProduct: CompetitorProduct,
    targetProduct: CompetitorProduct
  ): Promise<ProductSimilarityAnalysis['dimensions']['semantic']> {
    try {
      // Find semantically similar products
      const similarProducts = await semanticSearchService.findCompetingProducts(
        sourceProduct.id,
        10,
        0.1
      );

      const targetInSimilar = similarProducts.find(p => p.id === targetProduct.id);
      const semanticScore = targetInSimilar ? targetInSimilar.similarity : 0;

      // Calculate description overlap
      const sourceWords = new Set(sourceProduct.description.toLowerCase().split(/\s+/));
      const targetWords = new Set(targetProduct.description.toLowerCase().split(/\s+/));
      const wordIntersection = new Set([...sourceWords].filter(w => targetWords.has(w)));
      const wordUnion = new Set([...sourceWords, ...targetWords]);
      const descriptionOverlap = wordUnion.size === 0 ? 0 : wordIntersection.size / wordUnion.size;

      return {
        score: semanticScore,
        conceptualSimilarity: semanticScore,
        descriptionOverlap,
        keywordMatches: Array.from(wordIntersection).slice(0, 10)
      };
    } catch (error) {
      logger.error('Failed to analyze semantic similarity:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        score: 0,
        conceptualSimilarity: 0,
        descriptionOverlap: 0,
        keywordMatches: []
      };
    }
  }

  /**
   * Calculate overall similarity score with weighted analysis
   */
  calculateOverallSimilarity(
    featureScore: number,
    pricingScore: number,
    marketScore: number,
    semanticScore: number,
    analysisType: SimilarityAnalysisType
  ): number {
    // Weighted average based on analysis type
    const weights = {
      feature_based: { features: 0.7, pricing: 0.1, market: 0.1, semantic: 0.1 },
      semantic: { features: 0.1, pricing: 0.1, market: 0.1, semantic: 0.7 },
      usage_based: { features: 0.3, pricing: 0.3, market: 0.3, semantic: 0.1 },
      market_based: { features: 0.1, pricing: 0.3, market: 0.5, semantic: 0.1 },
      comprehensive: { features: 0.3, pricing: 0.2, market: 0.3, semantic: 0.2 }
    };

    const weight = weights[analysisType];
    return (
      featureScore * weight.features +
      pricingScore * weight.pricing +
      marketScore * weight.market +
      semanticScore * weight.semantic
    );
  }

  /**
   * Determine competitive relationship based on similarity analysis
   */
  determineCompetitiveRelationship(
    similarityScore: number,
    featureAnalysis: ProductSimilarityAnalysis['dimensions']['features'],
    pricingAnalysis: ProductSimilarityAnalysis['dimensions']['pricing'],
    marketAnalysis: ProductSimilarityAnalysis['dimensions']['market']
  ): CompetitiveRelationship {
    if (similarityScore > 0.8 && marketAnalysis.score > 0.8) {
      return 'direct_competitor';
    }

    if (similarityScore > 0.6 && marketAnalysis.score > 0.5) {
      return 'indirect_competitor';
    }

    if (featureAnalysis.score < 0.3 && marketAnalysis.score > 0.5) {
      return 'substitute';
    }

    if (featureAnalysis.uniqueFeatures.source.length > 0 && featureAnalysis.uniqueFeatures.target.length > 0) {
      return 'complement';
    }

    return 'unrelated';
  }

  /**
   * Calculate analysis confidence based on score consistency
   */
  calculateAnalysisConfidence(scores: number[]): number {
    return normalizeConfidence(scores);
  }

  // Private utility methods
  private generateValueProposition(
    sourceProduct: CompetitorProduct,
    targetProduct: CompetitorProduct,
    priceComparison: 'higher' | 'lower' | 'similar'
  ): string {
    switch (priceComparison) {
      case 'higher':
        return 'Premium positioning with potentially enhanced features';
      case 'lower':
        return 'Value positioning with competitive feature set';
      default:
        return 'Competitive positioning with similar value proposition';
    }
  }

  private identifyCompetitiveAdvantages(
    sourceProduct: CompetitorProduct,
    targetProduct: CompetitorProduct
  ): string[] {
    const advantages = [];

    if (sourceProduct.features.length > targetProduct.features.length) {
      advantages.push('More comprehensive feature set');
    }

    if (sourceProduct.price < targetProduct.price) {
      advantages.push('Better price point');
    }

    if (sourceProduct.features.some(f => !targetProduct.features.includes(f))) {
      advantages.push('Unique features');
    }

    return advantages.length > 0 ? advantages : ['Competitive parity'];
  }
}

export const similarityAnalyzer = new SimilarityAnalyzer();