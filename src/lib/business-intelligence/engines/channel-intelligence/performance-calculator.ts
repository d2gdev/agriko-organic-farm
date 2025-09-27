// Channel Performance Calculator
import { logger } from '../../../logger';
import type { ChannelPerformanceMetrics, ChannelPresenceAnalysis, MarketChannelData } from '../../types/config';
import type { ChannelPresenceData } from './types';

export class ChannelPerformanceCalculator {
  async calculateChannelPerformance(
    channelPresence: ChannelPresenceAnalysis,
    marketData: MarketChannelData
  ): Promise<ChannelPerformanceMetrics> {
    try {
      // Calculate base metrics
      const conversionRate = this.calculateConversionRate(channelPresence, marketData);
      const engagement = channelPresence.engagement || 0.5;
      const reachScore = this.calculateReachScore(channelPresence, marketData);
      const costEfficiency = this.calculateCostEfficiency(channelPresence, marketData);

      // Calculate derived metrics
      const growthPotential = this.calculateGrowthPotential(channelPresence, marketData);
      const effectiveness = this.calculateEffectiveness(
        conversionRate,
        engagement,
        reachScore,
        costEfficiency
      );

      // Calculate ROI
      const roi = conversionRate * 100 - costEfficiency * 50;

      const baseMetrics: ChannelPerformanceMetrics = {
        channelId: 'aggregate',
        channel: channelPresence.channels?.[0] || 'general',
        reach: reachScore,
        engagement,
        conversion: conversionRate,
        cost: 0,
        roi,
        trend: 'stable' as const,
        effectiveness,
        performanceVsBenchmark: this.compareToMarketBenchmarkScore(effectiveness, marketData),
        efficiency: costEfficiency,
        crossChannelSynergy: this.calculateCrossChannelSynergy(channelPresence.channels || [])
      };

      // Return with extended properties
      return {
        ...baseMetrics,
        growthPotential,
        competitivePosition: this.assessCompetitivePosition(channelPresence, marketData),
        customerSatisfaction: this.estimateCustomerSatisfaction(engagement, effectiveness),
        retention: this.estimateRetention(engagement, effectiveness),
        innovationScore: this.calculateInnovationScore(channelPresence, marketData),
        dataPoints: 100, // Mock value
        reliability: 0.8 // Mock value
      } as ChannelPerformanceMetrics & { growthPotential: number; competitivePosition: string; customerSatisfaction: number; retention: number; innovationScore: number; dataPoints: number; reliability: number };
    } catch (error) {
      logger.error('Channel performance calculation failed:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private calculateConversionRate(
    channelPresence: ChannelPresenceAnalysis,
    marketData: MarketChannelData
  ): number {
    // Base conversion rate from market data
    const marketAverage = 0.03; // 3% baseline
    const channelCount = channelPresence.channels?.length || 0;

    // More channels typically mean better conversion through omnichannel presence
    const channelMultiplier = Math.min(1.5, 1 + (channelCount * 0.1));

    // Adjust based on channel strength
    const strengthMultiplier = channelPresence.strength === 'strong' ? 1.2 :
                               channelPresence.strength === 'moderate' ? 1.0 : 0.8;

    return marketAverage * channelMultiplier * strengthMultiplier;
  }

  private calculateReachScore(
    channelPresence: ChannelPresenceAnalysis,
    marketData: MarketChannelData
  ): number {
    const channelCount = channelPresence.channels?.length || 0;
    const marketChannelCount = (marketData.dominantChannels?.length || 0) +
                               (marketData.emergingChannels?.length || 0);

    // Coverage ratio
    const coverage = marketChannelCount > 0 ? channelCount / marketChannelCount : 0.5;

    // Strength bonus
    const strengthBonus = channelPresence.strength === 'strong' ? 0.2 :
                         channelPresence.strength === 'moderate' ? 0.1 : 0;

    return Math.min(1, coverage + strengthBonus);
  }

  private calculateCostEfficiency(
    channelPresence: ChannelPresenceAnalysis,
    marketData: MarketChannelData
  ): number {
    // Estimate cost efficiency based on channel mix and market data
    const channelCount = channelPresence.channels?.length || 0;

    // Too many channels can reduce efficiency
    const optimalChannelCount = 4;
    const efficiencyPenalty = Math.abs(channelCount - optimalChannelCount) * 0.05;

    // Base efficiency adjusted by market saturation
    const baseEfficiency = 0.7;
    const saturationAdjustment = (1 - (marketData.marketSaturation || 0.5)) * 0.2;

    return Math.max(0.3, Math.min(1, baseEfficiency - efficiencyPenalty + saturationAdjustment));
  }

  private calculateGrowthPotential(
    channelPresence: ChannelPresenceAnalysis,
    marketData: MarketChannelData
  ): number {
    // Growth potential based on emerging channels and market growth
    const emergingChannelBonus = (channelPresence.trends?.length || 0) * 0.1;
    const marketGrowthBonus = (marketData.growthRate || 0) * 0.5;
    const saturationPenalty = (marketData.marketSaturation || 0.5) * 0.3;

    return Math.max(0, Math.min(1, 0.5 + emergingChannelBonus + marketGrowthBonus - saturationPenalty));
  }

  private calculateEffectiveness(
    conversionRate: number,
    engagement: number,
    reachScore: number,
    costEfficiency: number
  ): number {
    // Weighted average of key metrics
    const weights = {
      conversion: 0.35,
      engagement: 0.25,
      reach: 0.25,
      efficiency: 0.15
    };

    // Normalize conversion rate (assuming max of 10%)
    const normalizedConversion = Math.min(1, conversionRate / 0.1);

    return (normalizedConversion * weights.conversion) +
           (engagement * weights.engagement) +
           (reachScore * weights.reach) +
           (costEfficiency * weights.efficiency);
  }

  private assessCompetitivePosition(
    channelPresence: ChannelPresenceAnalysis,
    marketData: MarketChannelData
  ): 'leader' | 'challenger' | 'follower' | 'niche' {
    const strength = channelPresence.strength;
    const channelCount = channelPresence.channels?.length || 0;
    const marketChannelCount = (marketData.dominantChannels?.length || 0) +
                               (marketData.emergingChannels?.length || 0);

    if (strength === 'strong' && channelCount >= marketChannelCount * 0.8) {
      return 'leader';
    } else if (strength === 'moderate' && channelCount >= marketChannelCount * 0.6) {
      return 'challenger';
    } else if (channelCount < marketChannelCount * 0.3) {
      return 'niche';
    }
    return 'follower';
  }

  private estimateCustomerSatisfaction(engagement: number, effectiveness: number): number {
    // Customer satisfaction correlates with engagement and effectiveness
    return (engagement * 0.6) + (effectiveness * 0.4);
  }

  private estimateRetention(engagement: number, effectiveness: number): number {
    // Retention is driven by satisfaction and engagement
    const satisfaction = this.estimateCustomerSatisfaction(engagement, effectiveness);
    return (satisfaction * 0.5) + (engagement * 0.3) + (effectiveness * 0.2);
  }

  private calculateCrossChannelSynergy(channels: string[]): number {
    // Synergy increases with complementary channels
    const synergyPairs = [
      ['online', 'retail'],
      ['social', 'online'],
      ['mobile', 'online'],
      ['marketplace', 'direct']
    ];

    let synergyScore = 0;
    for (const [ch1, ch2] of synergyPairs) {
      if (ch1 && ch2 && channels.includes(ch1) && channels.includes(ch2)) {
        synergyScore += 0.25;
      }
    }

    return Math.min(1, synergyScore);
  }

  private calculateInnovationScore(
    channelPresence: ChannelPresenceAnalysis,
    marketData: MarketChannelData
  ): number {
    // Innovation based on emerging channels and trends
    const emergingChannelCount = (channelPresence.trends?.length || 0);
    const emergingMarketChannels = (marketData.emergingChannels?.length || 0);

    const adoptionRate = emergingMarketChannels > 0 ?
      emergingChannelCount / emergingMarketChannels : 0;

    return Math.min(1, adoptionRate + 0.2); // Base innovation score of 0.2
  }

  private compareToMarketBenchmark(
    effectiveness: number,
    marketData: MarketChannelData
  ): 'above' | 'at' | 'below' {
    // Assume market average effectiveness is 0.6
    const marketBenchmark = 0.6;

    if (effectiveness > marketBenchmark + 0.1) return 'above';
    if (effectiveness < marketBenchmark - 0.1) return 'below';
    return 'at';
  }

  private compareToMarketBenchmarkScore(
    effectiveness: number,
    marketData: MarketChannelData
  ): number {
    // Return a numeric score comparing to market benchmark
    const marketBenchmark = 0.6;
    return (effectiveness - marketBenchmark) / marketBenchmark;
  }
}