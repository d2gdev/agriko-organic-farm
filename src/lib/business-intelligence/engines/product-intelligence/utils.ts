// Shared Utility Functions for Product Intelligence

/**
 * Calculate Jaccard similarity between two sets
 */
export function calculateJaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
  const intersection = new Set([...set1].filter(item => set2.has(item)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate median of an array of numbers
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] || 0) + (sorted[mid] || 0)) / 2;
  }
  return sorted[mid] || 0;
}

/**
 * Calculate variance of an array of numbers
 */
export function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
}

/**
 * Calculate coefficient of variation
 */
export function calculateCoefficientOfVariation(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  if (mean === 0) return 0;

  const variance = calculateVariance(numbers);
  return Math.sqrt(variance) / mean;
}

/**
 * Generate a unique analysis ID
 */
export function generateAnalysisId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create delay promise for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe array access with default
 */
export function safeArrayAccess<T>(array: T[], index: number, defaultValue: T): T {
  return array[index] ?? defaultValue;
}

/**
 * Categorize features by type
 */
export function categorizeFeatures(features: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    core: [],
    integration: [],
    analytics: [],
    ui_ux: [],
    security: [],
    performance: [],
    other: []
  };

  features.forEach(feature => {
    const featureLower = feature.toLowerCase();

    if (featureLower.includes('integration') || featureLower.includes('api') || featureLower.includes('sync')) {
      categories.integration?.push(feature);
    } else if (featureLower.includes('analytics') || featureLower.includes('reporting') || featureLower.includes('dashboard')) {
      categories.analytics?.push(feature);
    } else if (featureLower.includes('ui') || featureLower.includes('ux') || featureLower.includes('interface')) {
      categories.ui_ux?.push(feature);
    } else if (featureLower.includes('security') || featureLower.includes('auth') || featureLower.includes('encryption')) {
      categories.security?.push(feature);
    } else if (featureLower.includes('performance') || featureLower.includes('speed') || featureLower.includes('optimization')) {
      categories.performance?.push(feature);
    } else if (featureLower.includes('core') || featureLower.includes('basic') || featureLower.includes('essential')) {
      categories.core?.push(feature);
    } else {
      categories.other?.push(feature);
    }
  });

  return categories;
}

/**
 * Get price tier classification
 */
export function getPriceTier(price: number): string {
  if (price < 50) return 'budget';
  if (price < 200) return 'mid';
  if (price < 500) return 'premium';
  return 'enterprise';
}

/**
 * Determine dominant feature category
 */
export function getDominantFeatureCategory(features: string[]): string {
  const categories = {
    analytics: ['analytics', 'reporting', 'dashboard'],
    integration: ['integration', 'api', 'sync'],
    security: ['security', 'auth', 'encryption'],
    ui: ['ui', 'ux', 'interface']
  };

  let maxCount = 0;
  let dominantCategory = 'general';

  Object.entries(categories).forEach(([category, keywords]) => {
    const count = features.filter(feature =>
      keywords.some(keyword => feature.toLowerCase().includes(keyword))
    ).length;

    if (count > maxCount) {
      maxCount = count;
      dominantCategory = category;
    }
  });

  return dominantCategory;
}

/**
 * Estimate implementation effort for features
 */
export function estimateImplementationEffort(feature: string): 'low' | 'medium' | 'high' {
  const featureLower = feature.toLowerCase();

  // Simple heuristics for effort estimation
  if (featureLower.includes('integration') || featureLower.includes('api') || featureLower.includes('export')) {
    return 'medium';
  }

  if (featureLower.includes('analytics') || featureLower.includes('reporting') || featureLower.includes('dashboard')) {
    return 'high';
  }

  if (featureLower.includes('ai') || featureLower.includes('machine learning') || featureLower.includes('automation')) {
    return 'high';
  }

  return 'low'; // Default to low effort
}

/**
 * Estimate time to market based on implementation effort
 */
export function estimateTimeToMarket(effort: 'low' | 'medium' | 'high'): string {
  switch (effort) {
    case 'low':
      return '1-2 months';
    case 'medium':
      return '3-6 months';
    case 'high':
      return '6-12 months';
    default:
      return '3-6 months';
  }
}

/**
 * Normalize confidence score to a reasonable range
 */
export function normalizeConfidence(scores: number[]): number {
  const validScores = scores.filter(s => s >= 0);
  if (validScores.length === 0) return 0;

  const avgScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  const variance = calculateVariance(validScores);

  // Higher confidence when scores are consistent and reasonable
  return Math.max(0.3, Math.min(0.95, avgScore * (1 - Math.sqrt(variance))));
}