// Strategic Analysis Module
import { logger } from '@/lib/logger';
import { deepSeekAIService } from '../../services/deepseek-ai';
import type { CompetitorProduct } from '../../types/competitor';
import type {
  ProductSimilarityAnalysis,
  ProductIntelligenceReport,
  SimilarProduct,
  CompetitiveRelationship
} from './types';

export class StrategicAnalyzer {
  /**
   * Generate AI-powered strategic insights for product comparison
   */
  async generateProductInsights(
    sourceProduct: CompetitorProduct,
    targetProduct: CompetitorProduct,
    dimensions: ProductSimilarityAnalysis['dimensions']
  ): Promise<ProductSimilarityAnalysis['aiInsights']> {
    try {
      const aiAnalysis = await deepSeekAIService.analyzeData({
        type: 'competitor_analysis',
        data: {
          competitorName: `${sourceProduct.name} vs ${targetProduct.name}`,
          industry: sourceProduct.category,
          searchResults: JSON.stringify({
            sourceProduct: {
              name: sourceProduct.name,
              features: sourceProduct.features,
              price: sourceProduct.price,
              description: sourceProduct.description
            },
            targetProduct: {
              name: targetProduct.name,
              features: targetProduct.features,
              price: targetProduct.price,
              description: targetProduct.description
            },
            similarity: dimensions
          })
        },
        context: {
          analysisType: 'product_similarity',
          focus: 'competitive_intelligence'
        }
      });

      return {
        summary: aiAnalysis.analysis.summary,
        keyDifferentiators: aiAnalysis.analysis.keyInsights
          .filter(insight => insight.category === 'opportunity')
          .map(insight => insight.insight)
          .slice(0, 5),
        marketGaps: aiAnalysis.analysis.keyInsights
          .filter(insight => insight.category === 'trend')
          .map(insight => insight.insight)
          .slice(0, 3),
        innovationOpportunities: aiAnalysis.analysis.recommendations
          .map(rec => rec.action)
          .slice(0, 5)
      };
    } catch (error) {
      logger.error('Failed to generate AI product insights:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        summary: 'Product similarity analysis completed',
        keyDifferentiators: [],
        marketGaps: [],
        innovationOpportunities: []
      };
    }
  }

  /**
   * Generate strategic implications based on competitive relationship
   */
  async generateStrategicImplications(
    sourceProduct: CompetitorProduct,
    targetProduct: CompetitorProduct,
    relationship: CompetitiveRelationship,
    aiInsights: ProductSimilarityAnalysis['aiInsights']
  ): Promise<ProductSimilarityAnalysis['strategicImplications']> {
    const implications = {
      threats: [] as string[],
      opportunities: [] as string[],
      recommendations: [] as string[]
    };

    // Base implications on competitive relationship
    switch (relationship) {
      case 'direct_competitor':
        implications.threats.push(
          'Direct feature competition',
          'Price pressure risk',
          'Market share erosion potential'
        );
        implications.opportunities.push(
          'Market validation',
          'Benchmarking opportunities',
          'Customer switching potential'
        );
        implications.recommendations.push(
          'Monitor closely',
          'Differentiate aggressively',
          'Strengthen unique value proposition'
        );
        break;

      case 'indirect_competitor':
        implications.threats.push(
          'Potential market expansion',
          'Feature convergence risk'
        );
        implications.opportunities.push(
          'Partnership potential',
          'Cross-selling opportunities',
          'Market expansion through adjacencies'
        );
        implications.recommendations.push(
          'Track market moves',
          'Explore collaboration',
          'Monitor for direct competition evolution'
        );
        break;

      case 'substitute':
        implications.threats.push(
          'Alternative solution risk',
          'Customer migration',
          'Technology disruption potential'
        );
        implications.opportunities.push(
          'Integration opportunities',
          'Bundle potential',
          'Workflow optimization'
        );
        implications.recommendations.push(
          'Address substitute gaps',
          'Enhance value proposition',
          'Create switching costs'
        );
        break;

      case 'complement':
        implications.opportunities.push(
          'Partnership synergies',
          'Bundle offerings',
          'Cross-promotion',
          'Integrated solutions'
        );
        implications.recommendations.push(
          'Explore partnerships',
          'Develop integrations',
          'Joint go-to-market strategies'
        );
        break;

      default:
        implications.recommendations.push(
          'Continue monitoring',
          'Low priority for competitive analysis'
        );
    }

    // Enhance with AI-generated insights
    implications.opportunities.push(...aiInsights.innovationOpportunities.slice(0, 3));
    implications.recommendations.push(...aiInsights.keyDifferentiators.slice(0, 2));

    // Add market gap opportunities
    if (aiInsights.marketGaps.length > 0) {
      implications.opportunities.push(
        `Market gap opportunity: ${aiInsights.marketGaps[0]}`
      );
    }

    return implications;
  }

