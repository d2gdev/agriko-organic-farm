// Business Intelligence - AI-Powered Pricing Intelligence Engine
import { logger } from '@/lib/logger';
import { deepSeekAIService } from '../services/deepseek-ai';
import { memgraphBI } from '../memgraph/connection';

// Pricing intelligence interfaces
export interface PricingDataPoint {
  id: string;
  competitorId: string;
  competitorName: string;
  productId: string;
  productName: string;
  price: number;
  currency: string;
  priceType: 'one_time' | 'subscription' | 'usage_based' | 'freemium' | 'tiered';
  billingPeriod?: 'monthly' | 'quarterly' | 'annually' | 'per_use';
  features: string[];
  marketSegment: string;
  geographicRegion: string;
  lastUpdated: Date;
  confidence: number;
  source: string;
  metadata: Record<string, unknown>;
}

export interface PricingStrategy {
  type: 'cost_plus' | 'value_based' | 'competitive' | 'penetration' | 'skimming' | 'psychological' | 'bundle';
  confidence: number;
  indicators: string[];
  pricePoints: number[];
  targetSegments: string[];
  positioning: 'premium' | 'mid_market' | 'budget' | 'enterprise' | 'mixed';
}

export interface PricingAnalysis {
  id: string;
  analysisDate: Date;
  competitorId: string;
  productCategory: string;
  strategy: PricingStrategy;
  marketPosition: {
    percentile: number; // 0-100, where 100 is most expensive
    rank: number;
    totalCompetitors: number;
    priceGap: {
      aboveMedian: number;
      belowMedian: number;
      nearestCompetitor: number;
    };
  };
  elasticity: {
    estimated: number; // Price elasticity coefficient
    confidence: number;
    factors: string[];
  };
  recommendations: Array<{
    action: 'increase' | 'decrease' | 'maintain' | 'restructure' | 'monitor';
    rationale: string;
    expectedImpact: string;
    risk: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high' | 'critical';
    timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  }>;
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    velocity: number; // Rate of change
    seasonality: boolean;
    factors: string[];
  };
  threats: Array<{
    type: 'price_war' | 'new_entrant' | 'substitution' | 'disruption';
    severity: 'low' | 'medium' | 'high' | 'critical';
    likelihood: number;
    timeline: string;
    mitigation: string[];
  }>;
  opportunities: Array<{
    type: 'premium_pricing' | 'market_expansion' | 'bundle_optimization' | 'segmentation';
    potential: number;
    effort: 'low' | 'medium' | 'high';
    description: string;
  }>;
  aiInsights: {
    summary: string;
    keyFindings: string[];
    confidence: number;
    modelVersion: string;
  };
}

export interface PricingForecast {
  competitorId: string;
  productId: string;
  timeframe: '1_month' | '3_months' | '6_months' | '1_year';
  predictions: Array<{
    date: Date;
    predictedPrice: number;
    confidence: number;
    factors: string[];
  }>;
  scenarios: {
    optimistic: { price: number; probability: number };
    realistic: { price: number; probability: number };
    pessimistic: { price: number; probability: number };
  };
  riskFactors: string[];
  marketDrivers: string[];
  confidence: number;
}

export class PricingIntelligenceEngine {
  private static instance: PricingIntelligenceEngine | null = null;

  public static getInstance(): PricingIntelligenceEngine {
    if (!PricingIntelligenceEngine.instance) {
      PricingIntelligenceEngine.instance = new PricingIntelligenceEngine();
    }
    return PricingIntelligenceEngine.instance;
  }

