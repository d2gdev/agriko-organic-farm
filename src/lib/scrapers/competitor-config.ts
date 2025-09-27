import { Core } from '@/types/TYPE_REGISTRY';
/**
 * Competitor Scraper Configuration
 * Contains configurations for various agricultural and organic product competitors
 */

export interface ScraperSelector {
  productName: string;
  price: string;
  availability?: string;
  description?: string;
  imageUrl?: string;
  rating?: string;
  reviews?: string;
  sku?: string;
  category?: string;
}

export interface PriceConfig {
  currencySymbol: string;
  decimalSeparator: string;
  thousandsSeparator?: string;
  priceRegex?: RegExp;
}

export interface CompetitorConfig {
  name: string;
  key: string;
  baseUrl: string;
  searchUrl?: string;
  productListUrl?: string;
  selectors: ScraperSelector;
  priceParsing: PriceConfig;
  rateLimitMs: number;
  userAgent?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  categories?: string[];
}

// Real competitor configurations for agricultural/organic products
export const COMPETITOR_CONFIGS: Record<string, CompetitorConfig> = {
  // Major organic food retailers
  whole_foods: {
    name: 'Whole Foods Market',
    key: 'whole_foods',
    baseUrl: 'https://www.wholefoodsmarket.com',
    searchUrl: 'https://www.wholefoodsmarket.com/search?text=',
    selectors: {
      productName: 'h2.w-cms-product-card__heading, .product-name',
      price: '.w-cms-product-price__sale-price, .sale-price',
      availability: '.product-availability, .in-stock-label',
      description: '.product-description-content',
      imageUrl: '.product-image img, .w-cms-product-card__image img',
      rating: '.rating-stars',
      reviews: '.review-count'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      priceRegex: /\$?(\d+\.?\d*)/
    },
    rateLimitMs: 3000,
    enabled: true,
    categories: ['rice', 'grains', 'organic', 'pantry']
  },

  // Organic specialty stores
  thrive_market: {
    name: 'Thrive Market',
    key: 'thrive_market',
    baseUrl: 'https://thrivemarket.com',
    searchUrl: 'https://thrivemarket.com/search?query=',
    selectors: {
      productName: '.product-name, h1[data-testid="product-name"]',
      price: '.price-display, .current-price',
      availability: '.availability-message',
      description: '.product-details-description',
      imageUrl: '.product-image img[src]',
      rating: '.star-rating',
      reviews: '.review-count-text'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      priceRegex: /\$?(\d+\.?\d*)/
    },
    rateLimitMs: 2500,
    enabled: true,
    categories: ['organic', 'rice', 'grains', 'health']
  },

  // Asian grocery stores (for rice varieties)
  asian_grocery: {
    name: 'Asian Food Grocer',
    key: 'asian_grocery',
    baseUrl: 'https://www.asianfoodgrocer.com',
    searchUrl: 'https://www.asianfoodgrocer.com/search?q=',
    selectors: {
      productName: '.product-title, .product-name h1',
      price: '.product-price .money, .price-item--sale',
      availability: '.product-availability, .availability',
      description: '.product-description, .product-single__description',
      imageUrl: '.product-photo img, .product__media img',
      sku: '.product-sku'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      priceRegex: /\$?(\d+\.?\d*)/
    },
    rateLimitMs: 2000,
    enabled: true,
    categories: ['rice', 'asian', 'specialty']
  },

  // Local organic farms
  local_harvest: {
    name: 'Local Harvest',
    key: 'local_harvest',
    baseUrl: 'https://www.localharvest.org',
    searchUrl: 'https://www.localharvest.org/search.jsp?jmp&q=',
    selectors: {
      productName: '.listing-name, .product-name',
      price: '.price, .listing-price',
      availability: '.availability-text',
      description: '.description, .listing-description',
      imageUrl: '.listing-image img',
      category: '.category-name'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      priceRegex: /\$?(\d+\.?\d*)/
    },
    rateLimitMs: 3500,
    enabled: true,
    categories: ['organic', 'local', 'farm-direct']
  },

  // Health food stores
  vitacost: {
    name: 'Vitacost',
    key: 'vitacost',
    baseUrl: 'https://www.vitacost.com',
    searchUrl: 'https://www.vitacost.com/search?q=',
    selectors: {
      productName: '.product-name, h1.pd-header__title',
      price: '.price-sales, .pd-price__sales',
      availability: '.availability-msg, .pd-availability',
      description: '.product-description, .pd-description',
      imageUrl: '.product-image img, .pd-image img',
      rating: '.ratings, .pd-rating',
      reviews: '.review-count, .pd-reviews'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      priceRegex: /\$?(\d+\.?\d*)/
    },
    rateLimitMs: 2000,
    enabled: true,
    categories: ['health', 'organic', 'supplements', 'rice']
  },

  // Amazon (organic section)
  amazon_organic: {
    name: 'Amazon - Organic',
    key: 'amazon_organic',
    baseUrl: 'https://www.amazon.com',
    searchUrl: 'https://www.amazon.com/s?k=organic+',
    selectors: {
      productName: 'h2.s-size-mini span, h1.product-title',
      price: '.a-price-whole, span.a-price',
      availability: '.availability span, .a-size-medium.a-color-success',
      description: '#feature-bullets, .a-expander-content',
      imageUrl: '.s-image, #landingImage',
      rating: '.a-icon-star-small span, .a-icon-alt',
      reviews: '.s-link-style span, #acrCustomerReviewText'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      thousandsSeparator: ',',
      priceRegex: /\$?(\d+\.?\d*)/
    },
    rateLimitMs: 5000, // Amazon requires slower scraping
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    enabled: true,
    categories: ['organic', 'rice', 'general']
  },

  // Specialty rice retailers
  lotus_foods: {
    name: 'Lotus Foods',
    key: 'lotus_foods',
    baseUrl: 'https://www.lotusfoods.com',
    productListUrl: 'https://www.lotusfoods.com/collections/rice',
    selectors: {
      productName: '.product-title, .product__title',
      price: '.product-price, .price__regular',
      availability: '.product-availability',
      description: '.product-description',
      imageUrl: '.product-image img',
      category: '.product-type'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      priceRegex: /\$?(\d+\.?\d*)/
    },
    rateLimitMs: 2500,
    enabled: true,
    categories: ['rice', 'specialty', 'organic']
  },

  // Direct farm competitors
  lundberg_farms: {
    name: 'Lundberg Family Farms',
    key: 'lundberg_farms',
    baseUrl: 'https://www.lundberg.com',
    productListUrl: 'https://www.lundberg.com/products/',
    selectors: {
      productName: '.product-name, h1.product-title',
      price: '.price, .product-price',
      availability: '.in-stock, .availability',
      description: '.product-info, .description',
      imageUrl: '.product-image img',
      category: '.product-category'
    },
    priceParsing: {
      currencySymbol: '$',
      decimalSeparator: '.',
      priceRegex: /\$?(\d+\.?\d*)/
    },
    rateLimitMs: 3000,
    enabled: true,
    categories: ['rice', 'organic', 'farm-direct']
  }
};

