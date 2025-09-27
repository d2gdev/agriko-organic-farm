// Business Intelligence - Analysis and AI Types
export interface DeepSeekAnalysis {
  id: string;
  competitorId: string;
  analysisType: AnalysisType;
  insights: AnalysisInsights;
  confidenceScore: number;
  dataQualityScore: number;
  analysisContext: AnalysisContext;
  recommendations: string[];
  keyFindings: string[];
  strategicImplications: string[];
  createdAt: Date;
  expiresAt: Date;
}

export interface AnalysisInsights {
  summary: string;
  competitiveThreatLevel: ThreatLevel;
  marketPosition: MarketPosition;
  pricingStrategy: PricingStrategy;
  productDifferentiation: ProductDifferentiation;
  channelStrategy: ChannelStrategy;
  swotAnalysis?: SWOTAnalysis;
  predictedMoves: PredictedMove[];
}

export interface AnalysisContext {
  dataPoints: number;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  markets: string[];
  productCategories: string[];
  confidenceFactors: string[];
}

export interface SWOTAnalysis {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  overallAssessment: string;
}

export interface SWOTItem {
  description: string;
  impactScore: number; // 1-10
  confidenceLevel: number; // 0-1
  evidenceSources: string[];
}

export interface PredictedMove {
  category: MovementCategory;
  description: string;
  probability: number; // 0-1
  timeframe: Timeframe;
  potentialImpact: ImpactLevel;
  indicators: string[];
  recommendedResponse?: string;
}

export interface StrategicInsight {
  id: string;
  competitorId: string;
  category: InsightCategory;
  title: string;
  description: string;
  impactScore: number; // 1-10
  urgencyLevel: UrgencyLevel;
  actionRequired: boolean;
  relatedCompetitors: string[];
  dataSupport: DataSupport;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface DataSupport {
  sources: string[];
  dataPoints: number;
  lastUpdated: Date;
  reliability: ReliabilityLevel;
}

// Analysis related enums
export enum AnalysisType {
  STRATEGIC = 'strategic',
  SWOT = 'swot',
  PRICING = 'pricing',
  PRODUCT = 'product',
  CHANNEL = 'channel',
  FORECAST = 'forecast',
  COMPREHENSIVE = 'comprehensive'
}

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum MarketPosition {
  LEADER = 'leader',
  CHALLENGER = 'challenger',
  FOLLOWER = 'follower',
  NICHE = 'niche',
  EMERGING = 'emerging'
}

export enum PricingStrategy {
  PREMIUM = 'premium',
  COMPETITIVE = 'competitive',
  PENETRATION = 'penetration',
  SKIMMING = 'skimming',
  VALUE_BASED = 'value_based',
  COST_PLUS = 'cost_plus'
}

export enum ProductDifferentiation {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  COMMODITY = 'commodity'
}

export enum ChannelStrategy {
  DIRECT_ONLY = 'direct_only',
  INDIRECT_ONLY = 'indirect_only',
  MULTICHANNEL = 'multichannel',
  OMNICHANNEL = 'omnichannel',
  MARKETPLACE_FOCUSED = 'marketplace_focused'
}

export enum MovementCategory {
  PRICING = 'pricing',
  PRODUCT_LAUNCH = 'product_launch',
  MARKET_EXPANSION = 'market_expansion',
  CHANNEL_EXPANSION = 'channel_expansion',
  PARTNERSHIP = 'partnership',
  ACQUISITION = 'acquisition',
  TECHNOLOGY = 'technology'
}

export enum Timeframe {
  IMMEDIATE = 'immediate', // 0-1 month
  SHORT_TERM = 'short_term', // 1-3 months
  MEDIUM_TERM = 'medium_term', // 3-6 months
  LONG_TERM = 'long_term' // 6+ months
}

export enum ImpactLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  SEVERE = 'severe'
}

export enum InsightCategory {
  PRICING_CHANGE = 'pricing_change',
  NEW_PRODUCT = 'new_product',
  MARKET_ENTRY = 'market_entry',
  PARTNERSHIP = 'partnership',
  TECHNOLOGY_SHIFT = 'technology_shift',
  CUSTOMER_BEHAVIOR = 'customer_behavior',
  REGULATORY_CHANGE = 'regulatory_change'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ReliabilityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERIFIED = 'verified'
}

// API Request/Response types for analysis
export interface AnalysisRequest {
  competitorId: string;
  analysisType: AnalysisType;
  options?: {
    includeSwot?: boolean;
    includeForecast?: boolean;
    timeRange?: {
      startDate: Date;
      endDate: Date;
    };
    focusAreas?: string[];
  };
}

export interface AnalysisResponse {
  analysis: DeepSeekAnalysis;
  insights: StrategicInsight[];
  executiveSummary: string;
  actionItems: ActionItem[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: UrgencyLevel;
  category: InsightCategory;
  dueDate?: Date;
  assignee?: string;
  status: ActionStatus;
}

export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DEFERRED = 'deferred'
}