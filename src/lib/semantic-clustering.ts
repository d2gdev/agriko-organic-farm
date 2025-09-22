// Semantic Clustering and Faceting for Enhanced Search Experience
import { cosineSimilarity } from './multi-vector-embeddings';
// import { generateEnhancedEmbedding } from './embeddings';
// import { logger } from './logger';
// import type { WCProduct } from '@/types/woocommerce';

export interface SemanticCluster {
  id: string;
  name: string;
  description: string;
  products: Array<{
    id: number;
    name: string;
    similarity: number;
  }>;
  centroid: number[];
  size: number;
  representativeTerms: string[];
}

export interface SemanticFacet {
  name: string;
  type: 'cluster' | 'benefit' | 'usage' | 'audience';
  values: Array<{
    label: string;
    count: number;
    description?: string;
  }>;
  priority: number;
}

export interface ClusteringOptions {
  maxClusters?: number;
  minClusterSize?: number;
  similarityThreshold?: number;
  includeHealthBenefits?: boolean;
  includeUsageContext?: boolean;
}

/**
 * Generate semantic clusters from search results
 */
export async function generateSemanticClusters(
  products: Array<{
    id: number;
    name: string;
    description?: string;
    categories?: Array<{ name: string }>;
    embedding?: number[];
  }>,
  options: ClusteringOptions = {}
): Promise<SemanticCluster[]> {
  const {
    maxClusters = 6,
    minClusterSize = 2,
    similarityThreshold = 0.7
  } = options;

  if (products.length < minClusterSize) {
    return [];
  }

  // Generate embeddings for products without them
  const productsWithEmbeddings = await Promise.all(
    products.map(async (product) => {
      if (product.embedding) {
        return { ...product, embedding: product.embedding };
      }

      const text = [
        product.name,
        product.description?.replace(/<[^>]*>/g, ''),
        product.categories?.map(c => c.name).join(' ')
      ].filter(Boolean).join(' ');

      const embedding = await generateEnhancedEmbedding(text);
      return { ...product, embedding };
    })
  );

  // Perform hierarchical clustering
  const clusters = performHierarchicalClustering(
    productsWithEmbeddings,
    maxClusters,
    minClusterSize,
    similarityThreshold
  );

  // Generate cluster metadata
  const semanticClusters = await Promise.all(
    clusters.map(async (cluster, index) => {
      const validEmbeddings = cluster.map(p => p.embedding).filter(Boolean) as number[][];
      const centroid = calculateCentroid(validEmbeddings);
      const representativeTerms = extractRepresentativeTerms(cluster);
      const clusterName = await generateClusterName(cluster);
      const clusterDescription = await generateClusterDescription(cluster);

      return {
        id: `cluster_${index}`,
        name: clusterName,
        description: clusterDescription,
        products: cluster.map(product => ({
          id: product.id,
          name: product.name,
          similarity: product.embedding ? cosineSimilarity(product.embedding, centroid) : 0
        })),
        centroid,
        size: cluster.length,
        representativeTerms
      };
    })
  );

  return semanticClusters.sort((a, b) => b.size - a.size);
}

/**
 * Perform hierarchical clustering using cosine similarity
 */
