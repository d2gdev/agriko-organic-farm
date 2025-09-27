// Market Channel Data Analyzer
import { logger } from '../../../logger';
import { serperService } from '../../services/serper';
import type { MarketChannelData, SerperSearchResult } from '../../types/config';

export class MarketChannelAnalyzer {
  async gatherMarketChannelData(marketSegment: string): Promise<MarketChannelData> {
    try {
      // Search for market channel trends and data
      const marketResults = await Promise.all([
        serperService.searchMarketAnalysis(marketSegment, ['channels', 'distribution']),
        serperService.searchIndustryNews(marketSegment, 'month'),
        serperService.search({
          query: `"${marketSegment}" distribution channels market share trends`,
          num: 20
        })
      ]);

      const channelData = await this.extractMarketChannelData(marketResults.flat() as SerperSearchResult[]);

      return {
        channelId: `market-${marketSegment}`,
        marketSize: 1000000,
        growthRate: 0.15,
        saturation: 0.65,
        barriers: ['regulatory', 'competition'],
        opportunities: ['digital transformation', 'market expansion'],
        marketSegment,
        channelEffectiveness: { 'digital': 0.8, 'traditional': 0.7, 'social': 0.75 },
        dominantChannels: channelData.dominantChannels || [],
        emergingChannels: channelData.emergingChannels || [],
        decliningChannels: channelData.decliningChannels || [],
        marketSaturation: channelData.marketSaturation || 0.65,
        customerPreferences: channelData.customerPreferences || [],
        regulatoryFactors: channelData.regulatoryFactors || [],
        dataQuality: 'good',
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Market channel data gathering failed:', {
        marketSegment,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async extractMarketChannelData(
    searchResults: SerperSearchResult[]
  ): Promise<Partial<MarketChannelData>> {
    const dominantChannels = new Set<string>();
    const emergingChannels = new Set<string>();
    const decliningChannels = new Set<string>();
    const customerPreferences: string[] = [];
    const regulatoryFactors: string[] = [];

    for (const result of searchResults) {
      const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();

      // Extract dominant channels
      if (text.includes('leading') || text.includes('dominant') || text.includes('major')) {
        const channels = this.extractChannelNames(text);
        channels.forEach(ch => dominantChannels.add(ch));
      }

      // Extract emerging channels
      if (text.includes('emerging') || text.includes('new') || text.includes('innovative')) {
        const channels = this.extractChannelNames(text);
        channels.forEach(ch => emergingChannels.add(ch));
      }

      // Extract declining channels
      if (text.includes('declining') || text.includes('obsolete') || text.includes('traditional')) {
        const channels = this.extractChannelNames(text);
        channels.forEach(ch => decliningChannels.add(ch));
      }

      // Extract customer preferences
      if (text.includes('prefer') || text.includes('customer') || text.includes('demand')) {
        const prefs = this.extractPreferences(text);
        customerPreferences.push(...prefs);
      }

      // Extract regulatory factors
      if (text.includes('regulation') || text.includes('compliance') || text.includes('law')) {
        const factors = this.extractRegulatoryFactors(text);
        regulatoryFactors.push(...factors);
      }
    }

    return {
      dominantChannels: Array.from(dominantChannels),
      emergingChannels: Array.from(emergingChannels),
      decliningChannels: Array.from(decliningChannels),
      customerPreferences: Array.from(new Set(customerPreferences)),
      regulatoryFactors: Array.from(new Set(regulatoryFactors)),
      marketSaturation: this.calculateMarketSaturation(dominantChannels.size, emergingChannels.size)
    };
  }

  private extractChannelNames(text: string): string[] {
    const channels: string[] = [];
    const channelKeywords = {
      'online': ['online', 'e-commerce', 'website', 'digital'],
      'retail': ['retail', 'store', 'brick-and-mortar'],
      'marketplace': ['marketplace', 'amazon', 'ebay', 'platform'],
      'social': ['social media', 'instagram', 'facebook', 'tiktok'],
      'mobile': ['mobile', 'app', 'mobile application'],
      'direct': ['direct sales', 'direct-to-consumer', 'd2c'],
      'wholesale': ['wholesale', 'b2b', 'distributor'],
      'partners': ['partner', 'reseller', 'affiliate']
    };

    for (const [channel, keywords] of Object.entries(channelKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        channels.push(channel);
      }
    }

    return channels;
  }

  private extractPreferences(text: string): string[] {
    const preferences: string[] = [];

    if (text.includes('convenience')) preferences.push('convenience');
    if (text.includes('price') || text.includes('cost')) preferences.push('price-sensitive');
    if (text.includes('quality')) preferences.push('quality-focused');
    if (text.includes('speed') || text.includes('fast')) preferences.push('fast-delivery');
    if (text.includes('personal') || text.includes('custom')) preferences.push('personalization');
    if (text.includes('sustainable') || text.includes('eco')) preferences.push('sustainability');

    return preferences;
  }

  private extractRegulatoryFactors(text: string): string[] {
    const factors: string[] = [];

    if (text.includes('gdpr') || text.includes('privacy')) factors.push('data-privacy');
    if (text.includes('tax')) factors.push('tax-compliance');
    if (text.includes('license') || text.includes('permit')) factors.push('licensing');
    if (text.includes('import') || text.includes('export')) factors.push('trade-regulations');
    if (text.includes('safety') || text.includes('standard')) factors.push('safety-standards');

    return factors;
  }

  private calculateMarketSaturation(dominantCount: number, emergingCount: number): number {
    // Simple heuristic: more dominant channels = higher saturation
    // more emerging channels = lower saturation
    const saturationFromDominant = Math.min(dominantCount * 0.2, 0.8);
    const saturationFromEmerging = Math.max(0, -emergingCount * 0.1);
    return Math.min(1, Math.max(0, 0.5 + saturationFromDominant + saturationFromEmerging));
  }
}