'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { WCProduct } from '@/types/woocommerce';
import { useProductFilters } from '@/hooks/useProductFilters';
import SearchFiltersComponent, { SearchFilters } from '@/components/SearchFilters';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/Button';
import { OrganicProductGridSkeleton } from '@/components/OrganicLoadingStates';

interface ProductsWithFiltersProps {
  products: WCProduct[];
}

export default function ProductsWithFilters({ products }: ProductsWithFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const initialFilters: SearchFilters = {
    category: searchParams.get('category') || undefined,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    sortBy: (searchParams.get('sortBy') as SearchFilters['sortBy']) || undefined,
    inStock: searchParams.get('inStock') === 'true' || undefined
  };

  const initialSearchQuery = searchParams.get('search') || '';

  const {
    filters,
    searchQuery,
    filteredProducts,
    filterStats,
    setFilters,
    setSearchQuery,
    hasActiveFilters,
    resetFilters
  } = useProductFilters({ 
    products, 
    initialFilters 
  });

  // Set initial search query from URL
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery, searchQuery, setSearchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filter Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            }
          >
            Filters {hasActiveFilters && `(${Object.keys(filters).length})`}
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <span>{filteredProducts.length} products</span>
            {searchQuery && (
              <span>for &quot;{searchQuery}&quot;</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
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
              onClick={() => setViewMode('list')}
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
          <select
            value={filters.sortBy || ''}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as SearchFilters['sortBy'] || undefined })}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="">Default Sort</option>
            <option value="name">Name (A-Z)</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>

      <div className="lg:flex lg:space-x-8">
        {/* Filters Sidebar */}
        <div className={`lg:w-80 lg:block ${showFilters ? 'block' : 'hidden'} mb-8 lg:mb-0`}>
          <SearchFiltersComponent
            products={products}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Products Section */}
        <div className="flex-1" id="products-section">
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No products found</h3>
              <p className="text-neutral-600 mb-4">Try adjusting your filters or search terms</p>
              {hasActiveFilters && (
                <Button onClick={resetFilters} variant="secondary">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Products Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedProducts.map((product, index) => (
                    <div key={product.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedProducts.map((product, index) => (
                    <div key={product.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
                      <ProductCard product={product} layout="list" />
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center">
                  <nav className="flex items-center space-x-2" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium ${
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
                        (page === currentPage + 2 && page < totalPages)
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
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}

              {/* Results Summary */}
              <div className="mt-8 text-center text-sm text-neutral-600">
                Showing {startIndex + 1}-{Math.min(startIndex + productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}