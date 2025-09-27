// Channel Data Store - Graph Database Integration
import { logger } from '../../../logger';
import { memgraphService } from '../../../memgraph';
import type { ChannelPresenceAnalysis } from '../../types/config';

export class ChannelDataStore {
  async storeChannelAnalysis(
    competitorId: string,
    analysisData: {
      channelPresence: ChannelPresenceAnalysis;
      timestamp?: Date;
    }
  ): Promise<void> {
    try {
      const timestamp = analysisData.timestamp || new Date();

      // Store channel presence in graph database
      for (const channelName of analysisData.channelPresence.channels || []) {
        const query = `
          MERGE (c:Competitor {id: $competitorId})
          SET c.lastAnalyzed = $timestamp
          WITH c

          MERGE (ch:Channel {name: $channelName})
          MERGE (c)-[r:USES_CHANNEL]->(ch)
          SET r.strength = $strength,
              r.engagement = $engagement,
              r.contentVolume = $contentVolume,
              r.timestamp = $timestamp

          RETURN c, ch, r
        `;

        const parameters = {
          competitorId,
          channelName,
          strength: analysisData.channelPresence.strength,
          engagement: analysisData.channelPresence.engagement || 0,
          contentVolume: analysisData.channelPresence.contentVolume || 0,
          timestamp: timestamp.toISOString()
        };

        await memgraphService.query(query, parameters);
      }

      logger.info('Channel analysis stored successfully', {
        competitorId,
        channelCount: analysisData.channelPresence.channels?.length || 0
      });
    } catch (error) {
      logger.error('Failed to store channel analysis:', {
        competitorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw - allow analysis to continue even if storage fails
    }
  }

  async retrieveChannelHistory(
    competitorId: string,
    limit: number = 10
  ): Promise<ChannelPresenceAnalysis[]> {
    try {
      const query = `
        MATCH (c:Competitor {id: $competitorId})-[r:USES_CHANNEL]->(ch:Channel)
        RETURN ch.name as channelName,
               r.strength as strength,
               r.engagement as engagement,
               r.contentVolume as contentVolume,
               r.timestamp as timestamp
        ORDER BY r.timestamp DESC
        LIMIT $limit
      `;

      const result = await memgraphService.query<any>(query, { competitorId, limit });

      // Group results by timestamp to reconstruct historical analyses
      const historyMap = new Map<string, ChannelPresenceAnalysis>();

      for (const row of (result as any) || []) {
        const timestamp = row.timestamp as string;
        if (!historyMap.has(timestamp)) {
          historyMap.set(timestamp, {
            competitorId,
            present: true,
            strength: row.strength as 'strong' | 'moderate' | 'weak',
            contentVolume: 0,
            engagement: 0,
            lastActivity: new Date(timestamp),
            trends: [],
            channels: []
          });
        }

        const analysis = historyMap.get(timestamp)!;
        analysis.channels?.push(row.channelName as string);
        analysis.contentVolume! += (row.contentVolume as number) || 0;
        analysis.engagement = Math.max(analysis.engagement || 0, (row.engagement as number) || 0);
      }

      return Array.from(historyMap.values());
    } catch (error) {
      logger.error('Failed to retrieve channel history:', {
        competitorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async getCompetitorChannelOverlap(competitorIds: string[]): Promise<Map<string, string[]>> {
    try {
      const query = `
        MATCH (c:Competitor)-[:USES_CHANNEL]->(ch:Channel)
        WHERE c.id IN $competitorIds
        RETURN ch.name as channel, collect(DISTINCT c.id) as competitors
      `;

      const result = await memgraphService.query<any>(query, { competitorIds });

      const overlapMap = new Map<string, string[]>();
      for (const row of (result as any) || []) {
        overlapMap.set(row.channel as string, row.competitors as string[]);
      }

      return overlapMap;
    } catch (error) {
      logger.error('Failed to get channel overlap:', { error: error instanceof Error ? error.message : String(error) });
      return new Map();
    }
  }

  async cleanupOldAnalyses(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const query = `
        MATCH (c:Competitor)-[r:USES_CHANNEL]->(ch:Channel)
        WHERE r.timestamp < $cutoffDate
        DELETE r
        RETURN count(r) as deletedCount
      `;

      const result = await memgraphService.query<any>(query, {
        cutoffDate: cutoffDate.toISOString()
      });

      const deletedCount = (result as any)?.length > 0 ? (result as any)[0]?.deletedCount || 0 : 0;

      logger.info('Cleaned up old channel analyses', {
        deletedCount,
        daysToKeep
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old analyses:', { error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }
}