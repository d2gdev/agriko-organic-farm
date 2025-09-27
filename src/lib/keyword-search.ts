// Keyword Search Engine for Hybrid Search Implementation
import { WCProduct } from '../types/woocommerce';
import { Money } from '@/lib/money';

export interface KeywordSearchOptions {
  fuzzyMatch?: boolean;
  stemming?: boolean;
  minScore?: number;
  boost?: {
    title?: number;
    description?: number;
    categories?: number;
    tags?: number;
  };
  includeMetadata?: boolean;
}

export interface KeywordSearchResult {
  productId: number;
  slug: string;
  title: string;
  price: Money;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  score: number;
  matchedFields: string[];
  matchedTerms: string[];
}

export interface SearchIndex {
  productId: number;
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  searchableText: string;
  tokens: string[];
  metadata: {
    slug: string;
    price: Money;
    inStock: boolean;
    featured: boolean;
  };
}

// Simple stemming function for common English words
function stem(word: string): string {
  const stemRules = [
    // Remove common suffixes
    [/ies$/, 'y'],
    [/ied$/, 'y'],
    [/ying$/, 'y'],
    [/ing$/, ''],
    [/ed$/, ''],
    [/es$/, ''],
    [/s$/, ''],
    [/ly$/, ''],
    [/er$/, ''],
    [/est$/, ''],
  ] as [RegExp, string][];

  const stemmed = word.toLowerCase();
  
  // Don't stem very short words
  if (stemmed.length <= 3) return stemmed;
  
  for (const [pattern, replacement] of stemRules) {
    if (pattern.test(stemmed)) {
      const newWord = stemmed.replace(pattern, replacement);
      // Don't make words too short
      if (newWord.length >= 2) {
        return newWord;
      }
    }
  }
  
  return stemmed;
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Initialize matrix with proper typing and values
  const matrix: number[][] = [];
  
  // Initialize first row
  matrix[0] = Array.from({ length: a.length + 1 }, (_, i) => i);
  
  // Initialize first column
  for (let j = 1; j <= b.length; j++) {
    const row = matrix[j];
    if (row) {
      row[0] = j;
    }
  }

  // Fill in the rest
  for (let j = 1; j <= b.length; j++) {
    const row = matrix[j];
    if (!row) continue;
    
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const deletion = (matrix[j - 1]?.[i] ?? 0) + 1;
      const insertion = (matrix[j]?.[i - 1] ?? 0) + 1;
      const substitution = (matrix[j - 1]?.[i - 1] ?? 0) + cost;
      if (row[i] !== undefined) {
        row[i] = Math.min(deletion, insertion, substitution);
      }
    }
  }

  return matrix[b.length]?.[a.length] ?? 0;
}

// Check if two words are similar (for fuzzy matching)
function isFuzzyMatch(word1: string, word2: string, threshold: number = 0.7): boolean {
  const maxLength = Math.max(word1.length, word2.length);
  const distance = levenshteinDistance(word1, word2);
  const similarity = 1 - (distance / maxLength);
  return similarity >= threshold;
}

// Tokenize and clean text for indexing
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(token => token.length > 1) // Remove single characters
    .filter(token => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(token)); // Remove stop words
}

// Build search index from products
export function buildSearchIndex(products: WCProduct[]): SearchIndex[] {
  return products.map(product => {
    const title = product.name ?? '';
    const description = (product.description ?? product.short_description ?? '').replace(/<[^>]*>/g, '');
    const categories = product.categories ? product.categories.map(cat => cat.name) : [];
    const tags = product.tags ? product.tags.map(tag => tag.name) : [];
    
    const searchableText = [
      title,
      description,
      ...categories,
      ...tags
    ].join(' ');
    
    const tokens = tokenize(searchableText);
    
    return {
      productId: product.id,
      title,
      description,
      categories,
      tags,
      searchableText,
      tokens,
      metadata: {
        slug: product.slug ?? '',
        price: product.price || Money.ZERO,
        inStock: product.stock_status === 'instock',
        featured: product.featured ?? false
      }
    };
  });
}

