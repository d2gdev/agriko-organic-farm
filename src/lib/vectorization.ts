import { Core } from '@/types/TYPE_REGISTRY';
import { WCProduct } from '@/types/woocommerce';
import { logger } from '@/lib/logger';

import { getAllProducts, getProductsByIds } from './woocommerce';
import { generateBatchEmbeddings, prepareTextForEmbedding } from './embeddings';
import { safeUpsertVectors } from './qdrant';

export interface ProductVector {
  id: string;
  productId: number;
  title: string;
  description: string;
  categories: string[];
  embedding: number[];
  metadata: {
    source: string;
    productId: number;
    slug: string;
    price: Core.Money;
    categories: string[];
    inStock: boolean;
    featured: boolean;
    timestamp: string;
  };
}

export function extractProductText(product: WCProduct): string {
  const categories = product.categories?.map(cat => cat.name) || [];
  return prepareTextForEmbedding(
    product.name,
    stripHtmlTags(product.description || product.short_description || ''),
    categories
  );
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

export async function vectorizeProducts(products: WCProduct[]): Promise<ProductVector[]> {
  logger.info(`🔄 Processing ${products.length} products for vectorization...`);
  
  const texts = products.map(extractProductText);
  const embeddings = await generateBatchEmbeddings(texts);
  
  const vectors: ProductVector[] = products.map((product, index) => ({
    id: `product_${product.id}`,
    productId: product.id,
    title: product.name,
    description: stripHtmlTags(product.description || product.short_description || ''),
    categories: product.categories?.map(cat => cat.name) || [],
    embedding: embeddings[index] ?? [],
    metadata: {
      source: 'agriko',
      productId: product.id,
      slug: product.slug,
      price: product.price || (0 as Core.Money),
      categories: product.categories?.map(cat => cat.name) || [],
      inStock: product.stock_status === 'instock',
      featured: product.featured || false,
      timestamp: new Date().toISOString(),
    },
  }));
  
  logger.info(`✅ Created ${vectors.length} product vectors`);
  return vectors;
}

export async function syncProductsToQdrant(
  options: {
    batchSize?: number;
    maxProducts?: number;
    featuredOnly?: boolean;
  } = {}
) {
  const { batchSize = 20, maxProducts = 100, featuredOnly = false } = options;
  
  try {
    logger.info('🔄 Fetching products from WooCommerce...');
    const products = await getAllProducts({
      per_page: maxProducts,
      status: 'publish',
      featured: featuredOnly ? true : undefined,
    });
    
    if (products.length === 0) {
      logger.info('⚠️ No products found to vectorize');
      return { success: true, processed: 0 };
    }
    
    logger.info(`📊 Found ${products.length} products to process`);
    
    let totalProcessed = 0;
    
    // Process in batches to avoid memory issues and API limits
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      logger.info(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);
      
      try {
        const vectors = await vectorizeProducts(batch);
        
        // Format vectors for Qdrant
        const qdrantVectors = vectors.map(vector => ({
          id: vector.id,
          values: vector.embedding,
          metadata: vector.metadata,
        }));
        
        const result = await safeUpsertVectors(qdrantVectors);
        
        if (result.success) {
          totalProcessed += batch.length;
          logger.info(`✅ Batch ${Math.floor(i / batchSize) + 1} completed successfully`);
        } else {
          // Properly handle the unknown error type
          // result.error is a string from safeUpsertVectors
          const errorData = {
            message: result.error,
            batchNumber: Math.floor(i / batchSize) + 1,
            batchSize: batch.length,
          };
          
          logger.error('❌ Batch failed:', errorData);
        }
        
        // Small delay between batches to be gentle on resources
        if (i + batchSize < products.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        // Properly handle the unknown error type
        let errorData: Record<string, unknown> | undefined;
        
        if (error instanceof Error) {
          errorData = {
            message: error.message,
            stack: error.stack,
            name: error.name,
          };
        } else if (typeof error === 'object' && error !== null) {
          errorData = error as Record<string, unknown>;
        } else {
          errorData = {
            message: String(error),
          };
        }
        
        logger.error(`❌ Error processing batch ${Math.floor(i / batchSize) + 1}:`, errorData);
      }
    }
    
    logger.info(`\n🎉 Vectorization complete! Processed ${totalProcessed}/${products.length} products`);
    return { success: true, processed: totalProcessed };
    
  } catch (error) {
    // Properly handle the unknown error type
    let errorData: Record<string, unknown> | undefined;
    
    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (typeof error === 'object' && error !== null) {
      errorData = error as Record<string, unknown>;
    } else {
      errorData = {
        message: String(error),
      };
    }
    
    logger.error('❌ Product vectorization failed:', errorData);
    return { success: false, error };
  }
}

export async function vectorizeSingleProduct(productId: number): Promise<boolean> {
  try {
    logger.info(`🔄 Vectorizing single product: ${productId}`);
    
    const products = await getProductsByIds([productId]);
    
    if (products.length === 0) {
      logger.error(`❌ Product ${productId} not found`);
      return false;
    }
    
    const vectors = await vectorizeProducts(products);
    
    // Check if we have vectors before proceeding
    if (vectors.length === 0) {
      logger.error(`❌ Failed to create vector for product ${productId}`);
      return false;
    }
    
    // Get the first vector (we know it exists since we checked the length)
    const firstVector = vectors[0];
    if (!firstVector) {
      logger.error(`❌ Unexpected: No vector available for product ${productId}`);
      return false;
    }
    
    const qdrantVector = {
      id: firstVector.id,
      values: firstVector.embedding,
      metadata: firstVector.metadata,
    };
    
    const result = await safeUpsertVectors([qdrantVector]);
    
    if (result.success) {
      logger.info(`✅ Product ${productId} vectorized successfully`);
      return true;
    } else {
      // Properly handle the unknown error type
      // result.error is a string from safeUpsertVectors
      const errorData = {
        message: result.error,
        productId,
      };
      
      logger.error(`❌ Failed to upsert vector for product ${productId}:`, errorData);
      return false;
    }
    
  } catch (error) {
    // Properly handle the unknown error type
    let errorData: Record<string, unknown> | undefined;
    
    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (typeof error === 'object' && error !== null) {
      errorData = error as Record<string, unknown>;
    } else {
      errorData = {
        message: String(error),
      };
    }
    
    logger.error(`❌ Error vectorizing product ${productId}:`, errorData);
    return false;
  }
}
