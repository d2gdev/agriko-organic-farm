// Business Intelligence - DeepSeek AI Integration Service
import { logger } from '@/lib/logger';
import type {
  BusinessIntelligenceConfig,
  DeepSeekPromptTemplate
} from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';
import type { ChangeEvent } from './change-detector';
import type { ExtractedData } from './data-processor';

// DeepSeek AI analysis interfaces
export interface AIAnalysisRequest {
  type: 'competitor_analysis' | 'market_analysis' | 'pricing_analysis' | 'sentiment_analysis' | 'strategic_insights';
  data: Record<string, unknown>;
  context?: Record<string, unknown>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

export interface AIAnalysisResult {
  id: string;
  type: string;
  timestamp: Date;
  confidence: number;
  analysis: {
    summary: string;
    keyInsights: Array<{
      insight: string;
      confidence: number;
      category: 'opportunity' | 'threat' | 'trend' | 'recommendation';
      priority: 'low' | 'medium' | 'high' | 'critical';
    }>;
    swotAnalysis?: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    recommendations: Array<{
      action: string;
      rationale: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
    }>;
    marketPosition?: {
      competitive_advantage: string[];
      market_share_estimate: string;
      positioning: string;
      differentiation: string[];
    };
    riskAssessment?: {
      level: 'low' | 'medium' | 'high' | 'critical';
      factors: string[];
      mitigation: string[];
    };
  };
  rawResponse: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  metadata: Record<string, unknown>;
}

export interface CompetitorIntelligence {
  competitorId: string;
  lastAnalyzed: Date;
  overallThreatLevel: 'low' | 'medium' | 'high' | 'critical';
  keyStrengths: string[];
  keyWeaknesses: string[];
  marketPosition: string;
  strategicThreats: Array<{
    threat: string;
    likelihood: number;
    impact: number;
    timeframe: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    potential: number;
    effort: string;
  }>;
  monitoringRecommendations: string[];
}

export class DeepSeekAIService {
  private config: BusinessIntelligenceConfig['deepseek'];
  private static instance: DeepSeekAIService | null = null;

