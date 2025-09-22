import { logger } from '@/lib/logger';
import { productCacheSafe, apiCacheSafe } from '@/lib/thread-safe-cache';
import { Review, ReviewSubmission, ReviewFilters, ReviewSummary, ReviewStatus } from '@/types/reviews';
import { sanitizeStringParam } from '@/lib/api-helpers';
// import * as nodemailer from 'nodemailer'; // Reverted due to import issues
// import { APP_CONSTANTS } from '@/lib/unified-config'; // Reverted due to import issues
// import { config } from '@/lib/unified-config'; // Preserved for future database configuration

// Review database interface using WooCommerce products and custom meta
export class ReviewDatabase {
  private static instance: ReviewDatabase;

  static getInstance(): ReviewDatabase {
    if (!ReviewDatabase.instance) {
      ReviewDatabase.instance = new ReviewDatabase();
    }
    return ReviewDatabase.instance;
  }

  // Since WooCommerce doesn't have built-in reviews API in the way we need,
  // we'll simulate a database using cache storage with persistence
  
  async createReview(submission: ReviewSubmission): Promise<Review> {
    try {
      const reviewId = this.generateReviewId();
      
      const review: Review = {
        id: reviewId,
        productId: submission.productId,
        customerName: this.sanitizeName(submission.customerName),
        customerEmail: this.sanitizeEmail(submission.customerEmail),
        rating: submission.rating,
        title: this.sanitizeText(submission.title),
        content: this.sanitizeText(submission.content),
        verified: await this.isVerifiedPurchase(submission.customerEmail, submission.productId, submission.orderId),
        helpful: 0,
        status: ReviewStatus.PENDING, // All new reviews start as pending for moderation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in cache with long TTL (simulate database)
      await this.storeReview(review);
      
      // Update product review summary
      await this.updateProductSummary(review.productId);
      
      // Send notification for moderation
      await this.sendModerationNotification(review);
      
      logger.info('✅ Review created successfully', {
        reviewId: review.id,
        productId: review.productId,
        rating: review.rating,
        verified: review.verified
      });
      
      return review;
    } catch (error) {
      logger.error('❌ Failed to create review:', error as Record<string, unknown>);
      throw new Error('Failed to save review to database');
    }
  }

  async getReviewsByProduct(productId: number, filters: ReviewFilters): Promise<{
    reviews: Review[];
    summary: ReviewSummary;
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    try {
      const cacheKey = `product_reviews_${productId}`;
      let allReviews = await productCacheSafe.get(cacheKey) as Review[] | null;
      
      if (!allReviews) {
        // If no cached reviews, try to load from persistent storage
        allReviews = await this.loadProductReviews(productId);
        
        if (allReviews.length === 0) {
          // Generate some initial reviews for demonstration
          allReviews = await this.generateInitialReviews(productId);
        }
        
        // Cache for future requests
        await productCacheSafe.set(cacheKey, allReviews, 30 * 60 * 1000); // 30 minutes
      }

      // Apply filters
      let filteredReviews = this.applyFilters(allReviews, filters);
      
      // Apply sorting
      filteredReviews = this.sortReviews(filteredReviews, filters.sortBy ?? 'newest');
      
      // Apply pagination
      const { page = 1, limit = 10 } = filters;
      const startIndex = (page - 1) * limit;
      const paginatedReviews = filteredReviews.slice(startIndex, startIndex + limit);
      
      // Generate summary
      const summary = this.generateSummary(productId, allReviews);
      
      return {
        reviews: paginatedReviews,
        summary,
        pagination: {
          page,
          limit,
          total: filteredReviews.length,
          pages: Math.ceil(filteredReviews.length / limit)
        }
      };
    } catch (error) {
      logger.error('❌ Failed to get reviews:', error as Record<string, unknown>);
      throw new Error('Failed to retrieve reviews');
    }
  }

  async getReviewById(reviewId: string): Promise<Review | null> {
    try {
      const cacheKey = `review_${reviewId}`;
      const cached = await apiCacheSafe.get(cacheKey) as Review | null;
      
      if (cached) {
        return cached;
      }
      
      // Search across all product review caches
      const allReviewKeys = await this.getAllReviewCacheKeys();
      
      for (const key of allReviewKeys) {
        const reviews = await productCacheSafe.get(key) as Review[] | null;
        if (reviews) {
          const review = reviews.find(r => r.id === reviewId);
          if (review) {
            await apiCacheSafe.set(cacheKey, review, 15 * 60 * 1000); // 15 minutes
            return review;
          }
        }
      }
      
      return null;
    } catch (error) {
      logger.error('❌ Failed to get review by ID:', error as Record<string, unknown>);
      return null;
    }
  }

  async updateReviewStatus(reviewId: string, status: Review['status']): Promise<boolean> {
    try {
      const review = await this.getReviewById(reviewId);
      if (!review) {
        return false;
      }
      
      review.status = status;
      review.updatedAt = new Date().toISOString();
      
      // Update in storage
      await this.storeReview(review);
      
      // Update product summary if approved/rejected
      await this.updateProductSummary(review.productId);
      
      logger.info('✅ Review status updated', {
        reviewId,
        newStatus: status,
        productId: review.productId
      });
      
      return true;
    } catch (error) {
      logger.error('❌ Failed to update review status:', error as Record<string, unknown>);
      return false;
    }
  }

  async markReviewHelpful(reviewId: string): Promise<boolean> {
    try {
      const review = await this.getReviewById(reviewId);
      if (!review) {
        return false;
      }
      
      review.helpful++;
      review.updatedAt = new Date().toISOString();
      
      await this.storeReview(review);
      
      return true;
    } catch (error) {
      logger.error('❌ Failed to mark review helpful:', error as Record<string, unknown>);
      return false;
    }
  }

  // Private helper methods
  private async storeReview(review: Review): Promise<void> {
    // Store individual review
    const reviewCacheKey = `review_${review.id}`;
    await apiCacheSafe.set(reviewCacheKey, review, 24 * 60 * 60 * 1000); // 24 hours
    
    // Update product reviews list
    const productCacheKey = `product_reviews_${review.productId}`;
    let productReviews = await productCacheSafe.get(productCacheKey) as Review[] | null;
    
    if (!productReviews) {
      productReviews = [];
    }
    
    // Remove existing review if updating
    productReviews = productReviews.filter(r => r.id !== review.id);
    
    // Add updated review
    productReviews.push(review);
    
    // Sort by creation date (newest first)
    productReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Store updated list
    await productCacheSafe.set(productCacheKey, productReviews, 60 * 60 * 1000); // 1 hour
  }

  private async loadProductReviews(_productId: number): Promise<Review[]> {
    // In a real implementation, this would load from a database
    // For now, we'll return empty array and let initial reviews be generated
    return [];
  }

  private async generateInitialReviews(productId: number): Promise<Review[]> {
    // Generate 3-7 initial reviews for new products to bootstrap the system
    const reviewCount = Math.floor(Math.random() * 5) + 3;
    const reviews: Review[] = [];
    
    const sampleReviews = [
      {
        customerName: 'Maria Santos',
        rating: 5,
        title: 'Excellent organic quality!',
        content: 'This product exceeded my expectations. The quality is outstanding and you can really taste the difference from regular products.',
      },
      {
        customerName: 'John Rodriguez',
        rating: 4,
        title: 'Great product, fast shipping',
        content: 'Very satisfied with the quality and the quick delivery. Will definitely order again.',
      },
      {
        customerName: 'Ana Dela Cruz',
        rating: 5,
        title: 'Healthy and delicious',
        content: 'Perfect for our family. The health benefits are noticeable and the taste is amazing.',
      },
      {
        customerName: 'Roberto Garcia',
        rating: 4,
        title: 'Worth the investment',
        content: 'Initially hesitant about the price, but the quality justifies the cost. Highly recommended.',
      },
      {
        customerName: 'Lisa Chen',
        rating: 3,
        title: 'Good but not exceptional',
        content: 'The product is decent but I expected more given the organic certification and price point.',
      }
    ];
    
    for (let i = 0; i < reviewCount; i++) {
      const sample = sampleReviews[i % sampleReviews.length];
      if (!sample) continue; // Skip if sample is undefined
      const daysAgo = Math.floor(Math.random() * 90) + 1; // 1-90 days ago
      
      const review: Review = {
        id: this.generateReviewId(),
        productId,
        customerName: `${sample.customerName} ${String.fromCharCode(65 + i)}`,
        customerEmail: `${sample.customerName.toLowerCase().replace(' ', '.')}${i}@example.com`,
        rating: sample.rating,
        title: sample.title,
        content: sample.content,
        verified: Math.random() > 0.3, // 70% verified
        helpful: Math.floor(Math.random() * 8),
        status: ReviewStatus.APPROVED,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
      };
      
      reviews.push(review);
    }
    
    return reviews;
  }

  private applyFilters(reviews: Review[], filters: ReviewFilters): Review[] {
    let filtered = [...reviews];
    
    // Filter by status (only show approved reviews by default)
    filtered = filtered.filter(r => r.status === 'approved');
    
    if (filters.rating) {
      filtered = filtered.filter(r => r.rating === filters.rating);
    }
    
    if (filters.verified !== undefined) {
      filtered = filtered.filter(r => r.verified === filters.verified);
    }
    
    return filtered;
  }

  private sortReviews(reviews: Review[], sortBy: ReviewFilters['sortBy']): Review[] {
    const sorted = [...reviews];
    
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'helpful':
        return sorted.sort((a, b) => b.helpful - a.helpful);
      case 'rating_high':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'rating_low':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  private generateSummary(productId: number, reviews: Review[]): ReviewSummary {
    const approvedReviews = reviews.filter(r => r.status === 'approved');
    const totalReviews = approvedReviews.length;
    
    if (totalReviews === 0) {
      return {
        productId,
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedPercentage: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    const averageRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const verifiedCount = approvedReviews.filter(r => r.verified).length;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approvedReviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });
    
    return {
      productId,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      verifiedPercentage: Math.round((verifiedCount / totalReviews) * 100),
      lastUpdated: new Date().toISOString()
    };
  }

  private async updateProductSummary(productId: number): Promise<void> {
    // Invalidate cache to force regeneration of summary
    const cacheKey = `product_reviews_${productId}`;
    await productCacheSafe.delete(cacheKey);
  }

  private async isVerifiedPurchase(email: string, productId: number, orderId?: string): Promise<boolean> {
    // In a real implementation, this would check WooCommerce orders
    // For now, we'll use order ID presence and some heuristics
    if (orderId && orderId.length > 5) {
      return true;
    }
    
    // Random verification for demonstration (70% chance)
    return Math.random() > 0.3;
  }

  private generateReviewId(): string {
    return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeName(name: string): string {
    const sanitized = sanitizeStringParam(name, 'customerName', { maxLength: 100, required: true });
    return sanitized.success ? sanitized.value : 'Anonymous';
  }

  private sanitizeEmail(email: string): string {
    const sanitized = sanitizeStringParam(email, 'email', { maxLength: 255, required: true });
    if (!sanitized.success) return 'anonymous@example.com';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized.value) ? sanitized.value : 'anonymous@example.com';
  }

  private sanitizeText(text: string): string {
    const sanitized = sanitizeStringParam(text, 'text', { maxLength: 2000, required: true });
    return sanitized.success ? sanitized.value : '';
  }

  private async sendModerationNotification(review: Review): Promise<void> {
    logger.info('📧 Review moderation notification', {
      reviewId: review.id,
      productId: review.productId,
      customerName: review.customerName,
      rating: review.rating,
      needsModeration: review.status === 'pending'
    });
    
    // TODO: Enable email notifications when nodemailer is properly configured
    // await this.sendModerationEmail(review);
  }

  // Email method removed due to import issues - needs proper nodemailer configuration

  private async getAllReviewCacheKeys(): Promise<string[]> {
    const allKeys = await productCacheSafe.getAllKeys();
    return allKeys.filter(key => key.startsWith('product_reviews_'));
  }
}

// Singleton instance
export const reviewDB = ReviewDatabase.getInstance();