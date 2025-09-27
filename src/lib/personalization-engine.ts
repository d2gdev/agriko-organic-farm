// Advanced Personalization Engine for Semantic Search
import { analyzeUserPreferences, type UserProfile } from './deepseek';
// import { generateEnhancedEmbedding } from './embeddings';
// import { cosineSimilarity } from './multi-vector-embeddings';
import { logger } from './logger';

export interface UserBehaviorData {
  sessionId: string;
  userId?: string;
  searchHistory: Array<{
    query: string;
    timestamp: string;
    intent?: string;
    resultsClicked: number[];
  }>;
  clickHistory: Array<{
    productId: number;
    productName: string;
    timestamp: string;
    context: 'search' | 'recommendation' | 'category' | 'direct';
    dwellTime?: number;
  }>;
  purchaseHistory: Array<{
    productId: number;
    productName: string;
    timestamp: string;
    price: number;
    quantity: number;
  }>;
  preferences: {
    categories: Record<string, number>;
    healthBenefits: Record<string, number>;
    priceRange: { min: number; max: number };
    brands: Record<string, number>;
  };
  demographics?: {
    ageGroup?: 'young' | 'middle' | 'senior';
    healthGoals?: string[];
    dietaryRestrictions?: string[];
  };
}

export interface PersonalizationWeights {
  categoryPreference: number;
  healthBenefitAlignment: number;
  pricePreference: number;
  brandLoyalty: number;
  recentInterest: number;
  seasonalRelevance: number;
}

export interface PersonalizedSearchOptions {
  enablePersonalization: boolean;
  personalizationStrength: 'light' | 'medium' | 'strong';
  includeUserHistory: boolean;
  adaptToIntent: boolean;
}

// In-memory user behavior store (in production, use Redis/database)
const userBehaviorStore = new Map<string, UserBehaviorData>();
const userProfileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
const PROFILE_CACHE_TTL = 3600000; // 1 hour

/**
 * Track user search behavior
 */
export function trackSearchBehavior(
  sessionId: string,
  query: string,
  intent?: string,
  resultsClicked: number[] = []
): void {
  try {
    const userData = getUserBehaviorData(sessionId);

    userData.searchHistory.push({
      query,
      timestamp: new Date().toISOString(),
      intent,
      resultsClicked
    });

    // Keep last 50 searches
    if (userData.searchHistory.length > 50) {
      userData.searchHistory.shift();
    }

    userBehaviorStore.set(sessionId, userData);
    logger.info(`Tracked search behavior for session ${sessionId}: "${query}"`);
  } catch (error) {
    logger.error('Failed to track search behavior:', error as Record<string, unknown>);
  }
}

/**
 * Track user click behavior
 */
export function trackClickBehavior(
  sessionId: string,
  productId: number,
  productName: string,
  context: 'search' | 'recommendation' | 'category' | 'direct' = 'search',
  dwellTime?: number
): void {
  try {
    const userData = getUserBehaviorData(sessionId);

    userData.clickHistory.push({
      productId,
      productName,
      timestamp: new Date().toISOString(),
      context,
      dwellTime
    });

    // Keep last 100 clicks
    if (userData.clickHistory.length > 100) {
      userData.clickHistory.shift();
    }

    userBehaviorStore.set(sessionId, userData);
    logger.info(`Tracked click behavior for session ${sessionId}: product ${productId}`);
  } catch (error) {
    logger.error('Failed to track click behavior:', error as Record<string, unknown>);
  }
}

/**
 * Track user purchase behavior
 */
export function trackPurchaseBehavior(
  sessionId: string,
  productId: number,
  productName: string,
  price: number,
  quantity: number = 1
): void {
  try {
    const userData = getUserBehaviorData(sessionId);

    userData.purchaseHistory.push({
      productId,
      productName,
      timestamp: new Date().toISOString(),
      price,
      quantity
    });

    // Keep last 50 purchases
    if (userData.purchaseHistory.length > 50) {
      userData.purchaseHistory.shift();
    }

    userBehaviorStore.set(sessionId, userData);
    logger.info(`Tracked purchase behavior for session ${sessionId}: product ${productId}`);
  } catch (error) {
    logger.error('Failed to track purchase behavior:', error as Record<string, unknown>);
  }
}

