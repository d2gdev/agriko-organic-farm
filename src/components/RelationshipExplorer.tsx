'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Relationship {
  source: {
    type: string;
    id: string | number;
    name: string;
  };
  target: {
    type: string;
    id: string | number;
    name: string;
  };
  relationship: {
    type: string;
    properties: Record<string, unknown>;
  };
  path: string;
  strength: number;
}

interface RelationshipPath {
  nodes: Array<{
    type: string;
    id: string | number;
    name: string;
  }>;
  relationships: Array<{
    type: string;
    properties: Record<string, unknown>;
  }>;
  strength: number;
  explanation: string;
}

interface ConnectedEntity {
  entity: {
    type: string;
    id: string | number;
    name: string;
    properties: Record<string, unknown>;
  };
  connectionStrength: number;
  commonRelationships: string[];
}

interface DiscoveredEntity {
  id: string;
  name: string;
  type: string;
  source: string;
  confidence: number;
  createdAt: string;
}

interface DiscoveryStats {
  products: number;
  graph: number;
  total: number;
  byType: Record<string, number>;
}

// Define the results type
type ResultsType = 
  | Relationship[]
  | RelationshipPath[]
  | ConnectedEntity[]
  | { entities: DiscoveredEntity[]; statistics: DiscoveryStats }
  | Record<string, unknown>; // For statistics and other types

