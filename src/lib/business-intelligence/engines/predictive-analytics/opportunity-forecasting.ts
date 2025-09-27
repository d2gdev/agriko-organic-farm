// Predictive Analytics - Opportunity Forecasting and Analysis
import { logger } from '@/lib/logger';
import type {
  Opportunity
} from './types';
import type {
  OpportunityForecast,
  OpportunityTrend
} from '../../types/config';

export class OpportunityForecastingEngine {
  async forecastOpportunities(
    marketSegment: string,
    timeHorizon: number
  ): Promise<OpportunityForecast> {
    try {
      // Identify different types of opportunities
      const [
        marketOpportunities,
        technologyOpportunities,
        channelOpportunities,
        partnershipOpportunities
      ] = await Promise.all([
        this.identifyMarketOpportunities(marketSegment, timeHorizon),
        this.identifyTechnologyOpportunities(marketSegment, timeHorizon),
        this.identifyChannelOpportunities(marketSegment, timeHorizon),
        this.identifyPartnershipOpportunities(marketSegment, timeHorizon)
      ]);

      const allOpportunities = [
        ...marketOpportunities,
        ...technologyOpportunities,
        ...channelOpportunities,
        ...partnershipOpportunities
      ];

      // Score and prioritize opportunities
      const scoredOpportunities = allOpportunities.map(opp => ({
        ...opp,
        priorityScore: this.calculateOpportunityPriorityScore(opp),
        feasibilityScore: this.assessOpportunityFeasibility(opp),
        timingSensitivity: this.assessTimingSensitivity(opp)
      }));

      return {
        opportunityType: 'comprehensive',
        potential: allOpportunities.reduce((sum, opp) => sum + (opp.expectedValue || 0), 0) / allOpportunities.length,
        timeframe: `${timeHorizon} months`,
        requirements: ['Market analysis', 'Investment capital', 'Strategic planning'],
        risks: ['Market volatility', 'Competition', 'Execution risk'],
        totalOpportunities: allOpportunities.length,
        highPriorityOpportunities: scoredOpportunities
          .filter(opp => (opp.priorityScore ?? 0) > 0.7)
          .map(opp => ({
            id: opp.id,
            description: opp.description,
            category: opp.category,
            expectedValue: opp.expectedValue,
            timeWindow: opp.timeWindow,
            confidence: opp.confidence
          })),
        emergingOpportunities: scoredOpportunities
          .filter(opp => (opp.timingSensitivity ?? 0) > 0.8)
          .map(opp => ({
            id: opp.id,
            description: opp.description,
            category: opp.category,
            expectedValue: opp.expectedValue,
            timeWindow: opp.timeWindow,
            confidence: opp.confidence
          })),
        opportunityTrends: this.analyzeOpportunityTrends(scoredOpportunities),
        investmentRecommendations: await this.generateInvestmentRecommendations(scoredOpportunities),
        timingRecommendations: this.generateTimingRecommendations(scoredOpportunities)
      };
    } catch (error) {
      logger.error('Opportunity forecasting failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async identifyMarketOpportunities(
    _marketSegment: string,
    _timeHorizon: number
  ): Promise<Opportunity[]> {
    return [
      {
        id: 'market-expansion',
        description: 'Geographic market expansion opportunity',
        category: 'market',
        expectedValue: 1000000,
        timeWindow: '6-12 months',
        confidence: 0.7
      },
      {
        id: 'segment-diversification',
        description: 'New customer segment diversification',
        category: 'market',
        expectedValue: 750000,
        timeWindow: '9-15 months',
        confidence: 0.6
      },
      {
        id: 'premium-tier',
        description: 'Premium product tier opportunity',
        category: 'market',
        expectedValue: 1250000,
        timeWindow: '12-18 months',
        confidence: 0.8
      }
    ];
  }

  private async identifyTechnologyOpportunities(
    _marketSegment: string,
    _timeHorizon: number
  ): Promise<Opportunity[]> {
    return [
      {
        id: 'ai-integration',
        description: 'AI technology integration opportunity',
        category: 'technology',
        expectedValue: 500000,
        timeWindow: '12-18 months',
        confidence: 0.6
      },
      {
        id: 'automation-upgrade',
        description: 'Process automation and optimization',
        category: 'technology',
        expectedValue: 800000,
        timeWindow: '6-9 months',
        confidence: 0.75
      },
      {
        id: 'data-monetization',
        description: 'Data analytics and monetization opportunity',
        category: 'technology',
        expectedValue: 600000,
        timeWindow: '9-12 months',
        confidence: 0.65
      }
    ];
  }

  private async identifyChannelOpportunities(
    _marketSegment: string,
    _timeHorizon: number
  ): Promise<Opportunity[]> {
    return [
      {
        id: 'digital-channels',
        description: 'Digital channel expansion opportunity',
        category: 'channel',
        expectedValue: 300000,
        timeWindow: '3-6 months',
        confidence: 0.8
      },
      {
        id: 'partnership-channels',
        description: 'Channel partnership development',
        category: 'channel',
        expectedValue: 450000,
        timeWindow: '6-9 months',
        confidence: 0.7
      },
      {
        id: 'direct-sales',
        description: 'Direct sales channel optimization',
        category: 'channel',
        expectedValue: 350000,
        timeWindow: '3-6 months',
        confidence: 0.85
      }
    ];
  }

  private async identifyPartnershipOpportunities(
    _marketSegment: string,
    _timeHorizon: number
  ): Promise<Opportunity[]> {
    return [
      {
        id: 'strategic-partnership',
        description: 'Strategic partnership opportunity',
        category: 'partnership',
        expectedValue: 750000,
        timeWindow: '6-9 months',
        confidence: 0.5
      },
      {
        id: 'joint-venture',
        description: 'Joint venture for market entry',
        category: 'partnership',
        expectedValue: 1100000,
        timeWindow: '12-24 months',
        confidence: 0.4
      },
      {
        id: 'supplier-integration',
        description: 'Supplier integration and optimization',
        category: 'partnership',
        expectedValue: 400000,
        timeWindow: '6-12 months',
        confidence: 0.7
      }
    ];
  }

  private calculateOpportunityPriorityScore(opportunity: Opportunity): number {
    // Calculate priority based on expected value, confidence, and timing sensitivity
    const valueScore = Math.min(1, opportunity.expectedValue / 1000000); // Normalize to $1M
    const confidenceScore = opportunity.confidence;
    const timingScore = this.assessTimingSensitivity(opportunity);

    return (valueScore * 0.4) + (confidenceScore * 0.4) + (timingScore * 0.2);
  }

  private assessOpportunityFeasibility(opportunity: Opportunity): number {
    // Simple feasibility assessment based on confidence and time window
    let feasibilityScore = opportunity.confidence;

    // Adjust based on time window - shorter windows may be more feasible
    const timeWindow = opportunity.timeWindow || '12 months';
    if (timeWindow.includes('3-6')) feasibilityScore += 0.1;
    else if (timeWindow.includes('6-9')) feasibilityScore += 0.05;
    else if (timeWindow.includes('12-24')) feasibilityScore -= 0.1;

    // Category-based adjustments
    if (opportunity.category === 'technology') feasibilityScore -= 0.1; // Tech is complex
    else if (opportunity.category === 'channel') feasibilityScore += 0.05; // Channels are easier

    return Math.max(0, Math.min(1, feasibilityScore));
  }

  private assessTimingSensitivity(opportunity: Opportunity): number {
    const timeWindow = opportunity.timeWindow || '12 months';
    if (timeWindow.includes('3-6')) return 0.9; // Very time sensitive
    if (timeWindow.includes('6-9')) return 0.7; // Moderately time sensitive
    if (timeWindow.includes('6-12')) return 0.6; // Somewhat time sensitive
    if (timeWindow.includes('9-12')) return 0.5; // Less time sensitive
    if (timeWindow.includes('12-18')) return 0.4; // Lower time sensitivity
    if (timeWindow.includes('12-24')) return 0.3; // Long-term opportunity
    return 0.5; // Default
  }

  private analyzeOpportunityTrends(opportunities: Opportunity[]): OpportunityTrend[] {
    // Analyze trends from opportunities
    const trends: OpportunityTrend[] = [];

    if (opportunities.length === 0) return trends;

    // Group opportunities by category
    const categories = Array.from(new Set(opportunities.map(o => o.category)));

    categories.forEach(category => {
      const categoryOpportunities = opportunities.filter(o => o.category === category);
      const avgConfidence = categoryOpportunities.reduce((sum, o) => sum + (o.confidence || 0), 0) / categoryOpportunities.length;
      const avgPriorityScore = categoryOpportunities.reduce((sum, o) => sum + (o.priorityScore || 0), 0) / categoryOpportunities.length;
      const totalValue = categoryOpportunities.reduce((sum, o) => sum + (o.expectedValue || 0), 0);

      trends.push({
        trendId: `${category}-trend-${Date.now()}`,
        trendName: `${category.charAt(0).toUpperCase() + category.slice(1)} Opportunities`,
        direction: avgPriorityScore > 0.6 ? 'increasing' : avgPriorityScore < 0.4 ? 'decreasing' : 'stable',
        velocity: avgPriorityScore,
        impactedOpportunities: categoryOpportunities.map(o => o.id),
        durationMonths: 12,
        confidence: avgConfidence,
        keyIndicators: [
          `${category} market growth`,
          `${category} investment trends`,
          `${category} competitive landscape`
        ]
      });
    });

    // Overall market opportunity trend
    const avgConfidence = opportunities.reduce((sum, o) => sum + (o.confidence || 0), 0) / opportunities.length;
    const avgScore = opportunities.reduce((sum, o) => sum + (o.priorityScore || o.expectedValue / 1000000 || 0), 0) / opportunities.length;

    trends.push({
      trendId: `overall-trend-${Date.now()}`,
      trendName: 'Overall Market Opportunity Growth',
      direction: avgScore > 0.6 ? 'increasing' : avgScore < 0.4 ? 'decreasing' : 'stable',
      velocity: avgScore,
      impactedOpportunities: opportunities.map(o => o.id),
      durationMonths: 12,
      confidence: avgConfidence,
      keyIndicators: ['Market expansion', 'Technology adoption', 'Channel optimization']
    });

    return trends;
  }

  private async generateInvestmentRecommendations(opportunities: Opportunity[]): Promise<string[]> {
    const recommendations: Set<string> = new Set();

    // High-priority recommendations
    const highPriority = opportunities.filter(o => (o.priorityScore ?? 0) > 0.7);
    if (highPriority.length > 0) {
      recommendations.add('Prioritize investment in high-priority opportunities with strong ROI potential');
    }

    // Category-based recommendations
    const categories = Array.from(new Set(opportunities.map(o => o.category)));
    categories.forEach(category => {
      const categoryOpps = opportunities.filter(o => o.category === category);
      const avgValue = categoryOpps.reduce((sum, o) => sum + o.expectedValue, 0) / categoryOpps.length;

      if (category === 'technology' && avgValue > 500000) {
        recommendations.add('Invest in technology opportunities for long-term competitive advantage');
      } else if (category === 'market' && avgValue > 750000) {
        recommendations.add('Focus on market expansion opportunities for revenue growth');
      } else if (category === 'channel' && categoryOpps.length > 2) {
        recommendations.add('Diversify channel investments to reduce dependency risk');
      }
    });

    // Time-based recommendations
    const shortTerm = opportunities.filter(o => o.timeWindow.includes('3-6'));
    if (shortTerm.length > 0) {
      recommendations.add('Allocate resources to quick-win opportunities first');
    }

    // Risk-based recommendations
    const highConfidence = opportunities.filter(o => o.confidence > 0.7);
    const lowRisk = opportunities.filter(o => o.confidence > 0.6 && (o.feasibilityScore ?? 0) > 0.7);

    if (highConfidence.length > lowRisk.length * 0.5) {
      recommendations.add('Balance high-confidence opportunities with calculated risks for portfolio optimization');
    }

    return Array.from(recommendations);
  }

  private generateTimingRecommendations(opportunities: Opportunity[]): string[] {
    const recommendations: Set<string> = new Set();

    // Time-sensitive opportunities
    const timeSensitive = opportunities.filter(o => (o.timingSensitivity ?? 0) > 0.8);
    if (timeSensitive.length > 0) {
      recommendations.add('Act immediately on time-sensitive opportunities to avoid missing windows');
    }

    // Sequencing recommendations
    const shortTerm = opportunities.filter(o => o.timeWindow.includes('3-6') || o.timeWindow.includes('6-9'));
    const longTerm = opportunities.filter(o => o.timeWindow.includes('12-18') || o.timeWindow.includes('12-24'));

    if (shortTerm.length > 0 && longTerm.length > 0) {
      recommendations.add('Execute short-term opportunities while planning for long-term initiatives');
    }

    // Category-based timing
    const techOpps = opportunities.filter(o => o.category === 'technology');
    const marketOpps = opportunities.filter(o => o.category === 'market');

    if (techOpps.length > 0 && marketOpps.length > 0) {
      recommendations.add('Sequence technology investments before market expansion for better positioning');
    }

    // Resource allocation timing
    const highValue = opportunities.filter(o => o.expectedValue > 750000);
    if (highValue.length > 2) {
      recommendations.add('Stagger high-value opportunity execution to manage resource constraints');
    }

    return Array.from(recommendations);
  }
}