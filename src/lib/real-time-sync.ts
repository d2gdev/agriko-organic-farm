// Real-time Sync Management System
import { logger } from '@/lib/logger';
import { config } from '@/lib/unified-config';
import { EventEmitter } from 'events';

// Generic types for better type safety
type SyncEventData = Record<string, unknown>;
type SyncMetadata = Record<string, unknown>;

// Order item type
interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  name?: string;
}

// Auto-sync modules
import { autoSyncProductToMemgraph, autoSyncOrderToMemgraph, autoSyncUserBehaviorToMemgraph, autoSyncSearchToMemgraph } from '@/lib/memgraph-auto-sync';
import { autoSyncProductToQdrant, autoSyncUserSearchToQdrant } from '@/lib/qdrant-auto-sync';
import { saveAnalyticsEvent } from '@/lib/analytics-db';
import { BaseEvent } from '@/lib/event-system';

// Event types for real-time sync
export interface SyncEvent {
  id: string;
  type: 'product' | 'order' | 'user' | 'search' | 'interaction';
  action: 'create' | 'update' | 'view' | 'search' | 'click' | 'purchase' | 'hover';
  data: SyncEventData;
  priority: 'high' | 'medium' | 'low';
  userId?: string;
  sessionId: string;
  timestamp: number;
  metadata?: SyncMetadata;
}

export interface SyncResult {
  success: boolean;
  eventId: string;
  processingTime: number;
  databases: {
    memgraph: boolean;
    qdrant: boolean;
    analytics: boolean;
  };
  errors: string[];
}

// Real-time sync manager with event emitter
class RealTimeSyncManager extends EventEmitter {
  private processingQueue: Map<string, SyncEvent> = new Map();
  private processingStats = {
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    averageProcessingTime: 0
  };

  constructor() {
    super();
    this.setMaxListeners(100); // Handle many concurrent events
  }

  /**
   * Queue a sync event for real-time processing
   */
  async queueSync(event: SyncEvent): Promise<void> {
    // Add to processing queue
    this.processingQueue.set(event.id, event);

    // Emit event for monitoring
    this.emit('sync:queued', event);

    // Process immediately for real-time sync
    setImmediate(() => this.processSync(event));
  }