/**
 * Get or create user behavior data
 */
function getUserBehaviorData(sessionId: string): UserBehaviorData {
  let userData = userBehaviorStore.get(sessionId);

  if (!userData) {
    userData = {
      sessionId,
      searchHistory: [],
      clickHistory: [],
      purchaseHistory: [],
      preferences: {
        categories: {},
        healthBenefits: {},
        priceRange: { min: 0, max: 1000 },
        brands: {}
      }
    };
    userBehaviorStore.set(sessionId, userData);
  }

  return userData;
}

/**
 * Get enhanced user profile using DeepSeek analysis
 */
export async function getEnhancedUserProfile(sessionId: string): Promise<UserProfile> {
  // Check cache first
  const cached = userProfileCache.get(sessionId);
  if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
    return cached.profile;
  }

  const userData = getUserBehaviorData(sessionId);

  // Extract data for analysis
  const searchQueries = userData.searchHistory.map(s => s.query);
  const clickedProducts = userData.clickHistory.map(c => c.productName);
  const purchasedProducts = userData.purchaseHistory.map(p => p.productName);

  try {
    // Use DeepSeek to analyze user behavior
    const profile = await analyzeUserPreferences(
      searchQueries,
      clickedProducts,
      purchasedProducts.length > 0 ? purchasedProducts : undefined
    );

    // Cache the profile
    userProfileCache.set(sessionId, {
      profile,
      timestamp: Date.now()
    });

    return profile;
  } catch (error) {
    logger.error('Failed to get enhanced user profile:', error as Record<string, unknown>);

    // Return basic profile based on behavior data
    return createBasicUserProfile(userData);
  }
}

/**
 * Create basic user profile from behavior data
 */
function createBasicUserProfile(userData: UserBehaviorData): UserProfile {
  const profile: UserProfile = {
    healthGoals: [],
    dietaryPreferences: [],
    cookingStyle: [],
    preferredCategories: {},
    allergyAwareness: [],
    budgetConsciousness: 'medium',
    qualityFocus: []
  };

  // Analyze search patterns
  const searchTerms = userData.searchHistory.flatMap(s => s.query.toLowerCase().split(' '));
  const termFreq: Record<string, number> = {};

  searchTerms.forEach(term => {
    if (term.length > 2) {
      termFreq[term] = (termFreq[term] || 0) + 1;
    }
  });

  // Extract health goals from search terms
  const healthTerms = ['immune', 'energy', 'digestive', 'heart', 'brain', 'anti-inflammatory'];
  healthTerms.forEach(term => {
    if (termFreq[term]) {
      profile.healthGoals.push(`${term} support`);
    }
  });

  // Extract dietary preferences
  const dietTerms = ['organic', 'natural', 'vegan', 'gluten-free', 'raw'];
  dietTerms.forEach(term => {
    if (termFreq[term]) {
      profile.dietaryPreferences.push(term);
    }
  });

  // Calculate category preferences from clicks
  userData.clickHistory.forEach(click => {
    const categories = extractCategoriesFromProductName(click.productName);
    categories.forEach(category => {
      profile.preferredCategories[category] = (profile.preferredCategories[category] || 0) + 1;
    });
  });

  // Determine budget consciousness from purchase history
  if (userData.purchaseHistory.length > 0) {
    const avgPrice = userData.purchaseHistory.reduce((sum, p) => sum + p.price, 0) / userData.purchaseHistory.length;
    profile.budgetConsciousness = avgPrice > 50 ? 'low' : avgPrice > 25 ? 'medium' : 'high';
  }

  return profile;
}

