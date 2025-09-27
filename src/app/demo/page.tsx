'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DemoChartsPage() {
  // Sample sales data
  const salesData = [
    { date: '2024-01-01', sales: 2400, orders: 24 },
    { date: '2024-01-02', sales: 1398, orders: 18 },
    { date: '2024-01-03', sales: 9800, orders: 42 },
    { date: '2024-01-04', sales: 3908, orders: 31 },
    { date: '2024-01-05', sales: 4800, orders: 28 },
    { date: '2024-01-06', sales: 3800, orders: 35 },
    { date: '2024-01-07', sales: 4300, orders: 29 }
  ];

  // Sample competitor data
  const competitorPriceData = [
    { date: '2024-01-01', ourPrice: 299, techCorp: 349, marketLeader: 399, startupX: 279 },
    { date: '2024-01-15', ourPrice: 299, techCorp: 329, marketLeader: 389, startupX: 289 },
    { date: '2024-02-01', ourPrice: 289, techCorp: 319, marketLeader: 379, startupX: 299 },
    { date: '2024-02-15', ourPrice: 279, techCorp: 299, marketLeader: 369, startupX: 309 },
    { date: '2024-03-01', ourPrice: 269, techCorp: 289, marketLeader: 359, startupX: 319 }
  ];

  const marketShareData = [
    { competitor: 'Our Company', share: 28, revenue: 45 },
    { competitor: 'MarketLeader', share: 35, revenue: 62 },
    { competitor: 'TechCorp', share: 22, revenue: 38 },
    { competitor: 'StartupX', share: 8, revenue: 12 },
    { competitor: 'Others', share: 7, revenue: 15 }
  ];

  const competitorRadarData = [
    { subject: 'Price', ourCompany: 85, techCorp: 70, marketLeader: 45, startupX: 90 },
    { subject: 'Features', ourCompany: 90, techCorp: 85, marketLeader: 95, startupX: 70 },
    { subject: 'Support', ourCompany: 88, techCorp: 75, marketLeader: 90, startupX: 60 },
    { subject: 'Innovation', ourCompany: 85, techCorp: 90, marketLeader: 80, startupX: 95 },
    { subject: 'Marketing', ourCompany: 70, techCorp: 85, marketLeader: 95, startupX: 75 },
    { subject: 'Distribution', ourCompany: 80, techCorp: 80, marketLeader: 90, startupX: 65 }
  ];

  const performanceData = [
    { name: 'Sales', value: 25000, color: '#3B82F6' },
    { name: 'Returns', value: 1250, color: '#EF4444' },
    { name: 'Pending', value: 2500, color: '#F59E0B' }
  ];

  const funnelData = [
    { stage: 'Visitors', count: 10000, percentage: 100 },
    { stage: 'Product Views', count: 3000, percentage: 30 },
    { stage: 'Add to Cart', count: 1200, percentage: 12 },
    { stage: 'Checkout', count: 600, percentage: 6 },
    { stage: 'Purchase', count: 300, percentage: 3 }
  ];

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Charts Demo</h1>
          <p className="text-gray-600 mt-2">
            Fully functional charts with sample data - no authentication required
          </p>
        </div>

        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="competitors">Competitive Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
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
                    <BarChart data={salesData}>
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

              {/* Conversion Funnel */}
              <Card>
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
                        formatter={(value: number) => [value.toLocaleString(), 'Users']}
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
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Price Comparison Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={competitorPriceData}>
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
                        formatter={(value: number) => [formatCurrency(value), 'Price']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ourPrice"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name="Our Company"
                      />
                      <Line
                        type="monotone"
                        dataKey="techCorp"
                        stroke="#EF4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="TechCorp"
                      />
                      <Line
                        type="monotone"
                        dataKey="marketLeader"
                        stroke="#10B981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="MarketLeader"
                      />
                      <Line
                        type="monotone"
                        dataKey="startupX"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="StartupX"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Market Share Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Share Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={marketShareData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="competitor"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value}${name === 'share' ? '%' : 'M'}`,
                          name === 'share' ? 'Market Share' : 'Revenue'
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="share"
                        fill="#3B82F6"
                        name="Market Share (%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Competitive Radar Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Competitive Analysis Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={competitorRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Our Company"
                        dataKey="ourCompany"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Radar
                        name="TechCorp"
                        dataKey="techCorp"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Radar
                        name="MarketLeader"
                        dataKey="marketLeader"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-gray-500">
          <p>✅ All charts successfully implemented with sample data</p>
          <p>🔗 Connect WooCommerce API for real-time data integration</p>
        </div>
      </div>
    </div>
  );
}