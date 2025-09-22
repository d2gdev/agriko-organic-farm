import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AdminAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

// GET /api/admin/reviews - Get all reviews for admin dashboard
async function handleGetReviews(request: NextRequest, authResult: AdminAuthResult): Promise<Response> {
  try {
    logger.info(`Admin ${authResult.userId} accessing reviews dashboard`, 
      undefined, 'admin-reviews');

    // Fetch reviews from database - currently returns empty until review system is integrated
    const reviews: any[] = [];

    // TODO: Implement actual review database queries:
    // const reviews = await reviewDatabase.getAllReviews();

    // Calculate stats
    const stats = {
      total: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length,
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