/**
 * Extract categories from product name using patterns
 */
function extractCategoriesFromProductName(productName: string): string[] {
  const categories: string[] = [];
  const name = productName.toLowerCase();

  const categoryPatterns = [
    { pattern: /\b(honey|raw honey|manuka)\b/, category: 'honey' },
    { pattern: /\b(turmeric|ginger|cinnamon|spice)\b/, category: 'spices' },
    { pattern: /\b(tea|herbal tea|blend)\b/, category: 'teas' },
    { pattern: /\b(oil|coconut oil|olive oil)\b/, category: 'oils' },
    { pattern: /\b(powder|protein powder|moringa)\b/, category: 'powders' },
    { pattern: /\b(capsule|supplement|vitamin)\b/, category: 'supplements' },
    { pattern: /\b(grain|rice|quinoa)\b/, category: 'grains' },
    { pattern: /\b(herb|basil|oregano|medicinal)\b/, category: 'herbs' }
  ];

  categoryPatterns.forEach(({ pattern, category }) => {
    if (pattern.test(name)) {
      categories.push(category);
    }
  });

  return categories;
}

/**
 * Calculate personalization weights for search results
 */
export async function calculatePersonalizationWeights(
  sessionId: string,
  query: string,
  intent?: string
): Promise<PersonalizationWeights> {
  const userData = getUserBehaviorData(sessionId);
  const _profile = await getEnhancedUserProfile(sessionId);

  // Base weights
  const weights: PersonalizationWeights = {
    categoryPreference: 0.2,
    healthBenefitAlignment: 0.2,
    pricePreference: 0.15,
    brandLoyalty: 0.1,
    recentInterest: 0.25,
    seasonalRelevance: 0.1
  };

  // Adjust weights based on user behavior depth
  const behaviorDepth = userData.searchHistory.length + userData.clickHistory.length;

  if (behaviorDepth > 20) {
    // Experienced user - increase personalization
    weights.categoryPreference += 0.1;
    weights.healthBenefitAlignment += 0.1;
    weights.recentInterest += 0.05;
  } else if (behaviorDepth < 5) {
    // New user - reduce personalization, focus on query
    weights.categoryPreference -= 0.1;
    weights.healthBenefitAlignment -= 0.1;
    weights.recentInterest -= 0.15;
  }

  // Adjust based on intent
  if (intent === 'health') {
    weights.healthBenefitAlignment += 0.15;
    weights.categoryPreference -= 0.05;
    weights.pricePreference -= 0.05;
  } else if (intent === 'product') {
    weights.categoryPreference += 0.1;
    weights.pricePreference += 0.05;
    weights.brandLoyalty += 0.05;
  }

  // Normalize weights
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  Object.keys(weights).forEach(key => {
    weights[key as keyof PersonalizationWeights] /= totalWeight;
  });

  return weights;
}

/**
 * Apply personalization boost to search results
 */
