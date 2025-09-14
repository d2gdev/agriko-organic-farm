// Contextual Search Enhancement Layer
import { hybridSearch, HybridSearchOptions, HybridSearchResult } from './hybrid-search';
import { logger } from '@/lib/logger';

import { 
  getUserProfile, 
  expandSearchQuery, 
  getSeasonalBoost, 
  getPersonalizedBoosts,
  trackSearchEvent 
} from './search-analytics';

export interface ContextualSearchOptions extends HybridSearchOptions {
  sessionId: string;
  userId?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  enablePersonalization?: boolean;
  enableSeasonalBoost?: boolean;
  enableQueryExpansion?: boolean;
  userAgent?: string;
}

export interface ContextualSearchResult extends HybridSearchResult {
  contextualBoost?: number;
  seasonalBoost?: number;
  personalBoost?: number;
  queryExpansion?: string[];
  recommendationReason?: string[];
}

// Regional product preferences (Philippines focus)
const regionalPreferences: Record<string, Record<string, number>> = {
  'philippines': {
    'rice': 1.3,           // Rice is a staple
    'coconut': 1.2,        // Coconut products popular
    'tropical': 1.2,       // Tropical fruits/herbs
    'traditional': 1.15,   // Traditional Filipino ingredients
    'organic': 1.1         // Growing organic market
  },
  'luzon': {
    'vegetable': 1.1,      // Vegetable farming region
    'highland': 1.15       // Highland produce
  },
  'visayas': {
    'seafood': 1.2,        // Island seafood
    'coconut': 1.3         // Major coconut region
  },
  'mindanao': {
    'fruit': 1.2,          // Fruit basket of Philippines
    'durian': 1.4,         // Famous for durian
    'coffee': 1.3          // Coffee growing region
  }
};

