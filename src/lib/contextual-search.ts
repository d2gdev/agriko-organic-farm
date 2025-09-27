// Enhanced Contextual Search with AI-Powered Features
import { Core } from '@/types/TYPE_REGISTRY';
import { hybridSearch, HybridSearchOptions, HybridSearchResult } from './hybrid-search';
import { logger } from '@/lib/logger';
import { analyzeSearchIntent, reRankSearchResults, type SearchIntent } from './deepseek';
// import { calculateDynamicWeights, generateQueryMultiVectorEmbedding } from './multi-vector-embeddings';
import { generateSemanticClusters, generateSemanticFacets } from './semantic-clustering';
import {
  applyPersonalizationBoost,
  trackSearchBehavior,
  // getPersonalizedSuggestions,
  // type PersonalizedSearchOptions
} from './personalization-engine';
import { trackSearchEvent } from './search-quality-metrics';
// import { getCachedEmbedding } from './embedding-cache';
// import { generateEnhancedEmbedding } from './embeddings';

import {
  getUserProfile,
  expandSearchQuery,
  getSeasonalBoost,
  getPersonalizedBoosts
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
  enableSemanticClustering?: boolean;
  enableReRanking?: boolean;
  enableIntentAnalysis?: boolean;
  personalizationStrength?: 'light' | 'medium' | 'strong';
  userAgent?: string;
  includeQualityMetrics?: boolean;
}

