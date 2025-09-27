'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Search,
  Plus,
  Eye,
  Zap,
  Mail,
  MessageSquare,
  Smartphone,
  Webhook,
  Brain,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Activity
} from 'lucide-react';

// Alert Management Types
interface Alert {
  id: string;
  title: string;
  description: string;
  category: 'competitive' | 'market' | 'pricing' | 'product' | 'channel' | 'security' | 'performance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  source: 'ai_analysis' | 'rule_trigger' | 'user_defined' | 'predictive_model';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  confidence: number;
  readBy: string[];
  actions: AlertAction[];
  metadata: {
    competitorId?: string;
    ruleId?: string;
    originalPriority?: string;
    aiAdjusted?: boolean;
  };
}

interface AlertAction {
  id: string;
  type: 'acknowledge' | 'resolve' | 'escalate' | 'comment' | 'assign';
  userId: string;
  userName: string;
  timestamp: Date;
  comment?: string;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: Alert['category'];
  priority: Alert['priority'];
  isActive: boolean;
  condition: {
    type: 'metric_threshold' | 'trend_change' | 'competitor_action' | 'market_event';
    criteria: Record<string, unknown>;
  };
  channels: ('email' | 'sms' | 'slack' | 'webhook')[];
  subscribers: string[];
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface AlertChannel {
  id: string;
  type: 'email' | 'sms' | 'slack' | 'webhook';
  name: string;
  isEnabled: boolean;
  configuration: Record<string, unknown>;
  lastUsed?: Date;
  deliveryRate: number;
}

interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedToday: number;
  averageResponseTime: number; // minutes
  alertsByPriority: Record<Alert['priority'], number>;
  alertsByCategory: Record<Alert['category'], number>;
  topTriggeredRules: { ruleId: string; ruleName: string; count: number }[];
}

