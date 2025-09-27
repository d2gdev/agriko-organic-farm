'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import MetricsDashboard from '@/components/admin-enhancements/MetricsDashboard';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Calendar,
  type LucideIcon
} from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  color: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const metrics: Metric[] = [
    {
      label: 'Total Revenue',
      value: '$12,345',
      change: 12.5,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Total Orders',
      value: '156',
      change: -3.2,
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    {
      label: 'Active Users',
      value: '2,345',
      change: 8.1,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      label: 'Conversion Rate',
      value: '3.45%',
      change: 0.8,
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  const recentOrders = [
    { id: '#12345', customer: 'John Doe', total: '$234.00', status: 'Completed', time: '2 hours ago' },
    { id: '#12346', customer: 'Jane Smith', total: '$158.00', status: 'Processing', time: '3 hours ago' },
    { id: '#12347', customer: 'Bob Johnson', total: '$445.00', status: 'Pending', time: '5 hours ago' },
    { id: '#12348', customer: 'Alice Brown', total: '$92.00', status: 'Completed', time: '8 hours ago' },
    { id: '#12349', customer: 'Charlie Wilson', total: '$318.00', status: 'Completed', time: '1 day ago' }
  ];

  const topProducts = [
    { name: 'Organic Honey', sales: 234, revenue: '$5,432' },
    { name: 'Turmeric Tea', sales: 189, revenue: '$4,234' },
    { name: 'Black Rice', sales: 145, revenue: '$3,890' },
    { name: "Kid's Cereal", sales: 98, revenue: '$2,345' }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          } else {
            router.push('/admin/login');
          }
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor your store performance and key metrics
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedPeriod('24h')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                selectedPeriod === '24h'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => setSelectedPeriod('7d')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                selectedPeriod === '7d'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setSelectedPeriod('30d')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                selectedPeriod === '30d'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              30d
            </button>
            <button
              onClick={() => setSelectedPeriod('12m')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                selectedPeriod === '12m'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              12m
            </button>
          </div>
          <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.change >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className={`${metric.color}`}>
                  <metric.icon className="w-8 h-8" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MetricsDashboard Component */}
        <div className="mb-8">
          <MetricsDashboard />
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                <button className="text-sm text-gray-600 hover:text-gray-900">View all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{order.total}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'Processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Products - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
                <button>
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.sales} sales</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{product.revenue}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}