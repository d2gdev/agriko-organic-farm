// Improved text-based search without vector databases
import { WCProduct } from '@/types/woocommerce';
import { getAllProducts } from '@/lib/woocommerce';
import { Money } from '@/lib/money';

// Agricultural and Filipino food synonyms
const synonymMap: Record<string, string[]> = {
  'rice': ['bigas', 'palay', 'grain', 'cereal'],
  'vegetable': ['gulay', 'veggies', 'produce', 'greens'],
  'fruit': ['prutas', 'produce', 'fresh'],
  'organic': ['natural', 'pesticide-free', 'chemical-free', 'sustainable'],
  'coconut': ['niyog', 'buko', 'copra'],
  'corn': ['mais', 'maize'],
  'tomato': ['kamatis'],
  'onion': ['sibuyas'],
  'garlic': ['bawang'],
  'ginger': ['luya'],
  'pepper': ['sili', 'chili'],
  'sweet': ['matamis', 'dessert'],
  'healthy': ['nutritious', 'wellness', 'beneficial'],
  'farm': ['bukid', 'agricultural', 'harvest'],
  'fresh': ['sariwang', 'new', 'crisp']
};

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) {
    const row = dp[i];
    if (row) row[0] = i;
  }
  for (let j = 0; j <= n; j++) {
    if (dp[0]) dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const currentRow = dp[i];
      const prevRow = dp[i - 1];

      if (!currentRow || !prevRow) continue;

      if (str1[i - 1] === str2[j - 1]) {
        currentRow[j] = prevRow[j - 1] ?? 0;
      } else {
        currentRow[j] = Math.min(
          (prevRow[j] ?? 0) + 1,        // deletion
          (currentRow[j - 1] ?? 0) + 1,  // insertion
          (prevRow[j - 1] ?? 0) + 1      // substitution
        );
      }
    }
  }

  return dp[m]?.[n] ?? 0;
}

// Calculate similarity score (0-1)
function similarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLen);
}

// Expand query with synonyms
function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expanded = new Set<string>(words);

  words.forEach(word => {
    // Add synonyms
    Object.entries(synonymMap).forEach(([key, synonyms]) => {
      if (word === key || synonyms.includes(word)) {
        expanded.add(key);
        synonyms.forEach(syn => expanded.add(syn));
      }
    });
  });

  return Array.from(expanded);
}

// Extract keywords from product for searching
function extractProductKeywords(product: WCProduct): string[] {
  const keywords: string[] = [];

  // Add name words
  keywords.push(...product.name.toLowerCase().split(/\s+/));

  // Add category names
  product.categories?.forEach(cat => {
    keywords.push(...cat.name.toLowerCase().split(/\s+/));
  });

  // Add tags
  product.tags?.forEach(tag => {
    keywords.push(...tag.name.toLowerCase().split(/\s+/));
  });

  // Extract words from short description
  if (product.short_description) {
    const cleanDesc = product.short_description
      .replace(/<[^>]*>/g, ' ')
      .toLowerCase();
    keywords.push(...cleanDesc.split(/\s+/).slice(0, 20));
  }

  // Add attributes
  product.attributes?.forEach(attr => {
    attr.options?.forEach(option => {
      keywords.push(option.toLowerCase());
    });
  });

  return keywords.filter(k => k.length > 2);
}

// Score a product against a query
function scoreProduct(
  product: WCProduct,
  queryTerms: string[],
  productKeywords: string[]
): number {
  let score = 0;
  const boostFactors = {
    nameMatch: 3.0,
    categoryMatch: 2.0,
    tagMatch: 1.5,
    descriptionMatch: 1.0,
    fuzzyMatch: 0.5
  };

  queryTerms.forEach(term => {
    const termLower = term.toLowerCase();

    // Exact match in name (highest weight)
    if (product.name.toLowerCase().includes(termLower)) {
      score += boostFactors.nameMatch;
    }

    // Category match
    product.categories?.forEach(cat => {
      if (cat.name.toLowerCase().includes(termLower)) {
        score += boostFactors.categoryMatch;
      }
    });

    // Tag match
    product.tags?.forEach(tag => {
      if (tag.name.toLowerCase().includes(termLower)) {
        score += boostFactors.tagMatch;
      }
    });

    // Description match
    if (product.short_description?.toLowerCase().includes(termLower)) {
      score += boostFactors.descriptionMatch;
    }

    // Fuzzy matching for typos
    productKeywords.forEach(keyword => {
      const sim = similarity(termLower, keyword);
      if (sim > 0.8 && sim < 1) { // Fuzzy match but not exact
        score += boostFactors.fuzzyMatch * sim;
      }
    });
  });

  // Boost popular/featured products
  const productWithExtras = product as unknown as Record<string, unknown>;
  if (productWithExtras.featured) score *= 1.2;
  if (productWithExtras.total_sales && (productWithExtras.total_sales as number) > 10) {
    score *= (1 + Math.log10(productWithExtras.total_sales as number) / 10);
  }

  // Boost in-stock products
  if (product.stock_status === 'instock') score *= 1.1;

  // Penalize out-of-stock
  if (product.stock_status !== 'instock') score *= 0.5;

  return score;
}