  // Predefined prompt templates for different analysis types
  private readonly promptTemplates: Record<string, DeepSeekPromptTemplate> = {
    competitor_analysis: {
      id: 'competitor_analysis',
      name: 'Comprehensive Competitor Analysis',
      description: 'Analyze competitor data to extract strategic insights and competitive intelligence',
      systemPrompt: `You are an expert business intelligence analyst specializing in competitive analysis. Your task is to analyze competitor data and provide strategic insights that help businesses understand their competitive landscape.

You should focus on:
1. Identifying competitive strengths and weaknesses
2. Assessing market positioning and differentiation
3. Evaluating strategic threats and opportunities
4. Providing actionable recommendations
5. Estimating market impact and business implications

Always provide specific, actionable insights backed by data analysis. Use a confident but measured tone, and clearly indicate confidence levels for your assessments.`,
      userPromptTemplate: `Analyze the following competitor data and provide comprehensive strategic insights:

**Competitor Information:**
Name: {competitorName}
Industry: {industry}
Domain: {domain}

**Data Sources:**
{searchResults}

**Extracted Intelligence:**
- URLs: {urls}
- Keywords: {keywords}
- Pricing Information: {pricing}
- Social Media Presence: {socialMedia}

**Analysis Context:**
{context}

Please provide:
1. Executive Summary (2-3 sentences)
2. SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
3. Market Positioning Assessment
4. Key Strategic Insights (3-5 insights with confidence levels)
5. Risk Assessment and Threat Level
6. Actionable Recommendations (3-5 recommendations with priority levels)

Format your response as structured JSON following this schema:
{
  "summary": "string",
  "swotAnalysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "marketPosition": {
    "competitive_advantage": ["string"],
    "market_share_estimate": "string",
    "positioning": "string",
    "differentiation": ["string"]
  },
  "keyInsights": [
    {
      "insight": "string",
      "confidence": 0.8,
      "category": "opportunity|threat|trend|recommendation",
      "priority": "low|medium|high|critical"
    }
  ],
  "riskAssessment": {
    "level": "low|medium|high|critical",
    "factors": ["string"],
    "mitigation": ["string"]
  },
  "recommendations": [
    {
      "action": "string",
      "rationale": "string",
      "priority": "low|medium|high|critical",
      "timeline": "immediate|short_term|medium_term|long_term",
      "effort": "low|medium|high",
      "impact": "low|medium|high"
    }
  ]
}`,
      outputFormat: 'json',
      requiredVariables: ['competitorName', 'industry', 'searchResults'],
      optionalVariables: ['domain', 'urls', 'keywords', 'pricing', 'socialMedia', 'context']
    },

    market_analysis: {
      id: 'market_analysis',
      name: 'Market Landscape Analysis',
      description: 'Analyze market trends, opportunities, and competitive dynamics within an industry',
      systemPrompt: `You are a strategic market analyst with expertise in identifying market trends, opportunities, and competitive dynamics. Your analysis helps businesses understand market conditions and make informed strategic decisions.

Focus on:
1. Market size, growth, and trends
2. Competitive landscape mapping
3. Customer needs and behavior patterns
4. Technology and innovation trends
5. Regulatory and economic factors
6. Market entry barriers and opportunities

Provide data-driven insights with clear confidence indicators and actionable recommendations.`,
      userPromptTemplate: `Analyze the following market data and provide comprehensive market intelligence:

**Industry:** {industry}
**Geographic Focus:** {region}

**Market Data:**
{marketData}

**Competitor Landscape:**
{competitors}

**Industry News and Trends:**
{newsData}

**Analysis Context:**
{context}

Please provide:
1. Market Overview and Size Assessment
2. Growth Trends and Drivers
3. Competitive Landscape Mapping
4. Customer Segment Analysis
5. Technology and Innovation Trends
6. Market Opportunities and Threats
7. Entry Barriers and Strategic Considerations
8. Future Market Predictions (12-24 months)

Respond in structured JSON format.`,
      outputFormat: 'json',
      requiredVariables: ['industry', 'marketData'],
      optionalVariables: ['region', 'competitors', 'newsData', 'context']
    },

    pricing_analysis: {
      id: 'pricing_analysis',
      name: 'Competitive Pricing Analysis',
      description: 'Analyze pricing strategies, trends, and competitive positioning based on pricing data',
      systemPrompt: `You are a pricing strategy expert who analyzes competitive pricing data to identify patterns, strategies, and opportunities. Your analysis helps businesses optimize their pricing strategy and competitive positioning.

Focus on:
1. Pricing strategy identification (value-based, cost-plus, competitive, penetration, skimming)
2. Price positioning and market segmentation
3. Pricing trends and changes over time
4. Value proposition analysis
5. Price sensitivity and elasticity insights
6. Competitive pricing gaps and opportunities

Provide specific, actionable pricing insights with clear confidence levels.`,
      userPromptTemplate: `Analyze the following pricing data and provide strategic pricing insights:

**Product/Service Category:** {category}
**Market Segment:** {segment}

**Competitive Pricing Data:**
{pricingData}

**Product/Service Features Comparison:**
{features}

**Market Context:**
{context}

Please provide:
1. Pricing Strategy Analysis for each competitor
2. Price Positioning Map
3. Value-Price Relationship Assessment
4. Pricing Trends and Changes
5. Competitive Gaps and Opportunities
6. Pricing Recommendations
7. Market Price Sensitivity Analysis

Respond in structured JSON format with specific price points and strategic recommendations.`,
      outputFormat: 'json',
      requiredVariables: ['category', 'pricingData'],
      optionalVariables: ['segment', 'features', 'context']
    },

    sentiment_analysis: {
      id: 'sentiment_analysis',
      name: 'Market Sentiment Analysis',
      description: 'Analyze sentiment from news, social media, and market data to gauge market perception',
      systemPrompt: `You are a sentiment analysis expert who evaluates market perception, brand sentiment, and public opinion based on various data sources. Your analysis helps businesses understand market sentiment trends and their implications.

Focus on:
1. Overall sentiment classification and intensity
2. Sentiment trends over time
3. Key sentiment drivers and themes
4. Competitive sentiment comparison
5. Brand perception and reputation insights
6. Market confidence indicators
7. Risk factors and sentiment-based threats

Provide nuanced sentiment analysis with confidence scores and actionable insights.`,
      userPromptTemplate: `Analyze sentiment from the following data sources:

**Entity:** {entity}
**Industry:** {industry}
**Time Period:** {timePeriod}

**News Articles:**
{newsData}

**Social Media Mentions:**
{socialData}

**Market Reports:**
{reportData}

**Additional Context:**
{context}

Please provide:
1. Overall Sentiment Score (-1.0 to +1.0)
2. Sentiment Classification (Very Negative, Negative, Neutral, Positive, Very Positive)
3. Key Sentiment Themes and Drivers
4. Sentiment Trends and Changes
5. Competitive Sentiment Comparison
6. Risk Factors and Concerns
7. Reputation Management Recommendations

Respond in structured JSON format with specific sentiment scores and analysis.`,
      outputFormat: 'json',
      requiredVariables: ['entity', 'newsData'],
      optionalVariables: ['industry', 'timePeriod', 'socialData', 'reportData', 'context']
    },

    strategic_insights: {
      id: 'strategic_insights',
      name: 'Strategic Business Insights',
      description: 'Generate high-level strategic insights and recommendations based on comprehensive business intelligence',
      systemPrompt: `You are a senior strategy consultant who synthesizes business intelligence data to generate high-level strategic insights and recommendations. Your analysis helps executives make informed strategic decisions.

Focus on:
1. Strategic implications of competitive intelligence
2. Market positioning and differentiation strategies
3. Growth opportunities and market expansion
4. Competitive advantage and moat building
5. Risk mitigation and threat response
6. Resource allocation and investment priorities
7. Long-term strategic planning

Provide executive-level insights that are actionable, prioritized, and aligned with business strategy.`,
      userPromptTemplate: `Based on the comprehensive business intelligence data, provide strategic insights and recommendations:

**Company Context:**
{companyContext}

**Competitive Intelligence:**
{competitorData}

**Market Analysis:**
{marketData}

**Change Detection Results:**
{changeData}

**Performance Metrics:**
{performanceData}

**Strategic Context:**
{context}

Please provide:
1. Executive Summary (3-4 key strategic insights)
2. Competitive Position Assessment
3. Strategic Opportunities (ranked by impact/effort)
4. Strategic Threats and Risk Mitigation
5. Resource Allocation Recommendations
6. Timeline and Priority Matrix
7. Success Metrics and KPIs
8. Next Steps and Action Plan

Respond in structured JSON format optimized for executive decision-making.`,
      outputFormat: 'json',
      requiredVariables: ['companyContext', 'competitorData'],
      optionalVariables: ['marketData', 'changeData', 'performanceData', 'context']
    }
  };

