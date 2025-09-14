// API route for recommendation cache management
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { recommendationCache } from '@/lib/recommendation-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = recommendationCache.getStats();
        return NextResponse.json({
          success: true,
          cache: {
            ...stats,
            memoryUsage: `${stats.memoryUsage} KB`
          },
          timestamp: new Date().toISOString()
        });

      case 'popular':
        const limit = parseInt(searchParams.get('limit') || '10');
        const popular = recommendationCache.getPopularEntries(limit);
        return NextResponse.json({
          success: true,
          popularEntries: popular.map(entry => ({
            key: entry.key,
            hits: entry.hits,
            resultCount: entry.data.length
          })),
          timestamp: new Date().toISOString()
        });

      default:
        const basicStats = recommendationCache.getStats();
        return NextResponse.json({
          success: true,
          message: 'Recommendation cache is running',
          stats: basicStats,
          actions: {
            stats: '/api/recommendations/cache?action=stats',
            popular: '/api/recommendations/cache?action=popular&limit=10',
            invalidate: 'POST /api/recommendations/cache with action: invalidate'
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    logger.error('❌ Cache stats API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Failed to get cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productIds, categories, healthBenefits } = body;

    switch (action) {
      case 'invalidate':
        if (productIds || categories || healthBenefits) {
          // Selective invalidation
          recommendationCache.invalidate(productIds, categories, healthBenefits);
          return NextResponse.json({
            success: true,
            message: 'Cache selectively invalidated',
            invalidated: {
              productIds: productIds || [],
              categories: categories || [],
              healthBenefits: healthBenefits || []
            },
            timestamp: new Date().toISOString()
          });
        } else {
          // Invalidate all
          recommendationCache.invalidateAll();
          return NextResponse.json({
            success: true,
            message: 'All cache entries invalidated',
            timestamp: new Date().toISOString()
          });
        }

      case 'warm-up':
        // This would implement cache warming logic
        return NextResponse.json({
          success: true,
          message: 'Cache warm-up initiated',
          note: 'Warm-up logic would be implemented here',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: invalidate, warm-up' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ Cache management API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'Failed to manage cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}