'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WCProduct } from '@/types/woocommerce';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price_low' | 'price_high' | 'newest' | 'popularity';
  inStock?: boolean;
  featured?: boolean;
  organic?: boolean;
  healthBenefits?: string[];
  priceRange?: 'all' | 'under-100' | '100-300' | '300-500' | 'over-500';
}

interface SearchFiltersProps {
  products: WCProduct[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

const SearchFiltersComponent = React.memo(function SearchFiltersComponent({
  products,
  filters,
  onFiltersChange,
  className
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sort', 'price']));
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() ?? '',
    max: filters.maxPrice?.toString() ?? ''
  });

  // Memoized expensive calculations to prevent unnecessary re-renders
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products.flatMap(product =>
          product.categories?.map(cat => cat.name) ?? []
        )
      )
    ).sort();
  }, [products]);

  const { prices, minProductPrice, maxProductPrice } = useMemo(() => {
    const prices = products.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
    return {
      prices,
      minProductPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxProductPrice: prices.length > 0 ? Math.max(...prices) : 0
    };
  }, [products]);

  const healthBenefits = useMemo(() => {
    return Array.from(
      new Set(
        products.flatMap(product => extractHealthBenefits(product))
      )
    ).sort();
  }, [products]);

  const productCounts = useMemo(() => {
    return {
      inStock: products.filter(p => p.stock_status === 'instock').length,
      featured: products.filter(p => p.featured).length,
      organic: products.filter(p => isOrganic(p)).length,
      total: products.length
    };
  }, [products]);

  // Update price range when filters change
  useEffect(() => {
    setPriceRange({
      min: filters.minPrice?.toString() ?? '',
      max: filters.maxPrice?.toString() ?? ''
    });
  }, [filters.minPrice, filters.maxPrice]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string | number | boolean | string[] | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const handlePriceRangeSubmit = useCallback(() => {
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined;

    onFiltersChange({
      ...filters,
      minPrice,
      maxPrice
    });
  }, [priceRange, filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({});
    setPriceRange({ min: '', max: '' });
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const SectionHeader = React.memo(({ title, section }: { title: string; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between text-sm font-medium text-neutral-900 hover:text-primary-700 transition-colors py-2"
    >
      <span>{title}</span>
      <svg
        className={cn('w-4 h-4 transition-transform duration-200',
          expandedSections.has(section) && 'rotate-180'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  ));

  SectionHeader.displayName = 'SectionHeader';

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
        <div className="p-4 space-y-4">

          {/* Sort By Accordion */}
          <div className="border-b border-neutral-100 pb-4">
            <SectionHeader title="Sort By" section="sort" />
            {expandedSections.has('sort') && (
              <div className="mt-3 space-y-2">
                {[
                  { value: '', label: 'Default' },
                  { value: 'name', label: 'Name (A-Z)' },
                  { value: 'price_low', label: 'Price: Low to High' },
                  { value: 'price_high', label: 'Price: High to Low' },
                  { value: 'newest', label: 'Newest First' },
                  { value: 'popularity', label: 'Most Popular' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('sortBy', option.value || undefined)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                      filters.sortBy === option.value
                        ? 'bg-primary-100 text-primary-800 font-medium'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter Accordion */}
          {categories.length > 0 && (
            <div className="border-b border-neutral-100 pb-4">
              <SectionHeader title="Categories" section="category" />
              {expandedSections.has('category') && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange('category', undefined)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      !filters.category
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleFilterChange('category', category)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        filters.category === category
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Price Range Accordion */}
          {prices.length > 0 && (
            <div className="border-b border-neutral-100 pb-4">
              <SectionHeader title="Price Range" section="price" />
              {expandedSections.has('price') && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Prices' },
                      { value: 'under-100', label: 'Under ₱100' },
                      { value: '100-300', label: '₱100 - ₱300' },
                      { value: '300-500', label: '₱300 - ₱500' },
                      { value: 'over-500', label: 'Over ₱500' }
                    ].map(range => (
                      <button
                        key={range.value}
                        onClick={() => {
                          if (range.value === 'all') {
                            handleFilterChange('minPrice', undefined);
                            handleFilterChange('maxPrice', undefined);
                          } else if (range.value === 'under-100') {
                            handleFilterChange('minPrice', undefined);
                            handleFilterChange('maxPrice', 100);
                          } else if (range.value === '100-300') {
                            handleFilterChange('minPrice', 100);
                            handleFilterChange('maxPrice', 300);
                          } else if (range.value === '300-500') {
                            handleFilterChange('minPrice', 300);
                            handleFilterChange('maxPrice', 500);
                          } else if (range.value === 'over-500') {
                            handleFilterChange('minPrice', 500);
                            handleFilterChange('maxPrice', undefined);
                          }
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                          (range.value === 'all' && !filters.minPrice && !filters.maxPrice) ||
                          (range.value === 'under-100' && !filters.minPrice && filters.maxPrice === 100) ||
                          (range.value === '100-300' && filters.minPrice === 100 && filters.maxPrice === 300) ||
                          (range.value === '300-500' && filters.minPrice === 300 && filters.maxPrice === 500) ||
                          (range.value === 'over-500' && filters.minPrice === 500 && !filters.maxPrice)
                            ? 'bg-primary-600 text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span>Custom:</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-20 px-2 py-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      min={minProductPrice}
                      max={maxProductPrice}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-20 px-2 py-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      min={minProductPrice}
                      max={maxProductPrice}
                    />
                    <button
                      onClick={handlePriceRangeSubmit}
                      className="px-3 py-1 border border-primary-600 text-primary-600 text-xs rounded-md hover:bg-primary-50 transition-colors font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Health Benefits Accordion */}
          {healthBenefits.length > 0 && (
            <div className="border-b border-neutral-100 pb-4">
              <SectionHeader title="Health Benefits" section="benefits" />
              {expandedSections.has('benefits') && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {healthBenefits.slice(0, 8).map(benefit => (
                    <button
                      key={benefit}
                      onClick={() => {
                        const current = filters.healthBenefits ?? [];
                        const updated = current.includes(benefit)
                          ? current.filter(b => b !== benefit)
                          : [...current, benefit];
                        handleFilterChange('healthBenefits', updated.length > 0 ? updated : undefined);
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize',
                        filters.healthBenefits?.includes(benefit)
                          ? 'bg-green-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      )}
                    >
                      {benefit}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Options Accordion */}
          <div className="pb-4">
            <SectionHeader title="Product Options" section="options" />
            {expandedSections.has('options') && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => handleFilterChange('inStock', filters.inStock ? undefined : true)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all',
                    filters.inStock
                      ? 'bg-primary-100 text-primary-800'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  )}
                >
                  <span className="text-sm font-medium">In Stock Only</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    filters.inStock
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  )}>
                    {productCounts.inStock}
                  </span>
                </button>

                <button
                  onClick={() => handleFilterChange('featured', filters.featured ? undefined : true)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all',
                    filters.featured
                      ? 'bg-primary-100 text-primary-800'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  )}
                >
                  <span className="text-sm font-medium">⭐ Featured Products</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    filters.featured
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  )}>
                    {productCounts.featured}
                  </span>
                </button>

                <button
                  onClick={() => handleFilterChange('organic', filters.organic ? undefined : true)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all',
                    filters.organic
                      ? 'bg-primary-100 text-primary-800'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  )}
                >
                  <span className="text-sm font-medium">🌿 Organic Certified</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    filters.organic
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  )}>
                    {productCounts.organic}
                  </span>
                </button>
              </div>
            )}
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
            
            {(filters.minPrice ?? filters.maxPrice) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                ₱{filters.minPrice ?? 0} - ₱{filters.maxPrice ?? '∞'}
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

            {filters.featured && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Featured
                <button
                  onClick={() => handleFilterChange('featured', undefined)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  aria-label="Remove featured filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.organic && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                🌿 Organic
                <button
                  onClick={() => handleFilterChange('organic', undefined)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  aria-label="Remove organic filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.healthBenefits && filters.healthBenefits.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Health: {filters.healthBenefits.join(', ')}
                <button
                  onClick={() => handleFilterChange('healthBenefits', undefined)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                  aria-label="Remove health benefits filter"
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
});

SearchFiltersComponent.displayName = 'SearchFiltersComponent';

export default SearchFiltersComponent;

// Helper function to extract health benefits from product data
function extractHealthBenefits(product: WCProduct): string[] {
  const text = `${product.name} ${product.description ?? ''} ${product.short_description ?? ''}`.toLowerCase();
  const benefits: string[] = [];

  const healthKeywords = {
    'anti-inflammatory': ['anti-inflammatory', 'inflammation', 'reduce inflammation'],
    'immune support': ['immune', 'immunity', 'immune system', 'boost immunity'],
    'digestive health': ['digestive', 'digestion', 'gut health', 'stomach'],
    'heart health': ['heart', 'cardiovascular', 'circulation', 'blood pressure'],
    'energy boost': ['energy', 'energizing', 'vitality', 'stamina'],
    'brain health': ['brain', 'cognitive', 'memory', 'mental clarity'],
    'weight management': ['weight', 'metabolism', 'slimming', 'weight loss'],
    'antioxidant rich': ['antioxidant', 'antioxidants', 'free radicals'],
    'blood sugar': ['blood sugar', 'glucose', 'diabetic', 'glycemic'],
    'skin health': ['skin', 'complexion', 'beauty', 'glowing'],
    'bone health': ['bone', 'calcium', 'osteoporosis', 'joint'],
    'respiratory': ['respiratory', 'breathing', 'lungs', 'airways']
  };

  for (const [benefit, keywords] of Object.entries(healthKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      benefits.push(benefit);
    }
  }

  return benefits;
}

// Helper function to check if product is organic
function isOrganic(product: WCProduct): boolean {
  const text = `${product.name} ${product.description ?? ''} ${product.short_description ?? ''}`.toLowerCase();
  const organicKeywords = ['organic', 'naturally grown', 'pesticide-free', 'chemical-free', 'bio', 'natural'];
  return organicKeywords.some(keyword => text.includes(keyword));
}