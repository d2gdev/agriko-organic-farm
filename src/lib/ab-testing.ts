// Advanced A/B Testing Framework for Agriko e-commerce optimization
import { behaviorEvent } from './gtag';

import { logger } from '@/lib/logger';
import SafeLocalStorage from '@/lib/safe-localstorage';

// Enhanced A/B Test Configuration Interface
export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  startDate: string;
  endDate?: string;
  trafficAllocation: number; // Percentage of users to include (0-100)
  variants: ABTestVariant[];
  targetMetrics: string[]; // Multiple metrics support
  segmentation?: {
    userType?: 'new' | 'returning' | 'all';
    deviceType?: 'mobile' | 'desktop' | 'all';
    location?: string[];
  };
  minimumSampleSize: number;
  confidenceLevel: number; // typically 95
  statisticalPower: number; // typically 80
  createdBy: string;
  tags: string[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  trafficWeight: number; // Relative weight for traffic distribution
  config: Record<string, unknown>; // Variant-specific configuration
  isControl: boolean;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  conversionRate?: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
  significanceLevel?: number;
  isStatisticallySignificant?: boolean;
}

export interface UserAssignment {
  userId: string;
  sessionId: string;
  testId: string;
  variantId: string;
  assignedAt: string;
  deviceType: 'mobile' | 'desktop';
  userAgent: string;
  location?: string;
  segmentMatch: boolean;
}

export interface ABTestEvent {
  type: string;
  timestamp: number;
  userId: string;
  sessionId: string;
  testId: string;
  variantId: string;
  data: Record<string, unknown>;
}

// Extended interface for behaviorEvent with abTest method
interface ExtendedBehaviorEvent {
  abTest: (eventType: string, testId: string, data?: Record<string, unknown>) => void;
  timeOnPage: (pagePath: string, timeSpent: number) => void;
  scrollDepth: (pagePath: string, depth: number) => void;
  featureUsage: (featureName: string, action: string, context?: string) => void;
  siteSearch: (searchTerm: string, resultsCount: number, searchType: "traditional" | "semantic") => void;
  exitIntent: (pagePath: string, timeOnPage: number) => void;
}

// Create an extended behavior event object that includes all original methods plus abTest
const extendedBehaviorEvent: ExtendedBehaviorEvent = {
  ...behaviorEvent,
  abTest: (eventType: string, testId: string, data?: Record<string, unknown>) => {
    behaviorEvent.featureUsage(`ab_test_${eventType}`, testId, JSON.stringify(data));
  }
};

// Advanced A/B Testing Service
class ABTestingFramework {
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private testResults: Map<string, ABTestResult[]> = new Map(); // testId -> results
  private activeTests: Map<string, ABTest> = new Map();
  private events: ABTestEvent[] = [];

  constructor() {
    this.loadPersistedData();
  }

  // Test Management
  async createTest(test: ABTest): Promise<boolean> {
    try {
      if (!this.validateTestConfig(test)) {
        throw new Error('Invalid test configuration');
      }

      this.activeTests.set(test.id, test);
      await this.persistData();
      
      logger.info(`✅ A/B Test created: ${test.name} (${test.id})`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to create A/B test:', error as Record<string, unknown>);
      return false;
    }
  }

  async startTest(testId: string): Promise<boolean> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      test.status = 'running';
      test.startDate = new Date().toISOString();
      
      await this.persistData();
      
      extendedBehaviorEvent.abTest('test_started', testId, {
        testName: test.name,
        variants: test.variants.length,
        trafficAllocation: test.trafficAllocation
      });

      logger.info(`🚀 A/B Test started: ${test.name}`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to start A/B test:', error as Record<string, unknown>);
      return false;
    }
  }

  async stopTest(testId: string): Promise<boolean> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      test.status = 'completed';
      test.endDate = new Date().toISOString();
      
      await this.persistData();
      
      extendedBehaviorEvent.abTest('test_completed', testId, {
        testName: test.name,
        duration: Date.now() - new Date(test.startDate).getTime()
      });

