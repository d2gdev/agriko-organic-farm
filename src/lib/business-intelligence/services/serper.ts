// Business Intelligence - Serper API Integration Service
import { logger } from '@/lib/logger';
import type {
  SerperSearchOptions,
  SerperResponse,
  SerperSearchResult,
  BusinessIntelligenceConfig
} from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';

// Rate limiting and request management
interface RateLimitState {
  requests: number;
  windowStart: number;
  maxRequests: number;
  windowMs: number;
}

export class SerperService {
  private config: BusinessIntelligenceConfig['serper'];
  private rateLimitState: RateLimitState;
  private static instance: SerperService | null = null;

  private constructor() {
    this.config = DEFAULT_CONFIG.serper;
    this.rateLimitState = {
      requests: 0,
      windowStart: Date.now(),
      maxRequests: this.config.rateLimit,
      windowMs: 60000 // 1 minute window
    };

    logger.info('Serper API service initialized', {
      apiUrl: this.config.apiUrl,
      rateLimit: this.config.rateLimit
    });
  }

  public static getInstance(): SerperService {
    if (!SerperService.instance) {
      SerperService.instance = new SerperService();
    }
    return SerperService.instance;
  }

  // Core search functionality
  async search(options: SerperSearchOptions): Promise<SerperResponse> {
    try {
      await this.checkRateLimit();

      logger.debug('Executing Serper search', {
        query: options.query.substring(0, 50),
        type: options.type || 'search',
        num: options.num || 10
      });

      const searchParams = this.buildSearchParams(options);
      const response = await this.makeRequest('/api/v1/search', searchParams);

      logger.info('Serper search completed successfully', {
        query: options.query.substring(0, 50),
        resultCount: response.organic?.length || 0,
        creditsUsed: response.credits || 0
      });

      return response;
    } catch (error) {
      logger.error('Serper search failed:', {
        query: options.query,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Competitor-specific search methods
  async searchCompetitorInfo(competitorName: string, domain?: string): Promise<SerperSearchResult[]> {
    try {
      const query = domain
        ? `"${competitorName}" site:${domain} OR "${competitorName}" company info`
        : `"${competitorName}" company information business`;

      const response = await this.search({
        query,
        num: 10,
        gl: 'us',
        hl: 'en'
      });

      const results = response.organic || [];

      logger.debug('Competitor info search completed', {
        competitorName,
        domain,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Competitor info search failed:', {
        competitorName,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async searchCompetitorProducts(competitorName: string, domain?: string): Promise<SerperSearchResult[]> {
    try {
      const query = domain
        ? `site:${domain} products OR services OR solutions`
        : `"${competitorName}" products services solutions catalog`;

      const response = await this.search({
        query,
        num: 15,
        gl: 'us',
        hl: 'en'
      });

      const results = response.organic || [];

      logger.debug('Competitor products search completed', {
        competitorName,
        domain,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Competitor products search failed:', {
        competitorName,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async searchCompetitorPricing(competitorName: string, domain?: string): Promise<SerperSearchResult[]> {
    try {
      const query = domain
        ? `site:${domain} pricing OR price OR cost OR subscription`
        : `"${competitorName}" pricing cost subscription plans`;

      const response = await this.search({
        query,
        num: 10,
        gl: 'us',
        hl: 'en'
      });

      const results = response.organic || [];

      logger.debug('Competitor pricing search completed', {
        competitorName,
        domain,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Competitor pricing search failed:', {
        competitorName,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async searchIndustryNews(industry: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<SerperSearchResult[]> {
    try {
      const tbsMap = {
        day: 'qdr:d',
        week: 'qdr:w',
        month: 'qdr:m'
      };

      const query = `"${industry}" news trends analysis market`;

      const response = await this.search({
        query,
        num: 20,
        gl: 'us',
        hl: 'en',
        type: 'news',
        tbs: tbsMap[timeframe]
      });

      const results = response.organic || [];

      logger.debug('Industry news search completed', {
        industry,
        timeframe,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Industry news search failed:', {
        industry,
        timeframe,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async searchMarketAnalysis(industry: string, keywords: string[] = []): Promise<SerperSearchResult[]> {
    try {
      const keywordString = keywords.length > 0 ? keywords.join(' ') : '';
      const query = `"${industry}" market analysis research report ${keywordString}`;

      const response = await this.search({
        query,
        num: 15,
        gl: 'us',
        hl: 'en'
      });

      const results = response.organic || [];

      logger.debug('Market analysis search completed', {
        industry,
        keywords,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Market analysis search failed:', {
        industry,
        keywords,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Social media and channel monitoring
  async searchSocialMediaMentions(competitorName: string, platform?: string): Promise<SerperSearchResult[]> {
    try {
      const platformQuery = platform
        ? `site:${platform}.com "${competitorName}"`
        : `"${competitorName}" site:twitter.com OR site:linkedin.com OR site:facebook.com OR site:instagram.com`;

      const response = await this.search({
        query: platformQuery,
        num: 20,
        gl: 'us',
        hl: 'en'
      });

      const results = response.organic || [];

      logger.debug('Social media mentions search completed', {
        competitorName,
        platform,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Social media mentions search failed:', {
        competitorName,
        platform,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async searchTechnologyStack(domain: string): Promise<SerperSearchResult[]> {
    try {
      const query = `site:${domain} OR "${domain}" technology stack tech architecture platform`;

      const response = await this.search({
        query,
        num: 10,
        gl: 'us',
        hl: 'en'
      });

      const results = response.organic || [];

      logger.debug('Technology stack search completed', {
        domain,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Technology stack search failed:', {
        domain,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Bulk operations for efficiency
  async batchSearch(queries: SerperSearchOptions[], delayMs: number = 1000): Promise<SerperResponse[]> {
    const results: SerperResponse[] = [];

    logger.info('Starting batch search operation', {
      queryCount: queries.length,
      delayMs
    });

    for (let i = 0; i < queries.length; i++) {
      try {
        await this.checkRateLimit();

        const query = queries[i];
        if (query) {
          const result = await this.search(query);
          results.push(result);

          logger.debug('Batch search progress', {
            completed: i + 1,
            total: queries.length,
            query: query.query.substring(0, 30)
          });
        }

        // Add delay between requests to respect rate limits
        if (i < queries.length - 1) {
          await this.delay(delayMs);
        }
      } catch (error) {
        const query = queries[i];
        logger.error('Batch search item failed:', {
          index: i,
          query: query?.query || 'Unknown query',
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Continue with remaining queries even if one fails
        continue;
      }
    }

    logger.info('Batch search operation completed', {
      successCount: results.length,
      totalQueries: queries.length
    });

    return results;
  }

  // Utility methods
  private buildSearchParams(options: SerperSearchOptions): Record<string, unknown> {
    return {
      q: options.query,
      num: options.num || 10,
      gl: options.gl || 'us',
      hl: options.hl || 'en',
      type: options.type || 'search',
      ...(options.tbs && { tbs: options.tbs })
    };
  }

  private async makeRequest(endpoint: string, params: Record<string, unknown>): Promise<SerperResponse> {
    if (!this.config.apiKey) {
      throw new Error('Serper API key not configured');
    }

    const url = `${this.config.apiUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serper API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    this.updateRateLimit();

    return data;
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset window if needed
    if (now - this.rateLimitState.windowStart >= this.rateLimitState.windowMs) {
      this.rateLimitState.requests = 0;
      this.rateLimitState.windowStart = now;
    }

    // Check if we've exceeded the rate limit
    if (this.rateLimitState.requests >= this.rateLimitState.maxRequests) {
      const timeToWait = this.rateLimitState.windowMs - (now - this.rateLimitState.windowStart);

      logger.warn('Rate limit reached, waiting', {
        timeToWait,
        currentRequests: this.rateLimitState.requests,
        maxRequests: this.rateLimitState.maxRequests
      });

      await this.delay(timeToWait);

      // Reset after waiting
      this.rateLimitState.requests = 0;
      this.rateLimitState.windowStart = Date.now();
    }
  }

  private updateRateLimit(): void {
    this.rateLimitState.requests++;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check for monitoring
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      apiKeyConfigured: boolean;
      rateLimitStatus: {
        requests: number;
        maxRequests: number;
        windowMs: number;
      };
      lastError?: string;
    };
  }> {
    try {
      const _testQuery = 'test health check';

      // Don't actually make the request for health check, just validate config
      const apiKeyConfigured = Boolean(this.config.apiKey);

      if (!apiKeyConfigured) {
        return {
          status: 'unhealthy',
          details: {
            apiKeyConfigured,
            rateLimitStatus: {
              requests: this.rateLimitState.requests,
              maxRequests: this.rateLimitState.maxRequests,
              windowMs: this.rateLimitState.windowMs
            },
            lastError: 'API key not configured'
          }
        };
      }

      return {
        status: 'healthy',
        details: {
          apiKeyConfigured,
          rateLimitStatus: {
            requests: this.rateLimitState.requests,
            maxRequests: this.rateLimitState.maxRequests,
            windowMs: this.rateLimitState.windowMs
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          apiKeyConfigured: Boolean(this.config.apiKey),
          rateLimitStatus: {
            requests: this.rateLimitState.requests,
            maxRequests: this.rateLimitState.maxRequests,
            windowMs: this.rateLimitState.windowMs
          },
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // Configuration management
  updateConfig(newConfig: Partial<BusinessIntelligenceConfig['serper']>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.rateLimit) {
      this.rateLimitState.maxRequests = newConfig.rateLimit;
    }

    logger.info('Serper API configuration updated', {
      rateLimit: this.config.rateLimit,
      timeout: this.config.timeout
    });
  }

  // Get current usage statistics
  getUsageStats(): {
    currentWindow: {
      requests: number;
      maxRequests: number;
      remainingRequests: number;
      windowStart: Date;
      windowEnd: Date;
    };
  } {
    const _now = Date.now();
    const windowEnd = this.rateLimitState.windowStart + this.rateLimitState.windowMs;

    return {
      currentWindow: {
        requests: this.rateLimitState.requests,
        maxRequests: this.rateLimitState.maxRequests,
        remainingRequests: Math.max(0, this.rateLimitState.maxRequests - this.rateLimitState.requests),
        windowStart: new Date(this.rateLimitState.windowStart),
        windowEnd: new Date(windowEnd)
      }
    };
  }
}

// Export singleton instance
export const serperService = SerperService.getInstance();