'use client';

import { Core } from '@/types/TYPE_REGISTRY';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Save, X, Globe, Settings } from 'lucide-react';

interface CompetitorConfig {
  key: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  selectors: {
    productName: string;
    price: string;
    availability?: string;
    imageUrl?: string;
    description?: string;
    rating?: string;
    reviews?: string;
    sku?: string;
  };
  priceParsing: {
    currencySymbol: string;
    decimalSeparator: string;
  };
  rateLimitMs: number;
  headers?: Record<string, string>;
}

const defaultCompetitor: CompetitorConfig = {
  key: '',
  name: '',
  baseUrl: '',
  enabled: true,
  selectors: {
    productName: '',
    price: '',
    availability: '',
    imageUrl: '',
    description: '',
    rating: '',
    reviews: '',
    sku: ''
  },
  priceParsing: {
    currencySymbol: '$',
    decimalSeparator: '.'
  },
  rateLimitMs: 2000,
  headers: {}
};

export default function CompetitorManager() {
  const [competitors, setCompetitors] = useState<CompetitorConfig[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CompetitorConfig>(defaultCompetitor);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  // Load competitors on mount
  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/competitors/config');
      if (response.ok) {
        const data = await response.json();
        setCompetitors(data.competitors || []);
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (competitor: CompetitorConfig) => {
    try {
      const response = await fetch('/api/competitors/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', competitor })
      });

      if (response.ok) {
        await fetchCompetitors();
        setEditingId(null);
        setIsAddingNew(false);
        setEditForm(defaultCompetitor);
      }
    } catch (error) {
      console.error('Failed to save competitor:', error);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete this competitor?`)) return;

    try {
      const response = await fetch('/api/competitors/config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      if (response.ok) {
        await fetchCompetitors();
      }
    } catch (error) {
      console.error('Failed to delete competitor:', error);
    }
  };

  const handleToggleEnabled = async (key: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/competitors/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', key, enabled })
      });

      if (response.ok) {
        setCompetitors(prev => 
          prev.map(c => c.key === key ? { ...c, enabled } : c)
        );
      }
    } catch (error) {
      console.error('Failed to toggle competitor:', error);
    }
  };

  const startEdit = (competitor: CompetitorConfig) => {
    setEditingId(competitor.key);
    setEditForm(competitor);
    setIsAddingNew(false);
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setEditForm({
      ...defaultCompetitor,
      key: `competitor_${Date.now()}`,
      name: 'New Competitor'
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setEditForm(defaultCompetitor);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Competitor Configuration</h2>
        <Button onClick={startAddNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Competitor
        </Button>
      </div>

      {/* Add New Competitor Form */}
      {isAddingNew && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle>Add New Competitor</CardTitle>
          </CardHeader>
          <CardContent>
            <CompetitorForm
              competitor={editForm}
              onChange={setEditForm}
              onSave={() => handleSave(editForm)}
              onCancel={cancelEdit}
            />
          </CardContent>
        </Card>
      )}

      {/* Competitors List */}
      {loading ? (
        <div className="text-center py-8">Loading competitors...</div>
      ) : (
        <div className="grid gap-4">
          {competitors.map((competitor) => (
            <Card key={competitor.key} className={!competitor.enabled ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{competitor.name}</CardTitle>
                      <Badge variant={competitor.enabled ? 'success' : 'secondary'}>
                        {competitor.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {competitor.baseUrl}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCompetitor(
                        expandedCompetitor === competitor.key ? null : competitor.key
                      )}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleEnabled(competitor.key, !competitor.enabled)}
                    >
                      {competitor.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(competitor)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(competitor.key)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Edit Form */}
              {editingId === competitor.key && (
                <CardContent className="border-t">
                  <CompetitorForm
                    competitor={editForm}
                    onChange={setEditForm}
                    onSave={() => handleSave(editForm)}
                    onCancel={cancelEdit}
                  />
                </CardContent>
              )}

              {/* Expanded Details */}
              {expandedCompetitor === competitor.key && editingId !== competitor.key && (
                <CardContent className="border-t">
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">CSS Selectors</h4>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>Product Name: <code className="bg-gray-100 px-1">{competitor.selectors.productName || 'Not set'}</code></div>
                        <div>Price: <code className="bg-gray-100 px-1">{competitor.selectors.price || 'Not set'}</code></div>
                        <div>Availability: <code className="bg-gray-100 px-1">{competitor.selectors.availability || 'Not set'}</code></div>
                        <div>Image: <code className="bg-gray-100 px-1">{competitor.selectors.imageUrl || 'Not set'}</code></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Parsing Settings</h4>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>Currency: {competitor.priceParsing.currencySymbol}</div>
                        <div>Decimal Sep: {competitor.priceParsing.decimalSeparator}</div>
                        <div>Rate Limit: {competitor.rateLimitMs}ms</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {competitors.length === 0 && !loading && !isAddingNew && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No competitors configured yet.</p>
            <Button onClick={startAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Competitor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Competitor Form Component
function CompetitorForm({
  competitor,
  onChange,
  onSave,
  onCancel
}: {
  competitor: CompetitorConfig;
  onChange: (c: CompetitorConfig) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            value={competitor.name}
            onChange={(e) => onChange({ ...competitor, name: e.target.value })}
            placeholder="e.g., Whole Foods Market"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Key (unique identifier)</label>
          <Input
            value={competitor.key}
            onChange={(e) => onChange({ ...competitor, key: e.target.value })}
            placeholder="e.g., whole_foods"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Base URL</label>
          <Input
            value={competitor.baseUrl}
            onChange={(e) => onChange({ ...competitor, baseUrl: e.target.value })}
            placeholder="https://www.example.com"
          />
        </div>
      </div>

      {/* CSS Selectors */}
      <div>
        <h4 className="font-medium mb-3">CSS Selectors</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Product Name</label>
            <Input
              value={competitor.selectors.productName}
              onChange={(e) => onChange({
                ...competitor,
                selectors: { ...competitor.selectors, productName: e.target.value }
              })}
              placeholder=".product-title, h1.name"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Price</label>
            <Input
              value={competitor.selectors.price}
              onChange={(e) => onChange({
                ...competitor,
                selectors: { ...competitor.selectors, price: e.target.value }
              })}
              placeholder=".price-current, .price"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Availability</label>
            <Input
              value={competitor.selectors.availability || ''}
              onChange={(e) => onChange({
                ...competitor,
                selectors: { ...competitor.selectors, availability: e.target.value }
              })}
              placeholder=".stock-status"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Image URL</label>
            <Input
              value={competitor.selectors.imageUrl || ''}
              onChange={(e) => onChange({
                ...competitor,
                selectors: { ...competitor.selectors, imageUrl: e.target.value }
              })}
              placeholder=".product-image img"
            />
          </div>
        </div>
      </div>

      {/* Parsing Settings */}
      <div>
        <h4 className="font-medium mb-3">Parsing Settings</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600">Currency Symbol</label>
            <Input
              value={competitor.priceParsing.currencySymbol}
              onChange={(e) => onChange({
                ...competitor,
                priceParsing: { ...competitor.priceParsing, currencySymbol: e.target.value }
              })}
              placeholder="$"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Decimal Separator</label>
            <Input
              value={competitor.priceParsing.decimalSeparator}
              onChange={(e) => onChange({
                ...competitor,
                priceParsing: { ...competitor.priceParsing, decimalSeparator: e.target.value }
              })}
              placeholder="."
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Rate Limit (ms)</label>
            <Input
              type="number"
              value={competitor.rateLimitMs}
              onChange={(e) => onChange({
                ...competitor,
                rateLimitMs: parseInt(e.target.value) || 2000
              })}
              placeholder="2000"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Competitor
        </Button>
      </div>
    </div>
  );
}