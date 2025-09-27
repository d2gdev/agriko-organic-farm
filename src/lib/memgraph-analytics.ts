// Enhanced Memgraph Analytics Schema for User Journey Tracking
import * as neo4j from 'neo4j-driver';
import { logger } from '@/lib/logger';

// Connect to Memgraph using existing connection pattern
let driver: neo4j.Driver | null = null;

function getDriver(): neo4j.Driver {
  if (!driver) {
    const uri = process.env.MEMGRAPH_URL || 'bolt://143.42.189.57:7687';
    const user = process.env.MEMGRAPH_USER || '';
    const password = process.env.MEMGRAPH_PASSWORD || '';

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

// Helper function to execute queries with session management
async function withSession<T>(operation: (session: neo4j.Session) => Promise<T>): Promise<T> {
  const session = getDriver().session();
  try {
    return await operation(session);
  } finally {
    await session.close();
  }
}

// Analytics Node Types
export interface AnalyticsUser {
  id: string;
  isAnonymous: boolean;
  firstSeen: number;
  lastSeen: number;
  totalSessions: number;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsSession {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  pageViews: number;
  events: number;
  deviceType?: string;
  browser?: string;
  referrer?: string;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  timestamp: number;
  sessionId: string;
  userId: string;
  productId?: number;
  metadata: Record<string, unknown>;
}

export interface PageView {
  id: string;
  path: string;
  timestamp: number;
  sessionId: string;
  userId: string;
  duration?: number;
  metadata: Record<string, unknown>;
}

// Initialize Analytics Schema
export async function initializeMemgraphAnalytics(): Promise<void> {
  try {
    await withSession(async (session) => {
      // Create indexes for performance
      const indexes = [
        'CREATE INDEX ON :AnalyticsUser(id);',
        'CREATE INDEX ON :AnalyticsSession(id);',
        'CREATE INDEX ON :AnalyticsSession(userId);',
        'CREATE INDEX ON :AnalyticsEvent(id);',
        'CREATE INDEX ON :AnalyticsEvent(type);',
        'CREATE INDEX ON :AnalyticsEvent(timestamp);',
        'CREATE INDEX ON :PageView(id);',
        'CREATE INDEX ON :PageView(path);',
        'CREATE INDEX ON :PageView(timestamp);',
      ];

      for (const indexQuery of indexes) {
        try {
          await session.run(indexQuery);
        } catch {
          // Index might already exist, continue
          logger.info(`Index creation skipped (might exist): ${indexQuery}`);
        }
      }

      // Create constraints
      const constraints = [
        'CREATE CONSTRAINT ON (u:AnalyticsUser) ASSERT u.id IS UNIQUE;',
        'CREATE CONSTRAINT ON (s:AnalyticsSession) ASSERT s.id IS UNIQUE;',
        'CREATE CONSTRAINT ON (e:AnalyticsEvent) ASSERT e.id IS UNIQUE;',
        'CREATE CONSTRAINT ON (pv:PageView) ASSERT pv.id IS UNIQUE;',
      ];

      for (const constraintQuery of constraints) {
        try {
          await session.run(constraintQuery);
        } catch {
          // Constraint might already exist, continue
          logger.info(`Constraint creation skipped (might exist): ${constraintQuery}`);
        }
      }

      logger.info('✅ Memgraph analytics schema initialized successfully');
    });
  } catch (error) {
    logger.error('❌ Failed to initialize Memgraph analytics schema:', error as Record<string, unknown>);
    throw error;
  }
}

// Create or update analytics user
export async function createAnalyticsUser(userData: AnalyticsUser): Promise<void> {
  try {
    await withSession(async (session) => {
      await session.run(`
        MERGE (u:AnalyticsUser {id: $id})
        SET u.isAnonymous = $isAnonymous,
            u.firstSeen = CASE WHEN u.firstSeen IS NULL THEN $firstSeen ELSE u.firstSeen END,
            u.lastSeen = $lastSeen,
            u.totalSessions = COALESCE(u.totalSessions, 0) + 1,
            u.metadata = $metadata,
            u.updatedAt = datetime()
      `, userData);

      logger.info(`Analytics user created/updated: ${userData.id}`);
    });
  } catch (error) {
    logger.error('Failed to create analytics user:', error as Record<string, unknown>);
    throw error;
  }
}

// Create analytics session
export async function createAnalyticsSession(sessionData: AnalyticsSession): Promise<void> {
  try {
    await withSession(async (session) => {
      // Create session node
      await session.run(`
        CREATE (s:AnalyticsSession {
          id: $id,
          userId: $userId,
          startTime: $startTime,
          endTime: $endTime,
          pageViews: $pageViews,
          events: $events,
          deviceType: $deviceType,
          browser: $browser,
          referrer: $referrer,
          createdAt: datetime()
        })
      `, sessionData);

      // Create relationship to user
      await session.run(`
        MATCH (u:AnalyticsUser {id: $userId})
        MATCH (s:AnalyticsSession {id: $sessionId})
        MERGE (u)-[:HAS_SESSION]->(s)
      `, {
        userId: sessionData.userId,
        sessionId: sessionData.id
      });

      logger.info(`Analytics session created: ${sessionData.id}`);
    });
  } catch (error) {
    logger.error('Failed to create analytics session:', error as Record<string, unknown>);
    throw error;
  }
}

// Create analytics event
export async function createAnalyticsEvent(eventData: AnalyticsEvent): Promise<void> {
  try {
    await withSession(async (session) => {
      // Create event node
      await session.run(`
        CREATE (e:AnalyticsEvent {
          id: $id,
          type: $type,
          timestamp: $timestamp,
          sessionId: $sessionId,
          userId: $userId,
          productId: $productId,
          metadata: $metadata,
          createdAt: datetime()
        })
      `, eventData);

      // Create relationships
      const relationships = [
        // Event belongs to session
        `
        MATCH (s:AnalyticsSession {id: $sessionId})
        MATCH (e:AnalyticsEvent {id: $eventId})
        MERGE (s)-[:HAS_EVENT]->(e)
        `,
        // Event belongs to user
        `
        MATCH (u:AnalyticsUser {id: $userId})
        MATCH (e:AnalyticsEvent {id: $eventId})
        MERGE (u)-[:PERFORMED]->(e)
        `
      ];

      for (const relQuery of relationships) {
        await session.run(relQuery, {
          sessionId: eventData.sessionId,
          userId: eventData.userId,
          eventId: eventData.id
        });
      }

      // If product event, create relationship to product
      if (eventData.productId) {
        await session.run(`
          MATCH (p:Product {id: $productId})
          MATCH (e:AnalyticsEvent {id: $eventId})
          MERGE (e)-[:RELATES_TO]->(p)
        `, {
          productId: eventData.productId,
          eventId: eventData.id
        });
      }

      logger.info(`Analytics event created: ${eventData.type} for ${eventData.userId}`);
    });
  } catch (error) {
    logger.error('Failed to create analytics event:', error as Record<string, unknown>);
    throw error;
  }
}

// Create page view
export async function createPageView(pageViewData: PageView): Promise<void> {
  try {
    await withSession(async (session) => {
      // Create page view node
      await session.run(`
        CREATE (pv:PageView {
          id: $id,
          path: $path,
          timestamp: $timestamp,
          sessionId: $sessionId,
          userId: $userId,
          duration: $duration,
          metadata: $metadata,
          createdAt: datetime()
        })
      `, pageViewData);

      // Create relationships
      const relationships = [
        // Page view belongs to session
        `
        MATCH (s:AnalyticsSession {id: $sessionId})
        MATCH (pv:PageView {id: $pageViewId})
        MERGE (s)-[:HAS_PAGE_VIEW]->(pv)
        `,
        // Page view belongs to user
        `
        MATCH (u:AnalyticsUser {id: $userId})
        MATCH (pv:PageView {id: $pageViewId})
        MERGE (u)-[:VIEWED]->(pv)
        `
      ];

      for (const relQuery of relationships) {
        await session.run(relQuery, {
          sessionId: pageViewData.sessionId,
          userId: pageViewData.userId,
          pageViewId: pageViewData.id
        });
      }

      logger.info(`Page view created: ${pageViewData.path} for ${pageViewData.userId}`);
    });
  } catch (error) {
    logger.error('Failed to create page view:', error as Record<string, unknown>);
    throw error;
  }
}

// Update session end time and stats
export async function updateSessionEnd(sessionId: string, endTime: number, stats: {
  pageViews: number;
  events: number;
}): Promise<void> {
  try {
    await withSession(async (session) => {
      await session.run(`
        MATCH (s:AnalyticsSession {id: $sessionId})
        SET s.endTime = $endTime,
            s.pageViews = $pageViews,
            s.events = $events,
            s.updatedAt = datetime()
      `, {
        sessionId,
        endTime,
        pageViews: stats.pageViews,
        events: stats.events
      });

      logger.info(`Session updated: ${sessionId}`);
    });
  } catch (error) {
    logger.error('Failed to update session:', error as Record<string, unknown>);
    throw error;
  }
}

// Analytics Query Functions

// Get user journey path
export async function getUserJourney(userId: string, limit: number = 50): Promise<Array<{ path: string; timestamp: string; sessionId: string }>> {
  try {
    return await withSession(async (session) => {
      const result = await session.run(`
        MATCH (u:AnalyticsUser {id: $userId})-[:HAS_SESSION]->(s:AnalyticsSession)
        MATCH (s)-[:HAS_PAGE_VIEW]->(pv:PageView)
        RETURN pv.path as path, pv.timestamp as timestamp, s.id as sessionId
        ORDER BY pv.timestamp DESC
        LIMIT $limit
      `, { userId, limit });

      return result.records.map(record => ({
        path: record.get('path'),
        timestamp: record.get('timestamp'),
        sessionId: record.get('sessionId')
      }));
    });
  } catch (error) {
    logger.error('Failed to get user journey:', error as Record<string, unknown>);
    return [];
  }
}

// Get popular paths
export async function getPopularPaths(limit: number = 10): Promise<Array<{ path: string; count: number }>> {
  try {
    return await withSession(async (session) => {
      const result = await session.run(`
        MATCH (pv:PageView)
        RETURN pv.path as path, count(*) as views
        ORDER BY views DESC
        LIMIT $limit
      `, { limit });

      return result.records.map(record => ({
        path: record.get('path'),
        count: record.get('views').toNumber()
      }));
    });
  } catch (error) {
    logger.error('Failed to get popular paths:', error as Record<string, unknown>);
    return [];
  }
}

// Get user behavior patterns
export async function getUserBehaviorPatterns(userId: string): Promise<{
  totalSessions: number;
  averageSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  deviceTypes: Array<{ type: string; count: number }>;
}> {
  try {
    return await withSession(async (session) => {
      const result = await session.run(`
        MATCH (u:AnalyticsUser {id: $userId})-[:PERFORMED]->(e:AnalyticsEvent)
        RETURN e.type as eventType, count(*) as frequency
        ORDER BY frequency DESC
      `, { userId });

      // Get session data
      const sessionResult = await session.run(`
        MATCH (u:AnalyticsUser {id: $userId})-[:HAS_SESSION]->(s:AnalyticsSession)
        RETURN count(s) as totalSessions, avg(s.duration) as avgDuration
      `, { userId });

      // Get top pages
      const pagesResult = await session.run(`
        MATCH (u:AnalyticsUser {id: $userId})-[:VIEWED]->(p:PageView)
        RETURN p.path as path, count(*) as views
        ORDER BY views DESC
        LIMIT 5
      `, { userId });

      // Get device types
      const deviceResult = await session.run(`
        MATCH (u:AnalyticsUser {id: $userId})-[:USES_DEVICE]->(d:Device)
        RETURN d.type as type, count(*) as count
      `, { userId });

      const sessionData = sessionResult.records[0];

      return {
        totalSessions: sessionData ? sessionData.get('totalSessions').toNumber() : 0,
        averageSessionDuration: sessionData ? sessionData.get('avgDuration')?.toNumber() || 0 : 0,
        topPages: pagesResult.records.map(r => ({
          path: r.get('path'),
          views: r.get('views').toNumber()
        })),
        deviceTypes: deviceResult.records.map(r => ({
          type: r.get('type'),
          count: r.get('count').toNumber()
        }))
      };
    });
  } catch (error) {
    logger.error('Failed to get user behavior patterns:', error as Record<string, unknown>);
    return {
      totalSessions: 0,
      averageSessionDuration: 0,
      topPages: [],
      deviceTypes: []
    };
  }
}

// Clean up old analytics data
export async function cleanupOldAnalyticsData(daysOld: number = 90): Promise<number> {
  try {
    return await withSession(async (session) => {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      const result = await session.run(`
        MATCH (e:AnalyticsEvent)
        WHERE e.timestamp < $cutoffTime
        DETACH DELETE e
        RETURN count(*) as deletedCount
      `, { cutoffTime });

      const deletedCount = result.records[0]?.get('deletedCount')?.toNumber() || 0;
      logger.info(`Cleaned up ${deletedCount} old analytics events`);

      return deletedCount;
    });
  } catch (error) {
    logger.error('Failed to cleanup old analytics data:', error as Record<string, unknown>);
    return 0;
  }
}

// Export connection cleanup function
export async function closeAnalyticsConnection(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    logger.info('Memgraph analytics connection closed');
  }
}