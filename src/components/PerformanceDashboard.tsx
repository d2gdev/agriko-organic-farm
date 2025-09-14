'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Gauge, Zap, Clock, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Activity, FileText, Image as ImageIcon, Wifi, Server
} from 'lucide-react';
import { 
  performanceOptimizer, 
  performanceMonitor, 
  BundleAnalyzer,
  CORE_WEB_VITALS_THRESHOLDS,
  PerformanceMetrics,
  PerformanceReport,
  BundleAnalysis
} from '@/lib/performance';

interface PerformanceDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function PerformanceDashboard({ 
  autoRefresh = true, 
  refreshInterval = 30000 
}: PerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceReport | null>(null);
  const [bundleData, setBundleData] = useState<BundleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refreshInterval]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Get current performance metrics
      const report = performanceOptimizer.generateReport();
      setPerformanceData(report);

      // Get bundle analysis
      const bundleAnalysis = await BundleAnalyzer.analyzeBundleSize();
      setBundleData(bundleAnalysis);

      // Get aggregated metrics
      const aggregated = performanceMonitor.getAggregatedMetrics();
      
    } catch (error) {
      logger.error('Failed to fetch performance data:', error as Record<string, unknown>);
    } finally {
      setLoading(false);
    }
  };

  const getCoreWebVitalsScore = (metrics: PerformanceMetrics) => {
    if (!metrics.lcp && !metrics.fid && !metrics.cls) return 0;
    
    const lcpScore = metrics.lcp ? 
      metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.good ? 100 : 
      metrics.lcp <= CORE_WEB_VITALS_THRESHOLDS.LCP.needsImprovement ? 50 : 0 : 100;
    
    const fidScore = metrics.fid ? 
      metrics.fid <= CORE_WEB_VITALS_THRESHOLDS.FID.good ? 100 :
      metrics.fid <= CORE_WEB_VITALS_THRESHOLDS.FID.needsImprovement ? 50 : 0 : 100;
    
    const clsScore = metrics.cls ? 
      metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.good ? 100 :
      metrics.cls <= CORE_WEB_VITALS_THRESHOLDS.CLS.needsImprovement ? 50 : 0 : 100;

    return Math.round((lcpScore + fidScore + clsScore) / 3);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 50) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Performance Dashboard</h1>
        <div className="flex space-x-4">
          <button 
            onClick={fetchPerformanceData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {['overview', 'core-vitals', 'bundle', 'optimization'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && performanceData && (
        <div className="space-y-6">
          {/* Performance Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
                  <p className={`text-3xl font-bold ${getScoreColor(performanceData.overallScore)}`}>
                    {performanceData.overallScore}
                  </p>
                </div>
                {getScoreIcon(performanceData.overallScore)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">LCP</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {performanceData.metrics.lcp ? `${Math.round(performanceData.metrics.lcp)}ms` : 'N/A'}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mt-1">Largest Contentful Paint</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">FID</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {performanceData.metrics.fid ? `${Math.round(performanceData.metrics.fid)}ms` : 'N/A'}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600 mt-1">First Input Delay</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">CLS</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {performanceData.metrics.cls ? performanceData.metrics.cls.toFixed(3) : 'N/A'}
                  </p>
                </div>
                <Gauge className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600 mt-1">Cumulative Layout Shift</p>
            </div>
          </div>

          {/* Performance Recommendations */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
            <div className="space-y-3">
              {performanceData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-semibold">{index + 1}</span>
                  </div>
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Core Vitals Tab */}
      {activeTab === 'core-vitals' && performanceData && (
        <div className="space-y-6">
          {/* Core Web Vitals Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                metric: 'LCP', 
                value: performanceData.metrics.lcp, 
                threshold: CORE_WEB_VITALS_THRESHOLDS.LCP,
                unit: 'ms',
                color: '#3B82F6'
              },
              { 
                metric: 'FID', 
                value: performanceData.metrics.fid, 
                threshold: CORE_WEB_VITALS_THRESHOLDS.FID,
                unit: 'ms',
                color: '#8B5CF6'
              },
              { 
                metric: 'CLS', 
                value: performanceData.metrics.cls, 
                threshold: CORE_WEB_VITALS_THRESHOLDS.CLS,
                unit: '',
                color: '#F59E0B'
              }
            ].map((vital) => (
              <div key={vital.metric} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{vital.metric}</h3>
                <div className="relative">
                  <div className="w-32 h-32 mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={[
                            { name: 'Current', value: vital.value ?? 0 },
                            { name: 'Remaining', value: Math.max(0, vital.threshold.good - (vital.value ?? 0)) }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          startAngle={90}
                          endAngle={450}
                        >
                          <Cell fill={vital.color} />
                          <Cell fill="#E5E7EB" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: vital.color }}>
                        {vital.value ? (vital.unit === 'ms' ? Math.round(vital.value) : vital.value.toFixed(3)) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">{vital.unit}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Good</span>
                    <span>&lt; {vital.threshold.good}{vital.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Needs Improvement</span>
                    <span>&lt; {vital.threshold.needsImprovement}{vital.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Timeline */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Timeline</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { name: 'FCP', value: performanceData.metrics.fcp ?? 0 },
                    { name: 'LCP', value: performanceData.metrics.lcp ?? 0 },
                    { name: 'TTI', value: (performanceData.metrics.lcp ?? 0) + 500 },
                    { name: 'Load', value: performanceData.metrics.pageLoadTime ?? 0 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Math.round(value as number)}ms`, 'Time']} />
                  <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Bundle Tab */}
      {activeTab === 'bundle' && bundleData && (
        <div className="space-y-6">
          {/* Bundle Size Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Total Bundle Size</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {(bundleData.totalBundleSize / 1024).toFixed(1)}KB
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">JavaScript Size</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {(bundleData.totalJSSize / 1024).toFixed(1)}KB
                  </p>
                </div>
                <Server className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">CSS Size</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {(bundleData.totalCSSSize / 1024).toFixed(1)}KB
                  </p>
                </div>
                <ImageIcon className="w-8 h-8 text-green-600" aria-hidden="true" role="img" />
              </div>
            </div>
          </div>

          {/* Bundle Composition */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Bundle Composition</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={[
                      { name: 'JavaScript', value: bundleData.totalJSSize, fill: '#8B5CF6' },
                      { name: 'CSS', value: bundleData.totalCSSSize, fill: '#10B981' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${entry.value ? ((entry.value as number) / 1024).toFixed(1) : '0.0'}KB`}
                  />
                  <Tooltip formatter={(value) => `${(value as number / 1024).toFixed(1)}KB`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bundle Suggestions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Bundle Optimization Suggestions</h3>
            <div className="space-y-3">
              {bundleData.suggestions?.map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-semibold">{index + 1}</span>
                  </div>
                  <p className="text-gray-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimization Tab */}
      {activeTab === 'optimization' && (
        <div className="space-y-6">
          {/* Optimization Checklist */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Optimization Checklist</h3>
            <div className="space-y-4">
              {[
                { task: 'Enable gzip compression', status: 'completed', impact: 'High' },
                { task: 'Implement image lazy loading', status: 'completed', impact: 'Medium' },
                { task: 'Optimize font loading', status: 'completed', impact: 'Medium' },
                { task: 'Enable service worker caching', status: 'pending', impact: 'High' },
                { task: 'Implement code splitting', status: 'pending', impact: 'High' },
                { task: 'Optimize third-party scripts', status: 'in-progress', impact: 'Medium' },
                { task: 'Add resource preloading', status: 'completed', impact: 'Low' },
                { task: 'Minimize render-blocking resources', status: 'pending', impact: 'High' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'in-progress' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="font-medium text-gray-900">{item.task}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.impact === 'High' ? 'bg-red-100 text-red-800' :
                      item.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.impact} Impact
                    </span>
                    <span className={`text-sm font-medium ${
                      item.status === 'completed' ? 'text-green-600' :
                      item.status === 'in-progress' ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {item.status.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Budget */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Budget</h3>
            <div className="space-y-4">
              {[
                { metric: 'LCP', budget: '2.5s', current: performanceData?.metrics.lcp ? `${(performanceData.metrics.lcp / 1000).toFixed(1)}s` : 'N/A' },
                { metric: 'FID', budget: '100ms', current: performanceData?.metrics.fid ? `${Math.round(performanceData.metrics.fid)}ms` : 'N/A' },
                { metric: 'CLS', budget: '0.1', current: performanceData?.metrics.cls ? performanceData.metrics.cls.toFixed(3) : 'N/A' },
                { metric: 'Bundle Size', budget: '250KB', current: bundleData ? `${(bundleData.totalBundleSize / 1024).toFixed(1)}KB` : 'N/A' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <span className="font-medium text-gray-900">{item.metric}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">Budget: {item.budget}</span>
                    <span className="font-semibold text-blue-600">Current: {item.current}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
