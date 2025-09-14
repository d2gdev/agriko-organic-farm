import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AdminAuthResult } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

// GET /api/admin/reviews - Get all reviews for admin dashboard
async function handleGetReviews(request: NextRequest, authResult: AdminAuthResult): Promise<Response> {
  try {
    logger.info(`Admin ${authResult.userId} accessing reviews dashboard`, 
      undefined, 'admin-reviews');

    // Mock data - in production, fetch from database
    const reviews = [
      {
        id: 'rev_001',
        productId: 123,
        productName: 'Organic Turmeric Powder',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        rating: 5,
        title: 'Excellent quality!',
        content: 'This turmeric powder is amazing. Great quality and fast shipping.',
        status: 'approved',
        verified: true,
        helpful: 12,
        createdAt: '2024-01-15T10:30:00Z',
        moderatedAt: '2024-01-15T14:20:00Z',
        moderatedBy: authResult.userId
      },
      {
        id: 'rev_002',
        productId: 124,
        productName: 'Black Rice',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        rating: 4,
        title: 'Good product',
        content: 'Nice black rice, though delivery took a bit longer than expected.',
        status: 'pending',
        verified: true,
        helpful: 3,
        createdAt: '2024-01-16T09:15:00Z'
      }
    ];

    // Calculate stats
    const stats = {
      total: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length,
      averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
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