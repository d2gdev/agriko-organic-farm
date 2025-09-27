// Channel Opportunity Identifier
import { logger } from '../../../logger';
import type { ChannelOpportunityAnalysis, ChannelPresenceAnalysis, ChannelCompetitiveAnalysis } from '../../types/config';
import type { ChannelTrendAnalysis, ChannelPresenceData, MarketOpportunityExtended } from './types';

// Type alias for internal use
type MarketOpportunity = MarketOpportunityExtended;

export class ChannelOpportunityIdentifier {
  async identifyChannelOpportunities(
    channelPresence: ChannelPresenceAnalysis,
    competitorChannels: ChannelCompetitiveAnalysis[],
    industryTrends: ChannelTrendAnalysis[]
  ): Promise<ChannelOpportunityAnalysis> {
    try {
      const currentChannels = new Set(channelPresence.channels || []);
      const opportunities = new Map<string, MarketOpportunityExtended>();

      // Identify opportunities from competitor analysis
      this.analyzeCompetitorOpportunities(opportunities, currentChannels, competitorChannels);

      // Identify opportunities from industry trends
      this.analyzeTrendOpportunities(opportunities, currentChannels, industryTrends);

      // Calculate opportunity scores
      const scoredOpportunities = this.scoreOpportunities(
        opportunities,
        channelPresence,
        competitorChannels,
        industryTrends
      );

      // Categorize by priority
      const highPriority = scoredOpportunities.filter(o => o.score >= 0.7);
      const mediumPriority = scoredOpportunities.filter(o => o.score >= 0.5 && o.score < 0.7);
      const lowPriority = scoredOpportunities.filter(o => o.score < 0.5);

      return {
        // Required base fields
        id: `opp-analysis-${Date.now()}`,
        type: 'expansion',
        description: `Identified ${scoredOpportunities.length} channel opportunities`,
        impact: highPriority.length > 3 ? 'high' : mediumPriority.length > 3 ? 'medium' : 'low',
        effort: 'medium',
        priority: 1,
        confidence: 0.75,
        // Extended fields
        totalOpportunities: scoredOpportunities.length,
        highPriorityOpportunities: highPriority.map(o => o.id),
        opportunityDetails: scoredOpportunities,
        untappedChannels: this.identifyUntappedChannels(currentChannels, competitorChannels, industryTrends),
        expansionPotential: this.calculateExpansionPotential(scoredOpportunities),
        marketGaps: this.identifyMarketGaps(currentChannels, competitorChannels),
        innovationOpportunities: this.identifyInnovationOpportunities(industryTrends),
        quickWins: this.identifyQuickWins(scoredOpportunities),
        strategicMoves: this.identifyStrategicMoves(scoredOpportunities),
        timeToMarket: this.estimateTimeToMarket(highPriority),
        resourceRequirements: this.estimateResourceRequirements(highPriority),
        expectedROI: this.estimateExpectedROI(scoredOpportunities),
        riskAssessment: this.assessRisks(scoredOpportunities)
      };
    } catch (error) {
      logger.error('Channel opportunity identification failed:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private analyzeCompetitorOpportunities(
    opportunities: Map<string, MarketOpportunity>,
    currentChannels: Set<string>,
    competitorChannels: ChannelCompetitiveAnalysis[]
  ): void {
    competitorChannels.forEach(competitor => {
      (competitor.channels || []).forEach(channel => {
        const channelName = typeof channel === 'string' ? channel :
          (channel as ChannelPresenceData).name;

        if (!currentChannels.has(channelName)) {
          const existingOpp = opportunities.get(channelName);
          const competitorCount = ((existingOpp?.metrics?.competitorCount as number) || 0) + 1;

          opportunities.set(channelName, {
            id: `channel-${channelName}`,
            type: 'channel-expansion',
            title: `Expand to ${channelName} channel`,
            description: `Competitors are successfully using ${channelName} channel`,
            priority: competitorCount > 2 ? 'high' : 'medium',
            estimatedImpact: competitorCount * 0.2,
            estimatedEffort: 0.5,
            score: 0,
            confidence: 0.7,
            metrics: {
              competitorCount,
              marketShare: 0.1
            }
          });
        }
      });
    });
  }

  private analyzeTrendOpportunities(
    opportunities: Map<string, MarketOpportunity>,
    currentChannels: Set<string>,
    industryTrends: ChannelTrendAnalysis[]
  ): void {
    industryTrends.forEach(trend => {
      if (!currentChannels.has(trend.channel) && trend.growthRate > 0.1) {
        opportunities.set(trend.channel, {
          id: `trend-${trend.channel}`,
          type: 'market-trend',
          title: `Capitalize on ${trend.channel} growth`,
          description: `${trend.channel} shows ${(trend.growthRate * 100).toFixed(0)}% growth`,
          priority: trend.growthRate > 0.2 ? 'high' : 'medium',
          estimatedImpact: trend.growthRate,
          estimatedEffort: 0.6,
          score: 0,
          confidence: trend.confidence,
          metrics: {
            growthRate: trend.growthRate,
            marketShare: trend.marketShare
          }
        });
      }

      // Add emerging opportunities within the channel
      trend.emergingOpportunities.forEach(opp => {
        const oppId = `${trend.channel}-${opp}`;
        opportunities.set(oppId, {
          id: oppId,
          type: 'innovation',
          title: opp,
          description: `Emerging opportunity in ${trend.channel}`,
          priority: 'medium',
          estimatedImpact: 0.4,
          estimatedEffort: 0.7,
          score: 0,
          confidence: trend.confidence * 0.8,
          metrics: {
            channel: trend.channel
          }
        });
      });
    });
  }

  private scoreOpportunities(
    opportunities: Map<string, MarketOpportunity>,
    channelPresence: ChannelPresenceAnalysis,
    competitorChannels: ChannelCompetitiveAnalysis[],
    industryTrends: ChannelTrendAnalysis[]
  ): MarketOpportunityExtended[] {
    const scoredOpportunities: MarketOpportunityExtended[] = [];

    opportunities.forEach(opportunity => {
      const channelName = opportunity.id.split('-')[1] || '';
      const trend = industryTrends.find(t => t.channel === channelName);
      const competitorUsage = competitorChannels.filter(c =>
        c.channels?.some(ch => {
          if (typeof ch === 'string') return ch === channelName;
          if (ch && typeof ch === 'object' && 'name' in ch) return (ch as ChannelPresenceData).name === channelName;
          return false;
        })
      ).length;

      // Calculate opportunity score
      let score = opportunity.estimatedImpact * 0.4;
      score += (1 - opportunity.estimatedEffort) * 0.3;
      if (trend?.growthRate || 0 > 0.1) score += 0.3;
      if (trend?.saturationLevel === 'low') score += 0.2;
      if (competitorUsage > 2) score += 0.1;

      opportunity.score = Math.min(1, score);
      scoredOpportunities.push(opportunity);
    });

    return scoredOpportunities.sort((a, b) => b.score - a.score);
  }

  private identifyUntappedChannels(
    currentChannels: Set<string>,
    competitorChannels: ChannelCompetitiveAnalysis[],
    industryTrends: ChannelTrendAnalysis[]
  ): string[] {
    const untapped = new Set<string>();

    // Channels from trends not being used
    industryTrends.forEach(trend => {
      if (!currentChannels.has(trend.channel) && trend.saturationLevel === 'low') {
        untapped.add(trend.channel);
      }
    });

    // Channels competitors aren't using much
    const competitorChannelCount = new Map<string, number>();
    competitorChannels.forEach(competitor => {
      (competitor.channels || []).forEach(channel => {
        const channelName = typeof channel === 'string' ? channel :
          (channel as ChannelPresenceData).name;
        competitorChannelCount.set(
          channelName,
          (competitorChannelCount.get(channelName) || 0) + 1
        );
      });
    });

    competitorChannelCount.forEach((count, channel) => {
      if (count < 2 && !currentChannels.has(channel)) {
        untapped.add(channel);
      }
    });

    return Array.from(untapped);
  }

  private calculateExpansionPotential(opportunities: MarketOpportunity[]): number {
    const highImpactOpps = opportunities.filter(o => o.estimatedImpact > 0.5);
    return highImpactOpps.length / Math.max(opportunities.length, 1);
  }

  private identifyMarketGaps(
    currentChannels: Set<string>,
    competitorChannels: ChannelCompetitiveAnalysis[]
  ): string[] {
    const gaps: string[] = [];
    const allCompetitorChannels = new Set<string>();

    competitorChannels.forEach(competitor => {
      (competitor.channels || []).forEach(channel => {
        const channelName = typeof channel === 'string' ? channel :
          (channel as ChannelPresenceData).name;
        allCompetitorChannels.add(channelName);
      });
    });

    allCompetitorChannels.forEach(channel => {
      if (!currentChannels.has(channel)) {
        gaps.push(`Missing ${channel} channel presence`);
      }
    });

    return gaps;
  }

  private identifyInnovationOpportunities(trends: ChannelTrendAnalysis[]): string[] {
    const innovations: string[] = [];

    trends.forEach(trend => {
      trend.emergingOpportunities.forEach(opp => {
        innovations.push(opp);
      });
    });

    return innovations;
  }

  private identifyQuickWins(opportunities: MarketOpportunity[]): string[] {
    return opportunities
      .filter(o => o.estimatedEffort < 0.3 && o.estimatedImpact > 0.4)
      .map(o => o.title)
      .slice(0, 3);
  }

  private identifyStrategicMoves(opportunities: MarketOpportunity[]): string[] {
    return opportunities
      .filter(o => o.estimatedImpact > 0.7)
      .map(o => o.title)
      .slice(0, 3);
  }

  private estimateTimeToMarket(opportunities: MarketOpportunity[]): Record<string, number> {
    const timeEstimates: Record<string, number> = {};

    opportunities.forEach(opp => {
      timeEstimates[opp.id] = Math.round(opp.estimatedEffort * 12); // months
    });

    return timeEstimates;
  }

  private estimateResourceRequirements(opportunities: MarketOpportunity[]): Record<string, string> {
    const requirements: Record<string, string> = {};

    opportunities.forEach(opp => {
      const effort = opp.estimatedEffort;
      if (effort < 0.3) requirements[opp.id] = 'low';
      else if (effort < 0.7) requirements[opp.id] = 'medium';
      else requirements[opp.id] = 'high';
    });

    return requirements;
  }

  private estimateExpectedROI(opportunities: MarketOpportunity[]): number {
    const avgImpact = opportunities.reduce((sum, o) => sum + o.estimatedImpact, 0) / Math.max(opportunities.length, 1);
    const avgEffort = opportunities.reduce((sum, o) => sum + o.estimatedEffort, 0) / Math.max(opportunities.length, 1);

    return avgImpact / Math.max(avgEffort, 0.1);
  }

  private assessRisks(opportunities: MarketOpportunity[]): Record<string, 'low' | 'medium' | 'high'> {
    const risks: Record<string, 'low' | 'medium' | 'high'> = {};

    opportunities.forEach(opp => {
      const confidence = opp.confidence || 0.5;
      if (confidence > 0.7) risks[opp.id] = 'low';
      else if (confidence > 0.4) risks[opp.id] = 'medium';
      else risks[opp.id] = 'high';
    });

    return risks;
  }

  assessMarketPotential(channel: string, trends: ChannelTrendAnalysis[]): number {
    const trend = trends.find(t => t.channel === channel);
    return trend ? (trend.growthRate + (1 - trend.marketShare)) / 2 : 0.5;
  }

  identifyRiskFactors(channel: string, trends: ChannelTrendAnalysis[]): string[] {
    const risks: string[] = [];
    const trendData = trends.find(t => t.channel === channel);

    if (trendData?.threatLevel === 'high') risks.push('Market disruption risk');
    if (trendData?.saturationLevel === 'high') risks.push('Market saturation');
    if (!trendData) risks.push('Limited market data');

    return risks;
  }
}