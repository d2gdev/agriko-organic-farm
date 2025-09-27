// Business Intelligence - Predictive Analytics Engine
// This file now serves as a compatibility layer for the refactored modular architecture

// Re-export everything from the new modular structure
export {
  PredictiveAnalyticsEngine,
  predictiveAnalyticsEngine,
  MarketModelEngine,
  CompetitorModelEngine,
  TrendModelEngine,
  RiskAssessmentEngine,
  OpportunityForecastingEngine,
  ScenarioAnalysisEngine,
  DataProcessingUtils
} from './predictive-analytics/index';

export type {
  HistoricalDataPoint,
  Competitor,
  DisruptionSignal,
  MarketDataPoint,
  CompetitorBehaviorHistory,
  TrendData,
  CompetitiveShift,
  LocalMarketImpact,
  Risk,
  Opportunity,
  ScenarioInput,
  PredictiveAnalysisData,
  MarketDynamicsModel,
  CompetitorBehaviorModel,
  TrendAnalysisModel,
  PredictionScenario
} from './predictive-analytics/index';

// Maintain backward compatibility - the singleton instance is now available
// through the re-export above, no need to redefine it here.