export interface ImprovedSearchOptions {
  limit?: number;
  category?: string;
  inStock?: boolean;
  minPrice?: Money;
  maxPrice?: Money;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name';
}

export interface SearchResult {
  product: WCProduct;
  score: number;
  matchedTerms: string[];
}

export async function improvedSearch(
  query: string,
  options: ImprovedSearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = 20,
    category,
    inStock,
    minPrice,
    maxPrice,
    sortBy = 'relevance'
  } = options;

  // Get all products (with caching in production)
  const allProducts = await getAllProducts();

  // Expand query with synonyms
  const expandedTerms = expandQuery(query);

  // Pre-compute keywords for all products
  const productKeywordsMap = new Map<number, string[]>();
  allProducts.forEach(product => {
    productKeywordsMap.set(product.id, extractProductKeywords(product));
  });

  // Score and filter products
  const results: SearchResult[] = allProducts
    .filter(product => {
      // Apply filters
      if (inStock !== undefined && (product.stock_status === 'instock') !== inStock) return false;
      if (category && !product.categories?.some(c => c.slug === category)) return false;

      if (minPrice && product.price) {
        try {
          const productPrice = product.price;
          if (productPrice.lessThan(minPrice)) return false;
        } catch {
          return false;
        }
      }

      if (maxPrice && product.price) {
        try {
          const productPrice = product.price;
          if (productPrice.greaterThan(maxPrice)) return false;
        } catch {
          return false;
        }
      }

      return true;
    })
    .map(product => {
      const keywords = productKeywordsMap.get(product.id) ?? [];
      const score = scoreProduct(product, expandedTerms, keywords);

      // Find which terms matched
      const matchedTerms = expandedTerms.filter(term => {
        const termLower = term.toLowerCase();
        return product.name.toLowerCase().includes(termLower) ||
               product.short_description?.toLowerCase().includes(termLower) ||
               keywords.some(k => similarity(termLower, k) > 0.8);
      });

      return { product, score, matchedTerms };
    })
    .filter(result => result.score > 0);

  // Sort results
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => {
        try {
          const aPrice = a.product.price || Money.ZERO;
          const bPrice = b.product.price || Money.ZERO;
          return aPrice.lessThan(bPrice) ? -1 : aPrice.greaterThan(bPrice) ? 1 : 0;
        } catch {
          return 0;
        }
      });
      break;
    case 'price_desc':
      results.sort((a, b) => {
        try {
          const aPrice = a.product.price || Money.ZERO;
          const bPrice = b.product.price || Money.ZERO;
          return bPrice.lessThan(aPrice) ? -1 : bPrice.greaterThan(aPrice) ? 1 : 0;
        } catch {
          return 0;
        }
      });
      break;
    case 'name':
      results.sort((a, b) => a.product.name.localeCompare(b.product.name));
      break;
    case 'relevance':
    default:
      results.sort((a, b) => b.score - a.score);
  }

  return results.slice(0, limit);
}

// Health-focused search
export async function searchHealthProducts(
  healthCondition: string,
  limit = 10
): Promise<SearchResult[]> {
  const healthKeywords: Record<string, string[]> = {
    'diabetes': ['low sugar', 'sugar-free', 'diabetic friendly', 'low glycemic'],
    'heart': ['low sodium', 'heart healthy', 'omega-3', 'fiber rich'],
    'weight': ['low calorie', 'weight management', 'diet', 'light'],
    'energy': ['protein', 'vitamin', 'energy boost', 'nutritious'],
    'immune': ['vitamin c', 'antioxidant', 'immune boost', 'zinc'],
    'digestion': ['fiber', 'probiotic', 'digestive', 'gut health']
  };

  const keywords = healthKeywords[healthCondition.toLowerCase()] ?? [healthCondition];
  return improvedSearch(keywords.join(' '), { limit });
}

// Seasonal search (Philippines seasons)
export async function searchSeasonalProducts(limit = 10): Promise<SearchResult[]> {
  const month = new Date().getMonth();

  // Philippines has wet (June-Nov) and dry (Dec-May) seasons
  const isWetSeason = month >= 5 && month <= 10;

  const seasonalQuery = isWetSeason
    ? 'rainy season soup warm comfort'
    : 'summer fresh cooling hydrating';

  return improvedSearch(seasonalQuery, { limit, inStock: true });
}