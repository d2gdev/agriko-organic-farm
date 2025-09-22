// Multi-Vector Embedding Strategy for Enhanced Semantic Search
import { generateEnhancedEmbedding } from './embeddings';
import { logger } from './logger';
import { WCProduct } from '@/types/woocommerce';

export interface MultiVectorEmbedding {
  productId: number;
  titleEmbedding: number[];
  descriptionEmbedding: number[];
  categoryEmbedding: number[];
  benefitsEmbedding: number[];
  combinedEmbedding: number[];
  metadata: {
    productSlug: string;
    timestamp: string;
    embeddingVersion: string;
  };
}

export interface MultiVectorSearchOptions {
  weights?: {
    title?: number;
    description?: number;
    categories?: number;
    benefits?: number;
  };
  useEnhanced?: boolean;
  intent?: 'product' | 'health' | 'recipe' | 'information' | 'comparison';
  dynamicWeights?: boolean;
}

// Default weights for combining embeddings
const DEFAULT_WEIGHTS = {
  title: 0.4,
  description: 0.3,
  categories: 0.2,
  benefits: 0.1,
};

// Intent-based weight configurations
const INTENT_WEIGHTS = {
  product: { title: 0.5, description: 0.3, categories: 0.15, benefits: 0.05 },
  health: { title: 0.2, description: 0.2, categories: 0.15, benefits: 0.45 },
  recipe: { title: 0.4, description: 0.4, categories: 0.15, benefits: 0.05 },
  information: { title: 0.3, description: 0.4, categories: 0.2, benefits: 0.1 },
  comparison: { title: 0.3, description: 0.25, categories: 0.2, benefits: 0.25 },
};

/**
 * Calculate dynamic weights based on search intent and context
 */
export function calculateDynamicWeights(
  query: string,
  intent: 'product' | 'health' | 'recipe' | 'information' | 'comparison' = 'product',
  userContext?: {
    healthFocused?: boolean;
    experienceLevel?: 'beginner' | 'intermediate' | 'expert';
    primaryUse?: 'cooking' | 'health' | 'both';
  }
): MultiVectorSearchOptions['weights'] {
  // Start with intent-based weights
  let weights = { ...INTENT_WEIGHTS[intent] };

  // Adjust based on query characteristics
  const lowerQuery = query.toLowerCase();

  // Health-focused adjustments
  if (lowerQuery.match(/\b(benefit|health|healing|medicine|therapeutic|cure|treat)\b/)) {
    weights.benefits += 0.15;
    weights.description += 0.05;
    weights.title -= 0.1;
    weights.categories -= 0.1;
  }

  // Brand/quality focused adjustments
  if (lowerQuery.match(/\b(organic|pure|raw|natural|premium|best|quality)\b/)) {
    weights.title += 0.1;
    weights.categories += 0.05;
    weights.description -= 0.05;
    weights.benefits -= 0.1;
  }

  // Recipe/cooking focused adjustments
  if (lowerQuery.match(/\b(cook|recipe|ingredient|spice|flavor|seasoning)\b/)) {
    weights.description += 0.15;
    weights.categories += 0.1;
    weights.benefits -= 0.15;
    weights.title -= 0.1;
  }

  // User context adjustments
  if (userContext) {
    if (userContext.healthFocused) {
      weights.benefits += 0.1;
      weights.description += 0.05;
      weights.title -= 0.075;
      weights.categories -= 0.075;
    }

    if (userContext.experienceLevel === 'beginner') {
      weights.description += 0.1;
      weights.categories += 0.05;
      weights.title -= 0.075;
      weights.benefits -= 0.075;
    }

    if (userContext.primaryUse === 'health') {
      weights.benefits += 0.15;
      weights.description += 0.05;
      weights.title -= 0.1;
      weights.categories -= 0.1;
    } else if (userContext.primaryUse === 'cooking') {
      weights.description += 0.1;
      weights.categories += 0.1;
      weights.benefits -= 0.15;
      weights.title -= 0.05;
    }
  }

  // Normalize weights to sum to 1
  const totalWeight = weights.title + weights.description + weights.categories + weights.benefits;
  if (totalWeight !== 1) {
    weights.title /= totalWeight;
    weights.description /= totalWeight;
    weights.categories /= totalWeight;
    weights.benefits /= totalWeight;
  }

  // Ensure minimum weights
  const minWeight = 0.05;
  if (weights.title < minWeight) weights.title = minWeight;
  if (weights.description < minWeight) weights.description = minWeight;
  if (weights.categories < minWeight) weights.categories = minWeight;
  if (weights.benefits < minWeight) weights.benefits = minWeight;

  return weights;
}

