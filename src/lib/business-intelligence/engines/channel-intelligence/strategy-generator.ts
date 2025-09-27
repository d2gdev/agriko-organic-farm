// Channel Strategy Generator
import { logger } from '../../../logger';
import { deepSeekService } from '../../services/deepseek';
import type {
  ChannelStrategyRecommendation,
  ChannelPresenceAnalysis,
  ChannelPerformanceMetrics,
  ChannelOpportunityAnalysis
} from '../../types/config';
import type { ChannelGapAnalysis } from './types';

export class ChannelStrategyGenerator {
  async generateChannelStrategyRecommendations(
    channelPresence: ChannelPresenceAnalysis,
    performanceMetrics: ChannelPerformanceMetrics,
    opportunityAnalysis: ChannelOpportunityAnalysis,
    gapAnalysis: ChannelGapAnalysis,
    contextData?: Record<string, unknown>
  ): Promise<ChannelStrategyRecommendation[]> {
    try {
      // Generate AI-powered recommendations
      const aiRecommendations = await this.generateAIRecommendations(
        channelPresence,
        performanceMetrics,
        opportunityAnalysis,
        gapAnalysis,
        contextData
      );

      // Fallback to rule-based recommendations if AI fails
      if (!aiRecommendations || aiRecommendations.length === 0) {
        return this.generateFallbackRecommendations(
          channelPresence,
          performanceMetrics,
          opportunityAnalysis,
          gapAnalysis
        );
      }

      return aiRecommendations;
    } catch (error) {
      logger.error('Strategy recommendation generation failed:', { error: error instanceof Error ? error.message : String(error) });
      // Return fallback recommendations on error
      return this.generateFallbackRecommendations(
        channelPresence,
        performanceMetrics,
        opportunityAnalysis,
        gapAnalysis
      );
    }
  }

