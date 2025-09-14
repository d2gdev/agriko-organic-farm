import neo4j, { Driver, Session, Integer } from 'neo4j-driver';

import { logger } from '@/lib/logger';
import { handleError } from '@/lib/error-sanitizer';

// Neo4j type interfaces
interface Neo4jValue {
  toNumber?(): number;
  toString?(): string;
  toBoolean?(): boolean;
}

interface Neo4jNode {
  labels: string[];
  properties: Record<string, unknown>;
}

interface Neo4jRecord {
  get(key: string): Neo4jValue | Neo4jNode | string | null | undefined;
}

// Helper functions for safe Neo4j record access
function getNodeFromRecord(record: Neo4jRecord, key: string): Neo4jNode {
  const value = record.get(key);
  // Add proper type checking before casting
  if (typeof value === 'object' && value !== null && 'properties' in value && 'labels' in value) {
    return value as Neo4jNode;
  }
  // Return a default Neo4jNode structure if type check fails
  return {
    labels: [],
    properties: {}
  };
}

function getValueFromRecord(record: Neo4jRecord, key: string): Neo4jValue {
  const value = record.get(key);
  // Ensure the value conforms to Neo4jValue interface
  if (typeof value === 'object' && value !== null) {
    return value as Neo4jValue;
  }
  // Return an empty object that conforms to Neo4jValue if type check fails
  return {};
}

function getStringProperty(properties: Record<string, unknown>, key: string, fallback: string = 'Unknown'): string {
  const value = properties[key];
  return typeof value === 'string' ? value : fallback;
}

function getNumberProperty(properties: Record<string, unknown>, key: string, fallback: number = 0): number {
  const value = properties[key];
  return typeof value === 'number' ? value : fallback;
}

function getBooleanProperty(properties: Record<string, unknown>, key: string, fallback: boolean = false): boolean {
  const value = properties[key];
  return typeof value === 'boolean' ? value : fallback;
}

function getNumberFromValue(value: Neo4jValue): number {
  return value.toNumber?.() ?? 0;
}

// Safe helper function to extract product properties from Neo4j results
function safeExtractProductFromRecord(record: Neo4jRecord, key: string): GraphProduct | null {
  try {
    const nodeValue = record.get(key);
    if (!nodeValue || typeof nodeValue !== 'object') {
      return null;
    }
    
    // More precise type checking for Neo4jNode
    if (!('properties' in nodeValue) || !('labels' in nodeValue)) {
      return null;
    }
    
    const node = nodeValue as Neo4jNode;
    const props = node.properties as Record<string, unknown> | undefined;
    
    // Handle case where properties might be undefined
    if (!props) {
      return null;
    }
    
    // Safe property extraction with type checking
    const id = getNumberProperty(props, 'id', 0);
    const name = getStringProperty(props, 'name', 'Unknown');
    const slug = getStringProperty(props, 'slug', '');
    const price = getNumberProperty(props, 'price', 0);
    const description = getStringProperty(props, 'description', '');
    const inStock = getBooleanProperty(props, 'inStock', false);
    const featured = getBooleanProperty(props, 'featured', false);
    
    return {
      id,
      name,
      slug,
      price,
      categories: [],
      description,
      inStock,
      featured,
    };
  } catch (error) {
    const errorData = handleError(error, 'extractProductFromRecord', { record });
    logger.error('Failed to extract product from record:', errorData);
    return null;
  }
}

// Memgraph connection configuration
const MEMGRAPH_URL = process.env.MEMGRAPH_URL ?? 'bolt://localhost:7687';
const MEMGRAPH_USER = process.env.MEMGRAPH_USER ?? '';
const MEMGRAPH_PASSWORD = process.env.MEMGRAPH_PASSWORD ?? '';

let driver: Driver | null = null;
let isShuttingDown = false;
let initializationPromise: Promise<Driver> | null = null;

// Store process handlers for cleanup
let processHandlersSetup = false;
const processHandlers = {
  SIGINT: null as (() => void) | null,
  SIGTERM: null as (() => void) | null,
  beforeExit: null as (() => void) | null,
};

// Connection pool configuration
const POOL_CONFIG = {
  maxConnectionPoolSize: 100,
  connectionAcquisitionTimeout: 60000, // 60 seconds
  maxConnectionLifetime: 60 * 60 * 1000, // 1 hour
  maxTransactionRetryTime: 30000, // 30 seconds
  connectionTimeout: 30000, // 30 seconds
  disableLosslessIntegers: true,
};