      logger.info(`🏁 A/B Test completed: ${test.name}`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to stop A/B test:', error as Record<string, unknown>);
      return false;
    }
  }

  // User Assignment with enhanced logic
  assignUserToTest(userId: string, sessionId: string, testId: string): string | null {
    try {
      const test = this.activeTests.get(testId);
      if (!test || test.status !== 'running') {
        return null;
      }

      // Check if user already assigned
      const userTests = this.userAssignments.get(userId);
      if (userTests?.has(testId)) {
        const existingVariant = userTests.get(testId);
        if (existingVariant) {
          return existingVariant;
        }
      }

      // Check segmentation criteria
      if (!this.checkUserSegmentation(test.segmentation)) {
        return null;
      }

      // Check traffic allocation
      if (Math.random() * 100 > test.trafficAllocation) {
        return null;
      }

      // Assign to variant based on weights
      const variantId = this.selectVariant(test.variants, userId);
      
      // Store assignment
      if (!this.userAssignments.has(userId)) {
        this.userAssignments.set(userId, new Map());
      }
      const userTestMap = this.userAssignments.get(userId);
      if (userTestMap) {
        userTestMap.set(testId, variantId);
      }

      // Create assignment record
      const assignment: UserAssignment = {
        userId,
        sessionId,
        testId,
        variantId,
        assignedAt: new Date().toISOString(),
        deviceType: this.detectDeviceType(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        segmentMatch: true
      };

      // Track assignment
      this.trackEvent('user_assigned', userId, sessionId, testId, variantId, {
        deviceType: assignment.deviceType,
        testName: test.name
      });

      logger.info(`👤 User ${userId} assigned to ${testId}:${variantId}`);
      return variantId;
    } catch (error) {
      logger.error('❌ Failed to assign user to test:', error as Record<string, unknown>);
      return null;
    }
  }

  getUserVariant(userId: string, testId: string): string | null {
    const userTests = this.userAssignments.get(userId);
    return userTests ? userTests.get(testId) ?? null : null;
  }

  // Enhanced variant selection with consistent hashing
  private selectVariant(variants: ABTestVariant[], userId: string): string {
    const hash = this.hashUserId(userId);
    const totalWeight = variants.reduce((sum, v) => sum + v.trafficWeight, 0);
    
    let threshold = (hash % totalWeight);
    for (const variant of variants) {
      threshold -= variant.trafficWeight;
      if (threshold <= 0) {
        return variant.id;
      }
    }
    
    return variants.find(v => v.isControl)?.id ?? variants[0]?.id ?? '';
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Event Tracking with analytics integration
  async trackConversion(userId: string, testId: string, metric: string, value: number = 1): Promise<void> {
    try {
      const variantId = this.getUserVariant(userId, testId);
      if (!variantId) return;

      // Store result
      if (!this.testResults.has(testId)) {
        this.testResults.set(testId, []);
      }

      const results = this.testResults.get(testId);
      if (!results) {
        logger.error('Test results not found for testId:', { testId });
        return;
      }
      const existingResult = results.find(r => r.variantId === variantId && r.metric === metric);

      if (existingResult) {
        existingResult.value += value;
        existingResult.sampleSize += 1;
      } else {
        results.push({
          testId,
          variantId,
          metric,
          value,
          sampleSize: 1
        });
      }

      // Track in analytics
      extendedBehaviorEvent.abTest('conversion', testId, {
        variantId,
        metric,
        value
      });

      logger.info(`📊 Conversion tracked: ${testId}:${variantId} ${metric}=${value}`);
    } catch (error) {
      logger.error('❌ Failed to track conversion:', error as Record<string, unknown>);
    }
  }

  trackEvent(eventType: string, userId: string, sessionId: string, testId: string, variantId: string, data: Record<string, unknown> = {}): void {
    const event: ABTestEvent = {
      type: eventType,
      timestamp: Date.now(),
      userId,
      sessionId,
      testId,
      variantId,
      data
    };

    this.events.push(event);

    // Track in analytics
    extendedBehaviorEvent.abTest(eventType, testId, {
      variantId,
      ...data
    });
  }

  // Statistical Analysis
  calculateStatisticalSignificance(testId: string, metric: string): Map<string, ABTestResult> {
    const results = new Map<string, ABTestResult>();
    const testResults = this.testResults.get(testId) ?? [];
    const metricResults = testResults.filter(r => r.metric === metric);

    if (metricResults.length < 2) {
      return results;
    }

    const controlResult = metricResults.find(r => {
      const test = this.activeTests.get(testId);
      const variant = test?.variants.find(v => v.id === r.variantId);
      return variant?.isControl;
    });

    if (!controlResult) {
      return results;
    }

    for (const variantResult of metricResults) {
      if (variantResult.variantId === controlResult.variantId) {
        continue;
      }

      const significance = this.calculateZTest(controlResult, variantResult);
      
      const result: ABTestResult = {
        ...variantResult,
        conversionRate: variantResult.value / variantResult.sampleSize,
        significanceLevel: significance.pValue,
        isStatisticallySignificant: significance.pValue < 0.05,
        confidenceInterval: significance.confidenceInterval
      };

      results.set(variantResult.variantId, result);
    }

    return results;
  }

  private calculateZTest(control: ABTestResult, variant: ABTestResult) {
    const p1 = control.value / control.sampleSize;
    const p2 = variant.value / variant.sampleSize;
    const n1 = control.sampleSize;
    const n2 = variant.sampleSize;

    const pooledP = (control.value + variant.value) / (n1 + n2);
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    const zScore = (p2 - p1) / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    const margin = 1.96 * standardError;
    const confidenceInterval = {
      lower: (p2 - p1) - margin,
      upper: (p2 - p1) + margin
    };

    return { zScore, pValue, confidenceInterval };
  }

  private normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Utility Methods
  private validateTestConfig(test: ABTest): boolean {
    if (!test.id || !test.name || !test.variants || test.variants.length < 2) {
      return false;
    }

    const totalWeight = test.variants.reduce((sum, v) => sum + v.trafficWeight, 0);
    if (totalWeight <= 0) {
      return false;
    }

    const hasControl = test.variants.some(v => v.isControl);
    if (!hasControl) {
      return false;
    }

    return true;
  }

  private checkUserSegmentation(segmentation?: ABTest['segmentation']): boolean {
    if (!segmentation) return true;

    // Device type check
    if (segmentation.deviceType && segmentation.deviceType !== 'all') {
      const userDevice = this.detectDeviceType();
      if (userDevice !== segmentation.deviceType) {
        return false;
      }
    }

    // Additional segmentation logic can be added here
    return true;
  }

  private detectDeviceType(): 'mobile' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth <= 768 ? 'mobile' : 'desktop';
  }

  private loadPersistedData(): void {
    if (typeof window === 'undefined') return;

    try {
      const assignmentsData = SafeLocalStorage.getItem('ab_test_assignments');
      if (assignmentsData) {
        const parsed = JSON.parse(assignmentsData) as Record<string, Record<string, string>>;
        this.userAssignments = new Map(
          Object.entries(parsed).map(([userId, tests]) => [
            userId,
            new Map(Object.entries(tests as Record<string, string>))
          ])
        );
      }

      const resultsData = SafeLocalStorage.getItem('ab_test_results');
      if (resultsData) {
        const parsed = JSON.parse(resultsData) as Record<string, ABTestResult[]>;
        this.testResults = new Map(Object.entries(parsed));
      }
    } catch (error) {
      logger.error('Failed to load persisted A/B test data:', error as Record<string, unknown>);
    }
  }

  private async persistData(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const assignmentsObj: Record<string, Record<string, string>> = {};
      for (const [userId, tests] of this.userAssignments.entries()) {
        assignmentsObj[userId] = Object.fromEntries(tests);
      }

      const resultsObj: Record<string, ABTestResult[]> = {};
      for (const [testId, results] of this.testResults.entries()) {
        resultsObj[testId] = results;
      }

      SafeLocalStorage.setJSON('ab_test_assignments', assignmentsObj);
      SafeLocalStorage.setJSON('ab_test_results', resultsObj);
    } catch (error) {
      logger.error('Failed to persist A/B test data:', error as Record<string, unknown>);
    }
  }

  // Public methods for accessing data
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'running');
  }

  getUserExperiments(userId: string): { testId: string; variantId: string; testName: string }[] {
    const userTests = this.userAssignments.get(userId);
    if (!userTests) return [];

    return Array.from(userTests.entries()).map(([testId, variantId]) => {
      const test = this.activeTests.get(testId);
      return {
        testId,
        variantId,
        testName: test?.name ?? 'Unknown Test'
      };
    });
  }

  getTestReport(testId: string): {
    test: ABTest;
    results: Record<string, ABTestResult[]>;
    significance: Record<string, Map<string, ABTestResult>>;
  } | null {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    const results = this.testResults.get(testId) ?? [];
    const report: {
      test: ABTest;
      results: Record<string, ABTestResult[]>;
      significance: Record<string, Map<string, ABTestResult>>;
    } = {
      test,
      results: {},
      significance: {}
    };

    for (const metric of test.targetMetrics) {
      const metricResults = results.filter(r => r.metric === metric);
      report.results[metric] = metricResults;
      report.significance[metric] = this.calculateStatisticalSignificance(testId, metric);
    }

    return report;
  }
}