// Enhanced contextual search function
export async function contextualSearch(
  query: string,
  options: ContextualSearchOptions
): Promise<{
  results: ContextualSearchResult[];
  searchStats: {
    query: string;
    mode: string;
    semanticResults: number;
    keywordResults: number;
    hybridResults: number;
    executionTime: number;
  };
  contextualInsights: {
    originalQuery: string;
    expandedQueries: string[];
    seasonalBoost: number;
    personalizedBoosts: Record<string, number>;
    regionalBoosts: Record<string, number>;
    appliedContext: string[];
  };
}> {
  const {
    sessionId,
    userId,
    location,
    enablePersonalization = true,
    enableSeasonalBoost = true,
    enableQueryExpansion = true,
    userAgent = 'unknown',
    ...hybridOptions
  } = options;

  logger.info(`🎯 Contextual search: "${query}" for session ${sessionId}`);

  const contextualInsights = {
    originalQuery: query,
    expandedQueries: [] as string[],
    seasonalBoost: 1.0,
    personalizedBoosts: {} as Record<string, number>,
    regionalBoosts: {} as Record<string, number>,
    appliedContext: [] as string[]
  };

  // 1. Query Expansion
  let searchQueries = [query];
  if (enableQueryExpansion) {
    const userProfile = enablePersonalization ? getUserProfile(sessionId) : undefined;
    const expandedQueries = expandSearchQuery(query, userProfile);
    searchQueries = expandedQueries;
    contextualInsights.expandedQueries = expandedQueries;
    contextualInsights.appliedContext.push('query_expansion');
    
    logger.info(`  📈 Query expansion: ${expandedQueries.length} variants`);
  }

  // 2. Seasonal Boosts
  let seasonalBoost = 1.0;
  if (enableSeasonalBoost) {
    seasonalBoost = getSeasonalBoost(query);
    contextualInsights.seasonalBoost = seasonalBoost;
    
    if (seasonalBoost > 1.0) {
      contextualInsights.appliedContext.push('seasonal_boost');
      logger.info(`  🌱 Seasonal boost: ${seasonalBoost.toFixed(2)}x`);
    }
  }

  // 3. Personal Preferences
  let personalizedBoosts: Record<string, number> = {};
  if (enablePersonalization) {
    personalizedBoosts = getPersonalizedBoosts(sessionId, query);
    contextualInsights.personalizedBoosts = personalizedBoosts;
    
    if (Object.keys(personalizedBoosts).length > 0) {
      contextualInsights.appliedContext.push('personalization');
      logger.info(`  👤 Personalized boosts: ${Object.keys(personalizedBoosts).length} categories`);
    }
  }

  // 4. Regional Preferences
  let regionalBoosts: Record<string, number> = {};
  if (location?.country || location?.region) {
    regionalBoosts = getRegionalBoosts(location, query);
    contextualInsights.regionalBoosts = regionalBoosts;
    
    if (Object.keys(regionalBoosts).length > 0) {
      contextualInsights.appliedContext.push('regional_preferences');
      logger.info(`  🌏 Regional boosts: ${location.country}/${location.region}`);
    }
  }

  // 5. Execute Enhanced Search
  // For now, we'll use the primary query but could implement multi-query fusion
  const primaryQuery = searchQueries[0] ?? query;
  const { results, searchStats } = await hybridSearch(primaryQuery, {
    ...hybridOptions,
    maxResults: (hybridOptions.maxResults ?? 20) + 10 // Get extra results for re-ranking
  });

  // 6. Apply Contextual Re-ranking
  const contextualResults = results.map((result, index) => {
    const contextualResult: ContextualSearchResult = {
      ...result,
      contextualBoost: 1.0,
      seasonalBoost: seasonalBoost,
      personalBoost: 1.0,
      queryExpansion: searchQueries,
      recommendationReason: []
    };

    // Apply seasonal boost
    if (seasonalBoost > 1.0 && isProductSeasonallyRelevant(result, query)) {
      contextualResult.contextualBoost = (contextualResult.contextualBoost ?? 1.0) * seasonalBoost;
      contextualResult.recommendationReason = [...(contextualResult.recommendationReason ?? []), 'seasonal_relevance'];
    }

    // Apply personal preference boosts
    for (const [category, boost] of Object.entries(personalizedBoosts)) {
      if (isProductInCategory(result, category)) {
        contextualResult.personalBoost = (contextualResult.personalBoost ?? 1.0) * boost;
        contextualResult.contextualBoost = (contextualResult.contextualBoost ?? 1.0) * boost;
        contextualResult.recommendationReason = [...(contextualResult.recommendationReason ?? []), `personal_preference_${category}`];
      }
    }

    // Apply regional boosts
    for (const [keyword, boost] of Object.entries(regionalBoosts)) {
      if (isProductRegionallyRelevant(result, keyword)) {
        contextualResult.contextualBoost = (contextualResult.contextualBoost ?? 1.0) * boost;
        contextualResult.recommendationReason = [...(contextualResult.recommendationReason ?? []), `regional_preference_${keyword}`];
      }
    }

    // Recalculate final score
    contextualResult.hybridScore *= contextualResult.contextualBoost ?? 1.0;

    return contextualResult;
  });

  // 7. Re-sort by enhanced contextual scores
  contextualResults.sort((a, b) => b.hybridScore - a.hybridScore);

  // 8. Limit to requested results
  const finalResults = contextualResults.slice(0, hybridOptions.maxResults ?? 20);

  // 9. Track the enhanced search event
  trackSearchEvent({
    sessionId,
    userId,
    query: primaryQuery,
    searchType: hybridOptions.mode === 'semantic_only' ? 'semantic' : 
                hybridOptions.mode === 'keyword_only' ? 'keyword' : 'hybrid',
    results: finalResults.map((result, index) => ({
      productId: result.productId,
      title: result.title,
      position: index,
      score: result.hybridScore
    })),
    userAgent,
    location
  });

  logger.info(`  ✅ Contextual search completed: ${finalResults.length} results with ${contextualInsights.appliedContext.join(', ')}`);

  return {
    results: finalResults,
    searchStats: {
      ...searchStats
    },
    contextualInsights
  };
}

// Get regional boosts based on location
function getRegionalBoosts(
  location: { country?: string; region?: string; city?: string },
  query: string
): Record<string, number> {
  const boosts: Record<string, number> = {};
  const lowerQuery = query.toLowerCase();

  // Country-level boosts
  if (location.country) {
    const countryPrefs = regionalPreferences[location.country.toLowerCase()];
    if (countryPrefs) {
      for (const [keyword, boost] of Object.entries(countryPrefs)) {
        if (lowerQuery.includes(keyword) || isSemanticallySimilar(lowerQuery, keyword)) {
          boosts[keyword] = boost;
        }
      }
    }
  }

  // Region-level boosts (for Philippines)
  if (location.region) {
    const regionPrefs = regionalPreferences[location.region.toLowerCase()];
    if (regionPrefs) {
      for (const [keyword, boost] of Object.entries(regionPrefs)) {
        if (lowerQuery.includes(keyword) || isSemanticallySimilar(lowerQuery, keyword)) {
          boosts[keyword] = Math.max(boosts[keyword] ?? 1.0, boost);
        }
      }
    }
  }

  return boosts;
}

// Check if product is seasonally relevant
function isProductSeasonallyRelevant(result: HybridSearchResult, query: string): boolean {
  const seasonalKeywords = [
    'immunity', 'immune', 'detox', 'cleanse', 'energy', 'hydration', 
    'cooling', 'warming', 'respiratory', 'vitamin c', 'weight loss'
  ];

  const lowerQuery = query.toLowerCase();
  const productText = `${result.title} ${result.categories?.join(' ')}`.toLowerCase();

  return seasonalKeywords.some(keyword => 
    lowerQuery.includes(keyword) || productText.includes(keyword)
  );
}

