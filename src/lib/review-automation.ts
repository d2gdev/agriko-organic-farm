import { ReviewRequest, ReviewRequestStatus, REVIEW_CONFIG } from '@/types/reviews';

import { logger } from '@/lib/logger';

export interface OrderCompletionData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  productIds: number[];
  orderDate: string;
}

export class ReviewAutomationService {
  // Create a review request when an order is completed
  static async createReviewRequest(orderData: OrderCompletionData): Promise<boolean> {
    try {
      logger.info('🚀 Creating review request for order:', { orderId: orderData.orderId });

      const response = await fetch('/api/reviews/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        logger.info('✅ Review request created:', { requestId: result.data.id });
        
        // Schedule the initial review request email
        await this.scheduleReviewRequest(result.data.id);
        return true;
      } else {
        throw new Error('Failed to create review request');
      }
    } catch (error) {
      logger.error('❌ Review request creation failed:', error as Record<string, unknown>);
      return false;
    }
  }

  // Schedule a review request to be sent after a delay
  static async scheduleReviewRequest(requestId: string, delayDays: number = REVIEW_CONFIG.reminderDelayDays): Promise<void> {
    // In production, this would use a job queue system like Bull Queue, AWS SQS, or similar
    logger.info(`📅 Scheduling review request ${requestId} to be sent in ${delayDays} days`);
    
    // For demo purposes, we'll simulate scheduling
    if (typeof window !== 'undefined') {
      // Client-side simulation (not recommended for production)
      setTimeout(() => {
        this.sendScheduledRequest(requestId);
      }, delayDays * 24 * 60 * 60 * 1000); // Convert days to milliseconds
    } else {
      // Server-side: In production, you would use a proper job scheduler
      // Examples: node-cron, bull queue, AWS EventBridge, etc.
      logger.info('Server-side scheduling would be implemented here');
    }
  }

  // Send a scheduled review request
  private static async sendScheduledRequest(requestId: string): Promise<void> {
    try {
      const response = await fetch(`/api/reviews/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'send' }),
      });

      if (response.ok) {
        logger.info('✅ Scheduled review request sent:', { requestId });
        
        // Schedule reminder if configured
        if (REVIEW_CONFIG.reminderDelayDays > 0) {
          setTimeout(() => {
            this.sendReminder(requestId);
          }, REVIEW_CONFIG.reminderDelayDays * 24 * 60 * 60 * 1000);
        }
      } else {
        throw new Error('Failed to send scheduled request');
      }
    } catch (error) {
      logger.error('❌ Failed to send scheduled request:', error as Record<string, unknown>);
    }
  }

  // Send a reminder email
  private static async sendReminder(requestId: string): Promise<void> {
    try {
      const response = await fetch(`/api/reviews/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reminder' }),
      });

      if (response.ok) {
        logger.info('🔔 Review reminder sent:', { requestId });
        
        // Schedule expiration if configured
        setTimeout(() => {
          this.expireRequest(requestId);
        }, REVIEW_CONFIG.requestExpiryDays * 24 * 60 * 60 * 1000);
      }
    } catch (error) {
      logger.error('❌ Failed to send reminder:', error as Record<string, unknown>);
    }
  }

  // Expire a review request
  private static async expireRequest(requestId: string): Promise<void> {
    try {
      const response = await fetch(`/api/reviews/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'expire' }),
      });

      if (response.ok) {
        logger.info('⏰ Review request expired:', { requestId });
      }
    } catch (error) {
      logger.error('❌ Failed to expire request:', error as Record<string, unknown>);
    }
  }

  // Process completed reviews (mark request as completed)
  static async markRequestCompleted(orderId: string, reviewId: string): Promise<void> {
    try {
      logger.info('✅ Marking review request completed for order:', { orderId });
      
      // In production, find the request by orderId and mark as completed
      // This is a simplified version
      const response = await fetch('/api/reviews/requests', {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        const request = result.data?.requests?.find((r: ReviewRequest) => r.orderId === orderId);
        
        if (request) {
          await fetch(`/api/reviews/requests/${request.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'complete' }),
          });
          
          logger.info('✅ Review request marked as completed:', { requestId: request.id });
        }
      }
    } catch (error) {
      logger.error('❌ Failed to mark request completed:', error as Record<string, unknown>);
    }
  }

  // Get review request statistics
  static async getStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    completed: number;
    conversionRate: number;
  }> {
    try {
      const response = await fetch('/api/reviews/requests');
      
      if (response.ok) {
        const result = await response.json();
        const requests = result.data?.requests ?? [];
        
        const stats = {
          total: requests.length,
          pending: requests.filter((r: ReviewRequest) => r.status === ReviewRequestStatus.PENDING).length,
          sent: requests.filter((r: ReviewRequest) => [ReviewRequestStatus.SENT, ReviewRequestStatus.REMINDER_SENT].includes(r.status)).length,
          completed: requests.filter((r: ReviewRequest) => r.status === ReviewRequestStatus.COMPLETED).length,
          conversionRate: 0
        };
        
        if (stats.sent > 0) {
          stats.conversionRate = Math.round((stats.completed / stats.sent) * 100);
        }
        
        return stats;
      }
      
      throw new Error('Failed to fetch stats');
    } catch (error) {
      logger.error('❌ Failed to get review request stats:', error as Record<string, unknown>);
      return {
        total: 0,
        pending: 0,
        sent: 0,
        completed: 0,
        conversionRate: 0
      };
    }
  }

  // Generate review request URLs with unique tokens
  static generateReviewUrl(orderId: string, productId: number, token?: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://shop.agrikoph.com';
    
    const params = new URLSearchParams({
      order: orderId,
      product: productId.toString(),
      ...(token && { token })
    });

    return `${baseUrl}/review?${params.toString()}`;
  }

  // Validate review request token
  static validateReviewToken(orderId: string, token: string): boolean {
    // In production, this would validate against stored tokens
    // For now, we'll do basic validation
    return token.length > 10 && orderId.startsWith('ORD-');
  }

  // Template variables for email customization
  static getEmailTemplateVariables(orderData: OrderCompletionData): Record<string, string> {
    return {
      customerName: orderData.customerName,
      orderId: orderData.orderId,
      orderDate: new Date(orderData.orderDate).toLocaleDateString(),
      productCount: orderData.productIds.length.toString(),
      reviewUrl: this.generateReviewUrl(orderData.orderId, orderData.productIds[0] ?? 0),
      unsubscribeUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://shop.agrikoph.com'}/unsubscribe?order=${orderData.orderId}`,
      supportEmail: 'support@agrikoph.com',
      companyName: 'Agriko Organic Farm'
    };
  }
}

