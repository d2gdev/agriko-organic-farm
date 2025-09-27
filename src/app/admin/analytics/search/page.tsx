'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, Target } from 'lucide-react';

import { logger } from '@/lib/logger';
import AdminLayout from '@/components/AdminLayout';

interface AdminUser {
  username: string;
  role: string;
  permissions: string[];
}

export default function AdminSearchAnalyticsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Search Analytics</h1>
          <p className="text-gray-600 mt-1">Search queries and performance metrics</p>
        </div>
      {/* Header */}
      {/* Main Content */}
      <div className="text-center py-16">
          <Search className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Search Analytics</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            Search analytics functionality will be implemented here.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <Search className="w-8 h-8 text-blue-500 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Search Queries</h4>
              <p className="text-sm text-gray-600">Track what users are searching for</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Search Trends</h4>
              <p className="text-sm text-gray-600">Monitor search query popularity over time</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <Target className="w-8 h-8 text-purple-500 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Search Performance</h4>
              <p className="text-sm text-gray-600">Analyze search result effectiveness</p>
            </div>
          </div>
        </div>
    </div>
    </AdminLayout>
  );
}