export interface ContextualSearchResult extends HybridSearchResult {
  contextualBoost?: number;
  seasonalBoost?: number;
  personalBoost?: number;
  queryExpansion?: string[];
  recommendationReason?: string[];
  intentMatch?: number;
  semanticCluster?: string;
  personalizedScore?: number;
  personalizationBoost?: number;
  personalizationReasons?: string[];
  reRankingScore?: number;
  reRankingExplanation?: string;
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

// Enhanced contextual search function with AI-powered features
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
    totalMatches: number;
  };
  contextualInsights: {
    originalQuery: string;
    expandedQueries: string[];
    seasonalBoost: number;
    personalizedBoosts: Record<string, number>;
    regionalBoosts: Record<string, number>;
    appliedContext: string[];
    searchIntent?: SearchIntent;
    semanticClusters?: Array<{ name: string; size: number }>;
    semanticFacets?: Array<{ name: string; values: Array<{ label: string; count: number }> }>;
  };
  qualityMetrics?: {
    responseTime: number;
    cacheHitRate: number;
    personalizationApplied: boolean;
    reRankingApplied: boolean;
  };
}> {
  const startTime = Date.now();
  const {
    sessionId,
    userId,
    location,
    enablePersonalization = true,
    enableSeasonalBoost = true,
    enableQueryExpansion = true,
    enableSemanticClustering = true,
    enableReRanking = true,
    enableIntentAnalysis = true,
    personalizationStrength = 'medium',
    userAgent = 'unknown',
    includeQualityMetrics = false,
    ...hybridOptions
  } = options;

  logger.info(`🎯 Enhanced contextual search: "${query}" for session ${sessionId}`);

  // Track search behavior
  trackSearchBehavior(sessionId, query);

  const contextualInsights = {
    originalQuery: query,
    expandedQueries: [] as string[],
    seasonalBoost: 1.0,
    personalizedBoosts: {} as Record<string, number>,
    regionalBoosts: {} as Record<string, number>,
    appliedContext: [] as string[]
  };

  let searchIntent: SearchIntent | undefined;
  let qualityMetrics: { responseTime: number; cacheHitRate: number; personalizationApplied: boolean; reRankingApplied: boolean } | undefined;

  // 1. Intent Analysis
  if (enableIntentAnalysis) {
    try {
      searchIntent = await analyzeSearchIntent(query);
      (contextualInsights as typeof contextualInsights & { searchIntent?: unknown }).searchIntent = searchIntent;
      contextualInsights.appliedContext.push('intent_analysis');

      logger.info(`  🧠 Intent analysis: ${searchIntent.intent} (confidence: ${searchIntent.confidence.toFixed(2)})`);
    } catch (error) {
      logger.error('Intent analysis failed:', error as Record<string, unknown>);
    }
  }

  // 2. Query Expansion
  let searchQueries = [query];
  if (enableQueryExpansion) {
    if (searchIntent?.expandedTerms) {
      searchQueries = [query, ...searchIntent.expandedTerms.slice(0, 3)];
    } else {
      const userProfile = enablePersonalization ? getUserProfile(sessionId) : undefined;
      const expandedQueries = expandSearchQuery(query, userProfile);
      searchQueries = expandedQueries;
    }
    contextualInsights.expandedQueries = searchQueries;
    contextualInsights.appliedContext.push('query_expansion');

    logger.info(`  📈 Query expansion: ${searchQueries.length} variants`);
  }

  // 3. Seasonal Boosts
  let seasonalBoost = 1.0;
  if (enableSeasonalBoost) {
    seasonalBoost = getSeasonalBoost(query);
    contextualInsights.seasonalBoost = seasonalBoost;

    if (seasonalBoost > 1.0) {
      contextualInsights.appliedContext.push('seasonal_boost');
      logger.info(`  🌱 Seasonal boost: ${seasonalBoost.toFixed(2)}x`);
    }
  }

  // 4. Personal Preferences (legacy)
  let personalizedBoosts: Record<string, number> = {};
  if (enablePersonalization) {
    personalizedBoosts = getPersonalizedBoosts(sessionId, query);
    contextualInsights.personalizedBoosts = personalizedBoosts;

    if (Object.keys(personalizedBoosts).length > 0) {
      contextualInsights.appliedContext.push('legacy_personalization');
      logger.info(`  👤 Legacy personalized boosts: ${Object.keys(personalizedBoosts).length} categories`);
    }
  }

  // 5. Regional Preferences
  let regionalBoosts: Record<string, number> = {};
  if (location?.country || location?.region) {
    regionalBoosts = getRegionalBoosts(location, query);
    contextualInsights.regionalBoosts = regionalBoosts;

    if (Object.keys(regionalBoosts).length > 0) {
      contextualInsights.appliedContext.push('regional_preferences');
      logger.info(`  🌏 Regional boosts: ${location.country}/${location.region}`);
    }
  }

  // 6. Execute Enhanced Search with caching
  const primaryQuery = searchQueries[0] ?? query;
  const cacheHitRate = 0;

  const { results, searchStats } = await hybridSearch(primaryQuery, {
    ...hybridOptions,
    limit: (hybridOptions.limit ?? 20) + 15 // Get extra results for re-ranking and clustering
  });

  logger.info(`  🔍 Base search returned ${results.length} results`);

  // 7. Apply Enhanced Personalization
  let personalizedResults: Array<HybridSearchResult & {
    personalizedScore: number;
    personalizationBoost: number;
    personalizationReasons: string[];
  }> = results.map(result => ({
    ...result,
    personalizedScore: result.score,
    personalizationBoost: 1.0,
    personalizationReasons: [] as string[]
  }));

  if (enablePersonalization) {
    try {
      const enhancedPersonalized = await applyPersonalizationBoost(
        sessionId,
        query,
        results.map(r => ({
          id: r.product.id,
          name: r.product.name,
          description: r.product.description,
          categories: r.product.categories,
          price: r.product.price || (0 as Core.Money),
          score: r.score
        })),
        {
          enablePersonalization: true,
          personalizationStrength,
          includeUserHistory: true,
          adaptToIntent: true
        }
      );

      personalizedResults = enhancedPersonalized.map(enhanced => {
        const original = results.find(r => r.product.id === enhanced.id);
        if (!original) return null;
        return {
          ...original,
          personalizedScore: enhanced.personalizedScore,
          personalizationBoost: enhanced.personalizationBoost,
          personalizationReasons: enhanced.personalizationReasons
        };
      }).filter(Boolean) as typeof personalizedResults;

      contextualInsights.appliedContext.push('enhanced_personalization');
      logger.info(`  🎯 Enhanced personalization applied to ${personalizedResults.length} results`);
    } catch (error) {
      logger.error('Enhanced personalization failed:', error as Record<string, unknown>);
    }
  }

  // 8. AI-Powered Re-ranking
  let reRankedResults = personalizedResults;
  let reRankingApplied = false;

  if (enableReRanking && results.length > 0) {
    try {
      const candidatesForReRanking = personalizedResults.slice(0, 15).map(result => ({
        id: result.product.id,
        name: result.product.name,
        description: result.product.description?.replace(/<[^>]*>/g, '').slice(0, 200),
        categories: result.product.categories?.map(c => c.name),
        currentScore: result.personalizedScore || result.score
      }));

      const reRankingResults = await reRankSearchResults(
        query,
        candidatesForReRanking,
        searchIntent?.intent,
        10
      );

      // Merge re-ranking scores with existing results
      reRankedResults = personalizedResults.map(result => {
        const reRanked = reRankingResults.find(r => r.productId === result.product.id);
        if (reRanked) {
          return {
            ...result,
            reRankingScore: reRanked.relevanceScore,
            reRankingExplanation: reRanked.explanation,
            score: (result.personalizedScore || result.score) * 0.7 + reRanked.relevanceScore * 0.3
          };
        }
        return result;
      });

      reRankedResults.sort((a, b) => b.score - a.score);
      reRankingApplied = true;
      contextualInsights.appliedContext.push('ai_reranking');
      logger.info(`  🤖 AI re-ranking applied to top ${reRankingResults.length} results`);
    } catch (error) {
      logger.error('AI re-ranking failed:', error as Record<string, unknown>);
    }
  }

  // 9. Apply Legacy Contextual Boosts
  const contextualResults = reRankedResults.map((result) => {
    const contextualResult: ContextualSearchResult = {
      ...result,
      contextualBoost: 1.0,
      seasonalBoost: seasonalBoost,
      personalBoost: 1.0,
      queryExpansion: searchQueries,
      recommendationReason: [],
      intentMatch: searchIntent?.confidence
    };

    // Apply seasonal boost
    if (seasonalBoost > 1.0 && isProductSeasonallyRelevant(result, query)) {
      contextualResult.contextualBoost = (contextualResult.contextualBoost ?? 1.0) * seasonalBoost;
      contextualResult.recommendationReason = [...(contextualResult.recommendationReason ?? []), 'seasonal_relevance'];
    }

    // Apply legacy personal preference boosts
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

    // Final score combines all factors
    if (!(result as typeof result & { reRankingScore?: number }).reRankingScore) {
      contextualResult.score *= contextualResult.contextualBoost ?? 1.0;
    }

    return contextualResult;
  });

  // 10. Re-sort by final enhanced scores
  contextualResults.sort((a, b) => b.score - a.score);

  // 11. Generate Semantic Clusters and Facets
  let semanticClusters: Array<{ name: string; size: number }> | undefined;
  let semanticFacets: Array<{ name: string; values: Array<{ label: string; count: number }> }> | undefined;

  const finalResults = contextualResults.slice(0, hybridOptions.limit ?? 20);

  if (enableSemanticClustering && finalResults.length > 5) {
    try {
      const clusters = await generateSemanticClusters(
        finalResults.map(result => ({
          id: result.product.id,
          name: result.product.name,
          description: result.product.description,
          categories: result.product.categories
        })),
        { maxClusters: 4, minClusterSize: 2 }
      );

      semanticClusters = clusters.map(cluster => ({
        name: cluster.name,
        size: cluster.size
      }));

      const facets = await generateSemanticFacets(
        finalResults.map(result => ({
          id: result.product.id,
          name: result.product.name,
          description: result.product.description,
          categories: result.product.categories
        })),
        clusters
      );

      semanticFacets = facets.map(facet => ({
        name: facet.name,
        values: facet.values.map(value => ({
          label: value.label,
          count: value.count
        }))
      }));

      contextualInsights.appliedContext.push('semantic_clustering');
      logger.info(`  🔗 Generated ${clusters.length} semantic clusters and ${facets.length} facets`);
    } catch (error) {
      logger.error('Semantic clustering failed:', error as Record<string, unknown>);
    }
  }

  // 12. Limit to requested results
  const limitedResults = contextualResults.slice(0, hybridOptions.limit ?? 20);

  // 13. Calculate execution metrics
  const executionTime = Date.now() - startTime;

  if (includeQualityMetrics) {
    qualityMetrics = {
      responseTime: executionTime,
      cacheHitRate,
      personalizationApplied: enablePersonalization && contextualInsights.appliedContext.includes('enhanced_personalization'),
      reRankingApplied
    };
  }

  // 14. Track the enhanced search event
  trackSearchEvent({
    sessionId,
    userId,
    query: primaryQuery,
    searchType: 'contextual',
    intent: searchIntent?.intent,
    results: finalResults.map((result, index) => ({
      productId: result.product.id,
      title: result.product.name,
      position: index,
      score: result.score,
      relevanceScore: result.reRankingScore,
      personalizationBoost: result.personalizationBoost
    })),
    userActions: {
      clickedResults: [],
      purchasedResults: [],
      dwellTimes: {},
      abandonedSession: false
    },
    metadata: {
      userAgent,
      location,
      responseTime: executionTime,
      totalResults: results.length,
      filters: hybridOptions
    }
  });

  // Add insights
  (contextualInsights as typeof contextualInsights & { semanticClusters?: unknown }).semanticClusters = semanticClusters;
  (contextualInsights as typeof contextualInsights & { semanticFacets?: unknown }).semanticFacets = semanticFacets;

  logger.info(`  ✅ Enhanced contextual search completed: ${limitedResults.length} results in ${executionTime}ms with ${contextualInsights.appliedContext.join(', ')}`);

  return {
    results: limitedResults,
    searchStats: {
      query: primaryQuery,
      mode: 'contextual',
      semanticResults: limitedResults.length,
      keywordResults: limitedResults.length,
      hybridResults: limitedResults.length,
      executionTime,
      totalMatches: results.length,
      ...searchStats
    },
    contextualInsights,
    qualityMetrics
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
  const productText = `${result.product.name} ${result.product.categories?.map(c => c.name).join(' ')}`.toLowerCase();

  return seasonalKeywords.some(keyword => 
    lowerQuery.includes(keyword) || productText.includes(keyword)
  );
}

// Check if product belongs to a category
function isProductInCategory(result: HybridSearchResult, category: string): boolean {
  const productText = `${result.product.name} ${result.product.categories?.map(c => c.name).join(' ')}`.toLowerCase();
  const categoryKeywords = getCategoryKeywords(category);

  return categoryKeywords.some(keyword => productText.includes(keyword));
}

// Check if product is regionally relevant
function isProductRegionallyRelevant(result: HybridSearchResult, keyword: string): boolean {
  const productText = `${result.product.name} ${result.product.categories?.map(c => c.name).join(' ')}`.toLowerCase();
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