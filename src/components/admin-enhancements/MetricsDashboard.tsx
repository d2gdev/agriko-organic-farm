'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  DollarSign,
  Search,
  Users,
  Database,
  Activity,
  RefreshCw
} from 'lucide-react';
import MetricCard, { MetricCardProps } from './MetricCard';
import { useMetrics } from './hooks/useMetrics';
import ExportButton from './ExportButton';
import DashboardSettings, { DashboardPreferences } from './DashboardSettings';
import { logger } from '@/lib/logger';

const metricConfig: Record<string, Omit<MetricCardProps, 'value' | 'status' | 'change' | 'subtitle'> & { href?: string }> = {
  woo_products: {
    title: 'Products',
    icon: Package,
    color: 'blue',
    href: '/admin/business-intelligence'
  },
  woo_orders_today: {
    title: 'Orders Today',
    icon: ShoppingCart,
    color: 'green',
    href: '/admin/analytics/ecommerce'
  },
  woo_revenue_week: {
    title: 'Weekly Revenue',
    icon: DollarSign,
    color: 'purple',
    href: '/admin/business-intelligence'
  },
  search_queries: {
    title: 'Search Queries',
    icon: Search,
    color: 'orange',
    href: '/admin/analytics/search'
  },
  user_sessions: {
    title: 'Active Sessions',
    icon: Users,
    color: 'indigo',
    href: '/admin/analytics/users'
  },
  db_status: {
    title: 'Database Status',
    icon: Database,
    color: 'yellow',
    href: '/admin/analytics/realtime'
  },
  api_status: {
    title: 'System Status',
    icon: Activity,
    color: 'green',
    href: '/admin/analytics/realtime'
  }
};

interface MetricsDashboardProps {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}

export default function MetricsDashboard({
  refreshInterval = 30000,
  enableAutoRefresh = true
}: MetricsDashboardProps = {}) {
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    autoRefresh: enableAutoRefresh,
    refreshInterval: refreshInterval,
    showCharts: true,
    compactView: false
  });

  const { metrics, loading, error, refresh } = useMetrics(preferences.autoRefresh ? preferences.refreshInterval : undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  // Update last refresh time when metrics change
  useEffect(() => {
    if (metrics.length > 0 && !loading) {
      setLastRefresh(new Date());
    }
  }, [metrics, loading]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Metrics</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
            <p className="text-sm text-gray-600">Key metrics from all systems</p>
          </div>
          <div className="flex items-center space-x-2">
            <ExportButton
              data={metrics.map(metric => ({
                id: metric.id,
                title: metric.title,
                value: metric.value,
                status: metric.status,
                subtitle: metric.subtitle,
                lastUpdated: metric.lastUpdated?.toISOString()
              }))}
              filename="system-metrics"
              formats={['csv', 'json']}
              disabled={loading || metrics.length === 0}
              onExportStart={(format) => logger.info(`Exporting metrics as ${format}`)}
              onExportComplete={(format, success) => {
                if (success) {
                  logger.info(`Metrics exported successfully as ${format}`);
                } else {
                  logger.error(`Failed to export metrics as ${format}`);
                }
              }}
            />
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              disabled={loading || refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <DashboardSettings
              preferences={preferences}
              onPreferencesChange={setPreferences}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        {loading && metrics.length === 0 ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 ${preferences.compactView ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {metrics.map((metric) => {
              const config = metricConfig[metric.id] || {
                title: metric.title,
                icon: Activity,
                color: 'indigo' as const
              };

              return (
                <MetricCard
                  key={metric.id}
                  title={config.title}
                  value={metric.value}
                  change={metric.change}
                  icon={config.icon}
                  color={config.color}
                  status={metric.status}
                  href={config.href}
                  subtitle={metric.subtitle}
                  trendData={metric.trendData}
                  showChart={preferences.showCharts}
                />
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && metrics.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Metrics Available</h3>
            <p className="text-gray-600 mb-4">Unable to load system metrics at this time.</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Last updated info */}
        {metrics.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                {preferences.autoRefresh && (
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Auto-refresh: {preferences.refreshInterval / 1000}s</span>
                  </span>
                )}
              </div>
              <button
                onClick={handleRefresh}
                className="text-blue-600 hover:text-blue-700 underline"
                disabled={loading || refreshing}
              >
                Refresh now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}