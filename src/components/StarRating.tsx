'use client';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showValue = false,
  interactive = false,
  onRatingChange 
}: StarRatingProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const renderStar = (starIndex: number) => {
    const starRating = starIndex + 1;
    const isFilled = starRating <= rating;
    const isPartiallyFilled = starRating - 0.5 <= rating && rating < starRating;
    
    return (
      <button
        key={starIndex}
        type="button"
        disabled={!interactive}
        onClick={() => handleStarClick(starRating)}
        className={`relative focus:outline-none ${
          interactive 
            ? 'cursor-pointer hover:scale-110 transition-transform' 
            : 'cursor-default'
        } ${sizeClasses[size]}`}
        aria-label={`${starRating} star${starRating > 1 ? 's' : ''}`}
      >
        {/* Background star (empty) */}
        <svg
          className={`absolute inset-0 ${sizeClasses[size]} text-gray-300`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        
        {/* Foreground star (filled) */}
        {(isFilled || isPartiallyFilled) && (
          <svg
            className={`relative ${sizeClasses[size]} text-yellow-400`}
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{
              clipPath: isPartiallyFilled 
                ? 'polygon(0 0, 50% 0, 50% 100%, 0% 100%)' 
                : undefined
            }}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        
        {/* Hover effect for interactive stars */}
        {interactive && (
          <svg
            className={`absolute inset-0 ${sizeClasses[size]} text-yellow-300 opacity-0 hover:opacity-100 transition-opacity`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </div>
      
      {showValue && (
        <span className={`ml-2 font-medium text-gray-700 ${
          size === 'xs' ? 'text-xs' :
          size === 'sm' ? 'text-sm' :
          size === 'lg' ? 'text-lg' : 'text-base'
        }`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}