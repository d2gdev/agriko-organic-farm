// Product Intelligence Module - Main Entry Point
// Re-exports for backward compatibility and clean API

// Main engine and singleton instance
export { ProductIntelligenceEngine, productIntelligenceEngine } from './engine';

// Type definitions
export type {
  ProductSimilarityAnalysis,
  ProductIntelligenceReport,
  ProductClusterAnalysis,
  SimilarProduct,
  ProductCluster,
  SimilarityAnalysisType,
  CompetitiveRelationship,
  ClusteringMethod
} from './types';

// Individual analyzer classes (for advanced usage)
export { SimilarityAnalyzer, similarityAnalyzer } from './similarity-analyzer';
export { CompetitiveAnalyzer, competitiveAnalyzer } from './competitive-analyzer';
export { FeatureAnalyzer, featureAnalyzer } from './feature-analyzer';
export { PricingAnalyzer, pricingAnalyzer } from './pricing-analyzer';
export { StrategicAnalyzer, strategicAnalyzer } from './strategic-analyzer';
export { ClusteringAnalyzer, clusteringAnalyzer } from './clustering-analyzer';
export { DataAccessLayer, dataAccessLayer } from './data-access';

// Default export for convenience
export { productIntelligenceEngine as default } from './engine';