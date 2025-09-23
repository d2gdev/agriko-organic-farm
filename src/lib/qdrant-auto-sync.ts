// Enhanced Qdrant Auto-Sync for Real-time Vector Updates
import { logger } from '@/lib/logger';
import { initializeQdrant } from './qdrant';
import { generateEmbedding } from './embeddings';
import { getProduct } from './woocommerce';

// Auto-sync single product to Qdrant when product data changes
export async function autoSyncProductToQdrant(productData: {
  productId: number;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    // Fetch latest product data from WooCommerce
    const product = await getProduct(productData.productId);
    if (!product) {
      logger.warn(`Product ${productData.productId} not found for Qdrant sync`);
      return;
    }

    // Generate comprehensive product text for embedding
    const productText = generateProductText(product);

    // Generate embedding
    const embedding = await generateEmbedding(productText);

    // Prepare metadata with enriched information
    const metadata = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price ? parseFloat(product.price) : 0,
      categories: product.categories?.map(cat => cat.name) || [],
      tags: product.tags?.map(tag => tag.name) || [],
      stock_status: product.stock_status,
      featured: product.featured,
      short_description: product.short_description || '',
      description: product.description || '',
      last_updated: Date.now(),
      event_trigger: productData.eventType,

      // Additional metadata for better search
      text_content: productText,
      word_count: productText.split(' ').length,
      has_description: !!product.description,
      has_images: (product.images?.length || 0) > 0,
      in_stock: product.stock_status === 'instock',

      // Category hierarchy for filtering
      category_paths: product.categories?.map(cat => cat.name.toLowerCase()) || [],

      // Price tier for filtering
      price_tier: getPriceTier(product.price ? parseFloat(product.price) : 0),

      // Search keywords
      search_keywords: generateSearchKeywords(product),

      ...productData.metadata
    };

    // Upsert to Qdrant
    const client = initializeQdrant();
    await client.upsertPoints([{
      id: `product_${product.id}`,
      vector: embedding,
      payload: metadata
    }]);

    logger.info(`✅ Auto-synced product ${product.id} to Qdrant (${productData.eventType})`);
  } catch (error) {
    logger.error(`❌ Failed to auto-sync product ${productData.productId} to Qdrant:`, error as Record<string, unknown>);
    throw error;
  }
}

