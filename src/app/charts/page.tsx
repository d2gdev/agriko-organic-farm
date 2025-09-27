'use client';

import SalesCharts from '@/components/business-intelligence/SalesCharts';
import CompetitorCharts from '@/components/business-intelligence/CompetitorCharts';
import CompetitorScraper from '@/components/business-intelligence/CompetitorScraper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ChartsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Charts Demo</h1>
          <p className="text-gray-600 mt-2">
            Business Intelligence Dashboard and Competitor Analysis Tools
          </p>
        </div>

        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales">Sales Charts</TabsTrigger>
            <TabsTrigger value="competitors">Competitor Charts</TabsTrigger>
            <TabsTrigger value="scraper">Competitor Scraper</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Sales Analytics</h2>
              <SalesCharts period="month" />
            </div>
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Competitive Analysis</h2>
              <CompetitorCharts />
            </div>
          </TabsContent>

          <TabsContent value="scraper" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Competitor Scraper</h2>
              <CompetitorScraper />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}