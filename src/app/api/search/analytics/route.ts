import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { 
  trackSearchEvent, 
  trackClickEvent, 
  trackPurchaseEvent,
  getUserProfile,
  getSearchAnalytics,
  clearOldAnalytics 
} from '@/lib/search-analytics';

// POST /api/search/analytics - Track search events and user behavior
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'track_search':
        {
          const { sessionId, userId, query, searchType, results, userAgent, location } = data;
          
          // Define interface for search result items
          interface SearchResultItem {
            productId: number;
            title: string;
            relevanceScore?: number;
            hybridScore?: number;
            score?: number;
          }

          trackSearchEvent({
            sessionId,
            userId,
            query,
            searchType,
            results: results.map((r: SearchResultItem, index: number) => ({
              productId: r.productId,
              title: r.title,
              position: index,
              score: r.relevanceScore || r.hybridScore || r.score || 0
            })),
            userAgent: userAgent || request.headers.get('user-agent') || 'unknown',
            location
          });

          return NextResponse.json({
            success: true,
            message: 'Search event tracked'
          });
        }

      case 'track_click':
        {
          const { sessionId, productId, query, position } = data;
          
          trackClickEvent(sessionId, productId, query, position);

          return NextResponse.json({
            success: true,
            message: 'Click event tracked'
          });
        }

      case 'track_purchase':
        {
          const { sessionId, productId, context, amount } = data;
          
          trackPurchaseEvent(sessionId, productId, context, amount);

          return NextResponse.json({
            success: true,
            message: 'Purchase event tracked'
          });
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: track_search, track_click, track_purchase' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ Search analytics API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Analytics tracking failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/search/analytics - Get analytics data and user profiles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';
    const sessionId = searchParams.get('sessionId');
    const timeRange = parseInt(searchParams.get('timeRange') || '86400000'); // 24 hours default

    switch (action) {
      case 'summary':
        {
          const analytics = getSearchAnalytics(timeRange);
          
          return NextResponse.json({
            success: true,
            data: analytics,
            timeRange: timeRange
          });
        }

      case 'user_profile':
        {
          if (!sessionId) {
            return NextResponse.json(
              { error: 'sessionId is required for user_profile action' },
              { status: 400 }
            );
          }

          const profile = getUserProfile(sessionId);
          
          // Return public profile data (without sensitive info)
          const publicProfile = {
            sessionId: profile.sessionId,
            preferences: profile.preferences,
            searchCount: profile.searchHistory.length,
            clickCount: profile.clickHistory.length,
            purchaseCount: profile.purchaseHistory.length,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt
          };

          return NextResponse.json({
            success: true,
            data: publicProfile
          });
        }

      case 'cleanup':
        {
          const maxAge = parseInt(searchParams.get('maxAge') || '604800000'); // 7 days default
          clearOldAnalytics(maxAge);

          return NextResponse.json({
            success: true,
            message: 'Analytics data cleaned',
            maxAge
          });
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: summary, user_profile, cleanup' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ Search analytics GET API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Analytics retrieval failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}