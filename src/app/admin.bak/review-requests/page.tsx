'use client';

import { ReviewRequestManager } from '@/components/ReviewRequestManager';

export default function ReviewRequestsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Request Management</h1>
          <p className="text-gray-600">
            Manage automated review requests sent to customers after order completion.
          </p>
        </div>

        <ReviewRequestManager />
      </div>
    </div>
  );
}