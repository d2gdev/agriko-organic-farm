// Predictive Analytics - Scenario Analysis and Generation
import { logger } from '@/lib/logger';
import type {
  PredictionScenario,
  ScenarioInput
} from './types';

export class ScenarioAnalysisEngine {
  async generateScenarioAnalysis(
    marketSegment: string,
    timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario[]> {
    try {
      const scenarios: PredictionScenario[] = [];

      // Base case scenario
      scenarios.push(await this.generateBaseScenario(marketSegment, timeHorizon, inputData));

      // Optimistic scenario
      scenarios.push(await this.generateOptimisticScenario(marketSegment, timeHorizon, inputData));

      // Pessimistic scenario
      scenarios.push(await this.generatePessimisticScenario(marketSegment, timeHorizon, inputData));

      // Disruption scenario
      scenarios.push(await this.generateDisruptionScenario(marketSegment, timeHorizon, inputData));

      // AI-generated scenarios based on specific context
      if (inputData._contextData) {
        const customScenarios = await this.generateCustomScenarios(
          marketSegment,
          timeHorizon,
          inputData
        );
        scenarios.push(...customScenarios);
      }

      return scenarios;
    } catch (error) {
      logger.error('Scenario analysis generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  private async generateBaseScenario(
    _marketSegment: string,
    _timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario> {
    // Extract key metrics from input data for base scenario
    const baseGrowth = inputData.marketForecast.growthRate || 0.05;
    const baseMarketSize = inputData.marketForecast.marketSize || 1000000;
    const competitorCount = inputData.competitorPredictions.length;

    return {
      scenarioId: 'base-scenario',
      name: 'Base Case',
      probability: 0.6,
      keyAssumptions: [
        'Current market trends continue',
        'No major disruptions occur',
        'Competitive landscape remains stable',
        'Economic conditions stay consistent'
      ],
      predictedOutcomes: {
        marketGrowth: Math.max(0, baseGrowth * 0.9), // Slightly conservative
        competitorPositions: this.generateCompetitorPositions(competitorCount, 'stable'),
        riskLevel: 'medium' as const,
        opportunityScore: 0.6
      },
      impactAnalysis: {
        revenue: baseMarketSize * 0.15, // Assume 15% market share
        marketShare: 0.15,
        riskExposure: 0.3
      }
    };
  }

  private async generateOptimisticScenario(
    _marketSegment: string,
    _timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario> {
    const baseGrowth = inputData.marketForecast.growthRate || 0.05;
    const baseMarketSize = inputData.marketForecast.marketSize || 1000000;
    const competitorCount = inputData.competitorPredictions.length;

    return {
      scenarioId: 'optimistic-scenario',
      name: 'Optimistic Case',
      probability: 0.25,
      keyAssumptions: [
        'Favorable market conditions prevail',
        'Strong economic growth supports demand',
        'Key partnerships accelerate growth',
        'Technology adoption exceeds expectations',
        'Competitive advantages are maintained'
      ],
      predictedOutcomes: {
        marketGrowth: baseGrowth * 2.5, // Significantly higher growth
        competitorPositions: this.generateCompetitorPositions(competitorCount, 'favorable'),
        riskLevel: 'low' as const,
        opportunityScore: 0.85
      },
      impactAnalysis: {
        revenue: baseMarketSize * 0.25, // Higher market share
        marketShare: 0.25,
        riskExposure: 0.1
      }
    };
  }

  private async generatePessimisticScenario(
    _marketSegment: string,
    _timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario> {
    const baseGrowth = inputData.marketForecast.growthRate || 0.05;
    const baseMarketSize = inputData.marketForecast.marketSize || 1000000;
    const competitorCount = inputData.competitorPredictions.length;

    return {
      scenarioId: 'pessimistic-scenario',
      name: 'Pessimistic Case',
      probability: 0.15,
      keyAssumptions: [
        'Economic downturn affects market demand',
        'Increased competitive pressure',
        'Regulatory challenges emerge',
        'Technology adoption slows',
        'Customer spending decreases'
      ],
      predictedOutcomes: {
        marketGrowth: Math.min(0, baseGrowth - 0.1), // Negative or minimal growth
        competitorPositions: this.generateCompetitorPositions(competitorCount, 'aggressive'),
        riskLevel: 'high' as const,
        opportunityScore: 0.25
      },
      impactAnalysis: {
        revenue: baseMarketSize * 0.08, // Reduced market share
        marketShare: 0.08,
        riskExposure: 0.7
      }
    };
  }

  private async generateDisruptionScenario(
    _marketSegment: string,
    _timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario> {
    const baseGrowth = inputData.marketForecast.growthRate || 0.05;
    const baseMarketSize = inputData.marketForecast.marketSize || 1000000;
    const competitorCount = inputData.competitorPredictions.length;

    // Assess disruption potential from trends
    const highDisruptionTrends = inputData.trendPredictions.filter(
      t => t.disruptionPotential > 0.7
    );

    return {
      scenarioId: 'disruption-scenario',
      name: 'Market Disruption Case',
      probability: highDisruptionTrends.length > 0 ? 0.2 : 0.1,
      keyAssumptions: [
        'Major technology disruption occurs',
        'New business models emerge',
        'Customer behavior shifts dramatically',
        'Market boundaries dissolve',
        'First-mover advantages are critical'
      ],
      predictedOutcomes: {
        marketGrowth: baseGrowth * 3, // Explosive growth in new paradigm
        competitorPositions: this.generateCompetitorPositions(competitorCount, 'disrupted'),
        riskLevel: 'high' as const,
        opportunityScore: 0.9
      },
      impactAnalysis: {
        revenue: baseMarketSize * 0.3, // High reward for adaptation
        marketShare: 0.3,
        riskExposure: 0.8 // High risk, high reward
      }
    };
  }

  private async generateCustomScenarios(
    marketSegment: string,
    timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario[]> {
    const customScenarios: PredictionScenario[] = [];

    // Analyze context data to generate specific scenarios
    const contextKeys = Object.keys(inputData._contextData || {});

    if (contextKeys.includes('geographic_expansion')) {
      customScenarios.push(await this.generateGeographicExpansionScenario(
        marketSegment,
        timeHorizon,
        inputData
      ));
    }

    if (contextKeys.includes('merger_acquisition')) {
      customScenarios.push(await this.generateMergerAcquisitionScenario(
        marketSegment,
        timeHorizon,
        inputData
      ));
    }

    if (contextKeys.includes('regulatory_change')) {
      customScenarios.push(await this.generateRegulatoryChangeScenario(
        marketSegment,
        timeHorizon,
        inputData
      ));
    }

    return customScenarios;
  }

  private async generateGeographicExpansionScenario(
    _marketSegment: string,
    _timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario> {
    const baseMarketSize = inputData.marketForecast.marketSize || 1000000;
    const competitorCount = inputData.competitorPredictions.length;

    return {
      scenarioId: 'geographic-expansion-scenario',
      name: 'Geographic Expansion',
      probability: 0.4,
      keyAssumptions: [
        'International markets open opportunities',
        'Local partnerships facilitate entry',
        'Regulatory approval is obtained',
        'Cultural adaptation is successful'
      ],
      predictedOutcomes: {
        marketGrowth: 0.15, // Moderate growth from expansion
        competitorPositions: this.generateCompetitorPositions(competitorCount, 'expansion'),
        riskLevel: 'medium' as const,
        opportunityScore: 0.75
      },
      impactAnalysis: {
        revenue: baseMarketSize * 0.2, // Expanded market access
        marketShare: 0.18,
        riskExposure: 0.4
      }
    };
  }

  private async generateMergerAcquisitionScenario(
    _marketSegment: string,
    _timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario> {
    const baseMarketSize = inputData.marketForecast.marketSize || 1000000;
    const competitorCount = inputData.competitorPredictions.length;

    return {
      scenarioId: 'merger-acquisition-scenario',
      name: 'M&A Consolidation',
      probability: 0.3,
      keyAssumptions: [
        'Industry consolidation accelerates',
        'Synergies are realized effectively',
        'Integration challenges are managed',
        'Market power increases'
      ],
      predictedOutcomes: {
        marketGrowth: 0.08, // Modest growth through consolidation
        competitorPositions: this.generateCompetitorPositions(Math.max(1, competitorCount - 1), 'consolidated'),
        riskLevel: 'medium' as const,
        opportunityScore: 0.7
      },
      impactAnalysis: {
        revenue: baseMarketSize * 0.22, // Increased market share through M&A
        marketShare: 0.22,
        riskExposure: 0.35
      }
    };
  }

  private async generateRegulatoryChangeScenario(
    _marketSegment: string,
    _timeHorizon: number,
    inputData: ScenarioInput
  ): Promise<PredictionScenario> {
    const baseGrowth = inputData.marketForecast.growthRate || 0.05;
    const baseMarketSize = inputData.marketForecast.marketSize || 1000000;
    const competitorCount = inputData.competitorPredictions.length;

    return {
      scenarioId: 'regulatory-change-scenario',
      name: 'Regulatory Transformation',
      probability: 0.35,
      keyAssumptions: [
        'Significant regulatory changes implemented',
        'Compliance costs increase substantially',
        'Market access rules change',
        'Some competitors exit due to compliance burden'
      ],
      predictedOutcomes: {
        marketGrowth: baseGrowth * 0.7, // Reduced growth due to regulatory friction
        competitorPositions: this.generateCompetitorPositions(competitorCount, 'regulatory'),
        riskLevel: 'high' as const,
        opportunityScore: 0.55
      },
      impactAnalysis: {
        revenue: baseMarketSize * 0.16, // Moderate impact on revenue
        marketShare: 0.16,
        riskExposure: 0.6
      }
    };
  }

  private generateCompetitorPositions(
    competitorCount: number,
    scenarioType: 'stable' | 'favorable' | 'aggressive' | 'disrupted' | 'expansion' | 'consolidated' | 'regulatory'
  ): Record<string, number> {
    const positions: Record<string, number> = {};

    for (let i = 1; i <= competitorCount; i++) {
      const competitorId = `comp${i}`;
      let basePosition = 0.2; // Base market share

      switch (scenarioType) {
        case 'stable':
          basePosition = 0.15 + (i * 0.05); // Gradual distribution
          break;
        case 'favorable':
          basePosition = Math.max(0.1, 0.25 - (i * 0.05)); // We maintain advantage
          break;
        case 'aggressive':
          basePosition = 0.1 + (i * 0.08); // Competitors gain share
          break;
        case 'disrupted':
          basePosition = Math.random() * 0.15; // Highly volatile positions
          break;
        case 'expansion':
          basePosition = 0.12 + (i * 0.03); // Diluted by new entrants
          break;
        case 'consolidated':
          basePosition = i <= 2 ? 0.25 + (i * 0.05) : 0.05; // Winner-take-most
          break;
        case 'regulatory':
          basePosition = Math.max(0.05, 0.2 - (i * 0.03)); // Some exit, others struggle
          break;
      }

      positions[competitorId] = Math.min(0.4, Math.max(0.02, basePosition));
    }

    return positions;
  }
}