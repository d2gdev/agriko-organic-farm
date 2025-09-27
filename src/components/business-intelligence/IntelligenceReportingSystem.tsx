'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileText,
  Calendar,
  Share2,
  Settings,
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  Brain,
  Eye,
  Mail,
  Plus,
  Edit,
  RefreshCw
} from 'lucide-react';

// Report System Types
interface Report {
  id: string;
  title: string;
  description: string;
  type: 'competitive_analysis' | 'market_forecast' | 'pricing_intelligence' | 'swot_analysis' | 'executive_summary' | 'custom';
  format: 'pdf' | 'excel' | 'powerpoint' | 'json' | 'csv';
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  dataFilters: {
    dateRange: { start: Date; end: Date };
    competitors: string[];
    categories: string[];
    confidenceThreshold: number;
  };
  sections: ReportSection[];
  template: string;
  createdAt: Date;
  lastGenerated?: Date;
  createdBy: string;
  isActive: boolean;
}

interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'analysis' | 'recommendations' | 'trends';
  dataSource: string;
  configuration: Record<string, unknown>;
  order: number;
}

interface GeneratedReport {
  id: string;
  reportConfigId: string;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  format: Report['format'];
  fileUrl: string;
  fileSize: number;
  downloadCount: number;
  sharedWith: string[];
  expiresAt?: Date;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: Report['type'];
  sections: ReportSection[];
  isDefault: boolean;
  category: 'executive' | 'operational' | 'analytical' | 'strategic';
}


