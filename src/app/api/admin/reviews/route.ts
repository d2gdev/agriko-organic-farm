import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AdminAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';
import type { ReviewData } from '@/types/type-safety';

// GET /api/admin/reviews - Get all reviews for admin dashboard
async function handleGetReviews(request: NextRequest, authResult: AdminAuthResult): Promise<Response> {
  try {
    logger.info(`Admin ${authResult.userId} accessing reviews dashboard`, 
      undefined, 'admin-reviews');

    // Fetch reviews from database - currently returns empty until review system is integrated
    const reviews: ReviewData[] = [];

    // TODO: Implement actual review database queries:
    // const reviews = await reviewDatabase.getAllReviews();

    // Calculate stats
    const stats = {
      total: reviews.length,
      pending: 0, // TODO: Add status field to ReviewData when implementing
      approved: 0,
      rejected: 0,
      averageRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
    };

    return NextResponse.json({
      success: true,
      reviews,
      stats,
      moderatedBy: authResult.userId
    });

  } catch (error) {
    logger.error('Failed to fetch admin reviews:', error as Record<string, unknown>, 'admin-reviews');
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch reviews'
    }, { status: 500 });
  }
}

// Export authenticated handlers
export const GET = withAdminAuth(handleGetReviews);