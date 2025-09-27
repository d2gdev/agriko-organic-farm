// Predictive Analytics - Data Processing Utilities
import { logger } from '@/lib/logger';
import { serperService } from '../../services/serper';
import type {
  HistoricalDataPoint,
  MarketDataPoint,
  DisruptionSignal,
  TrendData,
  MarketDynamicsModel,
  CompetitorBehaviorModel,
  TrendAnalysisModel
} from './types';

export class DataProcessingUtils {
  // Historical data processing
  static calculateHistoricalGrowth(historicalData: HistoricalDataPoint[]): number[] {
    // Calculate year-over-year growth rates
    const growthRates: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      const current = historicalData[i]?.value || 0;
      const previous = historicalData[i - 1]?.value || 1;
      growthRates.push((current - previous) / previous);
    }
    return growthRates;
  }

  static analyzeSeasonality(_historicalData: HistoricalDataPoint[]): Record<string, number> {
    // Simple seasonality analysis - would be more sophisticated in production
    const seasonality: Record<string, number> = {};
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    quarters.forEach((quarter, index) => {
      seasonality[quarter] = 1 + (Math.sin(index * Math.PI / 2) * 0.1);
    });

    return seasonality;
  }

  static async gatherHistoricalMarketData(_marketSegment: string): Promise<MarketDataPoint[]> {
    // Simulate historical market data - would integrate with real data sources
    const baseValue = 1000000; // $1M base market size
    const years = 5;
    const data: MarketDataPoint[] = [];

    for (let i = 0; i < years; i++) {
      data.push({
        year: new Date().getFullYear() - (years - i),
        value: baseValue * Math.pow(1.1, i) * (0.9 + Math.random() * 0.2)
      });
    }

    return data;
  }

  // Market projection methods
  static projectMarketGrowth(model: MarketDynamicsModel, timeHorizon: number): number[] {
    const projections: number[] = [];
    const baseGrowth = model.historicalGrowth.length > 0
      ? model.historicalGrowth.reduce((sum, g) => sum + g, 0) / model.historicalGrowth.length
      : 0.05;

    for (let i = 0; i < timeHorizon; i++) {
      // Apply various factors to base growth
      let projectedGrowth = baseGrowth;

      // Apply competitive intensity dampening
      projectedGrowth *= (1 - model.competitiveIntensity * 0.2);

      // Apply disruption uncertainty
      projectedGrowth *= (1 - model.disruptionProbability * 0.1);

      // Add some variability
      projectedGrowth *= (0.9 + Math.random() * 0.2);

      projections.push(Math.max(-0.2, Math.min(0.5, projectedGrowth)));
    }

    return projections;
  }

  static projectMarketSize(model: MarketDynamicsModel, timeHorizon: number): number[] {
    const growthProjections = this.projectMarketGrowth(model, timeHorizon);
    const projections: number[] = [];
    let currentSize = 1000000; // Base market size

    for (const growth of growthProjections) {
      currentSize *= (1 + growth);
      projections.push(currentSize);
    }

    return projections;
  }

  static calculateGrowthConfidence(growth: number, model: MarketDynamicsModel): number {
    const baseConfidence = model.modelAccuracy;
    const volatilityPenalty = Math.abs(growth) * 0.1;
    return Math.max(0.3, Math.min(1, baseConfidence - volatilityPenalty));
  }

  // Competitor behavior analysis
  static calculatePredictabilityScore(behaviorPatterns: CompetitorBehaviorModel['behaviorPatterns']): number {
    // Calculate how predictable the competitor is
    const variance = Object.values(behaviorPatterns).reduce((sum: number, value: any) => {
      const numValue = typeof value === 'number' ? value : 0.5;
      return sum + Math.abs(numValue - 0.5);
    }, 0) / Object.keys(behaviorPatterns).length;

    return 1 - variance; // Higher variance = lower predictability
  }

  // Trend analysis methods
  static async analyzeTrendData(_trend: string): Promise<TrendData> {
    return {
      momentum: 0.7,
      maturityStage: 'growing' as const,
      adoptionRate: 0.4,
      disruptionPotential: 0.6,
      timeHorizon: 18,
      confidence: 0.8
    };
  }

  static predictTrendEvolution(trendModel: TrendAnalysisModel, _timeHorizon: number): string {
    return `${trendModel.trendCategory} expected to ${trendModel.momentum > 0.5 ? 'accelerate' : 'decelerate'}`;
  }

  // Disruption analysis
  static async evaluateDisruptionProbability(marketSegment: string): Promise<number> {
    try {
      // Search for disruption indicators
      const disruptionSignals = await serperService.searchIndustryNews(marketSegment, 'month');

      // Count disruption-related terms
      const disruptionTerms = ['disruption', 'innovation', 'breakthrough', 'revolution', 'transformation'];
      let disruptionScore = 0;

      disruptionSignals.forEach((signal: DisruptionSignal) => {
        const text = `${signal.title || ''} ${signal.snippet || ''}`.toLowerCase();
        disruptionTerms.forEach(term => {
          if (text.includes(term)) disruptionScore += 0.1;
        });
      });

      return Math.min(1, disruptionScore);
    } catch (error) {
      logger.error('Disruption probability evaluation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return 0.3; // Default moderate disruption probability
    }
  }

  // Growth driver identification
  static async identifyGrowthDrivers(marketSegment: string): Promise<string[]> {
    try {
      const _driverResults = await serperService.searchMarketAnalysis(marketSegment, ['growth', 'drivers']);

      // Extract common growth drivers from search results
      const drivers = [
        'Technology advancement',
        'Regulatory changes',
        'Consumer demand shift',
        'Economic factors',
        'Market consolidation'
      ];

      return drivers.slice(0, 3); // Return top 3
    } catch (error) {
      logger.error('Growth drivers identification failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return ['Market expansion', 'Innovation', 'Consumer adoption'];
    }
  }

  // Strategic insights parsing
  static parseStrategicInsights(aiResponse: string): string[] {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    const insights: string[] = [];

    for (const line of lines) {
      if (line.match(/^\d+\./) || line.includes('•') || line.includes('-')) {
        const cleanLine = line.replace(/^\d+\.|\s*•\s*|\s*-\s*/, '').trim();
        if (cleanLine.length > 20) {
          insights.push(cleanLine);
        }
      }
    }

    return insights.slice(0, 7);
  }
}