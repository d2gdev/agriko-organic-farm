'use client';

import { useState, useEffect } from 'react';
import CompetitorScraper from '@/components/business-intelligence/CompetitorScraper';
import CompetitorManager from '@/components/business-intelligence/CompetitorManager';
import { Activity, Settings, Search } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

export default function CompetitorScraperPage() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'scraper' | 'manage'>('scraper');

  useEffect(() => {
    // Only set time on client side to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleTimeString());

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Competitor Intelligence</h1>
            <p className="text-gray-600 mt-2">
              Monitor competitor products and pricing data across multiple platforms
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('scraper')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'scraper'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Search className="w-4 h-4" />
                Scraper
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'manage'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                Manage Competitors
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'scraper' ? (
            <CompetitorScraper />
          ) : (
            <CompetitorManager />
          )}
        </div>

      {/* Footer - Same as admin dashboard */}
      <footer className="mt-auto bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>© {new Date().getFullYear()} Agriko Admin Panel</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Version 2.0.1</span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a
                href="/api/monitoring"
                target="_blank"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                System Status
              </a>
              <a
                href="/api/cache/status"
                target="_blank"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cache Info
              </a>
              <a
                href="mailto:admin@agrikoph.com"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Support
              </a>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Activity className="w-3 h-3" />
              <span>Server: {process.env.NODE_ENV || 'development'}</span>
              {currentTime && (
                <>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline">Time: {currentTime}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </AdminLayout>
  );
}