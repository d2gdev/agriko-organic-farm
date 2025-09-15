'use client';

interface SearchLoadingStateProps {
  type?: 'inline' | 'fullscreen' | 'card';
  message?: string;
}

export default function SearchLoadingState({
  type = 'inline',
  message = 'Searching...'
}: SearchLoadingStateProps) {
  if (type === 'fullscreen') {
    return (
      <div
        className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
            <div
              className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"
              aria-hidden="true"
            ></div>
          </div>
          <p className="text-lg font-medium text-gray-700">{message}</p>
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
      <div className="flex items-center space-x-3">
        <div className="relative w-8 h-8" aria-hidden="true">
          <div className="absolute inset-0 border-2 border-primary-200 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <span className="text-gray-600 font-medium" aria-label={message}>{message}</span>
      </div>
    </div>
  );
}