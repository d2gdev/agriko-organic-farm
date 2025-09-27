// Product Feature Analysis Module
import { logger } from '@/lib/logger';
import type { CompetitorProduct } from '../../types/competitor';
import type {
  ProductIntelligenceReport,
  SimilarProduct
} from './types';
import { dataAccessLayer } from './data-access';

export class FeatureAnalyzer {
  /**
   * Analyze product features against competitors
   */
  async analyzeProductFeatures(
    product: CompetitorProduct,
    similarProducts: SimilarProduct[]
  ): Promise<ProductIntelligenceReport['featureAnalysis']> {
    try {
      // Get feature data for similar products
      const competitorFeatures = new Set<string>();

      for (const similar of similarProducts) {
        const competitorProduct = await dataAccessLayer.getProductData(similar.id);
        if (competitorProduct) {
          competitorProduct.features.forEach(f => competitorFeatures.add(f));
        }
      }

      const productFeatures = new Set(product.features);
      const _allFeatures = new Set([...productFeatures, ...competitorFeatures]);

      // Identify core features (features present in both product and competitors)
      const coreFeatures = product.features.filter(f => competitorFeatures.has(f));

      // Identify unique features (features only in this product)
      const uniqueFeatures = product.features.filter(f => !competitorFeatures.has(f));

      // Identify missing features (features in competitors but not in this product)
      const missingFeatures = [...competitorFeatures].filter(f => !productFeatures.has(f));

      // Generate feature gaps analysis
      const featureGaps = await this.analyzeFeatureGaps(
        missingFeatures,
        similarProducts,
        competitorFeatures.size
      );

      return {
        coreFeatures,
        uniqueFeatures,
        missingFeatures,
        featureGaps
      };
    } catch (error) {
      logger.error('Failed to analyze product features:', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        coreFeatures: product.features,
        uniqueFeatures: [],
        missingFeatures: [],
        featureGaps: []
      };
    }
  }