// Check if product belongs to a category
function isProductInCategory(result: HybridSearchResult, category: string): boolean {
  const productText = `${result.title} ${result.categories?.join(' ')}`.toLowerCase();
  const categoryKeywords = getCategoryKeywords(category);

  return categoryKeywords.some(keyword => productText.includes(keyword));
}

// Check if product is regionally relevant
function isProductRegionallyRelevant(result: HybridSearchResult, keyword: string): boolean {
  const productText = `${result.title} ${result.categories?.join(' ')}`.toLowerCase();
  return productText.includes(keyword.toLowerCase());
}

// Get keywords for a category
function getCategoryKeywords(category: string): string[] {
  const categoryKeywords: Record<string, string[]> = {
    'spices': ['turmeric', 'ginger', 'cinnamon', 'cumin', 'pepper', 'spice'],
    'honey': ['honey', 'raw honey', 'organic honey'],
    'rice': ['rice', 'black rice', 'brown rice', 'wild rice', 'grain'],
    'herbs': ['moringa', 'basil', 'oregano', 'thyme', 'sage', 'herb'],
    'tea': ['tea', 'blend', 'salabat', 'herbal tea', 'beverage'],
    'immunity': ['immune', 'immunity', 'defense', 'antioxidant', 'vitamin c'],
    'inflammation': ['anti-inflammatory', 'inflammation', 'turmeric', 'ginger'],
    'energy': ['energy', 'energizing', 'vitality', 'stamina', 'boost'],
    'digestion': ['digestive', 'digestion', 'gut', 'stomach', 'fiber']
  };

  return categoryKeywords[category.toLowerCase()] ?? [category.toLowerCase()];
}

// Simple semantic similarity check
function isSemanticallySimilar(query: string, keyword: string): boolean {
  const similarities: Record<string, string[]> = {
    'traditional': ['authentic', 'heritage', 'classic', 'native', 'local'],
    'organic': ['natural', 'pure', 'clean', 'chemical-free', 'pesticide-free'],
    'tropical': ['exotic', 'island', 'warm-climate', 'southeast asian'],
    'highland': ['mountain', 'elevated', 'upland', 'cool-climate']
  };

  const relatedTerms = similarities[keyword.toLowerCase()] ?? [];
  return relatedTerms.some(term => query.includes(term));
}

// Smart search suggestions with context
export function getContextualSuggestions(
  partialQuery: string,
  sessionId: string,
  location?: { country?: string; region?: string }
): string[] {
  const userProfile = getUserProfile(sessionId);
  const suggestions = new Set<string>();

  // Base suggestions from user preferences
  const topCategories = Object.entries(userProfile.preferences.categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);

  const topBenefits = Object.entries(userProfile.preferences.healthBenefits)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([benefit]) => benefit);

  // Add personalized suggestions
  for (const category of topCategories) {
    if (category.startsWith(partialQuery.toLowerCase())) {
      suggestions.add(category);
    }
  }

  for (const benefit of topBenefits) {
    if (benefit.startsWith(partialQuery.toLowerCase())) {
      suggestions.add(benefit);
    }
  }

  // Add seasonal suggestions
  const seasonalBoost = getSeasonalBoost(partialQuery);
  if (seasonalBoost > 1.0) {
    const currentMonth = new Date().getMonth() + 1;
    const seasonalSuggestions = getSeasonalSuggestions(currentMonth);
    
    for (const suggestion of seasonalSuggestions) {
      if (suggestion.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(suggestion);
      }
    }
  }

  // Add regional suggestions
  if (location?.country === 'philippines') {
    const regionalSuggestions = ['traditional filipino herbs', 'organic rice varieties', 'coconut products', 'tropical superfoods'];
    
    for (const suggestion of regionalSuggestions) {
      if (suggestion.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(suggestion);
      }
    }
  }

  return Array.from(suggestions).slice(0, 8);
}

// Get seasonal suggestions
function getSeasonalSuggestions(month: number): string[] {
  if (month >= 3 && month <= 5) { // Spring
    return ['detox products', 'energy boosters', 'cleansing herbs', 'spring wellness'];
  } else if (month >= 6 && month <= 8) { // Summer
    return ['hydrating foods', 'cooling herbs', 'weight management', 'summer nutrition'];
  } else if (month >= 9 && month <= 11) { // Autumn
    return ['immune support', 'vitamin c rich', 'cold prevention', 'immunity boosters'];
  } else { // Winter
    return ['warming spices', 'respiratory support', 'immune system', 'winter wellness'];
  }
}