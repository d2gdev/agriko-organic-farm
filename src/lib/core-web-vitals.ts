import { logger } from '@/lib/logger';
import { realAnalytics } from '@/lib/real-analytics';

// Core Web Vitals tracking and analysis
export interface CoreWebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  page: string;
  sessionId?: string;
  userId?: string;
  userAgent?: string;
  connectionType?: string;
}

export interface PagePerformanceMetrics {
  page: string;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  pageLoadTime: number;
  sampleSize: number;
  lastUpdated: number;
}

export interface CoreWebVitalsReport {
  timeRange: string;
  summary: {
    totalPageViews: number;
    averageLCP: number;
    averageFID: number;
    averageCLS: number;
    passRate: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  trends: Array<{
    date: string;
    lcp: number;
    fid: number;
    cls: number;
    pageViews: number;
  }>;
  topPages: Array<{
    page: string;
    lcp: number;
    fid: number;
    cls: number;
    pageViews: number;
  }>;
}

export interface PerformanceBudget {
  budgets: Record<string, {
    budget: number;
    current: number;
    status: 'good' | 'warning' | 'error';
  }>;
  violations: Array<{
    metric: string;
    budget: number;
    current: number;
    status: string;
  }>;
  overallStatus: 'good' | 'warning' | 'error';
  lastChecked: number;
}

class CoreWebVitalsService {
  private static instance: CoreWebVitalsService;
  private metrics = new Map<string, CoreWebVitalMetric[]>();
  private pageMetrics = new Map<string, PagePerformanceMetrics>();
  private readonly MAX_METRICS_PER_PAGE = 1000;

  static getInstance(): CoreWebVitalsService {
    if (!CoreWebVitalsService.instance) {
      CoreWebVitalsService.instance = new CoreWebVitalsService();
    }
    return CoreWebVitalsService.instance;
  }

  // Track Core Web Vital metric
  trackMetric(metric: Omit<CoreWebVitalMetric, 'rating'>): void {
    const fullMetric: CoreWebVitalMetric = {
      ...metric,
      rating: this.calculateRating(metric.name, metric.value)
    };

    const pageMetrics = this.metrics.get(metric.page) ?? [];
    pageMetrics.push(fullMetric);

    // Keep only recent metrics
    if (pageMetrics.length > this.MAX_METRICS_PER_PAGE) {
      pageMetrics.splice(0, pageMetrics.length - this.MAX_METRICS_PER_PAGE);
    }

    this.metrics.set(metric.page, pageMetrics);
    this.updatePageSummary(metric.page);

    // Also track in real analytics
    realAnalytics.trackEvent({
      type: 'page_view',
      sessionId: metric.sessionId ?? 'unknown',
      userId: metric.userId,
      data: {
        page: metric.page,
        [metric.name.toLowerCase()]: metric.value,
        performance_rating: fullMetric.rating
      },
      source: 'web'
    });

    logger.debug('📊 Core Web Vital tracked', {
      metric: metric.name,
      value: metric.value,
      rating: fullMetric.rating,
      page: metric.page
    });
  }

  // Track multiple metrics at once
  trackBatchMetrics(metrics: Omit<CoreWebVitalMetric, 'rating'>[]): void {
    metrics.forEach(metric => this.trackMetric(metric));
  }

  // Get performance metrics for a specific page
  getPageMetrics(page: string): PagePerformanceMetrics | null {
    return this.pageMetrics.get(page) ?? null;
  }

  // Get Core Web Vitals report
  getCoreWebVitalsReport(timeRange: string = '30d'): CoreWebVitalsReport {
    const cutoffTime = this.getTimeRangeCutoff(timeRange);
    const recentMetrics = this.getMetricsSince(cutoffTime);
    
    const summary = this.calculateSummary(recentMetrics);
    const trends = this.calculateTrends(recentMetrics, timeRange);
    const topPages = this.getTopPagesByPerformance(recentMetrics);

    return {
      timeRange,
      summary,
      trends,
      topPages
    };
  }

