// Product Intelligence Type Definitions
export interface ProductSimilarityAnalysis {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  similarityScore: number; // 0-1, where 1 is identical
  similarityType: 'feature_based' | 'semantic' | 'usage_based' | 'market_based' | 'comprehensive';
  dimensions: {
    features: {
      score: number;
      matchingFeatures: string[];
      uniqueFeatures: {
        source: string[];
        target: string[];
      };
    };
    pricing: {
      score: number;
      priceComparison: 'higher' | 'lower' | 'similar';
      priceDifference: number;
      valueProposition: string;
    };
    market: {
      score: number;
      targetAudienceOverlap: number;
      marketPositioning: string;
      competitiveAdvantage: string[];
    };
    semantic: {
      score: number;
      conceptualSimilarity: number;
      descriptionOverlap: number;
      keywordMatches: string[];
    };
  };
  competitiveRelationship: 'direct_competitor' | 'indirect_competitor' | 'substitute' | 'complement' | 'unrelated';
  strategicImplications: {
    threats: string[];
    opportunities: string[];
    recommendations: string[];
  };
  confidence: number;
  analysisDate: Date;
  aiInsights: {
    summary: string;
    keyDifferentiators: string[];
    marketGaps: string[];
    innovationOpportunities: string[];
  };
}

export interface ProductIntelligenceReport {
  productId: string;
  productName: string;
  competitorId: string;
  analysisDate: Date;
  marketPosition: {
    category: string;
    subcategory: string;
    positioning: 'leader' | 'challenger' | 'follower' | 'niche';
    marketShare: {
      estimated: number;
      confidence: number;
      basis: string[];
    };
  };
  competitiveLandscape: {
    directCompetitors: Array<{
      productId: string;
      productName: string;
      competitorName: string;
      similarityScore: number;
      keyDifferences: string[];
    }>;
    substitutes: Array<{
      productId: string;
      productName: string;
      substitutionRisk: 'low' | 'medium' | 'high';
      substitutionFactors: string[];
    }>;
    complements: Array<{
      productId: string;
      productName: string;
      synergies: string[];
      partnershipPotential: 'low' | 'medium' | 'high';
    }>;
  };
  featureAnalysis: {
    coreFeatures: string[];
    uniqueFeatures: string[];
    missingFeatures: string[];
    featureGaps: Array<{
      feature: string;
      importance: 'low' | 'medium' | 'high' | 'critical';
      competitorCoverage: number;
      implementationEffort: 'low' | 'medium' | 'high';
    }>;
  };
  pricingAnalysis: {
    pricePoint: number;
    currency: string;
    pricePositioning: 'premium' | 'mid_market' | 'budget' | 'value';
    competitivePricing: {
      aboveMarket: number;
      belowMarket: number;
      marketMedian: number;
    };
    valuePerception: string;
    pricingRecommendations: string[];
  };
  innovationOpportunities: Array<{
    category: 'feature_enhancement' | 'new_feature' | 'technology_upgrade' | 'user_experience' | 'integration';
    opportunity: string;
    marketDemand: 'low' | 'medium' | 'high';
    competitiveAdvantage: 'low' | 'medium' | 'high';
    implementationComplexity: 'low' | 'medium' | 'high';
    timeToMarket: string;
    estimatedImpact: string;
  }>;
  threatAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    threats: Array<{
      type: 'new_entrant' | 'feature_parity' | 'price_competition' | 'technology_disruption' | 'market_shift';
      severity: 'low' | 'medium' | 'high' | 'critical';
      timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
      mitigation: string[];
    }>;
  };
  strategicRecommendations: Array<{
    category: 'product_development' | 'pricing' | 'marketing' | 'partnerships' | 'competitive_response';
    recommendation: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
    expectedImpact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    success_metrics: string[];
  }>;
  confidence: number;
}

export interface ProductClusterAnalysis {
  clusterId: string;
  clusterName: string;
  products: Array<{
    productId: string;
    productName: string;
    competitorName: string;
    clusterRelevance: number;
  }>;
  characteristics: {
    commonFeatures: string[];
    priceRange: { min: number; max: number; median: number };
    targetMarket: string[];
    keyTrends: string[];
  };
  marketDynamics: {
    competitiveIntensity: 'low' | 'medium' | 'high';
    innovationRate: 'slow' | 'moderate' | 'fast';
    customerSatisfaction: number;
    marketGrowth: 'declining' | 'stable' | 'growing' | 'rapid_growth';
  };
  opportunities: string[];
  threats: string[];
  strategicInsights: string[];
}

export interface SimilarProduct {
  id: string;
  name: string;
  similarity: number;
  competitorId: string;
}

export interface ProductCluster {
  id: string;
  name: string;
  products: import('../../types/competitor').CompetitorProduct[];
}

export type SimilarityAnalysisType = ProductSimilarityAnalysis['similarityType'];
export type CompetitiveRelationship = ProductSimilarityAnalysis['competitiveRelationship'];
export type ClusteringMethod = 'feature_based' | 'market_based' | 'semantic';