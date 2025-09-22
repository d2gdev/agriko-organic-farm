'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface GraphStats {
  productCount: number;
  categoryCount: number;
  healthBenefitCount: number;
  relationshipCount: number;
}

interface GraphInsights {
  topHealthBenefits: Array<{ benefit: string; productCount: number }>;
  topCategories: Array<{ category: string; productCount: number }>;
  sampleRelationships: Array<{ product: string; benefit: string }>;
}

interface SyncResult {
  success: boolean;
  error?: string;
  data?: {
    syncedProducts: number;
    failedProducts: number;
    categories: number;
  };
}

interface GraphApiResponse {
  success: boolean;
  error?: string;
  stats?: GraphStats;
  insights?: GraphInsights;
}

export default function GraphAdminPage() {
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [insights, setInsights] = useState<GraphInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    fetchGraphStats();
  }, []);

  const fetchGraphStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/graph/stats');
      const data = await response.json() as GraphApiResponse;
      
      if (data.success) {
        setStats(data.stats ?? null);
        setInsights(data.insights ?? null);
      } else {
        setError(data.error ?? 'Failed to fetch graph stats');
      }
    } catch (error) {
      setError('Failed to connect to graph database');
      logger.error('Graph stats error', error as Record<string, unknown>, 'admin-graph');
    } finally {
      setLoading(false);
    }
  };

  const syncGraphData = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setError(null);
      
      const response = await fetch('/api/graph/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json() as SyncResult;
      setSyncResult(result);
      
      if (result.success) {
        // Refresh stats after sync
        await fetchGraphStats();
      } else {
        setError(result.error ?? 'Sync failed');
      }
    } catch (error) {
      setError('Failed to sync graph data');
      logger.error('Graph sync error', error as Record<string, unknown>, 'admin-graph');
    } finally {
      setSyncing(false);
    }
  };

  const testRecommendations = async () => {
    try {
      // Test with the first product (assuming ID 1 exists)
      const response = await fetch('/api/graph/recommendations?productId=1&type=similar&limit=3');
      const result = await response.json() as { 
        success: boolean; 
        data?: { 
          recommendations: unknown[] 
        } 
      };
      
      if (result.success && result.data) {
        alert(`Found ${result.data.recommendations.length} similar products!`);
      } else {
        alert('No recommendations found or error occurred');
      }
    } catch {
      alert('Failed to test recommendations');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Graph Management</h1>
          <p className="text-gray-600">
            Manage the MemGraph knowledge database for product relationships and recommendations.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className={`mb-6 border rounded-lg p-4 ${
            syncResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`font-medium ${
              syncResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {syncResult.success ? '✅ Sync Completed Successfully!' : '❌ Sync Failed'}
            </div>
            {syncResult.success && syncResult.data && (
              <div className="mt-2 text-sm text-green-700">
                <p>Synced {syncResult.data.syncedProducts} products</p>
                <p>Failed: {syncResult.data.failedProducts}</p>
                <p>Categories: {syncResult.data.categories}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={syncGraphData}
            disabled={syncing}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {syncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Data from WooCommerce
              </>
            )}
          </button>

          <button
            onClick={fetchGraphStats}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Stats
          </button>

          <button
            onClick={testRecommendations}
            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Test Recommendations
          </button>

          <Link 
            href="/admin/graph/explore" 
            className="bg-purple-500 text-white px-6 py-2 rounded-md hover:bg-purple-600 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Explore Relationships & Entities
          </Link>
        </div>

        {stats && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.productCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Products</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.categoryCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {stats.healthBenefitCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Health Benefits</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {stats.relationshipCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Relationships</div>
              </div>
            </div>

            {insights && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Top Health Benefits */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Health Benefits</h3>
                  <div className="space-y-3">
                    {insights.topHealthBenefits.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.benefit}</span>
                        <span className="text-sm font-medium text-purple-600">
                          {item.productCount} products
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
                  <div className="space-y-3">
                    {insights.topCategories.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.category}</span>
                        <span className="text-sm font-medium text-green-600">
                          {item.productCount} products
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Relationships */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product-Benefit Links</h3>
                  <div className="space-y-3">
                    {insights.sampleRelationships.slice(0, 5).map((item, index) => (
                      <div key={index} className="text-xs">
                        <div className="font-medium text-gray-900 truncate" title={item.product}>
                          {item.product}
                        </div>
                        <div className="text-gray-500 truncate" title={item.benefit}>
                          → {item.benefit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h3>
          <div className="text-blue-800 space-y-2">
            <p>1. <strong>Sync Data:</strong> Click &quot;Sync Data from WooCommerce&quot; to populate the graph database with your products.</p>
            <p>2. <strong>Test Recommendations:</strong> Use &quot;Test Recommendations&quot; to verify the graph-based recommendation system.</p>
            <p>3. <strong>Explore Relationships & Entities:</strong> Use &quot;Explore Relationships & Entities&quot; to discover connections between all entities and automatically find new entities in your data.</p>
            <p>4. <strong>Monitor Stats:</strong> Use &quot;Refresh Stats&quot; to see real-time database statistics.</p>
          </div>
        </div>

        {/* Technical Information */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Details</h3>
          <div className="text-gray-600 text-sm space-y-1">
            <p><strong>Database:</strong> MemGraph (Neo4j Compatible)</p>
            <p><strong>Connection:</strong> bolt://localhost:7687</p>
            <p><strong>Node Types:</strong> Product, Category, HealthBenefit, Ingredient, Region, Season, Condition, Nutrient</p>
            <p><strong>Relationship Types:</strong> BELONGS_TO, PROVIDES, CONTAINS, GROWN_IN, HARVESTED_IN, TREATS, RICH_IN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
