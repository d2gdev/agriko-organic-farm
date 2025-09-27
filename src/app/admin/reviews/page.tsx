'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Star, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '@/components/Button';
import AdminLayout from '@/components/AdminLayout';

interface Review {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Fetch reviews
    fetchReviews();
    setLoading(false);
  }, [router]);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        // Use mock data if API fails
        setReviews([
          {
            id: '1',
            productName: 'Organic Tomatoes',
            customerName: 'John Doe',
            rating: 5,
            comment: 'Fresh and delicious! Best tomatoes I\'ve ever had.',
            status: 'approved',
            date: '2024-01-15'
          },
          {
            id: '2',
            productName: 'Free-Range Eggs',
            customerName: 'Jane Smith',
            rating: 4,
            comment: 'Good quality eggs, but packaging could be better.',
            status: 'pending',
            date: '2024-01-14'
          },
          {
            id: '3',
            productName: 'Organic Spinach',
            customerName: 'Mike Johnson',
            rating: 5,
            comment: 'Super fresh and green!',
            status: 'approved',
            date: '2024-01-13'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      // Use mock data
      setReviews([
        {
          id: '1',
          productName: 'Organic Tomatoes',
          customerName: 'John Doe',
          rating: 5,
          comment: 'Fresh and delicious!',
          status: 'approved',
          date: '2024-01-15'
        }
      ]);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    setReviews(prev => prev.map(review =>
      review.id === reviewId ? { ...review, status } : review
    ));
    // In production, this would call an API
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600 mt-1">Customer reviews and ratings</p>
        </div>
      {/* Header */}
      {/* Main Content */}
      {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {reviews.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reviews.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 fill-current" />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Reviews</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {review.productName}
                        </h3>
                        {getStatusBadge(review.status)}
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-500">
                          by {review.customerName} • {review.date}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                    </div>
                    {review.status === 'pending' && (
                      <div className="ml-4 flex space-x-2">
                        <Button
                          onClick={() => updateReviewStatus(review.id, 'approved')}
                          variant="primary"
                          className="!py-1 !px-3 text-sm"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateReviewStatus(review.id, 'rejected')}
                          variant="secondary"
                          className="!py-1 !px-3 text-sm"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No reviews yet</p>
              </div>
            )}
          </div>
        </div>
    </div>
    </AdminLayout>
  );
}