// Only import Transformers.js on server side to prevent worker spawning
let pipeline: any = null;
let env: any = null;
let transformersInitialized = false;

// Prevent any execution on client side
async function initializeTransformers() {
  if (typeof window !== 'undefined' || transformersInitialized) return;

  try {
    const transformers = await import('@xenova/transformers');
    pipeline = transformers.pipeline;
    env = transformers.env;
    transformersInitialized = true;

    // Disable remote models fallback to ensure local-only operation
    if (env) {
      env.allowRemoteModels = false;
      env.allowLocalModels = true;
    }

    console.log('✅ Transformers.js initialized successfully');
  } catch (error) {
    console.warn('Transformers.js not available:', error);
  }
}

import { logger } from '@/lib/logger';

// Interface for the Xenova embedder
interface XenovaEmbedder {
  (text: string, options?: { pooling?: string; normalize?: boolean }): Promise<{
    data: Float32Array | number[];
    dims?: number[];
  }>;
}

// Embedding model management
class EmbeddingManager {
  private embedder: XenovaEmbedder | null = null;
  private initializationPromise: Promise<XenovaEmbedder> | null = null;
  private isInitializing = false;
  private initializationError: Error | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  constructor() {
    // Only initialize on server-side and when pipeline is available
    if (typeof window === 'undefined' && typeof process !== 'undefined' && pipeline) {
      // Only preload in Node.js environment (server-side)
      this.preloadModel();
    }
  }

  /**
   * Preload the embedding model in the background
   */
  private async preloadModel(): Promise<void> {
    try {
      logger.info('Starting background preload of embedding model...', undefined, 'embeddings');
      // Don't await this - let it run in background
      this.initializeEmbedder().catch(error => {
        logger.error('Background model preload failed, will retry on demand', error as Record<string, unknown>, 'embeddings');
      });
    } catch (error) {
      logger.error('Failed to start background model preload', error as Record<string, unknown>, 'embeddings');
    }
  }

  /**
   * Get the embedder with proper initialization handling
   */
  async getEmbedder(): Promise<XenovaEmbedder> {
    // Prevent execution on client side
    if (typeof window !== 'undefined') {
      throw new Error('Embedding generation is not available on client side');
    }

    // Initialize transformers first
    await initializeTransformers();

    if (!pipeline) {
      throw new Error('Transformers.js pipeline not available');
    }

    // If we already have an initialized embedder, return it
    if (this.embedder) {
      return this.embedder;
    }

    // If initialization failed permanently, throw the error
    if (this.initializationError && this.retryCount >= this.MAX_RETRIES) {
      throw this.initializationError;
    }

    // If we're currently initializing, wait for the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start new initialization
    return this.initializeEmbedder();
  }

  /**
   * Initialize the embedding model with retry logic
   */
  private async initializeEmbedder(): Promise<XenovaEmbedder> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    
    try {
      const embedder = await this.initializationPromise;
      this.embedder = embedder;
      this.initializationError = null;
      this.retryCount = 0;
      return embedder;
    } catch (error) {
      this.initializationPromise = null;
      this.initializationError = error as Error;
      this.retryCount++;
      
      if (this.retryCount < this.MAX_RETRIES) {
        logger.warn(`Embedding model initialization failed, retrying in ${this.RETRY_DELAY}ms (attempt ${this.retryCount}/${this.MAX_RETRIES})`, 
          error as Record<string, unknown>, 'embeddings');
        
        // Retry after delay
        setTimeout(() => {
          this.initializeEmbedder().catch(() => {});
        }, this.RETRY_DELAY);
      } else {
        logger.error('Embedding model initialization failed permanently after all retries', 
          error as Record<string, unknown>, 'embeddings');
      }
      
      throw error;
    }
  }

  /**
   * Perform the actual model initialization
   */
  private async performInitialization(): Promise<XenovaEmbedder> {
    this.isInitializing = true;
    
    try {
      logger.info('Loading enhanced MPNet embedding model...', undefined, 'embeddings');

      // Set a reasonable timeout for model loading
      // Using all-mpnet-base-v2 for better quality embeddings (768 dimensions)
      const modelLoadPromise = pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2') as Promise<XenovaEmbedder>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Model loading timeout after 90 seconds')), 90000);
      });
      
      const embedder = await Promise.race([modelLoadPromise, timeoutPromise]);
      
      logger.info('Local embedding model loaded successfully', undefined, 'embeddings');
      return embedder;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Check if the model is ready
   */
  isReady(): boolean {
    return this.embedder !== null;
  }

  /**
   * Check if the model is currently initializing
   */
  isLoading(): boolean {
    return this.isInitializing;
  }

  /**
   * Get initialization status
   */
  getStatus(): {
    ready: boolean;
    loading: boolean;
    error: string | null;
    retryCount: number;
  } {
    return {
      ready: this.isReady(),
      loading: this.isLoading(),
      error: this.initializationError?.message ?? null,
      retryCount: this.retryCount
    };
  }

  /**
   * Force reinitialize the model (useful for error recovery)
   */
  async reinitialize(): Promise<XenovaEmbedder> {
    this.embedder = null;
    this.initializationPromise = null;
    this.initializationError = null;
    this.retryCount = 0;
    
    return this.initializeEmbedder();
  }
}

