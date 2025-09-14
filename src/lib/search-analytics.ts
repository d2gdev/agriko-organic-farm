import { logger } from '@/lib/logger';
// Search Analytics and User Behavior Tracking for Contextual Search
export interface SearchEvent {
  sessionId: string;
  userId?: string;
  query: string;
  searchType: 'semantic' | 'keyword' | 'hybrid';
  results: SearchResult[];
  timestamp: number;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface SearchResult {
  productId: number;
  title: string;
  position: number;
  score: number;
  clicked?: boolean;
  clickTimestamp?: number;
  purchased?: boolean;
  purchaseTimestamp?: number;
}

export interface UserProfile {
  sessionId: string;
  userId?: string;
  preferences: {
    categories: Record<string, number>; // category -> weight
    healthBenefits: Record<string, number>; // benefit -> weight
    priceRange: { min: number; max: number };
    brands: Record<string, number>; // brand -> preference score
  };
  searchHistory: SearchEvent[];
  clickHistory: {
    productId: number;
    timestamp: number;
    context: string; // search query that led to click
  }[];
  purchaseHistory: {
    productId: number;
    timestamp: number;
    context: string;
    amount: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface QueryExpansionRule {
  original: string;
  expansions: string[];
  weight: number;
  category?: string;
}

export interface SeasonalBoost {
  keyword: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  boost: number;
  startMonth: number; // 1-12
  endMonth: number;   // 1-12
}

// User behavior analytics storage (in production, use Redis or database)
let userProfiles: Map<string, UserProfile> = new Map();
let searchEvents: SearchEvent[] = [];

// Health synonyms and query expansion dictionary
const healthSynonyms: Record<string, string[]> = {
  'immunity': ['immune', 'immune system', 'immunoboost', 'immune support', 'defense'],
  'inflammation': ['anti-inflammatory', 'reduce inflammation', 'inflammatory response'],
  'antioxidant': ['antioxidants', 'free radicals', 'oxidative stress', 'anti-aging'],
  'digestion': ['digestive', 'gut health', 'stomach', 'intestinal', 'digestive system'],
  'energy': ['energizing', 'energy boost', 'fatigue', 'stamina', 'vitality'],
  'heart': ['cardiovascular', 'heart health', 'cardiac', 'circulation', 'blood pressure'],
  'brain': ['cognitive', 'memory', 'focus', 'mental clarity', 'neurological'],
  'weight': ['weight management', 'metabolism', 'weight loss', 'slimming', 'fat burning'],
  'detox': ['detoxification', 'cleanse', 'purify', 'toxins', 'liver cleanse'],
  'skin': ['skin health', 'complexion', 'acne', 'beauty', 'dermatological'],
  'joint': ['joints', 'arthritis', 'mobility', 'flexibility', 'bone health'],
  'diabetes': ['blood sugar', 'glucose', 'diabetic', 'insulin', 'glycemic']
};

// Seasonal product boosting rules
const seasonalBoosts: SeasonalBoost[] = [
  // Spring (March-May)
  { keyword: 'detox', season: 'spring', boost: 1.5, startMonth: 3, endMonth: 5 },
  { keyword: 'cleanse', season: 'spring', boost: 1.3, startMonth: 3, endMonth: 5 },
  { keyword: 'energy', season: 'spring', boost: 1.2, startMonth: 3, endMonth: 5 },
  
  // Summer (June-August)  
  { keyword: 'hydration', season: 'summer', boost: 1.4, startMonth: 6, endMonth: 8 },
  { keyword: 'cooling', season: 'summer', boost: 1.3, startMonth: 6, endMonth: 8 },
  { keyword: 'weight loss', season: 'summer', boost: 1.3, startMonth: 5, endMonth: 8 },
  
  // Autumn (September-November)
  { keyword: 'immunity', season: 'autumn', boost: 1.5, startMonth: 9, endMonth: 11 },
  { keyword: 'immune', season: 'autumn', boost: 1.4, startMonth: 9, endMonth: 11 },
  { keyword: 'vitamin c', season: 'autumn', boost: 1.3, startMonth: 9, endMonth: 11 },
  
  // Winter (December-February)
  { keyword: 'immune support', season: 'winter', boost: 1.6, startMonth: 12, endMonth: 2 },
  { keyword: 'warming', season: 'winter', boost: 1.4, startMonth: 12, endMonth: 2 },
  { keyword: 'respiratory', season: 'winter', boost: 1.3, startMonth: 12, endMonth: 2 }
];

// Track search event
export function trackSearchEvent(event: Omit<SearchEvent, 'timestamp'>): void {
  const searchEvent: SearchEvent = {
    ...event,
    timestamp: Date.now()
  };
  
  searchEvents.push(searchEvent);
  updateUserProfile(event.sessionId, searchEvent);
  
  // Keep only last 10000 events in memory (in production, use proper storage)
  if (searchEvents.length > 10000) {
    searchEvents = searchEvents.slice(-5000);
  }
  
  logger.info(`📊 Tracked search: "${event.query}" (${event.searchType}) -> ${event.results.length} results`);
}

// Track click event
export function trackClickEvent(
  sessionId: string, 
  productId: number, 
  query: string, 
  position: number
): void {
  const profile = getUserProfile(sessionId);
  
  profile.clickHistory.push({
    productId,
    timestamp: Date.now(),
    context: query
  });
  
  // Update search results to mark as clicked
  const recentSearches = profile.searchHistory.filter(
    search => search.query === query && Date.now() - search.timestamp < 3600000 // Within 1 hour
  );
  
  for (const search of recentSearches) {
    const result = search.results.find(r => r.productId === productId);
    if (result) {
      result.clicked = true;
      result.clickTimestamp = Date.now();
    }
  }
  
  updateUserProfile(sessionId, null, profile);
  logger.info(`👆 Click tracked: Product ${productId} at position ${position} for query "${query}"`);
}

// Track purchase event
export function trackPurchaseEvent(
  sessionId: string,
  productId: number,
  context: string,
  amount: number
): void {
  const profile = getUserProfile(sessionId);
  
  profile.purchaseHistory.push({
    productId,
    timestamp: Date.now(),
    context,
    amount
  });
  
  // Mark in search results as purchased
  for (const search of profile.searchHistory) {
    const result = search.results.find(r => r.productId === productId);
    if (result) {
      result.purchased = true;
      result.purchaseTimestamp = Date.now();
    }
  }
  
  updateUserProfile(sessionId, null, profile);
  logger.info(`🛒 Purchase tracked: Product ${productId} ($${amount}) via "${context}"`);
}

// Get or create user profile
export function getUserProfile(sessionId: string): UserProfile {
  if (!userProfiles.has(sessionId)) {
    const newProfile: UserProfile = {
      sessionId,
      preferences: {
        categories: {},
        healthBenefits: {},
        priceRange: { min: 0, max: 1000 },
        brands: {}
      },
      searchHistory: [],
      clickHistory: [],
      purchaseHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    userProfiles.set(sessionId, newProfile);
  }
  
  // Return the user profile directly since we just created it if it didn't exist
  const profile = userProfiles.get(sessionId);
  if (!profile) {
    throw new Error('Failed to create user profile');
  }
  return profile;
}

// Update user profile based on behavior
function updateUserProfile(sessionId: string, searchEvent?: SearchEvent | null, profile?: UserProfile): void {
  const userProfile = profile ?? getUserProfile(sessionId);
  
  if (searchEvent) {
    userProfile.searchHistory.push(searchEvent);
    
    // Keep only last 100 searches per user
    if (userProfile.searchHistory.length > 100) {
      userProfile.searchHistory = userProfile.searchHistory.slice(-50);
    }
    
    // Update preferences based on search patterns
    updatePreferencesFromSearch(userProfile, searchEvent);
  }
  
  userProfile.updatedAt = Date.now();
  userProfiles.set(sessionId, userProfile);
}

// Update user preferences based on search behavior
function updatePreferencesFromSearch(profile: UserProfile, searchEvent: SearchEvent): void {
  // Extract categories from results and boost preferences
  for (const result of searchEvent.results) {
    // This would be enhanced with actual product data lookup
    // For now, we'll simulate category extraction from result titles
    const categories = extractCategoriesFromTitle(result.title);
    
    for (const category of categories) {
      profile.preferences.categories[category] = (profile.preferences.categories[category] ?? 0) + 0.1;
    }
  }
  
  // Extract health benefits from query
  const healthBenefits = extractHealthBenefitsFromQuery(searchEvent.query);
  for (const benefit of healthBenefits) {
    profile.preferences.healthBenefits[benefit] = (profile.preferences.healthBenefits[benefit] ?? 0) + 0.2;
  }
}

// Extract categories from product titles (simplified)
function extractCategoriesFromTitle(title: string): string[] {
  const categories: string[] = [];
  const lowerTitle = title.toLowerCase();
  
  const categoryKeywords = {
    'spices': ['turmeric', 'ginger', 'cinnamon', 'cumin', 'pepper'],
    'honey': ['honey', 'raw honey', 'organic honey'],
    'rice': ['rice', 'black rice', 'brown rice', 'wild rice'],
    'herbs': ['moringa', 'basil', 'oregano', 'thyme', 'sage'],
    'tea': ['tea', 'blend', 'salabat', 'herbal tea']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        categories.push(category);
        break;
      }
    }
  }
  
  return categories;
}

// Extract health benefits from search query
function extractHealthBenefitsFromQuery(query: string): string[] {
  const benefits: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  for (const [benefit, synonyms] of Object.entries(healthSynonyms)) {
    if (synonyms.some(synonym => lowerQuery.includes(synonym.toLowerCase()))) {
      benefits.push(benefit);
    }
  }
  
  return benefits;
}

// Expand search query with synonyms and related terms
export function expandSearchQuery(originalQuery: string, userProfile?: UserProfile): string[] {
  const expansions = new Set<string>();
  expansions.add(originalQuery);
  
  const lowerQuery = originalQuery.toLowerCase();
  
  // Add health synonyms
  for (const [mainTerm, synonyms] of Object.entries(healthSynonyms)) {
    if (synonyms.some(syn => lowerQuery.includes(syn.toLowerCase())) || lowerQuery.includes(mainTerm)) {
      synonyms.forEach(syn => expansions.add(syn));
      expansions.add(mainTerm);
    }
  }
  
  // Add user preference-based expansions
  if (userProfile) {
    const topCategories = Object.entries(userProfile.preferences.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    // If query relates to user's preferred categories, add category-specific terms
    for (const category of topCategories) {
      if (isQueryRelatedToCategory(lowerQuery, category)) {
        expansions.add(category);
      }
    }
  }
  
  return Array.from(expansions);
}

// Check if query relates to a category
function isQueryRelatedToCategory(query: string, category: string): boolean {
  const categoryRelations: Record<string, string[]> = {
    'spices': ['seasoning', 'flavor', 'cooking', 'culinary'],
    'honey': ['sweet', 'natural sweetener', 'syrup'],
    'rice': ['grain', 'carbohydrate', 'staple'],
    'herbs': ['medicinal', 'herbal', 'botanical'],
    'tea': ['beverage', 'drink', 'infusion']
  };
  
  const relations = categoryRelations[category] ?? [];
  return relations.some(relation => query.includes(relation));
}

// Get seasonal boost for current time
export function getSeasonalBoost(query: string): number {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  let totalBoost = 1.0;
  
  for (const boost of seasonalBoosts) {
    if (query.toLowerCase().includes(boost.keyword.toLowerCase())) {
      // Handle year-crossing seasons (e.g., winter: Dec-Feb)
      const inSeason = boost.startMonth <= boost.endMonth
        ? currentMonth >= boost.startMonth && currentMonth <= boost.endMonth
        : currentMonth >= boost.startMonth || currentMonth <= boost.endMonth;
      
      if (inSeason) {
        totalBoost *= boost.boost;
      }
    }
  }
  
  return totalBoost;
}

// Get personalized search recommendations
export function getPersonalizedBoosts(sessionId: string, query: string): Record<string, number> {
  const profile = getUserProfile(sessionId);
  const boosts: Record<string, number> = {};
  
  // Category preference boosts
  const topCategories = Object.entries(profile.preferences.categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  for (const [category, weight] of topCategories) {
    if (weight > 0.5) { // Only significant preferences
      boosts[category] = 1 + (weight * 0.2); // Max 20% boost
    }
  }
  
  // Health benefit preference boosts
  const topBenefits = Object.entries(profile.preferences.healthBenefits)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  for (const [benefit, weight] of topBenefits) {
    if (weight > 0.3) {
      boosts[benefit] = 1 + (weight * 0.15); // Max 15% boost
    }
  }
  
  return boosts;
}

// Get search analytics summary
export function getSearchAnalytics(timeRange: number = 24 * 60 * 60 * 1000): {
  totalSearches: number;
  uniqueUsers: number;
  topQueries: Array<{ query: string; count: number; ctr: number }>;
  topResults: Array<{ productId: number; title: string; clicks: number; impressions: number; ctr: number }>;
  seasonalTrends: Record<string, number>;
} {
  const cutoffTime = Date.now() - timeRange;
  const recentEvents = searchEvents.filter(event => event.timestamp >= cutoffTime);
  
  // Calculate metrics
  const totalSearches = recentEvents.length;
  const uniqueUsers = new Set(recentEvents.map(e => e.sessionId)).size;
  
  // Top queries with CTR
  const queryStats = new Map<string, { count: number; clicks: number; impressions: number }>();
  
  for (const event of recentEvents) {
    const query = event.query.toLowerCase();
    if (!queryStats.has(query)) {
      queryStats.set(query, { count: 0, clicks: 0, impressions: 0 });
    }
    
    const stats = queryStats.get(query);
    if (stats) {
      stats.count++;
      stats.impressions += event.results.length;
      stats.clicks += event.results.filter(r => r.clicked).length;
    }
  }
  
  const topQueries = Array.from(queryStats.entries())
    .map(([query, stats]) => ({
      query,
      count: stats.count,
      ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Top results
  const resultStats = new Map<number, { title: string; clicks: number; impressions: number }>();
  
  for (const event of recentEvents) {
    for (const result of event.results) {
      if (!resultStats.has(result.productId)) {
        resultStats.set(result.productId, { 
          title: result.title, 
          clicks: 0, 
          impressions: 0 
        });
      }
      
      const stats = resultStats.get(result.productId);
      if (stats) {
        stats.impressions++;
        if (result.clicked) stats.clicks++;
      }
    }
  }
  
  const topResults = Array.from(resultStats.entries())
    .map(([productId, stats]) => ({
      productId,
      title: stats.title,
      clicks: stats.clicks,
      impressions: stats.impressions,
      ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) : 0
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
  
  // Seasonal trends (simplified)
  const seasonalTrends: Record<string, number> = {};
  const currentMonth = new Date().getMonth() + 1;
  
  for (const boost of seasonalBoosts) {
    const inSeason = boost.startMonth <= boost.endMonth
      ? currentMonth >= boost.startMonth && currentMonth <= boost.endMonth
      : currentMonth >= boost.startMonth || currentMonth <= boost.endMonth;
    
    if (inSeason) {
      seasonalTrends[boost.keyword] = (seasonalTrends[boost.keyword] ?? 0) + 1;
    }
  }
  
  return {
    totalSearches,
    uniqueUsers,
    topQueries,
    topResults,
    seasonalTrends
  };
}

// Clear old data (cleanup function)
export function clearOldAnalytics(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
  const cutoffTime = Date.now() - maxAge;
  
  // Clear old search events
  searchEvents = searchEvents.filter(event => event.timestamp >= cutoffTime);
  
  // Clear old user profiles
  for (const [sessionId, profile] of userProfiles.entries()) {
    if (profile.updatedAt < cutoffTime) {
      userProfiles.delete(sessionId);
    } else {
      // Clean old history within profiles
      profile.searchHistory = profile.searchHistory.filter(s => s.timestamp >= cutoffTime);
      profile.clickHistory = profile.clickHistory.filter(c => c.timestamp >= cutoffTime);
    }
  }
  
  logger.info(`🧹 Cleaned analytics: ${searchEvents.length} events, ${userProfiles.size} profiles remaining`);
}