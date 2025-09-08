'use client';

import { ReactNode } from 'react';
import Image from 'next/image';

// Base skeleton component
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-neutral-200 rounded ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden h-full flex flex-col animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-neutral-200" />
      
      {/* Content skeleton */}
      <div className="p-6 pb-8 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
          {/* Title skeleton */}
          <div className="h-6 bg-neutral-200 rounded mb-3" />
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4" />
          
          {/* Description skeleton */}
          <div className="space-y-2 mb-4 flex-1">
            <div className="h-3 bg-neutral-200 rounded" />
            <div className="h-3 bg-neutral-200 rounded w-2/3" />
          </div>
        </div>

        {/* Price skeleton */}
        <div className="flex items-center justify-between mb-4 mt-auto">
          <div className="h-6 bg-neutral-200 rounded w-20" />
          <div className="h-5 bg-neutral-200 rounded w-16" />
        </div>

        {/* Button skeleton */}
        <div className="h-12 bg-neutral-200 rounded-lg" />

        {/* Categories skeleton */}
        <div className="mt-4 flex justify-center gap-2">
          <div className="h-6 bg-neutral-200 rounded-full w-16" />
          <div className="h-6 bg-neutral-200 rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Page loading skeleton
export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-12 bg-neutral-200 rounded w-1/2 mb-4" />
        <div className="h-4 bg-neutral-200 rounded w-1/3" />
      </div>

      {/* Content grid skeleton */}
      <ProductGridSkeleton />
    </div>
  );
}

// Loading spinner with overlay
export function LoadingSpinner({ 
  size = 'md',
  overlay = false,
  children 
}: { 
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  children?: ReactNode;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
          {spinner}
          {children && (
            <div className="text-neutral-700 text-center">{children}</div>
          )}
        </div>
      </div>
    );
  }

  return spinner;
}

// Progressive image component with loading state
export function ProgressiveImage({
  src,
  alt,
  className = '',
  priority = false,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  [key: string]: any;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton background while loading */}
      <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      
      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        fill
        className="relative z-10 object-cover transition-opacity duration-300"
        priority={priority}
        onLoad={(e) => {
          // Fade in the image when loaded
          (e.target as HTMLImageElement).style.opacity = '1';
        }}
        style={{ opacity: 0 }}
        {...props}
      />
    </div>
  );
}

// Button with loading state
export function LoadingButton({
  children,
  isLoading = false,
  disabled = false,
  className = 'btn-primary',
  onClick,
  ...props
}: {
  children: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void | Promise<void>;
  [key: string]: any;
}) {
  return (
    <button
      className={`${className} flex items-center justify-center gap-2 relative`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Shimmer effect utility
export function ShimmerEffect({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}