'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, 
  Search, Eye, MousePointer, DollarSign, Clock, Target,
  Activity, BarChart3, Zap, Brain
} from 'lucide-react';

interface RealTimeData {
  productViews: number;
  activeUsers: number;
  searchQueries: number;
  cartAdditions: number;
  trend: number;
  activeSessions: number;
  revenue: number;
  conversionRate: number;
  hourlyTrends: Array<{ hour: string; productViews: number; searches: number; purchases: number }>;
  recommendationClicks: number;
  recommendationCTR: number;
  cacheStats: { hitRate: number; missRate: number };
}

interface HistoricalData {
  traffic: Array<{ time: string; views: number; users: number }>;
  conversions: Array<{ time: string; rate: number }>;
}

interface RecommendationData {
  accuracy: number;
  coverage: number;
  diversity: number;
  performanceByType: Array<{ recommendationType: string; ctr: number }>;
}

interface SearchData {
  topQueries: Array<{ query: string; count: number; successRate: number }>;
  noResults: number;
  avgResultsPerQuery: number;
  searchTypes: Array<{ searchType: string; count: number }>;
}

interface UserBehaviorData {
  sessionDuration: { average: number; median: number; sessions: number };
  bounceRate: number;
  pagesPerSession: number;
  topPages: Array<{ path: string; views: number }>;
}

interface ConversionData {
  rate: number;
  value: number;
  abandonmentRate: number;
  steps: Array<{ name: string; sessions: number; rate: number }>;
}

interface AnalyticsData {
  realTime?: RealTimeData;
  historical?: HistoricalData;
  recommendations?: RecommendationData;
  search?: SearchData;
  userBehavior?: UserBehaviorData;
  conversion?: ConversionData;
}

interface AdvancedAnalyticsDashboardProps {
  timeRange?: '1h' | '24h' | '7d' | '30d';
  refreshInterval?: number;
  showMockData?: boolean;
  className?: string;
}

