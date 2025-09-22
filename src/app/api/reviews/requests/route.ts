import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { ReviewRequest, ReviewRequestStatus } from '@/types/reviews';

// GET /api/reviews/requests - Get all review requests (admin only)
export async function GET(request: NextRequest) {
  try {
    // In production, verify admin authentication
    // if (!isAdmin(request)) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ReviewRequestStatus;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // TODO: Fetch actual review requests from database
    // const requests = await reviewRequestsDatabase.getAllRequests();
    const mockRequests: ReviewRequest[] = [];

    // Apply filters
    let filteredRequests = mockRequests;
    if (status) {
      filteredRequests = mockRequests.filter(r => r.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        requests: paginatedRequests,
        pagination: {
          page,
          limit,
          total: filteredRequests.length,
          pages: Math.ceil(filteredRequests.length / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Review requests fetch error:', error as Record<string, unknown>);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch review requests' },
      { status: 500 }
    );
  }
}

// POST /api/reviews/requests - Create review request (triggered by order completion)
export async function POST(request: NextRequest) {
  try {
    const { orderId, customerEmail, customerName, productIds } = await request.json();

    if (!orderId || !customerEmail || !customerName || !Array.isArray(productIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create review request
    const reviewRequest: ReviewRequest = {
      id: generateRequestId(),
      orderId,
      customerEmail,
      customerName,
      productIds,
      status: ReviewRequestStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    // In production, this would:
    // 1. Save to database
    // 2. Schedule email to be sent after delay
    // 3. Set up reminder scheduling

    logger.info('📧 Review request created:', reviewRequest as unknown as Record<string, unknown>);

    // Simulate sending initial email
    await sendReviewRequestEmail(reviewRequest);

    return NextResponse.json({
      success: true,
      data: reviewRequest,
      message: 'Review request created successfully'
    });

  } catch (error) {
    logger.error('Review request creation error:', error as Record<string, unknown>);
    return NextResponse.json(
      { success: false, error: 'Failed to create review request' },
      { status: 500 }
    );
  }
}

// Generate mock review requests for development
function _generateMockReviewRequests(): ReviewRequest[] {
  const requests: ReviewRequest[] = [];
  const currentTime = new Date();

  const mockData = [
    {
      orderId: 'ORD-2024-001',
      customerEmail: 'john.doe@email.com',
      customerName: 'John Doe',
      productIds: [123, 124],
      status: ReviewRequestStatus.PENDING,
      daysAgo: 1
    },
    {
      orderId: 'ORD-2024-002',
      customerEmail: 'maria.garcia@email.com',
      customerName: 'Maria Garcia',
      productIds: [125],
      status: ReviewRequestStatus.SENT,
      daysAgo: 5,
      sentDaysAgo: 3
    },
    {
      orderId: 'ORD-2024-003',
      customerEmail: 'david.wilson@email.com',
      customerName: 'David Wilson',
      productIds: [126, 127, 128],
      status: ReviewRequestStatus.COMPLETED,
      daysAgo: 15,
      sentDaysAgo: 12,
      completedDaysAgo: 8
    },
    {
      orderId: 'ORD-2024-004',
      customerEmail: 'sarah.johnson@email.com',
      customerName: 'Sarah Johnson',
      productIds: [129],
      status: ReviewRequestStatus.REMINDER_SENT,
      daysAgo: 20,
      sentDaysAgo: 17,
      reminderDaysAgo: 3
    },
    {
      orderId: 'ORD-2024-005',
      customerEmail: 'old.customer@email.com',
      customerName: 'Old Customer',
      productIds: [130, 131],
      status: ReviewRequestStatus.EXPIRED,
      daysAgo: 70
    }
  ];

  mockData.forEach((mock, index) => {
    const createdAt = new Date(currentTime.getTime() - mock.daysAgo * 24 * 60 * 60 * 1000);
    
    const request: ReviewRequest = {
      id: `req_${index + 1}`,
      orderId: mock.orderId,
      customerEmail: mock.customerEmail,
      customerName: mock.customerName,
      productIds: mock.productIds,
      status: mock.status,
      createdAt: createdAt.toISOString()
    };

    if (mock.sentDaysAgo !== undefined) {
      request.sentAt = new Date(currentTime.getTime() - mock.sentDaysAgo * 24 * 60 * 60 * 1000).toISOString();
    }

    if (mock.reminderDaysAgo !== undefined) {
      request.reminderSentAt = new Date(currentTime.getTime() - mock.reminderDaysAgo * 24 * 60 * 60 * 1000).toISOString();
    }

    if (mock.completedDaysAgo !== undefined) {
      request.completedAt = new Date(currentTime.getTime() - mock.completedDaysAgo * 24 * 60 * 60 * 1000).toISOString();
    }

    requests.push(request);
  });

  return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function sendReviewRequestEmail(reviewRequest: ReviewRequest): Promise<void> {
  // In production, this would integrate with email service (SendGrid, AWS SES, etc.)
  logger.info('📧 Sending review request email:', {
    to: reviewRequest.customerEmail,
    customerName: reviewRequest.customerName,
    orderId: reviewRequest.orderId,
    productCount: reviewRequest.productIds.length,
    timestamp: new Date().toISOString()
  });

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
}