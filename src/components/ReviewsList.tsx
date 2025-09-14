'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

import { Review, ReviewFilters, ReviewListResponse } from '@/types/reviews';
import { ReviewCard } from './ReviewCard';
import { ReviewSummary } from './ReviewSummary';

interface ReviewsListProps {
  productId: number;
  initialReviews?: ReviewListResponse;
}

export function ReviewsList({ productId, initialReviews }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews?.data?.reviews ?? []);
  const [summary, setSummary] = useState(initialReviews?.data?.summary);
  const [pagination, setPagination] = useState(initialReviews?.data?.pagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ReviewFilters>({
    page: 1,
    limit: 10,
    sortBy: 'newest'
  });

  const fetchReviews = useCallback(async (newFilters: ReviewFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        productId: productId.toString(),
        page: (newFilters.page ?? 1).toString(),
        limit: (newFilters.limit ?? 10).toString(),
        sortBy: newFilters.sortBy ?? 'newest'
      });

      if (newFilters.rating) {
        params.append('rating', newFilters.rating.toString());
      }

      if (newFilters.verified !== undefined) {
        params.append('verified', newFilters.verified.toString());
      }

      const response = await fetch(`/api/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const result: ReviewListResponse = await response.json();
      
      if (result.success && result.data) {
        setReviews(result.data.reviews);
        setSummary(result.data.summary);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.error ?? 'Failed to fetch reviews');
      }
    } catch (error) {
      logger.error('Error fetching reviews:', error as Record<string, unknown>);
      setError(error instanceof Error ? error.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!initialReviews) {
      fetchReviews(filters);
    }
  }, [fetchReviews, filters, initialReviews]);

  const handleFilterChange = (newFilters: Partial<ReviewFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchReviews(updatedFilters);
  };

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    fetchReviews(updatedFilters);
  };

  const handleSortChange = (sortBy: ReviewFilters['sortBy']) => {
    handleFilterChange({ sortBy });
  };

  const handleRatingFilter = (rating: number) => {
    if (filters.rating === rating) {
      // Remove filter if clicking the same rating
      const { rating: _, ...newFilters } = filters;
      setFilters(newFilters);
      fetchReviews(newFilters);
    } else {
      handleFilterChange({ rating });
    }
  };

  const handleVerifiedFilter = () => {
    const verified = filters.verified === true ? undefined : true;
    handleFilterChange({ verified });
  };

  const handleHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ helpful }),
      });

      if (response.ok) {
        // Update the review in the local state
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review.id === reviewId
              ? { ...review, helpful: review.helpful + (helpful ? 1 : -1) }
              : review
          )
        );
      }
    } catch (error) {
      logger.error('Error updating helpful status:', error as Record<string, unknown>);
    }
  };

  if (error && !reviews.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Unable to load reviews</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchReviews(filters)}
          className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <ReviewSummary 
          summary={summary} 
          onFilterByRating={handleRatingFilter}
        />
      )}

      {/* Filters and Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                id="sort"
                value={filters.sortBy ?? 'newest'}
                onChange={(e) => handleSortChange(e.target.value as ReviewFilters['sortBy'])}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="helpful">Most Helpful</option>
                <option value="rating_high">Highest Rating</option>
                <option value="rating_low">Lowest Rating</option>
              </select>
            </div>

            {/* Verified Filter */}
            <button
              onClick={handleVerifiedFilter}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                filters.verified
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {filters.verified ? '✓ ' : ''}Verified Only
            </button>

            {/* Rating Filter */}
            {filters.rating && (
              <button
                onClick={() => handleRatingFilter(filters.rating ?? 0)}
                className="text-sm px-3 py-1 rounded-full bg-primary-100 text-primary-800 border border-primary-300 hover:bg-primary-200 transition-colors"
              >
                ✓ {filters.rating} Stars
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {pagination && `${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} reviews`}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="w-4 h-4 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                    <div className="w-16 h-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-3/4 h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="w-1/2 h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-gray-300 rounded"></div>
                    <div className="w-5/6 h-4 bg-gray-300 rounded"></div>
                    <div className="w-4/5 h-4 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-600">
            {filters.rating ?? filters.verified 
              ? 'No reviews match your current filters. Try adjusting your search criteria.'
              : 'Be the first to review this product!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 7) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 4) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 3) {
                    pageNum = pagination.pages - 6 + i;
                  } else {
                    pageNum = pagination.page - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`w-8 h-8 text-sm rounded-md transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-primary-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}