// Singleton instance
export const abTesting = new ABTestingFramework();

// Common A/B test configurations for e-commerce
export const commonTests = {
  recommendationAlgorithm: {
    id: 'rec_algo_v1',
    name: 'Recommendation Algorithm Comparison',
    description: 'Test collaborative filtering vs hybrid recommendations',
    status: 'draft' as const,
    startDate: new Date().toISOString(),
    trafficAllocation: 80,
    targetMetrics: ['click_through_rate', 'conversion_rate', 'revenue_per_user'],
    minimumSampleSize: 1000,
    confidenceLevel: 95,
    statisticalPower: 80,
    createdBy: 'system',
    tags: ['recommendations', 'algorithm'],
    variants: [
      { 
        id: 'control', 
        name: 'Collaborative Filtering', 
        description: 'Current collaborative filtering algorithm',
        isControl: true, 
        trafficWeight: 50, 
        config: { algorithm: 'collaborative' } 
      },
      { 
        id: 'hybrid', 
        name: 'Hybrid Algorithm', 
        description: 'Advanced hybrid recommendation system',
        isControl: false, 
        trafficWeight: 50, 
        config: { algorithm: 'hybrid' } 
      }
    ]
  },

  productCardLayout: {
    id: 'product_card_v1',
    name: 'Product Card Layout Test',
    description: 'Test different product card designs for better engagement',
    status: 'draft' as const,
    startDate: new Date().toISOString(),
    trafficAllocation: 60,
    targetMetrics: ['click_through_rate', 'add_to_cart_rate'],
    minimumSampleSize: 800,
    confidenceLevel: 95,
    statisticalPower: 80,
    createdBy: 'system',
    tags: ['ui', 'product-display'],
    variants: [
      { 
        id: 'control', 
        name: 'Standard Layout', 
        description: 'Current product card design',
        isControl: true, 
        trafficWeight: 33, 
        config: { layout: 'standard' } 
      },
      { 
        id: 'compact', 
        name: 'Compact Layout', 
        description: 'More products visible per row',
        isControl: false, 
        trafficWeight: 33, 
        config: { layout: 'compact' } 
      },
      { 
        id: 'detailed', 
        name: 'Detailed Layout', 
        description: 'Enhanced product information display',
        isControl: false, 
        trafficWeight: 34, 
        config: { layout: 'detailed' } 
      }
    ]
  },

  searchInterface: {
    id: 'search_ui_v1',
    name: 'Search Interface Optimization',
    description: 'Test semantic search vs traditional search prominence',
    status: 'draft' as const,
    startDate: new Date().toISOString(),
    trafficAllocation: 100,
    targetMetrics: ['search_success_rate', 'search_to_purchase_rate'],
    minimumSampleSize: 500,
    confidenceLevel: 95,
    statisticalPower: 80,
    createdBy: 'system',
    tags: ['search', 'ui'],
    segmentation: {
      userType: 'all',
      deviceType: 'all'
    },
    variants: [
      { 
        id: 'control', 
        name: 'Traditional Search', 
        description: 'Standard keyword search interface',
        isControl: true, 
        trafficWeight: 50, 
        config: { searchType: 'traditional' } 
      },
      { 
        id: 'semantic', 
        name: 'Semantic Search', 
        description: 'AI-powered semantic search interface',
        isControl: false, 
        trafficWeight: 50, 
        config: { searchType: 'semantic' } 
      }
    ]
  }
};

