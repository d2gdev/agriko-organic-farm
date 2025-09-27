// Predictive Analytics - Internal Types and Interfaces

export interface HistoricalDataPoint {
  period: string;
  value: number;
  timestamp: Date;
}

export interface Competitor {
  id: string;
  name: string;
  marketShare?: number;
}

export interface DisruptionSignal {
  title?: string;
  snippet?: string;
}

export interface MarketDataPoint {
  year: number;
  value: number;
}

export interface CompetitorBehaviorHistory {
  pricingChanges: Record<string, unknown>[];
  productLaunches: Record<string, unknown>[];
  marketingCampaigns: Record<string, unknown>[];
  channelExpansions: Record<string, unknown>[];
  acquisitions: Record<string, unknown>[];
}

export interface TrendData {
  momentum: number;
  maturityStage: 'emerging' | 'growing' | 'mature' | 'declining';
  adoptionRate: number;
  disruptionPotential: number;
  timeHorizon: number;
  confidence: number;
}

export interface CompetitiveShift {
  type: string;
  probability: number;
  timeframe: string;
  impact: string;
}

export interface LocalMarketImpact {
  score: number;
  indicators: string[];
}

export interface Risk {
  id: string;
  description: string;
  probability: number;
  impact: number;
  timeframe: string;
  category?: string;
}

export interface Opportunity {
  id: string;
  description: string;
  category: string;
  expectedValue: number;
  timeWindow: string;
  confidence: number;
  priorityScore?: number;
  feasibilityScore?: number;
  timingSensitivity?: number;
}

export interface ScenarioInput {
  marketForecast: import('../../types/config').MarketForecast;
  competitorPredictions: import('../../types/config').CompetitorMovementPrediction[];
  trendPredictions: import('../../types/config').TrendPrediction[];
  _contextData?: Record<string, unknown>;
}

export interface PredictiveAnalysisData {
  marketForecast: import('../../types/config').MarketForecast;
  competitorPredictions: import('../../types/config').CompetitorMovementPrediction[];
  trendPredictions: import('../../types/config').TrendPrediction[];
  scenarios: PredictionScenario[];
  strategicInsights: string[];
}

// Enhanced prediction types
export interface MarketDynamicsModel {
  marketSegment: string;
  historicalGrowth: number[];
  seasonalityFactors: Record<string, number>;
  competitiveIntensity: number;
  disruptionProbability: number;
  modelAccuracy: number;
  lastTrained: Date;
}

export interface CompetitorBehaviorModel {
  competitorId: string;
  behaviorPatterns: {
    pricingAggressiveness: number;
    productLaunchFrequency: number;
    marketingSpendPattern: number[];
    channelExpansionTendency: number;
    acquisitionLikelihood: number;
  };
  predictabilityScore: number;
  lastObservation: Date;
}

export interface TrendAnalysisModel {
  trendCategory: string;
  momentum: number;
  maturityStage: 'emerging' | 'growing' | 'mature' | 'declining';
  adoptionRate: number;
  disruptionPotential: number;
  timeHorizon: number; // months
  confidence: number;
}

export interface PredictionScenario {
  scenarioId: string;
  name: string;
  probability: number;
  keyAssumptions: string[];
  predictedOutcomes: {
    marketGrowth: number;
    competitorPositions: Record<string, number>;
    riskLevel: 'low' | 'medium' | 'high';
    opportunityScore: number;
  };
  impactAnalysis: {
    revenue: number;
    marketShare: number;
    riskExposure: number;
  };
}