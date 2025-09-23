// Search Quality Metrics and Analytics System
// import { analyzeSearchQuality, type SearchQualityMetrics } from './deepseek';
import { logger } from './logger';

export interface SearchEvent {
  sessionId: string;
  userId?: string;
  query: string;
  searchType: 'semantic' | 'keyword' | 'hybrid' | 'contextual';
  intent?: string;
  timestamp: string;
  results: Array<{
    productId: number;
    position: number;
    score: number;
    title: string;
    relevanceScore?: number;
    personalizationBoost?: number;
  }>;
  userActions: {
    clickedResults: number[];
    purchasedResults: number[];
    dwellTimes: Record<number, number>; // productId -> dwell time in ms
    refinedQuery?: string;
    abandonedSession: boolean;
  };
  metadata: {
    userAgent?: string;
    location?: { country?: string; region?: string };
    responseTime: number;
    totalResults: number;
    filters?: Record<string, unknown>;
  };
}

export interface QualityMetrics {
  // Precision metrics
  clickThroughRate: number; // CTR for top 10 results
  precisionAt5: number; // How many of top 5 results were clicked
  precisionAt10: number; // How many of top 10 results were clicked

  // Relevance metrics
  meanReciprocalRank: number; // MRR - position of first clicked result
  normalizedDiscountedCumulativeGain: number; // NDCG
  averageRelevanceScore: number;

  // User satisfaction metrics
  sessionSuccessRate: number; // Sessions that led to purchases or engagement
  queryRefinementRate: number; // How often users refine their queries
  zeroResultsRate: number; // Queries that returned no results
  abandonment: number; // Sessions abandoned without interaction

  // Performance metrics
  averageResponseTime: number;
  searchLatency: number;

  // Intent matching
  intentAccuracy: number; // How well we detected search intent
  resultDiversity: number; // Diversity of result categories
  personalizedRelevance: number; // Effectiveness of personalization
}

export interface AggregatedMetrics {
  timeRange: { start: string; end: string };
  totalQueries: number;
  uniqueUsers: number;
  popularQueries: Array<{ query: string; count: number; successRate: number }>;
  problemQueries: Array<{ query: string; issues: string[]; frequency: number }>;
  qualityTrends: Array<{ date: string; metrics: QualityMetrics }>;
  categoryPerformance: Record<string, QualityMetrics>;
  intentPerformance: Record<string, QualityMetrics>;
}