// Lazy initialization of Memgraph driver - only connects when needed
export async function getMemgraphDriver(): Promise<Driver> {
  // If already shutting down, reject immediately
  if (isShuttingDown) {
    throw new Error('Database connection is shutting down');
  }

  // Return existing driver if available
  if (driver) {
    return driver;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization and store the promise
  initializationPromise = initializeDriver();
  
  try {
    return await initializationPromise;
  } finally {
    // Clear the initialization promise regardless of success/failure
    initializationPromise = null;
  }
}

// Separate function to handle the actual initialization
async function initializeDriver(): Promise<Driver> {
  try {
    // Double-check shutdown status
    if (isShuttingDown) {
      throw new Error('Database connection is shutting down');
    }

    // Check if Memgraph is configured
    if (!MEMGRAPH_URL || MEMGRAPH_URL === 'bolt://localhost:7687') {
      logger.warn('⚠️ Memgraph not configured, using fallback mode');
      throw new Error('Memgraph not configured - missing MEMGRAPH_URL');
    }

    logger.info('🔌 Initializing Memgraph connection...');
    
    const newDriver = neo4j.driver(
      MEMGRAPH_URL,
      neo4j.auth.basic(MEMGRAPH_USER, MEMGRAPH_PASSWORD),
      POOL_CONFIG
    );

    // Test the connection to ensure it's working
    const session = newDriver.session();
    try {
      await session.run('RETURN 1');
      logger.info('✅ Memgraph connection established successfully');
    } catch (testError) {
      logger.error('❌ Failed to test Memgraph connection:', testError as Record<string, unknown>);
      await newDriver.close();
      throw testError;
    } finally {
      await session.close();
    }

    // Only set the global driver after successful initialization
    driver = newDriver;
    
    // Setup process handlers for graceful shutdown
    setupProcessHandlers();
    
    return driver;
  } catch (error) {
    logger.error('❌ Failed to create Memgraph driver:', error as Record<string, unknown>);
    throw error;
  }
}

// Get a new session with automatic cleanup and graceful fallback
export async function withSession<T>(
  operation: (session: Session) => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  try {
    const driver = await getMemgraphDriver();
    const session = driver.session();
    
    try {
      return await operation(session);
    } finally {
      await session.close();
    }
  } catch (error) {
    logger.warn('⚠️ Memgraph unavailable, falling back:', error as Record<string, unknown>);
    
    if (fallback) {
      return await fallback();
    }
    
    // Re-throw if no fallback provided
    throw error;
  }
}

// Legacy function for backward compatibility - now async
export async function getSession(): Promise<Session> {
  logger.warn('⚠️ getSession() is deprecated. Use withSession() for automatic cleanup.');
  const driver = await getMemgraphDriver();
  return driver.session();
}

// Graceful shutdown with handler cleanup
export async function closeMemgraphConnection(): Promise<void> {
  isShuttingDown = true;
  
  // Clean up process handlers first
  cleanupProcessHandlers();
  
  if (driver) {
    try {
      await driver.close();
      logger.info('✅ Memgraph driver closed successfully');
    } catch (error) {
      logger.error('❌ Error closing Memgraph driver:', error as Record<string, unknown>);
    } finally {
      driver = null;
    }
  }
}

// Clean up process event handlers to prevent memory leaks
function cleanupProcessHandlers(): void {
  if (typeof process !== 'undefined' && processHandlersSetup) {
    if (processHandlers.SIGINT) {
      process.removeListener('SIGINT', processHandlers.SIGINT);
      processHandlers.SIGINT = null;
    }
    if (processHandlers.SIGTERM) {
      process.removeListener('SIGTERM', processHandlers.SIGTERM);
      processHandlers.SIGTERM = null;
    }
    if (processHandlers.beforeExit) {
      process.removeListener('beforeExit', processHandlers.beforeExit);
      processHandlers.beforeExit = null;
    }
    processHandlersSetup = false;
    logger.debug('✅ Process handlers cleaned up');
  }
}

// Setup graceful shutdown handlers (called when driver is first created)
function setupProcessHandlers(): void {
  if (typeof process !== 'undefined' && !processHandlersSetup) {
    processHandlers.SIGINT = closeMemgraphConnection;
    processHandlers.SIGTERM = closeMemgraphConnection;
    processHandlers.beforeExit = closeMemgraphConnection;

    process.on('SIGINT', processHandlers.SIGINT);
    process.on('SIGTERM', processHandlers.SIGTERM);
    process.on('beforeExit', processHandlers.beforeExit);

    processHandlersSetup = true;
    logger.debug('✅ Process handlers setup for graceful shutdown');
  }
}

// Export cleanup function for testing and hot reloads
export function cleanupMemgraphHandlers(): void {
  cleanupProcessHandlers();
}

// Test connection to Memgraph using proper session management
export async function testMemgraphConnection(): Promise<{
  success: boolean;
  message?: string;
  error?: Record<string, unknown>;
}> {
  try {
    return await withSession<{
      success: boolean;
      message?: string;
      error?: Record<string, unknown>;
    }>(
      async (session) => {
        const result = await session.run('RETURN "Connection successful!" as message');
        const record = result.records[0];
        
        const messageValue = (record as Neo4jRecord).get('message');
        return {
          success: true as const,
          message: typeof messageValue === 'string' ? messageValue : 'Connection successful',
        };
      },
      // Fallback when Memgraph is unavailable
      async () => ({
        success: false as const,
        message: 'Memgraph not configured or unavailable - using fallback mode'
      })
    );
  } catch (error) {
    logger.error('❌ Memgraph connection failed:', error as Record<string, unknown>);
    return {
      success: false,
      error: error as Record<string, unknown>,
    };
  }
}

// Create indexes for better performance
export async function createIndexes(): Promise<void> {
  await withSession(
    async (session) => {
      // Product node indexes
      await session.run('CREATE INDEX ON :Product(id)');
      await session.run('CREATE INDEX ON :Product(slug)');
      await session.run('CREATE INDEX ON :Product(name)');
      
      // Category node indexes
      await session.run('CREATE INDEX ON :Category(id)');
      await session.run('CREATE INDEX ON :Category(name)');
      
      // Health benefit indexes
      await session.run('CREATE INDEX ON :HealthBenefit(name)');
      
      logger.info('✅ Memgraph indexes created successfully');
    },
    // Fallback when Memgraph is unavailable
    async () => {
      logger.info('📝 Memgraph not available - skipping index creation');
    }
  ).catch((error) => {
    // Indexes might already exist, which is fine
    logger.info('📝 Index creation completed (some may already exist):', error);
  });
}

// Product-related graph operations
export interface GraphProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  categories: string[];
  description?: string;
  inStock: boolean;
  featured: boolean;
}

