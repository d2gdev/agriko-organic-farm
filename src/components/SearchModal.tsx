'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, getProductMainImage, stripHtml } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useProductFilters } from '@/hooks/useProductFilters';
import SearchFiltersComponent, { SearchFilters } from '@/components/SearchFilters';
import Button from '@/components/Button';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WCProduct[];
}

export default function SearchModal({ isOpen, onClose, products }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Enhanced product filtering
  const {
    filters,
    filteredProducts,
    filterStats,
    setFilters,
    setSearchQuery,
    hasActiveFilters,
    resetFilters
  } = useProductFilters({ products });

  // Enhanced focus management with focus trap
  const { focusFirst } = useFocusTrap(modalRef, {
    isActive: isOpen,
    initialFocus: inputRef,
    escapeDeactivates: true,
    allowOutsideClick: false
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search with debouncing
  useEffect(() => {
    setIsLoading(true);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      setSearchQuery(query);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, setSearchQuery]);

  // Get display results (limit for modal view)
  const displayResults = filteredProducts.slice(0, 8);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleProductClick = (slug: string) => {
    onClose();
    router.push(`/product/${slug}`);
  };

  const handleViewAllResults = () => {
    onClose();
    // Create URL with search params
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.inStock) params.set('inStock', 'true');
    
    router.push(`/products?${params.toString()}`);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      aria-describedby="search-modal-description"
    >
      <div className="flex items-start justify-center min-h-screen pt-8 p-4">
        <div 
          ref={modalRef}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-slideInFromTop max-h-[90vh] flex flex-col"
          role="search"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 
              id="search-modal-title" 
              className="sr-only"
            >
              Product Search
            </h2>
            <p 
              id="search-modal-description" 
              className="sr-only"
            >
              Search through our organic products and find what you need
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  aria-label="Search products"
                  aria-describedby="search-results"
                  autoComplete="off"
                />
              </div>
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close search modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Results Summary */}
            {(query || hasActiveFilters) && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div>
                  {isLoading ? (
                    <span>Searching...</span>
                  ) : (
                    <span>
                      {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                      {query && ` for "${query}"`}
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="w-80 border-r border-gray-200 overflow-y-auto">
                <SearchFiltersComponent
                  products={products}
                  filters={filters}
                  onFiltersChange={setFilters}
                  className="m-4 shadow-none border-0"
                />
              </div>
            )}
            
            {/* Results Area */}
            <div className="flex-1 overflow-hidden flex flex-col">

              {/* Results */}
              <div 
                id="search-results"
                className="flex-1 overflow-y-auto"
                role="listbox"
                aria-label="Search results"
              >
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary-600 rounded-full"></div>
                    <p className="mt-2 text-gray-500">Searching...</p>
                  </div>
                ) : (query || hasActiveFilters) && displayResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No products found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : displayResults.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {displayResults.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.slug)}
                        className="w-full text-left p-4 hover:bg-gray-50 rounded-xl transition-colors group"
                        role="option"
                        aria-selected="false"
                        aria-label={`${product.name}, ${formatPrice(product.price)}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <Image
                              src={getProductMainImage(product)}
                              alt={product.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                              {stripHtml(product.short_description || product.description || '')}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-semibold text-primary-700">
                                {formatPrice(product.price)}
                              </span>
                              <div className="flex items-center gap-2">
                                {product.stock_status === 'instock' ? (
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    In Stock
                                  </span>
                                ) : (
                                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                    Out of Stock
                                  </span>
                                )}
                                {product.categories?.slice(0, 1).map((category) => (
                                  <span key={category.id} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                    {category.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">Search our organic products</p>
                    <p className="text-gray-400 text-sm mt-1">Find farm-fresh produce and organic goods</p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {filterStats.categories.slice(0, 3).map(category => (
                        <button
                          key={category}
                          onClick={() => setFilters({ category })}
                          className="text-xs text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-full transition-colors"
                        >
                          Browse {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {(query || hasActiveFilters) && filteredProducts.length > displayResults.length && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <Button
                    onClick={handleViewAllResults}
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <span>View all {filteredProducts.length} results</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}