'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { CompetitorWithStatus } from '@/types/business-intelligence-types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';

// Competitive Analysis Types
interface CompetitorProfile {
  id: string;
  name: string;
  domain: string;
  industry: string;
  marketShare: number;
  revenueEstimate: number;
  employeeCount: number;
  lastUpdated: Date;
  status: 'active' | 'dormant' | 'emerging';
  threatLevel: 'high' | 'medium' | 'low';
}

interface PriceComparison {
  product: string;
  ourPrice: number;
  competitorPrice: number;
  difference: number;
  percentageDiff: number;
  pricePosition: 'premium' | 'competitive' | 'discount';
  lastChanged: Date;
}

interface ProductComparison {
  category: string;
  ourProducts: number;
  competitorProducts: number;
  marketCoverage: number;
  gapAnalysis: {
    missingFeatures: string[];
    advantages: string[];
    opportunities: string[];
  };
}

interface ChannelAnalysis {
  channel: string;
  ourPresence: boolean;
  competitorPresence: boolean;
  effectiveness: number;
  opportunity: 'high' | 'medium' | 'low';
}

interface CompetitiveIntelligence {
  competitorId: string;
  competitorName: string;
  lastAnalysis: Date;
  overallThreatScore: number;
  keyFindings: string[];
  strategicRecommendations: string[];
  confidence: number;
}

