// Product Pricing Analysis Module
import { logger } from '@/lib/logger';
import type { CompetitorProduct } from '../../types/competitor';
import type {
  ProductIntelligenceReport,
  SimilarProduct
} from './types';
import { dataAccessLayer } from './data-access';

export class PricingAnalyzer {
  /**
   * Analyze product pricing against competitive landscape
   */
  async analyzeProductPricing(
    product: CompetitorProduct,
    similarProducts: SimilarProduct[]
  ): Promise<ProductIntelligenceReport['pricingAnalysis']> {
    try {
      // Get pricing data for similar products
      const competitorPrices: number[] = [];

      for (const similar of similarProducts) {
        const competitorProduct = await dataAccessLayer.getProductData(similar.id);
        if (competitorProduct && competitorProduct.price > 0) {
          competitorPrices.push(competitorProduct.price);
        }
      }

      // Handle case with no competitor pricing data
      if (competitorPrices.length === 0) {
        return this.createDefaultPricingAnalysis(product);
      }

      // Calculate competitive pricing metrics
      const sortedPrices = competitorPrices.sort((a, b) => a - b);
      const median = this.calculateMedian(sortedPrices);
      const mean = competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length;

      const aboveMarket = sortedPrices.filter(p => p > product.price).length;
      const belowMarket = sortedPrices.filter(p => p < product.price).length;

      // Determine price positioning
      const positioning = this.determinePricePositioning(product.price, median, mean);

      // Generate pricing recommendations
      const pricingRecommendations = this.generatePricingRecommendations(
        positioning,
        median,
        product.price,
        competitorPrices.length
      );

      // Generate value perception analysis
      const valuePerception = this.generateValuePerception(
        positioning,
        product.price,
        median,
        product.features.length,
        competitorPrices.length
      );

      return {
        pricePoint: product.price,
        currency: product.currency,
        pricePositioning: positioning,
        competitivePricing: {
          aboveMarket,
          belowMarket,
          marketMedian: median
        },
        valuePerception,
        pricingRecommendations
      };
    } catch (error) {
      logger.error('Failed to analyze product pricing:', {
        productId: product.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createDefaultPricingAnalysis(product);
    }
  }

  /**
   * Calculate pricing similarity between two products
   */
  calculatePricingSimilarity(
    sourcePrice: number,
    targetPrice: number
  ): {
    score: number;
    comparison: 'higher' | 'lower' | 'similar';
    difference: number;
  } {
    const priceDifference = Math.abs(sourcePrice - targetPrice);
    const avgPrice = (sourcePrice + targetPrice) / 2;
    const relativeDifference = avgPrice === 0 ? 0 : priceDifference / avgPrice;

    // Similarity decreases as relative price difference increases
    const score = Math.max(0, 1 - relativeDifference);

    let comparison: 'higher' | 'lower' | 'similar';
    if (relativeDifference < 0.1) {
      comparison = 'similar';
    } else if (sourcePrice > targetPrice) {
      comparison = 'higher';
    } else {
      comparison = 'lower';
    }

    return {
      score,
      comparison,
      difference: priceDifference
    };
  }

  /**
   * Analyze pricing trends across competitor set
   */
  analyzePricingTrends(
    products: Array<CompetitorProduct & { updatedAt: Date }>
  ): {
    trend: 'increasing' | 'decreasing' | 'stable';
    averageChange: number;
    volatility: number;
    insights: string[];
  } {
    if (products.length < 2) {
      return {
        trend: 'stable',
        averageChange: 0,
        volatility: 0,
        insights: ['Insufficient data for trend analysis']
      };
    }

    // Sort by update date
    const sortedProducts = products.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

    // Calculate price changes
    const priceChanges: number[] = [];
    for (let i = 1; i < sortedProducts.length; i++) {
      const currentProduct = sortedProducts[i];
      const prevProduct = sortedProducts[i-1];

      if (currentProduct && prevProduct && prevProduct.price > 0) {
        const change = (currentProduct.price - prevProduct.price) / prevProduct.price;
        priceChanges.push(change);
      }
    }

    const averageChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const variance = priceChanges.reduce((sum, change) => sum + Math.pow(change - averageChange, 2), 0) / priceChanges.length;
    const volatility = Math.sqrt(variance);

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (averageChange > 0.05) trend = 'increasing';
    else if (averageChange < -0.05) trend = 'decreasing';
    else trend = 'stable';

    // Generate insights
    const insights: string[] = [];
    if (trend === 'increasing') {
      insights.push('Market prices are trending upward');
      insights.push('Consider premium positioning opportunities');
    } else if (trend === 'decreasing') {
      insights.push('Market prices are under pressure');
      insights.push('Focus on value proposition and cost optimization');
    } else {
      insights.push('Market pricing is relatively stable');
      insights.push('Competitive positioning through differentiation');
    }

    if (volatility > 0.2) {
      insights.push('High price volatility suggests market uncertainty');
    }

    return {
      trend,
      averageChange,
      volatility,
      insights
    };
  }

  /**
   * Generate price optimization recommendations
   */
  generatePriceOptimizationRecommendations(
    currentPrice: number,
    competitorPrices: number[],
    features: string[],
    marketPosition: 'leader' | 'challenger' | 'follower' | 'niche'
  ): Array<{
    strategy: string;
    targetPrice: number;
    expectedImpact: string;
    risk: 'low' | 'medium' | 'high';
    timeline: string;
  }> {
    const recommendations = [];
    const median = this.calculateMedian(competitorPrices);
    const mean = competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length;

    // Premium positioning strategy
    if (features.length > 5 && currentPrice < median * 1.2) {
      recommendations.push({
        strategy: 'Premium positioning based on feature advantage',
        targetPrice: median * 1.25,
        expectedImpact: 'Higher margins, premium brand perception',
        risk: 'medium' as const,
        timeline: '3-6 months'
      });
    }

    // Value positioning strategy
    if (currentPrice > mean && marketPosition !== 'leader') {
      recommendations.push({
        strategy: 'Value positioning to increase market share',
        targetPrice: mean * 0.9,
        expectedImpact: 'Increased market share, higher volume',
        risk: 'low' as const,
        timeline: '1-3 months'
      });
    }

    // Competitive parity strategy
    if (Math.abs(currentPrice - median) / median > 0.15) {
      recommendations.push({
        strategy: 'Align with market median for competitive parity',
        targetPrice: median,
        expectedImpact: 'Reduced price sensitivity, competitive positioning',
        risk: 'low' as const,
        timeline: '1-2 months'
      });
    }

    return recommendations;
  }

  // Private utility methods
  private createDefaultPricingAnalysis(product: CompetitorProduct): ProductIntelligenceReport['pricingAnalysis'] {
    return {
      pricePoint: product.price,
      currency: product.currency,
      pricePositioning: 'mid_market',
      competitivePricing: {
        aboveMarket: 0,
        belowMarket: 0,
        marketMedian: product.price
      },
      valuePerception: 'Competitive pricing position',
      pricingRecommendations: ['Monitor competitive pricing', 'Gather more market data']
    };
  }

  private calculateMedian(prices: number[]): number {
    if (prices.length === 0) return 0;

    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return ((sorted[mid - 1] || 0) + (sorted[mid] || 0)) / 2;
    }
    return sorted[mid] || 0;
  }

  private determinePricePositioning(
    price: number,
    median: number,
    mean: number
  ): 'premium' | 'mid_market' | 'budget' | 'value' {
    const medianRatio = price / median;
    const meanRatio = price / mean;

    if (medianRatio > 1.3 || meanRatio > 1.3) {
      return 'premium';
    } else if (medianRatio < 0.7 || meanRatio < 0.7) {
      return 'budget';
    } else if (medianRatio < 0.9 && meanRatio < 0.9) {
      return 'value';
    } else {
      return 'mid_market';
    }
  }

  private generatePricingRecommendations(
    positioning: string,
    _marketMedian: number,
    _currentPrice: number,
    competitorCount: number
  ): string[] {
    const recommendations = [];

    switch (positioning) {
      case 'premium':
        recommendations.push('Ensure premium features justify price point');
        recommendations.push('Monitor for premium erosion');
        recommendations.push('Focus on value communication');
        break;
      case 'budget':
        recommendations.push('Consider value-added services');
        recommendations.push('Monitor for margin pressure');
        recommendations.push('Optimize cost structure');
        break;
      case 'value':
        recommendations.push('Emphasize value proposition');
        recommendations.push('Monitor competitor price changes');
        break;
      default:
        recommendations.push('Maintain competitive pricing');
        recommendations.push('Look for differentiation opportunities');
    }

    // Add recommendations based on competitive intensity
    if (competitorCount > 10) {
      recommendations.push('High competition requires strong differentiation');
    } else if (competitorCount < 3) {
      recommendations.push('Limited competition allows pricing flexibility');
    }

    return recommendations;
  }

  private generateValuePerception(
    positioning: string,
    currentPrice: number,
    marketMedian: number,
    featureCount: number,
    competitorCount: number
  ): string {
    const priceRatio = currentPrice / marketMedian;
    const featureAdvantage = featureCount > 5 ? 'high' : featureCount > 3 ? 'medium' : 'low';

    let perception = `${positioning} positioning in competitive market`;

    if (priceRatio > 1.2 && featureAdvantage === 'high') {
      perception += ' with strong feature justification';
    } else if (priceRatio > 1.2 && featureAdvantage === 'low') {
      perception += ' may face value perception challenges';
    } else if (priceRatio < 0.8) {
      perception += ' with strong value proposition';
    }

    if (competitorCount > 10) {
      perception += ' in highly competitive market';
    }

    return perception;
  }
}

export const pricingAnalyzer = new PricingAnalyzer();