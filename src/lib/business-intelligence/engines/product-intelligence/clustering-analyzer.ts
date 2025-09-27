// Product Clustering Analysis Module
import { logger } from '@/lib/logger';
import type { CompetitorProduct } from '../../types/competitor';
import type {
  ProductClusterAnalysis,
  ProductCluster,
  ClusteringMethod
} from './types';

export class ClusteringAnalyzer {
  /**
   * Perform product clustering analysis
   */
  async performProductClustering(
    products: CompetitorProduct[],
    method: ClusteringMethod = 'feature_based'
  ): Promise<ProductCluster[]> {
    try {
      logger.debug('Performing product clustering', {
        productCount: products.length,
        method
      });

      // Perform clustering based on method
      const clusters = await this.clusterProducts(products, method);

      logger.info('Product clustering completed', {
        clusterCount: clusters.length,
        totalProducts: products.length
      });

      return clusters;
    } catch (error) {
      logger.error('Failed to perform product clustering:', {
        productCount: products.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Analyze individual product cluster characteristics
   */
  async analyzeProductCluster(
    cluster: ProductCluster
  ): Promise<ProductClusterAnalysis> {
    try {
      const products = cluster.products;
      const prices = products.map(p => p.price).filter(p => p > 0);
      const allFeatures = new Set<string>();

      // Collect all features
      products.forEach(p => p.features.forEach(f => allFeatures.add(f)));

      // Identify common features (present in at least 50% of products)
      const commonFeatures = Array.from(allFeatures).filter(feature =>
        products.filter(p => p.features.includes(feature)).length >= products.length * 0.5
      );

      // Calculate price range
      const priceRange = this.calculatePriceRange(prices);

      // Analyze market dynamics
      const marketDynamics = this.analyzeMarketDynamics(products, allFeatures);

      // Generate opportunities and threats
      const { opportunities, threats } = this.generateClusterOpportunitiesThreats(
        products,
        commonFeatures,
        priceRange
      );

      // Generate strategic insights
      const strategicInsights = this.generateClusterStrategicInsights(
        products,
        commonFeatures,
        marketDynamics
      );

      return {
        clusterId: cluster.id,
        clusterName: cluster.name,
        products: products.map(p => ({
          productId: p.id,
          productName: p.name,
          competitorName: p.competitorId,
          clusterRelevance: this.calculateClusterRelevance(p, commonFeatures)
        })),
        characteristics: {
          commonFeatures,
          priceRange,
          targetMarket: [cluster.name], // Simplified - would be more detailed in production
          keyTrends: this.identifyKeyTrends(products)
        },
        marketDynamics,
        opportunities,
        threats,
        strategicInsights
      };
    } catch (error) {
      logger.error('Failed to analyze product cluster:', {
        clusterId: cluster.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find optimal number of clusters using elbow method approximation
   */
  findOptimalClusterCount(
    products: CompetitorProduct[],
    maxClusters: number = 10
  ): number {
    if (products.length <= 2) return 1;
    if (products.length <= 5) return 2;
    if (products.length <= 10) return 3;

    // Simple heuristic based on product count and diversity
    const uniqueCategories = new Set(products.map(p => p.category)).size;
    const priceVariance = this.calculatePriceVariance(products);

    // More clusters if high price variance or many categories
    let optimalK = Math.min(
      Math.max(2, Math.ceil(products.length / 5)),
      maxClusters
    );

    // Adjust based on diversity
    if (uniqueCategories > optimalK) {
      optimalK = Math.min(uniqueCategories, maxClusters);
    }

    if (priceVariance > 0.5) {
      optimalK = Math.min(optimalK + 1, maxClusters);
    }

    return optimalK;
  }

  /**
   * Compare clusters and identify relationships
   */
  compareProductClusters(
    clusters: ProductClusterAnalysis[]
  ): Array<{
    cluster1Id: string;
    cluster2Id: string;
    relationship: 'competitive' | 'complementary' | 'adjacent' | 'unrelated';
    similarity: number;
    insights: string[];
  }> {
    const comparisons = [];

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const cluster1 = clusters[i];
        const cluster2 = clusters[j];

        if (!cluster1 || !cluster2) continue;

        const comparison = this.compareIndividualClusters(cluster1, cluster2);
        comparisons.push({
          cluster1Id: cluster1.clusterId,
          cluster2Id: cluster2.clusterId,
          ...comparison
        });
      }
    }

    return comparisons;
  }

  /**
   * Generate cluster evolution predictions
   */
  predictClusterEvolution(
    cluster: ProductClusterAnalysis,
    timeHorizon: '6months' | '1year' | '2years' = '1year'
  ): {
    growthProjection: 'expanding' | 'stable' | 'contracting';
    keyDrivers: string[];
    riskFactors: string[];
    recommendations: string[];
  } {
    const productCount = cluster.products.length;
    const competitiveIntensity = cluster.marketDynamics.competitiveIntensity;
    const marketGrowth = cluster.marketDynamics.marketGrowth;

    let growthProjection: 'expanding' | 'stable' | 'contracting';
    const keyDrivers: string[] = [];
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Determine growth projection
    if (marketGrowth === 'rapid_growth' || marketGrowth === 'growing') {
      if (competitiveIntensity === 'low') {
        growthProjection = 'expanding';
        keyDrivers.push('Market growth with limited competition');
      } else {
        growthProjection = 'stable';
        keyDrivers.push('Market growth offset by competition');
      }
    } else if (marketGrowth === 'stable') {
      growthProjection = competitiveIntensity === 'high' ? 'contracting' : 'stable';
      keyDrivers.push('Stable market conditions');
    } else {
      growthProjection = 'contracting';
      keyDrivers.push('Declining market conditions');
    }

    // Identify risk factors
    if (productCount > 15) {
      riskFactors.push('Market saturation risk');
    }

    if (competitiveIntensity === 'high') {
      riskFactors.push('Intense price competition');
      riskFactors.push('Feature commoditization');
    }

    if (cluster.characteristics.commonFeatures.length > 8) {
      riskFactors.push('Product differentiation challenges');
    }

    // Generate recommendations
    switch (growthProjection) {
      case 'expanding':
        recommendations.push('Invest in market capture');
        recommendations.push('Scale operations rapidly');
        recommendations.push('Build barriers to entry');
        break;
      case 'stable':
        recommendations.push('Focus on differentiation');
        recommendations.push('Optimize operational efficiency');
        recommendations.push('Consider adjacent markets');
        break;
      case 'contracting':
        recommendations.push('Consolidation opportunities');
        recommendations.push('Cost optimization critical');
        recommendations.push('Pivot to growth segments');
        break;
    }

    return {
      growthProjection,
      keyDrivers,
      riskFactors,
      recommendations
    };
  }

  // Private utility methods
  private async clusterProducts(
    products: CompetitorProduct[],
    method: ClusteringMethod
  ): Promise<ProductCluster[]> {
    // Simplified clustering - in production would use proper clustering algorithms
    const clusters = new Map<string, CompetitorProduct[]>();

    products.forEach(product => {
      let clusterKey: string;

      switch (method) {
        case 'feature_based':
          // Group by dominant feature category
          clusterKey = this.getDominantFeatureCategory(product.features);
          break;
        case 'market_based':
          // Group by price tier and category
          clusterKey = `${product.category}_${this.getPriceTier(product.price)}`;
          break;
        case 'semantic':
          // Group by category (simplified - would use vector clustering in production)
          clusterKey = product.category;
          break;
        default:
          clusterKey = product.category;
      }

      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      const cluster = clusters.get(clusterKey);
      if (cluster) {
        cluster.push(product);
      }
    });

    return Array.from(clusters.entries()).map(([key, products], index) => ({
      id: `cluster_${method}_${index}`,
      name: key,
      products
    }));
  }

  private calculatePriceRange(prices: number[]): { min: number; max: number; median: number } {
    if (prices.length === 0) {
      return { min: 0, max: 0, median: 0 };
    }

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      median: median || 0
    };
  }

  private analyzeMarketDynamics(
    products: CompetitorProduct[],
    allFeatures: Set<string>
  ): ProductClusterAnalysis['marketDynamics'] {
    const competitiveIntensity = products.length > 10 ? 'high' :
      products.length > 5 ? 'medium' : 'low';

    // Estimate innovation rate based on feature diversity
    const avgFeaturesPerProduct = products.reduce((sum, p) => sum + p.features.length, 0) / products.length;
    const featureDiversity = allFeatures.size / avgFeaturesPerProduct;

    const innovationRate = featureDiversity > 2 ? 'fast' :
      featureDiversity > 1.5 ? 'moderate' : 'slow';

    // Simplified market growth assessment
    const marketGrowth = competitiveIntensity === 'high' ? 'growing' : 'stable';

    // Estimated customer satisfaction (simplified)
    const customerSatisfaction = avgFeaturesPerProduct > 5 ? 0.8 : 0.7;

    return {
      competitiveIntensity,
      innovationRate,
      customerSatisfaction,
      marketGrowth
    };
  }

  private generateClusterOpportunitiesThreats(
    products: CompetitorProduct[],
    commonFeatures: string[],
    priceRange: { min: number; max: number; median: number }
  ): { opportunities: string[]; threats: string[] } {
    const opportunities: string[] = [];
    const threats: string[] = [];

    // Opportunities
    if (commonFeatures.length < 3) {
      opportunities.push('Feature differentiation opportunities');
    }

    if (priceRange.max - priceRange.min > priceRange.median) {
      opportunities.push('Price segmentation potential');
    }

    if (products.length < 5) {
      opportunities.push('Market leadership opportunity');
    }

    opportunities.push('Market expansion potential');

    // Threats
    if (products.length > 10) {
      threats.push('High competitive intensity');
    }

    if (commonFeatures.length > 8) {
      threats.push('Feature commoditization risk');
    }

    threats.push('New entrant risk');
    threats.push('Technology disruption potential');

    return { opportunities, threats };
  }

  private generateClusterStrategicInsights(
    products: CompetitorProduct[],
    commonFeatures: string[],
    marketDynamics: ProductClusterAnalysis['marketDynamics']
  ): string[] {
    const insights: string[] = [];

    if (marketDynamics.competitiveIntensity === 'high') {
      insights.push('Focus on differentiation to stand out in crowded market');
    }

    if (commonFeatures.length > 5) {
      insights.push('Market shows feature convergence - innovation needed');
    }

    if (marketDynamics.innovationRate === 'fast') {
      insights.push('Rapid innovation cycle requires agile development');
    }

    if (products.length > 15) {
      insights.push('Consider consolidation or niche focus strategy');
    }

    insights.push('Monitor competitive moves closely');

    return insights;
  }

  private calculateClusterRelevance(
    product: CompetitorProduct,
    commonFeatures: string[]
  ): number {
    if (commonFeatures.length === 0) return 1;

    const matchingFeatures = product.features.filter(f => commonFeatures.includes(f));
    return matchingFeatures.length / commonFeatures.length;
  }

  private identifyKeyTrends(products: CompetitorProduct[]): string[] {
    const trends = [];

    // Analyze feature trends
    const allFeatures = products.flatMap(p => p.features);
    const featureFreq = new Map<string, number>();

    allFeatures.forEach(feature => {
      featureFreq.set(feature, (featureFreq.get(feature) || 0) + 1);
    });

    const commonFeatures = Array.from(featureFreq.entries())
      .filter(([_, count]) => count > products.length * 0.3)
      .map(([feature]) => feature);

    if (commonFeatures.length > 0) {
      trends.push(`Feature convergence: ${commonFeatures.slice(0, 3).join(', ')}`);
    }

    // Analyze pricing trends
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    if (avgPrice > 1000) {
      trends.push('Premium pricing trend');
    } else if (avgPrice < 100) {
      trends.push('Value pricing trend');
    }

    trends.push('Market consolidation');

    return trends;
  }

  private compareIndividualClusters(
    cluster1: ProductClusterAnalysis,
    cluster2: ProductClusterAnalysis
  ): {
    relationship: 'competitive' | 'complementary' | 'adjacent' | 'unrelated';
    similarity: number;
    insights: string[];
  } {
    // Calculate feature similarity
    const features1 = new Set(cluster1.characteristics.commonFeatures);
    const features2 = new Set(cluster2.characteristics.commonFeatures);
    const intersection = new Set([...features1].filter(f => features2.has(f)));
    const union = new Set([...features1, ...features2]);

    const featureSimilarity = union.size === 0 ? 0 : intersection.size / union.size;

    // Calculate price similarity
    const price1 = cluster1.characteristics.priceRange.median;
    const price2 = cluster2.characteristics.priceRange.median;
    const priceDiff = Math.abs(price1 - price2);
    const avgPrice = (price1 + price2) / 2;
    const priceSimilarity = avgPrice === 0 ? 1 : Math.max(0, 1 - priceDiff / avgPrice);

    // Overall similarity
    const similarity = (featureSimilarity + priceSimilarity) / 2;

    // Determine relationship
    let relationship: 'competitive' | 'complementary' | 'adjacent' | 'unrelated';
    if (similarity > 0.7) {
      relationship = 'competitive';
    } else if (similarity > 0.4) {
      relationship = 'adjacent';
    } else if (intersection.size > 0) {
      relationship = 'complementary';
    } else {
      relationship = 'unrelated';
    }

    // Generate insights
    const insights: string[] = [];
    if (relationship === 'competitive') {
      insights.push('Direct competition - monitor closely');
    } else if (relationship === 'complementary') {
      insights.push('Partnership opportunities exist');
    } else if (relationship === 'adjacent') {
      insights.push('Potential for market expansion');
    }

    return { relationship, similarity, insights };
  }

  private getDominantFeatureCategory(features: string[]): string {
    // Simplified feature categorization
    const categories = {
      analytics: ['analytics', 'reporting', 'dashboard'],
      integration: ['integration', 'api', 'sync'],
      security: ['security', 'auth', 'encryption'],
      ui: ['ui', 'ux', 'interface']
    };

    let maxCount = 0;
    let dominantCategory = 'general';

    Object.entries(categories).forEach(([category, keywords]) => {
      const count = features.filter(feature =>
        keywords.some(keyword => feature.toLowerCase().includes(keyword))
      ).length;

      if (count > maxCount) {
        maxCount = count;
        dominantCategory = category;
      }
    });

    return dominantCategory;
  }

  private getPriceTier(price: number): string {
    if (price < 50) return 'budget';
    if (price < 200) return 'mid';
    if (price < 500) return 'premium';
    return 'enterprise';
  }

  private calculatePriceVariance(products: CompetitorProduct[]): number {
    const prices = products.map(p => p.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }
}

export const clusteringAnalyzer = new ClusteringAnalyzer();