// Review system type definitions

export interface Review {
  id: string;
  productId: number;
  userId?: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5 stars
  title: string;
  content: string;
  images?: ReviewImage[];
  verified: boolean; // Verified purchase
  helpful: number; // Helpful votes count
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
  moderationNotes?: string;
}

export interface ReviewImage {
  id: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SPAM = 'spam'
}

export interface ReviewSubmission {
  productId: number;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  content: string;
  images?: File[];
  orderId?: string; // For verification
}

export interface ReviewSummary {
  productId: number;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPercentage: number;
  lastUpdated: string;
}

export interface ReviewFilters {
  rating?: number;
  verified?: boolean;
  status?: ReviewStatus;
  sortBy?: 'newest' | 'oldest' | 'helpful' | 'rating_high' | 'rating_low';
  page?: number;
  limit?: number;
}

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  reviewsThisMonth: number;
  reviewsLastMonth: number;
  growthRate: number;
  sentimentScore: number;
  topKeywords: Array<{ word: string; count: number; sentiment: 'positive' | 'negative' | 'neutral' }>;
  ratingTrends: Array<{ date: string; averageRating: number; count: number }>;
  productPerformance: Array<{
    productId: number;
    productName: string;
    averageRating: number;
    reviewCount: number;
    verifiedPercentage: number;
  }>;
  moderationMetrics?: {
    pendingReviews: number;
    approvalRate: number;
    averageModerationTime: number;
    spamDetectionRate: number;
  };
  customerInsights?: {
    repeatReviewers: number;
    averageWordsPerReview: number;
    imageUploadRate: number;
    verificationRate: number;
  };
  businessMetrics?: {
    reviewImpactOnSales: number;
    averageTimeToReview: number;
    reviewResponseRate: number;
    customerSatisfactionScore: number;
  };
  contentAnalysis?: {
    commonPhrases: Array<{ phrase: string; count: number; sentiment: 'positive' | 'negative' | 'neutral' }>;
    topCompliments: string[];
    topComplaints: string[];
    languageDistribution: Record<string, number>;
  };
}

export interface ReviewModerationAction {
  reviewId: string;
  action: 'approve' | 'reject' | 'spam';
  reason?: string;
  notes?: string;
  moderatorId: string;
}

export interface ReviewHelpfulness {
  reviewId: string;
  userId?: string;
  helpful: boolean; // true for helpful, false for not helpful
  ipAddress: string;
  createdAt: string;
}

// Review request system types
export interface ReviewRequest {
  id: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  productIds: number[];
  status: ReviewRequestStatus;
  sentAt?: string;
  reminderSentAt?: string;
  completedAt?: string;
  createdAt: string;
}

export enum ReviewRequestStatus {
  PENDING = 'pending',
  SENT = 'sent',
  REMINDER_SENT = 'reminder_sent',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

export interface ReviewRequestTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: 'initial' | 'reminder';
  active: boolean;
  variables: string[]; // Available template variables
}

// Review response types for API
export interface ReviewResponse {
  success: boolean;
  data?: Review;
  error?: string;
  message?: string;
}

export interface ReviewListResponse {
  success: boolean;
  data?: {
    reviews: Review[];
    summary: ReviewSummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
}

export interface ReviewAnalyticsResponse {
  success: boolean;
  data?: ReviewAnalytics;
  error?: string;
}

// Review validation rules
export const REVIEW_VALIDATION = {
  rating: { min: 1, max: 5 },
  title: { minLength: 5, maxLength: 100 },
  content: { minLength: 10, maxLength: 2000 },
  customerName: { minLength: 2, maxLength: 50 },
  images: { maxCount: 5, maxSize: 5 * 1024 * 1024 }, // 5MB per image
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Review system configuration
export const REVIEW_CONFIG = {
  autoApprove: false, // Auto-approve verified purchases
  moderationRequired: true,
  allowGuestReviews: true,
  requireOrderVerification: false,
  enableImages: true,
  enableHelpfulness: true,
  maxImagesPerReview: 5,
  reminderDelayDays: 14,
  requestExpiryDays: 60,
  minRatingForDisplay: 1,
  featuredReviewMinRating: 4
};

export interface ReviewMetricsFilter {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  productId?: number;
  rating?: number;
  verified?: boolean;
  status?: ReviewStatus;
}

// SEO-related review types
export interface ReviewStructuredData {
  '@context': 'URL_CONSTANTS.SCHEMA.BASE';
  '@type': 'Review';
  author: {
    '@type': 'Person';
    name: string;
  };
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating: 5;
    worstRating: 1;
  };
  reviewBody: string;
  datePublished: string;
  publisher?: {
    '@type': 'Organization';
    name: string;
  };
}

export interface AggregateRatingStructuredData {
  '@context': 'URL_CONSTANTS.SCHEMA.BASE';
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating: 5;
  worstRating: 1;
}