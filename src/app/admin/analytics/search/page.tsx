'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, TrendingUp, Target } from 'lucide-react';
import Button from '@/components/Button';

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
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/analytics')}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Analytics</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Search Analytics</h1>
                <p className="text-gray-600 mt-1">Search queries and performance insights</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Logged in as: <span className="font-medium text-green-600">{user.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  );
}