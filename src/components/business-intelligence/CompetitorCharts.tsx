'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CompetitorCharts() {
  // Sample competitor data for demonstration
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

  const competitorGrowthData = [
    { competitor: 'Our Company', growth: 15.5, customers: 2800 },
    { competitor: 'TechCorp', growth: 12.3, customers: 3200 },
    { competitor: 'MarketLeader', growth: 8.7, customers: 4500 },
    { competitor: 'StartupX', growth: 28.9, customers: 1200 }
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value: number) => `$${value}`;

  return (
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
      <Card>
        <CardHeader>
          <CardTitle>Competitive Analysis Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
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

      {/* Growth vs Customer Base Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Rate vs Customer Base</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              data={competitorGrowthData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="customers"
                name="Customers"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value / 1000}K`}
              />
              <YAxis
                type="number"
                dataKey="growth"
                name="Growth Rate"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'growth' ? `${value}%` : `${value.toLocaleString()}`,
                  name === 'growth' ? 'Growth Rate' : 'Customers'
                ]}
                labelFormatter={(label) => `Company: ${label}`}
              />
              <Scatter
                dataKey="growth"
                fill="#8B5CF6"
                name="Competitors"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Comparison */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue Comparison (Estimated)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={marketShareData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="competitor"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}M`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value}M`, 'Revenue']}
              />
              <Bar
                dataKey="revenue"
                fill="#6366F1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}