// In-memory storage for search events (in production, use database)
const searchEvents: SearchEvent[] = [];
const metricsCache = new Map<string, { metrics: QualityMetrics; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Track a search event
 */
export function trackSearchEvent(event: Omit<SearchEvent, 'timestamp'>): void {
  try {
    const fullEvent: SearchEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    searchEvents.push(fullEvent);

    // Keep last 10,000 events in memory
    if (searchEvents.length > 10000) {
      searchEvents.shift();
    }

    logger.info(`Tracked search event: "${event.query}" (${event.searchType})`);
  } catch (error) {
    logger.error('Failed to track search event:', error as Record<string, unknown>);
  }
}

/**
 * Update search event with user actions
 */
export function updateSearchEventWithActions(
  sessionId: string,
  query: string,
  actions: Partial<SearchEvent['userActions']>
): void {
  try {
    const event = searchEvents
      .slice()
      .reverse()
      .find(e => e.sessionId === sessionId && e.query === query);

    if (event) {
      event.userActions = {
        ...event.userActions,
        ...actions
      };

      logger.info(`Updated search event actions for: "${query}"`);
    }
  } catch (error) {
    logger.error('Failed to update search event actions:', error as Record<string, unknown>);
  }
}

/**
 * Calculate quality metrics for a time period
 */
export async function calculateQualityMetrics(
  timeRange: { start: Date; end: Date },
  filters: {
    searchType?: string;
    intent?: string;
    sessionId?: string;
  } = {}
): Promise<QualityMetrics> {
  const cacheKey = `metrics_${timeRange.start.getTime()}_${timeRange.end.getTime()}_${JSON.stringify(filters)}`;

  // Check cache
  const cached = metricsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.metrics;
  }

  const relevantEvents = searchEvents.filter(event => {
    const eventTime = new Date(event.timestamp);
    const inTimeRange = eventTime >= timeRange.start && eventTime <= timeRange.end;

    if (!inTimeRange) return false;
    if (filters.searchType && event.searchType !== filters.searchType) return false;
    if (filters.intent && event.intent !== filters.intent) return false;
    if (filters.sessionId && event.sessionId !== filters.sessionId) return false;

    return true;
  });

  if (relevantEvents.length === 0) {
    const emptyMetrics: QualityMetrics = {
      clickThroughRate: 0,
      precisionAt5: 0,
      precisionAt10: 0,
      meanReciprocalRank: 0,
      normalizedDiscountedCumulativeGain: 0,
      averageRelevanceScore: 0,
      sessionSuccessRate: 0,
      queryRefinementRate: 0,
      zeroResultsRate: 0,
      abandonment: 0,
      averageResponseTime: 0,
      searchLatency: 0,
      intentAccuracy: 0,
      resultDiversity: 0,
      personalizedRelevance: 0
    };
    return emptyMetrics;
  }

  const metrics: QualityMetrics = {
    clickThroughRate: calculateClickThroughRate(relevantEvents),
    precisionAt5: calculatePrecisionAtK(relevantEvents, 5),
    precisionAt10: calculatePrecisionAtK(relevantEvents, 10),
    meanReciprocalRank: calculateMeanReciprocalRank(relevantEvents),
    normalizedDiscountedCumulativeGain: calculateNDCG(relevantEvents),
    averageRelevanceScore: calculateAverageRelevanceScore(relevantEvents),
    sessionSuccessRate: calculateSessionSuccessRate(relevantEvents),
    queryRefinementRate: calculateQueryRefinementRate(relevantEvents),
    zeroResultsRate: calculateZeroResultsRate(relevantEvents),
    abandonment: calculateAbandonmentRate(relevantEvents),
    averageResponseTime: calculateAverageResponseTime(relevantEvents),
    searchLatency: calculateSearchLatency(relevantEvents),
    intentAccuracy: await calculateIntentAccuracy(relevantEvents),
    resultDiversity: calculateResultDiversity(relevantEvents),
    personalizedRelevance: calculatePersonalizedRelevance(relevantEvents)
  };

  // Cache the results
  metricsCache.set(cacheKey, {
    metrics,
    timestamp: Date.now()
  });

  return metrics;
}

/**
 * Calculate Click-Through Rate
 */
function calculateClickThroughRate(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  const eventsWithClicks = events.filter(e => e.userActions.clickedResults.length > 0);
  return eventsWithClicks.length / events.length;
}

/**
 * Calculate Precision at K
 */
function calculatePrecisionAtK(events: SearchEvent[], k: number): number {
  if (events.length === 0) return 0;

  let totalPrecision = 0;
  let validEvents = 0;

  events.forEach(event => {
    const topKResults = event.results.slice(0, k);
    const topKProductIds = topKResults.map(r => r.productId);
    const clickedInTopK = event.userActions.clickedResults.filter(id =>
      topKProductIds.includes(id)
    );

    if (topKResults.length > 0) {
      totalPrecision += clickedInTopK.length / topKResults.length;
      validEvents++;
    }
  });

  return validEvents > 0 ? totalPrecision / validEvents : 0;
}

/**
 * Calculate Mean Reciprocal Rank
 */
function calculateMeanReciprocalRank(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  let totalMRR = 0;
  let validEvents = 0;

  events.forEach(event => {
    if (event.userActions.clickedResults.length > 0) {
      // Find the position of the first clicked result
      const firstClickedId = event.userActions.clickedResults[0];
      const position = event.results.findIndex(r => r.productId === firstClickedId);

      if (position !== -1) {
        totalMRR += 1 / (position + 1); // Position is 0-indexed, rank is 1-indexed
        validEvents++;
      }
    }
  });

  return validEvents > 0 ? totalMRR / validEvents : 0;
}

/**
 * Calculate Normalized Discounted Cumulative Gain
 */
