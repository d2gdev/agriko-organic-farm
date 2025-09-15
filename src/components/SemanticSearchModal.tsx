'use client';

import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, getProductMainImage, stripHtml } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import Button from '@/components/Button';
import { ecommerceEvent } from '@/lib/gtag';
import SearchLoadingState from '@/components/SearchLoadingState';

interface SemanticResult {
  productId: number;
  slug: string;
  title: string;
  price: string;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  relevanceScore: number;
  timestamp: string;
}

interface SemanticSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SemanticSearchModal({ isOpen, onClose }: SemanticSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'traditional' | 'semantic'>('semantic');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  // Semantic search function
  const performSemanticSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/semantic?q=${encodeURIComponent(searchQuery)}&limit=8`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      const searchResults = data.results ?? [];
      setResults(searchResults);
      
      // Track semantic search event in GA4
      const avgRelevance = searchResults.length > 0 
        ? searchResults.reduce((sum: number, result: SemanticResult) => sum + result.relevanceScore, 0) / searchResults.length 
        : 0;
      
      ecommerceEvent.semanticSearch(
        searchQuery.trim(),
        searchResults.length,
        Math.round(avgRelevance * 100) / 100
      );
    } catch (error) {
      logger.error('Semantic search error:', error as Record<string, unknown>);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchMode === 'semantic') {
        performSemanticSearch(query);
      } else {
        setIsLoading(false);
      }
    }, 500); // Longer debounce for API calls

    return () => clearTimeout(timeoutId);
  }, [query, searchMode]); // performSemanticSearch is stable, defined in component

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

  const getSuggestionQueries = () => [
    'organic rice for healthy meals',
    'turmeric tea for wellness',
    'natural honey sweetener',
    'moringa superfood powder',
    'traditional filipino salabat',
    'healthy herbal blends'
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="semantic-search-modal-title"
      aria-describedby="semantic-search-modal-description"
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
              id="semantic-search-modal-title" 
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              🧠 Semantic Search
            </h2>
            <p 
              id="semantic-search-modal-description" 
              className="text-sm text-gray-600 mb-4"
            >
              Search using natural language! Try &quot;healthy turmeric for inflammation&quot; or &quot;organic rice for cooking&quot;
            </p>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Try: 'healthy organic rice for diabetes' or 'turmeric for joint pain'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  aria-label="Semantic search products"
                  aria-describedby="search-results"
                  autoComplete="off"
                />
              </div>

              {/* Search Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSearchMode('semantic')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    searchMode === 'semantic'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🧠 Smart
                </button>
                <button
                  onClick={() => setSearchMode('traditional')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    searchMode === 'traditional'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📝 Text
                </button>
              </div>

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
            {query && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div>
                  {isLoading ? (
                    <span>🔍 Searching with AI...</span>
                  ) : (
                    <span>
                      ✨ Found {results.length} semantic matches for &quot;{query}&quot;
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Results */}
            <div 
              id="search-results"
              className="flex-1 overflow-y-auto"
              role="listbox"
              aria-label="Semantic search results"
            >
              {isLoading ? (
                <SearchLoadingState message="🧠 AI is finding the best matches..." />
              ) : query && results.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No semantic matches found</p>
                  <p className="text-gray-400 text-sm mt-1">Try different keywords or a more descriptive search</p>
                </div>
              ) : results.length > 0 ? (
                <div className="p-4 space-y-3">
                  {results.map((result, index) => (
                    <button
                      key={`${result.productId}-${index}`}
                      onClick={() => handleProductClick(result.slug)}
                      className="w-full text-left p-4 hover:bg-gray-50 rounded-xl transition-colors group border border-gray-100 hover:border-primary-200"
                      role="option"
                      aria-selected="false"
                      aria-label={`${result.title}, ${formatPrice(result.price)}, relevance ${(result.relevanceScore * 100).toFixed(1)}%`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1">
                              {result.title}
                            </h3>
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                              {(result.relevanceScore * 100).toFixed(1)}% match
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-semibold text-primary-700 text-lg">
                              ₱{result.price}
                            </span>
                            <div className="flex items-center gap-2">
                              {result.inStock ? (
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                  Out of Stock
                                </span>
                              )}
                              {result.featured && (
                                <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {result.categories?.slice(0, 3).map((category, idx) => (
                              <span key={idx} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                {category}
                              </span>
                            ))}
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
                  <div className="text-primary-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">🧠 Semantic Search</p>
                  <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                    Search using natural language! Describe what you&apos;re looking for, its health benefits, or how you plan to use it.
                  </p>
                  <div className="mt-6 space-y-2">
                    <p className="text-sm font-medium text-gray-600 mb-3">Try these examples:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {getSuggestionQueries().map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(suggestion)}
                          className="text-xs text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-full transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}