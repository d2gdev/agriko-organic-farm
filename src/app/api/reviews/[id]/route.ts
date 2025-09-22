import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { reviewDB } from '@/lib/review-database';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/reviews/[id] - Get a specific review
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: reviewId } = await params;

    if (!reviewId) {
      return createErrorResponse('Review ID is required', {}, 400);
    }

    logger.info('📖 Fetching individual review', { reviewId });

    const review = await reviewDB.getReviewById(reviewId);

    if (!review) {
      return createErrorResponse('Review not found', { reviewId }, 404);
    }

    // Only return approved reviews to public
    if (review.status !== 'approved') {
      return createErrorResponse('Review not available', { reviewId }, 404);
    }

    return createSuccessResponse(
      { review },
      'Review retrieved successfully'
    );

  } catch (error) {
    logger.error('❌ Individual review fetch error:', error as Record<string, unknown>);
    const { id: reviewId } = await params;
    return createErrorResponse(
      'Failed to fetch review',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reviewId
      },
      500
    );
  }
}

// PATCH /api/reviews/[id] - Mark review as helpful
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: reviewId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!reviewId) {
      return createErrorResponse('Review ID is required', {}, 400);
    }

    if (action !== 'helpful') {
      return createErrorResponse('Invalid action. Only "helpful" is supported', { action }, 400);
    }

    logger.info('👍 Marking review as helpful', { reviewId });

    const updated = await reviewDB.markReviewHelpful(reviewId);

    if (!updated) {
      return createErrorResponse('Review not found', { reviewId }, 404);
    }

    return createSuccessResponse(
      { reviewId, action: 'helpful' },
      'Review marked as helpful'
    );

  } catch (error) {
    logger.error('❌ Review helpful update error:', error as Record<string, unknown>);
    const { id: reviewId } = await params;
    return createErrorResponse(
      'Failed to update review',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reviewId
      },
      500
    );
  }
}