// Enhanced React Hook for A/B Testing
export function useABTest(testId: string, userId?: string, sessionId?: string) {
  // Generate fallback IDs if not provided
  const fallbackUserId = userId ?? `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fallbackSessionId = sessionId ?? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const variant = abTesting.assignUserToTest(fallbackUserId, fallbackSessionId, testId);
  
  if (!variant) {
    logger.warn(`A/B test "${testId}" not found or user not eligible`);
    return {
      variant: 'control',
      isInTest: false,
      trackConversion: () => {},
      trackEvent: () => {}
    };
  }

  return {
    variant,
    isInTest: true,
    trackConversion: (metric: string, value?: number) => 
      abTesting.trackConversion(fallbackUserId, testId, metric, value),
    trackEvent: (eventType: string, data?: Record<string, unknown>) => 
      abTesting.trackEvent(eventType, fallbackUserId, fallbackSessionId, testId, variant, data)
  };
}

// Helper function to conditionally render components based on A/B test
export function shouldShowVariant(testId: string, variantId: string, userId?: string, sessionId?: string): boolean {
  const fallbackUserId = userId ?? `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fallbackSessionId = sessionId ?? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const userVariant = abTesting.assignUserToTest(fallbackUserId, fallbackSessionId, testId);
  return userVariant === variantId;
}

// Utility function to get variant configuration
export function getVariantConfig(testId: string, userId?: string, sessionId?: string): Record<string, unknown> {
  const fallbackUserId = userId ?? `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fallbackSessionId = sessionId ?? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const variantId = abTesting.assignUserToTest(fallbackUserId, fallbackSessionId, testId);
  if (!variantId) return {};

  const test = abTesting.getActiveTests().find(t => t.id === testId);
  const variant = test?.variants.find(v => v.id === variantId);
  
  return variant?.config ?? {};
}