// Perform keyword search on the index
export function keywordSearch(
  query: string,
  searchIndex: SearchIndex[],
  options: KeywordSearchOptions = {}
): KeywordSearchResult[] {
  const {
    fuzzyMatch = true,
    stemming = true,
    minScore = 0.1,
    boost = {
      title: 3.0,
      description: 1.0,
      categories: 2.0,
      tags: 1.5
    },
    includeMetadata: _includeMetadata = true
  } = options;
  void _includeMetadata; // Preserved for future metadata inclusion feature

  // Tokenize query
  const queryTokens = tokenize(query);
  const processedQuery = stemming ? queryTokens.map(stem) : queryTokens;
  
  const results: KeywordSearchResult[] = [];

  for (const item of searchIndex) {
    let totalScore = 0;
    const matchedFields: string[] = [];
    const matchedTerms: string[] = [];

    // Process item tokens for comparison
    const _itemTokens = stemming ? item.tokens.map(stem) : item.tokens;
    void _itemTokens; // Preserved for future advanced matching

    // Score different fields with different weights
    const fieldScores = {
      title: calculateFieldScore(processedQuery, tokenize(item.title), fuzzyMatch, stemming),
      description: calculateFieldScore(processedQuery, tokenize(item.description), fuzzyMatch, stemming),
      categories: calculateFieldScore(processedQuery, tokenize(item.categories.join(' ')), fuzzyMatch, stemming),
      tags: calculateFieldScore(processedQuery, tokenize(item.tags.join(' ')), fuzzyMatch, stemming)
    };

    // Apply boosts and accumulate scores
    if (fieldScores.title.score > 0) {
      totalScore += fieldScores.title.score * (boost?.title ?? 3.0);
      matchedFields.push('title');
      matchedTerms.push(...fieldScores.title.matches);
    }

    if (fieldScores.description.score > 0) {
      totalScore += fieldScores.description.score * (boost?.description ?? 1.0);
      matchedFields.push('description');
      matchedTerms.push(...fieldScores.description.matches);
    }

    if (fieldScores.categories.score > 0) {
      totalScore += fieldScores.categories.score * (boost?.categories ?? 2.0);
      matchedFields.push('categories');
      matchedTerms.push(...fieldScores.categories.matches);
    }

    if (fieldScores.tags.score > 0) {
      totalScore += fieldScores.tags.score * (boost?.tags ?? 1.5);
      matchedFields.push('tags');
      matchedTerms.push(...fieldScores.tags.matches);
    }

    // Normalize score by query length and apply minimum threshold
    const normalizedScore = totalScore / Math.max(queryTokens.length, 1);
    
    if (normalizedScore >= minScore) {
      results.push({
        productId: item.productId,
        slug: item.metadata.slug || '',
        title: item.title,
        price: item.metadata.price || Money.ZERO,
        categories: item.categories || [],
        inStock: item.metadata.inStock || false,
        featured: item.metadata.featured || false,
        score: normalizedScore,
        matchedFields: Array.from(new Set(matchedFields)),
        matchedTerms: Array.from(new Set(matchedTerms))
      });
    }
  }

  // Sort by score (descending) and return
  return results.sort((a, b) => b.score - a.score);
}

// Calculate score for a specific field
function calculateFieldScore(
  queryTokens: string[],
  fieldTokens: string[],
  fuzzyMatch: boolean,
  stemming: boolean
): { score: number; matches: string[] } {
  let score = 0;
  const matches: string[] = [];
  
  const processedFieldTokens = stemming ? fieldTokens.map(stem) : fieldTokens;

  for (const queryToken of queryTokens) {
    let bestMatch = 0;
    let matchedToken = '';

    for (const fieldToken of processedFieldTokens) {
      // Exact match
      if (queryToken === fieldToken) {
        bestMatch = Math.max(bestMatch, 1.0);
        matchedToken = fieldToken;
      }
      // Partial match (query token contains field token or vice versa)
      else if (queryToken.includes(fieldToken) || fieldToken.includes(queryToken)) {
        const similarity = Math.min(queryToken.length, fieldToken.length) / Math.max(queryToken.length, fieldToken.length);
        if (similarity > bestMatch) {
          bestMatch = similarity * 0.8; // Partial matches get 80% of full score
          matchedToken = fieldToken;
        }
      }
      // Fuzzy match
      else if (fuzzyMatch && isFuzzyMatch(queryToken, fieldToken, 0.75)) {
        const similarity = 1 - (levenshteinDistance(queryToken, fieldToken) / Math.max(queryToken.length, fieldToken.length));
        if (similarity > bestMatch) {
          bestMatch = similarity * 0.6; // Fuzzy matches get 60% of full score
          matchedToken = fieldToken;
        }
      }
    }

    if (bestMatch > 0) {
      score += bestMatch;
      matches.push(matchedToken);
    }
  }

  return { score, matches };
}

// Helper function to get search suggestions
export function getSearchSuggestions(
  partialQuery: string,
  searchIndex: SearchIndex[],
  maxSuggestions: number = 5
): string[] {
  const suggestions = new Set<string>();
  const lowerQuery = partialQuery.toLowerCase();

  for (const item of searchIndex) {
    // Check title words
    const titleWords = tokenize(item.title ?? '');
    for (const word of titleWords) {
      if (word.startsWith(lowerQuery) && word.length > lowerQuery.length) {
        suggestions.add(word);
        if (suggestions.size >= maxSuggestions) return Array.from(suggestions);
      }
    }

    // Check category names
    for (const category of item.categories ?? []) {
      const categoryLower = category.toLowerCase();
      if (categoryLower.startsWith(lowerQuery) && categoryLower.length > lowerQuery.length) {
        suggestions.add(category);
        if (suggestions.size >= maxSuggestions) return Array.from(suggestions);
      }
    }
  }

  return Array.from(suggestions).slice(0, maxSuggestions);
}