/**
 * Generate multi-vector embeddings for a product
 */
export async function generateMultiVectorEmbedding(
  product: WCProduct,
  healthBenefits?: string[]
): Promise<MultiVectorEmbedding> {
  try {
    logger.info(`Generating multi-vector embeddings for product: ${product.name}`);

    // Extract text from different fields
    const titleText = product.name || '';
    const descriptionText = stripHtmlTags(
      product.description || product.short_description || ''
    );
    const categoryText = product.categories?.map(cat => cat.name).join(' ') || '';
    const benefitsText = healthBenefits?.join(' ') || extractBenefitsFromDescription(descriptionText);

    // Generate embeddings for each field
    const [titleEmb, descEmb, catEmb, benEmb] = await Promise.all([
      generateEnhancedEmbedding(titleText),
      generateEnhancedEmbedding(descriptionText),
      generateEnhancedEmbedding(categoryText),
      generateEnhancedEmbedding(benefitsText),
    ]);

    // Create weighted combination
    const combinedEmb = combineEmbeddings(
      [titleEmb, descEmb, catEmb, benEmb],
      [DEFAULT_WEIGHTS.title, DEFAULT_WEIGHTS.description, DEFAULT_WEIGHTS.categories, DEFAULT_WEIGHTS.benefits]
    );

    return {
      productId: product.id,
      titleEmbedding: titleEmb,
      descriptionEmbedding: descEmb,
      categoryEmbedding: catEmb,
      benefitsEmbedding: benEmb,
      combinedEmbedding: combinedEmb,
      metadata: {
        productSlug: product.slug,
        timestamp: new Date().toISOString(),
        embeddingVersion: 'mpnet-v2-multi',
      },
    };
  } catch (error) {
    logger.error(`Failed to generate multi-vector embedding for product ${product.id}:`, error as Record<string, unknown>);
    throw error;
  }
}

/**
 * Combine multiple embeddings with weights
 */
export function combineEmbeddings(
  embeddings: number[][],
  weights: number[]
): number[] {
  if (embeddings.length === 0) {
    throw new Error('No embeddings to combine');
  }

  if (embeddings.length !== weights.length) {
    throw new Error('Number of embeddings and weights must match');
  }

  // Normalize weights to sum to 1
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);

  // Initialize combined embedding with zeros
  const dimensions = embeddings[0]?.length || 768;
  const combined = new Array(dimensions).fill(0);

  // Weighted sum of embeddings
  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];
    const weight = normalizedWeights[i];

    if (!embedding || !weight) continue;

    for (let j = 0; j < dimensions; j++) {
      combined[j] += (embedding[j] || 0) * weight;
    }
  }

  // Normalize the combined embedding
  const norm = Math.sqrt(combined.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      combined[i] /= norm;
    }
  }

  return combined;
}

/**
 * Calculate similarity between multi-vector embeddings with field-specific weights
 */