// Create singleton instance only on server side
const embeddingManager = typeof window === 'undefined' ? new EmbeddingManager() : null;

// Export the main function that applications should use
export async function initializeEmbedder() {
  if (typeof window !== 'undefined') {
    throw new Error('Embedding initialization is not available on client side');
  }

  if (!embeddingManager) {
    throw new Error('Embedding manager not available');
  }

  return embeddingManager.getEmbedder();
}

// Export additional utility functions
export function isEmbedderReady(): boolean {
  if (typeof window !== 'undefined' || !embeddingManager) {
    return false;
  }
  return embeddingManager.isReady();
}

export function isEmbedderLoading(): boolean {
  if (typeof window !== 'undefined' || !embeddingManager) {
    return false;
  }
  return embeddingManager.isLoading();
}

export function getEmbedderStatus() {
  if (typeof window !== 'undefined' || !embeddingManager) {
    return { status: 'unavailable', reason: 'Client side or manager not available' };
  }
  return embeddingManager.getStatus();
}

export async function reinitializeEmbedder(): Promise<XenovaEmbedder> {
  if (typeof window !== 'undefined') {
    throw new Error('Embedding reinitialization is not available on client side');
  }

  if (!embeddingManager) {
    throw new Error('Embedding manager not available');
  }

  return embeddingManager.reinitialize();
}



export async function generateEmbedding(text: string, dimensions: number = 768): Promise<number[]> {
  if (typeof window !== 'undefined') {
    throw new Error('Embedding generation is not available on client side');
  }

  // Initialize transformers first
  await initializeTransformers();

  if (!embeddingManager) {
    throw new Error('Embedding manager not available');
  }

  try {
    if (!embeddingManager.isReady()) {
      await initializeEmbedder();
    }

    // Get the embedder from the manager
    const embedder = await embeddingManager.getEmbedder();
    if (!embedder) {
      throw new Error('Embedder not initialized');
    }
    
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    
    // Convert tensor to array and get the first embedding
    if (!output?.data) {
      throw new Error('Invalid embedder output: missing data');
    }
    
    const outputData = output.data;
    const embedding: number[] = [];
    
    // Convert the typed array to a regular array of numbers
    for (let i = 0; i < outputData.length; i++) {
      embedding.push(Number(outputData[i]));
    }
    
    // MPNet produces 768 dimensions natively
    const targetDimensions = dimensions || 768;
    if (embedding.length < targetDimensions) {
      // Pad with zeros
      const padding = new Array(targetDimensions - embedding.length).fill(0);
      embedding.push(...padding);
    } else if (embedding.length > targetDimensions) {
      // Truncate to target dimensions
      embedding.splice(targetDimensions);
    }

    return embedding;

  } catch (error) {
    logger.error('❌ Failed to generate embedding:', error as Record<string, unknown>);
    throw error;
  }
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  logger.info(`🔄 Generating ${texts.length} embeddings...`);
  
  for (let i = 0; i < texts.length; i++) {
    const embedding = await generateEmbedding(texts[i] ?? '');
    embeddings.push(embedding);
    
    if ((i + 1) % 10 === 0) {
      logger.info(`✅ Generated ${i + 1}/${texts.length} embeddings`);
    }
  }
  
  logger.info('🎉 Batch embedding generation complete');
  return embeddings;
}

