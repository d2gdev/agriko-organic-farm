import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { realAnalytics } from '@/lib/real-analytics';
import { sanitizeStringParam, createErrorResponse, parseBooleanParam } from '@/lib/api-helpers';
import { checkEndpointRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

// Analytics Dashboard API - Now using real analytics data
export async function GET(request: NextRequest) {
  // Rate limiting for analytics endpoints
  const rl = checkEndpointRateLimit(request, 'analytics');
  if (!rl.success) {
    return createRateLimitResponse(rl);
  }

  try {
    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize input parameters
    const timeRangeParam = searchParams.get('timeRange');
    const detailsParam = searchParams.get('details');
    const mockParam = searchParams.get('mock');
    
    // Validate timeRange parameter
    const validTimeRanges = ['1h', '6h', '24h', '7d', '30d'];
    const timeRangeSanitized = sanitizeStringParam(timeRangeParam || '24h', 'timeRange', { maxLength: 10 });
    if (!timeRangeSanitized.success) {
      return createErrorResponse(timeRangeSanitized.error, {}, 400);
    }
    const timeRange = validTimeRanges.includes(timeRangeSanitized.value) ? timeRangeSanitized.value : '24h';
    
    // Validate boolean parameters
    const includeDetails = parseBooleanParam(detailsParam, 'details');
    const includeMock = parseBooleanParam(mockParam, 'mock');

    // Use real analytics by default, fallback to mock only if explicitly requested
    if (includeMock) {
      const mockAnalytics = generateEnhancedMockAnalytics(timeRange);
      return NextResponse.json({
        success: true,
        timeRange,
        timestamp: new Date().toISOString(),
        source: 'mock_data_requested',
        data: mockAnalytics,
        note: 'Mock data returned as requested via ?mock=true',
        lastUpdated: new Date().toISOString()
      });
    }

    // Get real analytics data
    const realAnalyticsData = await realAnalytics.getDashboardAnalytics(timeRange);
    
    return NextResponse.json({
      success: true,
      timeRange,
      timestamp: new Date().toISOString(),
      source: 'real_analytics',
      data: realAnalyticsData,
      includeDetails,
      note: 'Real user behavior analytics data',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Analytics Dashboard error', error as Record<string, unknown>, 'analytics');
    
    // Fallback to mock data if real analytics fails
    const timeRange = '24h';
    const fallbackAnalytics = generateBasicMockAnalytics(timeRange);
    return NextResponse.json({
      success: true,
      timeRange,
      data: fallbackAnalytics,
      source: 'mock_fallback',
      warning: 'Real analytics unavailable, showing mock data',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastUpdated: new Date().toISOString()
    });
  }
}

// Enhanced mock analytics for development (fallback only)
function generateEnhancedMockAnalytics(timeRange: string) {
  const now = new Date();
  const days = timeRange === '7d' ? 7 : timeRange === '24h' ? 1 : timeRange === '30d' ? 30 : 1;
  
  return {
    // Real-time metrics
    realTime: {
      productViews: Math.floor(Math.random() * 100) + 50,
      searches: Math.floor(Math.random() * 30) + 15,
      recommendationClicks: Math.floor(Math.random() * 25) + 10,
      cartAdditions: Math.floor(Math.random() * 15) + 5,
      purchases: Math.floor(Math.random() * 8) + 2,
      revenue: Math.floor(Math.random() * 500) + 200,
      activeUsers: Math.floor(Math.random() * 20) + 10,
      activeSessions: Math.floor(Math.random() * 35) + 15,
      conversionRate: (Math.random() * 3 + 2).toFixed(2),
      recommendationCTR: (Math.random() * 15 + 5).toFixed(2)
    },

    // Historical trends
    historical: {
      dailyMetrics: Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        return {
          day: date.toISOString().split('T')[0],
          eventType: ['product_view', 'search_performed', 'recommendation_clicked'][i % 3],
          count: Math.floor(Math.random() * 100) + 20
        };
      }),
      topProducts: [
        { productId: 123, productName: '5n1 Turmeric Tea Blend', views: 245 },
        { productId: 456, productName: 'Organic Honey', views: 198 },
        { productId: 789, productName: 'Black Rice', views: 167 },
        { productId: 101, productName: 'Pure Moringa Powder', views: 134 },
        { productId: 202, productName: 'Salabat Tea Blend', views: 123 }
      ]
    },

    // Recommendation performance
    recommendations: {
      performanceByType: [
        { recommendationType: 'similar', shown: 1250, clicked: 89, ctr: 7.12 },
        { recommendationType: 'personalized', shown: 890, clicked: 67, ctr: 7.53 },
        { recommendationType: 'health', shown: 567, clicked: 45, ctr: 7.94 },
        { recommendationType: 'seasonal', shown: 234, clicked: 18, ctr: 7.69 }
      ]
    },

    // Search analytics
    search: {
      topQueries: [
        { query: 'turmeric tea', searches: 45, successRate: 0.89 },
        { query: 'organic honey', searches: 32, successRate: 0.94 },
        { query: 'black rice', searches: 28, successRate: 0.82 },
        { query: 'moringa powder', searches: 24, successRate: 0.91 },
        { query: 'salabat blend', searches: 19, successRate: 0.76 }
      ],
      searchTypes: [
        { searchType: 'keyword', count: 150 },
        { searchType: 'semantic', count: 75 },
        { searchType: 'hybrid', count: 25 }
      ]
    },

    // User behavior
    userBehavior: {
      sessionDuration: { average: 180, median: 120, sessions: 1500 },
      topPages: [
        { path: '/', views: 2500 },
        { path: '/products', views: 1200 },
        { path: '/about', views: 800 },
        { path: '/find-us', views: 450 },
        { path: '/cart', views: 320 }
      ],
      bounceRate: 35.5
    },

    // Conversion funnel
    conversion: {
      steps: [
        { name: 'Page Views', sessions: 10000, rate: 100 },
        { name: 'Product Views', sessions: 6500, rate: 65 },
        { name: 'Add to Cart', sessions: 1950, rate: 30 },
        { name: 'Checkout Started', sessions: 975, rate: 50 },
        { name: 'Purchase Completed', sessions: 780, rate: 80 }
      ]
    },

    // Overview metrics
    overview: {
      totalVisitors: Math.floor(Math.random() * 1000) + 500,
      totalPageviews: Math.floor(Math.random() * 3000) + 1500,
      totalRevenue: Math.floor(Math.random() * 5000) + 2000,
      conversionRate: (Math.random() * 3 + 1).toFixed(2),
      averageOrderValue: (Math.random() * 50 + 30).toFixed(2),
      bounceRate: (Math.random() * 20 + 30).toFixed(1)
    }
  };
}

// Basic fallback mock analytics (emergency fallback only)
function generateBasicMockAnalytics(_timeRange: string) {
  return {
    overview: {
      totalVisitors: 750,
      totalPageviews: 2250,
      totalRevenue: 3500,
      conversionRate: "2.5",
      averageOrderValue: "45.00",
      bounceRate: "35.0"
    },
    message: "Basic analytics data - enhanced system unavailable"
  };
}