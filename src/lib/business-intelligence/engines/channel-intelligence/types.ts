// Channel Intelligence Types

export interface ChannelTrendAnalysis {
  channel: string;
  growthRate: number;
  marketShare: number;
  saturationLevel: 'low' | 'medium' | 'high';
  emergingOpportunities: string[];
  threatLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface ChannelGapAnalysis {
  missingChannels: string[];
  underutilizedChannels: string[];
  overinvestedChannels: string[];
  competitorAdvantages: {
    channel: string;
    competitor: string;
    advantage: string;
    impactLevel: 'low' | 'medium' | 'high';
  }[];
  strategicRecommendations: string[];
}

export interface ChannelROIAnalysis {
  channel: string;
  estimatedROI: number;
  investmentRequired: number;
  timeToBreakeven: number;
  riskFactors: string[];
  successProbability: number;
  competitiveBarriers: string[];
}

export interface ChannelPresenceData {
  name: string;
  type: string;
  reach: string;
  maturity: string;
  performanceIndicators: unknown[];
  investmentLevel: string;
  contentVolume?: number;
  engagement?: number;
}

export interface DigitalPresenceMetrics {
  strength: 'strong' | 'moderate' | 'weak';
  channels: string[];
  coverage: number;
}

export interface PhysicalPresenceMetrics {
  strength: 'strong' | 'moderate' | 'weak';
  channels: string[];
  coverage: number;
}

export interface MarketOpportunityExtended {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
  estimatedEffort: number;
  score: number;
  confidence: number;
  metrics?: Record<string, any>;
}

export interface ChannelGapData {
  missingChannels: string[];
  underutilizedChannels: string[];
  overinvestedChannels: string[];
  competitorAdvantages: {
    channel: string;
    competitor: string;
    advantage: string;
    impactLevel: 'low' | 'medium' | 'high';
  }[];
}