// Predictive Analytics - Core Engine and Orchestration
import { logger } from '@/lib/logger';
import { memgraphService } from '@/lib/memgraph';
import { deepSeekService } from '../../services/deepseek';
import { DataProcessingUtils } from './data-processing';
import { MarketModelEngine } from './market-models';
import { CompetitorModelEngine } from './competitor-models';
import { TrendModelEngine } from './trend-models';
import { RiskAssessmentEngine } from './risk-assessment';
import { OpportunityForecastingEngine } from './opportunity-forecasting';
import { ScenarioAnalysisEngine } from './scenario-analysis';
import type {
  MarketDynamicsModel,
  CompetitorBehaviorModel,
  TrendAnalysisModel,
  PredictiveAnalysisData
} from './types';
import type {
  PredictiveAnalysis,
  MarketForecast,
  CompetitorMovementPrediction,
  TrendPrediction,
  RiskAssessment,
  OpportunityForecast,
  PredictionConfidence,
  PredictiveModelMetrics,
  BusinessIntelligenceConfig
} from '../../types/config';
import { DEFAULT_CONFIG } from '../../types/config';

export class PredictiveAnalyticsEngine {
  private config: BusinessIntelligenceConfig['predictions'];
  private static instance: PredictiveAnalyticsEngine | null = null;
  private marketModels: Map<string, MarketDynamicsModel> = new Map();
  private competitorModels: Map<string, CompetitorBehaviorModel> = new Map();
  private trendModels: Map<string, TrendAnalysisModel> = new Map();

  // Engine instances
  private marketModelEngine = new MarketModelEngine();
  private competitorModelEngine = new CompetitorModelEngine();
  private trendModelEngine = new TrendModelEngine();
  private riskAssessmentEngine = new RiskAssessmentEngine();
  private opportunityForecastingEngine = new OpportunityForecastingEngine();
  private scenarioAnalysisEngine = new ScenarioAnalysisEngine();

  private constructor() {
    this.config = DEFAULT_CONFIG.predictions;
    logger.info('Predictive Analytics Engine initialized');
  }

  public static getInstance(): PredictiveAnalyticsEngine {
    if (!PredictiveAnalyticsEngine.instance) {
      PredictiveAnalyticsEngine.instance = new PredictiveAnalyticsEngine();
    }
    return PredictiveAnalyticsEngine.instance;
  }

