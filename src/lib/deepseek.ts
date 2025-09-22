import { logger } from '@/lib/logger';
// DeepSeek API Integration for Knowledge Graph Enhancement

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ProductInsights {
  primaryUses?: string[];
  targetAudience?: string[];
  complementaryProducts?: string[];
  seasonality?: string;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

function getDeepseekApiKey(): string | null {
  return process.env.DEEPSEEK_API_KEY ?? null;
}

// Generic DeepSeek API call
export async function callDeepSeek(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string | null> {
  const DEEPSEEK_API_KEY = getDeepseekApiKey();
  if (!DEEPSEEK_API_KEY) {
    // Avoid noisy logs during build/import time; only warn when actually called
    logger.warn('⚠️ DeepSeek API key not configured');
    return null;
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model ?? 'deepseek-chat',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as DeepSeekResponse;
    return data.choices[0]?.message?.content ?? null;
  } catch (error) {
    logger.error('❌ DeepSeek API call failed:', error as Record<string, unknown>);
    return null;
  }
}

// Extract health benefits from product description
export async function extractHealthBenefits(productName: string, description: string): Promise<string[]> {
  const prompt = `
Analyze the following organic product and extract specific health benefits. Return ONLY a JSON array of health benefit names.

Product: ${productName}
Description: ${description}

Focus on specific, scientifically-backed health benefits. Examples:
- "anti-inflammatory"
- "antioxidant properties" 
- "digestive support"
- "immune system boost"
- "blood sugar regulation"
- "heart health support"

Return format: ["benefit1", "benefit2", "benefit3"]
`;

  const messages = [
    { role: 'system', content: 'You are a nutrition expert specializing in organic foods and their health benefits.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.3, max_tokens: 200 });
  
  if (!response) return [];

  try {
    // Extract JSON array from response
    const jsonMatch = response.match(/\[(.*?)\]/);
    if (jsonMatch) {
      const parsedData: unknown = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsedData) ? parsedData.slice(0, 5) : []; // Limit to 5 benefits
    }
  } catch (error) {
    logger.error('Failed to parse health benefits:', error as Record<string, unknown>);
  }

  return [];
}

// Generate product relationships and categories
export async function generateProductInsights(productName: string, description: string): Promise<{
  primaryUses: string[];
  targetAudience: string[];
  complementaryProducts: string[];
  seasonality?: string;
}> {
  const prompt = `
Analyze this organic product and provide insights for an e-commerce knowledge graph:

Product: ${productName}
Description: ${description}

Return a JSON object with:
{
  "primaryUses": ["cooking", "tea brewing", "health supplement"],
  "targetAudience": ["health conscious", "diabetics", "fitness enthusiasts"],
  "complementaryProducts": ["honey", "lemon", "ginger"],
  "seasonality": "year-round" or "seasonal description"
}

Focus on practical uses and realistic target audiences for organic farm products.
`;

  const messages = [
    { role: 'system', content: 'You are an e-commerce analyst specializing in organic products and customer behavior.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.4, max_tokens: 300 });
  
  if (!response) {
    return {
      primaryUses: [],
      targetAudience: [],
      complementaryProducts: [],
    };
  }

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData: unknown = JSON.parse(jsonMatch[0]);
      const insights = parsedData as ProductInsights;
      return {
        primaryUses: Array.isArray(insights.primaryUses) ? insights.primaryUses.slice(0, 4) : [],
        targetAudience: Array.isArray(insights.targetAudience) ? insights.targetAudience.slice(0, 4) : [],
        complementaryProducts: Array.isArray(insights.complementaryProducts) ? insights.complementaryProducts.slice(0, 5) : [],
        seasonality: insights.seasonality,
      };
    }
  } catch (error) {
    logger.error('Failed to parse product insights:', error as Record<string, unknown>);
  }

  return {
    primaryUses: [],
    targetAudience: [],
    complementaryProducts: [],
  };
}

// Enhance product descriptions with SEO and health information
export async function enhanceProductDescription(
  productName: string, 
  currentDescription: string
): Promise<string> {
  const prompt = `
Enhance this organic product description for better SEO and customer engagement:

Product: ${productName}
Current Description: ${currentDescription}

Create an enhanced description that:
1. Maintains the original information
2. Adds relevant health benefits
3. Improves SEO with natural keywords
4. Includes usage suggestions
5. Stays under 200 words
6. Uses natural, engaging language

Return only the enhanced description text.
`;

  const messages = [
    { role: 'system', content: 'You are a copywriter specializing in organic food products with SEO expertise.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.6, max_tokens: 300 });
  
  return response ?? currentDescription;
}

// Generate natural language queries for graph database
export async function generateGraphQuery(userQuery: string): Promise<string> {
  const prompt = `
Convert this natural language query into a Cypher query for a product knowledge graph:

User Query: "${userQuery}"

Graph Schema:
- Nodes: Product, Category, HealthBenefit, Use, Audience
- Relationships: BELONGS_TO, PROVIDES, USED_FOR, TARGETS

Return a Cypher query that finds relevant products. Focus on MATCH patterns and WHERE clauses.

Examples:
"products for diabetes" → MATCH (p:Product)-[:PROVIDES]->(h:HealthBenefit) WHERE h.name CONTAINS "blood sugar" RETURN p
"turmeric products" → MATCH (p:Product) WHERE p.name CONTAINS "turmeric" RETURN p

Query:
`;

  const messages = [
    { role: 'system', content: 'You are a graph database expert specializing in Cypher queries for e-commerce.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.3, max_tokens: 200 });
  
  return response ?? `MATCH (p:Product) WHERE p.name CONTAINS "${userQuery}" RETURN p LIMIT 10`;
}

// Smart product recommendation explanations
export async function generateRecommendationReason(
  userProduct: string,
  recommendedProduct: string,
  relationship: string
): Promise<string> {
  const prompt = `
Explain why "${recommendedProduct}" is recommended for someone interested in "${userProduct}".

Relationship: ${relationship}

Create a brief, friendly explanation (1-2 sentences) that helps the customer understand the connection.

Examples:
- "Both products contain powerful anti-inflammatory compounds that work synergistically"
- "Customers who enjoy turmeric often love ginger for its similar warming properties and digestive benefits"
- "This combination is popular in traditional wellness routines"

Explanation:
`;

  const messages = [
    { role: 'system', content: 'You are a friendly nutrition consultant explaining product relationships to customers.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.7, max_tokens: 100 });
  
  return response ?? `These products work well together and are often purchased by similar customers.`;
}

// Query intent analysis for enhanced search
export interface SearchIntent {
  intent: 'product' | 'health' | 'recipe' | 'information' | 'comparison';
  confidence: number;
  expandedTerms: string[];
  healthFocus?: string[];
  suggestedFilters?: Record<string, string>;
  semanticContext?: string[];
  userGoal?: string;
}

export async function analyzeSearchIntent(query: string): Promise<SearchIntent> {
  const prompt = `
Analyze this search query for an organic food e-commerce store and return ONLY a JSON object:

Query: "${query}"

Determine:
1. Intent type: product (looking to buy), health (seeking benefits), recipe (cooking usage), information (learning), comparison (comparing options)
2. Confidence level (0.0-1.0)
3. Expanded terms (synonyms, related concepts)
4. Health focus areas if applicable
5. Suggested filters for the search
6. Semantic context (broader themes)
7. User's likely goal

Return format:
{
  "intent": "product|health|recipe|information|comparison",
  "confidence": 0.95,
  "expandedTerms": ["turmeric", "curcumin", "golden milk", "anti-inflammatory spice"],
  "healthFocus": ["inflammation", "joint health", "antioxidant"],
  "suggestedFilters": {"category": "spices", "benefit": "anti-inflammatory"},
  "semanticContext": ["traditional medicine", "ayurvedic herbs", "cooking spices"],
  "userGoal": "find natural anti-inflammatory products"
}

Examples:
- "turmeric for arthritis" → health intent, anti-inflammatory focus
- "best organic honey" → product intent, quality comparison
- "how to use moringa powder" → information intent, usage guidance
- "ginger vs turmeric benefits" → comparison intent, health benefits focus
`;

  const messages = [
    { role: 'system', content: 'You are an expert in organic food products and customer search behavior. Always return valid JSON only.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.3, max_tokens: 400 });

  if (!response) {
    return {
      intent: 'product',
      confidence: 0.5,
      expandedTerms: [query],
      semanticContext: []
    };
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as SearchIntent;
      return {
        intent: parsed.intent || 'product',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        expandedTerms: Array.isArray(parsed.expandedTerms) ? parsed.expandedTerms : [query],
        healthFocus: Array.isArray(parsed.healthFocus) ? parsed.healthFocus : undefined,
        suggestedFilters: parsed.suggestedFilters || {},
        semanticContext: Array.isArray(parsed.semanticContext) ? parsed.semanticContext : [],
        userGoal: parsed.userGoal
      };
    }
  } catch (error) {
    logger.error('Failed to parse search intent:', error as Record<string, unknown>);
  }

  // Fallback to simple heuristics
  return fallbackIntentAnalysis(query);
}

function fallbackIntentAnalysis(query: string): SearchIntent {
  const lowerQuery = query.toLowerCase();

  // Health intent patterns
  if (lowerQuery.match(/\b(benefits?|health|healing|cure|treat|prevent|good for|help with)\b/)) {
    return {
      intent: 'health',
      confidence: 0.8,
      expandedTerms: [query],
      semanticContext: ['health benefits']
    };
  }

  // Recipe/usage intent
  if (lowerQuery.match(/\b(how to|recipe|cook|use|prepare|make|brew)\b/)) {
    return {
      intent: 'recipe',
      confidence: 0.8,
      expandedTerms: [query],
      semanticContext: ['cooking usage']
    };
  }

  // Comparison intent
  if (lowerQuery.match(/\b(vs|versus|compare|best|better|difference)\b/)) {
    return {
      intent: 'comparison',
      confidence: 0.8,
      expandedTerms: [query],
      semanticContext: ['product comparison']
    };
  }

  // Default to product search
  return {
    intent: 'product',
    confidence: 0.6,
    expandedTerms: [query],
    semanticContext: ['product search']
  };
}

// Enhanced user preference analysis
export interface UserProfile {
  healthGoals: string[];
  dietaryPreferences: string[];
  cookingStyle: string[];
  preferredCategories: Record<string, number>;
  allergyAwareness: string[];
  budgetConsciousness: 'low' | 'medium' | 'high';
  qualityFocus: string[];
}

export async function analyzeUserPreferences(
  searchHistory: string[],
  clickHistory: string[],
  purchaseHistory?: string[]
): Promise<UserProfile> {
  const prompt = `
Analyze user behavior patterns to build a comprehensive profile for personalized organic food recommendations:

Search History (last 10): ${searchHistory.slice(-10).join(', ')}
Clicked Products: ${clickHistory.slice(-10).join(', ')}
${purchaseHistory ? `Purchased: ${purchaseHistory.slice(-5).join(', ')}` : ''}

Infer and return JSON:
{
  "healthGoals": ["weight management", "immune support", "digestive health"],
  "dietaryPreferences": ["organic", "gluten-free", "vegan"],
  "cookingStyle": ["traditional", "quick meals", "tea brewing"],
  "preferredCategories": {"spices": 0.8, "herbs": 0.6, "honey": 0.4},
  "allergyAwareness": ["gluten", "nuts"],
  "budgetConsciousness": "medium",
  "qualityFocus": ["organic certification", "raw products", "traditional methods"]
}

Focus on health-conscious patterns, quality preferences, and cooking behaviors.
`;

  const messages = [
    { role: 'system', content: 'You are a nutrition and customer behavior analyst specializing in organic food preferences.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.4, max_tokens: 500 });

  if (!response) {
    return createDefaultUserProfile();
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as UserProfile;
      return {
        healthGoals: Array.isArray(parsed.healthGoals) ? parsed.healthGoals : [],
        dietaryPreferences: Array.isArray(parsed.dietaryPreferences) ? parsed.dietaryPreferences : [],
        cookingStyle: Array.isArray(parsed.cookingStyle) ? parsed.cookingStyle : [],
        preferredCategories: parsed.preferredCategories || {},
        allergyAwareness: Array.isArray(parsed.allergyAwareness) ? parsed.allergyAwareness : [],
        budgetConsciousness: parsed.budgetConsciousness || 'medium',
        qualityFocus: Array.isArray(parsed.qualityFocus) ? parsed.qualityFocus : []
      };
    }
  } catch (error) {
    logger.error('Failed to parse user preferences:', error as Record<string, unknown>);
  }

  return createDefaultUserProfile();
}

function createDefaultUserProfile(): UserProfile {
  return {
    healthGoals: [],
    dietaryPreferences: [],
    cookingStyle: [],
    preferredCategories: {},
    allergyAwareness: [],
    budgetConsciousness: 'medium',
    qualityFocus: []
  };
}

// Cross-encoder re-ranking for search results
export interface ReRankingResult {
  productId: number;
  relevanceScore: number;
  explanation: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export async function reRankSearchResults(
  query: string,
  candidates: Array<{
    id: number;
    name: string;
    description?: string;
    categories?: string[];
    currentScore: number;
  }>,
  intent?: string,
  maxCandidates: number = 10
): Promise<ReRankingResult[]> {
  // Limit candidates to avoid token limits
  const topCandidates = candidates.slice(0, maxCandidates);

  const prompt = `
Evaluate the relevance of these organic food products for the given search query and return a JSON array of scores:

Search Query: "${query}"
${intent ? `Search Intent: ${intent}` : ''}

Products to evaluate:
${topCandidates.map((candidate, index) =>
  `${index + 1}. ${candidate.name} - ${candidate.description?.slice(0, 100) || 'No description'} (Categories: ${candidate.categories?.join(', ') || 'None'})`
).join('\n')}

For each product, rate relevance (0.0-1.0) considering:
1. Name/title match with query
2. Description relevance
3. Category alignment
4. Health benefits match (if health intent)
5. Usage context match (if recipe/cooking intent)

Return ONLY a JSON array:
[
  {
    "productId": 1,
    "relevanceScore": 0.95,
    "explanation": "Perfect match for anti-inflammatory needs",
    "confidenceLevel": "high"
  }
]

Sort by relevance score (highest first). Be strict with scoring - only highly relevant products should score above 0.8.
`;

  const messages = [
    { role: 'system', content: 'You are an expert in organic food products and search relevance. Always return valid JSON only.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.2, max_tokens: 800 });

  if (!response) {
    // Fallback to original scores
    return topCandidates.map(candidate => ({
      productId: candidate.id,
      relevanceScore: candidate.currentScore,
      explanation: 'Fallback scoring',
      confidenceLevel: 'low' as const
    }));
  }

  try {
    const jsonMatch = response.match(/\[([\s\S]*)\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ReRankingResult[];

      // Validate and sanitize results
      return parsed
        .filter(result => result.productId && typeof result.relevanceScore === 'number')
        .map(result => ({
          productId: result.productId,
          relevanceScore: Math.max(0, Math.min(1, result.relevanceScore)),
          explanation: result.explanation || 'No explanation',
          confidenceLevel: ['high', 'medium', 'low'].includes(result.confidenceLevel)
            ? result.confidenceLevel
            : 'medium' as const
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  } catch (error) {
    logger.error('Failed to parse re-ranking results:', error as Record<string, unknown>);
  }

  // Fallback to original scores
  return topCandidates.map(candidate => ({
    productId: candidate.id,
    relevanceScore: candidate.currentScore,
    explanation: 'Fallback scoring',
    confidenceLevel: 'low' as const
  }));
}

// Batch re-ranking for better efficiency
export async function batchReRankResults(
  queries: Array<{
    query: string;
    intent?: string;
    candidates: Array<{
      id: number;
      name: string;
      description?: string;
      categories?: string[];
      currentScore: number;
    }>;
  }>
): Promise<Record<string, ReRankingResult[]>> {
  const results: Record<string, ReRankingResult[]> = {};

  // Process in smaller batches to avoid token limits
  for (const queryData of queries) {
    try {
      const reRanked = await reRankSearchResults(
        queryData.query,
        queryData.candidates,
        queryData.intent,
        8 // Smaller batch size for efficiency
      );
      results[queryData.query] = reRanked;
    } catch (error) {
      logger.error(`Failed to re-rank results for query: ${queryData.query}`, error as Record<string, unknown>);
      // Use fallback scoring
      results[queryData.query] = queryData.candidates.map(candidate => ({
        productId: candidate.id,
        relevanceScore: candidate.currentScore,
        explanation: 'Fallback scoring due to error',
        confidenceLevel: 'low' as const
      }));
    }
  }

  return results;
}

// Analyze search quality using DeepSeek
export interface SearchQualityMetrics {
  overallQuality: number;
  precisionAtK: number;
  diversityScore: number;
  intentMatch: number;
  suggestions: string[];
  improvementAreas: string[];
}

export async function analyzeSearchQuality(
  query: string,
  results: Array<{
    name: string;
    description?: string;
    categories?: string[];
    clickThrough?: boolean;
    purchased?: boolean;
  }>,
  userFeedback?: {
    satisfied: boolean;
    foundRelevant: boolean;
    comments?: string;
  }
): Promise<SearchQualityMetrics> {
  const prompt = `
Analyze the quality of these search results for an organic food e-commerce site:

Query: "${query}"
Results returned:
${results.map((result, index) =>
  `${index + 1}. ${result.name} ${result.clickThrough ? '(clicked)' : ''} ${result.purchased ? '(purchased)' : ''}`
).join('\n')}

${userFeedback ? `User Feedback: Satisfied: ${userFeedback.satisfied}, Found Relevant: ${userFeedback.foundRelevant}` : ''}

Evaluate and return JSON:
{
  "overallQuality": 0.85,
  "precisionAtK": 0.8,
  "diversityScore": 0.7,
  "intentMatch": 0.9,
  "suggestions": ["Include more specific health benefit matches", "Add recipe usage information"],
  "improvementAreas": ["Better category filtering", "Enhanced product descriptions"]
}

Consider:
- Relevance of top results
- Diversity in product types
- Match with likely search intent
- User engagement signals (clicks, purchases)
- Overall result quality
`;

  const messages = [
    { role: 'system', content: 'You are a search quality analyst specializing in e-commerce organic food products.' },
    { role: 'user', content: prompt }
  ];

  const response = await callDeepSeek(messages, { temperature: 0.3, max_tokens: 600 });

  const defaultMetrics: SearchQualityMetrics = {
    overallQuality: 0.5,
    precisionAtK: 0.5,
    diversityScore: 0.5,
    intentMatch: 0.5,
    suggestions: [],
    improvementAreas: []
  };

  if (!response) {
    return defaultMetrics;
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as SearchQualityMetrics;
      return {
        overallQuality: Math.max(0, Math.min(1, parsed.overallQuality || 0.5)),
        precisionAtK: Math.max(0, Math.min(1, parsed.precisionAtK || 0.5)),
        diversityScore: Math.max(0, Math.min(1, parsed.diversityScore || 0.5)),
        intentMatch: Math.max(0, Math.min(1, parsed.intentMatch || 0.5)),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : []
      };
    }
  } catch (error) {
    logger.error('Failed to parse search quality metrics:', error as Record<string, unknown>);
  }

  return defaultMetrics;
}

// Test DeepSeek connection
export async function testDeepSeekConnection(): Promise<{
  success: boolean;
  model?: string;
  error?: Record<string, unknown>;
}> {
  const messages = [
    { role: 'user', content: 'Hello! Please respond with "Connection successful" to confirm the API is working.' }
  ];

  const response = await callDeepSeek(messages, { max_tokens: 50 });

  if (response) {
    return {
      success: true,
      model: 'deepseek-chat',
    };
  } else {
    return {
      success: false,
      error: { message: 'No response from DeepSeek API' },
    };
  }
}
