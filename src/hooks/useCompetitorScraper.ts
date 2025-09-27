import { useState, useCallback } from 'react';
import { ScrapingResult } from '@/types/scraping';

interface UseCompetitorScraperOptions {
  onSuccess?: (results: ScrapingResult[]) => void;
  onError?: (error: string) => void;
}

interface CompetitorInfo {
  key: string;
  name: string;
  baseUrl: string;
}

interface ScrapingResponse {
  results: ScrapingResult[];
  summary: {
    totalCompetitors: number;
    successfulScrapers: number;
    totalProducts: number;
    errors: Array<{ competitor: string; error: string }>;
  };
  scrapedAt: string;
  requestedUrls: string[];
}

interface UseCompetitorScraperReturn {
  // State
  loading: boolean;
  error: string | null;
  results: ScrapingResult[] | null;
  competitors: CompetitorInfo[] | null;

  // Actions
  scrapeCompetitor: (competitor: string, urls: string[]) => Promise<void>;
  scrapeAllCompetitors: (urls: string[]) => Promise<void>;
  getAvailableCompetitors: () => Promise<void>;
  clearResults: () => void;
  clearError: () => void;

  // Utils
  getSuccessfulResults: () => ScrapingResult[];
  getFailedResults: () => ScrapingResult[];
  getTotalProducts: () => number;
}

export function useCompetitorScraper(options: UseCompetitorScraperOptions = {}): UseCompetitorScraperReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScrapingResult[] | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorInfo[] | null>(null);

  const handleApiCall = useCallback(async (
    url: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
  ) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    // Only add Authorization header if token exists and is not empty
    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      credentials: 'include', // Include cookies as fallback
      ...(body && { body: JSON.stringify(body) })
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use default message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }, []);

  const scrapeCompetitor = useCallback(async (competitor: string, urls: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const response = await handleApiCall('/api/scrapers/competitors-public', 'POST', {
        competitor,
        urls,
        action: 'scrape'
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Scraping failed');
      }

      const scrapingData: ScrapingResponse = response.data;
      setResults(scrapingData.results);

      options.onSuccess?.(scrapingData.results);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      console.error('Competitor scraping error:', err);
    } finally {
      setLoading(false);
    }
  }, [handleApiCall, options]);

  const scrapeAllCompetitors = useCallback(async (urls: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const response = await handleApiCall('/api/scrapers/competitors-public', 'POST', {
        urls,
        action: 'scrape'
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Scraping failed');
      }

      const scrapingData: ScrapingResponse = response.data;
      setResults(scrapingData.results);

      options.onSuccess?.(scrapingData.results);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      console.error('Competitor scraping error:', err);
    } finally {
      setLoading(false);
    }
  }, [handleApiCall, options]);

  const getAvailableCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await handleApiCall('/api/scrapers/competitors-public', 'GET');

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch competitors');
      }

      setCompetitors(response.data.competitors);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching competitors:', err);
    } finally {
      setLoading(false);
    }
  }, [handleApiCall]);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Utility functions
  const getSuccessfulResults = useCallback((): ScrapingResult[] => {
    return results?.filter(result => result.success) || [];
  }, [results]);

  const getFailedResults = useCallback((): ScrapingResult[] => {
    return results?.filter(result => !result.success) || [];
  }, [results]);

  const getTotalProducts = useCallback((): number => {
    return results?.reduce((total, result) => total + (result.productsFound || result.totalProducts || 0), 0) || 0;
  }, [results]);

  return {
    // State
    loading,
    error,
    results,
    competitors,

    // Actions
    scrapeCompetitor,
    scrapeAllCompetitors,
    getAvailableCompetitors,
    clearResults,
    clearError,

    // Utils
    getSuccessfulResults,
    getFailedResults,
    getTotalProducts
  };
}

// Specialized hook for getting competitors list
export function useCompetitorsList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorInfo[]>([]);

  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/scrapers/competitors-public', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch competitors');
      }

      const data = await response.json();
      if (data.success) {
        setCompetitors(data.data.competitors);
      } else {
        throw new Error(data.error?.message || 'API request failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching competitors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    competitors,
    loading,
    error,
    fetchCompetitors,
    refetch: fetchCompetitors
  };
}