// Helper function to get enabled competitors
export function getEnabledCompetitors(): CompetitorConfig[] {
  return Object.values(COMPETITOR_CONFIGS).filter(config => config.enabled);
}

// Helper function to get competitors by category
export function getCompetitorsByCategory(category: string): CompetitorConfig[] {
  return Object.values(COMPETITOR_CONFIGS).filter(
    config => config.enabled && config.categories?.includes(category)
  );
}

// Helper function to get competitor by key
export function getCompetitorConfig(key: string): CompetitorConfig | undefined {
  return COMPETITOR_CONFIGS[key];
}

// Product categories we're interested in
export const PRODUCT_CATEGORIES = [
  'rice',
  'organic',
  'grains',
  'health',
  'specialty',
  'asian',
  'local',
  'farm-direct',
  'pantry',
  'supplements'
];

// Keywords for product matching
export const PRODUCT_KEYWORDS = {
  rice: ['black rice', 'brown rice', 'red rice', 'white rice', 'jasmine rice', 'basmati rice', 'wild rice', 'organic rice'],
  powders: ['turmeric powder', 'ginger powder', 'moringa powder', 'herbal powder', 'organic powder'],
  honey: ['raw honey', 'organic honey', 'wildflower honey', 'local honey'],
  grains: ['quinoa', 'millet', 'buckwheat', 'amaranth', 'organic grains'],
  health: ['superfood', 'antioxidant', 'organic', 'non-gmo', 'gluten-free']
};

export default COMPETITOR_CONFIGS;