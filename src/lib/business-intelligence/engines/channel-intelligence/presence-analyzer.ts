// Channel Presence Analyzer
import { logger } from '../../../logger';
import { serperService } from '../../services/serper';
import type { Competitor } from '../../types/competitor';
import type { ChannelPresenceAnalysis, SerperSearchResult } from '../../types/config';
import type { ChannelPresenceData, DigitalPresenceMetrics, PhysicalPresenceMetrics } from './types';

export class ChannelPresenceAnalyzer {
  async analyzeChannelPresence(competitorId: string): Promise<ChannelPresenceAnalysis> {
    try {
      // Get competitor data from graph database - using mock data for now
      const competitorData: Pick<Competitor, 'name' | 'domain'> = {
        name: `Competitor ${competitorId}`,
        domain: 'example.com'
      };

      // Search for channel presence data
      const channelSearchResults = await Promise.all([
        serperService.searchCompetitorInfo(competitorData.name, competitorData.domain),
        serperService.search({
          query: `"${competitorData.name}" sales channels distribution partners`,
          num: 15
        }),
        serperService.search({
          query: `"${competitorData.name}" retail stores online marketplace`,
          num: 10
        })
      ]);

      const channels = await this.extractChannelInformation(channelSearchResults.flat() as SerperSearchResult[]);

      return {
        competitorId,
        present: channels.length > 0,
        strength: channels.length > 5 ? 'strong' : channels.length > 2 ? 'moderate' : 'weak',
        contentVolume: channels.reduce((sum, c) => sum + (c.contentVolume || 0), 0),
        engagement: channels.reduce((sum, c) => sum + (c.engagement || 0), 0) / Math.max(channels.length, 1),
        lastActivity: new Date(),
        trends: channels.filter(c => c.maturity === 'emerging').map(c => c.name),
        channels: channels.map(c => c.name)
      };
    } catch (error) {
      logger.error('Channel presence analysis failed:', {
        competitorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async extractChannelInformation(
    searchResults: SerperSearchResult[]
  ): Promise<ChannelPresenceData[]> {
    const channels = new Map<string, ChannelPresenceData>();

    for (const result of searchResults) {
      const channelInfo = this.extractChannelFromResult(result);
      if (channelInfo && !channels.has(channelInfo.name)) {
        channels.set(channelInfo.name, channelInfo);
      }
    }

    return Array.from(channels.values());
  }

  private extractChannelFromResult(result: SerperSearchResult): ChannelPresenceData | null {
    const title = result.title?.toLowerCase() || '';
    const snippet = result.snippet?.toLowerCase() || '';

    const channelName = this.inferChannelName(title, snippet);
    if (!channelName) return null;

    return {
      name: channelName,
      type: this.inferChannelType(title, snippet),
      reach: this.inferReach(title, snippet),
      maturity: this.inferMaturity(title, snippet),
      performanceIndicators: [],
      investmentLevel: this.inferInvestmentLevel(title, snippet),
      contentVolume: this.estimateContentVolume(title, snippet),
      engagement: this.estimateEngagement(title, snippet)
    };
  }

  private inferChannelName(title: string, snippet: string): string {
    const text = `${title} ${snippet}`.toLowerCase();
    if (text.includes('online') || text.includes('website')) return 'online';
    if (text.includes('retail') || text.includes('store')) return 'retail';
    if (text.includes('partner') || text.includes('reseller')) return 'partners';
    if (text.includes('social') || text.includes('media')) return 'social';
    if (text.includes('mobile') || text.includes('app')) return 'mobile';
    return '';
  }

  private inferChannelType(title: string, snippet: string): string {
    const text = `${title} ${snippet}`.toLowerCase();
    if (text.includes('digital') || text.includes('online')) return 'digital';
    if (text.includes('physical') || text.includes('store')) return 'physical';
    if (text.includes('partner') || text.includes('indirect')) return 'indirect';
    return 'hybrid';
  }

  private inferReach(title: string, snippet: string): string {
    const text = `${title} ${snippet}`.toLowerCase();
    if (text.includes('global') || text.includes('international')) return 'global';
    if (text.includes('national') || text.includes('nationwide')) return 'national';
    if (text.includes('regional')) return 'regional';
    return 'local';
  }

  private inferMaturity(title: string, snippet: string): string {
    const text = `${title} ${snippet}`.toLowerCase();
    if (text.includes('new') || text.includes('launch') || text.includes('pilot')) return 'emerging';
    if (text.includes('growth') || text.includes('expanding')) return 'growth';
    if (text.includes('established') || text.includes('mature')) return 'established';
    return 'unknown';
  }

  private inferInvestmentLevel(title: string, snippet: string): string {
    const text = `${title} ${snippet}`.toLowerCase();
    if (text.includes('major') || text.includes('significant') || text.includes('billion')) return 'high';
    if (text.includes('moderate') || text.includes('million')) return 'medium';
    return 'low';
  }

  private estimateContentVolume(title: string, snippet: string): number {
    const text = `${title} ${snippet}`.toLowerCase();
    if (text.includes('thousands') || text.includes('extensive')) return 1000;
    if (text.includes('hundreds')) return 100;
    return 10;
  }

  private estimateEngagement(title: string, snippet: string): number {
    const text = `${title} ${snippet}`.toLowerCase();
    let engagement = 0.5;
    if (text.includes('popular') || text.includes('successful')) engagement += 0.2;
    if (text.includes('growing') || text.includes('increasing')) engagement += 0.1;
    if (text.includes('declining') || text.includes('struggling')) engagement -= 0.2;
    return Math.max(0, Math.min(1, engagement));
  }

  assessDigitalPresence(channels: ChannelPresenceData[]): DigitalPresenceMetrics {
    const digitalChannels = channels
      .filter(c => c.type === 'digital' || c.type === 'hybrid')
      .map(c => c.name);

    return {
      strength: digitalChannels.length > 3 ? 'strong' : digitalChannels.length > 1 ? 'moderate' : 'weak',
      channels: digitalChannels,
      coverage: digitalChannels.length / Math.max(channels.length, 1)
    };
  }

  assessPhysicalPresence(channels: ChannelPresenceData[]): PhysicalPresenceMetrics {
    const physicalChannels = channels
      .filter(c => c.type === 'physical' || c.type === 'hybrid')
      .map(c => c.name);

    return {
      strength: physicalChannels.length > 2 ? 'strong' : physicalChannels.length > 0 ? 'moderate' : 'weak',
      channels: physicalChannels,
      coverage: physicalChannels.length / Math.max(channels.length, 1)
    };
  }

  quantifyReach(reach: string): number {
    switch (reach) {
      case 'global': return 1.0;
      case 'national': return 0.7;
      case 'regional': return 0.4;
      case 'local': return 0.2;
      default: return 0.1;
    }
  }
}