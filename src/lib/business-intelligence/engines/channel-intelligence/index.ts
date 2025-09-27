// Channel Intelligence Engine - Main Module
import { logger } from '../../../logger';
import type {
  ChannelIntelligenceAnalysis,
  ChannelPresenceAnalysis,
  MarketChannelData,
  ChannelCompetitiveAnalysis,
  ChannelPerformanceMetrics,
  ChannelOpportunityAnalysis,
  ChannelStrategyRecommendation,
  ChannelEffectivenessScore
} from '../../types/config';

// Import all modules
import { ChannelPresenceAnalyzer } from './presence-analyzer';
import { MarketChannelAnalyzer } from './market-analyzer';
import { ChannelCompetitiveAnalyzer } from './competitive-analyzer';
import { ChannelPerformanceCalculator } from './performance-calculator';
import { ChannelOpportunityIdentifier } from './opportunity-identifier';
import { ChannelGapAnalyzer } from './gap-analyzer';
import { ChannelROIAnalyzer } from './roi-analyzer';
import { ChannelStrategyGenerator } from './strategy-generator';
import { ChannelDataStore } from './data-store';

// Export types
export * from './types';

// Main Engine Class
export class ChannelIntelligenceEngine {
  private static instance: ChannelIntelligenceEngine | null = null;

  private presenceAnalyzer: ChannelPresenceAnalyzer;
  private marketAnalyzer: MarketChannelAnalyzer;
  private competitiveAnalyzer: ChannelCompetitiveAnalyzer;
  private performanceCalculator: ChannelPerformanceCalculator;
  private opportunityIdentifier: ChannelOpportunityIdentifier;
  private gapAnalyzer: ChannelGapAnalyzer;
  private roiAnalyzer: ChannelROIAnalyzer;
  private strategyGenerator: ChannelStrategyGenerator;
  private dataStore: ChannelDataStore;

  private constructor() {
    this.presenceAnalyzer = new ChannelPresenceAnalyzer();
    this.marketAnalyzer = new MarketChannelAnalyzer();
    this.competitiveAnalyzer = new ChannelCompetitiveAnalyzer();
    this.performanceCalculator = new ChannelPerformanceCalculator();
    this.opportunityIdentifier = new ChannelOpportunityIdentifier();
    this.gapAnalyzer = new ChannelGapAnalyzer();
    this.roiAnalyzer = new ChannelROIAnalyzer();
    this.strategyGenerator = new ChannelStrategyGenerator();
    this.dataStore = new ChannelDataStore();

    logger.info('Channel Intelligence Engine initialized with modular architecture');
  }

  public static getInstance(): ChannelIntelligenceEngine {
    if (!ChannelIntelligenceEngine.instance) {
      ChannelIntelligenceEngine.instance = new ChannelIntelligenceEngine();
    }
    return ChannelIntelligenceEngine.instance;
  }