export default function AlertManagementInterface() {
  // State Management
  const [activeTab, setActiveTab] = useState('alerts');
  const [filterStatus, setFilterStatus] = useState<Alert['status'] | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Alert['priority'] | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Alert['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [_selectedAlerts, _setSelectedAlerts] = useState<string[]>([]);

  // Mock Data
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'alert-1',
      title: 'Competitor Price Drop Detected',
      description: 'TechCorp reduced pricing by 15% on enterprise plans - immediate response recommended',
      category: 'pricing',
      priority: 'critical',
      status: 'active',
      source: 'ai_analysis',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      confidence: 92,
      readBy: [],
      actions: [],
      metadata: {
        competitorId: 'techcorp',
        aiAdjusted: true,
        originalPriority: 'high'
      }
    },
    {
      id: 'alert-2',
      title: 'New Product Launch Detected',
      description: 'MarketLeader announced AI-powered analytics suite similar to our roadmap items',
      category: 'product',
      priority: 'high',
      status: 'acknowledged',
      source: 'rule_trigger',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      assignedTo: 'product-team',
      confidence: 85,
      readBy: ['user1', 'user2'],
      actions: [
        {
          id: 'action-1',
          type: 'acknowledge',
          userId: 'user1',
          userName: 'John Smith',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          comment: 'Reviewing product roadmap impact'
        }
      ],
      metadata: {
        competitorId: 'marketleader',
        ruleId: 'product-launch-rule'
      }
    },
    {
      id: 'alert-3',
      title: 'Market Share Shift Predicted',
      description: 'AI models predict 23% probability of market consolidation in next 6 months',
      category: 'market',
      priority: 'medium',
      status: 'active',
      source: 'predictive_model',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      confidence: 73,
      readBy: ['user3'],
      actions: [],
      metadata: {}
    },
    {
      id: 'alert-4',
      title: 'Channel Expansion Opportunity',
      description: 'StartupX left European market - potential expansion opportunity identified',
      category: 'channel',
      priority: 'medium',
      status: 'resolved',
      source: 'ai_analysis',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      assignedTo: 'sales-team',
      confidence: 78,
      readBy: ['user1', 'user3', 'user4'],
      actions: [
        {
          id: 'action-2',
          type: 'resolve',
          userId: 'user4',
          userName: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          comment: 'Expansion plan initiated for Q2'
        }
      ],
      metadata: {
        competitorId: 'startupx'
      }
    }
  ]);

  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: 'rule-1',
      name: 'Competitor Price Changes',
      description: 'Monitor significant pricing changes across all competitors',
      category: 'pricing',
      priority: 'high',
      isActive: true,
      condition: {
        type: 'metric_threshold',
        criteria: {
          metric: 'price_change_percentage',
          operator: 'greater_than',
          value: 10
        }
      },
      channels: ['email', 'slack'],
      subscribers: ['pricing-team@company.com', 'executives@company.com'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
      triggerCount: 45
    },
    {
      id: 'rule-2',
      name: 'Product Launch Detection',
      description: 'Alert when competitors announce new products',
      category: 'product',
      priority: 'medium',
      isActive: true,
      condition: {
        type: 'competitor_action',
        criteria: {
          action_type: 'product_launch',
          keywords: ['launch', 'announce', 'introduce', 'new product']
        }
      },
      channels: ['email', 'webhook'],
      subscribers: ['product-team@company.com'],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      lastTriggered: new Date(Date.now() - 4 * 60 * 60 * 1000),
      triggerCount: 23
    }
  ]);

  const [alertChannels, setAlertChannels] = useState<AlertChannel[]>([
    {
      id: 'channel-1',
      type: 'email',
      name: 'Email Notifications',
      isEnabled: true,
      configuration: {
        smtpServer: 'smtp.company.com',
        fromAddress: 'alerts@company.com'
      },
      lastUsed: new Date(Date.now() - 30 * 60 * 1000),
      deliveryRate: 98.5
    },
    {
      id: 'channel-2',
      type: 'slack',
      name: 'Slack #alerts Channel',
      isEnabled: true,
      configuration: {
        webhookUrl: 'https://hooks.slack.com/...',
        channel: '#alerts'
      },
      lastUsed: new Date(Date.now() - 15 * 60 * 1000),
      deliveryRate: 99.2
    },
    {
      id: 'channel-3',
      type: 'sms',
      name: 'SMS Alerts',
      isEnabled: false,
      configuration: {
        provider: 'twilio',
        apiKey: '***masked***'
      },
      deliveryRate: 95.8
    }
  ]);

  const [statistics, _setStatistics] = useState<AlertStatistics>({
    totalAlerts: 156,
    activeAlerts: 23,
    resolvedToday: 8,
    averageResponseTime: 45,
    alertsByPriority: {
      low: 45,
      medium: 67,
      high: 32,
      critical: 12
    },
    alertsByCategory: {
      competitive: 42,
      market: 28,
      pricing: 35,
      product: 24,
      channel: 15,
      security: 8,
      performance: 4
    },
    topTriggeredRules: [
      { ruleId: 'rule-1', ruleName: 'Competitor Price Changes', count: 45 },
      { ruleId: 'rule-2', ruleName: 'Product Launch Detection', count: 23 }
    ]
  });

  // Helper Functions
  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'acknowledged': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: Alert['category']) => {
    switch (category) {
      case 'pricing': return <DollarSign className="w-4 h-4" />;
      case 'product': return <ShoppingCart className="w-4 h-4" />;
      case 'channel': return <Users className="w-4 h-4" />;
      case 'competitive': return <TrendingUp className="w-4 h-4" />;
      case 'market': return <Activity className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (source: Alert['source']) => {
    switch (source) {
      case 'ai_analysis': return <Brain className="w-4 h-4 text-blue-600" />;
      case 'rule_trigger': return <Zap className="w-4 h-4 text-orange-600" />;
      case 'predictive_model': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'user_defined': return <Settings className="w-4 h-4 text-gray-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChannelIcon = (type: AlertChannel['type']) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      case 'slack': return <MessageSquare className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Filter alerts based on current filters
  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || alert.category === filterCategory;
    const matchesSearch = searchQuery === '' ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  // Alert Actions
  const handleAlertAction = (alertId: string, actionType: AlertAction['type'], comment?: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert => {
        if (alert.id === alertId) {
          const newAction: AlertAction = {
            id: `action-${Date.now()}`,
            type: actionType,
            userId: 'current-user',
            userName: 'Current User',
            timestamp: new Date(),
            comment
          };

          let newStatus = alert.status;
          if (actionType === 'acknowledge') newStatus = 'acknowledged';
          if (actionType === 'resolve') newStatus = 'resolved';

          return {
            ...alert,
            status: newStatus,
            updatedAt: new Date(),
            actions: [...alert.actions, newAction],
            readBy: [...new Set([...alert.readBy, 'current-user'])]
          };
        }
        return alert;
      })
    );
  };

  const toggleAlertRule = (ruleId: string) => {
    setAlertRules(prevRules =>
      prevRules.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const toggleAlertChannel = (channelId: string) => {
    setAlertChannels(prevChannels =>
      prevChannels.map(channel =>
        channel.id === channelId ? { ...channel, isEnabled: !channel.isEnabled } : channel
      )
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Alert Management</h2>
          <p className="text-muted-foreground">Intelligent monitoring and notification system</p>
        </div>
        <div className="flex items-center gap-3">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{statistics.totalAlerts}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-red-600">{statistics.activeAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">{statistics.resolvedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{statistics.averageResponseTime}m</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as Alert['status'] | 'all')}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as Alert['priority'] | 'all')}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as Alert['category'] | 'all')}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="competitive">Competitive</option>
                  <option value="market">Market</option>
                  <option value="pricing">Pricing</option>
                  <option value="product">Product</option>
                  <option value="channel">Channel</option>
                  <option value="security">Security</option>
                  <option value="performance">Performance</option>
                </select>

                <Badge variant="outline">
                  {filteredAlerts.length} alerts
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${getPriorityColor(alert.priority)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(alert.category)}
                        {getSourceIcon(alert.source)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Confidence: {alert.confidence}%</span>
                      <span>Created: {formatTimeAgo(alert.createdAt)}</span>
                      {alert.assignedTo && <span>Assigned: {alert.assignedTo}</span>}
                      <span>Read by: {alert.readBy.length} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAlertAction(alert.id, 'resolve', 'Resolved via dashboard')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {alert.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Actions</h4>
                      <div className="space-y-1">
                        {alert.actions.slice(-2).map((action) => (
                          <div key={action.id} className="text-xs text-muted-foreground">
                            <span className="font-medium">{action.userName}</span> {action.type}d this alert
                            {action.comment && <span> - &quot;{action.comment}&quot;</span>}
                            <span className="ml-2">{formatTimeAgo(action.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleAlertRule(rule.id)}
                          className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                        />
                        <div>
                          <h3 className="font-medium">{rule.name}</h3>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(rule.priority)}>
                          {rule.priority}
                        </Badge>
                        <Badge variant="outline">
                          {rule.category}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Condition</p>
                        <p className="font-medium">{rule.condition.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trigger Count</p>
                        <p className="font-medium">{rule.triggerCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Triggered</p>
                        <p className="font-medium">
                          {rule.lastTriggered ? formatTimeAgo(rule.lastTriggered) : 'Never'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Channels:</span>
                      {rule.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertChannels.map((channel) => (
                  <div key={channel.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleAlertChannel(channel.id)}
                          className={`w-3 h-3 rounded-full ${channel.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                        />
                        <div className="flex items-center gap-2">
                          {getChannelIcon(channel.type)}
                          <div>
                            <h3 className="font-medium">{channel.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{channel.type} notifications</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">{channel.deliveryRate}%</p>
                          <p className="text-xs text-muted-foreground">Delivery rate</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {channel.lastUsed && (
                        <span>Last used: {formatTimeAgo(channel.lastUsed)}</span>
                      )}
                      {!channel.lastUsed && <span>Never used</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alerts by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.alertsByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority as Alert['priority']).split(' ')[1]}`} />
                        <span className="capitalize">{priority}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alerts by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.alertsByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category as Alert['category'])}
                        <span className="capitalize">{category}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Triggered Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.topTriggeredRules.map((rule, index) => (
                    <div key={rule.ruleId} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-medium">{rule.ruleName}</span>
                      </div>
                      <span className="font-bold">{rule.count} triggers</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}