function performHierarchicalClustering(
  products: Array<{ id: number; name: string; embedding: number[] }>,
  maxClusters: number,
  minClusterSize: number,
  similarityThreshold: number
): Array<Array<{ id: number; name: string; embedding: number[] }>> {
  const clusters: Array<Array<{ id: number; name: string; embedding: number[] }>> =
    products.map(product => [product]);

  while (clusters.length > maxClusters) {
    let bestMerge = { i: -1, j: -1, similarity: -1 };

    // Find the two closest clusters
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const clusterI = clusters[i];
        const clusterJ = clusters[j];
        if (!clusterI || !clusterJ) continue;
        const similarity = calculateClusterSimilarity(clusterI, clusterJ);
        if (similarity > bestMerge.similarity) {
          bestMerge = { i, j, similarity };
        }
      }
    }

    // If no clusters are similar enough, stop merging
    if (bestMerge.similarity < similarityThreshold) {
      break;
    }

    // Merge the two most similar clusters
    if (bestMerge.i !== -1 && bestMerge.j !== -1) {
      const cluster1 = clusters[bestMerge.i];
      const cluster2 = clusters[bestMerge.j];
      if (!cluster1 || !cluster2) continue;
      const mergedCluster = [...cluster1, ...cluster2];

      clusters.splice(bestMerge.j, 1); // Remove second cluster first (higher index)
      clusters.splice(bestMerge.i, 1); // Remove first cluster
      clusters.push(mergedCluster);
    } else {
      break;
    }
  }

  // Filter out clusters that are too small
  return clusters.filter(cluster => cluster.length >= minClusterSize);
}

/**
 * Calculate similarity between two clusters using average linkage
 */
function calculateClusterSimilarity(
  cluster1: Array<{ embedding: number[] }>,
  cluster2: Array<{ embedding: number[] }>
): number {
  let totalSimilarity = 0;
  let count = 0;

  for (const item1 of cluster1) {
    for (const item2 of cluster2) {
      totalSimilarity += cosineSimilarity(item1.embedding, item2.embedding);
      count++;
    }
  }

  return count > 0 ? totalSimilarity / count : 0;
}

/**
 * Calculate the centroid of a cluster
 */
function calculateCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];

  const dimensions = embeddings[0]?.length || 0;
  const centroid = new Array(dimensions).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += embedding[i] || 0;
    }
  }

  // Average and normalize
  for (let i = 0; i < dimensions; i++) {
    centroid[i] /= embeddings.length;
  }

  const norm = Math.sqrt(centroid.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= norm;
    }
  }

  return centroid;
}

/**
 * Extract representative terms from a cluster
 */