  async analyzeChannelStrategy(
    competitorId: string,
    marketSegment: string,
    contextData?: Record<string, unknown>
  ): Promise<ChannelIntelligenceAnalysis> {
    try {
      logger.info('Starting channel strategy analysis', {
        competitorId,
        marketSegment
      });

      // Gather channel data from multiple sources
      const [
        channelPresence,
        marketChannelData,
        competitorChannels,
        industryTrends
      ] = await Promise.all([
        this.presenceAnalyzer.analyzeChannelPresence(competitorId),
        this.marketAnalyzer.gatherMarketChannelData(marketSegment),
        this.competitiveAnalyzer.analyzeCompetitorChannels(competitorId, marketSegment),
        this.competitiveAnalyzer.analyzeChannelTrends(marketSegment)
      ]);

      // Perform comprehensive channel analysis
      const [
        performanceMetrics,
        opportunityAnalysis,
        gapAnalysis,
        roiAnalysis
      ] = await Promise.all([
        this.performanceCalculator.calculateChannelPerformance(channelPresence, marketChannelData),
        this.opportunityIdentifier.identifyChannelOpportunities(channelPresence, competitorChannels, industryTrends),
        this.gapAnalyzer.performChannelGapAnalysis(channelPresence, competitorChannels, marketChannelData),
        this.roiAnalyzer.analyzeChannelROI(channelPresence, marketChannelData, industryTrends)
      ]);

      // Generate AI-powered strategic recommendations
      const strategyRecommendations = await this.strategyGenerator.generateChannelStrategyRecommendations(
        channelPresence,
        performanceMetrics,
        opportunityAnalysis,
        gapAnalysis,
        contextData
      );

      // Store analysis results in graph database
      await this.dataStore.storeChannelAnalysis(competitorId, {
        channelPresence
      });

      const analysis: ChannelIntelligenceAnalysis = {
        competitorId,
        channelId: 'multi-channel',
        channelName: 'Multi-Channel Analysis',
        performance: performanceMetrics,
        opportunities: [opportunityAnalysis],
        recommendations: strategyRecommendations,
        competitive: this.competitiveAnalyzer.synthesizeCompetitiveAnalysis(competitorChannels, gapAnalysis),
        effectiveness: this.calculateOverallEffectiveness(performanceMetrics, opportunityAnalysis),
        confidence: this.calculateAnalysisConfidence([
          channelPresence,
          performanceMetrics,
          opportunityAnalysis
        ])
      };

      logger.info('Channel strategy analysis completed', {
        competitorId,
        marketSegment,
        channelCount: channelPresence.channels?.length || 0,
        confidence: analysis.confidence
      });

      return analysis;
    } catch (error) {
      logger.error('Channel strategy analysis failed:', {
        competitorId,
        marketSegment,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private calculateOverallEffectiveness(
    performanceMetrics: ChannelPerformanceMetrics,
    opportunityAnalysis: ChannelOpportunityAnalysis
  ): ChannelEffectivenessScore {
    const currentScore = performanceMetrics.effectiveness || 0.5;
    const potentialScore = Math.min(1, currentScore + (opportunityAnalysis.expansionPotential || 0.2));
    const improvementAreas = this.identifyImprovementAreas(performanceMetrics);

    return {
      overall: currentScore,
      reach: performanceMetrics.reach,
      engagement: performanceMetrics.engagement,
      conversion: performanceMetrics.conversion,
      efficiency: performanceMetrics.efficiency || 0.5,
      currentScore,
      // Additional custom properties
      potentialScore,
      improvementAreas,
      benchmarkComparison: performanceMetrics.performanceVsBenchmark || 0
    } as ChannelEffectivenessScore & { potentialScore: number; improvementAreas: string[]; benchmarkComparison: number };
  }

  private identifyImprovementAreas(metrics: ChannelPerformanceMetrics): string[] {
    const areas: string[] = [];

    if (metrics.conversion < 0.03) areas.push('Conversion optimization');
    if (metrics.engagement < 0.5) areas.push('Customer engagement');
    if (metrics.reach < 0.6) areas.push('Market reach expansion');
    if ((metrics.efficiency ?? 0) < 0.7) areas.push('Cost efficiency');
    if ((metrics.crossChannelSynergy ?? 0) < 0.5) areas.push('Channel integration');

    return areas;
  }

  private calculateAnalysisConfidence(analysisComponents: unknown[]): number {
    let validComponents = 0;
    let totalComponents = analysisComponents.length;

    for (const component of analysisComponents) {
      if (component && Object.keys(component as object).length > 0) {
        validComponents++;
      }
    }

    return validComponents / Math.max(totalComponents, 1);
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    modules: Record<string, boolean>;
    message?: string;
  }> {
    try {
      const moduleChecks = {
        presenceAnalyzer: true,
        marketAnalyzer: true,
        competitiveAnalyzer: true,
        performanceCalculator: true,
        opportunityIdentifier: true,
        gapAnalyzer: true,
        roiAnalyzer: true,
        strategyGenerator: true,
        dataStore: true
      };

      const allHealthy = Object.values(moduleChecks).every(v => v);

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        modules: moduleChecks,
        message: allHealthy ? 'All modules operational' : 'Some modules may have issues'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        modules: {},
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }
}

// Export singleton instance
export const channelIntelligenceEngine = ChannelIntelligenceEngine.getInstance();

// Export individual modules for direct access if needed
export {
  ChannelPresenceAnalyzer,
  MarketChannelAnalyzer,
  ChannelCompetitiveAnalyzer,
  ChannelPerformanceCalculator,
  ChannelOpportunityIdentifier,
  ChannelGapAnalyzer,
  ChannelROIAnalyzer,
  ChannelStrategyGenerator,
  ChannelDataStore
};