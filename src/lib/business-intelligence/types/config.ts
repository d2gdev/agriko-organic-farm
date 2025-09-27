// Business Intelligence - Configuration Types
export interface BusinessIntelligenceConfig {
  serper: {
    apiKey: string;
    apiUrl: string;
    rateLimit: number;
    timeout: number;
  };
  deepseek: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  monitoring: {
    enabled: boolean;
    defaultFrequency: string;
    maxCompetitors: number;
    cacheTtl: number;
  };
  analysis: {
    confidenceThreshold: number;
    maxRetries: number;
    batchSize: number;
  };
  alerts: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
    batchSize: number;
    channels: string[];
  };
  predictions?: {
    enabled: boolean;
    modelVersion: string;
    confidenceThreshold: number;
    timeframes: string[];
  };
  channels?: string[];
}


export interface SerperSearchOptions {
  query: string;
  num?: number;
  gl?: string; // Geographic location
  hl?: string; // Language
  type?: 'search' | 'images' | 'news' | 'places';
  tbs?: string; // Time-based search
}

export interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  position?: number;
  sitelinks?: SerperSitelink[];
}

export interface SerperSitelink {
  title: string;
  link: string;
}

export interface SerperResponse {
  searchParameters: {
    q: string;
    gl: string;
    hl: string;
    num: number;
    type: string;
  };
  organic: SerperSearchResult[];
  answerBox?: {
    answer: string;
    title: string;
    link: string;
  };
  peopleAlsoAsk?: Array<{
    question: string;
    snippet: string;
    title: string;
    link: string;
  }>;
  relatedSearches?: Array<{
    query: string;
  }>;
  credits: number;
}

export interface DeepSeekPromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  outputFormat: 'json' | 'text' | 'structured';
  requiredVariables: string[];
  optionalVariables: string[];
}

export const DEFAULT_CONFIG: BusinessIntelligenceConfig = {
  serper: {
    apiKey: process.env.SERPER_API_KEY || '',
    apiUrl: process.env.SERPER_API_URL || 'https://google.serper.dev',
    rateLimit: parseInt(process.env.BI_SERPER_RATE_LIMIT || '100'),
    timeout: 30000,
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    maxTokens: 4000,
    temperature: 0.7,
  },
  monitoring: {
    enabled: process.env.BI_ENABLE_MONITORING === 'true',
    defaultFrequency: process.env.BI_DEFAULT_MONITORING_FREQUENCY || 'daily',
    maxCompetitors: parseInt(process.env.BI_MAX_COMPETITORS || '100'),
    cacheTtl: parseInt(process.env.BI_ANALYSIS_CACHE_TTL || '3600000'),
  },
  analysis: {
    confidenceThreshold: 0.7,
    maxRetries: 3,
    batchSize: 10,
  },
  alerts: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 50,
    channels: ['email', 'webhook', 'dashboard'],
  },
};

// Channel Intelligence Types
export interface ChannelIntelligenceAnalysis {
  competitorId?: string;
  channelId: string;
  channelName: string;
  performance: ChannelPerformanceMetrics;
  opportunities: ChannelOpportunityAnalysis[];
  recommendations: ChannelStrategyRecommendation[];
  competitive: ChannelCompetitiveAnalysis;
  effectiveness: ChannelEffectivenessScore;
  confidence: number;
}

export interface ChannelPerformanceMetrics {
  reach: number;
  engagement: number;
  conversion: number;
  cost: number;
  roi: number;
  trend: 'up' | 'down' | 'stable';
  overallScore?: number;
  channelPerformance?: Array<{
    channel: string;
    effectivenessScore: number;
    reach: number;
    engagement: number;
    conversion: number;
    roi: number;
    growthPotential: number;
  }>;
  topPerformers?: string[];
  underperformers?: string[];
  averageROI?: number;
  channelId?: string;
  channel?: string;
  effectiveness?: number;
  performanceVsBenchmark?: number;
  efficiency?: number;
  crossChannelSynergy?: number;
}