function extractRepresentativeTerms(
  cluster: Array<{ name: string; description?: string }>
): string[] {
  const termFreq: Record<string, number> = {};

  cluster.forEach(product => {
    const text = `${product.name} ${product.description || ''}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];

    words.forEach(word => {
      if (!isStopWord(word)) {
        termFreq[word] = (termFreq[word] || 0) + 1;
      }
    });
  });

  return Object.entries(termFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([term]) => term);
}

/**
 * Check if a word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can',
    'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those',
    'organic', 'natural', 'product', 'food', 'grams', 'pack', 'bottle'
  ]);

  return stopWords.has(word);
}

/**
 * Generate a descriptive name for a cluster
 */
async function generateClusterName(
  cluster: Array<{ name: string; description?: string }>
): Promise<string> {
  // Use simple heuristics for now, could be enhanced with DeepSeek
  const names = cluster.map(p => p.name);
  const commonTerms = extractRepresentativeTerms(cluster);

  // Find common category terms
  const categoryTerms = [
    'honey', 'spice', 'herb', 'tea', 'oil', 'grain', 'seed', 'powder',
    'capsule', 'extract', 'blend', 'supplement', 'fruit', 'vegetable'
  ];

  const foundCategory = categoryTerms.find(term =>
    names.some(name => name.toLowerCase().includes(term))
  );

  if (foundCategory) {
    const modifier = commonTerms.find(term => term !== foundCategory);
    return modifier ? `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${foundCategory}s`
                   : `${foundCategory.charAt(0).toUpperCase() + foundCategory.slice(1)}s`;
  }

  const mainTerm = commonTerms[0];
  return mainTerm ? `${mainTerm.charAt(0).toUpperCase() + mainTerm.slice(1)} Products`
                  : 'Related Products';
}

/**
 * Generate a description for a cluster
 */
async function generateClusterDescription(
  cluster: Array<{ name: string; description?: string }>
): Promise<string> {
  const terms = extractRepresentativeTerms(cluster);
  const size = cluster.length;

  if (terms.length === 0) {
    return `A collection of ${size} related products`;
  }

  const mainTerms = terms.slice(0, 3).join(', ');
  return `${size} products featuring ${mainTerms}`;
}

/**
 * Generate semantic facets from search results
 */
export async function generateSemanticFacets(
  products: Array<{
    id: number;
    name: string;
    description?: string;
    categories?: Array<{ name: string }>;
    healthBenefits?: string[];
  }>,
  clusters?: SemanticCluster[]
): Promise<SemanticFacet[]> {
  const facets: SemanticFacet[] = [];

  // Cluster-based facets
  if (clusters && clusters.length > 1) {
    facets.push({
      name: 'Product Groups',
      type: 'cluster',
      values: clusters.map(cluster => ({
        label: cluster.name,
        count: cluster.size,
        description: cluster.description
      })),
      priority: 1
    });
  }

  // Health benefit facets
  const healthBenefits = extractHealthBenefitFacets(products);
  if (healthBenefits.values.length > 0) {
    facets.push(healthBenefits);
  }

  // Usage context facets
  const usageContext = extractUsageContextFacets(products);
  if (usageContext.values.length > 0) {
    facets.push(usageContext);
  }

  // Target audience facets
  const targetAudience = extractTargetAudienceFacets(products);
  if (targetAudience.values.length > 0) {
    facets.push(targetAudience);
  }

  return facets.sort((a, b) => a.priority - b.priority);
}

/**
 * Extract health benefit facets
 */
function extractHealthBenefitFacets(
  products: Array<{ healthBenefits?: string[]; description?: string; name: string }>
): SemanticFacet {
  const benefitCounts: Record<string, number> = {};

  products.forEach(product => {
    const benefits = product.healthBenefits || extractBenefitsFromText(
      `${product.name} ${product.description || ''}`
    );

    benefits.forEach(benefit => {
      benefitCounts[benefit] = (benefitCounts[benefit] || 0) + 1;
    });
  });

  const values = Object.entries(benefitCounts)
    .filter(([, count]) => count >= 2) // Only show benefits with at least 2 products
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([benefit, count]) => ({
      label: benefit.charAt(0).toUpperCase() + benefit.slice(1),
      count,
      description: `Products supporting ${benefit}`
    }));

  return {
    name: 'Health Benefits',
    type: 'benefit',
    values,
    priority: 2
  };
}

/**
 * Extract usage context facets
 */
function extractUsageContextFacets(
  products: Array<{ name: string; description?: string }>
): SemanticFacet {
  const usagePatterns = [
    { pattern: /\b(cook|cooking|recipe|ingredient|spice|seasoning)\b/i, label: 'Cooking & Recipes' },
    { pattern: /\b(tea|brewing|drink|beverage|infusion)\b/i, label: 'Beverages & Teas' },
    { pattern: /\b(supplement|capsule|tablet|daily|dosage)\b/i, label: 'Supplements' },
    { pattern: /\b(topical|skin|external|massage|oil)\b/i, label: 'Topical Use' },
    { pattern: /\b(powder|blend|mix|smoothie|shake)\b/i, label: 'Powder Blends' }
  ];

  const usageCounts: Record<string, number> = {};

  products.forEach(product => {
    const text = `${product.name} ${product.description || ''}`;
    usagePatterns.forEach(({ pattern, label }) => {
      if (pattern.test(text)) {
        usageCounts[label] = (usageCounts[label] || 0) + 1;
      }
    });
  });

  const values = Object.entries(usageCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([usage, count]) => ({
      label: usage,
      count,
      description: `Products for ${usage.toLowerCase()}`
    }));

  return {
    name: 'Usage Context',
    type: 'usage',
    values,
    priority: 3
  };
}

/**
 * Extract target audience facets
 */
function extractTargetAudienceFacets(
  products: Array<{ name: string; description?: string }>
): SemanticFacet {
  const audiencePatterns = [
    { pattern: /\b(fitness|athlete|workout|exercise|performance)\b/i, label: 'Fitness Enthusiasts' },
    { pattern: /\b(diabetic|diabetes|blood sugar|glucose)\b/i, label: 'Diabetic Support' },
    { pattern: /\b(weight|diet|slim|metabolism)\b/i, label: 'Weight Management' },
    { pattern: /\b(senior|elderly|age|aging)\b/i, label: 'Senior Health' },
    { pattern: /\b(children|kids|child|family)\b/i, label: 'Family & Children' },
    { pattern: /\b(vegan|vegetarian|plant.based)\b/i, label: 'Plant-Based' }
  ];

  const audienceCounts: Record<string, number> = {};

  products.forEach(product => {
    const text = `${product.name} ${product.description || ''}`;
    audiencePatterns.forEach(({ pattern, label }) => {
      if (pattern.test(text)) {
        audienceCounts[label] = (audienceCounts[label] || 0) + 1;
      }
    });
  });

  const values = Object.entries(audienceCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([audience, count]) => ({
      label: audience,
      count,
      description: `Products suitable for ${audience.toLowerCase()}`
    }));

  return {
    name: 'Target Audience',
    type: 'audience',
    values,
    priority: 4
  };
}

/**
 * Extract benefits from product text
 */
function extractBenefitsFromText(text: string): string[] {
  const benefitPatterns = [
    { pattern: /\b(anti.inflammatory|inflammation)\b/i, benefit: 'anti-inflammatory' },
    { pattern: /\b(antioxidant|free.radical)\b/i, benefit: 'antioxidant' },
    { pattern: /\b(immune|immunity|defense)\b/i, benefit: 'immune support' },
    { pattern: /\b(digestive|digestion|gut.health)\b/i, benefit: 'digestive health' },
    { pattern: /\b(heart|cardiovascular|circulation)\b/i, benefit: 'heart health' },
    { pattern: /\b(brain|cognitive|memory|mental)\b/i, benefit: 'brain health' },
    { pattern: /\b(energy|vitality|stamina)\b/i, benefit: 'energy boost' },
    { pattern: /\b(sleep|relaxation|calm)\b/i, benefit: 'relaxation' },
    { pattern: /\b(bone|joint|arthritis)\b/i, benefit: 'bone & joint health' },
    { pattern: /\b(skin|complexion|beauty)\b/i, benefit: 'skin health' }
  ];

  const benefits: string[] = [];
  benefitPatterns.forEach(({ pattern, benefit }) => {
    if (pattern.test(text)) {
      benefits.push(benefit);
    }
  });

  return benefits;
}

/**
 * Find similar products using semantic clustering
 */
export async function findSimilarProducts(
  targetProduct: {
    id: number;
    name: string;
    description?: string;
    embedding?: number[];
  },
  allProducts: Array<{
    id: number;
    name: string;
    description?: string;
    embedding?: number[];
  }>,
  limit: number = 5,
  similarityThreshold: number = 0.5
): Promise<Array<{ product: typeof targetProduct; similarity: number }>> {
  // Generate embedding for target product if not available
  let targetEmbedding = targetProduct.embedding;
  if (!targetEmbedding) {
    const text = `${targetProduct.name} ${targetProduct.description || ''}`;
    targetEmbedding = await generateEnhancedEmbedding(text);
  }

  const similarities: Array<{ product: typeof targetProduct; similarity: number }> = [];

  for (const product of allProducts) {
    if (product.id === targetProduct.id) continue;

    let productEmbedding = product.embedding;
    if (!productEmbedding) {
      const text = `${product.name} ${product.description || ''}`;
      productEmbedding = await generateEnhancedEmbedding(text);
    }

    const similarity = cosineSimilarity(targetEmbedding, productEmbedding);
    if (similarity >= similarityThreshold) {
      similarities.push({ product, similarity });
    }
  }

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}