  // Check performance against budgets
  checkPerformanceBudget(): PerformanceBudget {
    const budgets = {
      lcp: { budget: 2500, current: 0, status: 'good' as 'good' | 'warning' | 'error' },
      fid: { budget: 100, current: 0, status: 'good' as 'good' | 'warning' | 'error' },
      cls: { budget: 0.1, current: 0, status: 'good' as 'good' | 'warning' | 'error' },
      fcp: { budget: 1800, current: 0, status: 'good' as 'good' | 'warning' | 'error' },
      ttfb: { budget: 600, current: 0, status: 'good' as 'good' | 'warning' | 'error' }
    };

    // Calculate current averages from recent metrics
    const recentMetrics = this.getMetricsSince(Date.now() - 24 * 60 * 60 * 1000); // Last 24h
    
    if (recentMetrics.length > 0) {
      const averages = this.calculateAverages(recentMetrics);
      budgets.lcp.current = Math.round(averages.lcp);
      budgets.fid.current = Math.round(averages.fid);
      budgets.cls.current = Math.round(averages.cls * 1000) / 1000;
      budgets.fcp.current = Math.round(averages.fcp);
      budgets.ttfb.current = Math.round(averages.ttfb);
    }

    // Update status based on current vs budget
    Object.entries(budgets).forEach(([metric, data]) => {
      const ratio = data.current / data.budget;
      if (ratio <= 0.8) {
        data.status = 'good';
      } else if (ratio <= 1.0) {
        data.status = 'warning';
      } else {
        data.status = 'error';
      }
    });

    const violations = Object.entries(budgets)
      .filter(([_, data]) => data.status !== 'good')
      .map(([metric, data]) => ({
        metric,
        budget: data.budget,
        current: data.current,
        status: data.status
      }));

    return {
      budgets,
      violations,
      overallStatus: violations.length === 0 ? 'good' : violations.some(v => v.status === 'error') ? 'error' : 'warning',
      lastChecked: Date.now()
    };
  }

  // Calculate metric rating based on thresholds
  private calculateRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      LCP: [2500, 4000],  // ms
      FID: [100, 300],    // ms
      CLS: [0.1, 0.25],   // score
      FCP: [1800, 3000],  // ms
      TTFB: [600, 1500]   // ms
    };

    const [good, poor] = thresholds[metricName] ?? [0, 0];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  // Update page summary metrics
  private updatePageSummary(page: string): void {
    const pageMetrics = this.metrics.get(page) ?? [];
    if (pageMetrics.length === 0) return;

    // Calculate averages for the last 100 metrics
    const recentMetrics = pageMetrics.slice(-100);
    
    const lcpMetrics = recentMetrics.filter(m => m.name === 'LCP');
    const fidMetrics = recentMetrics.filter(m => m.name === 'FID');
    const clsMetrics = recentMetrics.filter(m => m.name === 'CLS');
    const fcpMetrics = recentMetrics.filter(m => m.name === 'FCP');
    const ttfbMetrics = recentMetrics.filter(m => m.name === 'TTFB');

    const summary: PagePerformanceMetrics = {
      page,
      lcp: this.average(lcpMetrics.map(m => m.value)),
      fid: this.average(fidMetrics.map(m => m.value)),
      cls: this.average(clsMetrics.map(m => m.value)),
      fcp: this.average(fcpMetrics.map(m => m.value)),
      ttfb: this.average(ttfbMetrics.map(m => m.value)),
      pageLoadTime: this.average(lcpMetrics.map(m => m.value)) + 500, // Estimate
      sampleSize: recentMetrics.length,
      lastUpdated: Date.now()
    };

    this.pageMetrics.set(page, summary);
  }

  // Get metrics since timestamp
  private getMetricsSince(cutoffTime: number): CoreWebVitalMetric[] {
    const allMetrics: CoreWebVitalMetric[] = [];
    
    for (const pageMetrics of this.metrics.values()) {
      const recentMetrics = pageMetrics.filter(m => m.timestamp > cutoffTime);
      allMetrics.push(...recentMetrics);
    }

    return allMetrics;
  }

  // Calculate summary statistics
  private calculateSummary(metrics: CoreWebVitalMetric[]) {
    if (metrics.length === 0) {
      return {
        totalPageViews: 0,
        averageLCP: 0,
        averageFID: 0,
        averageCLS: 0,
        passRate: { lcp: 0, fid: 0, cls: 0 }
      };
    }

    const lcpMetrics = metrics.filter(m => m.name === 'LCP');
    const fidMetrics = metrics.filter(m => m.name === 'FID');
    const clsMetrics = metrics.filter(m => m.name === 'CLS');

    const averageLCP = this.average(lcpMetrics.map(m => m.value));
    const averageFID = this.average(fidMetrics.map(m => m.value));
    const averageCLS = this.average(clsMetrics.map(m => m.value));

    // Calculate pass rates (percentage of "good" ratings)
    const lcpPassRate = lcpMetrics.length > 0 
      ? (lcpMetrics.filter(m => m.rating === 'good').length / lcpMetrics.length) * 100 
      : 0;
    const fidPassRate = fidMetrics.length > 0 
      ? (fidMetrics.filter(m => m.rating === 'good').length / fidMetrics.length) * 100 
      : 0;
    const clsPassRate = clsMetrics.length > 0 
      ? (clsMetrics.filter(m => m.rating === 'good').length / clsMetrics.length) * 100 
      : 0;

    return {
      totalPageViews: new Set(metrics.map(m => `${m.page}-${m.sessionId}`)).size,
      averageLCP: Math.round(averageLCP),
      averageFID: Math.round(averageFID),
      averageCLS: Math.round(averageCLS * 1000) / 1000,
      passRate: {
        lcp: Math.round(lcpPassRate),
        fid: Math.round(fidPassRate),
        cls: Math.round(clsPassRate)
      }
    };
  }