  /**
   * Process a sync event across all databases
   */
  private async processSync(event: SyncEvent): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      eventId: event.id,
      processingTime: 0,
      databases: {
        memgraph: false,
        qdrant: false,
        analytics: false
      },
      errors: []
    };

    try {
      // Process based on event type
      switch (event.type) {
        case 'product':
          await this.syncProductEvent(event, result);
          break;

        case 'order':
          await this.syncOrderEvent(event, result);
          break;

        case 'search':
          await this.syncSearchEvent(event, result);
          break;

        case 'interaction':
          await this.syncInteractionEvent(event, result);
          break;

        default:
          throw new Error(`Unknown event type: ${event.type}`);
      }

      // Always sync to analytics database
      await this.syncToAnalytics(event, result);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      logger.error('Real-time sync failed:', { eventId: event.id, error });
    }

    // Calculate processing time
    result.processingTime = Date.now() - startTime;

    // Update stats
    this.updateStats(result);

    // Remove from queue
    this.processingQueue.delete(event.id);

    // Emit completion event
    this.emit(result.success ? 'sync:completed' : 'sync:failed', result);

    return result;
  }

  /**
   * Sync product events
   */
  private async syncProductEvent(event: SyncEvent, result: SyncResult): Promise<void> {
    const promises: Promise<void>[] = [];

    // Sync to Memgraph
    if (config.features.enableMemgraphSync) {
      promises.push(
        autoSyncProductToMemgraph({
          eventType: `product.${event.action}`,
          productId: event.data.productId as number,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          metadata: event.metadata || {}
        }).then(() => {
          result.databases.memgraph = true;
        }).catch(error => {
          result.errors.push(`Memgraph sync failed: ${error.message}`);
        })
      );
    }

    // Sync to Qdrant
    if (config.features.enableQdrantSync) {
      promises.push(
        autoSyncProductToQdrant({
          productId: event.data.productId as number,
          eventType: `product.${event.action}`,
          metadata: event.metadata
        }).then(() => {
          result.databases.qdrant = true;
        }).catch(error => {
          result.errors.push(`Qdrant sync failed: ${error.message}`);
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Sync order events
   */
  private async syncOrderEvent(event: SyncEvent, result: SyncResult): Promise<void> {
    if (config.features.enableMemgraphSync) {
      try {
        await autoSyncOrderToMemgraph({
          eventType: `order.${event.action}`,
          orderId: event.data.orderId as string,
          userId: event.userId,
          items: (event.data.items as OrderItem[]) || [],
          orderTotal: (event.data.orderValue as number) || 0,
          timestamp: event.timestamp
        });
        result.databases.memgraph = true;
      } catch (error) {
        result.errors.push(`Order Memgraph sync failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Sync search events
   */
  private async syncSearchEvent(event: SyncEvent, result: SyncResult): Promise<void> {
    const promises: Promise<void>[] = [];

    // Sync to Memgraph
    if (config.features.enableMemgraphSync) {
      promises.push(
        autoSyncSearchToMemgraph({
          query: event.data.query as string,
          resultsCount: (event.data.resultsCount as number) || 0,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          clickedResultId: event.data.clickedResultId as number | undefined
        }).then(() => {
          result.databases.memgraph = true;
        }).catch(error => {
          result.errors.push(`Search Memgraph sync failed: ${error.message}`);
        })
      );
    }

    // Sync to Qdrant
    if (config.features.enableQdrantSync) {
      promises.push(
        autoSyncUserSearchToQdrant({
          query: event.data.query as string,
          userId: event.userId,
          sessionId: event.sessionId,
          resultsCount: (event.data.resultsCount as number) || 0,
          clickedResults: event.data.clickedResults as number[] | undefined,
          timestamp: event.timestamp
        }).then(() => {
          result.databases.qdrant = true;
        }).catch(error => {
          result.errors.push(`Search Qdrant sync failed: ${error.message}`);
        })
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * Sync interaction events
   */
  private async syncInteractionEvent(event: SyncEvent, result: SyncResult): Promise<void> {
    if (config.features.enableMemgraphSync && event.userId) {
      try {
        await autoSyncUserBehaviorToMemgraph({
          eventType: `interaction.${event.action}`,
          userId: event.userId,
          sessionId: event.sessionId,
          pageUrl: `/product/${event.data.productId}`, // Construct page URL from product ID
          timestamp: event.timestamp,
          metadata: { ...event.metadata, productId: event.data.productId }
        });
        result.databases.memgraph = true;
      } catch (error) {
        result.errors.push(`Interaction Memgraph sync failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Sync to analytics database
   */
  private async syncToAnalytics(event: SyncEvent, result: SyncResult): Promise<void> {
    try {
      await saveAnalyticsEvent({
        id: event.id,
        type: `${event.type}.${event.action}` as any,
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        userId: event.userId,
        metadata: {
          ...event.data,
          ...event.metadata,
          priority: event.priority,
          realTimeSync: true
        }
      } satisfies BaseEvent);
      result.databases.analytics = true;
    } catch (error) {
      result.errors.push(`Analytics sync failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update processing statistics
   */
  private updateStats(result: SyncResult): void {
    this.processingStats.totalProcessed++;

    if (result.success) {
      this.processingStats.successCount++;
    } else {
      this.processingStats.errorCount++;
    }

    // Update average processing time
    const currentAvg = this.processingStats.averageProcessingTime;
    const total = this.processingStats.totalProcessed;
    this.processingStats.averageProcessingTime =
      ((currentAvg * (total - 1)) + result.processingTime) / total;
  }

  /**
   * Get current processing statistics
   */
  getStats(): typeof this.processingStats & {
    queueSize: number;
    successRate: number;
  } {
    const successRate = this.processingStats.totalProcessed > 0
      ? (this.processingStats.successCount / this.processingStats.totalProcessed) * 100
      : 0;

    return {
      ...this.processingStats,
      queueSize: this.processingQueue.size,
      successRate
    };
  }

  /**
   * Clear statistics (for testing/reset)
   */
  clearStats(): void {
    this.processingStats = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      averageProcessingTime: 0
    };
  }
}

// Global instance
export const realTimeSyncManager = new RealTimeSyncManager();

/**
 * Helper function to create and queue sync events
 */
export async function syncEvent(params: {
  type: SyncEvent['type'];
  action: SyncEvent['action'];
  data: SyncEventData;
  priority?: SyncEvent['priority'];
  userId?: string;
  sessionId?: string;
  metadata?: SyncMetadata;
}): Promise<string> {
  const eventId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionId = params.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const event: SyncEvent = {
    id: eventId,
    type: params.type,
    action: params.action,
    data: params.data,
    priority: params.priority || 'medium',
    userId: params.userId,
    sessionId,
    timestamp: Date.now(),
    metadata: params.metadata
  };

  await realTimeSyncManager.queueSync(event);
  return eventId;
}

/**
 * Convenience functions for common sync operations
 */
export const RealTimeSync = {
  productView: (productId: number, userId?: string, sessionId?: string, metadata?: SyncMetadata) =>
    syncEvent({
      type: 'product',
      action: 'view',
      data: { productId },
      priority: 'medium',
      userId,
      sessionId,
      metadata
    }),

  productSearch: (query: string, resultsCount: number, userId?: string, sessionId?: string, metadata?: SyncMetadata) =>
    syncEvent({
      type: 'search',
      action: 'search',
      data: { query, resultsCount },
      priority: 'high',
      userId,
      sessionId,
      metadata
    }),

  orderCreated: (orderId: string, orderValue: number, items: OrderItem[], userId?: string, sessionId?: string, metadata?: SyncMetadata) =>
    syncEvent({
      type: 'order',
      action: 'create',
      data: { orderId, orderValue, items },
      priority: 'high',
      userId,
      sessionId,
      metadata
    }),

  userInteraction: (action: 'click' | 'view' | 'hover', data: SyncEventData, userId?: string, sessionId?: string, metadata?: SyncMetadata) =>
    syncEvent({
      type: 'interaction',
      action,
      data,
      priority: 'low',
      userId,
      sessionId,
      metadata
    })
};

// Monitor sync performance
realTimeSyncManager.on('sync:completed', (result: SyncResult) => {
  if (result.processingTime > 5000) { // Log slow syncs
    logger.warn('Slow sync detected:', {
      eventId: result.eventId,
      processingTime: result.processingTime,
      databases: result.databases
    });
  }
});

realTimeSyncManager.on('sync:failed', (result: SyncResult) => {
  logger.error('Sync failed:', {
    eventId: result.eventId,
    errors: result.errors,
    databases: result.databases
  });
});

export default realTimeSyncManager;