  private async generateAIRecommendations(
    channelPresence: ChannelPresenceAnalysis,
    performanceMetrics: ChannelPerformanceMetrics,
    opportunityAnalysis: ChannelOpportunityAnalysis,
    gapAnalysis: ChannelGapAnalysis,
    contextData?: Record<string, unknown>
  ): Promise<ChannelStrategyRecommendation[]> {
    try {
      const prompt = this.buildStrategyPrompt(
        channelPresence,
        performanceMetrics,
        opportunityAnalysis,
        gapAnalysis,
        contextData
      );

      const aiResponse = await deepSeekService.analyzeCompetitorData({ prompt, type: 'strategy' });

      return this.parseStrategyRecommendations(aiResponse);
    } catch (error) {
      logger.error('AI recommendation generation failed:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  private buildStrategyPrompt(
    channelPresence: ChannelPresenceAnalysis,
    performanceMetrics: ChannelPerformanceMetrics,
    opportunityAnalysis: ChannelOpportunityAnalysis,
    gapAnalysis: ChannelGapAnalysis,
    contextData?: Record<string, unknown>
  ): string {
    return `
      Analyze the following channel strategy data and provide recommendations:

      Current Channel Presence:
      - Channels: ${channelPresence.channels?.join(', ') || 'None'}
      - Strength: ${channelPresence.strength}
      - Engagement: ${channelPresence.engagement?.toFixed(2) || 'N/A'}

      Performance Metrics:
      - Effectiveness: ${performanceMetrics.effectiveness?.toFixed(2) || 'N/A'}
      - Conversion: ${performanceMetrics.conversion?.toFixed(3) || 'N/A'}
      - Growth Potential: ${(performanceMetrics as any).growthPotential?.toFixed(2) || 'N/A'}
      - Position: ${(performanceMetrics as any).competitivePosition || 'N/A'}

      Opportunities:
      - High Priority: ${opportunityAnalysis.highPriorityOpportunities?.length || 0} opportunities
      - Quick Wins: ${opportunityAnalysis.quickWins?.join(', ') || 'None'}
      - Strategic Moves: ${opportunityAnalysis.strategicMoves?.join(', ') || 'None'}

      Gaps:
      - Missing Channels: ${gapAnalysis.missingChannels?.join(', ') || 'None'}
      - Underutilized: ${gapAnalysis.underutilizedChannels?.join(', ') || 'None'}
      - Overinvested: ${gapAnalysis.overinvestedChannels?.join(', ') || 'None'}

      Additional Context:
      ${contextData ? JSON.stringify(contextData, null, 2) : 'None'}

      Provide 3-5 strategic recommendations for channel optimization.
      Each recommendation should include:
      1. Title (brief action statement)
      2. Description (detailed explanation)
      3. Priority (high/medium/low)
      4. Impact (high/medium/low)
      5. Effort (high/medium/low)
      6. Timeframe (immediate/short-term/long-term)
    `;
  }

  private parseStrategyRecommendations(aiResponse: string): ChannelStrategyRecommendation[] {
    const recommendations: Partial<ChannelStrategyRecommendation>[] = [];
    const lines = aiResponse.split('\n');
    let currentRec: Partial<ChannelStrategyRecommendation> = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.includes('Recommendation') || trimmedLine.match(/^\d+\./)) {
        if (currentRec.title) {
          recommendations.push(currentRec);
        }
        currentRec = {
          recommendationId: `rec-${Date.now()}-${recommendations.length}`,
          channelId: 'multi-channel',
          channelName: 'Multi-Channel Strategy',
          confidence: 0.75
        };
      }

      if (trimmedLine.includes('Title:')) {
        currentRec.title = trimmedLine.replace('Title:', '').trim();
      } else if (trimmedLine.includes('Description:')) {
        currentRec.description = trimmedLine.replace('Description:', '').trim();
      } else if (trimmedLine.includes('Priority:')) {
        currentRec.priority = trimmedLine.replace('Priority:', '').trim()
          .toLowerCase() as 'high' | 'medium' | 'low';
      } else if (trimmedLine.includes('Impact:')) {
        currentRec.impact = trimmedLine.replace('Impact:', '').trim()
          .toLowerCase() as 'high' | 'medium' | 'low';
      } else if (trimmedLine.includes('Effort:')) {
        currentRec.effort = trimmedLine.replace('Effort:', '').trim()
          .toLowerCase() as 'high' | 'medium' | 'low';
      } else if (trimmedLine.includes('Timeframe:')) {
        currentRec.timeframe = trimmedLine.replace('Timeframe:', '').trim()
          .toLowerCase() as 'immediate' | 'short-term' | 'long-term';
      }
    }

    if (currentRec.title) {
      recommendations.push(currentRec);
    }

    // Validate and complete recommendations
    return recommendations
      .filter(rec => rec.title && rec.description)
      .map((rec, index): ChannelStrategyRecommendation => ({
        // Required fields
        id: rec.recommendationId || `rec-${Date.now()}-${index}`,
        title: rec.title!,
        description: rec.description!,
        category: 'targeting',
        impact: rec.impact || 'medium',
        urgency: rec.timeframe === 'immediate' ? 'immediate' :
                 rec.timeframe === 'short-term' ? 'short_term' : 'long_term',
        resources: this.identifyDependencies(rec),
        confidence: rec.confidence || 0.75,
        // Extended fields
        recommendationId: rec.recommendationId || `rec-${Date.now()}-${index}`,
        channelId: rec.channelId || 'multi-channel',
        channelName: rec.channelName || 'Multi-Channel Strategy',
        priority: rec.priority || 'medium',
        effort: rec.effort || 'medium',
        timeframe: rec.timeframe || 'short-term',
        estimatedROI: this.estimateRecommendationROI(rec)
      }));
  }

