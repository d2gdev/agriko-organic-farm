'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CompetitorConfig } from '@/types/business-intelligence-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { clientScraper } from '@/lib/scrapers/client-scraper-service';
import { ScrapingResult } from '@/types/scraping';
// Unused imports removed
// import { RefreshCw, Plus, Trash2, AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';

export default function CompetitorScraper() {
  const [urls, setUrls] = useState<string[]>(['']);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [competitors, setCompetitors] = useState<Array<{
    id: string;
    name: string;
    key: string;
    enabled: boolean;
  }>>([]);
  const [competitorsLoading, setCompetitorsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recentJobs, setRecentJobs] = useState<Array<{
    id: string;
    status: string;
    createdAt: Date;
    competitor?: { name: string };
  }>>([]);
  const [systemStatus, setSystemStatus] = useState<{
    status: string;
    uptime: number;
    activeJobs: number;
  } | null>(null);

  useEffect(() => {
    fetchCompetitors();
    fetchSystemStatus();
  }, []);

  const fetchCompetitors = async () => {
    setCompetitorsLoading(true);
    try {
      const response = await fetch('/api/competitors/config');
      const data = await response.json();
      if (data.success) {
        setCompetitors(data.competitors.filter((c: { enabled: boolean }) => c.enabled));
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
    } finally {
      setCompetitorsLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const status = await clientScraper.getStatus();
      setSystemStatus(status);

      const jobs = await clientScraper.getRecentJobs();
      setRecentJobs(jobs);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const handleAddUrl = () => {
    setUrls([...urls, '']);
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleScrape = async () => {
    const validUrls = urls.filter(url => url.trim() !== '');
    if (validUrls.length === 0) {
      setError('Please enter at least one URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      let scrapingResults: ScrapingResult[];

      if (selectedCompetitor) {
        const result = await clientScraper.scrapeCompetitor(selectedCompetitor, validUrls);
        scrapingResults = [result];
      } else {
        scrapingResults = await clientScraper.scrapeAllCompetitors(validUrls);
      }

      setResults(scrapingResults);

      // Refresh status after scraping
      await fetchSystemStatus();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Scraping failed');
    } finally {
      setLoading(false);
    }
  };

  const _testProxy = async () => { // Currently unused
    const testUrl = urls[0] || 'https://example.com';
    try {
      const result = await clientScraper.testProxy(testUrl);
      // Proxy test result logged to console
      console.log(`Proxy test ${result.success ? 'successful' : 'failed'}. Check console for details.`);
    } catch (error) {
      console.error('Proxy test failed:', error);
      alert('Proxy test failed. Check console for details.');
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const clearError = () => {
    setError(null);
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getAvailabilityBadge = (availability: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      in_stock: 'success',
      'In Stock': 'success',
      pre_order: 'warning',
      'Pre-order': 'warning',
      out_of_stock: 'danger',
      'Out of Stock': 'danger'
    };

    return (
      <Badge variant={variants[availability] || 'default'}>
        {availability.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Missing utility functions
  const getSuccessfulResults = () => {
    return results.filter(r => r.success);
  };

  const getFailedResults = () => {
    return results.filter(r => !r.success);
  };

  const getTotalProducts = () => {
    return results.reduce((sum, r) => sum + (r.totalProducts || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Scraper Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Product Scraper</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Competitor Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Competitor (leave empty to scrape all)
            </label>
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={competitorsLoading}
            >
              <option value="">All Competitors</option>
              {competitors.map((competitor) => (
                <option key={competitor.key} value={competitor.key}>
                  {competitor.name}
                </option>
              ))}
            </select>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Product URLs to Scrape
            </label>
            <div className="space-y-2">
              {urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://competitor.com/product-url"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleRemoveUrl(index)}
                    variant="outline"
                    disabled={urls.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button onClick={handleAddUrl} variant="outline" size="sm">
                Add URL
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleScrape}
              disabled={loading || urls.every(url => url.trim() === '')}
            >
              {loading ? 'Scraping...' : 'Start Scraping'}
            </Button>
            <Button
              onClick={clearResults}
              variant="outline"
              disabled={results.length === 0}
            >
              Clear Results
            </Button>
            {error && (
              <Button
                onClick={clearError}
                variant="outline"
              >
                Clear Error
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraping Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                <div className="text-sm text-gray-600">Competitors Scraped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getSuccessfulResults().length}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getFailedResults().length}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{getTotalProducts()}</div>
                <div className="text-sm text-gray-600">Products Found</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {results && results.map((result) => (
        <Card key={result.competitorName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.competitorName}
              <Badge variant={result.success ? 'success' : 'danger'}>
                {result.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Found {result.productsFound || result.totalProducts || 0} products at {
                    result.scrapedAt
                      ? (typeof result.scrapedAt === 'string'
                          ? new Date(result.scrapedAt).toLocaleString()
                          : result.scrapedAt.toLocaleString())
                      : 'Unknown time'
                  }
                </div>

                {(result.data || result.products)?.length > 0 ? (
                  <div className="grid gap-4">
                    {(result.data || result.products)?.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">{product.name || product.title}</h4>
                          {getAvailabilityBadge(product.availability)}
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Price: </span>
                            <span className="text-lg font-bold text-green-600">
                              {formatPrice(product.price, product.currency)}
                            </span>
                          </div>
                          {product.category && (
                            <div>
                              <span className="font-medium">Category: </span>
                              {product.category}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Last Updated: </span>
                            {product.lastUpdated
                              ? new Date(product.lastUpdated).toLocaleString()
                              : 'Unknown'
                            }
                          </div>
                          <div>
                            <span className="font-medium">Source: </span>
                            <a
                              href={product.url || product.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Product
                            </a>
                          </div>
                        </div>

                        {product.description && (
                          <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No products found
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">
                  <strong>Error:</strong> {result.error || 'Unknown error occurred'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Available Competitors Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Competitors</CardTitle>
        </CardHeader>
        <CardContent>
          {competitorsLoading ? (
            <div className="text-center py-4">Loading competitors...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {competitors.map((competitor) => (
                <div
                  key={competitor.key}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <h4 className="font-medium">{competitor.name}</h4>
                  <p className="text-sm text-gray-600">{(competitor as CompetitorConfig).baseUrl || ''}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}