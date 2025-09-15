'use client';

interface CartLoadingStateProps {
  type?: 'inline' | 'drawer' | 'page';
}

export default function CartLoadingState({
  type = 'inline'
}: CartLoadingStateProps) {
  if (type === 'drawer') {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      <div className="w-24 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="mt-6 h-12 bg-primary-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600 text-sm">Updating cart...</span>
      </div>
    </div>
  );
}