// Health-related keywords dictionary for enhanced embedding
const healthKeywords = {
  nutrients: [
    'vitamin', 'mineral', 'protein', 'fiber', 'calcium', 'iron', 'potassium',
    'magnesium', 'zinc', 'antioxidants', 'omega-3', 'vitamin c', 'vitamin d',
    'folate', 'beta-carotene', 'flavonoids', 'polyphenols'
  ],
  benefits: [
    'anti-inflammatory', 'antioxidant', 'immune support', 'heart health',
    'digestive health', 'brain health', 'bone health', 'skin health',
    'weight management', 'energy boost', 'blood sugar', 'cholesterol',
    'detox', 'metabolism', 'cognitive', 'memory', 'circulation'
  ],
  conditions: [
    'diabetes', 'hypertension', 'arthritis', 'cardiovascular', 'digestive issues',
    'inflammation', 'oxidative stress', 'metabolic syndrome', 'insulin resistance'
  ],
  properties: [
    'organic', 'natural', 'raw', 'pure', 'whole grain', 'gluten-free',
    'non-gmo', 'pesticide-free', 'sustainable', 'traditional', 'medicinal'
  ]
};

// Extract health-related keywords from text
export function extractHealthKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];
  
  // Check all keyword categories
  Object.values(healthKeywords).forEach(keywordList => {
    keywordList.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    });
  });
  
  // Remove duplicates and return
  return Array.from(new Set(foundKeywords));

}

// Enhanced text preparation with health keywords and nutritional information
export function prepareTextForEmbedding(
  title: string, 
  description: string, 
  categories?: string[],
  attributes?: Array<{name: string, options: string[]}>,
  tags?: Array<{name: string}>,
  healthBenefits?: string[]
): string {
  const parts = [];
  
  // Start with enriched title context
  const enrichedTitle = enrichProductTitle(title, categories);
  parts.push(enrichedTitle);
  
  if (description) {
    const enrichedDescription = enrichProductDescription(description);
    parts.push(enrichedDescription);
  }
  
  if (categories && categories.length > 0) {
    // Add category context with domain mapping
    const categoryContext = mapCategoriesWithContext(categories);
    parts.push(`Product Category: ${categoryContext}`);
  }
  
  // Add product attributes with enhanced context
  if (attributes && attributes.length > 0) {
    const attributeContext = enhanceAttributes(attributes);
    parts.push(`Product Properties: ${attributeContext}`);
  }
  
  // Add tags with contextual expansion
  if (tags && tags.length > 0) {
    const tagContext = expandTagsWithContext(tags);
    parts.push(`Product Tags: ${tagContext}`);
  }
  
  // Add extracted or provided health benefits with expansion
  if (healthBenefits && healthBenefits.length > 0) {
    const expandedBenefits = expandHealthBenefits(healthBenefits);
    parts.push(`Health Benefits: ${expandedBenefits}`);
  }
  
  // Extract and expand health keywords from existing text
  const combinedText = parts.join(' ');
  const keywords = extractHealthKeywords(combinedText);
  if (keywords.length > 0) {
    const expandedKeywords = expandHealthKeywords(keywords);
    parts.push(`Health Properties: ${expandedKeywords}`);
  }
  
  // Add semantic domain context
  const domainContext = inferDomainContext(combinedText);
  if (domainContext.length > 0) {
    parts.push(`Domain Context: ${domainContext.join(', ')}`);
  }
  
  return parts.join(' | ');
}

// Enrich product title with category context
function enrichProductTitle(title: string, categories?: string[]): string {
  let enriched = title;
  
  // Add organic context if not present
  if (categories?.some(cat => cat.toLowerCase().includes('organic')) && 
      !title.toLowerCase().includes('organic')) {
    enriched = `Organic ${enriched}`;
  }
  
  // Add food/supplement context based on categories
  if (categories?.some(cat => 
    ['spices', 'herbs', 'food', 'ingredients', 'supplements'].some(type => 
      cat.toLowerCase().includes(type)))) {
    if (!title.toLowerCase().match(/\b(food|spice|herb|supplement|ingredient)\b/)) {
      enriched = `${enriched} (natural food ingredient)`;
    }
  }
  
  return enriched;
}

// Enhance product description with health/agricultural context
function enrichProductDescription(description: string): string {
  let enhanced = description;
  
  // Add context cues for better semantic understanding
  const healthPatterns = [
    { pattern: /\b(contains|rich in|source of)\b/gi, context: 'nutritional source' },
    { pattern: /\b(helps|supports|promotes|aids)\b/gi, context: 'health benefit' },
    { pattern: /\b(traditional|ancient|centuries)\b/gi, context: 'traditional medicine' },
    { pattern: /\b(fresh|natural|pure|raw)\b/gi, context: 'natural product' }
  ];
  
  for (const {pattern, context} of healthPatterns) {
    if (pattern.test(enhanced) && !enhanced.includes(context)) {
      enhanced = `${enhanced} [${context}]`;
    }
  }
  
  return enhanced;
}

