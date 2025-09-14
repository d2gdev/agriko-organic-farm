'use client';

import { useState, useEffect } from 'react';
import { Review, ReviewModerationAction, ReviewStatus } from '@/types/reviews';
import { ReviewCard } from '@/components/ReviewCard';
import { logger } from '@/lib/logger';

interface ModerationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
}

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | 'all'>('all');
  const [moderatingReview, setModeratingReview] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // In production, this would be a protected admin endpoint
      const response = await fetch('/api/admin/reviews');
      
      if (response.ok) {
        const data = await response.json() as { reviews: Review[] };
        setReviews(data.reviews ?? []);
        
        // Calculate stats
        const reviewsList = data.reviews ?? [];
        const newStats = reviewsList.reduce((acc: ModerationStats, review: Review) => {
          acc.total++;
          acc[review.status as keyof ModerationStats]++;
          return acc;
        }, { total: 0, pending: 0, approved: 0, rejected: 0, spam: 0 });
        
        setStats(newStats);
      }
    } catch (error) {
      logger.error('Error fetching reviews', error as Record<string, unknown>, 'admin-reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModeration = async (reviewId: string, action: 'approve' | 'reject' | 'spam', reason?: string, notes?: string) => {
    setModeratingReview(reviewId);
    
    try {
      const moderationData: ReviewModerationAction = {
        reviewId,
        action,
        reason,
        notes,
        moderatorId: 'admin-user' // In production, get from auth context
      };

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moderationData),
      });

      if (response.ok) {
        // Update the review in local state
        const updatedReviews = reviews.map(review =>
          review.id === reviewId
            ? {
                ...review,
                status: action === 'approve' ? ReviewStatus.APPROVED : 
                       action === 'reject' ? ReviewStatus.REJECTED : ReviewStatus.SPAM,
                moderatedAt: new Date().toISOString(),
                moderatedBy: 'admin-user',
                moderationNotes: notes
              }
            : review
        );
        setReviews(updatedReviews);

        // Update stats
        const updatedStats = {
          ...stats,
          pending: stats.pending - 1,
          [action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'spam']: 
            stats[action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'spam'] + 1
        };
        setStats(updatedStats);
      }
    } catch (error) {
      logger.error('Moderation error', error as Record<string, unknown>, 'admin-reviews');
      alert('Failed to moderate review');
    } finally {
      setModeratingReview(null);
    }
  };

  const handleBulkModeration = async (reviewIds: string[], action: 'approve' | 'reject' | 'spam') => {
    for (const reviewId of reviewIds) {
      await handleModeration(reviewId, action);
    }
  };

  const filteredReviews = reviews.filter(review => 
    selectedStatus === 'all' || review.status === selectedStatus
  );

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case ReviewStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ReviewStatus.APPROVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case ReviewStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      case ReviewStatus.SPAM:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Moderation</h1>
          <p className="text-gray-600">
            Manage and moderate customer reviews for your products.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.spam}</div>
            <div className="text-sm text-gray-600">Spam</div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-3">Filter by status:</span>
            {['all', ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.SPAM].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status as ReviewStatus | 'all')}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedStatus === status
                    ? status === 'all' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : getStatusColor(status as ReviewStatus)
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} 
                {status === 'all' ? ` (${stats.total})` : ` (${stats[status as keyof ModerationStats]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? 'No reviews have been submitted yet.' 
                : `No reviews with status "${selectedStatus}" found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="relative">
                <ReviewCard review={review} showActions={false} />
                
                {/* Moderation Actions */}
                {review.status === ReviewStatus.PENDING && (
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={() => handleModeration(review.id, 'approve')}
                      disabled={moderatingReview === review.id}
                      className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {moderatingReview === review.id ? (
                        <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Approve
                    </button>
                    
                    <button
                      onClick={() => handleModeration(review.id, 'reject', 'Content does not meet guidelines')}
                      disabled={moderatingReview === review.id}
                      className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                    
                    <button
                      onClick={() => handleModeration(review.id, 'spam', 'Marked as spam')}
                      disabled={moderatingReview === review.id}
                      className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      Spam
                    </button>
                  </div>
                )}

                {/* Status Badge for Non-Pending Reviews */}
                {review.status !== ReviewStatus.PENDING && (
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(review.status)}`}>
                      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