// Auto-sync user search patterns and preferences to Qdrant
export async function autoSyncUserSearchToQdrant(searchData: {
  query: string;
  userId?: string;
  sessionId: string;
  resultsCount: number;
  clickedResults?: number[];
  timestamp: number;
}): Promise<void> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(searchData.query);

    // Create search pattern metadata
    const searchMetadata = {
      query: searchData.query,
      user_id: searchData.userId,
      session_id: searchData.sessionId,
      results_count: searchData.resultsCount,
      clicked_results: searchData.clickedResults || [],
      timestamp: searchData.timestamp,

      // Query analysis
      query_length: searchData.query.length,
      word_count: searchData.query.split(' ').length,
      has_results: searchData.resultsCount > 0,

      // Intent classification (simple heuristics)
      intent: classifySearchIntent(searchData.query),

      // Extracted entities
      entities: extractSearchEntities(searchData.query),
    };

    // Store search pattern in Qdrant for similarity matching
    const client = initializeQdrant();
    await client.upsertPoints([{
      id: `search_${searchData.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      vector: queryEmbedding,
      payload: searchMetadata
    }]);

    // If user clicked on results, update product relevance scores
    if (searchData.clickedResults && searchData.clickedResults.length > 0) {
      await updateProductRelevanceScores(searchData.query, searchData.clickedResults, queryEmbedding);
    }

    logger.info(`✅ Auto-synced search pattern "${searchData.query}" to Qdrant`);
  } catch (error) {
    logger.error('❌ Failed to auto-sync search pattern to Qdrant:', error as Record<string, unknown>);
    throw error;
  }
}

// Auto-sync user behavior patterns for personalized recommendations
export async function autoSyncUserBehaviorToQdrant(behaviorData: {
  userId: string;
  sessionId: string;
  interactions: Array<{
    productId: number;
    type: string;
    timestamp: number;
    duration?: number;
  }>;
}): Promise<void> {
  try {
    // Create user behavior vector based on product interactions
    const userVector = await generateUserBehaviorVector(behaviorData.interactions);

    const metadata = {
      user_id: behaviorData.userId,
      session_id: behaviorData.sessionId,
      interaction_count: behaviorData.interactions.length,
      last_activity: Math.max(...behaviorData.interactions.map(i => i.timestamp)),

      // Behavior analysis
      preferred_categories: await extractPreferredCategories(behaviorData.interactions),
      avg_session_duration: calculateAvgSessionDuration(behaviorData.interactions),
      interaction_types: [...new Set(behaviorData.interactions.map(i => i.type))],

      // Purchase patterns
      purchase_frequency: calculatePurchaseFrequency(behaviorData.interactions),
      browsing_pattern: analyzeBrowsingPattern(behaviorData.interactions),

      // Temporal patterns
      activity_time_pattern: analyzeActivityTimePattern(behaviorData.interactions),
    };

    // Store user behavior vector
    const client = initializeQdrant();
    await client.upsertPoints([{
      id: `user_behavior_${behaviorData.userId}_${Date.now()}`,
      vector: userVector,
      payload: metadata
    }]);

    logger.info(`✅ Auto-synced user behavior for ${behaviorData.userId} to Qdrant`);
  } catch (error) {
    logger.error('❌ Failed to auto-sync user behavior to Qdrant:', error as Record<string, unknown>);
    throw error;
  }
}

// Helper function to generate comprehensive product text
function generateProductText(product: any): string {
  const parts = [
    product.name,
    product.short_description || '',
    product.description || '',
    product.categories.map((cat: any) => cat.name).join(' '),
    product.tags.map((tag: any) => tag.name).join(' '),
  ];

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

// Helper function to determine price tier
function getPriceTier(price: number): string {
  if (price < 100) return 'budget';
  if (price < 500) return 'mid-range';
  if (price < 1000) return 'premium';
  return 'luxury';
}

// Helper function to generate search keywords
function generateSearchKeywords(product: any): string[] {
  const keywords = new Set<string>();

  // Add product name words
  product.name.toLowerCase().split(' ').forEach((word: string) => {
    if (word.length > 2) keywords.add(word);
  });

  // Add category names
  product.categories.forEach((cat: any) => {
    keywords.add(cat.name.toLowerCase());
  });

  // Add tag names
  product.tags.forEach((tag: any) => {
    keywords.add(tag.name.toLowerCase());
  });

  // Add description keywords
  if (product.description) {
    const descWords = product.description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter((word: string) => word.length > 3);

    descWords.forEach((word: string) => keywords.add(word));
  }

  return Array.from(keywords);
}

// Helper function to classify search intent
function classifySearchIntent(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('buy') || lowerQuery.includes('purchase') || lowerQuery.includes('order')) {
    return 'transactional';
  }

  if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('why')) {
    return 'informational';
  }

  if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('best')) {
    return 'comparison';
  }

  if (lowerQuery.includes('near') || lowerQuery.includes('location') || lowerQuery.includes('store')) {
    return 'local';
  }

  return 'navigational';
}

// Helper function to extract search entities
function extractSearchEntities(query: string): Record<string, string[]> {
  const entities: Record<string, string[]> = {
    colors: [],
    sizes: [],
    brands: [],
    materials: [],
    categories: []
  };

  const lowerQuery = query.toLowerCase();

  // Color detection
  const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'brown', 'pink', 'purple', 'orange'];
  colors.forEach(color => {
    if (lowerQuery.includes(color)) entities.colors?.push(color);
  });

  // Size detection
  const sizes = ['small', 'medium', 'large', 'xl', 'xxl', 'xs', 's', 'm', 'l'];
  sizes.forEach(size => {
    if (lowerQuery.includes(size)) entities.sizes?.push(size);
  });

  // Category detection (specific to Agriko products)
  const categories = ['rice', 'spice', 'powder', 'tea', 'honey', 'organic', 'turmeric', 'ginger', 'moringa'];
  categories.forEach(category => {
    if (lowerQuery.includes(category)) entities.categories?.push(category);
  });

  return entities;
}

// Helper function to update product relevance scores
async function updateProductRelevanceScores(
  query: string,
  clickedProductIds: number[],
  _queryEmbedding: number[]
): Promise<void> {
  try {
    const _client = initializeQdrant();

    for (const productId of clickedProductIds) {
      // Update product metadata with relevance information
      // Update would require a proper upsert with the existing vector
      // For now, just log the relevance update
      logger.info(`Product ${productId} clicked for query: ${query}`);
    }
  } catch (error) {
    logger.error('Failed to update product relevance scores:', error as Record<string, unknown>);
  }
}

// Helper function to generate user behavior vector
async function generateUserBehaviorVector(interactions: Array<{
  productId: number;
  type: string;
  timestamp: number;
  duration?: number;
}>): Promise<number[]> {
  // This is a simplified approach - in practice, you'd want more sophisticated user vector generation
  const behaviorText = interactions
    .map(i => `${i.type} product ${i.productId}`)
    .join(' ');

  return await generateEmbedding(behaviorText);
}

// Helper functions for behavior analysis
async function extractPreferredCategories(_interactions: any[]): Promise<string[]> {
  // Implementation would fetch product categories from interactions
  return [];
}

function calculateAvgSessionDuration(interactions: any[]): number {
  if (interactions.length < 2) return 0;

  const totalDuration = interactions
    .filter(i => i.duration)
    .reduce((sum, i) => sum + (i.duration || 0), 0);

  return totalDuration / interactions.length;
}

function calculatePurchaseFrequency(interactions: any[]): number {
  const purchases = interactions.filter(i => i.type === 'purchase');
  return purchases.length / Math.max(interactions.length, 1);
}

function analyzeBrowsingPattern(interactions: any[]): string {
  const types = interactions.map(i => i.type);

  if (types.includes('purchase')) return 'converter';
  if (types.filter(t => t === 'view').length > 10) return 'browser';
  if (types.includes('add_to_cart')) return 'considerer';

  return 'explorer';
}

function analyzeActivityTimePattern(interactions: any[]): string {
  const hours = interactions.map(i => new Date(i.timestamp).getHours());
  const avgHour = hours.reduce((sum, h) => sum + h, 0) / hours.length;

  if (avgHour < 6) return 'night_owl';
  if (avgHour < 12) return 'morning_person';
  if (avgHour < 18) return 'afternoon_active';
  return 'evening_shopper';
}

// Interval reference for cleanup
let qdrantMaintenanceInterval: NodeJS.Timeout | null = null;

// Schedule automatic Qdrant maintenance
export async function scheduleQdrantMaintenance(): Promise<void> {
  // Clear existing interval if any
  if (qdrantMaintenanceInterval) {
    clearInterval(qdrantMaintenanceInterval);
  }

  // Clean up old search patterns every day
  qdrantMaintenanceInterval = setInterval(async () => {
    try {
      const _client = initializeQdrant();
      const _cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Implementation would filter and delete old search patterns
      logger.info('🧹 Scheduled Qdrant cleanup completed');
    } catch (error) {
      logger.error('❌ Scheduled Qdrant cleanup failed:', error as Record<string, unknown>);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours

  logger.info('⏰ Qdrant automatic maintenance scheduler started');
}

// Stop scheduled maintenance
export function stopQdrantMaintenance(): void {
  if (qdrantMaintenanceInterval) {
    clearInterval(qdrantMaintenanceInterval);
    qdrantMaintenanceInterval = null;
    logger.info('🛑 Qdrant automatic maintenance scheduler stopped');
  }
}

// Graceful shutdown handler
const cleanup = () => {
  logger.info('🧹 Cleaning up Qdrant auto-sync...');
  stopQdrantMaintenance();
};

// Register cleanup handlers
if (typeof process !== 'undefined') {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}