export interface ChannelOpportunityAnalysis {
  id: string;
  type: 'expansion' | 'optimization' | 'new_market';
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
  confidence: number;
  totalOpportunities?: number;
  highPriorityOpportunities?: string[];
  mediumPriorityOpportunities?: string[];
  lowPriorityOpportunities?: string[];
  marketGaps?: string[];
  emergingChannels?: string[];
  opportunityDetails?: unknown[];
  strategicRecommendations?: unknown[];
  expansionPotential?: number;
  untappedChannels?: string[];
  innovationOpportunities?: string[];
  quickWins?: string[];
  strategicMoves?: string[];
  timeToMarket?: Record<string, number>;
  resourceRequirements?: Record<string, string>;
  expectedROI?: number;
  riskAssessment?: Record<string, 'low' | 'medium' | 'high'>;
}

export interface ChannelStrategyRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'content' | 'targeting' | 'budget' | 'timing';
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'short_term' | 'long_term';
  resources: string[];
  confidence: number;
  recommendationId?: string;
  channelId?: string;
  channelName?: string;
  priority?: 'high' | 'medium' | 'low';
  effort?: 'high' | 'medium' | 'low';
  timeframe?: string;
  estimatedROI?: number;
}

export interface ChannelCompetitiveAnalysis {
  competitorId?: string;
  competitorName?: string;
  competitorCount: number;
  marketShare: number;
  positionRank: number;
  threats: string[];
  advantages: string[];
  confidence: number;
  channels?: string[];
  channelEffectiveness?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: unknown[];
}

export interface ChannelEffectivenessScore {
  overall: number;
  reach: number;
  engagement: number;
  conversion: number;
  efficiency: number;
  currentChannels?: string[];
  currentScore?: number;
}

export interface MarketChannelData {
  channelId: string;
  marketSize: number;
  growthRate: number;
  saturation: number;
  barriers: string[];
  opportunities: string[];
  marketSegment?: string;
  channelEffectiveness?: Record<string, number>;
  dominantChannels?: string[];
  decliningChannels?: string[];
  emergingChannels?: string[];
  marketSaturation?: number;
  regulatoryFactors?: string[];
  customerPreferences?: string[];
  dataQuality?: string;
  lastUpdated?: Date;
}

export interface ChannelPresenceAnalysis {
  competitorId?: string;
  present: boolean;
  strength: 'weak' | 'moderate' | 'strong';
  contentVolume: number;
  engagement: number;
  lastActivity: Date;
  trends: string[];
  channels?: string[];
  totalChannels?: number;
  primaryChannels?: string[];
  digitalPresence?: number;
  physicalPresence?: number;
}

// Predictive Analytics Types
export interface PredictiveAnalysis {
  id: string;
  type: 'market' | 'competitor' | 'product' | 'channel';
  timeframe: string;
  confidence: number;
  predictions: unknown[];
  risks: unknown[];
  opportunities: unknown[];
  recommendations: unknown[];
}

export interface MarketForecast {
  period: string;
  marketSize: number;
  growthRate: number;
  trends: string[];
  risks: string[];
  confidence: number;
  growthProjections: Array<{ projectedGrowth: number; confidence: number; }>;
  keyDrivers: string[];
  riskFactors: string[];
  emergingSegments: string[];
}

export interface CompetitorMovementPrediction {
  competitorId: string;
  competitorName?: string;
  predictedActions: string[];
  strategicMoves: string[];
  acquisitionProbability: number;
  probability: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
}

export interface MarketImpact {
  revenueImpact: number; // Estimated percentage impact on revenue
  marketShareShift: number; // Expected market share change
  customerSegments: string[]; // Affected customer segments
  geographicRegions: string[]; // Impacted regions
  industryVerticals: string[]; // Affected industries
  competitiveResponse: 'low' | 'medium' | 'high'; // Expected competitive response level
}

export interface AdoptionTimeline {
  phases: Array<{
    phase: string;
    duration: number; // Duration in months
    milestones: string[];
    adoptionRate: number; // Percentage adoption expected
    keyActivities: string[];
  }>;
  totalTimeframe: number; // Total months to full adoption
  criticalPath: string[]; // Critical milestones that could delay adoption
}

