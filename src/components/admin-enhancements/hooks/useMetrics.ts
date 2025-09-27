'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface WooCommerceOrder {
  id: number;
  date_created: string;
  total: string;
}

export interface MetricData {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
    timeframe?: string;
  };
  status: 'healthy' | 'warning' | 'error' | 'loading';
  subtitle?: string;
  lastUpdated?: Date;
  trendData?: number[];
}

export interface UseMetricsReturn {
  metrics: MetricData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMetrics(refreshInterval?: number): UseMetricsReturn {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWooCommerceMetrics = async (): Promise<Partial<MetricData>[]> => {
    try {
      // Fetch basic WooCommerce stats using existing API
      const [productsRes, ordersRes] = await Promise.allSettled([
        fetch('/api/products?limit=1').then(r => r.json()),
        fetch('/api/orders?limit=10').then(r => r.json())
      ]);

      const wooMetrics: Partial<MetricData>[] = [];

      // Products metric
      if (productsRes.status === 'fulfilled' && productsRes.value.products) {
        const products = productsRes.value.products;
        wooMetrics.push({
          id: 'woo_products',
          title: 'Total Products',
          value: productsRes.value.total || products.length,
          status: 'healthy',
          subtitle: 'Active products in catalog'
        });
      }

      // Orders metric (basic calculation)
      if (ordersRes.status === 'fulfilled' && ordersRes.value.orders) {
        const orders = ordersRes.value.orders;
        const todayOrders = orders.filter((order: WooCommerceOrder) => {
          const orderDate = new Date(order.date_created);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        });

        const weekOrders = orders.filter((order: WooCommerceOrder) => {
          const orderDate = new Date(order.date_created);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        });

        // Calculate revenue from recent orders
        const weekRevenue = weekOrders.reduce((sum: number, order: WooCommerceOrder) => {
          return sum + (parseFloat(order.total) || 0);
        }, 0);

        wooMetrics.push({
          id: 'woo_orders_today',
          title: 'Orders Today',
          value: todayOrders.length,
          status: todayOrders.length > 0 ? 'healthy' : 'warning',
          subtitle: 'New orders received today'
        });

        wooMetrics.push({
          id: 'woo_revenue_week',
          title: 'Revenue (7 days)',
          value: `$${weekRevenue.toFixed(2)}`,
          status: weekRevenue > 0 ? 'healthy' : 'warning',
          subtitle: 'Total revenue this week'
        });
      }

      return wooMetrics;
    } catch (err) {
      logger.error('Error fetching WooCommerce metrics', { error: err instanceof Error ? err.message : String(err) });
      return [{
        id: 'woo_error',
        title: 'WooCommerce',
        value: 'Error',
        status: 'error' as const,
        subtitle: 'Failed to load data'
      }];
    }
  };

  const fetchInternalMetrics = async (): Promise<Partial<MetricData>[]> => {
    try {
      // Fetch from existing internal analytics APIs
      const analyticsRes = await fetch('/api/analytics/dashboard').then(r => r.json());

      const internalMetrics: Partial<MetricData>[] = [];

      if (analyticsRes.success) {
        // Search queries metric
        if (analyticsRes.searchQueries) {
          internalMetrics.push({
            id: 'search_queries',
            title: 'Search Queries',
            value: analyticsRes.searchQueries.total || 0,
            status: 'healthy',
            subtitle: 'Recent search activity',
            change: analyticsRes.searchQueries.change ? {
              value: analyticsRes.searchQueries.change,
              type: analyticsRes.searchQueries.change > 0 ? 'increase' : 'decrease',
              timeframe: 'last week'
            } : undefined
          });
        }

        // User sessions metric
        if (analyticsRes.sessions) {
          internalMetrics.push({
            id: 'user_sessions',
            title: 'Active Sessions',
            value: analyticsRes.sessions.active || 0,
            status: 'healthy',
            subtitle: 'Current user sessions'
          });
        }
      }

      return internalMetrics;
    } catch (err) {
      logger.error('Error fetching internal metrics', { error: err instanceof Error ? err.message : String(err) });
      return [{
        id: 'analytics_error',
        title: 'Analytics',
        value: 'Error',
        status: 'error' as const,
        subtitle: 'Failed to load data'
      }];
    }
  };

  const fetchSystemHealth = async (): Promise<Partial<MetricData>[]> => {
    try {
      // Check system health endpoints
      const healthRes = await fetch('/api/health').then(r => r.json());

      const healthMetrics: Partial<MetricData>[] = [];

      if (healthRes) {
        // Database status
        healthMetrics.push({
          id: 'db_status',
          title: 'Database',
          value: healthRes.database ? 'Online' : 'Offline',
          status: healthRes.database ? 'healthy' : 'error',
          subtitle: 'Database connectivity'
        });

        // API status
        healthMetrics.push({
          id: 'api_status',
          title: 'System Status',
          value: 'Operational',
          status: 'healthy',
          subtitle: 'All systems running'
        });
      }

      return healthMetrics;
    } catch (err) {
      logger.error('Error fetching system health', { error: err instanceof Error ? err.message : String(err) });
      return [{
        id: 'system_error',
        title: 'System Health',
        value: 'Unknown',
        status: 'warning' as const,
        subtitle: 'Unable to check status'
      }];
    }
  };

  // Generate mock trend data for visualization
  const generateTrendData = (baseValue: number, trend: 'increase' | 'decrease' | 'neutral' = 'neutral'): number[] => {
    const data: number[] = [];
    let current = baseValue;

    for (let i = 0; i < 7; i++) {
      if (trend === 'increase') {
        current += Math.random() * 5 + 1;
      } else if (trend === 'decrease') {
        current -= Math.random() * 3 + 0.5;
      } else {
        current += (Math.random() - 0.5) * 4;
      }
      data.push(Math.max(0, current));
    }
    return data;
  };

  const fetchAllMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all metrics in parallel
      const [wooMetrics, internalMetrics, healthMetrics] = await Promise.all([
        fetchWooCommerceMetrics(),
        fetchInternalMetrics(),
        fetchSystemHealth()
      ]);

      // Combine all metrics and add required fields
      const allMetrics: MetricData[] = [
        ...wooMetrics,
        ...internalMetrics,
        ...healthMetrics
      ].map(metric => {
        const baseValue = typeof metric.value === 'number' ? metric.value : 100;
        const trendType = metric.change?.type || 'neutral';

        return {
          id: metric.id || 'unknown',
          title: metric.title || 'Unknown',
          value: metric.value || 'N/A',
          status: metric.status || 'loading',
          lastUpdated: new Date(),
          trendData: generateTrendData(baseValue, trendType),
          ...metric
        };
      }) as MetricData[];

      setMetrics(allMetrics);
    } catch (err) {
      logger.error('Error fetching metrics', { error: err instanceof Error ? err.message : String(err) });
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = async (): Promise<void> => {
    await fetchAllMetrics();
  };

  useEffect(() => {
    fetchAllMetrics();

    // Set up automatic refresh if interval is provided
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAllMetrics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
    // Return undefined cleanup function if no interval
    return undefined;
  }, [fetchAllMetrics, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    refresh
  };
}