function calculateNDCG(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  let totalNDCG = 0;
  let validEvents = 0;

  events.forEach(event => {
    if (event.userActions.clickedResults.length > 0) {
      let dcg = 0;
      let idcg = 0;

      // Calculate DCG based on clicks and dwell time
      event.results.forEach((result, index) => {
        const rank = index + 1;
        let relevance = 0;

        if (event.userActions.clickedResults.includes(result.productId)) {
          relevance = 1;

          // Boost relevance based on dwell time
          const dwellTime = event.userActions.dwellTimes[result.productId];
          if (dwellTime) {
            if (dwellTime > 30000) relevance = 3; // 30+ seconds = high relevance
            else if (dwellTime > 10000) relevance = 2; // 10+ seconds = medium relevance
          }

          // Boost for purchases
          if (event.userActions.purchasedResults.includes(result.productId)) {
            relevance = 3;
          }
        }

        dcg += relevance / Math.log2(rank + 1);
      });

      // Calculate IDCG (perfect ranking)
      const clickedCount = event.userActions.clickedResults.length;
      const purchasedCount = event.userActions.purchasedResults.length;

      // Ideal ranking: purchases first, then long dwell times, then clicks
      const idealRelevances = [
        ...Array(purchasedCount).fill(3),
        ...Array(Math.max(0, clickedCount - purchasedCount)).fill(1)
      ].slice(0, event.results.length);

      idealRelevances.forEach((relevance, index) => {
        const rank = index + 1;
        idcg += relevance / Math.log2(rank + 1);
      });

      if (idcg > 0) {
        totalNDCG += dcg / idcg;
        validEvents++;
      }
    }
  });

  return validEvents > 0 ? totalNDCG / validEvents : 0;
}

/**
 * Calculate average relevance score
 */
function calculateAverageRelevanceScore(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  let totalScore = 0;
  let totalResults = 0;

  events.forEach(event => {
    event.results.forEach(result => {
      if (result.relevanceScore !== undefined) {
        totalScore += result.relevanceScore;
        totalResults++;
      }
    });
  });

  return totalResults > 0 ? totalScore / totalResults : 0;
}

/**
 * Calculate session success rate
 */
function calculateSessionSuccessRate(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  const successfulSessions = events.filter(event =>
    event.userActions.purchasedResults.length > 0 ||
    event.userActions.clickedResults.length > 0 ||
    !event.userActions.abandonedSession
  );

  return successfulSessions.length / events.length;
}

/**
 * Calculate query refinement rate
 */
function calculateQueryRefinementRate(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  const refinedQueries = events.filter(event =>
    event.userActions.refinedQuery !== undefined
  );

  return refinedQueries.length / events.length;
}

/**
 * Calculate zero results rate
 */
function calculateZeroResultsRate(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  const zeroResultQueries = events.filter(event =>
    event.metadata.totalResults === 0
  );

  return zeroResultQueries.length / events.length;
}

/**
 * Calculate abandonment rate
 */
function calculateAbandonmentRate(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  const abandonedSessions = events.filter(event =>
    event.userActions.abandonedSession
  );

  return abandonedSessions.length / events.length;
}

/**
 * Calculate average response time
 */
function calculateAverageResponseTime(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  const totalResponseTime = events.reduce((sum, event) =>
    sum + event.metadata.responseTime, 0
  );

  return totalResponseTime / events.length;
}

/**
 * Calculate search latency
 */
function calculateSearchLatency(events: SearchEvent[]): number {
  // For now, same as response time. In production, distinguish between
  // search processing time and total response time
  return calculateAverageResponseTime(events);
}

/**
 * Calculate intent accuracy using DeepSeek analysis
 */
async function calculateIntentAccuracy(events: SearchEvent[]): Promise<number> {
  if (events.length === 0) return 0;

  let correctIntents = 0;
  let totalWithIntents = 0;

  for (const event of events) {
    if (event.intent) {
      totalWithIntents++;

      // Fallback intent accuracy calculation based on user engagement
      try {
        const hasClicks = event.userActions.clickedResults.length > 0;
        const hasPurchases = event.userActions.purchasedResults.length > 0;
        const notAbandoned = !event.userActions.abandonedSession;

        // Simple heuristic: if user engaged positively, assume intent was correct
        const engagementScore = (hasClicks ? 0.3 : 0) + (hasPurchases ? 0.5 : 0) + (notAbandoned ? 0.2 : 0);

        if (engagementScore > 0.7) {
          correctIntents++;
        }
      } catch (error) {
        logger.error('Failed to analyze intent accuracy:', error as Record<string, unknown>);
      }
    }
  }

  return totalWithIntents > 0 ? correctIntents / totalWithIntents : 0;
}