export async function addProductToGraph(product: GraphProduct): Promise<boolean> {
  try {
    return await withSession(
      async (session) => {
        // Create product node
        await session.run(`
          MERGE (p:Product {id: $id})
          SET p.name = $name,
              p.slug = $slug,
              p.price = $price,
              p.description = $description,
              p.inStock = $inStock,
              p.featured = $featured,
              p.updatedAt = datetime()
        `, {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          description: product.description ?? '',
          inStock: product.inStock,
          featured: product.featured,
        });

        // Create category relationships
        for (const categoryName of product.categories) {
          await session.run(`
            MATCH (p:Product {id: $productId})
            MERGE (c:Category {name: $categoryName})
            MERGE (p)-[:BELONGS_TO]->(c)
          `, {
            productId: product.id,
            categoryName,
          });
        }

        logger.info(`✅ Added product ${product.name} to graph`);
        return true;
      },
      async () => {
        logger.warn('⚠️ Memgraph unavailable - product not added to graph');
        return false;
      }
    );
  } catch (error) {
    logger.error('❌ Failed to add product to graph:', error as Record<string, unknown>);
    return false;
  }
}

// Find similar products based on categories
export async function findSimilarProducts(productId: number, limit: number = 5): Promise<GraphProduct[]> {
  try {
    return await withSession(
      async (session) => {
        const result = await session.run(`
          MATCH (p:Product {id: $productId})-[:BELONGS_TO]->(c:Category)
          MATCH (similar:Product)-[:BELONGS_TO]->(c)
          WHERE similar.id <> $productId
          WITH similar, COUNT(c) as commonCategories
          ORDER BY commonCategories DESC, similar.featured DESC
          LIMIT $limit
          RETURN similar
        `, {
          productId: productId,
          limit: limit,
        });

        return result.records
          .map(record => safeExtractProductFromRecord(record as Neo4jRecord, 'similar'))
          .filter((product): product is GraphProduct => product !== null);
      },
      async () => {
        logger.warn('⚠️ Memgraph unavailable - no similar products found');
        return [];
      }
    );
  } catch (error) {
    logger.error('❌ Failed to find similar products:', error as Record<string, unknown>);
    return [];
  }
}

