'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, DollarSign, Package, TrendingUp } from 'lucide-react';

import { logger } from '@/lib/logger';
import AdminLayout from '@/components/AdminLayout';

interface AdminUser {
  username: string;
  role: string;
  permissions: string[];
}

interface EcommerceAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  recentOrders: Array<{ id: string; customer: string; total: number; status: string; date: string }>;
}

export default function AdminEcommerceAnalyticsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<EcommerceAnalytics | null>(null);
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

  const fetchEcommerceAnalytics = useCallback(async () => {
    try {
      // Fetch real ecommerce analytics from API
      const response = await fetch('/api/analytics/ecommerce', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        logger.error('Failed to fetch ecommerce analytics');
        // Set empty/default state instead of mock data
        setAnalytics({
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          conversionRate: 0,
          topProducts: [],
          recentOrders: []
        });
      }
    } catch (error) {
      logger.error('Failed to fetch ecommerce analytics:', error as Record<string, unknown>);
      // Set empty/default state instead of mock data
      setAnalytics({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        topProducts: [],
        recentOrders: []
      });
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (user) {
      fetchEcommerceAnalytics();
    }
  }, [user, fetchEcommerceAnalytics]);

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">E-Commerce Analytics</h1>
          <p className="text-gray-600 mt-1">Sales metrics and performance data</p>
        </div>
      {analytics ? (
          analytics.totalRevenue === 0 && analytics.totalOrders === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ecommerce Analytics</h3>
              <p className="text-gray-600">No data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders.toLocaleString()}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                      <p className="text-2xl font-bold text-gray-900">${analytics.averageOrderValue.toFixed(2)}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics.topProducts.length > 0 ? (
                      analytics.topProducts.map((product, index) => (
                        <div key={product.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <span className="font-medium text-gray-900">{product.name}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{product.sales} sold</span>
                            <span>${product.revenue.toLocaleString()} revenue</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No product sales data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics.recentOrders.length > 0 ? (
                      analytics.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-500">#{order.id}</span>
                            <span className="font-medium text-gray-900">{order.customer}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-600">${order.total.toFixed(2)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status}
                            </span>
                            <span className="text-gray-600">{order.date}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No recent orders available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ecommerce analytics...</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}