export default function IntelligenceReportingSystem() {
  // State Management
  const [activeTab, setActiveTab] = useState('reports');
  const [_selectedReport, _setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [_showCreateModal, _setShowCreateModal] = useState(false);

  // Mock Data
  const [reports, setReports] = useState<Report[]>([
    {
      id: 'report-1',
      title: 'Weekly Competitive Intelligence Report',
      description: 'Comprehensive analysis of competitor activities and market movements',
      type: 'competitive_analysis',
      format: 'pdf',
      schedule: 'weekly',
      recipients: ['executives@company.com', 'strategy@company.com'],
      dataFilters: {
        dateRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() },
        competitors: ['techcorp', 'marketleader', 'startupx'],
        categories: ['pricing', 'product', 'channel'],
        confidenceThreshold: 75
      },
      sections: [
        {
          id: 'section-1',
          title: 'Executive Summary',
          type: 'summary',
          dataSource: 'ai_insights',
          configuration: { maxLength: 500 },
          order: 1
        },
        {
          id: 'section-2',
          title: 'Competitive Landscape',
          type: 'chart',
          dataSource: 'competitor_analysis',
          configuration: { chartType: 'market_share' },
          order: 2
        },
        {
          id: 'section-3',
          title: 'Key Insights',
          type: 'analysis',
          dataSource: 'recent_insights',
          configuration: { topN: 10 },
          order: 3
        }
      ],
      template: 'competitive-standard',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: 'John Smith',
      isActive: true
    },
    {
      id: 'report-2',
      title: 'Monthly Market Forecast',
      description: 'Predictive analytics and trend analysis for strategic planning',
      type: 'market_forecast',
      format: 'powerpoint',
      schedule: 'monthly',
      recipients: ['board@company.com', 'planning@company.com'],
      dataFilters: {
        dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
        competitors: [],
        categories: ['market', 'trends'],
        confidenceThreshold: 80
      },
      sections: [
        {
          id: 'section-4',
          title: 'Market Outlook',
          type: 'trends',
          dataSource: 'predictive_models',
          configuration: { timeHorizon: 12 },
          order: 1
        },
        {
          id: 'section-5',
          title: 'Risk Assessment',
          type: 'chart',
          dataSource: 'risk_analysis',
          configuration: { chartType: 'risk_matrix' },
          order: 2
        }
      ],
      template: 'forecast-executive',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      lastGenerated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      createdBy: 'Sarah Johnson',
      isActive: true
    },
    {
      id: 'report-3',
      title: 'Pricing Strategy Analysis',
      description: 'Detailed analysis of pricing movements and competitive positioning',
      type: 'pricing_intelligence',
      format: 'excel',
      schedule: 'manual',
      recipients: ['pricing@company.com'],
      dataFilters: {
        dateRange: { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date() },
        competitors: ['techcorp', 'marketleader'],
        categories: ['pricing'],
        confidenceThreshold: 70
      },
      sections: [
        {
          id: 'section-6',
          title: 'Pricing Trends',
          type: 'table',
          dataSource: 'pricing_data',
          configuration: { includeHistory: true },
          order: 1
        },
        {
          id: 'section-7',
          title: 'Recommendations',
          type: 'recommendations',
          dataSource: 'pricing_ai',
          configuration: { priorityLevel: 'high' },
          order: 2
        }
      ],
      template: 'pricing-detailed',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      createdBy: 'Mike Chen',
      isActive: false
    }
  ]);

  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([
    {
      id: 'gen-1',
      reportConfigId: 'report-1',
      title: 'Weekly Competitive Intelligence Report - Week 12',
      generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      generatedBy: 'System',
      format: 'pdf',
      fileUrl: '/reports/weekly-competitive-week12.pdf',
      fileSize: 2400000, // 2.4MB
      downloadCount: 15,
      sharedWith: ['team-lead@company.com'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'gen-2',
      reportConfigId: 'report-2',
      title: 'Monthly Market Forecast - March 2024',
      generatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      generatedBy: 'Sarah Johnson',
      format: 'powerpoint',
      fileUrl: '/reports/market-forecast-march.pptx',
      fileSize: 5200000, // 5.2MB
      downloadCount: 8,
      sharedWith: []
    },
    {
      id: 'gen-3',
      reportConfigId: 'report-1',
      title: 'Weekly Competitive Intelligence Report - Week 11',
      generatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      generatedBy: 'System',
      format: 'pdf',
      fileUrl: '/reports/weekly-competitive-week11.pdf',
      fileSize: 2100000, // 2.1MB
      downloadCount: 22,
      sharedWith: []
    }
  ]);

  const [templates] = useState<ReportTemplate[]>([
    {
      id: 'template-1',
      name: 'Executive Brief',
      description: 'High-level summary for executive consumption',
      type: 'executive_summary',
      category: 'executive',
      isDefault: true,
      sections: [
        {
          id: 'exec-1',
          title: 'Key Insights',
          type: 'summary',
          dataSource: 'top_insights',
          configuration: { maxInsights: 5 },
          order: 1
        },
        {
          id: 'exec-2',
          title: 'Strategic Recommendations',
          type: 'recommendations',
          dataSource: 'ai_recommendations',
          configuration: { urgencyLevel: 'high' },
          order: 2
        }
      ]
    },
    {
      id: 'template-2',
      name: 'Detailed Analysis',
      description: 'Comprehensive analysis with charts and data',
      type: 'competitive_analysis',
      category: 'analytical',
      isDefault: false,
      sections: [
        {
          id: 'detail-1',
          title: 'Market Overview',
          type: 'chart',
          dataSource: 'market_data',
          configuration: { includeForecasts: true },
          order: 1
        },
        {
          id: 'detail-2',
          title: 'Competitor Analysis',
          type: 'table',
          dataSource: 'competitor_metrics',
          configuration: { includeScoring: true },
          order: 2
        },
        {
          id: 'detail-3',
          title: 'Trend Analysis',
          type: 'trends',
          dataSource: 'market_trends',
          configuration: { timeHorizon: 6 },
          order: 3
        }
      ]
    }
  ]);

  // Helper Functions
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffMins = Math.floor(diffMs / (60 * 1000));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMins}m ago`;
  };

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'competitive_analysis': return <TrendingUp className="w-4 h-4" />;
      case 'market_forecast': return <BarChart3 className="w-4 h-4" />;
      case 'pricing_intelligence': return <Target className="w-4 h-4" />;
      case 'swot_analysis': return <PieChart className="w-4 h-4" />;
      case 'executive_summary': return <Brain className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatIcon = (format: Report['format']) => {
    switch (format) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-600" />;
      case 'excel': return <FileText className="w-4 h-4 text-green-600" />;
      case 'powerpoint': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'json': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'csv': return <FileText className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getScheduleColor = (schedule: Report['schedule']) => {
    switch (schedule) {
      case 'daily': return 'text-green-600 bg-green-100';
      case 'weekly': return 'text-blue-600 bg-blue-100';
      case 'monthly': return 'text-purple-600 bg-purple-100';
      case 'quarterly': return 'text-orange-600 bg-orange-100';
      case 'manual': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Report Actions
  const generateReport = async (reportId: string) => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    const report = reports.find(r => r.id === reportId);
    if (report) {
      const newGeneratedReport: GeneratedReport = {
        id: `gen-${Date.now()}`,
        reportConfigId: reportId,
        title: `${report.title} - ${new Date().toLocaleDateString()}`,
        generatedAt: new Date(),
        generatedBy: 'Current User',
        format: report.format,
        fileUrl: `/reports/generated-${Date.now()}.${report.format}`,
        fileSize: Math.floor(Math.random() * 5000000) + 1000000,
        downloadCount: 0,
        sharedWith: []
      };

      setGeneratedReports(prev => [newGeneratedReport, ...prev]);

      // Update last generated time
      setReports(prev =>
        prev.map(r =>
          r.id === reportId ? { ...r, lastGenerated: new Date() } : r
        )
      );
    }

    setIsGenerating(false);
  };

  const downloadReport = (reportId: string) => {
    const report = generatedReports.find(r => r.id === reportId);
    if (report) {
      // Simulate download - would trigger actual download in production

      // Update download count
      setGeneratedReports(prev =>
        prev.map(r =>
          r.id === reportId ? { ...r, downloadCount: r.downloadCount + 1 } : r
        )
      );
    }
  };

  const _shareReport = (_reportId: string, _email: string) => {
    setGeneratedReports(prev =>
      prev.map(r =>
        r.id === _reportId
          ? { ...r, sharedWith: [...r.sharedWith, _email] }
          : r
      )
    );
  };

  const toggleReportStatus = (reportId: string) => {
    setReports(prev =>
      prev.map(r =>
        r.id === reportId ? { ...r, isActive: !r.isActive } : r
      )
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intelligence Reporting</h2>
          <p className="text-muted-foreground">Generate and manage business intelligence reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => _setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Reports</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.isActive).length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Generated Today</p>
                <p className="text-2xl font-bold">
                  {generatedReports.filter(r =>
                    r.generatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">
                  {generatedReports.reduce((sum, r) => sum + r.downloadCount, 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shared Reports</p>
                <p className="text-2xl font-bold">
                  {generatedReports.filter(r => r.sharedWith.length > 0).length}
                </p>
              </div>
              <Share2 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="generated">Generated</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Reports Configuration Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className={`${!report.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(report.type)}
                        {getFormatIcon(report.format)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{report.title}</h3>
                          <button
                            onClick={() => toggleReportStatus(report.id)}
                            className={`w-2 h-2 rounded-full ${report.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created by: {report.createdBy}</span>
                          <span>Created: {formatTimeAgo(report.createdAt)}</span>
                          {report.lastGenerated && (
                            <span>Last generated: {formatTimeAgo(report.lastGenerated)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getScheduleColor(report.schedule)}>
                        {report.schedule}
                      </Badge>
                      <Badge variant="outline">
                        {report.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Recipients</p>
                      <p className="text-sm font-medium">{report.recipients.length} email(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data Sources</p>
                      <p className="text-sm font-medium">{report.sections.length} section(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence Threshold</p>
                      <p className="text-sm font-medium">{report.dataFilters.confidenceThreshold}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Sections:</span>
                      {report.sections.map((section) => (
                        <Badge key={section.id} variant="outline" className="text-xs">
                          {section.title}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => generateReport(report.id)}
                        disabled={isGenerating || !report.isActive}
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-1" />
                        )}
                        Generate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Generated Reports Tab */}
        <TabsContent value="generated" className="space-y-6">
          <div className="space-y-4">
            {generatedReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {getFormatIcon(report.format)}
                      <div className="flex-1">
                        <h3 className="font-medium">{report.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Generated: {formatTimeAgo(report.generatedAt)}</span>
                          <span>By: {report.generatedBy}</span>
                          <span>Size: {formatFileSize(report.fileSize)}</span>
                          <span>Downloads: {report.downloadCount}</span>
                        </div>
                        {report.sharedWith.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">Shared with: </span>
                            {report.sharedWith.slice(0, 2).map((email, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1">
                                {email}
                              </Badge>
                            ))}
                            {report.sharedWith.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{report.sharedWith.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {report.expiresAt && (
                      <Badge variant="outline" className="text-xs">
                        Expires: {report.expiresAt.toLocaleDateString()}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {report.format.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(report.fileSize)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => downloadReport(report.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(template.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.name}</h3>
                          {template.isDefault && (
                            <Badge variant="default" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Sections ({template.sections.length}):</p>
                    <div className="space-y-1">
                      {template.sections.map((section) => (
                        <div key={section.id} className="flex items-center justify-between text-xs">
                          <span>{section.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {section.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm">
                      Use Template
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}