'use client';

import { useState, lazy, Suspense } from 'react';
import { ReviewsList } from '@/components/ReviewsList';
import { ReviewSubmission } from '@/types/reviews';

// Lazy load ReviewForm since it's only used when user wants to write a review
const ReviewForm = lazy(() => import('@/components/ReviewForm').then(module => ({ default: module.ReviewForm })));

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleReviewSubmit = (_review: ReviewSubmission) => {
    setReviewSubmitted(true);
    setShowReviewForm(false);
    
    // Refresh the reviews list (this will be handled by the ReviewsList component internally)
    // In a real app, you might want to refresh the entire reviews data
  };

  const handleWriteReview = () => {
    setShowReviewForm(true);
  };

  const handleCloseReviewForm = () => {
    setShowReviewForm(false);
  };

  if (showReviewForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
          <button
            onClick={handleCloseReviewForm}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        }>
          <ReviewForm
            productId={productId}
            productName={productName}
            onSubmit={handleReviewSubmit}
            onClose={handleCloseReviewForm}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Write Review Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <button
          onClick={handleWriteReview}
          className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Write a Review
        </button>
      </div>

      {/* Success Message */}
      {reviewSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="text-green-800 font-medium">Review Submitted Successfully!</h3>
              <p className="text-green-700 text-sm mt-1">
                Your review has been submitted and is pending moderation. Thank you for your feedback!
              </p>
            </div>
            <button
              onClick={() => setReviewSubmitted(false)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <ReviewsList productId={productId} />
    </div>
  );
}