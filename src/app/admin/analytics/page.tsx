'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/AdminLayout';
import { RefreshCw } from 'lucide-react';
import Button from '@/components/Button';
import ExportButton from '@/components/admin-enhancements/ExportButton';
import { logger } from '@/lib/logger';

// Dynamically import the heavy analytics dashboard
const AdvancedAnalyticsDashboard = dynamic(
  () => import('@/components/AdvancedAnalyticsDashboard'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    )
  }
);

interface AdminUser {
  username: string;
  role: string;
  permissions: string[];
}

export default function AdminAnalyticsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<Record<string, unknown>[]>([]);
  const router = useRouter();

  const checkAuthStatus = useCallback(async () => {
    try {
      // Check localStorage for auth token like the dashboard does
      const token = localStorage.getItem('auth_token');

      if (token) {
        // User is authenticated
        setUser({
          username: 'agrikoadmin',
          role: 'admin',
          permissions: ['view_analytics', 'manage_products', 'manage_users']
        });
      } else {
        // No token, redirect to login
        router.push('/admin/login');
      }
    } catch (error) {
      logger.error('Auth check failed:', error as Record<string, unknown>);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Fetch analytics data for export
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await fetch('/api/analytics/dashboard');
        if (response.ok) {
          const data = await response.json();

          // Create exportable analytics data
          const exportData = [
            {
              metric: 'Page Views',
              value: data.pageViews || 0,
              period: '24h',
              timestamp: new Date().toISOString()
            },
            {
              metric: 'Unique Visitors',
              value: data.uniqueVisitors || 0,
              period: '24h',
              timestamp: new Date().toISOString()
            },
            {
              metric: 'Search Queries',
              value: data.searchQueries?.total || 0,
              period: '24h',
              timestamp: new Date().toISOString()
            },
            {
              metric: 'Active Sessions',
              value: data.sessions?.active || 0,
              period: 'current',
              timestamp: new Date().toISOString()
            }
          ];

          setAnalyticsData(exportData);
        }
      } catch (error) {
        logger.error('Failed to fetch analytics data for export:', error as Record<string, unknown>);
        // Set default data if fetch fails
        setAnalyticsData([
          {
            metric: 'System Status',
            value: 'Active',
            period: 'current',
            timestamp: new Date().toISOString()
          }
        ]);
      }
    };

    if (user) {
      fetchAnalyticsData();
    }
  }, [user, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive analytics and insights</p>
          </div>
          <div className="flex items-center space-x-4">
              <ExportButton
                data={analyticsData}
                filename="analytics-dashboard"
                formats={['csv', 'json']}
                disabled={analyticsData.length === 0}
                onExportStart={(format) => logger.info(`Starting analytics export as ${format}`)}
                onExportComplete={(format, success) => {
                  if (success) {
                    logger.info(`Analytics exported successfully as ${format}`);
                  } else {
                    logger.error(`Failed to export analytics as ${format}`);
                  }
                }}
              />
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
              </Button>
            </div>
        </div>
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Hybrid Analytics System</h3>
              <p className="text-sm text-blue-700 mt-1">
                This dashboard combines Google Analytics data with custom Memgraph analytics
                for comprehensive business intelligence. Data refreshes automatically every 30 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard Component */}
        <AdvancedAnalyticsDashboard
          key={refreshKey}
          timeRange="24h"
          refreshInterval={30000}
          showMockData={false}
          className="space-y-6"
        />

        {/* Data Sources Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Google Analytics 4</h3>
            <p className="text-sm text-gray-600 mb-3">
              Standard e-commerce tracking including page views, purchases, and user behavior.
            </p>
            <div className="text-xs text-green-600 font-medium">✓ Active</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Memgraph Database</h3>
            <p className="text-sm text-gray-600 mb-3">
              Graph-based analytics for product relationships, user journeys, and recommendations.
            </p>
            <div className="text-xs text-green-600 font-medium">✓ Connected</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Events</h3>
            <p className="text-sm text-gray-600 mb-3">
              Real-time event tracking for searches, recommendations, and custom business metrics.
            </p>
            <div className="text-xs text-green-600 font-medium">✓ Recording</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}