export default function AdvancedAnalyticsDashboard({
  timeRange = '24h',
  refreshInterval = 30000,
  showMockData = true,
  className = ''
}: AdvancedAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange: selectedTimeRange,
        ...(showMockData && { mock: 'true' })
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`);
      const result = await response.json() as {
        success: boolean;
        data?: AnalyticsData;
        error?: string;
      };

      if (result.success) {
        setData(result.data ?? {}); // Fix: Provide empty object as fallback
        setError(null);
      } else {
        throw new Error(result.error ?? 'Failed to fetch analytics data');
      }
    } catch (err) {
      logger.error('Analytics fetch error:', err as Record<string, unknown>);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, showMockData]);

  useEffect(() => {
    fetchAnalyticsData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchAnalyticsData, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchAnalyticsData, refreshInterval]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && !data.realTime) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border border-red-200 ${className}`}>
        <div className="text-red-800">
          <h3 className="font-semibold mb-2">Analytics Error</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const realTimeData = data.realTime ?? {
    productViews: 0,
    activeUsers: 0,
    searchQueries: 0,
    cartAdditions: 0,
    trend: 0,
    activeSessions: 0,
    revenue: 0,
    conversionRate: 0,
    hourlyTrends: [],
    recommendationClicks: 0,
    recommendationCTR: 0,
    cacheStats: { hitRate: 0, missRate: 0 }
  };
  const historicalData = data.historical ?? { traffic: [], conversions: [] };
  const recommendationData = data.recommendations ?? { accuracy: 0, coverage: 0, diversity: 0, performanceByType: [] };
  const searchData = data.search ?? { topQueries: [], noResults: 0, avgResultsPerQuery: 0, searchTypes: [] };
  const userBehaviorData = data.userBehavior || { 
    sessionDuration: { average: 0, median: 0, sessions: 0 }, 
    bounceRate: 0, 
    pagesPerSession: 0,
    topPages: []
  };
  const conversionData = data.conversion ?? { rate: 0, value: 0, abandonmentRate: 0, steps: [] };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'realtime', label: 'Real-time', icon: <Activity className="w-4 h-4" /> },
    { id: 'recommendations', label: 'Recommendations', icon: <Brain className="w-4 h-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
    { id: 'behavior', label: 'User Behavior', icon: <Users className="w-4 h-4" /> }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600 mt-1">Real-time insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Product Views"
              value={realTimeData.productViews ?? 0}
              icon={<Eye className="w-5 h-5" />}
              trend={5.2}
              color="blue"
            />
            <MetricCard
              title="Active Users"
              value={realTimeData.activeUsers ?? 0}
              icon={<Users className="w-5 h-5" />}
              trend={-2.1}
              color="green"
            />
            <MetricCard
              title="Cart Additions"
              value={realTimeData.cartAdditions ?? 0}
              icon={<ShoppingCart className="w-5 h-5" />}
              trend={8.7}
              color="purple"
            />
            <MetricCard
              title="Revenue"
              value={formatCurrency(realTimeData.revenue ?? 0)}
              icon={<DollarSign className="w-5 h-5" />}
              trend={12.4}
              color="green"
            />
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              {conversionData.steps?.map((step: ConversionStep, index: number) => (
                <div key={step.name} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{step.name}</span>
                      <div className="text-sm text-gray-600">
                        {formatNumber(step.sessions)} users ({step.rate.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${step.rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'realtime' && (
        <div className="space-y-6">
          {/* Real-time Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <RealTimeCard label="Live Users" value={realTimeData.activeUsers ?? 0} color="green" />
            <RealTimeCard label="Sessions" value={realTimeData.activeSessions ?? 0} color="blue" />
            <RealTimeCard label="Page Views/min" value={Math.round((realTimeData.productViews ?? 0) / 60)} color="purple" />
            <RealTimeCard label="Conversion Rate" value={`${realTimeData.conversionRate ?? 0}%`} color="orange" />
          </div>

          {/* Live Activity Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Live Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={realTimeData.hourlyTrends ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="productViews" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="searches" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="purchases" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Recommendation Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Performance by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recommendationData.performanceByType ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="recommendationType" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ctr" fill="#3B82F6" name="Click-through Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Recommendation Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Clicks</span>
                  <span className="text-xl font-semibold">{realTimeData.recommendationClicks ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average CTR</span>
                  <span className="text-xl font-semibold text-green-600">{realTimeData.recommendationCTR}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cache Hit Rate</span>
                  <span className="text-xl font-semibold text-blue-600">
                    {realTimeData.cacheStats?.hitRate ? `${(realTimeData.cacheStats.hitRate * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Top Search Queries</h3>
              <div className="space-y-3">
                {searchData.topQueries?.slice(0, 8).map((queryItem, index) => (
                  <div key={queryItem.query} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{queryItem.query}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span>{queryItem.count}</span>
                      <span className="text-green-600">{(queryItem.successRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Search Types Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={searchData.searchTypes ?? []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(searchData.searchTypes ?? []).map((entry: SearchType, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="space-y-6">
          {/* User Behavior Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Session Duration</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average</span>
                  <span className="font-medium">{Math.round(userBehaviorData.sessionDuration?.average ?? 0)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Median</span>
                  <span className="font-medium">{Math.round(userBehaviorData.sessionDuration?.median ?? 0)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sessions</span>
                  <span className="font-medium">{formatNumber(userBehaviorData.sessionDuration?.sessions ?? 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
              <div className="space-y-3">
                {userBehaviorData.topPages?.slice(0, 5).map((page: TopPage) => (
                  <div key={page.path} className="flex justify-between">
                    <span className="text-sm text-gray-600 truncate flex-1">{page.path}</span>
                    <span className="text-sm font-medium ml-2">{formatNumber(page.views)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bounce Rate</span>
                  <span className="font-medium text-orange-600">{userBehaviorData.bounceRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-medium text-green-600">{realTimeData.conversionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rec. CTR</span>
                  <span className="font-medium text-blue-600">{realTimeData.recommendationCTR}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function MetricCard({ title, value, icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
    </div>
  );
}

// Real-time Card Component
interface RealTimeCardProps {
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function RealTimeCard({ label, value, color }: RealTimeCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50'
  };

  const textColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]} relative overflow-hidden`}>
      <div className="relative z-10">
        <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
      <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 ${textColors[color]}`}>
        <Activity className="w-full h-full" />
      </div>
    </div>
  );
}

interface ConversionStep {
  name: string;
  sessions: number;
  rate: number;
}

interface SearchQuery {
  query: string;
  count: number;
  successRate: number;
  searches?: number;
}

interface SearchType {
  searchType: string;
  count: number;
}

interface TopPage {
  path: string;
  views: number;
}
