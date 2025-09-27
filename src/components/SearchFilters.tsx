'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WCProduct } from '@/types/woocommerce';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';

export interface SearchFilters {
  category?: string | string[];
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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
}

interface SectionHeaderProps {
  title: string;
  section: string;
  expandedSections: Set<string>;
  onToggleSection: (section: string) => void;
}

const SectionHeader = React.memo(function SectionHeader({
  title,
  section,
  expandedSections,
  onToggleSection
}: SectionHeaderProps) {
  return (
    <button
      onClick={() => onToggleSection(section)}
      className="w-full flex items-center justify-between text-sm font-semibold text-green-700 hover:text-green-800 transition-colors py-2 group"
    >
      <span>{title}</span>
      <div className={cn('p-1 rounded-lg transition-all duration-200 group-hover:bg-green-100',
        expandedSections.has(section) && 'bg-green-100'
      )}>
        <svg
          className={cn('w-4 h-4 transition-transform duration-200 text-green-600',
            expandedSections.has(section) && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
  );
});

const SearchFiltersComponent = React.memo(function SearchFiltersComponent({
  products,
  filters,
  onFiltersChange,
  className,
  searchQuery = '',
  onSearchChange,
  isLoading = false
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sort', 'price']));
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() ?? '',
    max: filters.maxPrice?.toString() ?? ''
  });
  const [tempPriceRange, setTempPriceRange] = useState({
    min: filters.minPrice?.toString() ?? '',
    max: filters.maxPrice?.toString() ?? ''
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    const prices = products.map(p => (p.price || 0)).filter(p => !isNaN(p));
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

  // Calculate filter result previews
  const filterPreviews = useMemo(() => {
    const getFilteredCount = (testFilters: SearchFilters) => {
      return products.filter(product => {
        // Apply filters to count matching products
        if (testFilters.category) {
          const categories = Array.isArray(testFilters.category) ? testFilters.category : [testFilters.category];
          if (!product.categories?.some(cat => categories.includes(cat.name))) {
            return false;
          }
        }

        if (testFilters.minPrice !== undefined) {
          const price = (product.price || 0);
          if (isNaN(price) || price < testFilters.minPrice) return false;
        }

        if (testFilters.maxPrice !== undefined) {
          const price = (product.price || 0);
          if (isNaN(price) || price > testFilters.maxPrice) return false;
        }

        if (testFilters.inStock && product.stock_status !== 'instock') return false;
        if (testFilters.featured && !product.featured) return false;
        if (testFilters.organic && !isOrganic(product)) return false;

        return true;
      }).length;
    };

    return { getFilteredCount };
  }, [products]);

  // Debounced price range update
  const debouncedPriceUpdate = useCallback((min: string, max: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const minPrice = min ? parseFloat(min) : undefined;
      const maxPrice = max ? parseFloat(max) : undefined;

      if (minPrice !== filters.minPrice || maxPrice !== filters.maxPrice) {
        onFiltersChange({
          ...filters,
          minPrice,
          maxPrice
        });
      }
    }, 500); // 500ms debounce
  }, [filters, onFiltersChange]);

  // Update price range when filters change
  useEffect(() => {
    const newPriceRange = {
      min: filters.minPrice?.toString() ?? '',
      max: filters.maxPrice?.toString() ?? ''
    };
    setPriceRange(newPriceRange);
    setTempPriceRange(newPriceRange);
  }, [filters.minPrice, filters.maxPrice]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string | number | boolean | string[] | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const handleCategoryToggle = useCallback((category: string) => {
    const currentCategories = Array.isArray(filters.category)
      ? filters.category
      : filters.category ? [filters.category] : [];

    let newCategories;
    if (currentCategories.includes(category)) {
      newCategories = currentCategories.filter(c => c !== category);
    } else {
      newCategories = [...currentCategories, category];
    }

    const categoryValue = newCategories.length === 0
      ? undefined
      : newCategories.length === 1
        ? newCategories[0]
        : newCategories;

    handleFilterChange('category', categoryValue);
  }, [filters.category, handleFilterChange]);

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


  return (
    <div className={cn('bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-lg border border-green-100/50', className)}>
      {/* No-JavaScript Fallback Form */}
      <noscript>
        <div className="p-4 border-b border-neutral-200 bg-yellow-50">
          <div className="flex items-center text-sm text-yellow-800">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            JavaScript is disabled. Use the form below for basic filtering.
          </div>
          <form method="GET" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                <select name="category" id="category" className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                  <option value="">All Categories</option>
                  <option value="rice">Rice</option>
                  <option value="spices">Spices</option>
                  <option value="herbs">Herbs</option>
                  <option value="blends">Health Blends</option>
                </select>
              </div>
              <div>
                <label htmlFor="min_price" className="block text-sm font-medium text-neutral-700 mb-1">Min Price</label>
                <input type="number" name="min_price" id="min_price" placeholder="₱0" className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label htmlFor="max_price" className="block text-sm font-medium text-neutral-700 mb-1">Max Price</label>
                <input type="number" name="max_price" id="max_price" placeholder="₱9999" className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>
            <div className="flex justify-center">
              <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">
                Apply Filters
              </button>
            </div>
          </form>
        </div>
      </noscript>

      {/* Filter Header */}
      <div className="p-4 border-b border-green-100 bg-gradient-to-r from-green-50/50 to-transparent rounded-t-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-green-800 flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            </div>
            <span>Filters</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-transparent border-2 border-green-600 rounded-full hover:bg-green-50 hover:shadow-md transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-300"
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

          {/* Search Input */}
          {onSearchChange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900">Search Products</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search for products..."
                  disabled={isLoading}
                  className={`w-full px-3 py-2 pl-10 border border-green-200 bg-white/80 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all duration-200 hover:border-green-300 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <svg className="w-4 h-4 text-green-500 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sort By Accordion */}
          <div className="border-b border-green-100/50 pb-4">
            <SectionHeader
              title="Sort By"
              section="sort"
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
            />
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
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200',
                      filters.sortBy === option.value
                        ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 font-medium border border-green-200'
                        : 'hover:bg-green-50/50 text-neutral-700 border border-transparent hover:border-green-100'
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
            <div className="border-b border-green-100/50 pb-4">
              <SectionHeader
                title="Categories"
                section="category"
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />
              {expandedSections.has('category') && (
                <div className="mt-3 space-y-3">
                  {/* Clear All Categories Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500 font-medium">Select multiple categories</span>
                    {filters.category && (
                      <button
                        onClick={() => handleFilterChange('category', undefined)}
                        className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Category Checkboxes */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map(category => {
                      const currentCategories = Array.isArray(filters.category)
                        ? filters.category
                        : filters.category ? [filters.category] : [];
                      const isSelected = currentCategories.includes(category);

                      return (
                        <label
                          key={category}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-green-50/50 p-2 rounded-lg transition-all duration-200 hover:shadow-sm"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCategoryToggle(category)}
                            className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500 focus:ring-2 focus:ring-offset-1"
                          />
                          <span className={cn(
                            'text-sm flex-1',
                            isSelected
                              ? 'text-green-800 font-medium'
                              : 'text-neutral-700'
                          )}>
                            {category}
                          </span>
                          {/* Product count for each category */}
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                            {products.filter(p => p.categories?.some(cat => cat.name === category)).length}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price Range Accordion */}
          {prices.length > 0 && (
            <div className="border-b border-green-100/50 pb-4">
              <SectionHeader
                title="Price Range"
                section="price"
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />
              {expandedSections.has('price') && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Prices', minPrice: undefined, maxPrice: undefined },
                      { value: 'under-100', label: 'Under ₱100', minPrice: undefined, maxPrice: 100 },
                      { value: '100-300', label: '₱100 - ₱300', minPrice: 100, maxPrice: 300 },
                      { value: '300-500', label: '₱300 - ₱500', minPrice: 300, maxPrice: 500 },
                      { value: 'over-500', label: 'Over ₱500', minPrice: 500, maxPrice: undefined }
                    ].map(range => {
                      const testFilters = { ...filters, minPrice: range.minPrice, maxPrice: range.maxPrice };
                      const previewCount = filterPreviews.getFilteredCount(testFilters);

                      return (
                        <button
                          key={range.value}
                          onClick={() => {
                            handleFilterChange('minPrice', range.minPrice);
                            handleFilterChange('maxPrice', range.maxPrice);
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center space-x-2 border',
                            (range.value === 'all' && !filters.minPrice && !filters.maxPrice) ||
                            (range.value === 'under-100' && !filters.minPrice && filters.maxPrice === 100) ||
                            (range.value === '100-300' && filters.minPrice === 100 && filters.maxPrice === 300) ||
                            (range.value === '300-500' && filters.minPrice === 300 && filters.maxPrice === 500) ||
                            (range.value === 'over-500' && filters.minPrice === 500 && !filters.maxPrice)
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-md hover:shadow-lg transform hover:scale-105'
                              : 'bg-white text-neutral-700 hover:bg-green-50 border-green-200 hover:border-green-300'
                          )}
                        >
                          <span>{range.label}</span>
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full',
                            (range.value === 'all' && !filters.minPrice && !filters.maxPrice) ||
                            (range.value === 'under-100' && !filters.minPrice && filters.maxPrice === 100) ||
                            (range.value === '100-300' && filters.minPrice === 100 && filters.maxPrice === 300) ||
                            (range.value === '300-500' && filters.minPrice === 300 && filters.maxPrice === 500) ||
                            (range.value === 'over-500' && filters.minPrice === 500 && !filters.maxPrice)
                              ? 'bg-white/20 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          )}>
                            {previewCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span>Custom:</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={tempPriceRange.min}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setTempPriceRange(prev => ({ ...prev, min: newValue }));
                        debouncedPriceUpdate(newValue, tempPriceRange.max);
                      }}
                      className="w-20 px-2 py-1 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80 hover:border-green-300 transition-colors"
                      min={minProductPrice}
                      max={maxProductPrice}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={tempPriceRange.max}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setTempPriceRange(prev => ({ ...prev, max: newValue }));
                        debouncedPriceUpdate(tempPriceRange.min, newValue);
                      }}
                      className="w-20 px-2 py-1 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/80 hover:border-green-300 transition-colors"
                      min={minProductPrice}
                      max={maxProductPrice}
                    />
                    <button
                      onClick={handlePriceRangeSubmit}
                      className="px-3 py-1 border-2 border-green-600 text-green-700 text-xs rounded-full hover:bg-green-50 hover:shadow-md transition-all duration-200 font-semibold"
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
            <div className="border-b border-green-100/50 pb-4">
              <SectionHeader
                title="Health Benefits"
                section="benefits"
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              />
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
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize border',
                        filters.healthBenefits?.includes(benefit)
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700 shadow-md hover:shadow-lg'
                          : 'bg-white text-neutral-700 hover:bg-green-50 border-green-200 hover:border-green-300'
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
            <SectionHeader
              title="Product Options"
              section="options"
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
            />
            {expandedSections.has('options') && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => handleFilterChange('inStock', filters.inStock ? undefined : true)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group border',
                    filters.inStock
                      ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200'
                      : 'hover:bg-green-50/50 text-neutral-700 border-transparent hover:border-green-100'
                  )}
                  title={`${filters.inStock ? 'Remove' : 'Apply'} in-stock filter`}
                >
                  <span className="text-sm font-medium">In Stock Only</span>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      filters.inStock
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-600'
                    )}>
                      {filters.inStock ? filterPreviews.getFilteredCount(filters) : productCounts.inStock}
                    </span>
                    {!filters.inStock && (
                      <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        → {filterPreviews.getFilteredCount({ ...filters, inStock: true })}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleFilterChange('featured', filters.featured ? undefined : true)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group border',
                    filters.featured
                      ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200'
                      : 'hover:bg-green-50/50 text-neutral-700 border-transparent hover:border-green-100'
                  )}
                  title={`${filters.featured ? 'Remove' : 'Apply'} featured products filter`}
                >
                  <span className="text-sm font-medium">⭐ Featured Products</span>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      filters.featured
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-600'
                    )}>
                      {filters.featured ? filterPreviews.getFilteredCount(filters) : productCounts.featured}
                    </span>
                    {!filters.featured && (
                      <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        → {filterPreviews.getFilteredCount({ ...filters, featured: true })}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleFilterChange('organic', filters.organic ? undefined : true)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group border',
                    filters.organic
                      ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200'
                      : 'hover:bg-green-50/50 text-neutral-700 border-transparent hover:border-green-100'
                  )}
                  title={`${filters.organic ? 'Remove' : 'Apply'} organic products filter`}
                >
                  <span className="text-sm font-medium">🌿 Organic Certified</span>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      filters.organic
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-600'
                    )}>
                      {filters.organic ? filterPreviews.getFilteredCount(filters) : productCounts.organic}
                    </span>
                    {!filters.organic && (
                      <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        → {filterPreviews.getFilteredCount({ ...filters, organic: true })}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="p-4 border-t border-green-100 bg-gradient-to-r from-green-50/50 to-transparent rounded-b-2xl">
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              Array.isArray(filters.category) ? (
                // Multiple categories selected
                filters.category.map(category => (
                  <span key={category} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {category}
                    <button
                      onClick={() => handleCategoryToggle(category)}
                      className="ml-2 text-green-600 hover:text-green-800 font-bold"
                      aria-label={`Remove ${category} filter`}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                // Single category selected
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  {filters.category}
                  <button
                    onClick={() => handleFilterChange('category', undefined)}
                    className="ml-2 text-green-600 hover:text-green-800 font-bold"
                    aria-label={`Remove ${filters.category} filter`}
                  >
                    ×
                  </button>
                </span>
              )
            )}
            
            {(filters.minPrice ?? filters.maxPrice) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                ₱{filters.minPrice ?? 0} - ₱{filters.maxPrice ?? '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('minPrice', undefined);
                    handleFilterChange('maxPrice', undefined);
                  }}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
                  aria-label="Remove price filter"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.sortBy && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Sort: {filters.sortBy.replace('_', ' ')}
                <button
                  onClick={() => handleFilterChange('sortBy', undefined)}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
                  aria-label="Remove sort filter"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.inStock && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                In Stock
                <button
                  onClick={() => handleFilterChange('inStock', undefined)}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
                  aria-label="Remove in stock filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.featured && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Featured
                <button
                  onClick={() => handleFilterChange('featured', undefined)}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
                  aria-label="Remove featured filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.organic && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                🌿 Organic
                <button
                  onClick={() => handleFilterChange('organic', undefined)}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
                  aria-label="Remove organic filter"
                >
                  ×
                </button>
              </span>
            )}

            {filters.healthBenefits && filters.healthBenefits.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Health: {filters.healthBenefits.join(', ')}
                <button
                  onClick={() => handleFilterChange('healthBenefits', undefined)}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
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

// Memoized health keywords lookup - moved outside function for better performance
const HEALTH_KEYWORDS = {
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
} as const;

// Cache for processed product health benefits to avoid recomputation
const healthBenefitsCache = new Map<string, string[]>();

// Helper function to extract health benefits from product data with caching
function extractHealthBenefits(product: WCProduct): string[] {
  // Create a cache key from product id and modification date for cache invalidation
  const cacheKey = `${product.id}-${product.date_modified || 'no-date'}`;

  // Return cached result if available
  if (healthBenefitsCache.has(cacheKey)) {
    const cached = healthBenefitsCache.get(cacheKey);
    if (cached) return cached;
  }

  const text = `${product.name} ${product.description ?? ''} ${product.short_description ?? ''}`.toLowerCase();
  const benefits: string[] = [];

  for (const [benefit, keywords] of Object.entries(HEALTH_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      benefits.push(benefit);
    }
  }

  // Cache the result
  healthBenefitsCache.set(cacheKey, benefits);

  // Limit cache size to prevent memory leaks
  if (healthBenefitsCache.size > 1000) {
    const firstKey = healthBenefitsCache.keys().next().value;
    if (firstKey !== undefined) {
      healthBenefitsCache.delete(firstKey);
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