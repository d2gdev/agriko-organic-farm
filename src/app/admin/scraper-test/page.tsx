'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Core } from '@/types/TYPE_REGISTRY';

// Types for scraped data
interface ScrapedProduct {
  title: string;
  price: Core.Money;
  availability: string;
  url?: string;
}

interface ScraperError {
  url: string;
  error: string;
}

interface ScraperResults {
  success: boolean;
  result?: {
    products?: ScrapedProduct[];
    errors?: ScraperError[];
  };
  summary?: {
    totalProducts?: number;
    errorCount?: number;
    usedRealScraping?: boolean;
  };
  message?: string;
}

export default function ScraperTestPage() {
  const [competitor, setCompetitor] = useState('whole_foods');
  const [url, setUrl] = useState('');
  const [results, setResults] = useState<ScraperResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const competitors = [
    { key: 'whole_foods', name: 'Whole Foods Market' },
    { key: 'natures_basket', name: 'Nature\'s Basket' },
    { key: 'fresh_direct', name: 'FreshDirect' },
    { key: 'walmart', name: 'Walmart' },
    { key: 'amazon_fresh', name: 'Amazon Fresh' },
    { key: 'kroger', name: 'Kroger' },
    { key: 'safeway', name: 'Safeway' },
    { key: 'instacart', name: 'Instacart' }
  ];

  const testUrls = {
    whole_foods: 'https://www.wholefoodsmarket.com/products',
    natures_basket: 'https://www.naturesbasket.co.in/products',
    fresh_direct: 'https://www.freshdirect.com/browse',
    walmart: 'https://www.walmart.com/browse/food',
    amazon_fresh: 'https://www.amazon.com/alm/storefront',
    kroger: 'https://www.kroger.com/products',
    safeway: 'https://www.safeway.com/shop',
    instacart: 'https://www.instacart.com/store'
  };

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const urlToTest = url || testUrls[competitor as keyof typeof testUrls] || 'https://example.com/product';

      const response = await fetch('/api/scrapers/test-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_service',
          competitor,
          urls: [urlToTest]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Scraper Test Interface</h1>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Competitor
              </label>
              <select
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {competitors.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Product URL (optional)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Leave empty to use test URL"
                className="w-full px-3 py-2 border rounded-md"
              />
              {!url && (
                <p className="text-sm text-gray-500 mt-1">
                  Will use default test URL: {testUrls[competitor as keyof typeof testUrls]}
                </p>
              )}
            </div>

            <button
              onClick={handleTest}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Testing...' : 'Test Scraper'}
            </button>
          </div>
        </Card>

        {error && (
          <Card className="p-6 mb-8 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
          </Card>
        )}

        {results && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Summary</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>Total Products: {results.summary?.totalProducts || 0}</div>
                  <div>Success Count: {(results.summary as any)?.successCount || 0}</div>
                  <div>Error Count: {results.summary?.errorCount || 0}</div>
                  <div>Used Real Scraping: {results.summary?.usedRealScraping ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {results.result?.products && results.result.products.length > 0 && (
                <div>
                  <h4 className="font-medium">Scraped Products</h4>
                  <div className="mt-2 space-y-2">
                    {results.result.products.map((product: ScrapedProduct, i: number) => (
                      <div key={i} className="p-3 bg-gray-100 rounded">
                        <div className="font-medium">{product.title}</div>
                        <div className="text-sm text-gray-600">
                          ${typeof product.price === 'object' ? JSON.stringify(product.price) : product.price} - {product.availability}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.result?.errors && results.result.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600">Errors</h4>
                  <div className="mt-2 space-y-2">
                    {results.result.errors.map((err: ScraperError, i: number) => (
                      <div key={i} className="p-3 bg-red-50 rounded">
                        <div className="text-sm font-medium">{err.url}</div>
                        <div className="text-sm text-red-600">{err.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium">Full Response</h4>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Admin Footer */}
      <footer className="admin-footer bg-gray-800 text-white py-4 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div>
            Admin Dashboard - Scraper Test
          </div>
          <div className="text-gray-400">
            Real Scraper v1.0 | Fallback Enabled
          </div>
        </div>
      </footer>
    </div>
  );
}