/**
 * Calculate result diversity
 */
function calculateResultDiversity(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  let totalDiversity = 0;
  let validEvents = 0;

  events.forEach(event => {
    if (event.results.length > 1) {
      // Calculate category diversity in top 10 results
      const topResults = event.results.slice(0, 10);
      const categories = new Set<string>();

      topResults.forEach(result => {
        // Extract category from result (this would need to be added to the result structure)
        // For now, we'll simulate category extraction from title
        const category = extractCategoryFromTitle(result.title);
        if (category) categories.add(category);
      });

      // Diversity score: number of unique categories / total results
      totalDiversity += categories.size / topResults.length;
      validEvents++;
    }
  });

  return validEvents > 0 ? totalDiversity / validEvents : 0;
}

/**
 * Calculate personalized relevance effectiveness
 */
function calculatePersonalizedRelevance(events: SearchEvent[]): number {
  if (events.length === 0) return 0;

  let totalPersonalizationImpact = 0;
  let eventsWithPersonalization = 0;

  events.forEach(event => {
    const personalizedResults = event.results.filter(r =>
      r.personalizationBoost && r.personalizationBoost > 1.0
    );

    if (personalizedResults.length > 0) {
      // Check if personalized results had better engagement
      const personalizedClicks = personalizedResults.filter(r =>
        event.userActions.clickedResults.includes(r.productId)
      ).length;

      const personalizedClickRate = personalizedClicks / personalizedResults.length;
      const overallClickRate = event.userActions.clickedResults.length / event.results.length;

      if (overallClickRate > 0) {
        totalPersonalizationImpact += personalizedClickRate / overallClickRate;
        eventsWithPersonalization++;
      }
    }
  });

  return eventsWithPersonalization > 0 ?
    totalPersonalizationImpact / eventsWithPersonalization : 0;
}

/**
 * Extract category from product title (simple heuristic)
 */
function extractCategoryFromTitle(title: string): string | null {
  const categories = [
    'honey', 'spice', 'herb', 'tea', 'oil', 'grain', 'seed', 'powder',
    'supplement', 'fruit', 'vegetable', 'nut', 'dairy', 'meat'
  ];

  const lowerTitle = title.toLowerCase();
  for (const category of categories) {
    if (lowerTitle.includes(category)) {
      return category;
    }
  }

  return null;
}

/**
 * Generate comprehensive analytics report
 */
export async function generateAnalyticsReport(
  timeRange: { start: Date; end: Date }
): Promise<AggregatedMetrics> {
  const relevantEvents = searchEvents.filter(event => {
    const eventTime = new Date(event.timestamp);
    return eventTime >= timeRange.start && eventTime <= timeRange.end;
  });

  // Overall metrics
  const _overallMetrics = await calculateQualityMetrics(timeRange);

  // Popular queries analysis
  const queryFrequency = new Map<string, { count: number; successful: number }>();
  relevantEvents.forEach(event => {
    const existing = queryFrequency.get(event.query);
    const isSuccessful = event.userActions.clickedResults.length > 0 ||
                        event.userActions.purchasedResults.length > 0;

    if (existing) {
      existing.count++;
      if (isSuccessful) existing.successful++;
    } else {
      queryFrequency.set(event.query, {
        count: 1,
        successful: isSuccessful ? 1 : 0
      });
    }
  });

  const popularQueries = Array.from(queryFrequency.entries())
    .filter(([, data]) => data.count >= 3)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 20)
    .map(([query, data]) => ({
      query,
      count: data.count,
      successRate: data.successful / data.count
    }));

  // Problem queries (low success rate)
  const problemQueries = Array.from(queryFrequency.entries())
    .filter(([, data]) => data.count >= 2 && data.successful / data.count < 0.2)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([query, data]) => ({
      query,
      issues: ['low_click_rate', 'potential_relevance_issue'],
      frequency: data.count
    }));

  // Category performance
  const categoryPerformance: Record<string, QualityMetrics> = {};
  const categories = ['honey', 'spices', 'herbs', 'tea', 'supplements'];

  for (const category of categories) {
    const categoryEvents = relevantEvents.filter(event =>
      event.query.toLowerCase().includes(category) ||
      event.results.some(r => extractCategoryFromTitle(r.title) === category)
    );

    if (categoryEvents.length > 0) {
      // Create a temporary time range for just these events
      const categoryStartTime = new Date(Math.min(...categoryEvents.map(e => new Date(e.timestamp).getTime())));
      const categoryEndTime = new Date(Math.max(...categoryEvents.map(e => new Date(e.timestamp).getTime())));

      categoryPerformance[category] = await calculateQualityMetrics(
        { start: categoryStartTime, end: categoryEndTime },
        { searchType: undefined }
      );
    }
  }

  // Intent performance
  const intentPerformance: Record<string, QualityMetrics> = {};
  const intents = ['product', 'health', 'recipe', 'information', 'comparison'];

  for (const intent of intents) {
    intentPerformance[intent] = await calculateQualityMetrics(timeRange, { intent });
  }

  return {
    timeRange: {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString()
    },
    totalQueries: relevantEvents.length,
    uniqueUsers: new Set(relevantEvents.map(e => e.sessionId)).size,
    popularQueries,
    problemQueries,
    qualityTrends: [], // Would need historical data for trends
    categoryPerformance,
    intentPerformance
  };
}

