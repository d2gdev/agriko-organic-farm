// Business Intelligence - Channel Intelligence Engine
// This file now serves as a compatibility layer for the refactored modular architecture

// Re-export everything from the new modular structure
export {
  ChannelIntelligenceEngine,
  channelIntelligenceEngine,
  ChannelPresenceAnalyzer,
  MarketChannelAnalyzer,
  ChannelCompetitiveAnalyzer,
  ChannelPerformanceCalculator,
  ChannelOpportunityIdentifier,
  ChannelGapAnalyzer,
  ChannelROIAnalyzer,
  ChannelStrategyGenerator,
  ChannelDataStore
} from './channel-intelligence/index';

export type {
  ChannelTrendAnalysis,
  ChannelGapAnalysis,
  ChannelROIAnalysis,
  ChannelPresenceData,
  DigitalPresenceMetrics,
  PhysicalPresenceMetrics,
  ChannelGapData
} from './channel-intelligence/index';

// Maintain backward compatibility - the singleton instance is now available
// through the re-export above, no need to redefine it here.