export function calculateMultiVectorSimilarity(
  embedding1: MultiVectorEmbedding,
  embedding2: MultiVectorEmbedding,
  options: MultiVectorSearchOptions = {}
): number {
  let weights = {
    title: DEFAULT_WEIGHTS.title,
    description: DEFAULT_WEIGHTS.description,
    categories: DEFAULT_WEIGHTS.categories,
    benefits: DEFAULT_WEIGHTS.benefits,
    ...(options.weights || {})
  };

  // Use dynamic weights if requested and intent is provided
  if (options.dynamicWeights && options.intent) {
    const dynamicWeights = calculateDynamicWeights('', options.intent);
    if (dynamicWeights) {
      weights = {
        title: dynamicWeights.title ?? weights.title,
        description: dynamicWeights.description ?? weights.description,
        categories: dynamicWeights.categories ?? weights.categories,
        benefits: dynamicWeights.benefits ?? weights.benefits
      };
    }
  }

  // Calculate similarities for each field
  const titleSim = cosineSimilarity(embedding1.titleEmbedding, embedding2.titleEmbedding);
  const descSim = cosineSimilarity(embedding1.descriptionEmbedding, embedding2.descriptionEmbedding);
  const catSim = cosineSimilarity(embedding1.categoryEmbedding, embedding2.categoryEmbedding);
  const benSim = cosineSimilarity(embedding1.benefitsEmbedding, embedding2.benefitsEmbedding);

  // Weighted combination of similarities
  const totalWeight = weights.title + weights.description + weights.categories + weights.benefits;

  return (
    (titleSim * weights.title +
     descSim * weights.description +
     catSim * weights.categories +
     benSim * weights.benefits) / totalWeight
  );
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    const v1 = vec1[i] || 0;
    const v2 = vec2[i] || 0;

    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);

  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Search using multi-vector embeddings
 */
export async function searchWithMultiVectors(
  queryEmbedding: MultiVectorEmbedding,
  candidateEmbeddings: MultiVectorEmbedding[],
  options: MultiVectorSearchOptions = {}
): Promise<Array<{ embedding: MultiVectorEmbedding; score: number }>> {
  const results = candidateEmbeddings.map(candidate => ({
    embedding: candidate,
    score: calculateMultiVectorSimilarity(queryEmbedding, candidate, options),
  }));

  // Sort by score in descending order
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Generate multi-vector embedding for a search query
 */
export async function generateQueryMultiVectorEmbedding(
  query: string,
  context?: {
    category?: string;
    benefits?: string[];
  }
): Promise<Partial<MultiVectorEmbedding>> {
  try {
    // Generate embedding for the main query
    const queryEmbedding = await generateEnhancedEmbedding(query);

    // Generate embeddings for context if provided
    const categoryEmbedding = context?.category
      ? await generateEnhancedEmbedding(context.category)
      : queryEmbedding;

    const benefitsEmbedding = context?.benefits?.length
      ? await generateEnhancedEmbedding(context.benefits.join(' '))
      : queryEmbedding;

    return {
      titleEmbedding: queryEmbedding,
      descriptionEmbedding: queryEmbedding,
      categoryEmbedding,
      benefitsEmbedding,
      combinedEmbedding: queryEmbedding,
    };
  } catch (error) {
    logger.error('Failed to generate query multi-vector embedding:', error as Record<string, unknown>);
    throw error;
  }
}

// Helper functions

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function extractBenefitsFromDescription(description: string): string {
  // Simple extraction of health benefits keywords
  const benefitKeywords = [
    'anti-inflammatory', 'antioxidant', 'immune', 'digestive',
    'heart health', 'brain health', 'energy', 'vitamin',
    'mineral', 'protein', 'fiber', 'omega-3',
  ];

  const foundBenefits = benefitKeywords.filter(keyword =>
    description.toLowerCase().includes(keyword)
  );

  return foundBenefits.join(' ');
}

/**
 * Batch generate multi-vector embeddings for products
 */
export async function batchGenerateMultiVectorEmbeddings(
  products: WCProduct[],
  batchSize: number = 5
): Promise<MultiVectorEmbedding[]> {
  const embeddings: MultiVectorEmbedding[] = [];

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);

    const batchEmbeddings = await Promise.all(
      batch.map(product => generateMultiVectorEmbedding(product))
    );

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}