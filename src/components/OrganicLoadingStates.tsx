import React from 'react';

// Organic-themed loading spinner
export function OrganicSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <div className="absolute inset-0 rounded-full border-2 border-green-200 animate-pulse"></div>
      <div className="absolute inset-0 rounded-full border-2 border-green-500 border-t-transparent animate-spin"></div>
      <div className="absolute inset-2 rounded-full bg-green-50 animate-pulse"></div>
      <div className="absolute inset-3 rounded-full bg-green-100"></div>
    </div>
  );
}

// Plant growing animation
export function PlantGrowingLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <div className="relative w-16 h-20">
        {/* Pot */}
        <div className="absolute bottom-0 w-12 h-6 bg-amber-800 rounded-b-lg left-2"></div>
        <div className="absolute bottom-1 w-10 h-4 bg-amber-600 rounded-b-lg left-3"></div>
        
        {/* Stem */}
        <div className="absolute bottom-6 left-1/2 w-1 h-8 bg-green-600 rounded-t-full transform -translate-x-1/2 animate-grow-up"></div>
        
        {/* Leaves */}
        <div className="absolute bottom-10 left-6 w-3 h-6 bg-green-500 rounded-full transform rotate-45 animate-leaf-grow animation-delay-500"></div>
        <div className="absolute bottom-12 left-4 w-4 h-7 bg-green-400 rounded-full transform -rotate-45 animate-leaf-grow animation-delay-700"></div>
        
        {/* Flower */}
        <div className="absolute top-2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2 animate-bloom animation-delay-1000"></div>
      </div>
      <p className="text-sm text-neutral-600 animate-pulse">Growing your request...</p>
    </div>
  );
}

// Seed sprouting loader
export function SeedSproutLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-amber-600 rounded-full animate-seed-sprout"></div>
      <div className="w-2 h-2 bg-amber-600 rounded-full animate-seed-sprout animation-delay-200"></div>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-seed-sprout animation-delay-400"></div>
      <div className="w-2 h-2 bg-green-400 rounded-full animate-seed-sprout animation-delay-600"></div>
      <div className="w-2 h-2 bg-green-300 rounded-full animate-seed-sprout animation-delay-800"></div>
    </div>
  );
}

// Harvest basket filling animation
export function HarvestLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      {/* Basket */}
      <div className="absolute bottom-0 w-16 h-10 border-4 border-amber-800 rounded-b-2xl"></div>
      <div className="absolute bottom-2 w-12 h-6 bg-amber-100 rounded-b-xl left-2"></div>
      
      {/* Produce items falling */}
      <div className="absolute top-0 left-2 w-3 h-3 bg-red-500 rounded-full animate-harvest-fall"></div>
      <div className="absolute top-0 left-6 w-2 h-2 bg-green-500 rounded-full animate-harvest-fall animation-delay-300"></div>
      <div className="absolute top-0 left-10 w-2 h-2 bg-orange-500 rounded-full animate-harvest-fall animation-delay-600"></div>
    </div>
  );
}

// Product grid skeleton with organic feel
export function OrganicProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-neutral-100 rounded animate-pulse"></div>
              <div className="h-3 bg-neutral-100 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-6 bg-green-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-neutral-200 rounded-full w-16 animate-pulse"></div>
            </div>
            <div className="h-10 bg-green-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}