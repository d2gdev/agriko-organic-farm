'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

// import {
//   ResponsiveContainer
// } from 'recharts';
// import {
//   TrendingUp, TrendingDown, Users, ShoppingCart,
//   Search, Eye, MousePointer, DollarSign, Clock, Target
// } from 'lucide-react';
import { behaviorEvent } from '@/lib/gtag';

interface AnalyticsData {
  overview: {
    totalVisitors: number;
    totalPageviews: number;
    totalRevenue: number;
    conversionRate: string;
    averageOrderValue: string;
    bounceRate: string;
  };
  funnel: {
    steps: Array<{
      name: string;
      users: number;
      conversionRate: number;
    }>;
  };
  trafficSources: Array<{
    source: string;
    users: number;
    percentage: number;
  }>;
  topProducts: Array<{
    name: string;
    views: number;
    addToCarts: number;
    revenue: number;
  }>;
  searchMetrics: {
    totalSearches: number;
    avgResultsPerSearch: number;
    searchSuccessRate: number;
    topSearchTerms: Array<{
      term: string;
      searches: number;
      results: number;
      clickThrough: number;
    }>;
    semanticSearches: number;
    semanticSearchSuccessRate: number;
  };
  performance: {
    avgPageLoadTime: string;
    coreWebVitals: {
      lcp: string;
      fid: string;
      cls: string;
    };
    mobileUsage: number;
    desktopUsage: number;
  };
  userBehavior: {
    avgTimeOnPage: number;
    pagesPerSession: string;
    avgScrollDepth: number;
    exitIntentTriggers: number;
  };
  dailyTrends: Array<{
    date: string;
    visitors: number;
    pageviews: number;
    revenue: number;
    conversions: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        logger.error('Failed to fetch analytics data:', error as Record<string, unknown>);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]); // Direct dependency on timeRange

  useEffect(() => {
    // Track dashboard usage
    behaviorEvent.featureUsage('analytics_dashboard', 'view', activeTab);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!data?.overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {['overview', 'funnel', 'traffic', 'products', 'search', 'performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Visitors</h3>
            <p className="text-3xl font-bold text-green-600">{data.overview.totalVisitors.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Unique visitors</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">${data.overview.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Gross revenue</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion Rate</h3>
            <p className="text-3xl font-bold text-green-600">{data.overview.conversionRate}%</p>
            <p className="text-sm text-gray-600 mt-1">Visitor to customer</p>
          </div>
        </div>
      )}

      {activeTab === 'funnel' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Purchase Funnel</h3>
          <div className="space-y-4">
            {data.funnel.steps.map((step, index) => (
              <div key={step.name} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{step.name}</span>
                    <span className="text-sm text-gray-600">{step.users} users ({step.conversionRate}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${step.conversionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'traffic' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="space-y-4">
            {data.trafficSources.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{source.source}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{source.users} users</span>
                  <span className="text-sm font-medium text-green-600">{source.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-900">Product</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-900">Views</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-900">Add to Cart</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-900">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product) => (
                  <tr key={product.name} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 text-gray-600">{product.views}</td>
                    <td className="py-3 px-4 text-gray-600">{product.addToCarts}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">${product.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Overview</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total Searches: <span className="font-semibold">{data.searchMetrics.totalSearches}</span></p>
                <p className="text-sm text-gray-600">Success Rate: <span className="font-semibold text-green-600">{data.searchMetrics.searchSuccessRate}%</span></p>
                <p className="text-sm text-gray-600">Avg Results: <span className="font-semibold">{data.searchMetrics.avgResultsPerSearch}</span></p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Semantic Search</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">AI Searches: <span className="font-semibold">{data.searchMetrics.semanticSearches}</span></p>
                <p className="text-sm text-gray-600">Success Rate: <span className="font-semibold text-green-600">{data.searchMetrics.semanticSearchSuccessRate}%</span></p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Search Terms</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Search Term</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Searches</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Results</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Click-through</th>
                  </tr>
                </thead>
                <tbody>
                  {data.searchMetrics.topSearchTerms.map((term) => (
                    <tr key={term.term} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{term.term}</td>
                      <td className="py-3 px-4 text-gray-600">{term.searches}</td>
                      <td className="py-3 px-4 text-gray-600">{term.results}</td>
                      <td className="py-3 px-4 text-green-600 font-semibold">{term.clickThrough}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">LCP (Largest Contentful Paint)</span>
                  <span className="font-semibold">{data.performance.coreWebVitals.lcp}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">FID (First Input Delay)</span>
                  <span className="font-semibold">{data.performance.coreWebVitals.fid}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CLS (Cumulative Layout Shift)</span>
                  <span className="font-semibold">{data.performance.coreWebVitals.cls}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Behavior</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Time on Page</span>
                  <span className="font-semibold">{Math.floor(data.userBehavior.avgTimeOnPage / 60)}m {data.userBehavior.avgTimeOnPage % 60}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pages per Session</span>
                  <span className="font-semibold">{data.userBehavior.pagesPerSession}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Scroll Depth</span>
                  <span className="font-semibold">{data.userBehavior.avgScrollDepth}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}