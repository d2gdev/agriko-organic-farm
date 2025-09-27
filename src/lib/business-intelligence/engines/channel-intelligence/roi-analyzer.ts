// Channel ROI Analyzer
import { logger } from '../../../logger';
import type { ChannelPresenceAnalysis, MarketChannelData } from '../../types/config';
import type { ChannelROIAnalysis, ChannelTrendAnalysis, ChannelPresenceData } from './types';

export class ChannelROIAnalyzer {
  async analyzeChannelROI(
    channelPresence: ChannelPresenceAnalysis,
    marketData: MarketChannelData,
    industryTrends: ChannelTrendAnalysis[]
  ): Promise<ChannelROIAnalysis[]> {
    try {
      const roiAnalyses: ChannelROIAnalysis[] = [];

      // Analyze ROI for existing channels
      const existingChannels = channelPresence.channels || [];
      for (const channelName of existingChannels) {
        const channel: ChannelPresenceData = {
          name: channelName,
          type: this.inferChannelType(channelName),
          reach: 'national',
          maturity: 'established',
          performanceIndicators: [],
          investmentLevel: 'medium'
        };

        const roiAnalysis = this.calculateChannelROI(channel, marketData, industryTrends);
        roiAnalyses.push(roiAnalysis);
      }

      // Analyze potential ROI for missing dominant channels
      const missingDominantChannels = (marketData.dominantChannels || [])
        .filter(ch => !existingChannels.includes(ch));

      for (const channelName of missingDominantChannels) {
        const channel: ChannelPresenceData = {
          name: channelName,
          type: this.inferChannelType(channelName),
          reach: 'national',
          maturity: 'growth',
          performanceIndicators: [],
          investmentLevel: 'high'
        };

        const roiAnalysis = this.calculateChannelROI(channel, marketData, industryTrends);
        roiAnalyses.push(roiAnalysis);
      }

      // Sort by estimated ROI
      return roiAnalyses.sort((a, b) => b.estimatedROI - a.estimatedROI);
    } catch (error) {
      logger.error('Channel ROI analysis failed:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private calculateChannelROI(
    channel: ChannelPresenceData,
    marketData: MarketChannelData,
    industryTrends: ChannelTrendAnalysis[]
  ): ChannelROIAnalysis {
    const trendData = industryTrends.find(t => t.channel === channel.name);
    const marketEffectiveness = marketData.channelEffectiveness?.[channel.type] || 0.5;

    const estimatedROI = this.calculateEstimatedROI(channel, marketEffectiveness, trendData);
    const investmentRequired = this.estimateChannelInvestment(channel);
    const timeToBreakeven = this.estimateBreakevenTime(channel, marketEffectiveness);
    const riskFactors = this.identifyChannelRisks(channel, trendData);
    const successProbability = this.calculateSuccessProbability(channel, marketEffectiveness, trendData);
    const competitiveBarriers = this.identifyChannelBarriers(channel, marketData);

    return {
      channel: channel.name,
      estimatedROI,
      investmentRequired,
      timeToBreakeven,
      riskFactors,
      successProbability,
      competitiveBarriers
    };
  }

  private calculateEstimatedROI(
    channel: ChannelPresenceData,
    marketEffectiveness: number,
    trendData?: ChannelTrendAnalysis
  ): number {
    let baseROI = marketEffectiveness;

    // Adjust for growth rate
    if ((trendData?.growthRate ?? 0) > 0.1) baseROI *= 1.2;
    if ((trendData?.growthRate ?? 0) > 0.2) baseROI *= 1.3;

    // Adjust for investment level
    if (channel.investmentLevel === 'high') baseROI *= 0.8;
    if (channel.investmentLevel === 'low') baseROI *= 1.2;

    // Adjust for maturity
    if (channel.maturity === 'emerging') baseROI *= 1.4;
    if (channel.maturity === 'established') baseROI *= 0.9;

    return Math.min(3, Math.max(0, baseROI));
  }

  private estimateChannelInvestment(channel: ChannelPresenceData): number {
    const baseInvestments: Record<string, number> = {
      'online': 100000,
      'retail': 500000,
      'marketplace': 50000,
      'social': 30000,
      'mobile': 150000,
      'wholesale': 200000,
      'partners': 75000,
      'direct': 250000
    };

    let investment = baseInvestments[channel.name] || 100000;

    // Adjust for investment level
    if (channel.investmentLevel === 'high') investment *= 1.5;
    if (channel.investmentLevel === 'low') investment *= 0.5;

    return investment;
  }

  private estimateBreakevenTime(
    channel: ChannelPresenceData,
    marketEffectiveness: number
  ): number {
    const baseTime = 12; // months

    // Faster breakeven with higher effectiveness
    const effectivenessMultiplier = 2 - marketEffectiveness;

    // Adjust for channel maturity
    let maturityMultiplier = 1;
    if (channel.maturity === 'established') maturityMultiplier = 0.8;
    if (channel.maturity === 'emerging') maturityMultiplier = 1.3;

    return Math.round(baseTime * effectivenessMultiplier * maturityMultiplier);
  }

  private identifyChannelRisks(
    channel: ChannelPresenceData,
    trendData?: ChannelTrendAnalysis
  ): string[] {
    const risks: string[] = [];

    // Maturity risks
    if (channel.maturity === 'emerging') {
      risks.push('Technology adoption risk');
      risks.push('Market acceptance uncertainty');
    }

    // Trend risks
    if (trendData?.threatLevel === 'high') {
      risks.push('Competitive pressure');
      risks.push('Market disruption risk');
    }

    if (trendData?.saturationLevel === 'high') {
      risks.push('Market saturation');
      risks.push('Diminishing returns');
    }

    // Investment risks
    if (channel.investmentLevel === 'high') {
      risks.push('High capital requirement');
      risks.push('Long payback period');
    }

    // Channel-specific risks
    if (channel.type === 'digital') {
      risks.push('Cybersecurity threats');
      risks.push('Platform dependency');
    }

    if (channel.type === 'physical') {
      risks.push('Fixed cost burden');
      risks.push('Geographic limitations');
    }

    return risks;
  }

  private calculateSuccessProbability(
    channel: ChannelPresenceData,
    marketEffectiveness: number,
    trendData?: ChannelTrendAnalysis
  ): number {
    let probability = 0.5;

    // Base probability on market effectiveness
    probability = marketEffectiveness;

    // Adjust for channel maturity
    if (channel.maturity === 'established') probability += 0.1;
    if (channel.maturity === 'emerging') probability -= 0.1;

    // Adjust for growth trends
    if ((trendData?.growthRate ?? 0) > 0.1) probability += 0.1;
    if ((trendData?.growthRate ?? 0) < 0) probability -= 0.1;

    // Adjust for investment level
    if (channel.investmentLevel === 'high') probability -= 0.05;
    if (channel.investmentLevel === 'low') probability += 0.05;

    // Adjust for threat level
    if (trendData?.threatLevel === 'high') probability -= 0.15;
    if (trendData?.threatLevel === 'low') probability += 0.1;

    return Math.min(1, Math.max(0, probability));
  }

  private identifyChannelBarriers(
    channel: ChannelPresenceData,
    marketData: MarketChannelData
  ): string[] {
    const barriers: string[] = [];

    // Check if channel is dominated by others
    if ((marketData.dominantChannels || []).includes(channel.name)) {
      barriers.push('Established competition');
      barriers.push('High market share requirements');
    }

    // Check regulatory factors
    if ((marketData.regulatoryFactors || []).length > 0) {
      barriers.push('Regulatory compliance');
      marketData.regulatoryFactors?.forEach(factor => {
        if (factor) barriers.push(factor);
      });
    }

    // Investment barriers
    if (channel.investmentLevel === 'high') {
      barriers.push('High capital requirements');
    }

    // Market barriers
    if (marketData.marketSaturation && marketData.marketSaturation > 0.7) {
      barriers.push('Market saturation');
    }

    // Channel-specific barriers
    if (channel.type === 'digital') {
      barriers.push('Technical infrastructure');
      barriers.push('Digital marketing expertise');
    }

    if (channel.type === 'physical') {
      barriers.push('Real estate costs');
      barriers.push('Inventory management');
    }

    return barriers;
  }

  private inferChannelType(channelName: string): string {
    const digitalChannels = ['online', 'mobile', 'marketplace', 'social'];
    const physicalChannels = ['retail', 'wholesale'];
    const indirectChannels = ['partners', 'resellers'];

    if (digitalChannels.includes(channelName)) return 'digital';
    if (physicalChannels.includes(channelName)) return 'physical';
    if (indirectChannels.includes(channelName)) return 'indirect';
    return 'hybrid';
  }

  estimateInvestmentRequired(channel: string): number {
    const baseInvestments: Record<string, number> = {
      'online': 100000,
      'retail': 500000,
      'marketplace': 50000,
      'social': 30000,
      'mobile': 150000,
      'wholesale': 200000,
      'partners': 75000,
      'direct': 250000
    };

    return baseInvestments[channel] || 100000;
  }

  estimateTimeToMarket(channel: string): number {
    const timeEstimates: Record<string, number> = {
      'online': 3,
      'marketplace': 1,
      'social': 1,
      'mobile': 6,
      'retail': 12,
      'wholesale': 6,
      'partners': 4,
      'direct': 9
    };

    return timeEstimates[channel] || 6;
  }
}