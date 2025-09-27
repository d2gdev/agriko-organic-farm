// Business Intelligence - Competitor Data Types
export interface Competitor {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: CompanySize;
  founded?: number;
  category: CompetitorCategory;
  monitoringScope: MonitoringScope;
  monitoringFrequency: MonitoringFrequency;
  status: CompetitorStatus;
  marketShare?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorProduct {
  id: string;
  competitorId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  url?: string;
  features: string[];
  imageUrl?: string;
  inStock: boolean;
  lastPriceChange?: {
    previousPrice: number;
    newPrice: number;
    changeDate: Date;
    changePercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorChannel {
  id: string;
  competitorId: string;
  name: string;
  type: ChannelType;
  region: string;
  url?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorCampaign {
  id: string;
  competitorId: string;
  name: string;
  type: CampaignType;
  budget?: number;
  startDate: Date;
  endDate?: Date;
  description?: string;
  targetAudience?: string;
  channels: string[];
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Enums for type safety
export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise'
}

export enum CompetitorCategory {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
  EMERGING = 'emerging',
  POTENTIAL = 'potential'
}

export enum MonitoringScope {
  PRODUCTS_ONLY = 'products_only',
  PRICING_ONLY = 'pricing_only',
  CHANNELS_ONLY = 'channels_only',
  FULL_MONITORING = 'full_monitoring',
  CUSTOM = 'custom'
}

export enum MonitoringFrequency {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum CompetitorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MONITORING_PAUSED = 'monitoring_paused',
  ARCHIVED = 'archived'
}

export enum ChannelType {
  WEBSITE = 'website',
  ECOMMERCE = 'ecommerce',
  MARKETPLACE = 'marketplace',
  SOCIAL_MEDIA = 'social_media',
  RETAIL_STORE = 'retail_store',
  DISTRIBUTOR = 'distributor',
  PARTNER = 'partner'
}

export enum CampaignType {
  ADVERTISING = 'advertising',
  PROMOTION = 'promotion',
  PRODUCT_LAUNCH = 'product_launch',
  BRAND_AWARENESS = 'brand_awareness',
  SEASONAL = 'seasonal'
}

export enum CampaignStatus {
  ACTIVE = 'active',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// API Request/Response types
export interface CreateCompetitorRequest {
  name: string;
  domain: string;
  industry: string;
  size: CompanySize;
  founded?: number;
  category: CompetitorCategory;
  monitoringScope: MonitoringScope;
  monitoringFrequency: MonitoringFrequency;
}

export interface UpdateCompetitorRequest extends Partial<CreateCompetitorRequest> {
  status?: CompetitorStatus;
}

export interface CompetitorListResponse {
  competitors: Competitor[];
  total: number;
  page: number;
  limit: number;
}

export interface CompetitorDetailsResponse extends Competitor {
  products: CompetitorProduct[];
  channels: CompetitorChannel[];
  campaigns: CompetitorCampaign[];
  lastMonitored?: Date;
  monitoringStats: {
    totalProducts: number;
    totalChannels: number;
    activeCampaigns: number;
    lastPriceChanges: number;
  };
}