  generateFallbackRecommendations(
    channelPresence: ChannelPresenceAnalysis,
    performanceMetrics: ChannelPerformanceMetrics,
    opportunityAnalysis: ChannelOpportunityAnalysis,
    gapAnalysis: ChannelGapAnalysis
  ): ChannelStrategyRecommendation[] {
    const recommendations: ChannelStrategyRecommendation[] = [];
    const timestamp = Date.now();

    // Recommendation 1: Address high-priority opportunities
    if ((opportunityAnalysis.highPriorityOpportunities || []).length > 0) {
      recommendations.push({
        id: `rec-${timestamp}-1`,
        title: 'Capitalize on High-Priority Channel Opportunities',
        description: `Focus on ${opportunityAnalysis.highPriorityOpportunities?.length} high-priority opportunities identified, including ${opportunityAnalysis.quickWins?.slice(0, 2).join(' and ') || 'quick wins'}`,
        category: 'targeting',
        impact: 'high',
        urgency: 'immediate',
        resources: ['Budget approval', 'Team capacity'],
        confidence: 0.85,
        // Extended properties
        recommendationId: `rec-${timestamp}-1`,
        channelId: 'opportunity-based',
        channelName: 'Opportunity-Based Strategy',
        priority: 'high',
        effort: 'medium',
        timeframe: 'immediate',
        estimatedROI: opportunityAnalysis.expectedROI || 1.5
      });
    }

    // Recommendation 2: Improve underperforming channels
    const firstChannel = channelPresence.channels?.[0];
    if (firstChannel && (performanceMetrics.effectiveness ?? 0) < 0.5) {
      recommendations.push({
        id: `rec-${timestamp}-2`,
        title: `Optimize ${firstChannel} Channel Performance`,
        description: `Current effectiveness is ${((performanceMetrics.effectiveness ?? 0) * 100).toFixed(0)}%. Implement targeted improvements to reach market benchmark.`,
        category: 'content',
        impact: 'medium',
        urgency: 'short_term',
        resources: ['Current channel infrastructure'],
        confidence: 0.75,
        // Extended properties
        recommendationId: `rec-${timestamp}-2`,
        channelId: firstChannel,
        channelName: firstChannel,
        priority: 'high',
        effort: 'low',
        timeframe: 'short-term',
        estimatedROI: 1.3
      } as ChannelStrategyRecommendation);
    }

    // Recommendation 3: Address channel gaps
    if (gapAnalysis.missingChannels.length > 0) {
      const topMissingChannel = gapAnalysis.missingChannels[0];
      recommendations.push({
        id: `rec-${timestamp}-3`,
        title: `Establish Presence in ${topMissingChannel} Channel`,
        description: `Competitors are leveraging ${topMissingChannel} successfully. Establish presence to capture market share.`,
        category: 'targeting',
        impact: 'high',
        urgency: 'long_term',
        resources: ['Strategic alignment', 'Resource allocation'],
        confidence: 0.7,
        // Extended properties
        recommendationId: `rec-${timestamp}-3`,
        channelId: topMissingChannel,
        channelName: topMissingChannel,
        priority: 'medium',
        effort: 'high',
        timeframe: 'long-term',
        estimatedROI: 1.2
      } as ChannelStrategyRecommendation);
    }

    return recommendations;
  }

  private generateImplementationSteps(title: string): string[] {
    const steps: string[] = [];

    if (title.toLowerCase().includes('optimize')) {
      steps.push('Conduct performance audit');
      steps.push('Identify improvement areas');
      steps.push('Implement changes');
      steps.push('Monitor results');
    } else if (title.toLowerCase().includes('establish') || title.toLowerCase().includes('expand')) {
      steps.push('Market research and feasibility');
      steps.push('Develop channel strategy');
      steps.push('Build infrastructure');
      steps.push('Launch and iterate');
    } else {
      steps.push('Define objectives');
      steps.push('Plan implementation');
      steps.push('Execute strategy');
      steps.push('Measure and optimize');
    }

    return steps;
  }

  private generateSuccessCriteria(title: string): string[] {
    const criteria: string[] = [];

    if (title.toLowerCase().includes('performance')) {
      criteria.push('20% improvement in KPIs');
      criteria.push('Positive customer feedback');
    } else if (title.toLowerCase().includes('channel')) {
      criteria.push('Successful channel launch');
      criteria.push('Target market penetration');
    } else {
      criteria.push('Achieve strategic objectives');
      criteria.push('Positive ROI');
    }

    return criteria;
  }

  private identifyImplementationRisks(rec: Partial<ChannelStrategyRecommendation>): string[] {
    const risks: string[] = [];

    if (rec.effort === 'high') risks.push('Resource constraints');
    if (rec.timeframe === 'long-term') risks.push('Market changes');
    if (rec.impact === 'high') risks.push('Execution complexity');

    return risks.length > 0 ? risks : ['Standard implementation risks'];
  }

  private identifyDependencies(rec: Partial<ChannelStrategyRecommendation>): string[] {
    const dependencies: string[] = [];

    if (rec.effort === 'high') dependencies.push('Budget approval');
    if (rec.priority === 'high') dependencies.push('Executive sponsorship');
    dependencies.push('Team availability');

    return dependencies;
  }

  private estimateRecommendationROI(rec: Partial<ChannelStrategyRecommendation>): number {
    let roi = 1.0;

    if (rec.impact === 'high') roi += 0.5;
    if (rec.effort === 'low') roi += 0.3;
    if (rec.timeframe === 'immediate') roi += 0.2;

    return roi;
  }

  identifyUniqueChannels(channels: string[]): string[] {
    return Array.from(new Set(channels));
  }
}