  // Calculate daily trends
  private calculateTrends(metrics: CoreWebVitalMetric[], timeRange: string) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] ?? date.toISOString();
      
      const dayStart = new Date(date).setHours(0, 0, 0, 0);
      const dayEnd = new Date(date).setHours(23, 59, 59, 999);
      
      const dayMetrics = metrics.filter(m => m.timestamp >= dayStart && m.timestamp <= dayEnd);
      
      const lcpMetrics = dayMetrics.filter(m => m.name === 'LCP');
      const fidMetrics = dayMetrics.filter(m => m.name === 'FID');
      const clsMetrics = dayMetrics.filter(m => m.name === 'CLS');
      
      trends.push({
        date: dateStr,
        lcp: Math.round(this.average(lcpMetrics.map(m => m.value))),
        fid: Math.round(this.average(fidMetrics.map(m => m.value))),
        cls: Math.round(this.average(clsMetrics.map(m => m.value)) * 1000) / 1000,
        pageViews: new Set(dayMetrics.map(m => `${m.page}-${m.sessionId}`)).size
      });
    }

    return trends;
  }

  // Get top performing pages
  private getTopPagesByPerformance(metrics: CoreWebVitalMetric[]) {
    const pageGroups = new Map<string, CoreWebVitalMetric[]>();
    
    metrics.forEach(metric => {
      const pageMetrics = pageGroups.get(metric.page) ?? [];
      pageMetrics.push(metric);
      pageGroups.set(metric.page, pageMetrics);
    });

    const pagePerformance = Array.from(pageGroups.entries()).map(([page, metrics]) => {
      const lcpMetrics = metrics.filter(m => m.name === 'LCP');
      const fidMetrics = metrics.filter(m => m.name === 'FID');
      const clsMetrics = metrics.filter(m => m.name === 'CLS');
      
      return {
        page,
        lcp: Math.round(this.average(lcpMetrics.map(m => m.value))),
        fid: Math.round(this.average(fidMetrics.map(m => m.value))),
        cls: Math.round(this.average(clsMetrics.map(m => m.value)) * 1000) / 1000,
        pageViews: new Set(metrics.map(m => `${m.page}-${m.sessionId}`)).size
      };
    });

    return pagePerformance.sort((a, b) => b.pageViews - a.pageViews).slice(0, 5);
  }

  // Calculate averages with fallback
  private calculateAverages(metrics: CoreWebVitalMetric[]) {
    const lcpMetrics = metrics.filter(m => m.name === 'LCP');
    const fidMetrics = metrics.filter(m => m.name === 'FID');
    const clsMetrics = metrics.filter(m => m.name === 'CLS');
    const fcpMetrics = metrics.filter(m => m.name === 'FCP');
    const ttfbMetrics = metrics.filter(m => m.name === 'TTFB');

    return {
      lcp: this.average(lcpMetrics.map(m => m.value)),
      fid: this.average(fidMetrics.map(m => m.value)),
      cls: this.average(clsMetrics.map(m => m.value)),
      fcp: this.average(fcpMetrics.map(m => m.value)),
      ttfb: this.average(ttfbMetrics.map(m => m.value))
    };
  }

  // Helper to calculate average
  private average(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  // Get time range cutoff
  private getTimeRangeCutoff(timeRange: string): number {
    const now = Date.now();
    switch (timeRange) {
      case '1h': return now - 60 * 60 * 1000;
      case '24h': return now - 24 * 60 * 60 * 1000;
      case '7d': return now - 7 * 24 * 60 * 60 * 1000;
      case '30d': return now - 30 * 24 * 60 * 60 * 1000;
      default: return now - 30 * 24 * 60 * 60 * 1000;
    }
  }

  // Get service statistics
  getStats() {
    return {
      totalPages: this.metrics.size,
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
      pagesSummaries: this.pageMetrics.size
    };
  }

  // Clear all data
  clearData(): void {
    this.metrics.clear();
    this.pageMetrics.clear();
    logger.info('🗑️ Core Web Vitals data cleared');
  }
}

// Export singleton instance
export const coreWebVitalsService = CoreWebVitalsService.getInstance();

// Helper functions for external use
export function trackCoreWebVital(metric: Omit<CoreWebVitalMetric, 'rating'>): void {
  coreWebVitalsService.trackMetric(metric);
}

export function getPagePerformance(page: string): PagePerformanceMetrics | null {
  return coreWebVitalsService.getPageMetrics(page);
}

export function getCoreWebVitalsReport(timeRange?: string): CoreWebVitalsReport {
  return coreWebVitalsService.getCoreWebVitalsReport(timeRange);
}

export function getPerformanceBudgetStatus(): PerformanceBudget {
  return coreWebVitalsService.checkPerformanceBudget();
}

export default coreWebVitalsService;