// Helper function to integrate with WooCommerce webhook
export async function handleOrderCompleted(orderData: Record<string, unknown>): Promise<void> {
  try {
    // Define interface for line item
    interface LineItem {
      product_id: number;
      // Add other properties as needed
    }

    interface WooCommerceOrder {
      id?: string;
      number?: string;
      billing?: {
        email?: string;
        first_name?: string;
        last_name?: string;
      };
      customer?: {
        email?: string;
      };
      line_items?: LineItem[];
      date_completed?: string;
      date_created?: string;
    }

    // Extract relevant data from WooCommerce order
    const order = orderData as WooCommerceOrder;
  
    const reviewRequestData: OrderCompletionData = {
      orderId: order.id ?? order.number ?? '',
      customerEmail: order.billing?.email ?? order.customer?.email ?? '',
      customerName: `${order.billing?.first_name ?? ''} ${order.billing?.last_name ?? ''}`.trim(),
      productIds: order.line_items?.map((item: LineItem) => item.product_id) ?? [],
      orderDate: order.date_completed ?? order.date_created ?? new Date().toISOString()
    };

    // Validate required data
    if (!reviewRequestData.orderId || !reviewRequestData.customerEmail || !reviewRequestData.productIds.length) {
      logger.warn('⚠️ Insufficient order data for review request:', { orderData: reviewRequestData });
      return;
    }

    // Create the review request
    const success = await ReviewAutomationService.createReviewRequest(reviewRequestData);
    
    if (success) {
      logger.info('🎉 Review automation initiated for order:', { orderId: reviewRequestData.orderId });
    } else {
      logger.error('💥 Review automation failed for order:', { orderId: reviewRequestData.orderId });
    }
  } catch (error) {
    logger.error('❌ Error handling order completion:', error as Record<string, unknown>);
  }
}

// Export default service
export default ReviewAutomationService;