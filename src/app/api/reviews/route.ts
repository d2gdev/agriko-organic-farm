import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { reviewDB } from '@/lib/review-database';
import { createErrorResponse, createSuccessResponse, validateRequestBody, validateQueryParams } from '@/lib/api-helpers';
import { ReviewListResponse, REVIEW_VALIDATION } from '@/types/reviews';
import { checkEndpointRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

// Validation schemas
const reviewSubmissionSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  customerName: z.string().min(REVIEW_VALIDATION.customerName.minLength).max(REVIEW_VALIDATION.customerName.maxLength),
  customerEmail: z.string().email('Invalid email format'),
  rating: z.number().int().min(REVIEW_VALIDATION.rating.min).max(REVIEW_VALIDATION.rating.max),
  title: z.string().min(REVIEW_VALIDATION.title.minLength).max(REVIEW_VALIDATION.title.maxLength),
  content: z.string().min(REVIEW_VALIDATION.content.minLength).max(REVIEW_VALIDATION.content.maxLength),
  orderId: z.string().optional(),
});

// Define the expected output type to match ReviewFilters
const reviewQuerySchema = z.object({
  productId: z.string(),
  rating: z.string().optional(),
  verified: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'helpful', 'rating_high', 'rating_low']).optional().default('newest'),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

// GET /api/reviews - Get reviews for a product
export async function GET(request: NextRequest) {
  // Rate limiting for review endpoints
  const rl = checkEndpointRateLimit(request, 'public');
  if (!rl.success) {
    return createRateLimitResponse(rl);
  }

  try {
    // Validate query parameters
    const queryValidation = validateQueryParams(request, reviewQuerySchema);
    if (!queryValidation.success) {
      return queryValidation.error;
    }

    // Transform the validated data to match ReviewFilters interface
    const { productId, rating, verified, sortBy, page, limit } = queryValidation.data;
    const filters = {
      productId: Number(productId),
      rating: rating ? Number(rating) : undefined,
      verified: verified ? verified === 'true' : undefined,
      sortBy: sortBy ?? 'newest',
      page: Number(page),
      limit: Number(limit),
    };

    logger.info('📖 Fetching reviews', {
      productId: filters.productId,
      filters: { rating: filters.rating, verified: filters.verified, sortBy: filters.sortBy },
      pagination: { page: filters.page, limit: filters.limit }
    });

    // Get reviews from database
    const result = await reviewDB.getReviewsByProduct(filters.productId, {
      rating: filters.rating,
      verified: filters.verified,
      sortBy: filters.sortBy,
      page: filters.page,
      limit: filters.limit
    });

    const response: ReviewListResponse = {
      success: true,
      data: {
        reviews: result.reviews,
        summary: result.summary,
        pagination: result.pagination
      }
    };

    return createSuccessResponse(response.data, `Retrieved ${result.reviews.length} reviews for product ${productId}`);

  } catch (error) {
    logger.error('❌ Reviews fetch error:', error as Record<string, unknown>);
    return createErrorResponse(
      'Failed to fetch reviews',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: request.nextUrl.searchParams.get('productId')
      },
      500
    );
  }
}

// POST /api/reviews - Submit a new review
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for review submissions
    const { checkEndpointRateLimit } = await import('@/lib/rate-limit');
    const rateLimitCheck = checkEndpointRateLimit(request, 'public');
    
    if (!rateLimitCheck.success) {
      return createErrorResponse('Rate limit exceeded. Please wait before submitting another review.', {}, 429);
    }
    
    // Validate request body
    const bodyValidation = await validateRequestBody(request, reviewSubmissionSchema);
    if (!bodyValidation.success) {
      return bodyValidation.error;
    }

    const submission = bodyValidation.data;

    logger.info('📝 Submitting new review', {
      productId: submission.productId,
      rating: submission.rating,
      customerName: submission.customerName,
      hasOrderId: !!submission.orderId
    });

    // Create review in database
    const newReview = await reviewDB.createReview(submission);

    logger.info('✅ Review submitted successfully', {
      reviewId: newReview.id,
      productId: newReview.productId,
      status: newReview.status,
      verified: newReview.verified
    });

    return createSuccessResponse(
      {
        review: {
          id: newReview.id,
          productId: newReview.productId,
          rating: newReview.rating,
          title: newReview.title,
          status: newReview.status,
          verified: newReview.verified,
          createdAt: newReview.createdAt
        }
      },
      'Review submitted successfully and is pending moderation'
    );

  } catch (error) {
    logger.error('❌ Review submission error:', error as Record<string, unknown>);
    return createErrorResponse(
      'Failed to submit review',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

// Additional API endpoints for review management

// PUT /api/reviews - Update review status (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting for admin operations
    const { checkEndpointRateLimit } = await import('@/lib/rate-limit');
    const rateLimitCheck = checkEndpointRateLimit(request, 'admin');
    
    if (!rateLimitCheck.success) {
      return createRateLimitResponse(rateLimitCheck);
    }
    
    // Check admin authentication
    const { validateAdminAuth } = await import('@/lib/admin-auth');
    const adminCheck = await validateAdminAuth(request);
    
    if (!adminCheck.success) {
      return createErrorResponse('Admin authentication required', {}, 401);
    }
    
    const body = await request.json();
    const { reviewId, status } = body;

    if (!reviewId || !status) {
      return createErrorResponse('Review ID and status are required', {}, 400);
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return createErrorResponse('Invalid status. Must be: pending, approved, or rejected', {}, 400);
    }

    const updated = await reviewDB.updateReviewStatus(reviewId, status);
    
    if (!updated) {
      return createErrorResponse('Review not found', { reviewId }, 404);
    }

    logger.info('✅ Review status updated', { reviewId, newStatus: status });

    return createSuccessResponse(
      { reviewId, status },
      `Review status updated to ${status}`
    );

  } catch (error) {
    logger.error('❌ Review status update error:', error as Record<string, unknown>);
    return createErrorResponse(
      'Failed to update review status',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
}