export async function applyPersonalizationBoost(
  sessionId: string,
  query: string,
  results: Array<{
    id: number;
    name: string;
    description?: string;
    categories?: Array<{ name: string }>;
    price?: number;
    brand?: string;
    healthBenefits?: string[];
    score: number;
  }>,
  options: PersonalizedSearchOptions = {
    enablePersonalization: true,
    personalizationStrength: 'medium',
    includeUserHistory: true,
    adaptToIntent: true
  }
): Promise<Array<{
  id: number;
  name: string;
  description?: string;
  categories?: Array<{ name: string }>;
  price?: number;
  brand?: string;
  healthBenefits?: string[];
  score: number;
  personalizedScore: number;
  personalizationBoost: number;
  personalizationReasons: string[];
}>> {
  if (!options.enablePersonalization) {
    return results.map(result => ({
      ...result,
      personalizedScore: result.score,
      personalizationBoost: 1.0,
      personalizationReasons: []
    }));
  }

  const userData = getUserBehaviorData(sessionId);
  const profile = await getEnhancedUserProfile(sessionId);

  const strengthMultiplier = {
    light: 0.1,
    medium: 0.2,
    strong: 0.3
  }[options.personalizationStrength];

  return await Promise.all(results.map(async (result) => {
    let boost = 1.0;
    const reasons: string[] = [];

    // Category preference boost
    const resultCategories = result.categories?.map(c => c.name.toLowerCase()) || [];
    const categoryBoost = calculateCategoryBoost(resultCategories, profile.preferredCategories);
    if (categoryBoost > 1.0) {
      boost += (categoryBoost - 1.0) * strengthMultiplier * 2;
      reasons.push('matches preferred categories');
    }

    // Health benefit alignment
    if (result.healthBenefits && profile.healthGoals.length > 0) {
      const benefitAlignment = calculateHealthBenefitAlignment(result.healthBenefits, profile.healthGoals);
      if (benefitAlignment > 0.5) {
        boost += benefitAlignment * strengthMultiplier * 1.5;
        reasons.push('aligns with health goals');
      }
    }

    // Recent interest boost
    if (options.includeUserHistory) {
      const recentBoost = calculateRecentInterestBoost(result.name, userData.searchHistory, userData.clickHistory);
      if (recentBoost > 0) {
        boost += recentBoost * strengthMultiplier;
        reasons.push('matches recent interests');
      }
    }

    // Price preference
    if (result.price && userData.purchaseHistory.length > 0) {
      const priceBoost = calculatePricePreferenceBoost(result.price, userData.purchaseHistory);
      boost += priceBoost * strengthMultiplier * 0.5;
      if (priceBoost > 0.1) {
        reasons.push('matches price preferences');
      }
    }

    // Dietary preference alignment
    const dietaryBoost = calculateDietaryPreferenceBoost(result.name, result.description || '', profile.dietaryPreferences);
    if (dietaryBoost > 0) {
      boost += dietaryBoost * strengthMultiplier;
      reasons.push('matches dietary preferences');
    }

    return {
      ...result,
      personalizedScore: result.score * boost,
      personalizationBoost: boost,
      personalizationReasons: reasons
    };
  }));
}

/**
 * Calculate category preference boost
 */
function calculateCategoryBoost(
  resultCategories: string[],
  preferredCategories: Record<string, number>
): number {
  if (resultCategories.length === 0 || Object.keys(preferredCategories).length === 0) {
    return 1.0;
  }

  const maxPreference = Math.max(...Object.values(preferredCategories));
  let totalBoost = 0;

  resultCategories.forEach(category => {
    const preference = preferredCategories[category.toLowerCase()] || 0;
    totalBoost += preference / maxPreference;
  });

  return 1.0 + (totalBoost / resultCategories.length);
}

/**
 * Calculate health benefit alignment
 */
function calculateHealthBenefitAlignment(
  productBenefits: string[],
  userHealthGoals: string[]
): number {
  if (productBenefits.length === 0 || userHealthGoals.length === 0) {
    return 0;
  }

  let alignmentScore = 0;
  productBenefits.forEach(benefit => {
    userHealthGoals.forEach(goal => {
      if (benefit.toLowerCase().includes(goal.toLowerCase()) ||
          goal.toLowerCase().includes(benefit.toLowerCase())) {
        alignmentScore += 1;
      }
    });
  });

  return Math.min(1.0, alignmentScore / Math.max(productBenefits.length, userHealthGoals.length));
}

/**
 * Calculate recent interest boost
 */