// Map categories with domain-specific context
function mapCategoriesWithContext(categories: string[]): string {
  const categoryMap: Record<string, string[]> = {
    'spices': ['culinary spice', 'cooking ingredient', 'flavor enhancer', 'seasoning'],
    'herbs': ['medicinal herb', 'healing plant', 'herbal remedy', 'natural medicine'],
    'organic': ['certified organic', 'pesticide-free', 'natural farming', 'sustainable agriculture'],
    'supplements': ['dietary supplement', 'nutritional support', 'health supplement', 'wellness product'],
    'tea': ['herbal tea', 'medicinal tea', 'wellness beverage', 'therapeutic drink'],
    'honey': ['natural sweetener', 'bee product', 'raw honey', 'medicinal honey'],
    'oil': ['essential oil', 'natural oil', 'therapeutic oil', 'aromatic oil']
  };
  
  const expandedCategories = categories.flatMap(category => {
    const lowerCat = category.toLowerCase();
    for (const [key, expansions] of Object.entries(categoryMap)) {
      if (lowerCat.includes(key)) {
        return [category, ...expansions];
      }
    }
    return [category];
  });
  
  // Use Array.from instead of spread operator for better compatibility
  return Array.from(new Set(expandedCategories)).join(', ');

}

// Enhance attributes with contextual meaning
function enhanceAttributes(attributes: Array<{name: string, options: string[]}>): string {
  const attributeContext: Record<string, string> = {
    'weight': 'package size',
    'origin': 'geographical source',
    'grade': 'quality level',
    'processing': 'preparation method',
    'certification': 'quality assurance',
    'purity': 'concentration level'
  };
  
  return attributes
    .map(attr => {
      const context = attributeContext[attr.name.toLowerCase()] ?? attr.name;
      return `${context}: ${attr.options.join(', ')}`;
    })
    .join('; ');
}

// Expand tags with related concepts
function expandTagsWithContext(tags: Array<{name: string}>): string {
  const tagExpansions: Record<string, string[]> = {
    'antioxidant': ['free radical scavenger', 'oxidative stress protection', 'cellular protection'],
    'anti-inflammatory': ['inflammation reducer', 'pain relief', 'swelling reduction'],
    'digestive': ['stomach health', 'gut wellness', 'digestion support'],
    'immune': ['immunity booster', 'defense system', 'resistance building'],
    'energy': ['vitality enhancer', 'stamina support', 'fatigue fighter'],
    'detox': ['cleansing agent', 'toxin removal', 'purification support']
  };
  
  const expandedTags = tags.flatMap(tag => {
    const lowerTag = tag.name.toLowerCase();
    const expansions = tagExpansions[lowerTag] ?? [];
    return [tag.name, ...expansions];
  });
  
  // Use Array.from instead of spread operator for better compatibility
  return Array.from(new Set(expandedTags)).join(', ');

}

// Expand health benefits with related terms
function expandHealthBenefits(benefits: string[]): string {
  const benefitExpansions: Record<string, string[]> = {
    'heart health': ['cardiovascular support', 'circulation improvement', 'blood pressure regulation'],
    'brain health': ['cognitive function', 'memory enhancement', 'mental clarity'],
    'bone health': ['skeletal strength', 'calcium absorption', 'joint support'],
    'skin health': ['dermal wellness', 'complexion improvement', 'skin vitality'],
    'weight management': ['metabolism support', 'appetite control', 'fat burning'],
    'blood sugar': ['glucose regulation', 'diabetes support', 'insulin sensitivity']
  };
  
  const expandedBenefits = benefits.flatMap(benefit => {
    const lowerBenefit = benefit.toLowerCase();
    for (const [key, expansions] of Object.entries(benefitExpansions)) {
      if (lowerBenefit.includes(key)) {
        return [benefit, ...expansions];
      }
    }
    return [benefit];
  });
  
  // Use Array.from instead of spread operator for better compatibility
  return Array.from(new Set(expandedBenefits)).join(', ');

}

