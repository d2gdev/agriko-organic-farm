'use client';

import { useState, useEffect } from 'react';
import { WCProduct } from '@/types/woocommerce';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price_low' | 'price_high' | 'newest' | 'popularity';
  inStock?: boolean;
}

interface SearchFiltersProps {
  products: WCProduct[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

export default function SearchFiltersComponent({
  products,
  filters,
  onFiltersChange,
  className
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() || '',
    max: filters.maxPrice?.toString() || ''
  });

  // Get unique categories from products
  const categories = Array.from(
    new Set(
      products.flatMap(product => 
        product.categories?.map(cat => cat.name) || []
      )
    )
  ).sort();

  // Get price range from products
  const prices = products.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
  const minProductPrice = Math.min(...prices);
  const maxProductPrice = Math.max(...prices);

  // Update price range when filters change
  useEffect(() => {
    setPriceRange({
      min: filters.minPrice?.toString() || '',
      max: filters.maxPrice?.toString() || ''
    });
  }, [filters.minPrice, filters.maxPrice]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handlePriceRangeSubmit = () => {
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined;
    
    onFiltersChange({
      ...filters,
      minPrice,
      maxPrice
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setPriceRange({ min: '', max: '' });
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-neutral-200', className)}>
      {/* Filter Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span>Filters</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-neutral-600 hover:text-neutral-900"
              >
                Clear All
              </Button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              <svg 
                className={cn('w-5 h-5 transition-transform duration-200', 
                  isExpanded && 'rotate-180'
                )} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className={cn('lg:block', 
        !isExpanded && 'hidden',
        isExpanded && 'block'
      )}>
        <div className="p-4 space-y-6">
          
          {/* Sort By */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-900">
              Sort By
            </label>
            <select
              value={filters.sortBy || ''}
              onChange={(e) => handleFilterChange('sortBy', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Default</option>
              <option value="name">Name (A-Z)</option>
              <option value="price_low">Price (Low to High)</option>
              <option value="price_high">Price (High to Low)</option>
              <option value="newest">Newest First</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-900">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price Range */}
          {prices.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-900">
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    placeholder={`Min (₱${minProductPrice})`}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min={minProductPrice}
                    max={maxProductPrice}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder={`Max (₱${maxProductPrice})`}
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min={minProductPrice}
                    max={maxProductPrice}
                  />
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePriceRangeSubmit}
                className="w-full"
              >
                Apply Price Range
              </Button>
            </div>
          )}

          {/* Stock Status */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStock || false}
                onChange={(e) => handleFilterChange('inStock', e.target.checked || undefined)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-sm text-neutral-700">In Stock Only</span>
            </label>
          </div>

        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="p-4 border-t border-neutral-200 bg-neutral-50">
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {filters.category}
                <button
                  onClick={() => handleFilterChange('category', undefined)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  aria-label={`Remove ${filters.category} filter`}
                >
                  ×
                </button>
              </span>
            )}
            
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                ₱{filters.minPrice || 0} - ₱{filters.maxPrice || '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('minPrice', undefined);
                    handleFilterChange('maxPrice', undefined);
                  }}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  aria-label="Remove price filter"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.sortBy && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Sort: {filters.sortBy.replace('_', ' ')}
                <button
                  onClick={() => handleFilterChange('sortBy', undefined)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  aria-label="Remove sort filter"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.inStock && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                In Stock
                <button
                  onClick={() => handleFilterChange('inStock', undefined)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  aria-label="Remove in stock filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}