function calculateRecentInterestBoost(
  productName: string,
  searchHistory: Array<{ query: string; timestamp: string }>,
  clickHistory: Array<{ productName: string; timestamp: string }>
): number {
  const recentThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();
  let boost = 0;

  // Check recent searches
  const recentSearches = searchHistory.filter(s =>
    now - new Date(s.timestamp).getTime() < recentThreshold
  );

  recentSearches.forEach(search => {
    const searchTerms = search.query.toLowerCase().split(' ');
    const nameTerms = productName.toLowerCase().split(' ');

    const overlap = searchTerms.filter(term =>
      nameTerms.some(nameTerm => nameTerm.includes(term) || term.includes(nameTerm))
    ).length;

    if (overlap > 0) {
      boost += overlap / searchTerms.length * 0.3;
    }
  });

  // Check recent clicks
  const recentClicks = clickHistory.filter(c =>
    now - new Date(c.timestamp).getTime() < recentThreshold
  );

  recentClicks.forEach(click => {
    if (productName.toLowerCase().includes(click.productName.toLowerCase()) ||
        click.productName.toLowerCase().includes(productName.toLowerCase())) {
      boost += 0.2;
    }
  });

  return Math.min(0.5, boost);
}

/**
 * Calculate price preference boost
 */
function calculatePricePreferenceBoost(
  productPrice: number,
  purchaseHistory: Array<{ price: number }>
): number {
  if (purchaseHistory.length === 0) return 0;

  const avgPrice = purchaseHistory.reduce((sum, p) => sum + p.price, 0) / purchaseHistory.length;
  const priceDeviation = Math.abs(productPrice - avgPrice) / avgPrice;

  // Boost products within 20% of average price
  if (priceDeviation <= 0.2) {
    return 0.2 * (1 - priceDeviation / 0.2);
  }

  return 0;
}

/**
 * Calculate dietary preference boost
 */
function calculateDietaryPreferenceBoost(
  productName: string,
  productDescription: string,
  dietaryPreferences: string[]
): number {
  if (dietaryPreferences.length === 0) return 0;

  const productText = `${productName} ${productDescription}`.toLowerCase();
  let boost = 0;

  dietaryPreferences.forEach(preference => {
    if (productText.includes(preference.toLowerCase())) {
      boost += 0.15;
    }
  });

  return Math.min(0.3, boost);
}

/**
 * Get personalized search suggestions
 */
export async function getPersonalizedSuggestions(
  sessionId: string,
  partialQuery: string = '',
  limit: number = 8
): Promise<string[]> {
  const userData = getUserBehaviorData(sessionId);
  const profile = await getEnhancedUserProfile(sessionId);

  const suggestions = new Set<string>();

  // Add suggestions based on user's health goals
  profile.healthGoals.forEach(goal => {
    if (goal.toLowerCase().includes(partialQuery.toLowerCase()) || partialQuery === '') {
      suggestions.add(goal);
    }
  });

  // Add suggestions based on preferred categories
  Object.keys(profile.preferredCategories).forEach(category => {
    if (category.toLowerCase().includes(partialQuery.toLowerCase()) || partialQuery === '') {
      suggestions.add(category);
    }
  });

  // Add suggestions based on recent searches
  userData.searchHistory.slice(-10).forEach(search => {
    if (search.query.toLowerCase().includes(partialQuery.toLowerCase()) && partialQuery !== '') {
      suggestions.add(search.query);
    }
  });

  // Add contextual suggestions
  const contextualSuggestions = [
    'organic immunity boosters',
    'natural energy supplements',
    'anti-inflammatory herbs',
    'digestive health products',
    'heart healthy foods'
  ];

  contextualSuggestions.forEach(suggestion => {
    if (suggestion.toLowerCase().includes(partialQuery.toLowerCase()) || partialQuery === '') {
      suggestions.add(suggestion);
    }
  });

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Clear user behavior data (for privacy compliance)
 */
export function clearUserBehaviorData(sessionId: string): void {
  userBehaviorStore.delete(sessionId);
  userProfileCache.delete(sessionId);
  logger.info(`Cleared user behavior data for session ${sessionId}`);
}

/**
 * Export user data (for privacy compliance)
 */
export function exportUserData(sessionId: string): UserBehaviorData | null {
  return userBehaviorStore.get(sessionId) || null;
}