  /**
   * Generate comprehensive strategic recommendations using AI
   */
  async generateStrategicRecommendations(
    product: CompetitorProduct,
    competitiveLandscape: ProductIntelligenceReport['competitiveLandscape'],
    featureAnalysis: ProductIntelligenceReport['featureAnalysis'],
    pricingAnalysis: ProductIntelligenceReport['pricingAnalysis'],
    innovationOpportunities: ProductIntelligenceReport['innovationOpportunities'],
    threatAssessment: ProductIntelligenceReport['threatAssessment']
  ): Promise<ProductIntelligenceReport['strategicRecommendations']> {
    try {
      const aiAnalysis = await deepSeekAIService.analyzeData({
        type: 'strategic_insights',
        data: {
          companyContext: { productName: product.name, category: product.category },
          competitorData: JSON.stringify(competitiveLandscape),
          marketData: JSON.stringify({ featureAnalysis, pricingAnalysis })
        },
        context: {
          analysisType: 'product_strategy',
          threats: threatAssessment,
          opportunities: innovationOpportunities
        }
      });

      return aiAnalysis.analysis.recommendations.map(rec => ({
        category: this.mapRecommendationCategory(rec.action),
        recommendation: rec.action,
        priority: rec.priority || 'medium',
        timeline: rec.timeline || 'medium_term',
        expectedImpact: rec.impact || 'medium',
        effort: rec.effort || 'medium',
        success_metrics: this.generateSuccessMetrics(rec.action, this.mapRecommendationCategory(rec.action))
      }));
    } catch (error) {
      logger.error('Failed to generate strategic recommendations:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to rule-based recommendations
      return this.generateFallbackRecommendations(
        product,
        competitiveLandscape,
        featureAnalysis,
        pricingAnalysis,
        threatAssessment
      );
    }
  }

  /**
   * Generate SWOT analysis for a product
   */
  async generateSWOTAnalysis(
    product: CompetitorProduct,
    similarProducts: SimilarProduct[],
    featureAnalysis: ProductIntelligenceReport['featureAnalysis'],
    pricingAnalysis: ProductIntelligenceReport['pricingAnalysis']
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }> {
    const swot = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      opportunities: [] as string[],
      threats: [] as string[]
    };

    // Analyze strengths
    if (featureAnalysis.uniqueFeatures.length > 0) {
      swot.strengths.push(`Unique features: ${featureAnalysis.uniqueFeatures.slice(0, 3).join(', ')}`);
    }

    if (pricingAnalysis.pricePositioning === 'value') {
      swot.strengths.push('Strong value proposition');
    }

    if (product.features.length > 5) {
      swot.strengths.push('Comprehensive feature set');
    }

    // Analyze weaknesses
    if (featureAnalysis.missingFeatures.length > 0) {
      swot.weaknesses.push(`Missing key features: ${featureAnalysis.missingFeatures.slice(0, 3).join(', ')}`);
    }

    if (pricingAnalysis.pricePositioning === 'premium' && featureAnalysis.uniqueFeatures.length === 0) {
      swot.weaknesses.push('Premium pricing without clear differentiation');
    }

    // Analyze opportunities
    if (featureAnalysis.featureGaps.some(gap => gap.importance === 'high')) {
      swot.opportunities.push('High-impact feature development opportunities');
    }

    if (similarProducts.length < 5) {
      swot.opportunities.push('Market leadership opportunity in emerging category');
    }

    // Analyze threats
    if (similarProducts.filter(p => p.similarity > 0.8).length > 3) {
      swot.threats.push('High competitive intensity from similar products');
    }

    if (pricingAnalysis.competitivePricing.aboveMarket > pricingAnalysis.competitivePricing.belowMarket) {
      swot.threats.push('Price pressure from lower-cost competitors');
    }

    return swot;
  }

  /**
   * Generate competitive positioning recommendations
   */
  generateCompetitivePositioning(
    product: CompetitorProduct,
    competitiveLandscape: ProductIntelligenceReport['competitiveLandscape'],
    marketPosition: ProductIntelligenceReport['marketPosition']
  ): {
    currentPositioning: string;
    recommendedPositioning: string;
    positioningStrategy: string[];
    differentiationOpportunities: string[];
  } {
    const directCompetitors = competitiveLandscape.directCompetitors;
    const positioning = marketPosition.positioning;

    let currentPositioning: string;
    let recommendedPositioning: string;
    const positioningStrategy: string[] = [];
    const differentiationOpportunities: string[] = [];

    // Determine current positioning
    switch (positioning) {
      case 'leader':
        currentPositioning = 'Market leader with strong competitive position';
        recommendedPositioning = 'Maintain leadership through innovation';
        positioningStrategy.push('Continuous innovation', 'Market education', 'Ecosystem building');
        break;
      case 'challenger':
        currentPositioning = 'Strong challenger with growth potential';
        recommendedPositioning = 'Challenge leader through differentiation';
        positioningStrategy.push('Aggressive differentiation', 'Niche focus', 'Disruptive innovation');
        break;
      case 'follower':
        currentPositioning = 'Market follower with optimization focus';
        recommendedPositioning = 'Find profitable niche or leapfrog competition';
        positioningStrategy.push('Cost leadership', 'Niche specialization', 'Fast follower');
        break;
      default:
        currentPositioning = 'Niche player with specialized focus';
        recommendedPositioning = 'Dominate niche or expand adjacencies';
        positioningStrategy.push('Niche domination', 'Adjacent market expansion', 'Specialized expertise');
    }

    // Identify differentiation opportunities
    if (directCompetitors.length > 0) {
      differentiationOpportunities.push('Feature-based differentiation');
    }

    if (product.features.length > 3) {
      differentiationOpportunities.push('Workflow integration');
    }

    differentiationOpportunities.push(
      'Customer experience focus',
      'Industry-specific solutions',
      'Technology innovation'
    );

    return {
      currentPositioning,
      recommendedPositioning,
      positioningStrategy,
      differentiationOpportunities
    };
  }

