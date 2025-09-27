import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AdminAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';
import { reviewDB } from '@/lib/review-database';
import { ReviewStatus } from '@/types/reviews';

// GET /api/admin/reviews - Get all reviews for admin dashboard
async function handleGetReviews(request: NextRequest, authResult: AdminAuthResult): Promise<Response> {
  try {
    logger.info(`Admin ${authResult.userId} accessing reviews dashboard`,
      undefined, 'admin-reviews');

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ReviewStatus | null;
    const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined;
    const maxRating = searchParams.get('maxRating') ? parseInt(searchParams.get('maxRating')!) : undefined;
    const verified = searchParams.get('verified') === 'true' ? true :
                    searchParams.get('verified') === 'false' ? false : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Fetch reviews from database with filters
    const reviews = await reviewDB.getAllReviews({
      status: status || undefined,
      minRating,
      maxRating,
      verified,
      limit,
      offset
    });

    // Calculate stats
    const allReviews = await reviewDB.getAllReviews(); // Get all for stats
    const stats = {
      total: allReviews.length,
      pending: allReviews.filter(r => r.status === ReviewStatus.PENDING).length,
      approved: allReviews.filter(r => r.status === ReviewStatus.APPROVED).length,
      rejected: allReviews.filter(r => r.status === ReviewStatus.REJECTED).length,
      averageRating: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0
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