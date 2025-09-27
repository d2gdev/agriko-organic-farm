// Enhanced Memgraph Auto-Sync with Comprehensive Relationship Building
import { logger } from '@/lib/logger';
import { withSession } from './memgraph';
import { withDatabaseRetry } from '@/lib/retry-handler';
// Enhanced analytics integration
import {
  createAnalyticsEvent,
  createPageView,
  AnalyticsEvent,
  PageView
} from './memgraph-analytics';

// Auto-sync product relationships to Memgraph
export async function autoSyncProductToMemgraph(productData: {
  eventType: string;
  productId: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}): Promise<void> {
  return withDatabaseRetry(async () => {
    try {
    await withSession(async (session) => {
      // Create or update product node
      await session.run(`
        MERGE (p:Product {id: $productId})
        ON CREATE SET
          p.created_at = $timestamp,
          p.first_interaction = $eventType
        ON MATCH SET
          p.last_interaction = $timestamp,
          p.interaction_count = COALESCE(p.interaction_count, 0) + 1
      `, {
        productId: productData.productId,
        timestamp: productData.timestamp,
        eventType: productData.eventType
      });

      // Create user node and interaction if user is identified
      if (productData.userId) {
        await session.run(`
          MERGE (u:User {id: $userId})
          ON CREATE SET
            u.created_at = $timestamp,
            u.session_count = 1
          ON MATCH SET
            u.last_active = $timestamp,
            u.session_count = COALESCE(u.session_count, 0) + 1

          MERGE (p:Product {id: $productId})

          // Create interaction relationship
          MERGE (u)-[r:INTERACTED_WITH {type: $eventType}]->(p)
          ON CREATE SET
            r.first_interaction = $timestamp,
            r.count = 1
          ON MATCH SET
            r.last_interaction = $timestamp,
            r.count = r.count + 1
        `, {
          userId: productData.userId,
          productId: productData.productId,
          eventType: productData.eventType,
          timestamp: productData.timestamp
        });
      }

      // Create session tracking
      await session.run(`
        MERGE (s:Session {id: $sessionId})
        ON CREATE SET
          s.created_at = $timestamp,
          s.user_id = $userId,
          s.interaction_count = 1
        ON MATCH SET
          s.last_activity = $timestamp,
          s.interaction_count = s.interaction_count + 1

        MERGE (p:Product {id: $productId})
        MERGE (s)-[r:VIEWED_IN_SESSION]->(p)
        ON CREATE SET
          r.timestamp = $timestamp,
          r.event_type = $eventType
      `, {
        sessionId: productData.sessionId,
        userId: productData.userId || null,
        productId: productData.productId,
        eventType: productData.eventType,
        timestamp: productData.timestamp
      });

      // Also create analytics event for detailed tracking
      if (productData.userId) {
        const analyticsEvent: AnalyticsEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: productData.eventType,
          timestamp: productData.timestamp,
          sessionId: productData.sessionId,
          userId: productData.userId,
          productId: productData.productId,
          metadata: productData.metadata
        };

        await createAnalyticsEvent(analyticsEvent);
      }

      logger.info(`✅ Auto-synced product ${productData.productId} to Memgraph with analytics`);
    });
    } catch (error) {
      logger.error('❌ Failed to auto-sync product to Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }, `memgraph-sync-product-${productData.productId}`);
}

// Auto-sync order relationships
export async function autoSyncOrderToMemgraph(orderData: {
  eventType: string;
  orderId: string;
  userId?: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  orderTotal: number;
  timestamp: number;
}): Promise<void> {
  return withDatabaseRetry(async () => {
    try {
    await withSession(async (session) => {
      // Create order node
      await session.run(`
        CREATE (o:Order {
          id: $orderId,
          total_value: $orderTotal,
          item_count: $itemCount,
          created_at: $timestamp
        })
      `, {
        orderId: orderData.orderId,
        orderTotal: orderData.orderTotal,
        itemCount: orderData.items.length,
        timestamp: orderData.timestamp
      });

      // Link user to order if available
      if (orderData.userId) {
        await session.run(`
          MERGE (u:User {id: $userId})
          MATCH (o:Order {id: $orderId})
          CREATE (u)-[:PLACED {timestamp: $timestamp}]->(o)
        `, {
          userId: orderData.userId,
          orderId: orderData.orderId,
          timestamp: orderData.timestamp
        });
      }

      // Create product relationships and "bought together" patterns
      for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        if (!item) continue;

        // Link product to order
        await session.run(`
          MERGE (p:Product {id: $productId})
          MATCH (o:Order {id: $orderId})
          CREATE (p)<-[:CONTAINS {
            quantity: $quantity,
            unit_price: $price,
            total_price: $totalPrice
          }]-(o)
        `, {
          productId: item.productId,
          orderId: orderData.orderId,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.quantity * item.price
        });

        // Create "bought together" relationships with other products in the same order
        for (let j = i + 1; j < orderData.items.length; j++) {
          const otherItem = orderData.items[j];
          if (!otherItem) continue;

          await session.run(`
            MATCH (p1:Product {id: $productId1})
            MATCH (p2:Product {id: $productId2})
            MERGE (p1)-[r:BOUGHT_TOGETHER]-(p2)
            ON CREATE SET
              r.frequency = 1,
              r.first_occurrence = $timestamp
            ON MATCH SET
              r.frequency = r.frequency + 1,
              r.last_occurrence = $timestamp
          `, {
            productId1: item.productId,
            productId2: otherItem.productId,
            timestamp: orderData.timestamp
          });
        }
      }

      logger.info(`✅ Auto-synced order ${orderData.orderId} to Memgraph`);
    });
    } catch (error) {
      logger.error('❌ Failed to auto-sync order to Memgraph:', error as Record<string, unknown>);
      throw error;
    }
  }, `memgraph-sync-order-${orderData.orderId}`);
}

// Auto-sync user behavior patterns
export async function autoSyncUserBehaviorToMemgraph(behaviorData: {
  userId: string;
  sessionId: string;
  pageUrl: string;
  timestamp: number;
  eventType: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  try {
    await withSession(async (session) => {
      // Create or update user
      await session.run(`
        MERGE (u:User {id: $userId})
        ON CREATE SET
          u.created_at = $timestamp,
          u.page_view_count = 1
        ON MATCH SET
          u.last_active = $timestamp,
          u.page_view_count = COALESCE(u.page_view_count, 0) + 1
      `, {
        userId: behaviorData.userId,
        timestamp: behaviorData.timestamp
      });

      // Create page node and navigation pattern
      await session.run(`
        MERGE (page:Page {url: $pageUrl})
        ON CREATE SET
          page.first_visit = $timestamp,
          page.visit_count = 1
        ON MATCH SET
          page.last_visit = $timestamp,
          page.visit_count = page.visit_count + 1

        MATCH (u:User {id: $userId})
        MERGE (u)-[r:VISITED {session_id: $sessionId}]->(page)
        ON CREATE SET
          r.first_visit = $timestamp,
          r.visit_count = 1
        ON MATCH SET
          r.last_visit = $timestamp,
          r.visit_count = r.visit_count + 1
      `, {
        pageUrl: behaviorData.pageUrl,
        userId: behaviorData.userId,
        sessionId: behaviorData.sessionId,
        timestamp: behaviorData.timestamp
      });

      // Create page view analytics event
      const pageView: PageView = {
        id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        path: behaviorData.pageUrl,
        timestamp: behaviorData.timestamp,
        sessionId: behaviorData.sessionId,
        userId: behaviorData.userId,
        metadata: behaviorData.metadata
      };

      await createPageView(pageView);

      logger.info(`✅ Auto-synced user behavior for ${behaviorData.userId} to Memgraph with analytics`);
    });
  } catch (error) {
    logger.error('❌ Failed to auto-sync user behavior to Memgraph:', error as Record<string, unknown>);
    throw error;
  }
}

// Auto-sync search patterns
export async function autoSyncSearchToMemgraph(searchData: {
  query: string;
  resultsCount: number;
  userId?: string;
  sessionId: string;
  timestamp: number;
  clickedResultId?: number;
}): Promise<void> {
  try {
    await withSession(async (session) => {
      // Create search query node
      await session.run(`
        MERGE (q:SearchQuery {text: $query})
        ON CREATE SET
          q.first_searched = $timestamp,
          q.search_count = 1,
          q.avg_results = $resultsCount
        ON MATCH SET
          q.last_searched = $timestamp,
          q.search_count = q.search_count + 1,
          q.avg_results = (q.avg_results + $resultsCount) / 2
      `, {
        query: searchData.query,
        resultsCount: searchData.resultsCount,
        timestamp: searchData.timestamp
      });

      // Link user to search if available
      if (searchData.userId) {
        await session.run(`
          MERGE (u:User {id: $userId})
          MATCH (q:SearchQuery {text: $query})
          MERGE (u)-[r:SEARCHED {session_id: $sessionId}]->(q)
          ON CREATE SET
            r.first_search = $timestamp,
            r.search_count = 1
          ON MATCH SET
            r.last_search = $timestamp,
            r.search_count = r.search_count + 1
        `, {
          userId: searchData.userId,
          query: searchData.query,
          sessionId: searchData.sessionId,
          timestamp: searchData.timestamp
        });
      }

      // If user clicked on a result, create search-to-product relationship
      if (searchData.clickedResultId) {
        await session.run(`
          MATCH (q:SearchQuery {text: $query})
          MERGE (p:Product {id: $productId})
          MERGE (q)-[r:LED_TO_PRODUCT]->(p)
          ON CREATE SET
            r.click_count = 1,
            r.first_click = $timestamp
          ON MATCH SET
            r.click_count = r.click_count + 1,
            r.last_click = $timestamp
        `, {
          query: searchData.query,
          productId: searchData.clickedResultId,
          timestamp: searchData.timestamp
        });
      }

      // Create search analytics event
      if (searchData.userId) {
        const searchEvent: AnalyticsEvent = {
          id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'search.performed',
          timestamp: searchData.timestamp,
          sessionId: searchData.sessionId,
          userId: searchData.userId,
          metadata: {
            query: searchData.query,
            resultsCount: searchData.resultsCount,
            clickedResultId: searchData.clickedResultId
          }
        };

        await createAnalyticsEvent(searchEvent);
      }

      logger.info(`✅ Auto-synced search "${searchData.query}" to Memgraph with analytics`);
    });
  } catch (error) {
    logger.error('❌ Failed to auto-sync search to Memgraph:', error as Record<string, unknown>);
    throw error;
  }
}

// Auto-sync product similarity based on user behavior
export async function autoSyncProductSimilarity(): Promise<void> {
  try {
    await withSession(async (session) => {
      // Find products that are frequently viewed together in sessions
      await session.run(`
        MATCH (s:Session)-[:VIEWED_IN_SESSION]->(p1:Product)
        MATCH (s)-[:VIEWED_IN_SESSION]->(p2:Product)
        WHERE p1.id < p2.id
        WITH p1, p2, count(*) as shared_sessions
        WHERE shared_sessions >= 3
        MERGE (p1)-[r:VIEWED_TOGETHER]-(p2)
        SET r.shared_sessions = shared_sessions,
            r.last_updated = timestamp()
      `);

      // Find products that users with similar preferences like
      await session.run(`
        MATCH (u1:User)-[:INTERACTED_WITH]->(p:Product)
        MATCH (u2:User)-[:INTERACTED_WITH]->(p)
        WHERE u1.id <> u2.id
        WITH u1, u2, count(p) as shared_products
        WHERE shared_products >= 2
        MERGE (u1)-[r:SIMILAR_PREFERENCES]-(u2)
        SET r.shared_products = shared_products,
            r.last_updated = timestamp()
      `);

      logger.info('✅ Auto-synced product similarity relationships to Memgraph');
    });
  } catch (error) {
    logger.error('❌ Failed to auto-sync product similarity to Memgraph:', error as Record<string, unknown>);
    throw error;
  }
}

// Schedule automatic relationship updates
// Interval reference for cleanup
let memgraphUpdateInterval: NodeJS.Timeout | null = null;

export async function scheduleMemgraphUpdates(): Promise<void> {
  // Clear existing interval if any
  if (memgraphUpdateInterval) {
    clearInterval(memgraphUpdateInterval);
  }

  // Run similarity analysis every hour
  memgraphUpdateInterval = setInterval(async () => {
    try {
      await autoSyncProductSimilarity();
      logger.info('🔄 Scheduled Memgraph similarity update completed');
    } catch (error) {
      logger.error('❌ Scheduled Memgraph similarity update failed:', error as Record<string, unknown>);
    }
  }, 60 * 60 * 1000); // 1 hour

  logger.info('⏰ Memgraph automatic update scheduler started');
}

// Stop scheduled updates
export function stopMemgraphUpdates(): void {
  if (memgraphUpdateInterval) {
    clearInterval(memgraphUpdateInterval);
    memgraphUpdateInterval = null;
    logger.info('🛑 Memgraph automatic update scheduler stopped');
  }
}

// Graceful shutdown handler
const cleanup = () => {
  logger.info('🧹 Cleaning up Memgraph auto-sync...');
  stopMemgraphUpdates();
};

// Register cleanup handlers
if (typeof process !== 'undefined') {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}