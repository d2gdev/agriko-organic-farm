// Business Intelligence - Change Detection and Monitoring Service
import { logger } from '@/lib/logger';
import { memgraphBI } from '../memgraph/connection';
import { ChangeEntityType, isChangeEntityType } from '@/types/business-intelligence-types';
import type { SerperSearchResult } from '../types/config';
import type { ExtractedData } from './data-processor';

// Change detection interfaces
export interface ChangeEvent {
  id: string;
  type: 'competitor' | 'product' | 'pricing' | 'content' | 'ranking';
  entityId: string;
  entityType: 'competitor' | 'product' | 'channel' | 'campaign';
  changeType: 'added' | 'modified' | 'removed' | 'status_change';
  timestamp: Date;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  confidence: number;
  significance: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  metadata: Record<string, unknown>;
}

export interface MonitoringTarget {
  id: string;
  type: 'competitor' | 'product' | 'keyword' | 'industry';
  entityId: string;
  searchQuery: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  lastChecked: Date;
  isActive: boolean;
  alertThreshold: number;
  metadata: Record<string, unknown>;
}

export interface ComparisonResult {
  hasChanges: boolean;
  changes: ChangeEvent[];
  similarity: number;
  addedItems: Record<string, unknown>[];
  removedItems: Record<string, unknown>[];
  modifiedItems: Array<{
    item: Record<string, unknown>;
    changes: Record<string, { old: Record<string, unknown>; new: Record<string, unknown> }>;
  }>;
}

interface SnapshotData {
  id: string;
  entityId: string;
  entityType: string;
  timestamp: Date;
  content: string;
  extractedData: ExtractedData;
  searchResults: SerperSearchResult[];
  hash: string;
  metadata: Record<string, unknown>;
}

export class ChangeDetectionService {
  private static instance: ChangeDetectionService | null = null;

  public static getInstance(): ChangeDetectionService {
    if (!ChangeDetectionService.instance) {
      ChangeDetectionService.instance = new ChangeDetectionService();
    }
    return ChangeDetectionService.instance;
  }

