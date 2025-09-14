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
