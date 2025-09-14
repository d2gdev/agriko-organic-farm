'use client';

import { ReviewSummary as ReviewSummaryType } from '@/types/reviews';
import { StarRating } from './StarRating';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  onFilterByRating?: (rating: number) => void;
}

export function ReviewSummary({ summary, onFilterByRating }: ReviewSummaryProps) {
  const { totalReviews, averageRating, ratingDistribution, verifiedPercentage } = summary;

  const ratingPercentages = Object.entries(ratingDistribution).map(([rating, count]) => ({
    rating: parseInt(rating),
    count,
    percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
  })).reverse(); // Show 5 stars first

  const handleRatingBarClick = (rating: number) => {
    onFilterByRating?.(rating);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Overall Rating */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={averageRating} size="lg" />
            <div className="text-sm text-gray-600 mt-2">
              Based on {totalReviews.toLocaleString()} review{totalReviews !== 1 ? 's' : ''}
            </div>
            {verifiedPercentage > 0 && (
              <div className="text-sm text-green-600 mt-1">
                {verifiedPercentage}% verified purchases
              </div>
            )}
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-2">
          {ratingPercentages.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center space-x-3">
              <button
                onClick={() => handleRatingBarClick(rating)}
                className="flex items-center space-x-2 hover:text-primary-600 transition-colors cursor-pointer min-w-0 flex-1 text-left"
                aria-label={`Filter by ${rating} star reviews`}
              >
                <span className="text-sm font-medium text-gray-700 w-6">
                  {rating}
                </span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-10 text-right">
                  {percentage}%
                </span>
                <span className="text-sm text-gray-500 w-8 text-right">
                  ({count})
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {totalReviews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-green-600">
              {ratingDistribution[5] || 0}
            </div>
            <div className="text-sm text-gray-600">5-Star Reviews</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {verifiedPercentage}%
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {averageRating >= 4.0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V9a2 2 0 00-2-2V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1a2 2 0 00-2 2v1m7-10h2m-7 10h2m5 10l3-3m-3 3l-3-3" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              {Math.round(((ratingDistribution[4] || 0) + (ratingDistribution[5] || 0)) / totalReviews * 100)}% of customers recommend this product
            </span>
          </div>
        </div>
      )}
    </div>
  );
}