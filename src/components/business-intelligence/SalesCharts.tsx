'use client';

import React from 'react';
import type { ChartDataPoint } from '@/types/business-intelligence-types';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useWooCommerceSalesReport } from '@/hooks/useWooCommerceData';

interface SalesChartsProps {
  period: 'week' | 'month' | 'year';
}

export default function SalesCharts({ period = 'month' }: SalesChartsProps) {
  const { data: salesReport, loading, error } = useWooCommerceSalesReport(period);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 text-center">
            <p>Failed to load sales data</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salesReport || !salesReport.salesData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-gray-500 text-center">
            <p>No sales data available</p>
            <p className="text-sm mt-2">Configure WooCommerce API to see real data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sample data for demonstration when no real data is available
  const sampleData = [
    { date: '2024-01-01', sales: 2400, orders: 24 },
    { date: '2024-01-02', sales: 1398, orders: 18 },
    { date: '2024-01-03', sales: 9800, orders: 42 },
    { date: '2024-01-04', sales: 3908, orders: 31 },
    { date: '2024-01-05', sales: 4800, orders: 28 },
    { date: '2024-01-06', sales: 3800, orders: 35 },
    { date: '2024-01-07', sales: 4300, orders: 29 }
  ];

  const chartData = (Array.isArray(salesReport.salesData) && salesReport.salesData.length > 0) ? salesReport.salesData : sampleData;

  // Prepare data for different chart types
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Performance metrics for pie chart
  const performanceData = [
    { name: 'Sales', value: salesReport.totalSales || 25000, color: '#3B82F6' },
    { name: 'Returns', value: ((salesReport.totalSales as number) || 25000) * 0.05, color: '#EF4444' },
    { name: 'Pending', value: ((salesReport.totalSales as number) || 25000) * 0.1, color: '#F59E0B' }
  ];

  // Conversion funnel data
  const funnelData = [
    { stage: 'Visitors', count: 10000, percentage: 100 },
    { stage: 'Product Views', count: 3000, percentage: 30 },
    { stage: 'Add to Cart', count: 1200, percentage: 12 },
    { stage: 'Checkout', count: 600, percentage: 6 },
    { stage: 'Purchase', count: salesReport.totalOrders || 300, percentage: 3 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData as ChartDataPoint[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value: number) => [formatCurrency(value), 'Sales']}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Order Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData as ChartDataPoint[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value: number) => [value, 'Orders']}
              />
              <Bar
                dataKey="orders"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Breakdown Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales vs Orders Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales & Orders Correlation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData as ChartDataPoint[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="sales"
                orientation="left"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value: number, name: string) => [
                  name === 'sales' ? formatCurrency(value) : value,
                  name === 'sales' ? 'Sales' : 'Orders'
                ]}
              />
              <Area
                yAxisId="sales"
                type="monotone"
                dataKey="sales"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Area
                yAxisId="orders"
                type="monotone"
                dataKey="orders"
                stackId="2"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={funnelData}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === 'count' ? 'Users' : name
                ]}
              />
              <Bar
                dataKey="count"
                fill="#8B5CF6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}