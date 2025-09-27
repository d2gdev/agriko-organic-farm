// Channel Gap Analyzer
import { logger } from '../../../logger';
import type { ChannelPresenceAnalysis, MarketChannelData } from '../../types/config';
import type { ChannelCompetitiveAnalysis } from '../../types/config';
import type { ChannelGapAnalysis, ChannelGapData, ChannelPresenceData } from './types';

export class ChannelGapAnalyzer {
  async performChannelGapAnalysis(
    channelPresence: ChannelPresenceAnalysis,
    competitorChannels: ChannelCompetitiveAnalysis[],
    marketData: MarketChannelData
  ): Promise<ChannelGapAnalysis> {
    try {
      const currentChannels = new Set(channelPresence.channels || []);

      // Identify different types of gaps
      const gapData = this.identifyChannelGaps(currentChannels, competitorChannels, marketData);

      // Generate strategic recommendations based on gaps
      const recommendations = this.generateGapRecommendations(gapData, marketData);

      return {
        missingChannels: gapData.missingChannels,
        underutilizedChannels: gapData.underutilizedChannels,
        overinvestedChannels: gapData.overinvestedChannels,
        competitorAdvantages: gapData.competitorAdvantages,
        strategicRecommendations: recommendations
      };
    } catch (error) {
      logger.error('Channel gap analysis failed:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private identifyChannelGaps(
    currentChannels: Set<string>,
    competitorChannels: ChannelCompetitiveAnalysis[],
    marketData: MarketChannelData
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
      if (!currentChannels.has(channelName) && count >= 2) {
        missingChannels.push(channelName);
      }
    });

    // Add market-dominant channels we're missing
    (marketData.dominantChannels || []).forEach(channel => {
      if (!currentChannels.has(channel) && !missingChannels.includes(channel)) {
        missingChannels.push(channel);
      }
    });

    // Identify underutilized channels (emerging channels not being used)
    (marketData.emergingChannels || []).forEach(channel => {
      if (!currentChannels.has(channel)) {
        underutilizedChannels.push(channel);
      }
    });

    // Identify overinvested channels
    currentChannels.forEach(channel => {
      const competitorUsage = competitorChannelMap.get(channel) || 0;
      const isDominant = (marketData.dominantChannels || []).includes(channel);
      const isDeclining = (marketData.decliningChannels || []).includes(channel);

      if (isDeclining || (competitorUsage === 0 && !isDominant)) {
        overinvestedChannels.push(channel);
      }
    });

    // Identify competitor advantages
    competitorChannels.forEach(competitor => {
      (competitor.channels || []).forEach(channel => {
        const channelName = typeof channel === 'string' ? channel :
          (channel as ChannelPresenceData).name;

        if (!currentChannels.has(channelName)) {
          const existing = competitorAdvantages.find(
            adv => adv.channel === channelName && adv.competitor === competitor.competitorName
          );

          if (!existing) {
            competitorAdvantages.push({
              channel: channelName,
              competitor: competitor.competitorName || 'Unknown',
              advantage: this.describeCompetitorAdvantage(channelName, competitor),
              impactLevel: 'medium' as 'low' | 'medium' | 'high'
            });
          }
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

  private generateGapRecommendations(
    gapData: ChannelGapData,
    marketData: MarketChannelData
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations for missing channels
    if (gapData.missingChannels.length > 0) {
      const priorityChannels = gapData.missingChannels
        .filter(ch => (marketData.dominantChannels || []).includes(ch))
        .slice(0, 2);

      if (priorityChannels.length > 0) {
        recommendations.push(
          `Establish presence in ${priorityChannels.join(' and ')} channels to match market leaders`
        );
      }
    }

    // Recommendations for underutilized opportunities
    if (gapData.underutilizedChannels.length > 0) {
      recommendations.push(
        `Explore emerging channels: ${gapData.underutilizedChannels.slice(0, 2).join(', ')} for first-mover advantage`
      );
    }

    // Recommendations for overinvested channels
    if (gapData.overinvestedChannels.length > 0) {
      recommendations.push(
        `Optimize or reduce investment in ${gapData.overinvestedChannels[0]} channel`
      );
    }

    // Recommendations based on competitor advantages
    const highImpactAdvantages = gapData.competitorAdvantages
      .filter(adv => adv.impactLevel === 'high')
      .slice(0, 2);

    highImpactAdvantages.forEach(adv => {
      recommendations.push(
        `Counter ${adv.competitor}'s ${adv.channel} dominance with differentiated approach`
      );
    });

    // Add general strategic recommendations
    if (marketData.customerPreferences && marketData.customerPreferences.length > 0) {
      const topPreference = marketData.customerPreferences[0];
      recommendations.push(
        `Align channel strategy with customer preference for ${topPreference}`
      );
    }

    return recommendations;
  }

  private describeCompetitorAdvantage(
    channel: string,
    _competitor: ChannelCompetitiveAnalysis
  ): string {
    return `${channel} market presence`;
  }


  assessGrowthPotential(channel: string, marketData: MarketChannelData): number {
    const channelName = channel.toLowerCase();
    if ((marketData.emergingChannels || []).includes(channelName)) return 0.9;
    if ((marketData.dominantChannels || []).includes(channelName)) return 0.6;
    if ((marketData.decliningChannels || []).includes(channelName)) return 0.2;
    return 0.5;
  }
}