  private constructor() {
    this.config = DEFAULT_CONFIG.deepseek;

    logger.info('DeepSeek AI service initialized', {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    });
  }

  public static getInstance(): DeepSeekAIService {
    if (!DeepSeekAIService.instance) {
      DeepSeekAIService.instance = new DeepSeekAIService();
    }
    return DeepSeekAIService.instance;
  }

  // Main analysis method
  async analyzeData(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      logger.debug('Starting AI analysis', {
        type: request.type,
        dataKeys: Object.keys(request.data)
      });

      const template = this.promptTemplates[request.type];
      if (!template) {
        throw new Error(`Unknown analysis type: ${request.type}`);
      }

      // Build the prompt
      const prompt = this.buildPrompt(template, request.data, request.context);

      // Make API call to DeepSeek
      const response = await this.callDeepSeekAPI(prompt, request.options);

      // Parse and structure the response
      const analysisResult = await this.parseAnalysisResponse(
        request.type,
        response.content,
        response.usage
      );

      logger.info('AI analysis completed successfully', {
        type: request.type,
        analysisId: analysisResult.id,
        confidence: analysisResult.confidence,
        tokensUsed: analysisResult.tokens.total
      });

      return analysisResult;
    } catch (error) {
      logger.error('AI analysis failed:', {
        type: request.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Specialized analysis methods
  async analyzeCompetitor(
    competitorData: {
      name: string;
      industry: string;
      domain?: string;
      searchResults: string;
      extractedData: ExtractedData;
    },
    context?: Record<string, unknown>
  ): Promise<CompetitorIntelligence> {
    try {
      const analysisResult = await this.analyzeData({
        type: 'competitor_analysis',
        data: {
          competitorName: competitorData.name,
          industry: competitorData.industry,
          domain: competitorData.domain || '',
          searchResults: competitorData.searchResults,
          urls: competitorData.extractedData.urls.join(', '),
          keywords: competitorData.extractedData.keywords.join(', '),
          pricing: JSON.stringify(competitorData.extractedData.pricing),
          socialMedia: JSON.stringify(competitorData.extractedData.socialMedia)
        },
        context
      });

      // Transform the analysis result into CompetitorIntelligence format
      const intelligence: CompetitorIntelligence = {
        competitorId: competitorData.name.toLowerCase().replace(/\s+/g, '_'),
        lastAnalyzed: analysisResult.timestamp,
        overallThreatLevel: this.assessThreatLevel(analysisResult.analysis),
        keyStrengths: analysisResult.analysis.swotAnalysis?.strengths || [],
        keyWeaknesses: analysisResult.analysis.swotAnalysis?.weaknesses || [],
        marketPosition: analysisResult.analysis.marketPosition?.positioning || '',
        strategicThreats: this.extractStrategicThreats(analysisResult.analysis),
        opportunities: this.extractOpportunities(analysisResult.analysis),
        monitoringRecommendations: this.extractMonitoringRecommendations(analysisResult.analysis)
      };

      return intelligence;
    } catch (error) {
      logger.error('Competitor analysis failed:', {
        competitorName: competitorData.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async analyzeMarketChanges(
    changeEvents: ChangeEvent[],
    marketContext: Record<string, unknown>
  ): Promise<AIAnalysisResult> {
    const changeData = changeEvents.map(event => ({
      type: event.type,
      changeType: event.changeType,
      significance: event.significance,
      description: event.description,
      timestamp: event.timestamp.toISOString(),
      confidence: event.confidence
    }));

    return this.analyzeData({
      type: 'strategic_insights',
      data: {
        companyContext: marketContext.company || {},
        competitorData: marketContext.competitors || {},
        changeData: JSON.stringify(changeData)
      },
      context: marketContext
    });
  }

  async analyzePricingStrategy(
    pricingData: Array<{
      competitor: string;
      product: string;
      price: number;
      currency: string;
      features: string[];
    }>,
    category: string,
    context?: Record<string, unknown>
  ): Promise<AIAnalysisResult> {
    return this.analyzeData({
      type: 'pricing_analysis',
      data: {
        category,
        pricingData: JSON.stringify(pricingData),
        features: JSON.stringify(pricingData.map(p => ({ product: p.product, features: p.features })))
      },
      context
    });
  }

  // Private helper methods
  private buildPrompt(
    template: DeepSeekPromptTemplate,
    data: Record<string, unknown>,
    context?: Record<string, unknown>
  ): string {
    let prompt = template.userPromptTemplate;

    // Replace required variables
    for (const variable of template.requiredVariables) {
      const value = data[variable];
      if (value === undefined) {
        throw new Error(`Required variable '${variable}' is missing`);
      }
      prompt = prompt.replace(new RegExp(`{${variable}}`, 'g'), String(value));
    }

    // Replace optional variables
    for (const variable of template.optionalVariables) {
      const value = data[variable] || context?.[variable] || '';
      prompt = prompt.replace(new RegExp(`{${variable}}`, 'g'), String(value));
    }

    // Replace any remaining context variables
    if (context) {
      prompt = prompt.replace(/{context}/g, JSON.stringify(context, null, 2));
    }

    return prompt;
  }

  private async callDeepSeekAPI(
    prompt: string,
    options?: AIAnalysisRequest['options']
  ): Promise<{
    content: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }> {
    if (!this.config.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const requestBody = {
      model: options?.model || this.config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature || this.config.temperature,
      stream: false
    };

    logger.debug('Making DeepSeek API request', {
      model: requestBody.model,
      maxTokens: requestBody.max_tokens,
      temperature: requestBody.temperature,
      promptLength: prompt.length
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from DeepSeek API');
    }

    return {
      content: data.choices[0].message.content,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  private async parseAnalysisResponse(
    type: string,
    content: string,
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  ): Promise<AIAnalysisResult> {
    try {
      // Try to parse as JSON first
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        // If not valid JSON, treat as text response
        parsedContent = {
          summary: content.substring(0, 500),
          keyInsights: [
            {
              insight: content.substring(0, 200),
              confidence: 0.7,
              category: 'trend',
              priority: 'medium'
            }
          ],
          recommendations: []
        };
      }

      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        id: analysisId,
        type,
        timestamp: new Date(),
        confidence: this.calculateOverallConfidence(parsedContent),
        analysis: {
          summary: parsedContent.summary || 'Analysis completed',
          keyInsights: parsedContent.keyInsights || [],
          swotAnalysis: parsedContent.swotAnalysis,
          recommendations: parsedContent.recommendations || [],
          marketPosition: parsedContent.marketPosition,
          riskAssessment: parsedContent.riskAssessment
        },
        rawResponse: content,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        },
        metadata: {
          model: this.config.model,
          analysisType: type,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to parse analysis response:', {
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length
      });
      throw error;
    }
  }

  private calculateOverallConfidence(analysis: Record<string, unknown>): number {
    if (analysis.keyInsights && Array.isArray(analysis.keyInsights)) {
      const confidenceSum = analysis.keyInsights.reduce(
        (sum: number, insight: { confidence?: number }) => sum + (insight.confidence || 0.5),
        0
      );
      return Math.min(confidenceSum / analysis.keyInsights.length, 1.0);
    }
    return 0.7; // Default confidence
  }

  private assessThreatLevel(analysis: AIAnalysisResult['analysis']): 'low' | 'medium' | 'high' | 'critical' {
    if (analysis.riskAssessment?.level) {
      return analysis.riskAssessment.level;
    }

    // Assess based on insights
    const highPriorityThreats = analysis.keyInsights.filter(
      insight => insight.category === 'threat' && insight.priority === 'high'
    );

    const criticalThreats = analysis.keyInsights.filter(
      insight => insight.category === 'threat' && insight.priority === 'critical'
    );

    if (criticalThreats.length > 0) return 'critical';
    if (highPriorityThreats.length > 1) return 'high';
    if (highPriorityThreats.length > 0) return 'medium';
    return 'low';
  }

  private extractStrategicThreats(analysis: AIAnalysisResult['analysis']): Array<{
    threat: string;
    likelihood: number;
    impact: number;
    timeframe: string;
  }> {
    const threats = analysis.keyInsights
      .filter(insight => insight.category === 'threat')
      .map(insight => ({
        threat: insight.insight,
        likelihood: insight.confidence,
        impact: insight.priority === 'critical' ? 0.9 : insight.priority === 'high' ? 0.7 : 0.5,
        timeframe: 'medium_term' // Default timeframe
      }));

    return threats.slice(0, 5); // Limit to top 5 threats
  }

  private extractOpportunities(analysis: AIAnalysisResult['analysis']): Array<{
    opportunity: string;
    potential: number;
    effort: string;
  }> {
    const opportunities = analysis.keyInsights
      .filter(insight => insight.category === 'opportunity')
      .map(insight => ({
        opportunity: insight.insight,
        potential: insight.confidence,
        effort: insight.priority === 'high' ? 'low' : insight.priority === 'medium' ? 'medium' : 'high'
      }));

    return opportunities.slice(0, 5); // Limit to top 5 opportunities
  }

  private extractMonitoringRecommendations(analysis: AIAnalysisResult['analysis']): string[] {
    return analysis.recommendations
      .filter(rec => rec.timeline === 'immediate' || rec.timeline === 'short_term')
      .map(rec => rec.action)
      .slice(0, 3); // Limit to top 3 monitoring recommendations
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      apiKeyConfigured: boolean;
      modelConfigured: boolean;
      lastSuccessfulCall?: Date;
      lastError?: string;
    };
  }> {
    try {
      const apiKeyConfigured = Boolean(this.config.apiKey);
      const modelConfigured = Boolean(this.config.model);

      if (!apiKeyConfigured) {
        return {
          status: 'unhealthy',
          details: {
            apiKeyConfigured,
            modelConfigured,
            lastError: 'API key not configured'
          }
        };
      }

      // Test API with minimal request
      await this.callDeepSeekAPI('Test connection', {
        maxTokens: 10,
        temperature: 0
      });

      return {
        status: 'healthy',
        details: {
          apiKeyConfigured,
          modelConfigured,
          lastSuccessfulCall: new Date()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          apiKeyConfigured: Boolean(this.config.apiKey),
          modelConfigured: Boolean(this.config.model),
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // Configuration management
  updateConfig(newConfig: Partial<BusinessIntelligenceConfig['deepseek']>): void {
    this.config = { ...this.config, ...newConfig };

    logger.info('DeepSeek AI configuration updated', {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    });
  }

  // Get available prompt templates
  getPromptTemplates(): DeepSeekPromptTemplate[] {
    return Object.values(this.promptTemplates);
  }

  // Add custom prompt template
  addPromptTemplate(template: DeepSeekPromptTemplate): void {
    this.promptTemplates[template.id] = template;

    logger.info('Custom prompt template added', {
      id: template.id,
      name: template.name
    });
  }
}

// Export singleton instance
export const deepSeekAIService = DeepSeekAIService.getInstance();