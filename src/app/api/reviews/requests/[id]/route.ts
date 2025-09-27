import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { ReviewRequestStatus } from '@/types/reviews';

// PUT /api/reviews/requests/[id] - Update review request status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const { action } = await request.json();

    if (!['send', 'reminder', 'complete', 'expire'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // In production, this would update the database
    let newStatus: ReviewRequestStatus | undefined;
    const updateFields: Record<string, string> = {};

    switch (action) {
      case 'send':
        newStatus = ReviewRequestStatus.SENT;
        updateFields.sentAt = new Date().toISOString();
        await sendReviewRequestEmail(requestId);
        break;
      case 'reminder':
        newStatus = ReviewRequestStatus.REMINDER_SENT;
        updateFields.reminderSentAt = new Date().toISOString();
        await sendReminderEmail(requestId);
        break;
      case 'complete':
        newStatus = ReviewRequestStatus.COMPLETED;
        updateFields.completedAt = new Date().toISOString();
        break;
      case 'expire':
        newStatus = ReviewRequestStatus.EXPIRED;
        break;
    }

    // Check if newStatus was assigned
    if (newStatus === undefined) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    logger.info('🔄 Review request updated:', {
      requestId,
      action,
      newStatus,
      updateFields,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        status: newStatus,
        ...updateFields
      },
      message: `Review request ${action}ed successfully`
    });

  } catch (error) {
    logger.error('Review request update error:', error as Record<string, unknown>);
    return NextResponse.json(
      { success: false, error: 'Failed to update review request' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/requests/[id] - Cancel review request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

    // In production, this would soft delete from database
    logger.info('🗑️ Review request cancelled:', {
      requestId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Review request cancelled successfully'
    });

  } catch (error) {
    logger.error('Review request cancellation error:', error as Record<string, unknown>);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel review request' },
      { status: 500 }
    );
  }
}

async function sendReviewRequestEmail(requestId: string): Promise<void> {
  // In production, this would send actual email
  logger.info('📧 Sending initial review request email for:', { requestId });
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function sendReminderEmail(requestId: string): Promise<void> {
  // In production, this would send reminder email
  logger.info('🔔 Sending review reminder email for:', { requestId });
  await new Promise(resolve => setTimeout(resolve, 100));
}