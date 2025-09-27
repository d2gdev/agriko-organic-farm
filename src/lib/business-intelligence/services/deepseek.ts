// Business Intelligence - DeepSeek AI Service
import { logger } from '@/lib/logger';
import { DEFAULT_CONFIG } from '../types/config';

export interface DeepSeekRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class DeepSeekService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://api.deepseek.com/v1/chat/completions';
  private readonly config = DEFAULT_CONFIG.deepseek;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('DeepSeek API key not configured');
    }
  }

  async generateResponse(request: DeepSeekRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || this.config.model,
          messages: request.messages,
          max_tokens: request.max_tokens || this.config.maxTokens,
          temperature: request.temperature || this.config.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data: DeepSeekResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from DeepSeek API');
      }

      return data.choices?.[0]?.message?.content || 'No response generated';
    } catch (error) {
      logger.error('DeepSeek API request failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async analyzeCompetitorData(competitorData: unknown): Promise<string> {
    const prompt = `Analyze the following competitor data and provide insights on market positioning, strengths, weaknesses, and strategic recommendations:

${JSON.stringify(competitorData, null, 2)}

Please provide a structured analysis including:
1. Market position assessment
2. Key strengths and advantages
3. Potential weaknesses or gaps
4. Strategic recommendations
5. Threat level assessment`;

    return this.generateResponse({
      messages: [
        {
          role: 'system',
          content: 'You are a business intelligence analyst specializing in competitive analysis. Provide detailed, actionable insights based on competitor data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });
  }

  async generateMarketInsights(marketData: unknown): Promise<string> {
    const prompt = `Based on the following market data, generate strategic insights and recommendations:

${JSON.stringify(marketData, null, 2)}

Focus on:
1. Market trends and opportunities
2. Growth potential analysis
3. Risk assessment
4. Strategic recommendations
5. Competitive landscape analysis`;

    return this.generateResponse({
      messages: [
        {
          role: 'system',
          content: 'You are a market research expert. Analyze market data and provide strategic business insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });
  }

  async generateBusinessInsight(data: unknown, context?: string): Promise<string> {
    const prompt = `Generate business insights based on the following data${context ? ` in the context of ${context}` : ''}:

${JSON.stringify(data, null, 2)}

Please provide actionable business insights including:
1. Key findings and trends
2. Strategic recommendations
3. Risk assessment
4. Opportunities identification
5. Next steps`;

    return this.generateResponse({
      messages: [
        {
          role: 'system',
          content: 'You are a senior business analyst. Provide strategic insights and actionable recommendations based on data analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });
  }

  async isHealthy(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await this.generateResponse({
        messages: [
          { role: 'user', content: 'Test connection' }
        ],
        max_tokens: 10
      });
      return !!response;
    } catch {
      return false;
    }
  }
}

export const deepSeekService = new DeepSeekService();