// Expand health keywords with synonyms
function expandHealthKeywords(keywords: string[]): string {
  const keywordSynonyms: Record<string, string[]> = {
    'vitamin': ['nutrient', 'essential vitamin', 'micronutrient'],
    'mineral': ['trace element', 'essential mineral', 'micronutrient'],
    'protein': ['amino acids', 'muscle building', 'tissue repair'],
    'fiber': ['dietary fiber', 'digestive health', 'gut health'],
    'antioxidants': ['free radical fighters', 'cellular protection', 'aging prevention'],
    'omega-3': ['essential fatty acids', 'brain food', 'heart healthy fats']
  };
  
  const expandedKeywords = keywords.flatMap(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    const synonyms = keywordSynonyms[lowerKeyword] ?? [];
    return [keyword, ...synonyms];
  });
  
  // Use Array.from instead of spread operator for better compatibility
  return Array.from(new Set(expandedKeywords)).join(', ');

}

// Infer domain context from the product text
function inferDomainContext(text: string): string[] {
  const lowerText = text.toLowerCase();
  const domains: string[] = [];
  
  // Agricultural/food domain
  if (lowerText.match(/\b(organic|natural|fresh|raw|farm|harvest|ingredient|spice|herb)\b/)) {
    domains.push('agricultural food product');
  }
  
  // Health/wellness domain
  if (lowerText.match(/\b(health|wellness|medicinal|therapeutic|healing|remedy|supplement)\b/)) {
    domains.push('health and wellness product');
  }
  
  // Traditional medicine domain
  if (lowerText.match(/\b(traditional|ancient|ayurvedic|herbal|folk|remedy|medicine)\b/)) {
    domains.push('traditional medicine');
  }
  
  // Nutritional domain
  if (lowerText.match(/\b(vitamin|mineral|nutrient|nutrition|dietary|supplement)\b/)) {
    domains.push('nutritional product');
  }
  
  // Culinary domain
  if (lowerText.match(/\b(cooking|culinary|kitchen|recipe|flavor|seasoning|taste)\b/)) {
    domains.push('culinary ingredient');
  }
  
  return domains;
}

// Enhanced embedding generation with text preprocessing
export async function generateEnhancedEmbedding(text: string, dimensions: number = 768): Promise<number[]> {
  try {
    if (!embeddingManager?.isReady()) {
      await initializeEmbedder();
    }

    // Text preprocessing for better embedding quality
    const processedText = preprocessText(text);

    // Get the embedder from the manager
    const embedder = await embeddingManager?.getEmbedder();
    if (!embedder) {
      throw new Error('Embedder not initialized');
    }
    
    const output = await embedder(processedText, { pooling: 'mean', normalize: true });
    
    // Convert tensor to array and get the first embedding
    if (!output?.data) {
      throw new Error('Invalid embedder output: missing data');
    }
    
    const outputData = output.data;
    const embedding: number[] = [];
    
    // Convert the typed array to a regular array of numbers
    for (let i = 0; i < outputData.length; i++) {
      embedding.push(Number(outputData[i]));
    }
    
    // MPNet produces 768 dimensions natively
    const targetDimensions = dimensions || 768;
    if (embedding.length < targetDimensions) {
      // Pad with zeros
      const padding = new Array(targetDimensions - embedding.length).fill(0);
      embedding.push(...padding);
    } else if (embedding.length > targetDimensions) {
      // Truncate to target dimensions
      embedding.splice(targetDimensions);
    }

    return embedding;
  } catch (error) {
    logger.error('❌ Failed to generate enhanced embedding:', error as Record<string, unknown>);
    throw error;
  }
}

// Text preprocessing function
function preprocessText(text: string): string {
  // Remove excessive whitespace and normalize
  let processed = text.replace(/\s+/g, ' ').trim();
  
  // Convert to lowercase for consistency (embedding model handles this well)
  processed = processed.toLowerCase();
  
  // Remove common stop words that don't add semantic value for product search
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall'];
  
  // Only remove stop words if the text is long enough to preserve meaning
  if (processed.split(' ').length > 10) {
    const words = processed.split(' ');
    const filteredWords = words.filter(word => !stopWords.includes(word) || word.length < 3);
    processed = filteredWords.join(' ');
  }
  
  return processed;
}

// Semantic chunking for long descriptions
export function semanticChunking(text: string, maxChunkSize: number = 500): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk.length > 0 ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk + '.');
  }
  
  return chunks;
}