export default function CompetitiveAnalysisWidget() {
  // State Management
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('techcorp');
  const [analysisView, setAnalysisView] = useState<'overview' | 'pricing' | 'products' | 'channels'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Real Data from API
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);

  // Fetch competitors from API
  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        const response = await fetch('/api/competitors');
        if (response.ok) {
          const data = await response.json();
          // Transform API data to CompetitorProfile format
          const transformedCompetitors = data.map((competitor: {
            id?: string;
            name?: string;
            domain?: string;
            industry?: string;
          }, index: number) => ({
            id: competitor.id || `competitor-${index}`,
            name: competitor.name || 'Unknown Competitor',
            domain: competitor.domain || 'unknown.com',
            industry: competitor.industry || 'Unknown',
            marketShare: Math.random() * 30 + 5, // Placeholder calculation
            revenueEstimate: Math.random() * 50000000 + 10000000, // Placeholder
            employeeCount: Math.floor(Math.random() * 500 + 50), // Placeholder
            lastUpdated: new Date(),
            status: (competitor as CompetitorWithStatus).is_active ? 'active' : 'inactive',
            threatLevel: 'medium' as const
          }));
          setCompetitors(transformedCompetitors);

          // Set first competitor as selected if none selected
          if (transformedCompetitors.length > 0 && selectedCompetitor === 'techcorp') {
            setSelectedCompetitor(transformedCompetitors[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch competitors:', error);
      }
    };

    fetchCompetitors();
  }, [selectedCompetitor]);

  const [priceComparisons] = useState<PriceComparison[]>([
    {
      product: 'Enterprise Plan',
      ourPrice: 299,
      competitorPrice: 249,
      difference: 50,
      percentageDiff: 20.1,
      pricePosition: 'premium',
      lastChanged: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      product: 'Professional Plan',
      ourPrice: 149,
      competitorPrice: 179,
      difference: -30,
      percentageDiff: -16.8,
      pricePosition: 'competitive',
      lastChanged: new Date(Date.now() - 48 * 60 * 60 * 1000)
    },
    {
      product: 'Basic Plan',
      ourPrice: 49,
      competitorPrice: 59,
      difference: -10,
      percentageDiff: -16.9,
      pricePosition: 'discount',
      lastChanged: new Date(Date.now() - 72 * 60 * 60 * 1000)
    }
  ]);

  const [productComparisons] = useState<ProductComparison[]>([
    {
      category: 'Analytics Tools',
      ourProducts: 12,
      competitorProducts: 15,
      marketCoverage: 78,
      gapAnalysis: {
        missingFeatures: ['Real-time dashboards', 'Custom reporting'],
        advantages: ['AI-powered insights', 'Better UX'],
        opportunities: ['Mobile analytics', 'API integrations']
      }
    },
    {
      category: 'Automation Features',
      ourProducts: 8,
      competitorProducts: 6,
      marketCoverage: 92,
      gapAnalysis: {
        missingFeatures: [],
        advantages: ['Workflow builder', 'Smart triggers'],
        opportunities: ['Industry templates', 'Third-party connectors']
      }
    }
  ]);

  const [channelAnalysis] = useState<ChannelAnalysis[]>([
    {
      channel: 'Direct Sales',
      ourPresence: true,
      competitorPresence: true,
      effectiveness: 85,
      opportunity: 'medium'
    },
    {
      channel: 'Partner Network',
      ourPresence: true,
      competitorPresence: true,
      effectiveness: 67,
      opportunity: 'high'
    },
    {
      channel: 'Online Marketplace',
      ourPresence: false,
      competitorPresence: true,
      effectiveness: 0,
      opportunity: 'high'
    },
    {
      channel: 'Reseller Channel',
      ourPresence: true,
      competitorPresence: false,
      effectiveness: 72,
      opportunity: 'low'
    }
  ]);

  const [competitiveIntelligence] = useState<CompetitiveIntelligence[]>([
    {
      competitorId: 'techcorp',
      competitorName: 'TechCorp Solutions',
      lastAnalysis: new Date(),
      overallThreatScore: 78,
      keyFindings: [
        'Aggressive pricing strategy launched last week',
        'New AI features announced in roadmap',
        'Expanded sales team by 40% in Q4',
        'Partnership with major cloud provider'
      ],
      strategicRecommendations: [
        'Consider counter-pricing strategy for enterprise segment',
        'Accelerate AI feature development timeline',
        'Strengthen partner relationships',
        'Monitor their cloud integration capabilities'
      ],
      confidence: 87
    }
  ]);

  // Helper Functions
  const getCurrentCompetitor = (): CompetitorProfile | undefined => {
    return competitors.find(c => c.id === selectedCompetitor) || competitors[0];
  };

  const getCurrentIntelligence = () => {
    return competitiveIntelligence.find(ci => ci.competitorId === selectedCompetitor);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'emerging': return 'text-blue-600 bg-blue-100';
      case 'dormant': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPricePositionIcon = (position: string) => {
    switch (position) {
      case 'premium': return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'competitive': return <Minus className="w-4 h-4 text-yellow-600" />;
      case 'discount': return <ArrowDownRight className="w-4 h-4 text-green-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const competitor = getCurrentCompetitor();
  const intelligence = getCurrentIntelligence();

  return (
    <div className="space-y-6">
      {/* Competitor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Competitive Analysis
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedCompetitor}
                onChange={(e) => setSelectedCompetitor(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {competitors.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Competitor Overview */}
          {competitor ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Market Share</p>
                <p className="text-2xl font-bold">{competitor.marketShare}%</p>
                <Progress value={competitor.marketShare} className="mt-2" />
              </div>
              <div className="text-center p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Revenue Est.</p>
                <p className="text-2xl font-bold">{formatCurrency(competitor.revenueEstimate)}</p>
                <p className="text-xs text-muted-foreground mt-1">Annual</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{formatLargeNumber(competitor.employeeCount)}</p>
                <p className="text-xs text-muted-foreground mt-1">Headcount</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Threat Level</p>
                <Badge className={getThreatColor(competitor.threatLevel)}>
                  {competitor.threatLevel.toUpperCase()}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Assessment</p>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No competitor data available
            </div>
          )}

          {/* Analysis Tabs */}
          <div className="border-b mb-4">
            <nav className="flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'pricing', label: 'Pricing', icon: DollarSign },
                { key: 'products', label: 'Products', icon: ShoppingCart },
                { key: 'channels', label: 'Channels', icon: Users }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setAnalysisView(key as 'overview' | 'pricing' | 'products' | 'channels')}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    analysisView === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab Content */}
          {analysisView === 'overview' && intelligence && (
            <div className="space-y-6">
              {/* Threat Score */}
              <div className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Overall Threat Score</h3>
                  <span className="text-2xl font-bold text-orange-600">
                    {intelligence.overallThreatScore}/100
                  </span>
                </div>
                <Progress value={intelligence.overallThreatScore} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Confidence: {intelligence.confidence}% • Last updated: {intelligence.lastAnalysis.toLocaleDateString()}
                </p>
              </div>

              {/* Key Findings */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Key Findings
                </h3>
                <div className="space-y-2">
                  {intelligence.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded border">
                      <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Recommendations */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Strategic Recommendations
                </h3>
                <div className="space-y-2">
                  {intelligence.strategicRecommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded border">
                      <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab Content */}
          {analysisView === 'pricing' && (
            <div className="space-y-4">
              <h3 className="font-medium">Price Comparison Analysis</h3>
              {priceComparisons.map((comparison, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPricePositionIcon(comparison.pricePosition)}
                      <span className="font-medium">{comparison.product}</span>
                    </div>
                    <Badge variant="outline" className={
                      comparison.pricePosition === 'premium' ? 'text-red-600 bg-red-100' :
                      comparison.pricePosition === 'competitive' ? 'text-yellow-600 bg-yellow-100' :
                      'text-green-600 bg-green-100'
                    }>
                      {comparison.pricePosition}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Our Price</p>
                      <p className="font-bold">{formatCurrency(comparison.ourPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Their Price</p>
                      <p className="font-bold">{formatCurrency(comparison.competitorPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Difference</p>
                      <p className={`font-bold ${comparison.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {comparison.difference > 0 ? '+' : ''}{formatCurrency(comparison.difference)}
                        <span className="text-xs ml-1">({comparison.percentageDiff > 0 ? '+' : ''}{comparison.percentageDiff.toFixed(1)}%)</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products Tab Content */}
          {analysisView === 'products' && (
            <div className="space-y-4">
              <h3 className="font-medium">Product Portfolio Comparison</h3>
              {productComparisons.map((comparison, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{comparison.category}</h4>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Market Coverage</p>
                      <p className="font-bold">{comparison.marketCoverage}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 rounded border">
                      <p className="text-sm text-muted-foreground">Our Products</p>
                      <p className="text-xl font-bold text-blue-600">{comparison.ourProducts}</p>
                    </div>
                    <div className="text-center p-3 rounded border">
                      <p className="text-sm text-muted-foreground">Their Products</p>
                      <p className="text-xl font-bold text-orange-600">{comparison.competitorProducts}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {comparison.gapAnalysis.missingFeatures.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-1">Missing Features</p>
                        <div className="flex flex-wrap gap-1">
                          {comparison.gapAnalysis.missingFeatures.map((feature, idx) => (
                            <Badge key={idx} variant="danger" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {comparison.gapAnalysis.advantages.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">Our Advantages</p>
                        <div className="flex flex-wrap gap-1">
                          {comparison.gapAnalysis.advantages.map((advantage, idx) => (
                            <Badge key={idx} variant="default" className="text-xs bg-green-100 text-green-800">
                              {advantage}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {comparison.gapAnalysis.opportunities.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">Opportunities</p>
                        <div className="flex flex-wrap gap-1">
                          {comparison.gapAnalysis.opportunities.map((opportunity, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs text-blue-600">
                              {opportunity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Channels Tab Content */}
          {analysisView === 'channels' && (
            <div className="space-y-4">
              <h3 className="font-medium">Channel Strategy Comparison</h3>
              {channelAnalysis.map((channel, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{channel.channel}</h4>
                    <Badge variant="outline" className={
                      channel.opportunity === 'high' ? 'text-green-600 bg-green-100' :
                      channel.opportunity === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                      'text-gray-600 bg-gray-100'
                    }>
                      {channel.opportunity} opportunity
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Our Presence</p>
                      <div className={`w-3 h-3 rounded-full mx-auto ${channel.ourPresence ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Their Presence</p>
                      <div className={`w-3 h-3 rounded-full mx-auto ${channel.competitorPresence ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Effectiveness</p>
                      <p className="font-bold">{channel.effectiveness}%</p>
                    </div>
                  </div>

                  {channel.ourPresence && (
                    <Progress value={channel.effectiveness} className="mb-2" />
                  )}

                  {!channel.ourPresence && channel.competitorPresence && (
                    <div className="p-2 rounded bg-yellow-50 border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        Competitor has presence in this channel while we don&apos;t - consider expansion
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}