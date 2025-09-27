// Pricing Intelligence Types

export interface PricingDataPoint {
  id: string;
  competitorId: string;
  competitorName: string;
  productId: string;
  productName: string;
  price: number;
  currency: string;
  priceType: 'one_time' | 'subscription' | 'usage_based' | 'freemium' | 'tiered';
  billingPeriod?: 'monthly' | 'quarterly' | 'annually' | 'per_use';
  features: string[];
  marketSegment: string;
  geographicRegion: string;
  lastUpdated: Date;
  confidence: number;
  source: string;
  metadata: Record<string, unknown>;
}

export interface PricingStrategy {
  type: 'cost_plus' | 'value_based' | 'competitive' | 'penetration' | 'skimming' | 'psychological' | 'bundle';
  confidence: number;
  indicators: string[];
  pricePoints: number[];
  targetSegments: string[];
  positioning: 'premium' | 'mid_market' | 'budget' | 'enterprise' | 'mixed';
}

export interface PricingAnalysis {
  id: string;
  analysisDate: Date;
  competitorId: string;
  productCategory: string;
  strategy: PricingStrategy;
  marketPosition: {
    percentile: number; // 0-100, where 100 is most expensive
    rank: number;
    totalCompetitors: number;
    priceGap: {
      aboveMedian: number;
      belowMedian: number;
      nearestCompetitor: number;
    };
  };
  elasticity: {
    estimated: number; // Price elasticity coefficient
    confidence: number;
    factors: string[];
  };
  recommendations: Array<{
    action: 'increase' | 'decrease' | 'maintain' | 'restructure' | 'monitor';
    rationale: string;
    expectedImpact: string;
    risk: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  }>;
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    velocity: number; // Rate of change
    seasonality: boolean;
    factors: string[];
  };
  threats: Array<{
    type: 'price_war' | 'new_entrant' | 'substitution' | 'disruption';
    severity: 'low' | 'medium' | 'high' | 'critical';
    likelihood: number;
    timeline: string;
    mitigation: string[];
  }>;
  opportunities: Array<{
    type: 'premium_pricing' | 'market_expansion' | 'bundle_optimization' | 'segmentation';
    potential: number;
    effort: 'low' | 'medium' | 'high';
    description: string;
  }>;
  aiInsights: {
    summary: string;
    keyFindings: string[];
    confidence: number;
    modelVersion: string;
  };
}

export interface PricingForecast {
  competitorId: string;
  productId: string;
  timeframe: '1_month' | '3_months' | '6_months' | '1_year';
  predictions: Array<{
    date: Date;
    predictedPrice: number;
    confidence: number;
    factors: string[];
  }>;
  scenarios: Array<{
    name: string;
    probability: number;
    impact: string;
    priceRange: {
      min: number;
      max: number;
      expected: number;
    };
    assumptions: string[];
  }>;
  riskFactors: string[];
  marketDrivers: string[];
  confidenceInterval: {
    upper: number;
    lower: number;
    confidence: number;
  };
}

export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  endpoint: string;
}

export interface MarketStatistics {
  mean: number;
  median: number;
  standardDeviation: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  outliers: number[];
}

export interface CompetitorBatch {
  competitorId: string;
  productCategory: string;
}