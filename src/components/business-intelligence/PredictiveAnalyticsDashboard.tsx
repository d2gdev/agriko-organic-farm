'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Brain,
  Target,
  AlertTriangle,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  ShoppingCart
} from 'lucide-react';

// Predictive Analytics Types
interface MarketForecast {
  segment: string;
  currentValue: number;
  predictedValue: number;
  growthRate: number;
  confidence: number;
  timeHorizon: number; // months
  factors: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface CompetitorMovementPrediction {
  competitorId: string;
  competitorName: string;
  predictedActions: {
    action: string;
    probability: number;
    timeframe: string;
    impact: 'low' | 'medium' | 'high';
    category: 'pricing' | 'product' | 'channel' | 'strategy';
  }[];
  overallThreatLevel: number;
  confidence: number;
}

interface ScenarioAnalysis {
  scenarioId: string;
  name: string;
  description: string;
  probability: number;
  outcomes: {
    marketShare: number;
    revenue: number;
    risk: number;
  };
  timeline: string;
  keyAssumptions: string[];
  mitigationStrategies: string[];
}

interface TrendPrediction {
  trend: string;
  currentStage: 'emerging' | 'growing' | 'mature' | 'declining';
  nextStage: string;
  timeToTransition: number; // months
  adoptionRate: number;
  disruptionPotential: number;
  businessImpact: {
    opportunity: number;
    threat: number;
    description: string;
  };
}

interface RiskAssessment {
  riskId: string;
  category: 'market' | 'competitive' | 'technology' | 'regulatory';
  description: string;
  probability: number;
  impact: number;
  riskScore: number;
  mitigation: string[];
  timeline: string;
}

export default function PredictiveAnalyticsDashboard() {
  // State Management
  const [_selectedTimeframe, _setSelectedTimeframe] = useState<'3m' | '6m' | '12m'>('6m');
  const [activeScenario, setActiveScenario] = useState<string>('base');
  const [_confidenceThreshold, _setConfidenceThreshold] = useState<number>(70);

  // Mock Predictive Data
  const [marketForecasts] = useState<MarketForecast[]>([
    {
      segment: 'Enterprise SaaS',
      currentValue: 45000000,
      predictedValue: 52000000,
      growthRate: 15.6,
      confidence: 82,
      timeHorizon: 6,
      factors: ['AI adoption', 'Remote work trends', 'Digital transformation'],
      riskLevel: 'low'
    },
    {
      segment: 'SMB Software',
      currentValue: 23000000,
      predictedValue: 28500000,
      growthRate: 23.9,
      confidence: 75,
      timeHorizon: 6,
      factors: ['SMB digitization', 'Cost efficiency focus', 'Cloud migration'],
      riskLevel: 'medium'
    },
    {
      segment: 'AI/ML Services',
      currentValue: 8500000,
      predictedValue: 14200000,
      growthRate: 67.1,
      confidence: 68,
      timeHorizon: 6,
      factors: ['AI mainstream adoption', 'Regulatory clarity', 'Technology maturity'],
      riskLevel: 'high'
    }
  ]);

  const [competitorPredictions] = useState<CompetitorMovementPrediction[]>([
    {
      competitorId: 'techcorp',
      competitorName: 'TechCorp Solutions',
      predictedActions: [
        {
          action: 'Price reduction on enterprise plans',
          probability: 78,
          timeframe: '2-4 weeks',
          impact: 'high',
          category: 'pricing'
        },
        {
          action: 'Launch AI-powered analytics suite',
          probability: 65,
          timeframe: '3-5 months',
          impact: 'medium',
          category: 'product'
        },
        {
          action: 'Expand European operations',
          probability: 52,
          timeframe: '6-8 months',
          impact: 'medium',
          category: 'channel'
        }
      ],
      overallThreatLevel: 72,
      confidence: 79
    },
    {
      competitorId: 'marketleader',
      competitorName: 'Market Leader Inc',
      predictedActions: [
        {
          action: 'Strategic acquisition in AI space',
          probability: 84,
          timeframe: '1-3 months',
          impact: 'high',
          category: 'strategy'
        },
        {
          action: 'Partner with major cloud provider',
          probability: 71,
          timeframe: '2-4 months',
          impact: 'medium',
          category: 'channel'
        }
      ],
      overallThreatLevel: 85,
      confidence: 88
    }
  ]);

  const [scenarios] = useState<ScenarioAnalysis[]>([
    {
      scenarioId: 'base',
      name: 'Base Case',
      description: 'Current market conditions continue with steady growth',
      probability: 45,
      outcomes: {
        marketShare: 18.5,
        revenue: 52000000,
        risk: 25
      },
      timeline: '12 months',
      keyAssumptions: [
        'Stable economic conditions',
        'Moderate competitive pressure',
        'Continued technology adoption'
      ],
      mitigationStrategies: []
    },
    {
      scenarioId: 'optimistic',
      name: 'Growth Acceleration',
      description: 'Favorable market conditions drive rapid expansion',
      probability: 25,
      outcomes: {
        marketShare: 22.8,
        revenue: 67000000,
        risk: 35
      },
      timeline: '12 months',
      keyAssumptions: [
        'Strong economic growth',
        'AI adoption accelerates',
        'Successful product launches'
      ],
      mitigationStrategies: [
        'Scale infrastructure proactively',
        'Increase hiring in key areas',
        'Strengthen supply chain'
      ]
    },
    {
      scenarioId: 'pessimistic',
      name: 'Market Contraction',
      description: 'Economic downturn and increased competition',
      probability: 20,
      outcomes: {
        marketShare: 14.2,
        revenue: 38000000,
        risk: 65
      },
      timeline: '12 months',
      keyAssumptions: [
        'Economic recession',
        'Intense price competition',
        'Delayed technology adoption'
      ],
      mitigationStrategies: [
        'Cost optimization programs',
        'Focus on core markets',
        'Defensive pricing strategy'
      ]
    },
    {
      scenarioId: 'disruption',
      name: 'Technology Disruption',
      description: 'Major technological shift changes market dynamics',
      probability: 10,
      outcomes: {
        marketShare: 11.5,
        revenue: 31000000,
        risk: 85
      },
      timeline: '12 months',
      keyAssumptions: [
        'Breakthrough AI technology',
        'New market entrants',
        'Customer behavior shift'
      ],
      mitigationStrategies: [
        'Accelerate R&D investment',
        'Strategic partnerships',
        'Pivot product strategy'
      ]
    }
  ]);

  const [trendPredictions] = useState<TrendPrediction[]>([
    {
      trend: 'AI-First Product Design',
      currentStage: 'growing',
      nextStage: 'Mainstream adoption',
      timeToTransition: 8,
      adoptionRate: 34,
      disruptionPotential: 85,
      businessImpact: {
        opportunity: 78,
        threat: 45,
        description: 'AI integration becomes standard expectation across all software products'
      }
    },
    {
      trend: 'No-Code/Low-Code Platforms',
      currentStage: 'mature',
      nextStage: 'Market saturation',
      timeToTransition: 18,
      adoptionRate: 67,
      disruptionPotential: 52,
      businessImpact: {
        opportunity: 42,
        threat: 68,
        description: 'Democratizes software development but commoditizes basic functionality'
      }
    },
    {
      trend: 'Privacy-First Architecture',
      currentStage: 'emerging',
      nextStage: 'Regulatory compliance standard',
      timeToTransition: 12,
      adoptionRate: 23,
      disruptionPotential: 71,
      businessImpact: {
        opportunity: 65,
        threat: 35,
        description: 'Privacy becomes competitive differentiator and compliance requirement'
      }
    }
  ]);

  const [riskAssessments] = useState<RiskAssessment[]>([
    {
      riskId: 'price-war',
      category: 'competitive',
      description: 'Major competitors initiate aggressive pricing war',
      probability: 68,
      impact: 75,
      riskScore: 51,
      mitigation: [
        'Develop value-based pricing strategy',
        'Focus on differentiation',
        'Strengthen customer relationships'
      ],
      timeline: '2-6 months'
    },
    {
      riskId: 'tech-disruption',
      category: 'technology',
      description: 'Breakthrough technology makes current solutions obsolete',
      probability: 25,
      impact: 90,
      riskScore: 22.5,
      mitigation: [
        'Increase R&D investment',
        'Monitor emerging technologies',
        'Develop platform strategy'
      ],
      timeline: '6-18 months'
    },
    {
      riskId: 'market-saturation',
      category: 'market',
      description: 'Primary market reaches saturation point',
      probability: 45,
      impact: 60,
      riskScore: 27,
      mitigation: [
        'Expand to adjacent markets',
        'Develop new use cases',
        'International expansion'
      ],
      timeline: '12-24 months'
    }
  ]);

  // Helper Functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'medium': return <Target className="w-4 h-4 text-yellow-600" />;
      case 'low': return <ArrowDownRight className="w-4 h-4 text-green-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing': return <DollarSign className="w-4 h-4" />;
      case 'product': return <ShoppingCart className="w-4 h-4" />;
      case 'channel': return <Users className="w-4 h-4" />;
      case 'strategy': return <Brain className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getCurrentScenario = () => {
    return scenarios.find(s => s.scenarioId === activeScenario) || scenarios[0] || undefined;
  };

  const scenario = getCurrentScenario();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">AI-powered market forecasting and strategic insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={_selectedTimeframe}
            onChange={(e) => _setSelectedTimeframe(e.target.value as '3m' | '6m' | '12m')}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="3m">3 Months</option>
            <option value="6m">6 Months</option>
            <option value="12m">12 Months</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Min Confidence:</label>
            <select
              value={_confidenceThreshold}
              onChange={(e) => _setConfidenceThreshold(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="50">50%</option>
              <option value="60">60%</option>
              <option value="70">70%</option>
              <option value="80">80%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prediction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Growth</p>
                <p className="text-2xl font-bold text-green-600">+18.7%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Predicted 6-month growth</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Threat Level</p>
                <p className="text-2xl font-bold text-orange-600">Medium</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Competitive assessment</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Confidence</p>
                <p className="text-2xl font-bold text-blue-600">79%</p>
              </div>
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average prediction confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-red-600">34/100</p>
              </div>
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall risk assessment</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="forecasts" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-xl">
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        {/* Market Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Market Segment Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {marketForecasts.map((forecast, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{forecast.segment}</h3>
                        <p className="text-sm text-muted-foreground">
                          {forecast.timeHorizon} month projection
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getConfidenceColor(forecast.confidence)}>
                          {forecast.confidence}% confidence
                        </Badge>
                        <Badge className={getRiskLevelColor(forecast.riskLevel)} variant="outline">
                          {forecast.riskLevel} risk
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className="text-lg font-bold">{formatCurrency(forecast.currentValue)}</p>
                      </div>
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Predicted Value</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(forecast.predictedValue)}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Growth Rate</p>
                        <p className="text-lg font-bold text-blue-600">+{forecast.growthRate}%</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Key Growth Factors</p>
                      <div className="flex flex-wrap gap-2">
                        {forecast.factors.map((factor, idx) => (
                          <Badge key={idx} variant="outline">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Progress value={forecast.confidence} className="mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Prediction confidence based on historical data and market indicators
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario Analysis Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Scenario Planning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Scenario Selection */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {scenarios.map((scen) => (
                  <button
                    key={scen.scenarioId}
                    onClick={() => setActiveScenario(scen.scenarioId)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      activeScenario === scen.scenarioId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-medium text-sm">{scen.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{scen.probability}% probability</p>
                    <div className="text-xs">
                      <span className="text-green-600">Revenue: {formatCurrency(scen.outcomes.revenue)}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Scenario Details */}
              {scenario ? (
                <div className="p-6 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{scenario.name}</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{scenario.probability}% probability</Badge>
                      <Badge variant="outline">{scenario.timeline}</Badge>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">{scenario.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 rounded border bg-white">
                      <p className="text-sm text-muted-foreground">Market Share</p>
                      <p className="text-2xl font-bold">{scenario.outcomes.marketShare}%</p>
                    </div>
                  <div className="text-center p-4 rounded border bg-white">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(scenario.outcomes.revenue)}</p>
                  </div>
                  <div className="text-center p-4 rounded border bg-white">
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                    <p className="text-2xl font-bold">{scenario.outcomes.risk}/100</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Key Assumptions</h4>
                    <ul className="space-y-2">
                      {scenario.keyAssumptions.map((assumption, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          {assumption}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {scenario.mitigationStrategies.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Mitigation Strategies</h4>
                      <ul className="space-y-2">
                        {scenario.mitigationStrategies.map((strategy, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Zap className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No scenario data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitor Predictions Tab */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Competitor Movement Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {competitorPredictions.map((prediction, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">{prediction.competitorName}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getConfidenceColor(prediction.confidence)}>
                          {prediction.confidence}% confidence
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Threat Level</p>
                          <p className="font-bold">{prediction.overallThreatLevel}/100</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {prediction.predictedActions.map((action, idx) => (
                        <div key={idx} className="p-3 rounded border-l-4 border-l-orange-500 bg-orange-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(action.category)}
                              <span className="font-medium text-sm">{action.action}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getImpactIcon(action.impact)}
                              <span className="text-sm font-medium">{action.probability}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {action.timeframe}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {action.impact} impact
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {action.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Predictions Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Emerging Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trendPredictions.map((trend, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">{trend.trend}</h3>
                        <p className="text-sm text-muted-foreground">
                          Currently {trend.currentStage} → {trend.nextStage} in {trend.timeToTransition} months
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Adoption Rate</p>
                        <p className="text-2xl font-bold">{trend.adoptionRate}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Disruption Potential</p>
                        <p className="text-lg font-bold text-red-600">{trend.disruptionPotential}%</p>
                        <Progress value={trend.disruptionPotential} className="mt-2" />
                      </div>
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Opportunity Score</p>
                        <p className="text-lg font-bold text-green-600">{trend.businessImpact.opportunity}%</p>
                        <Progress value={trend.businessImpact.opportunity} className="mt-2" />
                      </div>
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Threat Score</p>
                        <p className="text-lg font-bold text-orange-600">{trend.businessImpact.threat}%</p>
                        <Progress value={trend.businessImpact.threat} className="mt-2" />
                      </div>
                    </div>

                    <div className="p-3 rounded border bg-gray-50">
                      <h4 className="font-medium text-sm mb-2">Business Impact Analysis</h4>
                      <p className="text-sm text-muted-foreground">{trend.businessImpact.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Assessment Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskAssessments.map((risk, index) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRiskLevelColor(risk.category)}>
                          {risk.category}
                        </Badge>
                        <h3 className="font-medium">{risk.description}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <p className="text-lg font-bold text-red-600">{risk.riskScore.toFixed(1)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Probability</p>
                        <p className="text-lg font-bold">{risk.probability}%</p>
                        <Progress value={risk.probability} className="mt-2" />
                      </div>
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Impact</p>
                        <p className="text-lg font-bold">{risk.impact}%</p>
                        <Progress value={risk.impact} className="mt-2" />
                      </div>
                      <div className="text-center p-3 rounded border">
                        <p className="text-sm text-muted-foreground">Timeline</p>
                        <p className="text-sm font-bold">{risk.timeline}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Mitigation Strategies
                      </h4>
                      <ul className="space-y-1">
                        {risk.mitigation.map((strategy, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Target className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}