export interface TimingMilestone {
  id: string;
  name: string;
  targetDate: Date;
  description: string;
  dependencies: string[]; // IDs of prerequisite milestones
  riskFactors: string[];
  successCriteria: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface TrendPrediction {
  trendName: string;
  trend: string;
  probability: number;
  impact: number;
  timeframe: string;
  indicators: string[];
  currentStage: 'emerging' | 'growing' | 'mature' | 'declining';
  predictedEvolution: string;
  marketImpact: MarketImpact;
  adoptionTimeline: AdoptionTimeline;
  adoptionBarriers: string[];
  timingMilestones: TimingMilestone[];
  disruptionPotential: number;
  confidence: number;
}

export interface RiskCorrelation {
  riskId1: string;
  riskId2: string;
  correlationStrength: number; // -1 to 1, where 1 is perfect positive correlation
  correlationType: 'causal' | 'coincidental' | 'inverse';
  description: string;
  confidence: number;
}

export interface RiskAssessment {
  riskType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  mitigationStrategies: string[];
  overallRiskScore?: number;
  riskByCategory?: Record<string, number>;
  topRisks?: Array<{
    id: string;
    description: string;
    probability: number;
    impact: number;
    category: string;
  }>;
  riskCorrelations?: RiskCorrelation[];
  monitoringRecommendations?: string[];
  lastAssessment?: Date;
}

export interface OpportunityTrend {
  trendId: string;
  trendName: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  velocity: number; // Rate of change
  impactedOpportunities: string[]; // Opportunity IDs affected by this trend
  durationMonths: number;
  confidence: number;
  keyIndicators: string[];
}

export interface OpportunityForecast {
  opportunityType: string;
  potential: number;
  timeframe: string;
  requirements: string[];
  risks: string[];
  totalOpportunities?: number;
  highPriorityOpportunities?: Array<{
    id: string;
    description: string;
    category: string;
    expectedValue: number;
    timeWindow: string;
    confidence: number;
  }>;
  emergingOpportunities?: Array<{
    id: string;
    description: string;
    category: string;
    expectedValue: number;
    timeWindow: string;
    confidence: number;
  }>;
  opportunityTrends?: OpportunityTrend[];
  investmentRecommendations?: string[];
  timingRecommendations?: string[];
}

export interface PredictionConfidence {
  overall: number;
  marketForecast: number;
  competitorPredictions: number;
  trendAnalysis: number;
  riskAssessment: number;
  dataQuality: number;
  modelAccuracy: number;
  modelReliability: number;
  timeframeCertainty: number;
}

export interface PredictiveModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  meanAbsoluteError: number;
  lastValidation: Date;
  lastUpdated?: Date;
  trainingDataSize: number;
  modelVersion: string;
}

// Alert System Types
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertCategory = 'performance' | 'security' | 'business' | 'system' | 'competitor' | 'market' | 'competitive' | 'product' | 'channel';
export type AlertChannel = 'email' | 'webhook' | 'dashboard' | 'sms' | 'slack';

export interface IntelligentAlert {
  id: string;
  type: AlertCategory;
  priority: AlertPriority;
  title: string;
  description: string;
  message?: string;
  context?: AlertContext;
  insights?: string[];
  threshold?: number;
  channels: AlertChannel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
  recipients?: string[];
  category?: AlertCategory;
  generatedAt?: Date;
  status?: 'pending' | 'sent' | 'failed' | 'acknowledged';
}

export interface AlertContext {
  userId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  ruleName?: string;
  ruleId?: string;
  additionalInfo?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertMetrics {
  totalAlerts: number;
  totalActiveAlerts?: number;
  activeAlerts: number;
  resolvedAlerts: number;
  averageResponseTime: number;
  criticalAlerts: number;
  alertsByPriority?: Record<AlertPriority, number>;
  alertsByCategory?: Record<AlertCategory, number>;
  deliverySuccessRate?: number;
  lastProcessed?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: Record<string, unknown>;
  actions: string[];
  enabled: boolean;
  priority: number;
  threshold?: number;
  _threshold?: number; // Legacy support
}