  // Store baseline snapshot for change detection
  async createSnapshot(
    entityId: string,
    entityType: 'competitor' | 'product' | 'channel' | 'campaign',
    searchResults: SerperSearchResult[],
    extractedData: ExtractedData,
    metadata: Record<string, unknown> = {}
  ): Promise<string> {
    try {
      logger.debug('Creating snapshot for change detection', {
        entityId,
        entityType,
        resultCount: searchResults.length
      });

      // Combine content for hashing
      const content = searchResults
        .map(result => `${result.title} ${result.snippet}`)
        .join(' ');

      const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const hash = this.generateContentHash(content);

      const snapshot: SnapshotData = {
        id: snapshotId,
        entityId,
        entityType,
        timestamp: now,
        content,
        extractedData,
        searchResults,
        hash,
        metadata
      };

      // Store snapshot in Memgraph
      await memgraphBI.executeQuery(`
        CREATE (s:Snapshot {
          id: $id,
          entityId: $entityId,
          entityType: $entityType,
          timestamp: $timestamp,
          content: $content,
          extractedData: $extractedData,
          searchResults: $searchResults,
          hash: $hash,
          metadata: $metadata,
          createdAt: $createdAt
        })
        RETURN s
      `, {
        id: snapshotId,
        entityId,
        entityType,
        timestamp: now.toISOString(),
        content: content.substring(0, 5000), // Limit content size
        extractedData: JSON.stringify(snapshot.extractedData),
        searchResults: JSON.stringify(snapshot.searchResults),
        hash,
        metadata: JSON.stringify(metadata),
        createdAt: now.toISOString()
      });

      logger.info('Snapshot created successfully', {
        snapshotId,
        entityId,
        entityType,
        contentHash: hash
      });

      return snapshotId;
    } catch (error) {
      logger.error('Failed to create snapshot:', {
        entityId,
        entityType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Compare current data with previous snapshot
  async detectChanges(
    entityId: string,
    entityType: 'competitor' | 'product' | 'channel' | 'campaign',
    currentSearchResults: SerperSearchResult[],
    currentExtractedData: ExtractedData
  ): Promise<ComparisonResult> {
    try {
      logger.debug('Detecting changes', {
        entityId,
        entityType,
        currentResultCount: currentSearchResults.length
      });

      // Get the most recent snapshot
      const previousSnapshot = await this.getLatestSnapshot(entityId, entityType);

      if (!previousSnapshot) {
        logger.info('No previous snapshot found, creating initial baseline', {
          entityId,
          entityType
        });

        // Create initial snapshot
        await this.createSnapshot(entityId, entityType, currentSearchResults, currentExtractedData);

        return {
          hasChanges: false,
          changes: [],
          similarity: 1.0,
          addedItems: [],
          removedItems: [],
          modifiedItems: []
        };
      }

      // Compare current data with previous snapshot
      const result = await this.compareData(previousSnapshot, {
        searchResults: currentSearchResults,
        extractedData: currentExtractedData
      });

      // Generate change events for significant differences
      if (result.hasChanges) {
        const changeEvents = await this.generateChangeEvents(
          entityId,
          entityType,
          previousSnapshot,
          {
            searchResults: currentSearchResults,
            extractedData: currentExtractedData
          }
        );

        result.changes = changeEvents;

        // Store new snapshot if significant changes detected
        if (result.similarity < 0.9) {
          await this.createSnapshot(entityId, entityType, currentSearchResults, currentExtractedData);
        }
      }

      logger.info('Change detection completed', {
        entityId,
        entityType,
        hasChanges: result.hasChanges,
        changeCount: result.changes.length,
        similarity: result.similarity
      });

      return result;
    } catch (error) {
      logger.error('Failed to detect changes:', {
        entityId,
        entityType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        hasChanges: false,
        changes: [],
        similarity: 0,
        addedItems: [],
        removedItems: [],
        modifiedItems: []
      };
    }
  }

  // Monitor specific targets for changes
  async addMonitoringTarget(target: Omit<MonitoringTarget, 'id' | 'lastChecked'>): Promise<string> {
    try {
      const targetId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const monitoringTarget: MonitoringTarget = {
        id: targetId,
        lastChecked: now,
        ...target
      };

      await memgraphBI.executeQuery(`
        CREATE (m:MonitoringTarget {
          id: $id,
          type: $type,
          entityId: $entityId,
          searchQuery: $searchQuery,
          frequency: $frequency,
          lastChecked: $lastChecked,
          isActive: $isActive,
          alertThreshold: $alertThreshold,
          metadata: $metadata,
          createdAt: $createdAt
        })
        RETURN m
      `, {
        id: targetId,
        type: target.type,
        entityId: target.entityId,
        searchQuery: target.searchQuery,
        frequency: target.frequency,
        lastChecked: now.toISOString(),
        isActive: target.isActive,
        alertThreshold: target.alertThreshold,
        metadata: JSON.stringify(target.metadata),
        createdAt: monitoringTarget.lastChecked.toISOString()
      });

      logger.info('Monitoring target added', {
        targetId: monitoringTarget.id,
        type: monitoringTarget.type,
        entityId: monitoringTarget.entityId,
        frequency: monitoringTarget.frequency
      });

      return targetId;
    } catch (error) {
      logger.error('Failed to add monitoring target:', {
        entityId: target.entityId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Get monitoring targets that need to be checked
  async getDueMonitoringTargets(): Promise<MonitoringTarget[]> {
    try {
      const now = new Date();

      const result = await memgraphBI.executeQuery(`
        MATCH (m:MonitoringTarget)
        WHERE m.isActive = true
        RETURN m
        ORDER BY m.lastChecked ASC
      `);

      const targets: MonitoringTarget[] = result.records
        .map(record => {
          const node = record.get('m');
          const props = node.properties;

          return {
            id: props.id,
            type: props.type,
            entityId: props.entityId,
            searchQuery: props.searchQuery,
            frequency: props.frequency,
            lastChecked: new Date(props.lastChecked),
            isActive: props.isActive,
            alertThreshold: props.alertThreshold,
            metadata: JSON.parse(props.metadata || '{}')
          };
        })
        .filter(target => this.isTargetDue(target, now));

      logger.debug('Retrieved due monitoring targets', {
        totalTargets: result.records.length,
        dueTargets: targets.length
      });

      return targets;
    } catch (error) {
      logger.error('Failed to get due monitoring targets:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  // Update monitoring target last checked timestamp
  async updateMonitoringTarget(targetId: string, lastChecked: Date): Promise<void> {
    try {
      await memgraphBI.executeQuery(`
        MATCH (m:MonitoringTarget {id: $targetId})
        SET m.lastChecked = $lastChecked
        RETURN m
      `, {
        targetId,
        lastChecked: lastChecked.toISOString()
      });

      logger.debug('Monitoring target updated', { targetId });
    } catch (error) {
      logger.error('Failed to update monitoring target:', {
        targetId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get change events for an entity
  async getChangeHistory(
    entityId: string,
    entityType?: string,
    limit: number = 50
  ): Promise<ChangeEvent[]> {
    try {
      const typeFilter = entityType ? 'AND c.entityType = $entityType' : '';

      const result = await memgraphBI.executeQuery(`
        MATCH (c:ChangeEvent)
        WHERE c.entityId = $entityId ${typeFilter}
        RETURN c
        ORDER BY c.timestamp DESC
        LIMIT $limit
      `, {
        entityId,
        ...(entityType && { entityType }),
        limit
      });

      const changes: ChangeEvent[] = result.records.map(record => {
        const node = record.get('c');
        const props = node.properties;

        return {
          id: props.id,
          type: props.type,
          entityId: props.entityId,
          entityType: props.entityType,
          changeType: props.changeType,
          timestamp: new Date(props.timestamp),
          oldValue: props.oldValue ? JSON.parse(props.oldValue) : undefined,
          newValue: props.newValue ? JSON.parse(props.newValue) : undefined,
          confidence: props.confidence,
          significance: props.significance,
          description: props.description,
          source: props.source,
          metadata: JSON.parse(props.metadata || '{}')
        };
      });

      logger.debug('Retrieved change history', {
        entityId,
        entityType,
        changeCount: changes.length
      });

      return changes;
    } catch (error) {
      logger.error('Failed to get change history:', {
        entityId,
        entityType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  // Private helper methods
  private async getLatestSnapshot(
    entityId: string,
    entityType: string
  ): Promise<SnapshotData | null> {
    try {
      const result = await memgraphBI.executeQuery(`
        MATCH (s:Snapshot)
        WHERE s.entityId = $entityId AND s.entityType = $entityType
        RETURN s
        ORDER BY s.timestamp DESC
        LIMIT 1
      `, { entityId, entityType });

      if (result.records.length === 0) {
        return null;
      }

      const node = result.records[0]?.get('s');
      if (!node) {
        return null;
      }
      const props = node.properties;

      return {
        id: props.id,
        entityId: props.entityId,
        entityType: props.entityType,
        timestamp: new Date(props.timestamp),
        content: props.content,
        extractedData: JSON.parse(props.extractedData),
        searchResults: JSON.parse(props.searchResults),
        hash: props.hash,
        metadata: JSON.parse(props.metadata || '{}')
      };
    } catch (error) {
      logger.error('Failed to get latest snapshot:', {
        entityId,
        entityType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async compareData(
    previousSnapshot: SnapshotData,
    currentData: {
      searchResults: SerperSearchResult[];
      extractedData: ExtractedData;
    }
  ): Promise<ComparisonResult> {
    const currentContent = currentData.searchResults
      .map(result => `${result.title} ${result.snippet}`)
      .join(' ');

    const currentHash = this.generateContentHash(currentContent);

    // Quick hash comparison for identical content
    if (previousSnapshot.hash === currentHash) {
      return {
        hasChanges: false,
        changes: [],
        similarity: 1.0,
        addedItems: [],
        removedItems: [],
        modifiedItems: []
      };
    }

    // Detailed comparison
    const similarity = this.calculateSimilarity(
      previousSnapshot.content,
      currentContent
    );

    // Compare extracted data
    const urlChanges = this.compareArrays(
      previousSnapshot.extractedData.urls,
      currentData.extractedData.urls
    );

    const keywordChanges = this.compareArrays(
      previousSnapshot.extractedData.keywords,
      currentData.extractedData.keywords
    );

    const pricingChanges = this.comparePricing(
      previousSnapshot.extractedData.pricing,
      currentData.extractedData.pricing
    );

    const hasChanges = similarity < 0.95 ||
      urlChanges.added.length > 0 ||
      urlChanges.removed.length > 0 ||
      keywordChanges.added.length > 0 ||
      keywordChanges.removed.length > 0 ||
      pricingChanges.hasChanges;

    return {
      hasChanges,
      changes: [], // Will be populated by generateChangeEvents
      similarity,
      addedItems: [
        ...urlChanges.added.map(url => ({ type: 'url', value: url })),
        ...keywordChanges.added.map(keyword => ({ type: 'keyword', value: keyword }))
      ],
      removedItems: [
        ...urlChanges.removed.map(url => ({ type: 'url', value: url })),
        ...keywordChanges.removed.map(keyword => ({ type: 'keyword', value: keyword }))
      ],
      modifiedItems: pricingChanges.hasChanges ? [
        {
          item: { type: 'pricing' },
          changes: { pricing: { old: previousSnapshot.extractedData.pricing, new: currentData.extractedData.pricing } }
        }
      ] : []
    };
  }

  private async generateChangeEvents(
    entityId: string,
    entityType: string,
    previousSnapshot: SnapshotData,
    currentData: {
      searchResults: SerperSearchResult[];
      extractedData: ExtractedData;
    }
  ): Promise<ChangeEvent[]> {
    const events: ChangeEvent[] = [];
    const now = new Date();

    // Detect URL changes
    const urlChanges = this.compareArrays(
      previousSnapshot.extractedData.urls,
      currentData.extractedData.urls
    );

    if (urlChanges.added.length > 0) {
      events.push({
        id: this.generateChangeId(),
        type: 'content',
        entityId,
        entityType: isChangeEntityType(entityType) ? entityType : 'product',
        changeType: 'added',
        timestamp: now,
        newValue: urlChanges.added as unknown as Record<string, unknown>,
        confidence: 0.9,
        significance: 'medium',
        description: `New URLs detected: ${urlChanges.added.length} additions`,
        source: 'change_detector',
        metadata: { type: 'url_additions', count: urlChanges.added.length }
      });
    }

    if (urlChanges.removed.length > 0) {
      events.push({
        id: this.generateChangeId(),
        type: 'content',
        entityId,
        entityType: isChangeEntityType(entityType) ? entityType : 'product',
        changeType: 'removed',
        timestamp: now,
        oldValue: urlChanges.removed as unknown as Record<string, unknown>,
        confidence: 0.9,
        significance: 'medium',
        description: `URLs removed: ${urlChanges.removed.length} removals`,
        source: 'change_detector',
        metadata: { type: 'url_removals', count: urlChanges.removed.length }
      });
    }

    // Detect pricing changes
    const pricingChanges = this.comparePricing(
      previousSnapshot.extractedData.pricing,
      currentData.extractedData.pricing
    );

    if (pricingChanges.hasChanges) {
      events.push({
        id: this.generateChangeId(),
        type: 'pricing',
        entityId,
        entityType: isChangeEntityType(entityType) ? entityType : 'product',
        changeType: 'modified',
        timestamp: now,
        oldValue: previousSnapshot.extractedData.pricing,
        newValue: currentData.extractedData.pricing,
        confidence: 0.8,
        significance: 'high',
        description: 'Pricing information changed',
        source: 'change_detector',
        metadata: { type: 'pricing_change', details: pricingChanges }
      });
    }

    // Store change events
    for (const event of events) {
      await this.storeChangeEvent(event);
    }

    return events;
  }

  private async storeChangeEvent(event: ChangeEvent): Promise<void> {
    try {
      await memgraphBI.executeQuery(`
        CREATE (c:ChangeEvent {
          id: $id,
          type: $type,
          entityId: $entityId,
          entityType: $entityType,
          changeType: $changeType,
          timestamp: $timestamp,
          oldValue: $oldValue,
          newValue: $newValue,
          confidence: $confidence,
          significance: $significance,
          description: $description,
          source: $source,
          metadata: $metadata,
          createdAt: $createdAt
        })
        RETURN c
      `, {
        id: event.id,
        type: event.type,
        entityId: event.entityId,
        entityType: event.entityType,
        changeType: event.changeType,
        timestamp: event.timestamp.toISOString(),
        oldValue: event.oldValue ? JSON.stringify(event.oldValue) : null,
        newValue: event.newValue ? JSON.stringify(event.newValue) : null,
        confidence: event.confidence,
        significance: event.significance,
        description: event.description,
        source: event.source,
        metadata: JSON.stringify(event.metadata),
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to store change event:', {
        eventId: event.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateContentHash(content: string): string {
    // Simple hash function for content comparison
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity based on word overlap
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private compareArrays<T>(oldArray: T[], newArray: T[]): {
    added: T[];
    removed: T[];
    common: T[];
  } {
    const oldSet = new Set(oldArray);
    const newSet = new Set(newArray);

    return {
      added: newArray.filter(item => !oldSet.has(item)),
      removed: oldArray.filter(item => !newSet.has(item)),
      common: newArray.filter(item => oldSet.has(item))
    };
  }

  private comparePricing(
    oldPricing: ExtractedData['pricing'],
    newPricing: ExtractedData['pricing']
  ): { hasChanges: boolean; details: Record<string, unknown> } {
    const amountChanges = this.compareArrays(oldPricing.amounts, newPricing.amounts);
    const currencyChanges = this.compareArrays(oldPricing.currencies, newPricing.currencies);
    const planChanges = this.compareArrays(oldPricing.plans, newPricing.plans);

    const hasChanges =
      amountChanges.added.length > 0 ||
      amountChanges.removed.length > 0 ||
      currencyChanges.added.length > 0 ||
      currencyChanges.removed.length > 0 ||
      planChanges.added.length > 0 ||
      planChanges.removed.length > 0;

    return {
      hasChanges,
      details: {
        amounts: amountChanges,
        currencies: currencyChanges,
        plans: planChanges
      }
    };
  }

  private isTargetDue(target: MonitoringTarget, now: Date): boolean {
    const frequencyMs = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000
    };

    const timeSinceLastCheck = now.getTime() - target.lastChecked.getTime();
    return timeSinceLastCheck >= frequencyMs[target.frequency];
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      snapshotCount: number;
      activeTargets: number;
      recentChanges: number;
      lastError?: string;
    };
  }> {
    try {
      // Count snapshots
      const snapshotResult = await memgraphBI.executeQuery(`
        MATCH (s:Snapshot)
        RETURN count(s) as count
      `);
      const snapshotCount = snapshotResult.records[0]?.get('count')?.toNumber?.() || 0;

      // Count active monitoring targets
      const targetResult = await memgraphBI.executeQuery(`
        MATCH (m:MonitoringTarget)
        WHERE m.isActive = true
        RETURN count(m) as count
      `);
      const activeTargets = targetResult.records[0]?.get('count')?.toNumber?.() || 0;

      // Count recent changes (last 24 hours)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const changeResult = await memgraphBI.executeQuery(`
        MATCH (c:ChangeEvent)
        WHERE datetime(c.timestamp) > datetime($dayAgo)
        RETURN count(c) as count
      `, { dayAgo: dayAgo.toISOString() });
      const recentChanges = changeResult.records[0]?.get('count')?.toNumber?.() || 0;

      return {
        status: 'healthy',
        details: {
          snapshotCount,
          activeTargets,
          recentChanges
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          snapshotCount: 0,
          activeTargets: 0,
          recentChanges: 0,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export singleton instance
export const changeDetectionService = ChangeDetectionService.getInstance();