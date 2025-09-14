'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

import { ReviewRequest, ReviewRequestStatus } from '@/types/reviews';

interface ReviewRequestManagerProps {
  initialRequests?: ReviewRequest[];
}

export function ReviewRequestManager({ initialRequests }: ReviewRequestManagerProps) {
  const [requests, setRequests] = useState<ReviewRequest[]>(initialRequests ?? []);
  const [loading, setLoading] = useState(!initialRequests);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReviewRequestStatus | 'all'>('all');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/reviews/requests?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch review requests');
      }

      const result = await response.json();
      
      if (result.success) {
        setRequests(result.data.requests);
      } else {
        throw new Error(result.error ?? 'Failed to fetch requests');
      }
    } catch (error) {
      logger.error('Error fetching requests:', error as Record<string, unknown>);
      setError(error instanceof Error ? error.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (!initialRequests) {
      fetchRequests();
    }
  }, [fetchRequests, initialRequests]);

  const handleAction = async (requestId: string, action: string) => {
    setProcessingRequest(requestId);
    
    try {
      const response = await fetch(`/api/reviews/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the request in local state
        setRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === requestId
              ? { ...request, status: result.data.status, ...result.data }
              : request
          )
        );
      } else {
        throw new Error('Failed to update request');
      }
    } catch (error) {
      logger.error('Error updating request:', error as Record<string, unknown>);
      toast.error('Failed to update request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this review request?')) {
      return;
    }

    setProcessingRequest(requestId);
    
    try {
      const response = await fetch(`/api/reviews/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the request from local state
        setRequests(prevRequests =>
          prevRequests.filter(request => request.id !== requestId)
        );
      } else {
        throw new Error('Failed to cancel request');
      }
    } catch (error) {
      logger.error('Error cancelling request:', error as Record<string, unknown>);
      toast.error('Failed to cancel request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const getStatusColor = (status: ReviewRequestStatus) => {
    switch (status) {
      case ReviewRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ReviewRequestStatus.SENT:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ReviewRequestStatus.REMINDER_SENT:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case ReviewRequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case ReviewRequestStatus.EXPIRED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRequests = requests.filter(request =>
    selectedStatus === 'all' || request.status === selectedStatus
  );

  if (loading && !requests.length) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-300 rounded w-1/3 animate-pulse"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-300 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Unable to load requests</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchRequests}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Review Requests</h2>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ReviewRequestStatus | 'all')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value={ReviewRequestStatus.PENDING}>Pending</option>
            <option value={ReviewRequestStatus.SENT}>Sent</option>
            <option value={ReviewRequestStatus.REMINDER_SENT}>Reminder Sent</option>
            <option value={ReviewRequestStatus.COMPLETED}>Completed</option>
            <option value={ReviewRequestStatus.EXPIRED}>Expired</option>
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No review requests found</h3>
          <p className="text-gray-600">
            {selectedStatus === 'all' 
              ? 'No review requests have been created yet.' 
              : `No requests with status "${selectedStatus}" found.`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {request.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {request.productIds.length} product{request.productIds.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(request.createdAt)}</div>
                      {request.sentAt && (
                        <div className="text-xs text-gray-400">
                          Sent: {formatDate(request.sentAt)}
                        </div>
                      )}
                      {request.reminderSentAt && (
                        <div className="text-xs text-gray-400">
                          Reminder: {formatDate(request.reminderSentAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {request.status === ReviewRequestStatus.PENDING && (
                        <button
                          onClick={() => handleAction(request.id, 'send')}
                          disabled={processingRequest === request.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          Send
                        </button>
                      )}
                      
                      {request.status === ReviewRequestStatus.SENT && (
                        <button
                          onClick={() => handleAction(request.id, 'reminder')}
                          disabled={processingRequest === request.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        >
                          Remind
                        </button>
                      )}

                      {[ReviewRequestStatus.PENDING, ReviewRequestStatus.SENT].includes(request.status) && (
                        <>
                          <button
                            onClick={() => handleAction(request.id, 'complete')}
                            disabled={processingRequest === request.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleDelete(request.id)}
                            disabled={processingRequest === request.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}