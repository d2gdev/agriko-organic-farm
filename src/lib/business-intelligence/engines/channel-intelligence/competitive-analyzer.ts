// Channel Competitive Analyzer
import { logger } from '../../../logger';
import type { Competitor } from '../../types/competitor';
import type { ChannelCompetitiveAnalysis } from '../../types/config';
import type { MarketOpportunity } from '@/types/type-safety';
import type { ChannelGapAnalysis, ChannelGapData, ChannelPresenceData, ChannelTrendAnalysis } from './types';
import { ChannelPresenceAnalyzer } from './presence-analyzer';

export class ChannelCompetitiveAnalyzer {
  private presenceAnalyzer: ChannelPresenceAnalyzer;

  constructor() {
    this.presenceAnalyzer = new ChannelPresenceAnalyzer();
  }

  async analyzeCompetitorChannels(
    competitorId: string,
    marketSegment: string
  ): Promise<ChannelCompetitiveAnalysis[]> {
    try {
      // Get competitors in the same market segment - using mock data for now
      const competitors: Array<Pick<Competitor, 'id' | 'name' | 'marketShare'>> = [
        { id: 'comp1', name: 'Competitor 1', marketShare: 0.25 },
        { id: 'comp2', name: 'Competitor 2', marketShare: 0.15 }
      ];

      const competitiveAnalyses: ChannelCompetitiveAnalysis[] = [];

      for (const competitor of competitors) {
        if (competitor.id === competitorId) continue;

        const channelPresence = await this.presenceAnalyzer.analyzeChannelPresence(competitor.id);

        competitiveAnalyses.push({
          competitorId: competitor.id,
          competitorName: competitor.name,
          channels: channelPresence.channels || [],
          competitorCount: 1,
          marketShare: competitor.marketShare || 0,
          positionRank: 1,
          threats: channelPresence.trends || [],
          advantages: [],
          confidence: 0.75
        });
      }

      return competitiveAnalyses;
    } catch (error) {
      logger.error('Competitor channel analysis failed:', {
        competitorId,
        marketSegment,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async analyzeChannelTrends(marketSegment: string): Promise<ChannelTrendAnalysis[]> {
    try {
      // Mock trend data - would normally fetch from external sources
      const trends: ChannelTrendAnalysis[] = [
        {
          channel: 'online',
          growthRate: 0.25,
          marketShare: 0.40,
          saturationLevel: 'medium',
          emergingOpportunities: ['mobile commerce', 'social commerce'],
          threatLevel: 'low',
          confidence: 0.85
        },
        {
          channel: 'retail',
          growthRate: -0.05,
          marketShare: 0.35,
          saturationLevel: 'high',
          emergingOpportunities: ['experiential retail'],
          threatLevel: 'medium',
          confidence: 0.80
        },
        {
          channel: 'marketplace',
          growthRate: 0.35,
          marketShare: 0.25,
          saturationLevel: 'low',
          emergingOpportunities: ['niche marketplaces'],
          threatLevel: 'low',
          confidence: 0.75
        }
      ];

      return trends;
    } catch (error) {
      logger.error('Channel trends analysis failed:', {
        marketSegment,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  synthesizeCompetitiveAnalysis(
    competitorChannels: ChannelCompetitiveAnalysis[],
    gapAnalysis: ChannelGapAnalysis
  ): ChannelCompetitiveAnalysis {
    const allChannels = new Set<string>();
    const allDifferentiators = new Set<string>();
    const allThreats = new Set<string>();

    competitorChannels.forEach(analysis => {
      (analysis.channels || []).forEach(ch => allChannels.add(ch));
      (analysis.threats || []).forEach(threat => allThreats.add(threat));
    });

    return {
      competitorId: 'aggregate',
      competitorName: 'Market Average',
      channels: Array.from(allChannels),
      competitorCount: competitorChannels.length,
      marketShare: competitorChannels.reduce((sum, c) => sum + c.marketShare, 0) / Math.max(competitorChannels.length, 1),
      positionRank: Math.round(competitorChannels.length / 2),
      threats: Array.from(allThreats),
      advantages: [],
      confidence: competitorChannels.reduce((sum, c) => sum + (c.confidence || 0), 0) / Math.max(competitorChannels.length, 1)
    };
  }

  private calculateOpportunityAlignment(channels: string[], marketSegment: string): number {
    // Simple alignment calculation based on channel presence
    const digitalChannels = channels.filter(ch =>
      ['online', 'mobile', 'marketplace', 'social'].includes(ch)
    );
    const traditionalChannels = channels.filter(ch =>
      ['retail', 'wholesale', 'direct'].includes(ch)
    );

    // Digital-first markets score higher with more digital channels
    if (marketSegment.toLowerCase().includes('tech') || marketSegment.toLowerCase().includes('digital')) {
      return digitalChannels.length / Math.max(channels.length, 1);
    }

    // Balance traditional and digital for other markets
    const balance = Math.abs(digitalChannels.length - traditionalChannels.length) / Math.max(channels.length, 1);
    return 1 - balance; // Higher score for better balance
  }

  identifyCompetitiveBarriers(
    channel: string,
    competitorChannels: ChannelCompetitiveAnalysis[]
  ): string[] {
    const barriers: string[] = [];

    const competitorCount = competitorChannels.filter(c =>
      c.channels?.some(ch => {
        if (typeof ch === 'string') return ch === channel;
        if (ch && typeof ch === 'object' && 'name' in ch) return (ch as ChannelPresenceData).name === channel;
        return false;
      })
    ).length;

    if (competitorCount > 3) barriers.push('High competition');
    if (competitorCount > 1) barriers.push('Established players');

    return barriers;
  }

  identifyChannelGaps(
    currentChannels: Set<string>,
    competitorChannels: ChannelCompetitiveAnalysis[],
    marketData: { dominantChannels?: string[]; emergingChannels?: string[] }
  ): ChannelGapData {
    const competitorChannelMap = new Map<string, number>();

    // Count competitor channel usage
    competitorChannels.forEach(competitor => {
      (competitor.channels || []).forEach(channel => {
        const channelName = typeof channel === 'string' ? channel :
          (channel as ChannelPresenceData).name;
        competitorChannelMap.set(
          channelName,
          (competitorChannelMap.get(channelName) || 0) + 1
        );
      });
    });

    const missingChannels: string[] = [];
    const underutilizedChannels: string[] = [];
    const overinvestedChannels: string[] = [];
    const competitorAdvantages: ChannelGapData['competitorAdvantages'] = [];

    // Identify missing channels (competitors have, we don't)
    competitorChannelMap.forEach((count, channelName) => {
      if (!currentChannels.has(channelName)) {
        if (!competitorChannelMap.has(channelName)) {
          missingChannels.push(channelName);
        }
      }
    });

    // Identify underutilized channels (in emerging channels but not being used)
    (marketData.emergingChannels || []).forEach(channel => {
      if (!currentChannels.has(channel)) {
        underutilizedChannels.push(channel);
      }
    });

    // Identify overinvested channels (we have but low effectiveness)
    currentChannels.forEach(channel => {
      const competitorUsage = competitorChannelMap.get(channel) || 0;
      if (competitorUsage === 0 && !(marketData.dominantChannels || []).includes(channel)) {
        overinvestedChannels.push(channel);
      }
    });

    // Identify competitor advantages
    competitorChannels.forEach(competitor => {
      (competitor.channels || []).forEach(channel => {
        const channelName = typeof channel === 'string' ? channel :
          (channel as ChannelPresenceData).name;
        if (!currentChannels.has(channelName)) {
          competitorAdvantages.push({
            channel: channelName,
            competitor: competitor.competitorName || 'Unknown',
            advantage: 'Market presence',
            impactLevel: 'medium'
          });
        }
      });
    });

    return {
      missingChannels,
      underutilizedChannels,
      overinvestedChannels,
      competitorAdvantages
    };
  }
}