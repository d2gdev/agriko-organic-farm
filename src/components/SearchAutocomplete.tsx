'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { logger } from '@/lib/logger';

import { useRouter } from 'next/navigation';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ecommerceEvent } from '@/lib/gtag';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AutocompleteItem {
  id: string;
  type: 'product' | 'category' | 'query' | 'health_benefit';
  text: string;
  description?: string;
  icon?: string;
  trending?: boolean;
  count?: number;
}

interface AutocompleteApiResponse {
  suggestions: AutocompleteItem[];
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: AutocompleteItem) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  maxSuggestions?: number;
  showTrending?: boolean;
  debounceMs?: number;
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  onSearch,
  placeholder = "Search products...",
  className = "",
  maxSuggestions = 8,
  showTrending = true,
  debounceMs = 200
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Focus trap for dropdown
  const { focusFirst: _focusFirst } = useFocusTrap(dropdownRef, {
    isActive: isOpen,
    initialFocus: inputRef,
    escapeDeactivates: true,
    allowOutsideClick: true
  });
  void _focusFirst;

  // Pre-defined trending and popular searches
  const trendingSuggestions: AutocompleteItem[] = useMemo(() => [
    {
      id: 'trending-1',
      type: 'query',
      text: 'turmeric for inflammation',
      description: 'Popular health search',
      icon: '🔥',
      trending: true
    },
    {
      id: 'trending-2', 
      type: 'query',
      text: 'organic honey natural sweetener',
      description: 'Trending this week',
      icon: '📈',
      trending: true
    },
    {
      id: 'trending-3',
      type: 'query', 
      text: 'moringa superfood powder',
      description: 'Popular supplement',
      icon: '⭐',
      trending: true
    },
    {
      id: 'trending-4',
      type: 'query',
      text: 'black rice antioxidants',
      description: 'Health trend',
      icon: '🌟',
      trending: true
    }
  ], []);

  // Health benefits suggestions
  const healthBenefitSuggestions: AutocompleteItem[] = useMemo(() => [
    { id: 'health-1', type: 'health_benefit', text: 'anti-inflammatory', icon: '🩹' },
    { id: 'health-2', type: 'health_benefit', text: 'immune support', icon: '🛡️' },
    { id: 'health-3', type: 'health_benefit', text: 'digestive health', icon: '🫄' },
    { id: 'health-4', type: 'health_benefit', text: 'heart health', icon: '❤️' },
    { id: 'health-5', type: 'health_benefit', text: 'energy boost', icon: '⚡' },
    { id: 'health-6', type: 'health_benefit', text: 'brain health', icon: '🧠' },
    { id: 'health-7', type: 'health_benefit', text: 'weight management', icon: '⚖️' },
    { id: 'health-8', type: 'health_benefit', text: 'antioxidant rich', icon: '🌿' }
  ], []);

  // Category suggestions
  const categorySuggestions: AutocompleteItem[] = useMemo(() => [
    { id: 'cat-1', type: 'category', text: 'organic spices', icon: '🌶️', count: 45 },
    { id: 'cat-2', type: 'category', text: 'natural honey', icon: '🍯', count: 12 },
    { id: 'cat-3', type: 'category', text: 'herbal teas', icon: '🫖', count: 28 },
    { id: 'cat-4', type: 'category', text: 'superfood powders', icon: '🥄', count: 16 },
    { id: 'cat-5', type: 'category', text: 'organic rice', icon: '🍚', count: 8 },
    { id: 'cat-6', type: 'category', text: 'medicinal herbs', icon: '🌿', count: 34 }
  ], []);

  // Get matching predefined suggestions
  const getMatchingSuggestions = useCallback((query: string): AutocompleteItem[] => {
    const lowerQuery = query.toLowerCase();
    const matches: AutocompleteItem[] = [];

    // Match categories
    categorySuggestions.forEach(cat => {
      if (cat.text.toLowerCase().includes(lowerQuery)) {
        matches.push(cat);
      }
    });

    // Match health benefits
    healthBenefitSuggestions.forEach(benefit => {
      if (benefit.text.toLowerCase().includes(lowerQuery)) {
        matches.push(benefit);
      }
    });

    // If no matches and query is short, show trending
    if (matches.length === 0 && query.length <= 3 && showTrending) {
      matches.push(...trendingSuggestions.slice(0, 4));
    }

    return matches.slice(0, maxSuggestions);
  }, [categorySuggestions, healthBenefitSuggestions, showTrending, trendingSuggestions, maxSuggestions]);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}&limit=${maxSuggestions}`).catch(error => {
        if (error instanceof Error) {
          throw new Error(`Network error: ${error.message}`);
        }
        throw new Error(`A network error occurred: ${String(error)}`);
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json().catch(error => {
        if (error instanceof Error) {
          throw new Error(`Invalid JSON response: ${error.message}`);
        }
        throw new Error(`An error occurred while parsing JSON: ${String(error)}`);
      })) as AutocompleteApiResponse;
      const apiSuggestions: AutocompleteItem[] = data.suggestions ?? [];
      
      // Mix API suggestions with predefined ones
      const allSuggestions = [
        ...apiSuggestions,
        ...getMatchingSuggestions(query)
      ];

      // Remove duplicates and limit results
      const uniqueSuggestions = allSuggestions
        .filter((item, index, arr) => 
          arr.findIndex(t => t.text.toLowerCase() === item.text.toLowerCase()) === index
        )
        .slice(0, maxSuggestions);

      setSuggestions(uniqueSuggestions);
    } catch (error) {
      logger.error('Autocomplete error:', error as Record<string, unknown>);
      // Show a user-friendly error message
      setSuggestions([]);
      // Don't break the UI, just show predefined suggestions
      setSuggestions(getMatchingSuggestions(query));
    } finally {
      setLoading(false);
    }
  }, [maxSuggestions, getMatchingSuggestions]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value && isOpen) {
        fetchSuggestions(value).catch(error => {
          logger.error('Error in fetchSuggestions:', error as Record<string, unknown>);
          // Handle error gracefully
          setSuggestions(getMatchingSuggestions(value));
        });
      } else if (!value && isOpen && showTrending) {
        setSuggestions(trendingSuggestions.slice(0, 4));
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, isOpen, debounceMs, fetchSuggestions, getMatchingSuggestions, showTrending, trendingSuggestions]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newValue = e.target.value;
      onChange(newValue);
      
      if (newValue.trim() && !isOpen) {
        setIsOpen(true);
      }
      
      setSelectedIndex(-1);
    } catch (error) {
      logger.error('Error in handleInputChange:', error as Record<string, unknown>);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    try {
      setIsOpen(true);
      if (!value && showTrending) {
        setSuggestions(trendingSuggestions.slice(0, 4));
      }
    } catch (error) {
      logger.error('Error in handleInputFocus:', error as Record<string, unknown>);
    }
  };

  // Handle input blur
  const handleInputBlur = (_e: React.FocusEvent) => {
    // Delay closing to allow for click events on suggestions
    const timeoutId = setTimeout(() => {
      try {
        if (!dropdownRef.current?.contains(document.activeElement)) {
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      } catch (error) {
        logger.error('Error in handleInputBlur:', error as Record<string, unknown>);
      }
    }, 200);
    
    // Store timeout ID for cleanup (will be cleared by component cleanup)
    blurTimeoutRef.current = timeoutId;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    try {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'Enter' && value.trim()) {
          handleSearch(value);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
          
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length && suggestions[selectedIndex]) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          } else if (value.trim()) {
            handleSearch(value);
          }
          break;
          
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    } catch (error) {
      logger.error('Error in handleKeyDown:', error as Record<string, unknown>);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (item: AutocompleteItem) => {
    try {
      onChange(item.text);
      setIsOpen(false);
      setSelectedIndex(-1);
      
      // Track autocomplete selection
      ecommerceEvent.searchAutocomplete(item.text, item.type);
      
      if (onSelect) {
        onSelect(item);
      } else {
        handleSearch(item.text);
      }
    } catch (error) {
      logger.error('Error in handleSelectSuggestion:', error as Record<string, unknown>);
      // Still close the dropdown even if there's an error
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Handle search execution
  const handleSearch = (query: string) => {
    try {
      if (onSearch) {
        onSearch(query);
      } else {
        // Default search behavior - navigate to products page
        const params = new URLSearchParams({ search: query });
        router.push(`/products?${params.toString()}`);
      }
      setIsOpen(false);
    } catch (error) {
      logger.error('Error in handleSearch:', error as Record<string, unknown>);
      // Still close the dropdown even if there's an error
      setIsOpen(false);
    }
  };

  // Get icon for suggestion type
  const getTypeIcon = (item: AutocompleteItem) => {
    if (item.icon) return item.icon;
    
    switch (item.type) {
      case 'product': return '🛍️';
      case 'category': return '📂';
      case 'query': return '🔍';
      case 'health_benefit': return '💊';
      default: return '📝';
    }
  };

  return (
    <ErrorBoundary>
      <div className={`relative ${className}`}>
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
            aria-label="Search with autocomplete"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            autoComplete="off"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto"
            role="listbox"
            aria-label="Search suggestions"
          >
            {suggestions.length === 0 && !loading ? (
              <div className="p-4 text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm">No suggestions found</p>
              </div>
            ) : (
              <div className="py-2">
                {suggestions.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSuggestion(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors group ${
                      index === selectedIndex ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                    }`}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg flex-shrink-0">
                        {getTypeIcon(item)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 group-hover:text-primary-700 truncate">
                            {item.text}
                          </span>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                            {item.trending && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                Trending
                              </span>
                            )}
                            {item.count && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {item.count}
                              </span>
                            )}
                            {item.type !== 'query' && (
                              <span className="text-xs text-gray-400 capitalize">
                                {item.type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}