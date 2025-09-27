'use client';

import { Core } from '@/types/TYPE_REGISTRY';
import { useState } from 'react';
import { logger } from '@/lib/logger';

import Link from 'next/link';

interface SearchResult {
  productId: number;
  slug: string;
  title: string;
  price: Core.Money;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  relevanceScore: number;
}

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/semantic?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json() as { results: SearchResult[] };
      setResults(data.results || []);
    } catch (error) {
      logger.error('Search error:', error as Record<string, unknown>);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    'turmeric tea for inflammation',
    'organic rice for diabetics',
    'natural honey sweetener',
    'moringa superfood nutrients',
    'traditional filipino ginger tea',
    'healthy herbal blend for wellness'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧠 Semantic Search Test
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test our AI-powered semantic search! Try natural language queries about health benefits, uses, or descriptions.
          </p>
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Back to Home
          </Link>
        </div>

        {/* Search Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 'healthy organic rice for cooking' or 'turmeric for joint pain'"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
            />
            <button
              onClick={performSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Example Queries */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-3">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(example)}
                  className="text-xs text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-3 border-current border-t-transparent text-primary-600 rounded-full"></div>
            <p className="mt-3 text-gray-500">🧠 AI is finding the best matches...</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ✨ Found {results.length} semantic matches
            </h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-primary-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {result.title}
                    </h3>
                    <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                      {(result.relevanceScore * 100).toFixed(1)}% match
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-2xl font-bold text-primary-600">
                      ₱{result.price}
                    </span>
                    <div className="flex items-center gap-2">
                      {result.inStock ? (
                        <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          ✅ In Stock
                        </span>
                      ) : (
                        <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          ❌ Out of Stock
                        </span>
                      )}
                      {result.featured && (
                        <span className="text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.categories?.map((category: string, idx: number) => (
                      <span key={idx} className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    href={`/product/${result.slug}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Product
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {query && !isLoading && results.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-xl text-gray-500">No semantic matches found</p>
            <p className="text-gray-400 mt-2">Try different keywords or a more descriptive search</p>
          </div>
        )}
      </div>
    </div>
  );
}