  // Private utility methods
  private mapRecommendationCategory(action: string): ProductIntelligenceReport['strategicRecommendations'][0]['category'] {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('develop') || actionLower.includes('feature') || actionLower.includes('product')) {
      return 'product_development';
    }
    if (actionLower.includes('price') || actionLower.includes('cost') || actionLower.includes('pricing')) {
      return 'pricing';
    }
    if (actionLower.includes('market') || actionLower.includes('brand') || actionLower.includes('marketing')) {
      return 'marketing';
    }
    if (actionLower.includes('partner') || actionLower.includes('integration') || actionLower.includes('collaborate')) {
      return 'partnerships';
    }

    return 'competitive_response';
  }

  private generateSuccessMetrics(action: string, category: string): string[] {
    const baseMetrics = ['Market share growth', 'Customer satisfaction', 'Revenue impact'];

    switch (category) {
      case 'product_development':
        return ['Feature adoption rate', 'User engagement', 'Product-market fit score', ...baseMetrics];
      case 'pricing':
        return ['Price realization', 'Margin improvement', 'Competitive win rate', ...baseMetrics];
      case 'marketing':
        return ['Brand awareness', 'Lead generation', 'Conversion rate', ...baseMetrics];
      case 'partnerships':
        return ['Partnership revenue', 'Integration adoption', 'Channel effectiveness', ...baseMetrics];
      default:
        return ['Competitive positioning', 'Market response time', ...baseMetrics];
    }
  }

  private generateFallbackRecommendations(
    product: CompetitorProduct,
    competitiveLandscape: ProductIntelligenceReport['competitiveLandscape'],
    featureAnalysis: ProductIntelligenceReport['featureAnalysis'],
    pricingAnalysis: ProductIntelligenceReport['pricingAnalysis'],
    threatAssessment: ProductIntelligenceReport['threatAssessment']
  ): ProductIntelligenceReport['strategicRecommendations'] {
    const recommendations: ProductIntelligenceReport['strategicRecommendations'] = [];

    // Product development recommendations
    if (featureAnalysis.featureGaps.length > 0) {
      const criticalGaps = featureAnalysis.featureGaps.filter(gap => gap.importance === 'critical');
      if (criticalGaps.length > 0) {
        const firstGap = criticalGaps[0];
        if (firstGap) {
          recommendations.push({
            category: 'product_development',
            recommendation: `Address critical feature gaps: ${firstGap.feature}`,
            priority: 'high',
            timeline: 'short_term',
            expectedImpact: 'high',
            effort: firstGap.implementationEffort,
            success_metrics: ['Feature adoption rate', 'Competitive win rate', 'Customer satisfaction']
          });
        }
      }
    }

    // Pricing recommendations
    if (pricingAnalysis.pricePositioning === 'premium' && featureAnalysis.uniqueFeatures.length === 0) {
      recommendations.push({
        category: 'pricing',
        recommendation: 'Justify premium pricing with enhanced value proposition',
        priority: 'high',
        timeline: 'immediate',
        expectedImpact: 'medium',
        effort: 'medium',
        success_metrics: ['Price realization', 'Customer retention', 'Value perception']
      });
    }

    // Competitive response recommendations
    if (threatAssessment.overallRisk === 'high' || threatAssessment.overallRisk === 'critical') {
      recommendations.push({
        category: 'competitive_response',
        recommendation: 'Develop rapid response strategy for competitive threats',
        priority: 'critical',
        timeline: 'immediate',
        expectedImpact: 'high',
        effort: 'high',
        success_metrics: ['Market share defense', 'Response time', 'Competitive positioning']
      });
    }

    // Marketing recommendations
    if (competitiveLandscape.directCompetitors.length > 3) {
      recommendations.push({
        category: 'marketing',
        recommendation: 'Strengthen brand differentiation in crowded market',
        priority: 'medium',
        timeline: 'medium_term',
        expectedImpact: 'medium',
        effort: 'medium',
        success_metrics: ['Brand awareness', 'Brand differentiation', 'Market share growth']
      });
    }

    return recommendations;
  }
}

export const strategicAnalyzer = new StrategicAnalyzer();