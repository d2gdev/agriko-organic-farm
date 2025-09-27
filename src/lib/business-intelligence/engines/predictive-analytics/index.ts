// Predictive Analytics - Main Export Module
// Provides backward compatibility with the original monolithic structure

// Export the main engine
export { PredictiveAnalyticsEngine } from './core-engine';

// Export individual engine components for advanced usage
export { MarketModelEngine } from './market-models';
export { CompetitorModelEngine } from './competitor-models';
export { TrendModelEngine } from './trend-models';
export { RiskAssessmentEngine } from './risk-assessment';
export { OpportunityForecastingEngine } from './opportunity-forecasting';
export { ScenarioAnalysisEngine } from './scenario-analysis';

// Export utility classes
export { DataProcessingUtils } from './data-processing';

// Export types for external usage
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
} from './types';

// Create and export singleton instance for backward compatibility
import { PredictiveAnalyticsEngine } from './core-engine';
export const predictiveAnalyticsEngine = PredictiveAnalyticsEngine.getInstance();