  /**
   * Identify innovation opportunities based on feature analysis
   */
  async identifyInnovationOpportunities(
    product: CompetitorProduct,
    similarProducts: SimilarProduct[],
    featureAnalysis: ProductIntelligenceReport['featureAnalysis']
  ): Promise<ProductIntelligenceReport['innovationOpportunities']> {
    try {
      const opportunities: ProductIntelligenceReport['innovationOpportunities'] = [];

      // Feature enhancement opportunities from gaps
      featureAnalysis.featureGaps.forEach(gap => {
        if (gap.importance === 'high' || gap.importance === 'critical') {
          opportunities.push({
            category: 'feature_enhancement',
            opportunity: `Implement ${gap.feature} to close competitive gap`,
            marketDemand: gap.importance === 'critical' ? 'high' : 'medium',
            competitiveAdvantage: gap.competitorCoverage > 0.7 ? 'high' : 'medium',
            implementationComplexity: gap.implementationEffort,
            timeToMarket: this.estimateTimeToMarket(gap.implementationEffort),
            estimatedImpact: 'Improved competitive positioning'
          });
        }
      });

      // Unique feature enhancement opportunities
      featureAnalysis.uniqueFeatures.forEach(feature => {
        opportunities.push({
          category: 'feature_enhancement',
          opportunity: `Enhance unique feature: ${feature}`,
          marketDemand: 'medium',
          competitiveAdvantage: 'high',
          implementationComplexity: 'low',
          timeToMarket: '1-3 months',
          estimatedImpact: 'Strengthen differentiation'
        });
      });

      // New feature opportunities based on market analysis
      if (similarProducts.length > 5) {
        opportunities.push({
          category: 'new_feature',
          opportunity: 'Develop next-generation features to lead market',
          marketDemand: 'high',
          competitiveAdvantage: 'high',
          implementationComplexity: 'high',
          timeToMarket: '6-12 months',
          estimatedImpact: 'Market leadership positioning'
        });
      }

      // Integration opportunities
      if (featureAnalysis.coreFeatures.length > 3) {
        opportunities.push({
          category: 'integration',
          opportunity: 'Integrate core features for enhanced workflow',
          marketDemand: 'medium',
          competitiveAdvantage: 'medium',
          implementationComplexity: 'medium',
          timeToMarket: '3-6 months',
          estimatedImpact: 'Improved user experience'
        });
      }

      return opportunities.slice(0, 10); // Limit to top 10 opportunities
    } catch (error) {
      logger.error('Failed to identify innovation opportunities:', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return [{
        category: 'feature_enhancement',
        opportunity: 'Continue feature development based on user feedback',
        marketDemand: 'medium',
        competitiveAdvantage: 'medium',
        implementationComplexity: 'medium',
        timeToMarket: '3-6 months',
        estimatedImpact: 'Incremental improvement'
      }];
    }
  }

  /**
   * Analyze feature gaps in detail
   */
  private async analyzeFeatureGaps(
    missingFeatures: string[],
    similarProducts: SimilarProduct[],
    totalCompetitorFeatures: number
  ): Promise<ProductIntelligenceReport['featureAnalysis']['featureGaps']> {
    const featureGaps: ProductIntelligenceReport['featureAnalysis']['featureGaps'] = [];

    for (const feature of missingFeatures) {
      // Calculate how many competitors have this feature
      let competitorCount = 0;
      for (const similar of similarProducts) {
        const competitorProduct = await dataAccessLayer.getProductData(similar.id);
        if (competitorProduct?.features.includes(feature)) {
          competitorCount++;
        }
      }

      const competitorCoverage = similarProducts.length > 0 ? competitorCount / similarProducts.length : 0;

      // Determine importance based on coverage
      let importance: 'low' | 'medium' | 'high' | 'critical';
      if (competitorCoverage > 0.8) importance = 'critical';
      else if (competitorCoverage > 0.6) importance = 'high';
      else if (competitorCoverage > 0.3) importance = 'medium';
      else importance = 'low';

      // Estimate implementation effort (simplified)
      const implementationEffort = this.estimateImplementationEffort(feature);

      featureGaps.push({
        feature,
        importance,
        competitorCoverage,
        implementationEffort
      });
    }

    // Sort by importance and coverage
    return featureGaps.sort((a, b) => {
      const importanceOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const aScore = importanceOrder[a.importance] + a.competitorCoverage;
      const bScore = importanceOrder[b.importance] + b.competitorCoverage;
      return bScore - aScore;
    });
  }

  /**
   * Estimate implementation effort for a feature
   */
  private estimateImplementationEffort(feature: string): 'low' | 'medium' | 'high' {
    const featureLower = feature.toLowerCase();

    // Simple heuristics for effort estimation
    if (featureLower.includes('integration') || featureLower.includes('api') || featureLower.includes('export')) {
      return 'medium';
    }

    if (featureLower.includes('analytics') || featureLower.includes('reporting') || featureLower.includes('dashboard')) {
      return 'high';
    }

    if (featureLower.includes('ai') || featureLower.includes('machine learning') || featureLower.includes('automation')) {
      return 'high';
    }

    return 'low'; // Default to low effort
  }

  /**
   * Estimate time to market based on implementation effort
   */
  private estimateTimeToMarket(effort: 'low' | 'medium' | 'high'): string {
    switch (effort) {
      case 'low':
        return '1-2 months';
      case 'medium':
        return '3-6 months';
      case 'high':
        return '6-12 months';
      default:
        return '3-6 months';
    }
  }

  /**
   * Calculate feature similarity score between two products
   */
  calculateFeatureSimilarity(
    sourceFeatures: string[],
    targetFeatures: string[]
  ): number {
    const sourceSet = new Set(sourceFeatures);
    const targetSet = new Set(targetFeatures);

    const intersection = new Set([...sourceSet].filter(f => targetSet.has(f)));
    const union = new Set([...sourceSet, ...targetSet]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Identify feature categories and groupings
   */
  categorizeFeatures(features: string[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {
      core: [],
      integration: [],
      analytics: [],
      ui_ux: [],
      security: [],
      performance: [],
      other: []
    };

    features.forEach(feature => {
      const featureLower = feature.toLowerCase();

      if (featureLower.includes('integration') || featureLower.includes('api') || featureLower.includes('sync')) {
        categories.integration?.push(feature);
      } else if (featureLower.includes('analytics') || featureLower.includes('reporting') || featureLower.includes('dashboard')) {
        categories.analytics?.push(feature);
      } else if (featureLower.includes('ui') || featureLower.includes('ux') || featureLower.includes('interface')) {
        categories.ui_ux?.push(feature);
      } else if (featureLower.includes('security') || featureLower.includes('auth') || featureLower.includes('encryption')) {
        categories.security?.push(feature);
      } else if (featureLower.includes('performance') || featureLower.includes('speed') || featureLower.includes('optimization')) {
        categories.performance?.push(feature);
      } else if (featureLower.includes('core') || featureLower.includes('basic') || featureLower.includes('essential')) {
        categories.core?.push(feature);
      } else {
        categories.other?.push(feature);
      }
    });

    return categories;
  }
}

export const featureAnalyzer = new FeatureAnalyzer();