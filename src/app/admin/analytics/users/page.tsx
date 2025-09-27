'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Activity, Calendar, TrendingUp } from 'lucide-react';

import { logger } from '@/lib/logger';
import AdminLayout from '@/components/AdminLayout';

interface AdminUser {
  username: string;
  role: string;
  permissions: string[];
}

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: number;
  topPages: Array<{ page: string; visits: number; users: number }>;
  userSessions: Array<{ date: string; sessions: number; users: number }>;
}

export default function AdminUsersAnalyticsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
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

  const fetchUserAnalytics = useCallback(async () => {
    try {
      // Fetch real user analytics from API
      const response = await fetch('/api/analytics/users', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        logger.error('Failed to fetch user analytics');
        // Set empty/default state instead of mock data
        setAnalytics({
          totalUsers: 0,
          activeUsers: 0,
          newUsers: 0,
          userGrowth: 0,
          topPages: [],
          userSessions: []
        });
      }
    } catch (error) {
      logger.error('Failed to fetch user analytics:', error as Record<string, unknown>);
      // Set empty/default state instead of mock data
      setAnalytics({
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        userGrowth: 0,
        topPages: [],
        userSessions: []
      });
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (user) {
      fetchUserAnalytics();
    }
  }, [user, fetchUserAnalytics]);

  if (loading) {
    return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    </AdminLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Analytics</h1>
          <p className="text-gray-600 mt-1">User behavior and engagement metrics</p>
        </div>
      {/* Header */}
      {/* Main Content */}
      {analytics ? (
          analytics.totalUsers === 0 ? (
            <div className="text-center py-16">
              <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">User Analytics</h3>
              <p className="text-gray-600">No data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.activeUsers.toLocaleString()}</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Users</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.newUsers.toLocaleString()}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                      <p className="text-2xl font-bold text-gray-900">+{analytics.userGrowth}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Top Pages */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Top Pages by User Traffic</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics.topPages.length > 0 ? (
                      analytics.topPages.map((page, index) => (
                        <div key={page.page} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <span className="font-medium text-gray-900">{page.page}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{page.visits.toLocaleString()} visits</span>
                            <span>{page.users.toLocaleString()} users</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No page traffic data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Sessions Chart */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">User Sessions (Last 30 Days)</h3>
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-600 mb-4">
                    Daily user sessions and unique visitors over the past month
                  </div>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No session data available for visualization</p>
                  </div>
                </div>
              </div>

              {/* User Insights - Show only if we have real data */}
              {analytics.totalUsers > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">User Insights</h3>
                  <p className="text-sm text-blue-800">
                    User insights will appear here once sufficient analytics data is collected.
                  </p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user analytics...</p>
          </div>
        )}
    </div>
    </AdminLayout>
  );
}