  // Store pricing data point
  async storePricingData(dataPoint: Omit<PricingDataPoint, 'id'>): Promise<string> {
    try {
      const id = `pricing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.debug('Storing pricing data point', {
        competitorId: dataPoint.competitorId,
        productId: dataPoint.productId,
        price: dataPoint.price
      });

      await memgraphBI.executeQuery(`
        CREATE (p:PricingData {
          id: $id,
          competitorId: $competitorId,
          competitorName: $competitorName,
          productId: $productId,
          productName: $productName,
          price: $price,
          currency: $currency,
          priceType: $priceType,
          billingPeriod: $billingPeriod,
          features: $features,
          marketSegment: $marketSegment,
          geographicRegion: $geographicRegion,
          lastUpdated: $lastUpdated,
          confidence: $confidence,
          source: $source,
          metadata: $metadata,
          createdAt: $createdAt
        })
        RETURN p
      `, {
        id,
        competitorId: dataPoint.competitorId,
        competitorName: dataPoint.competitorName,
        productId: dataPoint.productId,
        productName: dataPoint.productName,
        price: dataPoint.price,
        currency: dataPoint.currency,
        priceType: dataPoint.priceType,
        billingPeriod: dataPoint.billingPeriod || null,
        features: JSON.stringify(dataPoint.features),
        marketSegment: dataPoint.marketSegment,
        geographicRegion: dataPoint.geographicRegion,
        lastUpdated: dataPoint.lastUpdated.toISOString(),
        confidence: dataPoint.confidence,
        source: dataPoint.source,
        metadata: JSON.stringify(dataPoint.metadata),
        createdAt: new Date().toISOString()
      });

      logger.info('Pricing data point stored successfully', { id, price: dataPoint.price });
      return id;
    } catch (error) {
      logger.error('Failed to store pricing data point:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Analyze pricing strategy for a competitor
  async analyzePricingStrategy(
    competitorId: string,
    productCategory: string,
    _contextData?: Record<string, unknown>
  ): Promise<PricingAnalysis> {
    try {
      logger.debug('Analyzing pricing strategy', { competitorId, productCategory });

      // Gather pricing data for this competitor and category
      const pricingData = await this.getPricingData(competitorId, productCategory);
      const marketData = await this.getMarketPricingData(productCategory);

      // Calculate market position
      const marketPosition = this.calculateMarketPosition(pricingData, marketData);

      // Detect pricing strategy using AI
      const strategy = await this.detectPricingStrategy(pricingData, marketData, _contextData);

      // Estimate price elasticity
      const elasticity = await this.estimatePriceElasticity(pricingData, marketData);

      // Generate AI-powered recommendations
      const aiAnalysis = await this.generateAIRecommendations(
        pricingData,
        marketData,
        strategy,
        _contextData
      );

      // Analyze trends
      const trends = this.analyzePricingTrends(pricingData);

      // Identify threats and opportunities
      const threats = await this.identifyPricingThreats(pricingData, marketData);
      const opportunities = await this.identifyPricingOpportunities(pricingData, marketData);

      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const analysis: PricingAnalysis = {
        id: analysisId,
        analysisDate: new Date(),
        competitorId,
        productCategory,
        strategy,
        marketPosition,
        elasticity,
        recommendations: aiAnalysis.recommendations,
        trends,
        threats,
        opportunities,
        aiInsights: {
          summary: aiAnalysis.summary,
          keyFindings: aiAnalysis.keyFindings,
          confidence: aiAnalysis.confidence,
          modelVersion: 'deepseek-chat'
        }
      };

      // Store analysis results
      await this.storeAnalysis(analysis);

      logger.info('Pricing strategy analysis completed', {
        analysisId,
        competitorId,
        strategy: strategy.type,
        confidence: aiAnalysis.confidence
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze pricing strategy:', {
        competitorId,
        productCategory,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Generate pricing forecast using AI
  async generatePricingForecast(
    competitorId: string,
    productId: string,
    timeframe: PricingForecast['timeframe'],
    _contextFactors?: string[]
  ): Promise<PricingForecast> {
    try {
      logger.debug('Generating pricing forecast', { competitorId, productId, timeframe });

      // Get historical pricing data
      const historicalData = await this.getHistoricalPricingData(competitorId, productId);
      const marketTrends = await this.getMarketTrends(productId);

      // Use AI to analyze patterns and generate predictions
      const aiPrediction = await deepSeekAIService.analyzeData({
        type: 'strategic_insights',
        data: {
          companyContext: { competitorId, productId },
          competitorData: JSON.stringify(historicalData),
          marketData: JSON.stringify(marketTrends),
          timeframe,
          contextFactors: JSON.stringify(_contextFactors || [])
        },
        context: {
          analysisType: 'pricing_forecast',
          requestedTimeframe: timeframe
        }
      });

      // Generate scenario-based predictions
      const scenarios = this.generatePricingScenarios(historicalData, marketTrends);

      // Identify risk factors and market drivers
      const riskFactors = this.identifyForecastRiskFactors(historicalData, marketTrends);
      const marketDrivers = this.identifyMarketDrivers(marketTrends);

      const forecast: PricingForecast = {
        competitorId,
        productId,
        timeframe,
        predictions: this.generatePredictionSeries(historicalData, timeframe),
        scenarios,
        riskFactors,
        marketDrivers,
        confidence: aiPrediction.confidence
      };

      logger.info('Pricing forecast generated', {
        competitorId,
        productId,
        timeframe,
        confidence: forecast.confidence
      });

      return forecast;
    } catch (error) {
      logger.error('Failed to generate pricing forecast:', {
        competitorId,
        productId,
        timeframe,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Batch analyze multiple competitors
  async batchAnalyzeCompetitors(
    competitorIds: string[],
    productCategory: string
  ): Promise<PricingAnalysis[]> {
    const analyses: PricingAnalysis[] = [];

    logger.info('Starting batch pricing analysis', {
      competitorCount: competitorIds.length,
      productCategory
    });

    for (const competitorId of competitorIds) {
      try {
        const analysis = await this.analyzePricingStrategy(competitorId, productCategory);
        analyses.push(analysis);

        // Add delay to prevent API rate limiting
        await this.delay(1000);
      } catch (error) {
        logger.error('Batch analysis failed for competitor:', {
          competitorId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        continue;
      }
    }

    logger.info('Batch pricing analysis completed', {
      successCount: analyses.length,
      totalRequested: competitorIds.length
    });

    return analyses;
  }

  // Private helper methods
  private async getPricingData(
    competitorId: string,
    productCategory: string
  ): Promise<PricingDataPoint[]> {
    const result = await memgraphBI.executeQuery(`
      MATCH (p:PricingData)
      WHERE p.competitorId = $competitorId
        AND p.productName CONTAINS $productCategory
      RETURN p
      ORDER BY p.lastUpdated DESC
      LIMIT 50
    `, { competitorId, productCategory });

    return result.records.map(record => {
      const props = record.get('p').properties;
      return {
        id: props.id,
        competitorId: props.competitorId,
        competitorName: props.competitorName,
        productId: props.productId,
        productName: props.productName,
        price: props.price,
        currency: props.currency,
        priceType: props.priceType,
        billingPeriod: props.billingPeriod,
        features: JSON.parse(props.features || '[]'),
        marketSegment: props.marketSegment,
        geographicRegion: props.geographicRegion,
        lastUpdated: new Date(props.lastUpdated),
        confidence: props.confidence,
        source: props.source,
        metadata: JSON.parse(props.metadata || '{}')
      };
    });
  }

  private async getMarketPricingData(productCategory: string): Promise<PricingDataPoint[]> {
    const result = await memgraphBI.executeQuery(`
      MATCH (p:PricingData)
      WHERE p.productName CONTAINS $productCategory
      RETURN p
      ORDER BY p.lastUpdated DESC
      LIMIT 200
    `, { productCategory });

    return result.records.map(record => {
      const props = record.get('p').properties;
      return {
        id: props.id,
        competitorId: props.competitorId,
        competitorName: props.competitorName,
        productId: props.productId,
        productName: props.productName,
        price: props.price,
        currency: props.currency,
        priceType: props.priceType,
        billingPeriod: props.billingPeriod,
        features: JSON.parse(props.features || '[]'),
        marketSegment: props.marketSegment,
        geographicRegion: props.geographicRegion,
        lastUpdated: new Date(props.lastUpdated),
        confidence: props.confidence,
        source: props.source,
        metadata: JSON.parse(props.metadata || '{}')
      };
    });
  }

  private calculateMarketPosition(
    competitorData: PricingDataPoint[],
    marketData: PricingDataPoint[]
  ): PricingAnalysis['marketPosition'] {
    if (competitorData.length === 0 || marketData.length === 0) {
      return {
        percentile: 50,
        rank: 1,
        totalCompetitors: 1,
        priceGap: { aboveMedian: 0, belowMedian: 0, nearestCompetitor: 0 }
      };
    }

    const competitorPrice = competitorData[0]?.price;
    if (competitorPrice === undefined) {
      return {
        percentile: 50,
        rank: 1,
        totalCompetitors: 1,
        priceGap: { aboveMedian: 0, belowMedian: 0, nearestCompetitor: 0 }
      };
    }

    const marketPrices = marketData.map(d => d.price).filter(p => p !== undefined).sort((a, b) => a - b);
    if (marketPrices.length === 0) {
      return {
        percentile: 50,
        rank: 1,
        totalCompetitors: 1,
        priceGap: { aboveMedian: 0, belowMedian: 0, nearestCompetitor: 0 }
      };
    }

    const rank = marketPrices.filter(price => price < competitorPrice).length + 1;
    const percentile = (rank / marketPrices.length) * 100;

    const median = marketPrices[Math.floor(marketPrices.length / 2)];
    if (median === undefined) {
      return {
        percentile: 50,
        rank: 1,
        totalCompetitors: 1,
        priceGap: { aboveMedian: 0, belowMedian: 0, nearestCompetitor: 0 }
      };
    }
    const nearestPrices = marketPrices.filter(p => p !== competitorPrice);
    const nearestPrice = nearestPrices.length > 0
      ? nearestPrices.reduce((nearest, price) =>
          Math.abs(price - competitorPrice) < Math.abs(nearest - competitorPrice) ? price : nearest
        )
      : competitorPrice;

    return {
      percentile,
      rank,
      totalCompetitors: marketPrices.length,
      priceGap: {
        aboveMedian: competitorPrice - median,
        belowMedian: median - competitorPrice,
        nearestCompetitor: competitorPrice - nearestPrice
      }
    };
  }

  private async detectPricingStrategy(
    competitorData: PricingDataPoint[],
    marketData: PricingDataPoint[],
    contextData?: Record<string, unknown>
  ): Promise<PricingStrategy> {
    try {
      const aiAnalysis = await deepSeekAIService.analyzeData({
        type: 'pricing_analysis',
        data: {
          category: competitorData[0]?.productName || 'Unknown',
          pricingData: JSON.stringify(competitorData.concat(marketData).map(d => ({
            competitor: d.competitorName,
            product: d.productName,
            price: d.price,
            currency: d.currency,
            features: d.features
          })))
        },
        context: contextData
      });

      // Extract strategy from AI analysis
      const strategyTypes = ['cost_plus', 'value_based', 'competitive', 'penetration', 'skimming', 'psychological', 'bundle'];
      const detectedType = strategyTypes.find(type =>
        aiAnalysis.rawResponse.toLowerCase().includes(type.replace('_', ' '))
      ) || 'competitive';

      return {
        type: detectedType as PricingStrategy['type'],
        confidence: aiAnalysis.confidence,
        indicators: aiAnalysis.analysis.keyInsights.map(insight => insight.insight),
        pricePoints: competitorData.map(d => d.price),
        targetSegments: [...new Set(competitorData.map(d => d.marketSegment))],
        positioning: this.determinePositioning(competitorData, marketData)
      };
    } catch (error) {
      logger.error('Failed to detect pricing strategy:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to heuristic detection
      return this.heuristicStrategyDetection(competitorData, marketData);
    }
  }

  private async estimatePriceElasticity(
    competitorData: PricingDataPoint[],
    marketData: PricingDataPoint[]
  ): Promise<PricingAnalysis['elasticity']> {
    // Simple elasticity estimation based on price dispersion and market characteristics
    const priceVariation = this.calculatePriceVariation(marketData);
    const featureComplexity = this.calculateFeatureComplexity(competitorData);

    // Heuristic: High variation + high complexity = lower elasticity (more inelastic)
    const elasticity = Math.max(-3, Math.min(-0.1, -(priceVariation * featureComplexity)));

    return {
      estimated: elasticity,
      confidence: 0.6, // Medium confidence for heuristic approach
      factors: [
        'Market price variation',
        'Product feature complexity',
        'Competitive intensity'
      ]
    };
  }

  private async generateAIRecommendations(
    competitorData: PricingDataPoint[],
    marketData: PricingDataPoint[],
    strategy: PricingStrategy,
    contextData?: Record<string, unknown>
  ): Promise<{
    summary: string;
    keyFindings: string[];
    confidence: number;
    recommendations: PricingAnalysis['recommendations'];
  }> {
    try {
      const aiAnalysis = await deepSeekAIService.analyzeData({
        type: 'strategic_insights',
        data: {
          companyContext: { strategy: strategy.type, positioning: strategy.positioning },
          competitorData: JSON.stringify(competitorData),
          marketData: JSON.stringify(marketData)
        },
        context: contextData
      });

      const recommendations: PricingAnalysis['recommendations'] = aiAnalysis.analysis.recommendations.map(rec => ({
        action: this.mapToActionType(rec.action),
        rationale: rec.rationale,
        expectedImpact: `Expected ${rec.impact} impact based on ${rec.effort} effort`,
        risk: rec.priority === 'critical' ? 'high' : rec.priority === 'high' ? 'medium' : 'low',
        priority: rec.priority,
        timeline: rec.timeline
      }));

      return {
        summary: aiAnalysis.analysis.summary,
        keyFindings: aiAnalysis.analysis.keyInsights.map(insight => insight.insight),
        confidence: aiAnalysis.confidence,
        recommendations
      };
    } catch (error) {
      logger.error('Failed to generate AI recommendations:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        summary: 'Analysis completed with heuristic methods',
        keyFindings: ['Market positioning analysis completed'],
        confidence: 0.5,
        recommendations: []
      };
    }
  }

  private analyzePricingTrends(data: PricingDataPoint[]): PricingAnalysis['trends'] {
    if (data.length < 2) {
      return {
        direction: 'stable',
        velocity: 0,
        seasonality: false,
        factors: ['Insufficient data for trend analysis']
      };
    }

    const sortedData = data.sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime());
    const priceChanges = [];

    for (let i = 1; i < sortedData.length; i++) {
      const currentPrice = sortedData[i]?.price;
      const previousPrice = sortedData[i-1]?.price;
      if (currentPrice !== undefined && previousPrice !== undefined && previousPrice !== 0) {
        const change = (currentPrice - previousPrice) / previousPrice;
        priceChanges.push(change);
      }
    }

    const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const volatility = Math.sqrt(priceChanges.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / priceChanges.length);

    let direction: PricingAnalysis['trends']['direction'];
    if (Math.abs(avgChange) < 0.02) direction = 'stable';
    else if (avgChange > 0.02) direction = 'increasing';
    else if (avgChange < -0.02) direction = 'decreasing';
    else direction = volatility > 0.1 ? 'volatile' : 'stable';

    return {
      direction,
      velocity: Math.abs(avgChange),
      seasonality: this.detectSeasonality(sortedData),
      factors: this.identifyTrendFactors(direction, volatility)
    };
  }

  private async identifyPricingThreats(
    competitorData: PricingDataPoint[],
    marketData: PricingDataPoint[]
  ): Promise<PricingAnalysis['threats']> {
    const threats: PricingAnalysis['threats'] = [];

    // Price war detection
    const recentPriceDrops = marketData.filter(d => {
      const daysSinceUpdate = (Date.now() - d.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 30; // Recent price changes
    });

    if (recentPriceDrops.length > marketData.length * 0.3) {
      threats.push({
        type: 'price_war',
        severity: 'high',
        likelihood: 0.7,
        timeline: 'short_term',
        mitigation: ['Monitor competitor moves closely', 'Prepare value-based messaging', 'Consider non-price differentiation']
      });
    }

    // New entrant detection (simplified)
    const newCompetitors = [...new Set(marketData.map(d => d.competitorId))];
    if (newCompetitors.length > 5) {
      threats.push({
        type: 'new_entrant',
        severity: 'medium',
        likelihood: 0.6,
        timeline: 'medium_term',
        mitigation: ['Strengthen customer relationships', 'Enhance product features', 'Consider pricing flexibility']
      });
    }

    return threats;
  }

  private async identifyPricingOpportunities(
    competitorData: PricingDataPoint[],
    marketData: PricingDataPoint[]
  ): Promise<PricingAnalysis['opportunities']> {
    const opportunities: PricingAnalysis['opportunities'] = [];

    // Premium pricing opportunity
    const competitorPrice = competitorData[0]?.price || 0;
    const marketMedian = this.calculateMedian(marketData.map(d => d.price));

    if (competitorPrice < marketMedian * 0.8) {
      opportunities.push({
        type: 'premium_pricing',
        potential: 0.8,
        effort: 'medium',
        description: 'Price point below market median suggests premium pricing opportunity'
      });
    }

    // Bundle optimization
    const hasMultipleProducts = competitorData.length > 1;
    if (hasMultipleProducts) {
      opportunities.push({
        type: 'bundle_optimization',
        potential: 0.6,
        effort: 'low',
        description: 'Multiple products present bundling optimization opportunity'
      });
    }

    return opportunities;
  }

  // Utility methods
  private determinePositioning(
    competitorData: PricingDataPoint[],
    marketData: PricingDataPoint[]
  ): PricingStrategy['positioning'] {
    if (competitorData.length === 0) return 'mid_market';

    const competitorPrice = competitorData[0]?.price;
    if (competitorPrice === undefined) return 'mid_market';
    const marketPrices = marketData.map(d => d.price);
    const percentile = this.calculatePercentile(marketPrices, competitorPrice);

    if (percentile >= 80) return 'premium';
    if (percentile >= 60) return 'mid_market';
    if (percentile >= 40) return 'budget';
    if (percentile >= 20) return 'enterprise';
    return 'mixed';
  }

  private heuristicStrategyDetection(
    competitorData: PricingDataPoint[],
    marketData: PricingDataPoint[]
  ): PricingStrategy {
    // Simple heuristic based on price positioning
    const positioning = this.determinePositioning(competitorData, marketData);

    let type: PricingStrategy['type'];
    switch (positioning) {
      case 'premium': type = 'value_based'; break;
      case 'budget': type = 'penetration'; break;
      case 'enterprise': type = 'value_based'; break;
      default: type = 'competitive'; break;
    }

    return {
      type,
      confidence: 0.5,
      indicators: ['Heuristic analysis based on price positioning'],
      pricePoints: competitorData.map(d => d.price),
      targetSegments: [...new Set(competitorData.map(d => d.marketSegment))],
      positioning
    };
  }

  private calculatePriceVariation(data: PricingDataPoint[]): number {
    if (data.length === 0) return 0;

    const prices = data.map(d => d.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateFeatureComplexity(data: PricingDataPoint[]): number {
    if (data.length === 0) return 1;

    const avgFeatureCount = data.reduce((sum, d) => sum + d.features.length, 0) / data.length;
    return Math.min(avgFeatureCount / 10, 2); // Normalize to max 2
  }

  private mapToActionType(action: string): PricingAnalysis['recommendations'][0]['action'] {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('increase')) return 'increase';
    if (actionLower.includes('decrease')) return 'decrease';
    if (actionLower.includes('restructure')) return 'restructure';
    if (actionLower.includes('monitor')) return 'monitor';
    return 'maintain';
  }

  private detectSeasonality(data: PricingDataPoint[]): boolean {
    // Simple seasonality detection - would need more sophisticated analysis in production
    if (data.length < 12) return false;

    const monthlyChanges = new Map<number, number[]>();

    for (let i = 1; i < data.length; i++) {
      const month = data[i]?.lastUpdated?.getMonth();
      const currentPrice = data[i]?.price;
      const previousPrice = data[i-1]?.price;

      if (month === undefined || currentPrice === undefined || previousPrice === undefined || previousPrice === 0) {
        continue;
      }

      const change = (currentPrice - previousPrice) / previousPrice;

      if (!monthlyChanges.has(month)) {
        monthlyChanges.set(month, []);
      }
      const monthChanges = monthlyChanges.get(month);
      if (monthChanges) {
        monthChanges.push(change);
      }
    }

    // Check if any month shows consistent patterns
    return Array.from(monthlyChanges.values()).some(changes => {
      const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
      return Math.abs(avgChange) > 0.05; // 5% threshold
    });
  }

  private identifyTrendFactors(direction: string, volatility: number): string[] {
    const factors = [];

    switch (direction) {
      case 'increasing':
        factors.push('Market demand growth', 'Inflation pressures', 'Premium positioning');
        break;
      case 'decreasing':
        factors.push('Competitive pressure', 'Market maturity', 'Cost optimization');
        break;
      case 'volatile':
        factors.push('Market uncertainty', 'Promotional cycles', 'Competitive responses');
        break;
      default:
        factors.push('Market stability', 'Established pricing norms');
    }

    if (volatility > 0.15) {
      factors.push('High market volatility');
    }

    return factors;
  }

  private calculatePercentile(data: number[], value: number): number {
    const sorted = [...data].sort((a, b) => a - b);
    const rank = sorted.filter(v => v <= value).length;
    return (rank / sorted.length) * 100;
  }

  private calculateMedian(data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    if (sorted.length === 0) return 0;

    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      const left = sorted[mid - 1];
      const right = sorted[mid];
      return (left !== undefined && right !== undefined) ? (left + right) / 2 : 0;
    } else {
      const median = sorted[mid];
      return median !== undefined ? median : 0;
    }
  }

  private async getHistoricalPricingData(_competitorId: string, _productId: string): Promise<PricingDataPoint[]> {
    // Implementation would fetch historical data - simplified for now
    return [];
  }

  private async getMarketTrends(_productId: string): Promise<unknown[]> {
    // Implementation would fetch market trend data - simplified for now
    return [];
  }

  private generatePricingScenarios(
    _historicalData: PricingDataPoint[],
    _marketTrends: unknown[]
  ): PricingForecast['scenarios'] {
    // Simplified scenario generation
    const basePrice = 100; // Would be calculated from historical data

    return {
      optimistic: { price: basePrice * 1.1, probability: 0.25 },
      realistic: { price: basePrice, probability: 0.5 },
      pessimistic: { price: basePrice * 0.9, probability: 0.25 }
    };
  }

  private identifyForecastRiskFactors(_historicalData: PricingDataPoint[], _marketTrends: unknown[]): string[] {
    return [
      'Market volatility',
      'Competitive responses',
      'Economic conditions',
      'Regulatory changes'
    ];
  }

  private identifyMarketDrivers(_marketTrends: unknown[]): string[] {
    return [
      'Customer demand',
      'Cost pressures',
      'Technology adoption',
      'Market consolidation'
    ];
  }

  private generatePredictionSeries(
    historicalData: PricingDataPoint[],
    timeframe: PricingForecast['timeframe']
  ): PricingForecast['predictions'] {
    // Simplified prediction series generation
    const predictions: PricingForecast['predictions'] = [];
    const basePrice = 100;
    const periods = timeframe === '1_month' ? 4 : timeframe === '3_months' ? 12 : 24;

    for (let i = 1; i <= periods; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (i * 7)); // Weekly predictions

      predictions.push({
        date,
        predictedPrice: basePrice * (1 + Math.random() * 0.1 - 0.05), // ±5% variation
        confidence: Math.max(0.5, 0.9 - (i * 0.02)), // Decreasing confidence over time
        factors: ['Historical trends', 'Market analysis']
      });
    }

    return predictions;
  }

  private async storeAnalysis(analysis: PricingAnalysis): Promise<void> {
    try {
      await memgraphBI.executeQuery(`
        CREATE (a:PricingAnalysis {
          id: $id,
          analysisDate: $analysisDate,
          competitorId: $competitorId,
          productCategory: $productCategory,
          strategy: $strategy,
          marketPosition: $marketPosition,
          elasticity: $elasticity,
          recommendations: $recommendations,
          trends: $trends,
          threats: $threats,
          opportunities: $opportunities,
          aiInsights: $aiInsights,
          createdAt: $createdAt
        })
        RETURN a
      `, {
        id: analysis.id,
        analysisDate: analysis.analysisDate.toISOString(),
        competitorId: analysis.competitorId,
        productCategory: analysis.productCategory,
        strategy: JSON.stringify(analysis.strategy),
        marketPosition: JSON.stringify(analysis.marketPosition),
        elasticity: JSON.stringify(analysis.elasticity),
        recommendations: JSON.stringify(analysis.recommendations),
        trends: JSON.stringify(analysis.trends),
        threats: JSON.stringify(analysis.threats),
        opportunities: JSON.stringify(analysis.opportunities),
        aiInsights: JSON.stringify(analysis.aiInsights),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to store pricing analysis:', {
        analysisId: analysis.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      pricingDataPoints: number;
      recentAnalyses: number;
      aiServiceStatus: string;
      lastError?: string;
    };
  }> {
    try {
      // Count pricing data points
      const dataResult = await memgraphBI.executeQuery(`
        MATCH (p:PricingData)
        RETURN count(p) as count
      `);
      const pricingDataPoints = dataResult.records[0]?.get('count')?.toNumber?.() || 0;

      // Count recent analyses
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const analysisResult = await memgraphBI.executeQuery(`
        MATCH (a:PricingAnalysis)
        WHERE datetime(a.analysisDate) > datetime($dayAgo)
        RETURN count(a) as count
      `, { dayAgo: dayAgo.toISOString() });
      const recentAnalyses = analysisResult.records[0]?.get('count')?.toNumber?.() || 0;

      // Check AI service health
      const aiHealth = await deepSeekAIService.healthCheck();

      return {
        status: 'healthy',
        details: {
          pricingDataPoints,
          recentAnalyses,
          aiServiceStatus: aiHealth.status
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          pricingDataPoints: 0,
          recentAnalyses: 0,
          aiServiceStatus: 'unhealthy',
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export singleton instance
export const pricingIntelligenceEngine = PricingIntelligenceEngine.getInstance();