import { logger } from './logger';
import { initializeEmbedder, getEmbedderStatus, isEmbedderReady } from './embeddings';

// Import the XenovaEmbedder type
interface XenovaEmbedder {
  (text: string, options?: { pooling?: string; normalize?: boolean }): Promise<{
    data: Float32Array | number[];
    dims?: number[];
  }>;
}

/**
 * Startup embedding initialization
 * This should be called during application startup to preload the embedding model
 */
export class EmbeddingStartup {
  private static instance: EmbeddingStartup;
  private initializationStarted = false;
  private warmupCompleted = false;

  static getInstance(): EmbeddingStartup {
    if (!EmbeddingStartup.instance) {
      EmbeddingStartup.instance = new EmbeddingStartup();
    }
    return EmbeddingStartup.instance;
  }

  /**
   * Initialize embeddings during startup
   * Non-blocking - runs in background
   */
  async initializeAsync(): Promise<void> {
    if (this.initializationStarted) {
      logger.info('Embedding initialization already started');
      return;
    }

    this.initializationStarted = true;
    logger.info('Starting embedding model initialization during startup...');

    // Don't await - let this run in background
    this.performAsyncInitialization().catch(error => {
      logger.error('Background embedding initialization failed:', error as Record<string, unknown>);
    });
  }

  /**
   * Initialize embeddings synchronously (blocks startup)
   * Use this only if embeddings are critical for application startup
   */
  async initializeSync(timeoutMs = 60000): Promise<boolean> {
    if (this.initializationStarted && isEmbedderReady()) {
      return true;
    }

    logger.info('Starting synchronous embedding model initialization...');
    
    try {
      const initPromise = this.performSyncInitialization();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Embedding initialization timeout')), timeoutMs);
      });

      await Promise.race([initPromise, timeoutPromise]);
      return true;
    } catch (error) {
      logger.error('Synchronous embedding initialization failed:', error as Record<string, unknown>);
      return false;
    }
  }

  /**
   * Check if embeddings are ready for use
   */
  isReady(): boolean {
    return isEmbedderReady();
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      initializationStarted: this.initializationStarted,
      warmupCompleted: this.warmupCompleted,
      ...getEmbedderStatus()
    };
  }

  /**
   * Perform async initialization in background
   */
  private async performAsyncInitialization(): Promise<void> {
    try {
      const startTime = Date.now();
      const embedder = await initializeEmbedder();
      const loadTime = Date.now() - startTime;
      
      logger.info(`Embedding model loaded successfully in background (${loadTime}ms)`);
      
      // Warm up with a test embedding if embedder is available
      if (embedder) {
        await this.warmUpModel(embedder);
      } else {
        logger.info('Skipping embedding warmup during static generation');
      }
      
    } catch (error) {
      logger.error('Background embedding initialization failed:', error as Record<string, unknown>);
      throw error;
    }
  }

  /**
   * Perform sync initialization (blocks)
   */
  private async performSyncInitialization(): Promise<void> {
    try {
      const startTime = Date.now();
      const embedder = await initializeEmbedder();
      const loadTime = Date.now() - startTime;
      
      logger.info(`Embedding model loaded synchronously (${loadTime}ms)`);
      
      // Quick warm up if embedder is available
      if (embedder) {
        await this.warmUpModel(embedder, false);
      } else {
        logger.info('Skipping sync embedding warmup during static generation');
      }
      
    } catch (error) {
      logger.error('Synchronous embedding initialization failed:', error as Record<string, unknown>);
      throw error;
    }
  }

  /**
   * Warm up the model with test embeddings
   */
  private async warmUpModel(embedder: XenovaEmbedder, fullWarmup = true): Promise<void> {
    try {
      const warmupTexts = fullWarmup 
        ? [
            "This is a test embedding for model warmup.",
            "Another test text to ensure the model is fully loaded.",
            "Final warmup text with different content."
          ]
        : ["Quick warmup test."];

      logger.info(`Starting model warmup with ${warmupTexts.length} test embeddings...`);
      
      const startTime = Date.now();
      
      for (const text of warmupTexts) {
        await embedder(text, { pooling: 'mean', normalize: true });
      }
      
      const warmupTime = Date.now() - startTime;
      this.warmupCompleted = true;
      
      logger.info(`Model warmup completed (${warmupTime}ms for ${warmupTexts.length} embeddings)`);
      
    } catch (error) {
      logger.error('Model warmup failed:', error as Record<string, unknown>);
      throw error;
    }
  }

  /**
   * Health check for embedding service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'loading' | 'error';
    ready: boolean;
    loading: boolean;
    error: string | null;
    responseTime?: number;
  }> {
    try {
      const status = getEmbedderStatus();
      
      if ('error' in status && status.error) {
        return {
          status: 'error',
          ready: false,
          loading: false,
          error: status.error
        };
      }

      if ('loading' in status && status.loading) {
        return {
          status: 'loading',
          ready: false,
          loading: true,
          error: null
        };
      }

      if ('ready' in status && !status.ready) {
        return {
          status: 'error',
          ready: false,
          loading: false,
          error: 'Model not initialized'
        };
      }

      // Test a quick embedding to verify functionality
      const startTime = Date.now();
      const embedder = await initializeEmbedder();

      if (!embedder) {
        return {
          status: 'error',
          ready: false,
          loading: false,
          error: 'Embedder not available during build phase',
          responseTime: 0
        };
      }

      await embedder("health check", { pooling: 'mean', normalize: true });
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        ready: true,
        loading: false,
        error: null,
        responseTime
      };
      
    } catch (error) {
      logger.error('Embedding health check failed:', error as Record<string, unknown>);
      
      return {
        status: 'error',
        ready: false,
        loading: false,
        error: (error as Error).message
      };
    }
  }
}

// Export singleton instance
export const embeddingStartup = EmbeddingStartup.getInstance();

// Convenience functions
export const initializeEmbeddingsAsync = () => embeddingStartup.initializeAsync();
export const initializeEmbeddingsSync = (timeout?: number) => embeddingStartup.initializeSync(timeout);
export const isEmbeddingsReady = () => embeddingStartup.isReady();
export const getEmbeddingsStatus = () => embeddingStartup.getStatus();
export const embeddingsHealthCheck = () => embeddingStartup.healthCheck();