// Get products by category with recommendations
export async function getProductsByCategory(categoryName: string, limit: number = 10): Promise<GraphProduct[]> {
  try {
    return await withSession(
      async (session) => {
        const result = await session.run(`
          MATCH (c:Category {name: $categoryName})<-[:BELONGS_TO]-(p:Product)
          RETURN p
          ORDER BY p.featured DESC, p.name ASC
          LIMIT $limit
        `, {
          categoryName,
          limit: limit,
        });

        return result.records
          .map(record => {
            const product = safeExtractProductFromRecord(record as Neo4jRecord, 'p');
            if (product) {
              product.categories = [categoryName];
            }
            return product;
          })
          .filter((product): product is GraphProduct => product !== null);
      },
      async () => {
        logger.warn('⚠️ Memgraph unavailable - no products found for category');
        return [];
      }
    );
  } catch (error) {
    logger.error('❌ Failed to get products by category:', error as Record<string, unknown>);
    return [];
  }
}

// Add health benefits to products
export async function addHealthBenefitToProduct(
  productId: number, 
  benefitName: string, 
  description?: string
): Promise<boolean> {
  try {
    return await withSession(
      async (session) => {
        await session.run(`
          MATCH (p:Product {id: $productId})
          MERGE (h:HealthBenefit {name: $benefitName})
          SET h.description = $description
          MERGE (p)-[:PROVIDES]->(h)
        `, {
          productId: productId,
          benefitName,
          description: description ?? '',
        });

        logger.info(`✅ Added health benefit "${benefitName}" to product ${productId}`);
        return true;
      },
      async () => {
        logger.warn('⚠️ Memgraph unavailable - health benefit not added');
        return false;
      }
    );
  } catch (error) {
    logger.error('❌ Failed to add health benefit:', error as Record<string, unknown>);
    return false;
  }
}

// Get products by health benefit
export async function getProductsByHealthBenefit(benefitName: string, limit: number = 10): Promise<GraphProduct[]> {
  try {
    return await withSession(
      async (session) => {
        const result = await session.run(`
          MATCH (h:HealthBenefit {name: $benefitName})<-[:PROVIDES]-(p:Product)
          RETURN p
          ORDER BY p.featured DESC, p.name ASC
          LIMIT $limit
        `, {
          benefitName,
          limit: limit,
        });

        return result.records
          .map(record => safeExtractProductFromRecord(record as Neo4jRecord, 'p'))
          .filter((product): product is GraphProduct => product !== null);
      },
      async () => {
        logger.warn('⚠️ Memgraph unavailable - no products found for health benefit');
        return [];
      }
    );
  } catch (error) {
    logger.error('❌ Failed to get products by health benefit:', error as Record<string, unknown>);
    return [];
  }
}

// Get graph statistics
export async function getGraphStats(): Promise<{
  productCount: number;
  categoryCount: number;
  healthBenefitCount: number;
  relationshipCount: number;
}> {
  try {
    return await withSession(
      async (session) => {
        const results = await Promise.all([
          session.run('MATCH (p:Product) RETURN COUNT(p) as count'),
          session.run('MATCH (c:Category) RETURN COUNT(c) as count'),
          session.run('MATCH (h:HealthBenefit) RETURN COUNT(h) as count'),
          session.run('MATCH ()-[r]-() RETURN COUNT(r) as count'),
        ]);

        // Add comprehensive null checking for the values returned from get()
        const productCountValue = results[0]?.records[0]?.get('count') as Neo4jValue | undefined;
        const categoryCountValue = results[1]?.records[0]?.get('count') as Neo4jValue | undefined;
        const healthBenefitCountValue = results[2]?.records[0]?.get('count') as Neo4jValue | undefined;
        const relationshipCountValue = results[3]?.records[0]?.get('count') as Neo4jValue | undefined;

        return {
          productCount: productCountValue ? getNumberFromValue(productCountValue as Neo4jValue) : 0,
          categoryCount: categoryCountValue ? getNumberFromValue(categoryCountValue as Neo4jValue) : 0,
          healthBenefitCount: healthBenefitCountValue ? getNumberFromValue(healthBenefitCountValue as Neo4jValue) : 0,
          relationshipCount: relationshipCountValue ? getNumberFromValue(relationshipCountValue as Neo4jValue) : 0,
        };
      },
      async () => {
        logger.warn('⚠️ Memgraph unavailable - returning zero stats');
        return {
          productCount: 0,
          categoryCount: 0,
          healthBenefitCount: 0,
          relationshipCount: 0,
        };
      }
    );
  } catch (error) {
    logger.error('❌ Failed to get graph stats:', error as Record<string, unknown>);
    return {
      productCount: 0,
      categoryCount: 0,
      healthBenefitCount: 0,
      relationshipCount: 0,
    };
  }
}

// Note: closeMemgraphConnection function is already defined above at line 74