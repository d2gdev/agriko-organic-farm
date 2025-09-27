'use client';

import { useState, useMemo, useEffect } from 'react';
import { WCProduct } from '@/types/woocommerce';
import { SearchFilters } from '@/components/SearchFilters';

interface UseProductFiltersOptions {
  products: WCProduct[];
  initialFilters?: SearchFilters;
}

/**
 * Hook for filtering and sorting products based on search criteria
 * Provides efficient filtering with memoization for performance
 */
export function useProductFilters({
  products,
  initialFilters = {}
}: UseProductFiltersOptions) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort products based on current filters and search query
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.short_description?.toLowerCase().includes(query) ||
        product.categories?.some(cat => cat.name.toLowerCase().includes(query)) ||
        product.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product =>
        product.categories?.some(cat => cat.name === filters.category)
      );
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(product => {
        const price = (product.price || 0);
        return !isNaN(price) && price >= (filters.minPrice || 0);
      });
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(product => {
        const price = (product.price || 0);
        return !isNaN(price) && price <= (filters.maxPrice || Number.MAX_VALUE);
      });
    }

    // Stock status filter
    if (filters.inStock) {
      filtered = filtered.filter(product => 
        product.stock_status === 'instock' && 
        (product.stock_quantity === undefined || product.stock_quantity === null || product.stock_quantity > 0)
      );
    }

    // Sort products
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          
          case 'price_low':
            return (a.price || 0) - (b.price || 0);
          
          case 'price_high':
            return (b.price || 0) - (a.price || 0);
          
          case 'newest':
            return new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime();
          
          case 'popularity': {
            // Sort by rating count and average rating
            const aRating = (a.rating_count || 0) * (parseFloat(a.average_rating || '0'));
            const bRating = (b.rating_count || 0) * (parseFloat(b.average_rating || '0'));
            return bRating - aRating;
          }
          
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [products, filters, searchQuery]);

  // Get filter statistics
  const filterStats = useMemo(() => {
    const totalProducts = products.length;
    const filteredCount = filteredProducts.length;
    
    // Get available categories
    const categories = Array.from(
      new Set(
        products.flatMap(product => 
          product.categories?.map(cat => cat.name) || []
        )
      )
    ).sort();

    // Get price range
    const prices = products.map(p => (p.price || 0)).filter(p => !isNaN(p));
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices)
    } : { min: 0, max: 0 };

    // Get stock statistics
    const inStockCount = products.filter(p => 
      p.stock_status === 'instock' && 
      (p.stock_quantity === undefined || p.stock_quantity === null || p.stock_quantity > 0)
    ).length;

    return {
      totalProducts,
      filteredCount,
      categories,
      priceRange,
      inStockCount,
      outOfStockCount: totalProducts - inStockCount
    };
  }, [products, filteredProducts]);

  // Reset all filters
  const resetFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  // Update a specific filter
  const updateFilter = (key: keyof SearchFilters, value: number | boolean | string[] | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.trim().length > 0;

  return {
    // Current state
    filters,
    searchQuery,
    filteredProducts,
    filterStats,
    hasActiveFilters,

    // Actions
    setFilters,
    setSearchQuery,
    updateFilter,
    resetFilters,

    // Utilities
    getProductsByCategory: (category: string) => 
      products.filter(p => p.categories?.some(cat => cat.name === category)),
    
    getProductsInPriceRange: (min: number, max: number) =>
      products.filter(p => {
        const price = (p.price || 0);
        return !isNaN(price) && price >= min && price <= max;
      }),

    searchProducts: (query: string) => {
      const searchResults = products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase()) ||
        product.short_description?.toLowerCase().includes(query.toLowerCase())
      );
      return searchResults;
    }
  };
}

/**
 * Hook for managing product search with debouncing
 */
export function useProductSearch(products: WCProduct[], debounceMs: number = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Search results
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return [];
    }

    const searchTerm = debouncedQuery.toLowerCase().trim();
    
    return products.filter(product => {
      // Search in product name (highest priority)
      if (product.name.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in short description
      if (product.short_description?.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in description
      if (product.description?.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in categories
      if (product.categories?.some(cat => cat.name.toLowerCase().includes(searchTerm))) {
        return true;
      }

      // Search in tags
      if (product.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm))) {
        return true;
      }

      return false;
    }).slice(0, 20); // Limit results for performance
  }, [products, debouncedQuery]);

  return {
    query,
    debouncedQuery,
    results,
    setQuery,
    isSearching: query !== debouncedQuery
  };
}