/**
 * Get real-time search quality dashboard data
 */
export async function getSearchQualityDashboard(): Promise<{
  currentMetrics: QualityMetrics;
  recentQueries: Array<{ query: string; timestamp: string; successful: boolean }>;
  alertsAndIssues: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
  performanceTrends: Array<{ time: string; responseTime: number; successRate: number }>;
}> {
  const now = new Date();
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
  const _lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const currentMetrics = await calculateQualityMetrics({ start: lastHour, end: now });

  const recentQueries = searchEvents
    .filter(event => new Date(event.timestamp) >= lastHour)
    .slice(-20)
    .map(event => ({
      query: event.query,
      timestamp: event.timestamp,
      successful: event.userActions.clickedResults.length > 0 ||
                 event.userActions.purchasedResults.length > 0
    }));

  const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];

  // Check for quality issues
  if (currentMetrics.clickThroughRate < 0.1) {
    alerts.push({
      type: 'low_ctr',
      message: 'Click-through rate is below 10% in the last hour',
      severity: 'high'
    });
  }

  if (currentMetrics.zeroResultsRate > 0.2) {
    alerts.push({
      type: 'zero_results',
      message: 'High zero results rate detected',
      severity: 'medium'
    });
  }

  if (currentMetrics.averageResponseTime > 2000) {
    alerts.push({
      type: 'slow_response',
      message: 'Search response time is above 2 seconds',
      severity: 'medium'
    });
  }

  // Performance trends (last 24 hours in hourly buckets)
  const performanceTrends: Array<{ time: string; responseTime: number; successRate: number }> = [];

  for (let i = 23; i >= 0; i--) {
    const bucketEnd = new Date(now.getTime() - i * 60 * 60 * 1000);
    const bucketStart = new Date(bucketEnd.getTime() - 60 * 60 * 1000);

    const bucketEvents = searchEvents.filter(event => {
      const eventTime = new Date(event.timestamp);
      return eventTime >= bucketStart && eventTime < bucketEnd;
    });

    if (bucketEvents.length > 0) {
      const bucketMetrics = await calculateQualityMetrics(
        { start: bucketStart, end: bucketEnd }
      );

      performanceTrends.push({
        time: bucketEnd.toISOString(),
        responseTime: bucketMetrics.averageResponseTime,
        successRate: bucketMetrics.sessionSuccessRate
      });
    }
  }

  return {
    currentMetrics,
    recentQueries,
    alertsAndIssues: alerts,
    performanceTrends
  };
}

/**
 * Clear old search events (data retention)
 */
export function cleanupOldSearchEvents(retentionDays: number = 30): void {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const _initialCount = searchEvents.length;
  let removedCount = 0;

  for (let i = searchEvents.length - 1; i >= 0; i--) {
    const event = searchEvents[i];
    if (event && new Date(event.timestamp) < cutoffDate) {
      searchEvents.splice(i, 1);
      removedCount++;
    }
  }

  // Clear old cache entries
  metricsCache.clear();

  if (removedCount > 0) {
    logger.info(`Cleaned up ${removedCount} old search events (retention: ${retentionDays} days)`);
  }
}