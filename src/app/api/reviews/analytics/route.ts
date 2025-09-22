import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { reviewAnalyticsService, ReviewMetricsFilter } from '@/lib/review-analytics';
import { ReviewAnalytics, ReviewStatus } from '@/types/reviews';

// GET /api/reviews/analytics - Real review analytics and insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const filter: ReviewMetricsFilter = {};
    
    // Handle legacy 'timeframe' parameter and new 'timeRange'
    const timeframe = searchParams.get('timeframe');
    const timeRange = searchParams.get('timeRange');
    
    if (timeRange && ['7d', '30d', '90d', '1y'].includes(timeRange)) {
      filter.timeRange = timeRange as '7d' | '30d' | '90d' | '1y';
    } else if (timeframe) {
      // Convert legacy timeframe (days) to timeRange
      const days = parseInt(timeframe, 10);
      if (days <= 7) filter.timeRange = '7d';
      else if (days <= 30) filter.timeRange = '30d';
      else if (days <= 90) filter.timeRange = '90d';
      else filter.timeRange = '1y';
    }
    
    const productId = searchParams.get('productId');
    if (productId) {
      filter.productId = parseInt(productId, 10);
    }
    
    const rating = searchParams.get('rating');
    if (rating) {
      filter.rating = parseInt(rating, 10);
    }
    
    const verified = searchParams.get('verified');
    if (verified !== null) {
      filter.verified = verified === 'true';
    }
    
    const status = searchParams.get('status');
    if (status && Object.values(ReviewStatus).includes(status as ReviewStatus)) {
      filter.status = status as ReviewStatus;
    }
    
    const useMock = searchParams.get('mock') === 'true';
    
    // Get review analytics
    if (useMock) {
      // Return legacy mock data for backwards compatibility
      const timeframeDays = filter.timeRange === '7d' ? 7 : filter.timeRange === '90d' ? 90 : filter.timeRange === '1y' ? 365 : 30;
      const mockAnalytics = generateReviewAnalytics(filter.productId, timeframeDays);
      return NextResponse.json({
        success: true,
        data: mockAnalytics,
        source: 'mock_data_requested',
        timestamp: new Date().toISOString()
      });
    }

    // Get real review analytics
    const analytics = await reviewAnalyticsService.getReviewAnalytics(filter);
    
    return NextResponse.json({
      success: true,
      data: analytics,
      source: 'review_analytics_service',
      timestamp: new Date().toISOString(),
      filter
    });

  } catch (error) {
    logger.error('Review Analytics API error:', error as Record<string, unknown>);

    // Return error state instead of mock data
    return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch review analytics',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
  }
}

function generateReviewAnalytics(productId?: number, timeframeDays: number = 30): ReviewAnalytics {
  const currentDate = new Date();
  // const startDate = new Date(currentDate.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

  // Mock data generation - in production this would query actual database
  const totalReviews = Math.floor(Math.random() * 500) + 100;
  const averageRating = Math.round((Math.random() * 1.5 + 3.5) * 10) / 10; // 3.5-5.0 range
  
  // Calculate this month vs last month
  const reviewsThisMonth = Math.floor(totalReviews * 0.3);
  const reviewsLastMonth = Math.floor(totalReviews * 0.25);
  const growthRate = Math.round(((reviewsThisMonth - reviewsLastMonth) / reviewsLastMonth) * 100);

  // Sentiment analysis (mock)
  const sentimentScore = Math.round((averageRating / 5) * 100);

  // Top keywords with sentiment
  const topKeywords = [
    { word: 'quality', count: 45, sentiment: 'positive' as const },
    { word: 'organic', count: 38, sentiment: 'positive' as const },
    { word: 'fresh', count: 32, sentiment: 'positive' as const },
    { word: 'taste', count: 29, sentiment: 'positive' as const },
    { word: 'delivery', count: 25, sentiment: 'neutral' as const },
    { word: 'packaging', count: 22, sentiment: 'positive' as const },
    { word: 'price', count: 18, sentiment: 'neutral' as const },
    { word: 'healthy', count: 16, sentiment: 'positive' as const },
    { word: 'delayed', count: 8, sentiment: 'negative' as const },
    { word: 'expensive', count: 6, sentiment: 'negative' as const }
  ];

  // Rating trends over time
  const ratingTrends = [];
  for (let i = timeframeDays; i >= 0; i -= Math.ceil(timeframeDays / 10)) {
    const date = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
    ratingTrends.push({
      date: date.toISOString().split('T')[0] || date.toISOString(),
      averageRating: Math.round((Math.random() * 1 + (averageRating - 0.5)) * 10) / 10,
      count: Math.floor(Math.random() * 15) + 5
    });
  }

  // Product performance data
  const productPerformance = [
    {
      productId: 123,
      productName: 'Organic Black Rice (2kg)',
      averageRating: 4.7,
      reviewCount: 89,
      verifiedPercentage: 85
    },
    {
      productId: 124,
      productName: 'Mixed Organic Vegetables',
      averageRating: 4.5,
      reviewCount: 67,
      verifiedPercentage: 92
    },
    {
      productId: 125,
      productName: 'Organic Brown Rice (1kg)',
      averageRating: 4.3,
      reviewCount: 45,
      verifiedPercentage: 78
    },
    {
      productId: 126,
      productName: 'Fresh Organic Herbs Bundle',
      averageRating: 4.8,
      reviewCount: 34,
      verifiedPercentage: 88
    },
    {
      productId: 127,
      productName: 'Organic Quinoa (500g)',
      averageRating: 4.2,
      reviewCount: 28,
      verifiedPercentage: 75
    }
  ];

  return {
    totalReviews,
    averageRating,
    reviewsThisMonth,
    reviewsLastMonth,
    growthRate,
    sentimentScore,
    topKeywords,
    ratingTrends,
    productPerformance: productId 
      ? productPerformance.filter(p => p.productId === productId)
      : productPerformance
  };
}

// POST endpoint for tracking review events and operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    logger.info(`📊 Review Analytics POST: action=${action}`);

    switch (action) {
      case 'track_review_submission':
        // Track when a review is submitted
        const { reviewId, productId, rating, verified } = data;
        
        // In a real implementation, this would update analytics metrics
        logger.info('📝 Review submission tracked', {
          reviewId,
          productId,
          rating,
          verified
        });
        
        return NextResponse.json({
          success: true,
          action,
          message: 'Review submission tracked successfully'
        });

      case 'track_review_moderation':
        // Track when a review is moderated
        const { reviewId: moderatedId, status, moderatorId } = data;
        
        logger.info('🔍 Review moderation tracked', {
          reviewId: moderatedId,
          status,
          moderatorId
        });
        
        return NextResponse.json({
          success: true,
          action,
          message: 'Review moderation tracked successfully'
        });

      case 'track_review_helpfulness':
        // Track when users vote on review helpfulness
        const { reviewId: helpfulReviewId, helpful, userId } = data;
        
        logger.info('👍 Review helpfulness tracked', {
          reviewId: helpfulReviewId,
          helpful,
          userId
        });
        
        return NextResponse.json({
          success: true,
          action,
          message: 'Review helpfulness tracked successfully'
        });

      case 'clear_cache':
        // Clear analytics cache
        reviewAnalyticsService.clearCache();
        
        return NextResponse.json({
          success: true,
          action,
          message: 'Review analytics cache cleared successfully'
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Supported: track_review_submission, track_review_moderation, track_review_helpfulness, clear_cache' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Review Analytics POST error:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        success: false,
        error: 'Review analytics operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}