  async generateComprehensiveForecast(
    marketSegment: string,
    timeHorizon: number = 12, // months
    _contextData?: Record<string, unknown>
  ): Promise<PredictiveAnalysis> {
    try {
      logger.info('Starting comprehensive predictive analysis', {
        marketSegment,
        timeHorizon
      });

      // Initialize or update prediction models
      await this.initializePredictionModels(marketSegment);

      // Generate multiple forecast components
      const [
        marketForecast,
        competitorPredictions,
        trendPredictions,
        riskAssessment,
        opportunityForecast
      ] = await Promise.all([
        this.generateMarketForecast(marketSegment, timeHorizon),
        this.predictCompetitorMovements(marketSegment, timeHorizon),
        this.analyzeTrendPredictions(marketSegment, timeHorizon),
        this.riskAssessmentEngine.assessPredictiveRisks(marketSegment, timeHorizon),
        this.opportunityForecastingEngine.forecastOpportunities(marketSegment, timeHorizon)
      ]);

      // Generate scenario analysis
      const scenarios = await this.scenarioAnalysisEngine.generateScenarioAnalysis(
        marketSegment,
        timeHorizon,
        {
          marketForecast,
          competitorPredictions,
          trendPredictions,
          _contextData
        }
      );

      // Calculate overall confidence and model performance
      const confidence = this.calculatePredictionConfidence([
        marketForecast,
        competitorPredictions,
        trendPredictions,
        riskAssessment
      ]);

      const _modelMetrics = this.calculateModelMetrics(); // Currently unused

      // Generate AI-powered strategic insights
      const strategicInsights = await this.generateStrategicInsights(
        marketForecast,
        competitorPredictions,
        trendPredictions,
        scenarios,
        _contextData
      );

      // Store predictions in graph database
      await this.storePredictiveAnalysis(marketSegment, {
        marketForecast,
        competitorPredictions,
        trendPredictions,
        scenarios,
        strategicInsights
      });

      const analysis: PredictiveAnalysis = {
        id: `pred-${Date.now()}`,
        type: 'market',
        timeframe: `${timeHorizon} months`,
        confidence: confidence.overall,
        predictions: [marketForecast],
        risks: [riskAssessment],
        opportunities: [opportunityForecast],
        recommendations: await this.generateActionableRecommendations(
          marketForecast,
          competitorPredictions,
          trendPredictions
        )
      };

      logger.info('Comprehensive predictive analysis completed', {
        marketSegment,
        timeHorizon,
        scenarioCount: scenarios.length,
        overallConfidence: confidence.overall
      });

      return analysis;
    } catch (error) {
      logger.error('Comprehensive forecast generation failed:', {
        marketSegment,
        timeHorizon,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializePredictionModels(marketSegment: string): Promise<void> {
    try {
      // Initialize market dynamics model
      if (!this.marketModels.has(marketSegment)) {
        const marketModel = await this.marketModelEngine.buildMarketDynamicsModel(marketSegment);
        this.marketModels.set(marketSegment, marketModel);
      }

      // Initialize competitor behavior models
      const competitors = [
        { id: 'comp1', name: 'Competitor 1' },
        { id: 'comp2', name: 'Competitor 2' }
      ];
      for (const competitor of competitors) {
        if (!this.competitorModels.has(competitor.id)) {
          const competitorModel = await this.competitorModelEngine.buildCompetitorBehaviorModel(competitor.id);
          this.competitorModels.set(competitor.id, competitorModel);
        }
      }

      // Initialize trend analysis models
      const relevantTrends = await this.identifyRelevantTrends(marketSegment);
      for (const trend of relevantTrends) {
        if (!this.trendModels.has(trend)) {
          const trendModel = await this.trendModelEngine.buildTrendAnalysisModel(trend);
          this.trendModels.set(trend, trendModel);
        }
      }

      logger.debug('Prediction models initialized', {
        marketSegment,
        marketModels: this.marketModels.size,
        competitorModels: this.competitorModels.size,
        trendModels: this.trendModels.size
      });
    } catch (error) {
      logger.error('Prediction model initialization failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async generateMarketForecast(
    marketSegment: string,
    timeHorizon: number
  ): Promise<MarketForecast> {
    const marketModel = this.marketModels.get(marketSegment);
    if (!marketModel) {
      throw new Error(`Market model not found for segment: ${marketSegment}`);
    }

    return this.marketModelEngine.generateMarketForecast(marketSegment, timeHorizon, marketModel);
  }

  private async predictCompetitorMovements(
    marketSegment: string,
    timeHorizon: number
  ): Promise<CompetitorMovementPrediction[]> {
    return this.competitorModelEngine.predictCompetitorMovements(
      marketSegment,
      timeHorizon,
      this.competitorModels
    );
  }

  private async analyzeTrendPredictions(
    marketSegment: string,
    timeHorizon: number
  ): Promise<TrendPrediction[]> {
    return this.trendModelEngine.analyzeTrendPredictions(
      marketSegment,
      timeHorizon,
      this.trendModels
    );
  }

  private async generateStrategicInsights(
    marketForecast: MarketForecast,
    competitorPredictions: CompetitorMovementPrediction[],
    trendPredictions: TrendPrediction[],
    scenarios: any[],
    _contextData?: Record<string, unknown>
  ): Promise<string[]> {
    try {
      const prompt = `
        Analyze the following predictive intelligence data and provide strategic insights:

        Market Forecast:
        - Growth Trajectory: ${JSON.stringify(marketForecast.growthProjections.slice(0, 3))}
        - Key Drivers: ${marketForecast.keyDrivers.join(', ')}
        - Risk Factors: ${marketForecast.riskFactors.join(', ')}
        - Emerging Segments: ${marketForecast.emergingSegments.join(', ')}

        Competitor Predictions:
        ${competitorPredictions.slice(0, 3).map(cp => `
        - ${cp.competitorName}: Strategic moves likely (${cp.strategicMoves.slice(0, 2).join(', ')})
        `).join('')}

        Trend Analysis:
        ${trendPredictions.slice(0, 3).map(tp => `
        - ${tp.trend}: ${tp.currentStage} stage, ${tp.disruptionPotential} disruption potential
        `).join('')}

        Scenario Analysis:
        ${scenarios.map(s => `
        - ${s.name}: ${s.probability}% probability, ${s.predictedOutcomes.opportunityScore} opportunity score
        `).join('')}

        Context: ${JSON.stringify(_contextData || {})}

        Provide 5-7 strategic insights focusing on:
        1. Market timing and positioning opportunities
        2. Competitive response strategies
        3. Technology adoption recommendations
        4. Risk mitigation priorities
        5. Investment allocation guidance
        6. Innovation focus areas
        7. Partnership and acquisition targets
      `;

      const aiResponse = await deepSeekService.generateBusinessInsight(prompt);
      return DataProcessingUtils.parseStrategicInsights(aiResponse);
    } catch (error) {
      logger.error('Strategic insights generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return this.generateFallbackInsights(marketForecast, competitorPredictions, trendPredictions);
    }
  }

  private generateFallbackInsights(
    marketForecast: MarketForecast,
    competitorPredictions: CompetitorMovementPrediction[],
    trendPredictions: TrendPrediction[]
  ): string[] {
    const insights: string[] = [];

    if (marketForecast.growthProjections.some(gp => gp.projectedGrowth > 0.1)) {
      insights.push('Market shows strong growth potential - consider aggressive expansion strategy');
    }

    if (competitorPredictions.some(cp => cp.acquisitionProbability > 0.7)) {
      insights.push('High M&A activity expected - monitor acquisition opportunities and threats');
    }

    if (trendPredictions.some(tp => tp.disruptionPotential > 0.8)) {
      insights.push('Disruptive trends emerging - invest in innovation and technology adaptation');
    }

    if (insights.length === 0) {
      insights.push('Maintain current strategic direction while monitoring market developments');
    }

    return insights;
  }

  private async storePredictiveAnalysis(marketSegment: string, analysisData: PredictiveAnalysisData): Promise<void> {
    try {
      const query = `
        MERGE (m:Market {segment: $marketSegment})
        SET m.lastPredictionUpdate = $timestamp,
            m.confidence = $confidence
        WITH m
        UNWIND $predictions as predData
        MERGE (p:Prediction {id: predData.id})
        SET p.type = predData.type,
            p.confidence = predData.confidence,
            p.timeHorizon = predData.timeHorizon,
            p.createdAt = $timestamp
        MERGE (m)-[r:HAS_PREDICTION]->(p)
      `;

      await memgraphService.executeQuery(query, {
        marketSegment,
        timestamp: new Date().toISOString(),
        confidence: 0.75,
        predictions: [
          {
            id: `market-forecast-${Date.now()}`,
            type: 'market_forecast',
            confidence: analysisData.marketForecast?.confidence || 0.7,
            timeHorizon: 12
          }
        ]
      });

      logger.debug('Predictive analysis stored in graph database', { marketSegment });
    } catch (error) {
      logger.error('Failed to store predictive analysis:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Non-critical error, don't throw
    }
  }

  private calculatePredictionConfidence(
    analysisComponents: [MarketForecast, CompetitorMovementPrediction[], TrendPrediction[], RiskAssessment]
  ): PredictionConfidence {
    const confidences: number[] = [];

    // MarketForecast
    confidences.push(analysisComponents[0].confidence);

    // CompetitorMovementPrediction[]
    if (analysisComponents[1].length > 0) {
      confidences.push(analysisComponents[1].reduce((sum, p) => sum + p.probability, 0) / analysisComponents[1].length);
    } else {
      confidences.push(0.7);
    }

    // TrendPrediction[]
    if (analysisComponents[2].length > 0) {
      confidences.push(analysisComponents[2].reduce((sum, p) => sum + p.probability, 0) / analysisComponents[2].length);
    } else {
      confidences.push(0.7);
    }

    // RiskAssessment
    const riskAssessment = analysisComponents[3];
    if (riskAssessment) {
      confidences.push(1 - (riskAssessment.overallRiskScore || 0));
    } else {
      confidences.push(0.7);
    }

    const overall = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

    return {
      overall: Math.max(0.3, Math.min(1, overall)),
      marketForecast: confidences[0] || 0.5,
      competitorPredictions: confidences[1] || 0.5,
      trendAnalysis: confidences[2] || 0.5,
      riskAssessment: confidences[3] || 0.5,
      dataQuality: 0.8,
      modelAccuracy: 0.75,
      modelReliability: 0.75,
      timeframeCertainty: 0.8
    };
  }

  private calculateModelMetrics(): PredictiveModelMetrics {
    return {
      accuracy: 0.78,
      precision: 0.74,
      recall: 0.82,
      f1Score: 0.78,
      meanAbsoluteError: 0.15,
      lastValidation: new Date(),
      trainingDataSize: 1000,
      modelVersion: '1.0'
    };
  }

  private async identifyRelevantTrends(_marketSegment: string): Promise<string[]> {
    return ['artificial-intelligence', 'sustainability', 'digital-transformation'];
  }

  private async generateActionableRecommendations(
    marketForecast: MarketForecast,
    competitorPredictions: CompetitorMovementPrediction[],
    trendPredictions: TrendPrediction[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Market-based recommendations
    if (marketForecast.growthRate > 0.1) {
      recommendations.push('Consider market expansion strategies to capitalize on strong growth');
    }

    if (marketForecast.emergingSegments.length > 0) {
      recommendations.push(`Explore opportunities in emerging segments: ${marketForecast.emergingSegments.join(', ')}`);
    }

    // Competitor-based recommendations
    const highImpactCompetitors = competitorPredictions.filter(p => p.impact === 'high');
    if (highImpactCompetitors.length > 0) {
      recommendations.push('Monitor high-impact competitor movements closely and prepare counter-strategies');
    }

    const highAcquisitionProbability = competitorPredictions.filter(p => p.acquisitionProbability > 0.7);
    if (highAcquisitionProbability.length > 0) {
      recommendations.push('Evaluate acquisition opportunities and defensive positioning');
    }

    // Trend-based recommendations
    const highProbabilityTrends = trendPredictions.filter(t => t.probability > 0.7);
    if (highProbabilityTrends.length > 0) {
      recommendations.push('Prepare for emerging high-probability trends and invest in relevant capabilities');
    }

    const disruptiveTrends = trendPredictions.filter(t => t.disruptionPotential > 0.8);
    if (disruptiveTrends.length > 0) {
      recommendations.push('Develop contingency plans for potentially disruptive trends');
    }

    return recommendations;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      modelsLoaded: number;
      lastPrediction?: Date;
      servicesAvailable: boolean;
    };
  }> {
    try {
      const servicesAvailable = Boolean(
        memgraphService &&
        deepSeekService
      );

      return {
        status: servicesAvailable ? 'healthy' : 'unhealthy',
        details: {
          modelsLoaded: this.marketModels.size + this.competitorModels.size + this.trendModels.size,
          servicesAvailable
        }
      };
    } catch {
      return {
        status: 'unhealthy',
        details: {
          modelsLoaded: 0,
          servicesAvailable: false
        }
      };
    }
  }
}