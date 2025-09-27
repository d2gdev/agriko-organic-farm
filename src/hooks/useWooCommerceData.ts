import { useState, useEffect, useCallback } from 'react';

interface UseWooCommerceDataOptions {
  type: 'products' | 'orders' | 'customers' | 'sales-report' | 'top-selling' | 'test-connection';
  page?: number;
  limit?: number;
  period?: 'week' | 'month' | 'year';
  search?: string;
  category?: string;
  status?: string;
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseWooCommerceDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  totalCount: number;
}

export function useWooCommerceData<T = Record<string, unknown>>(
  options: UseWooCommerceDataOptions
): UseWooCommerceDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      if (!token) {
        // Don't fetch if not authenticated - just return empty data
        setData(null);
        setError('Authentication required');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('type', options.type);

      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.period) params.append('period', options.period);
      if (options.search) params.append('search', options.search);
      if (options.category) params.append('category', options.category);
      if (options.status) params.append('status', options.status);

      const response = await fetch(`/api/data/woocommerce?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include' // Include cookies in request
      });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          // Optionally clear the token
          localStorage.removeItem('auth_token');
          return;
        }

        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || errorData?.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || result.error || 'API request failed');
      }

      setData(result.data);

      // Handle pagination metadata
      if (result.data && typeof result.data === 'object') {
        if ('totalCount' in result.data) {
          setTotalCount(result.data.totalCount as number);

          const currentPage = options.page || 1;
          const perPage = options.limit || 20;
          setHasMore(currentPage * perPage < (result.data.totalCount as number));
        }

        if ('totalPages' in result.data) {
          const currentPage = options.page || 1;
          setHasMore(currentPage < (result.data.totalPages as number));
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.warn('Failed to fetch WooCommerce data:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    options.type,
    options.page,
    options.limit,
    options.period,
    options.search,
    options.category,
    options.status
  ]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options.autoFetch]);

  // Set up refresh interval
  useEffect(() => {
    if (options.refreshInterval && options.refreshInterval > 0) {
      const interval = setInterval(() => {
        if (!loading) {
          fetchData();
        }
      }, options.refreshInterval);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [options.refreshInterval, loading, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    hasMore,
    totalCount
  };
}

// Specialized hooks for common use cases

export function useWooCommerceProducts(options?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}) {
  return useWooCommerceData({
    type: 'products',
    ...options
  });
}

export function useWooCommerceOrders(options?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useWooCommerceData({
    type: 'orders',
    ...options
  });
}

export function useWooCommerceSalesReport(period: 'week' | 'month' | 'year' = 'month') {
  return useWooCommerceData({
    type: 'sales-report',
    period,
    refreshInterval: 300000 // Refresh every 5 minutes
  });
}

export function useWooCommerceTopSelling(limit: number = 10) {
  return useWooCommerceData({
    type: 'top-selling',
    limit,
    refreshInterval: 600000 // Refresh every 10 minutes
  });
}

export function useWooCommerceConnection() {
  return useWooCommerceData({
    type: 'test-connection',
    autoFetch: true
  });
}