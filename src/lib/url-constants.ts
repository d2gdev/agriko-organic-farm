/**
 * Centralized URL constants for the application
 * This helps with maintenance and deployment configuration
 */

export const URL_CONSTANTS = {
  // Main domains
  SHOP_BASE_URL: process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.agrikoph.com',
  COMPANY_BASE_URL: process.env.NEXT_PUBLIC_COMPANY_URL || 'https://agrikoph.com',

  // Schema.org URLs (these are standard and rarely change)
  SCHEMA: {
    BASE: 'https://schema.org',
    ORGANIZATION: 'https://schema.org/Organization',
    WEBSITE: 'https://schema.org/WebSite',
    PRODUCT: 'https://schema.org/Product',
    BREADCRUMB: 'https://schema.org/BreadcrumbList',
    PERSON: 'https://schema.org/Person',
    IMAGE: 'https://schema.org/ImageObject',
    BLOG_POSTING: 'https://schema.org/BlogPosting',
    ARTICLE: 'https://schema.org/Article',
    FAQ_PAGE: 'https://schema.org/FAQPage',
    CREATIVE_WORK: 'https://schema.org/CreativeWork'
  },

  // Social media links
  SOCIAL: {
    FACEBOOK: 'https://www.facebook.com/AgrikoPH/',
    MESSENGER: 'https://m.me/AgrikoPH'
  },

  // External service URLs
  EXTERNAL: {
    GOOGLE_FONTS: 'https://fonts.googleapis.com',
    GOOGLE_FONTS_STATIC: 'https://fonts.gstatic.com',
    GOOGLE_ANALYTICS: 'https://www.google-analytics.com',
    GOOGLE_TAG_MANAGER: 'https://www.googletagmanager.com',
    GOOGLE_SEARCH_CONSOLE: 'https://searchconsole.googleapis.com',
    GOOGLE_DEVELOPERS: 'https://developers.google.com',
    CREATIVE_COMMONS: 'https://creativecommons.org',
    YOUTUBE: 'https://www.youtube.com'
  },

  // Philippines-specific URLs
  PHILIPPINES: {
    DA_GOV: 'https://da.gov.ph',
    PUREGOLD: 'https://www.puregold.com.ph',
    METRO: 'https://www.metro.com.ph',
    GOOGLE_MAPS: 'https://maps.google.com'
  },

  // API endpoints (environment-specific values)
  API: {
    OPENAI: process.env.OPENAI_API_URL || 'https://api.openai.com',
    DEEPSEEK: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
    BASE: process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://shop.agrikoph.com',
    QDRANT: process.env.QDRANT_URL || 'http://localhost:6333'
  }
} as const;

// Helper functions for common URL operations
export const urlHelpers = {
  /**
   * Get full shop URL for a given path
   */
  getShopUrl: (path: string = '') => {
    const base = URL_CONSTANTS.SHOP_BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  },

  /**
   * Get full company URL for a given path
   */
  getCompanyUrl: (path: string = '') => {
    const base = URL_CONSTANTS.COMPANY_BASE_URL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  },

  /**
   * Get image URL for the shop
   */
  getShopImageUrl: (imagePath: string) => {
    return urlHelpers.getShopUrl(`/images/${imagePath}`);
  },

  /**
   * Get product URL
   */
  getProductUrl: (productSlug: string) => {
    return urlHelpers.getShopUrl(`/product/${productSlug}`);
  },

  /**
   * Get API base URL (environment-aware)
   */
  getApiUrl: (path: string = '') => {
    const base = URL_CONSTANTS.API.BASE;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  },

  /**
   * Get API endpoint URL with proper environment detection
   */
  getApiEndpoint: (endpoint: string) => {
    return urlHelpers.getApiUrl(`/api/${endpoint}`);
  },

  /**
   * Check if URL is internal (same domain)
   */
  isInternalUrl: (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('agrikoph.com');
    } catch {
      return false;
    }
  }
};

export default URL_CONSTANTS;