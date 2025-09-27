'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WCProduct } from '@/types/woocommerce';
import { SerializedWCProduct, deserializeProduct } from '@/lib/product-serializer';
import SearchFiltersComponent, { SearchFilters } from '@/components/SearchFilters';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/Button';
import { Money } from '@/lib/money';

interface ProductsWithFiltersProps {
  products: SerializedWCProduct[];
  searchParams?: Record<string, string | undefined>;
  totalProducts?: number;
  totalPages?: number;
  currentPage?: number;
}

export default function ProductsWithFilters({
  products,
  searchParams = {},
  totalProducts = 0,
  totalPages = 1,
  currentPage: serverCurrentPage = 1
}: ProductsWithFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(serverCurrentPage);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const productsPerPage = 12;
  const router = useRouter();
  
  // Initialize filters from URL params (server-side params take precedence)
  const initialFilters: SearchFilters = {
    category: searchParams.category ?? undefined,
    minPrice: searchParams.minPrice ? Money.pesos(parseFloat(searchParams.minPrice)) : undefined,
    maxPrice: searchParams.maxPrice ? Money.pesos(parseFloat(searchParams.maxPrice)) : undefined,
    sortBy: (searchParams.sortBy as SearchFilters['sortBy']) ?? undefined,
    inStock: searchParams.inStock === 'true' ? true : undefined
  };

  const initialSearchQuery = searchParams.search ?? '';

  // Server-side filtering means we don't need client-side filtering
  // Just display the products as-is from the server
  const displayProducts = products;
  const displayTotalProducts = totalProducts;
  const displayTotalPages = totalPages;

  // Simple filter state for UI display (no actual filtering)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.sortBy ||
    filters.inStock ||
    searchQuery
  );

  // Helper function to navigate with loading state
  const navigateWithLoading = useCallback((url: string) => {
    setIsNavigating(true);
    router.push(url);
    // Loading state will be cleared by useEffect when new props arrive
  }, [router]);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    navigateWithLoading(window.location.pathname);
  }, [navigateWithLoading]);

  // Calculate display indices for current page
  const startIndex = (currentPage - 1) * productsPerPage;

  // Sync current page with server page and clear loading state
  useEffect(() => {
    setCurrentPage(serverCurrentPage);
    setIsNavigating(false);
  }, [serverCurrentPage]);

  // Clear loading state when products change (navigation completed)
  useEffect(() => {
    setIsNavigating(false);
  }, [products]);

  // Handle mounted state for hydration safety
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Handle online/offline detection - hydration safe
  useEffect(() => {
    if (!hasMounted) return; // Wait for hydration

    const handleOnline = () => {
      setIsOffline(false);
      setOfflineMessage('');
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineMessage('You are currently offline. Some features may be limited.');
    };

    // Check initial state only after mounting to avoid hydration mismatch
    if (!navigator.onLine) {
      setIsOffline(true);
      setOfflineMessage('You are currently offline. Some features may be limited.');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasMounted]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);

    // Update URL and navigate
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set('page', page.toString());
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    navigateWithLoading(newUrl);

    // Smooth scroll to top of results with offset for header
    const element = document.getElementById('products-section');
    if (element) {
      const offsetTop = element.offsetTop - 80; // 80px offset for header
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }, [navigateWithLoading]);

  // Optimized event handlers
  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const switchToGrid = useCallback(() => {
    setViewMode('grid');
  }, []);

  const switchToList = useCallback(() => {
    setViewMode('list');
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value as SearchFilters['sortBy'] ?? undefined;
    setFilters({ ...filters, sortBy: newSortBy });

    // Update URL and navigate smoothly
    const newSearchParams = new URLSearchParams(window.location.search);
    if (newSortBy) {
      newSearchParams.set('sortBy', newSortBy);
    } else {
      newSearchParams.delete('sortBy');
    }
    newSearchParams.set('page', '1'); // Reset to first page
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    navigateWithLoading(newUrl);
  }, [filters, navigateWithLoading]);

  // Handle filter changes from the filter component
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);

    // Build URL with new filters
    const newSearchParams = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        newSearchParams.set(key, value.toString());
      }
    });

    // Add existing search query if present
    if (searchQuery) {
      newSearchParams.set('search', searchQuery);
    }

    // Reset to first page when filters change
    newSearchParams.set('page', '1');

    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    navigateWithLoading(newUrl);
  }, [searchQuery, navigateWithLoading]);

  // Handle search changes
  const handleSearchChange = useCallback((newSearchQuery: string) => {
    setSearchQuery(newSearchQuery);

    // Build URL with search
    const newSearchParams = new URLSearchParams(window.location.search);

    if (newSearchQuery.trim()) {
      newSearchParams.set('search', newSearchQuery.trim());
    } else {
      newSearchParams.delete('search');
    }

    // Reset to first page when search changes
    newSearchParams.set('page', '1');

    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    navigateWithLoading(newUrl);
  }, [navigateWithLoading]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Offline Notification */}
      {isOffline && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">Offline Mode</p>
            <p className="text-yellow-700 text-sm">{offlineMessage} Cached products are shown below.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-md text-sm font-medium hover:bg-yellow-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={toggleFilters}
            className="lg:hidden"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            }
          >
            Filters {hasActiveFilters && `(${Object.values(filters).filter(Boolean).length})`}
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <span>{displayTotalProducts} products</span>
            {searchQuery && (
              <span>for &quot;{searchQuery}&quot;</span>
            )}
            {hasActiveFilters && (
              <span className="text-primary-600">• {Object.values(filters).filter(Boolean).length} filters active</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-1">
            <button
              onClick={switchToGrid}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={switchToList}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Quick Sort */}
          <div className="relative">
            <select
              value={filters.sortBy ?? ''}
              onChange={handleSortChange}
              disabled={isNavigating}
              className={`px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm ${
                isNavigating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Default Sort</option>
              <option value="name">Name (A-Z)</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="popularity">Most Popular</option>
            </select>
            {isNavigating && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:flex lg:space-x-8">
        {/* Filters Sidebar */}
        <div className={`lg:w-80 lg:block ${showFilters ? 'block' : 'hidden'} mb-8 lg:mb-0`}>
          <SearchFiltersComponent
            products={products}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            isLoading={isNavigating}
          />
        </div>

        {/* Products Section */}
        <div className="flex-1" id="products-section">
          {displayProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No products found</h3>
              <p className="text-neutral-600 mb-4">Try adjusting your filters or search terms</p>
              {hasActiveFilters && (
                <Button onClick={resetFilters} variant="secondary" disabled={isNavigating}>
                  {isNavigating ? 'Clearing...' : 'Clear all filters'}
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Products Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {displayProducts.map((product, index) => (
                    <div key={product.id} className="animate-fadeInUp" suppressHydrationWarning style={{ animationDelay: `${index * 50}ms` }}>
                      <ProductCard
                        product={product}
                        priority={index < 4}
                        fetchPriority={index < 4 ? "high" : "auto"}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {displayProducts.map((product, index) => (
                    <div key={product.id} className="animate-fadeInUp" suppressHydrationWarning style={{ animationDelay: `${index * 50}ms` }}>
                      <ProductCard
                        product={product}
                        layout="list"
                        priority={index < 4}
                        fetchPriority={index < 4 ? "high" : "auto"}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {displayTotalPages > 1 && (
                <div className="mt-12 flex items-center justify-center">
                  <nav className={`flex items-center space-x-2 ${isNavigating ? 'opacity-50' : ''}`} aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isNavigating}
                      className="p-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {Array.from({ length: Math.min(displayTotalPages, 100) }, (_, i) => i + 1).map(page => {
                      if (
                        page === 1 ||
                        page === displayTotalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            disabled={isNavigating}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium disabled:cursor-not-allowed ${
                              page === currentPage
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        (page === currentPage - 2 && page > 1) ||
                        (page === currentPage + 2 && page < displayTotalPages)
                      ) {
                        return (
                          <span key={page} className="px-2 text-neutral-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === displayTotalPages || isNavigating}
                      className="p-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                  {isNavigating && (
                    <div className="ml-4 flex items-center text-sm text-neutral-500">
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading...
                    </div>
                  )}
                </div>
              )}

              {/* Results Summary */}
              <div className="mt-8 text-center text-sm text-neutral-600">
                Showing {startIndex + 1}-{Math.min(startIndex + productsPerPage, displayTotalProducts)} of {displayTotalProducts} products
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}