'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SearchAnalytics {
  totalSearches: number;
  uniqueUsers: number;
  topQueries: Array<{ query: string; count: number; ctr: number }>;
  topResults: Array<{ productId: number; title: string; clicks: number; impressions: number; ctr: number }>;
  seasonalTrends: Record<string, number>;
  timeRange: string;
}

interface SearchAnalyticsDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function SearchAnalyticsDashboard({
  className = '',
  autoRefresh = false,
  refreshInterval = 30000
}: SearchAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/search/analytics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      logger.error('Analytics fetch error:', error as Record<string, unknown>);
      // Set mock data for development
      setAnalytics(generateMockAnalytics());
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchAnalytics();

    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchAnalytics, autoRefresh, refreshInterval]);

  // Tab configuration
  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'queries', name: 'Top Queries', icon: '🔍' },
    { id: 'products', name: 'Product Performance', icon: '🛍️' },
    { id: 'trends', name: 'Seasonal Trends', icon: '📈' }
  ];

  // Time range options
  const timeRanges = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' }
  ];

  // Colors for charts
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading search analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            🔍 Search Analytics
          </h2>
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={fetchAnalytics}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Refresh analytics"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total Searches</p>
                    <p className="text-2xl font-bold text-blue-900">{analytics.totalSearches.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Unique Users</p>
                    <p className="text-2xl font-bold text-green-900">{analytics.uniqueUsers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Avg. CTR</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {analytics.topQueries.length > 0 
                        ? `${(analytics.topQueries.reduce((sum, q) => sum + q.ctr, 0) / analytics.topQueries.length * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 Top Search Queries</h3>
                <div className="space-y-3">
                  {analytics.topQueries.slice(0, 5).map((query, index) => (
                    <div key={query.query} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {query.query}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{query.count}</div>
                        <div className="text-xs text-gray-500">{(query.ctr * 100).toFixed(1)}% CTR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🛍️ Top Performing Products</h3>
                <div className="space-y-3">
                  {analytics.topResults.slice(0, 5).map((result, index) => (
                    <div key={result.productId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{result.clicks} clicks</div>
                        <div className="text-xs text-gray-500">{(result.ctr * 100).toFixed(1)}% CTR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Search Query Performance</h3>
            
            {/* Query Performance Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topQueries.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="query" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" name="Search Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Query Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topQueries.map((query, index) => (
                    <tr key={query.query}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {query.query}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {query.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(query.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(query.ctr * 100, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Product Click Performance</h3>
            
            {/* Product Performance Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topResults.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="title" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#3B82F6" name="Clicks" />
                  <Bar dataKey="impressions" fill="#10B981" name="Impressions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Seasonal Search Trends</h3>
            
            {Object.keys(analytics.seasonalTrends).length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.seasonalTrends).map(([keyword, count]) => ({
                        name: keyword,
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={false}
                    >
                      {Object.entries(analytics.seasonalTrends).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p>No seasonal trends data available for this time period</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Generate mock analytics data for development
function generateMockAnalytics(): SearchAnalytics {
  return {
    totalSearches: 1247,
    uniqueUsers: 423,
    topQueries: [
      { query: 'turmeric for inflammation', count: 156, ctr: 0.23 },
      { query: 'organic honey natural sweetener', count: 143, ctr: 0.19 },
      { query: 'moringa superfood benefits', count: 128, ctr: 0.21 },
      { query: 'black rice antioxidants', count: 112, ctr: 0.17 },
      { query: 'ginger tea inflammation', count: 98, ctr: 0.15 },
      { query: 'coconut oil cooking', count: 87, ctr: 0.14 },
      { query: 'organic brown rice', count: 76, ctr: 0.16 },
      { query: 'herbal tea blends', count: 65, ctr: 0.18 }
    ],
    topResults: [
      { productId: 1, title: 'Organic Turmeric Powder', clicks: 89, impressions: 234, ctr: 0.38 },
      { productId: 2, title: 'Raw Honey 500g', clicks: 76, impressions: 198, ctr: 0.38 },
      { productId: 3, title: 'Moringa Leaf Powder', clicks: 65, impressions: 187, ctr: 0.35 },
      { productId: 4, title: 'Black Rice 1kg', clicks: 54, impressions: 156, ctr: 0.35 },
      { productId: 5, title: 'Ginger Tea Blend', clicks: 43, impressions: 134, ctr: 0.32 }
    ],
    seasonalTrends: {
      'immune support': 45,
      'warming spices': 32,
      'winter wellness': 28,
      'vitamin c': 22,
      'respiratory health': 18
    },
    timeRange: '24h'
  };
}