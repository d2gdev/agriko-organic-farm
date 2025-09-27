// Competitive Landscape Analysis Module
import { logger } from '@/lib/logger';
import type { CompetitorProduct } from '../../types/competitor';
import type {
  ProductIntelligenceReport,
  SimilarProduct
} from './types';

export class CompetitiveAnalyzer {
  /**
   * Analyze competitive landscape for a product
   */
  async analyzeCompetitiveLandscape(
    product: CompetitorProduct,
    similarProducts: SimilarProduct[]
  ): Promise<ProductIntelligenceReport['competitiveLandscape']> {
    try {
      // Categorize similar products
      const directCompetitors = similarProducts
        .filter(p => p.similarity > 0.7)
        .map(p => ({
          productId: p.id,
          productName: p.name,
          competitorName: p.competitorId, // Would be resolved to actual name
          similarityScore: p.similarity,
          keyDifferences: ['Feature comparison needed'] // Would be calculated
        }));

      const substitutes = similarProducts
        .filter(p => p.similarity > 0.4 && p.similarity <= 0.7)
        .map(p => ({
          productId: p.id,
          productName: p.name,
          substitutionRisk: 'medium' as const,
          substitutionFactors: ['Alternative approach', 'Different technology']
        }));

      // TODO: Implement proper complement analysis using AI and market data
      const complements: Array<{
        productId: string;
        productName: string;
        synergies: string[];
        partnershipPotential: 'high' | 'medium' | 'low';
      }> = []; // Would be identified through different analysis

      return {
        directCompetitors,
        substitutes,
        complements
      };
    } catch (error) {
      logger.error('Failed to analyze competitive landscape:', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        directCompetitors: [],
        substitutes: [],
        complements: []
      };
    }
  }

  /**
   * Analyze market position for a product
   */
  async analyzeMarketPosition(
    product: CompetitorProduct,
    similarProducts: SimilarProduct[]
  ): Promise<ProductIntelligenceReport['marketPosition']> {
    try {
      // Simplified market position analysis
      const competitorCount = similarProducts.length;
      let positioning: 'leader' | 'challenger' | 'follower' | 'niche';

      if (competitorCount < 3) positioning = 'leader';
      else if (competitorCount < 8) positioning = 'challenger';
      else if (competitorCount < 15) positioning = 'follower';
      else positioning = 'niche';

      return {
        category: product.category,
        subcategory: product.category, // Would be more specific in production
        positioning,
        marketShare: {
          estimated: positioning === 'leader' ? 0.3 : positioning === 'challenger' ? 0.15 : 0.05,
          confidence: 0.6,
          basis: ['Competitive analysis', 'Product similarity assessment']
        }
      };
    } catch (error) {
      logger.error('Failed to analyze market position:', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        category: product.category,
        subcategory: product.category,
        positioning: 'niche',
        marketShare: {
          estimated: 0.05,
          confidence: 0.3,
          basis: ['Insufficient data']
        }
      };
    }
  }

  /**
   * Assess product threats in competitive landscape
   */
  async assessProductThreats(
    product: CompetitorProduct,
    similarProducts: SimilarProduct[]
  ): Promise<ProductIntelligenceReport['threatAssessment']> {
    try {
      const threats: ProductIntelligenceReport['threatAssessment']['threats'] = [];

      // High similarity products pose direct competition threat
      const directThreats = similarProducts.filter(p => p.similarity > 0.8);
      if (directThreats.length > 0) {
        threats.push({
          type: 'feature_parity',
          severity: directThreats.length > 3 ? 'high' : 'medium',
          timeline: 'immediate',
          mitigation: ['Accelerate differentiation', 'Strengthen unique value proposition']
        });
      }

      // Price competition threat
      threats.push({
        type: 'price_competition',
        severity: 'medium',
        timeline: 'short_term',
        mitigation: ['Value-based positioning', 'Cost optimization', 'Premium feature development']
      });

      // Market shift threat based on competitor count
      if (similarProducts.length > 10) {
        threats.push({
          type: 'market_shift',
          severity: 'medium',
          timeline: 'medium_term',
          mitigation: ['Market trend monitoring', 'Agile product development', 'Customer feedback loops']
        });
      }

      const overallRisk = threats.some(t => t.severity === 'critical') ? 'critical' :
        threats.some(t => t.severity === 'high') ? 'high' :
        threats.some(t => t.severity === 'medium') ? 'medium' : 'low';

      return {
        overallRisk,
        threats
      };
    } catch (error) {
      logger.error('Failed to assess product threats:', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        overallRisk: 'medium',
        threats: [{
          type: 'market_shift',
          severity: 'medium',
          timeline: 'medium_term',
          mitigation: ['Continue market monitoring']
        }]
      };
    }
  }

  /**
   * Calculate report confidence based on analysis components
   */
  calculateReportConfidence(analysisComponents: unknown[]): number {
    // Simplified confidence calculation based on completeness
    const componentCount = analysisComponents.filter(component =>
      component && typeof component === 'object'
    ).length;

    // Base confidence on component completeness and quality
    const baseConfidence = Math.min(0.9, componentCount * 0.2);
    return Math.max(0.3, baseConfidence);
  }

  /**
   * Identify competitive advantages between products
   */
  identifyCompetitiveAdvantages(
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

    // Check for category advantages
    if (sourceProduct.category === targetProduct.category) {
      advantages.push('Same market category');
    }

    return advantages.length > 0 ? advantages : ['Competitive parity'];
  }
}

export const competitiveAnalyzer = new CompetitiveAnalyzer();