export function RelationshipExplorer() {
  const [sourceType, setSourceType] = useState('Product');
  const [sourceId, setSourceId] = useState('');
  const [targetType, setTargetType] = useState('Ingredient');
  const [targetId, setTargetId] = useState('');
  const [action, setAction] = useState('direct');
  const [relationshipTypes, setRelationshipTypes] = useState('');
  const [maxHops, setMaxHops] = useState(3);
  const [limit, setLimit] = useState(10);
  
  const [_relationships, setRelationships] = useState<Relationship[]>([]);
  void _relationships; // Preserved for future relationship display
  const [_paths, setPaths] = useState<RelationshipPath[]>([]);
  void _paths; // Preserved for future path visualization
  const [_connectedEntities, setConnectedEntities] = useState<ConnectedEntity[]>([]);
  void _connectedEntities; // Preserved for future entity connections
  const [discoveredEntities, setDiscoveredEntities] = useState<DiscoveredEntity[]>([]);
  const [entityDiscoveryLoading, setEntityDiscoveryLoading] = useState(false);
  const [autoCreateEntities, setAutoCreateEntities] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_autoCreating, setAutoCreating] = useState(false);
  void _autoCreating; // Preserved for future auto-creation status
  // Add results state
  const [results, setResults] = useState<ResultsType | null>(null);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        action,
        sourceType,
        sourceId,
        limit: limit.toString()
      });
      
      if (action === 'paths') {
        params.append('targetType', targetType);
        params.append('targetId', targetId);
        params.append('maxHops', maxHops.toString());
      } else if (action === 'connected' && relationshipTypes) {
        params.append('relationshipTypes', relationshipTypes);
      } else if (action === 'transitive' && relationshipTypes) {
        params.append('relationshipTypes', relationshipTypes);
      }
      
      const response = await fetch(`/api/graph/relationships?${params}`).catch(error => {
        throw new Error(`Network error: ${error.message}`);
      });
      
      const data = await response.json().catch(error => {
        throw new Error(`Invalid response format: ${error.message}`);
      });
      
      if (data.success) {
        setResults(data.result);
      } else {
        setError(data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch relationship data';
      setError(errorMessage);
      logger.error('Error in handleSearch:', err as Record<string, unknown>);
    } finally {
      setLoading(false);
    }
  };
  
  const discoverEntities = async () => {
    try {
      setEntityDiscoveryLoading(true);
      setError(null);
      
      const response = await fetch('/api/graph/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'discover-entities',
          autoCreate: autoCreateEntities
        }),
      }).catch(error => {
        throw new Error(`Network error: ${error.message}`);
      });
      
      const result = await response.json().catch(error => {
        throw new Error(`Invalid response format: ${error.message}`);
      });
      
      if (result.success) {
        setDiscoveredEntities(result.data.entities ?? []);
        setRelationships([]);
        setPaths([]);
        setConnectedEntities([]);
        // Set results for discovered entities
        setResults({
          entities: result.data.entities ?? [],
          statistics: result.data.statistics ?? { products: 0, graph: 0, total: 0, byType: {} }
        });
      } else {
        setError(result.error ?? 'Failed to discover entities');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to discover entities';
      setError(errorMessage);
      logger.error('Entity discovery error:', error as Record<string, unknown>);
    } finally {
      setEntityDiscoveryLoading(false);
    }
  };
  
  const _handleAutoCreateEntities = async () => {
    // Check if results exist and have entities
    if (!results || !('entities' in results) || !results.entities || !Array.isArray(results.entities) || results.entities.length === 0) {
      setError('No entities to create. Please discover entities first.');
      return;
    }
    
    setAutoCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/graph/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'auto-create-entities',
          entities: results.entities
        })
      }).catch(error => {
        throw new Error(`Network error: ${error.message}`);
      });
      
      const data = await response.json().catch(error => {
        throw new Error(`Invalid response format: ${error.message}`);
      });
      
      if (data.success) {
        toast.success(`Successfully created ${data.result.created} entities with ${data.result.failed} failures`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-create entities';
      setError(errorMessage);
      logger.error('Error in handleAutoCreateEntities:', err as Record<string, unknown>);
    } finally {
      setAutoCreating(false);
    }
  };
  void _handleAutoCreateEntities; // Preserved for future auto-creation feature
  
  const renderResults = () => {
    if (!results) return null;
    
    if (action === 'direct') {
      return <DirectRelationshipsView relationships={results as Relationship[]} />;
    } else if (action === 'paths') {
      return <RelationshipPathsView paths={results as RelationshipPath[]} />;
    } else if (action === 'connected') {
      return <ConnectedEntitiesView entities={results as ConnectedEntity[]} />;
    } else if (action === 'transitive') {
      return <DirectRelationshipsView relationships={results as Relationship[]} />;
    } else if (action === 'statistics') {
      return <StatisticsView stats={results as { relationshipTypes: Array<{ type: string; count: number }>; strengthDistribution: Array<{ range: string; count: number; percentage: number }> }} />;
    } else if (action === 'discover-entities') {
      // Type guard for discovered entities results
      if (results && typeof results === 'object' && 'entities' in results && 'statistics' in results) {
        const _discoveredResults = results as { entities: DiscoveredEntity[]; statistics: DiscoveryStats };
        void _discoveredResults; // Preserved for future entity discovery display
        return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Discovered Entities</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoCreateEntities}
                    onChange={(e) => setAutoCreateEntities(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Auto-create in graph</span>
                </label>
                <button
                  onClick={discoverEntities}
                  disabled={entityDiscoveryLoading}
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:bg-gray-400 transition-colors flex items-center text-sm"
                >
                  {entityDiscoveryLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Discovering...
                    </>
                  ) : (
                    'Discover Entities'
                  )}
                </button>
              </div>
            </div>
            
            {discoveredEntities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No entities discovered yet. Click &quot;Discover Entities&quot; to find new entities.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {discoveredEntities.map((entity) => (
                        <tr key={entity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entity.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {entity.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entity.source}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${entity.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {Math.round(entity.confidence * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-gray-50 text-sm text-gray-500">
                  Showing {discoveredEntities.length} discovered entities
                </div>
              </div>
            )}
          </div>
        );
      }
      return null;
    }
    
    return <pre>{JSON.stringify(results, null, 2)}</pre>;
  };
  
  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Knowledge Graph Relationship Explorer</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="direct">Direct Relationships</option>
                  <option value="paths">Relationship Paths</option>
                  <option value="connected">Connected Entities</option>
                  <option value="transitive">Transitive Relationships</option>
                  <option value="statistics">Statistics</option>
                  <option value="discover-entities">Discover Entities</option>
                </select>
              </div>
              
              {action !== 'statistics' && action !== 'discover-entities' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="Product">Product</option>
                      <option value="Ingredient">Ingredient</option>
                      <option value="Region">Region</option>
                      <option value="Season">Season</option>
                      <option value="Condition">Condition</option>
                      <option value="Nutrient">Nutrient</option>
                      <option value="Category">Category</option>
                      <option value="HealthBenefit">Health Benefit</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source ID</label>
                    <input
                      type="text"
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Enter entity ID or name"
                    />
                  </div>
                </>
              )}
              
              {action === 'paths' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="Product">Product</option>
                      <option value="Ingredient">Ingredient</option>
                      <option value="Region">Region</option>
                      <option value="Season">Season</option>
                      <option value="Condition">Condition</option>
                      <option value="Nutrient">Nutrient</option>
                      <option value="Category">Category</option>
                      <option value="HealthBenefit">Health Benefit</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target ID</label>
                    <input
                      type="text"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Enter entity ID or name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Hops</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={maxHops}
                      onChange={(e) => setMaxHops(parseInt(e.target.value))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}
              
              {(action === 'connected' || action === 'transitive') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {action === 'connected' ? 'Relationship Types (comma separated)' : 'Transitive Types (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={relationshipTypes}
                    onChange={(e) => setRelationshipTypes(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="e.g., CONTAINS,GROWN_IN"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Explore Relationships'}
              </button>
              
              {action !== 'discover-entities' && (
                <button
                  type="button"
                  onClick={discoverEntities}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Discover Entities
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Entity Discovery</h2>
          <p className="text-gray-600 mb-4">
            Automatically discover new entities from your product data and existing graph relationships.
          </p>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Discovered Entities</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoCreateEntities}
                    onChange={(e) => setAutoCreateEntities(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Auto-create in graph</span>
                </label>
                <button
                  onClick={discoverEntities}
                  disabled={entityDiscoveryLoading}
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:bg-gray-400 transition-colors flex items-center text-sm"
                >
                  {entityDiscoveryLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Discovering...
                    </>
                  ) : (
                    'Discover Entities'
                  )}
                </button>
              </div>
            </div>
            
            {discoveredEntities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No entities discovered yet. Click &quot;Discover Entities&quot; to find new entities.
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {discoveredEntities.map((entity) => (
                        <tr key={entity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entity.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {entity.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entity.source}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${entity.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {Math.round(entity.confidence * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-gray-50 text-sm text-gray-500">
                  Showing {discoveredEntities.length} discovered entities
                </div>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
            {renderResults()}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function DirectRelationshipsView({ relationships }: { relationships: Relationship[] }) {
  if (relationships.length === 0) {
    return <p className="text-gray-500">No relationships found.</p>;
  }
  
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Source
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Relationship
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Target
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Strength
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {relationships.map((rel, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {rel.source.type}
                  </span>
                </div>
                <div className="mt-1">{rel.source.name}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="font-medium">{rel.relationship.type}</div>
                {Object.keys(rel.relationship.properties).length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {Object.entries(rel.relationship.properties).slice(0, 2).map(([key, value]) => (
                      <div key={key}>{key}: {String(value)}</div>
                    ))}
                    {Object.keys(rel.relationship.properties).length > 2 && (
                      <div>+{Object.keys(rel.relationship.properties).length - 2} more</div>
                    )}
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {rel.target.type}
                  </span>
                </div>
                <div className="mt-1">{rel.target.name}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${rel.strength * 100}%` }}
                    ></div>
                  </div>
                  <span>{(rel.strength * 100).toFixed(1)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelationshipPathsView({ paths }: { paths: RelationshipPath[] }) {
  if (paths.length === 0) {
    return <p className="text-gray-500">No relationship paths found.</p>;
  }
  
  return (
    <div className="space-y-6">
      {paths.map((path, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-gray-900">Path #{index + 1}</h3>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Strength:</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${path.strength * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-900">{(path.strength * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="mb-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{path.explanation}</p>
          </div>
          
          <div className="flex items-center overflow-x-auto pb-2">
            {path.nodes.map((node, nodeIndex) => (
              <div key={nodeIndex} className="flex items-center">
                <div className="flex flex-col items-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {node.type}
                  </span>
                  <div className="mt-1 text-sm font-medium text-gray-900 max-w-[120px] truncate">
                    {node.name}
                  </div>
                </div>
                
                {nodeIndex < path.nodes.length - 1 && (
                  <div className="mx-4 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1 text-xs text-gray-500">
                      {path.relationships[nodeIndex]?.type}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConnectedEntitiesView({ entities }: { entities: ConnectedEntity[] }) {
  if (entities.length === 0) {
    return <p className="text-gray-500">No connected entities found.</p>;
  }
  
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Connected Entity
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Common Relationships
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Connection Strength
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {entities.map((entity, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {entity.entity.type}
                  </span>
                </div>
                <div className="mt-1">{entity.entity.name}</div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-500">
                <div className="flex flex-wrap gap-1">
                  {entity.commonRelationships.slice(0, 3).map((rel, relIndex) => (
                    <span key={relIndex} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {rel}
                    </span>
                  ))}
                  {entity.commonRelationships.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{entity.commonRelationships.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${(entity.connectionStrength / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span>{entity.connectionStrength}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatisticsView({ stats }: { stats: { relationshipTypes: Array<{ type: string; count: number }>; strengthDistribution: Array<{ range: string; count: number; percentage: number }> } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Relationship Types</h3>
        <div className="space-y-3">
          {stats.relationshipTypes.map((rel: { type: string; count: number }, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{rel.type}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {rel.count}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Strength Distribution</h3>
        <div className="space-y-3">
          {stats.strengthDistribution.map((strength: { range: string; count: number; percentage: number }, index: number) => (
            <div key={index}>
              <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
                <span>{strength.range}</span>
                <span>{strength.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${strength.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Count: {strength.count}</span>
                <span>{strength.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
