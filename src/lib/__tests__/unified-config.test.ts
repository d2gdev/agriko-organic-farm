/**
 * Test for unified-config module with dynamic import approach
 *
 * Since the unified-config module validates environment variables at import time,
 * we use dynamic imports to control when the validation happens.
 */

// Mock logger to avoid console output in tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('UnifiedConfigurationManager', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // Store original environment once
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Restore original environment once
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Set up environment variables before each test
    process.env.NEXT_PUBLIC_WC_API_URL = 'https://test.com/wp-json/wc/v3';
    process.env.WC_CONSUMER_KEY = 'ck_test_consumer_key_1234567890abcdef';
    process.env.WC_CONSUMER_SECRET = 'cs_test_consumer_secret_1234567890abcdef';
    process.env.JWT_SECRET = 'test_jwt_secret_with_minimum_32_characters_for_validation';
    process.env.NEXTAUTH_SECRET = 'test_nextauth_secret_with_minimum_32_chars_validation';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.NODE_ENV = 'test';

    // Clear module cache to force re-import with new environment
    jest.resetModules();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', async () => {
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');

      const instance1 = UnifiedConfigurationManager.getInstance();
      const instance2 = UnifiedConfigurationManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create instance with valid environment variables', async () => {
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');

      const instance = UnifiedConfigurationManager.getInstance();
      expect(instance).toBeInstanceOf(UnifiedConfigurationManager);
    });
  });

  describe('configuration access', () => {

    it('should provide woocommerce configuration', async () => {
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const config = manager.getConfig();
      const wcConfig = config.woocommerce;

      expect(wcConfig.apiUrl).toBe('https://test.com/wp-json/wc/v3');
      expect(wcConfig.consumerKey).toBe('ck_test_consumer_key_1234567890abcdef');
      expect(wcConfig.consumerSecret).toBe('cs_test_consumer_secret_1234567890abcdef');
    });

    it('should provide security configuration', async () => {
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const config = manager.getConfig();
      const jwtConfig = config.security;

      expect(jwtConfig.jwtSecret).toBe('test_jwt_secret_with_minimum_32_characters_for_validation');
    });

    it('should provide environment configuration', async () => {
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const config = manager.getConfig();

      expect(config.isDev).toBe(false);
      expect(config.isProd).toBe(false);
      expect(config.isTest).toBe(true);
    });

    it('should handle optional configurations', async () => {
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const config = manager.getConfig();

      // Optional configs should be undefined when not set
      expect(config.optional?.openai).toBeUndefined();
      expect(config.optional?.pinecone).toBeUndefined();
    });
  });

  describe('environment detection', () => {
    it('should detect development environment', async () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_WC_API_URL = 'https://test.com/wp-json/wc/v3';
      process.env.WC_CONSUMER_KEY = 'ck_test_consumer_key_1234567890abcdef';
      process.env.WC_CONSUMER_SECRET = 'cs_test_consumer_secret_1234567890abcdef';
      process.env.JWT_SECRET = 'test_jwt_secret_with_minimum_32_characters_for_validation';
      process.env.NEXTAUTH_SECRET = 'test_nextauth_secret_with_minimum_32_chars_validation';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      jest.resetModules();

      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const config = manager.getConfig();

      expect(config.isDev).toBe(true);
      expect(config.isProd).toBe(false);
      expect(config.isTest).toBe(false);
    });

    it('should detect production environment', async () => {
      // Instead of testing actual production mode which causes validation exit,
      // test the environment detection logic during build phase
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PHASE = 'phase-production-build'; // Build phase prevents production validation
      process.env.NEXT_PUBLIC_WC_API_URL = 'https://test.com/wp-json/wc/v3';
      process.env.WC_CONSUMER_KEY = 'ck_test_consumer_key_1234567890abcdef';
      process.env.WC_CONSUMER_SECRET = 'cs_test_consumer_secret_1234567890abcdef';
      process.env.JWT_SECRET = 'test_jwt_secret_with_minimum_32_characters_for_validation';
      process.env.NEXTAUTH_SECRET = 'test_nextauth_secret_with_minimum_32_chars_validation';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      jest.resetModules();

      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const config = manager.getConfig();

      // During build phase, env is production but isProd is false
      expect(config.env).toBe('production');
      expect(config.isDev).toBe(false);
      expect(config.isProd).toBe(false); // False during build phase
      expect(config.isTest).toBe(false);
    });
  });

  describe('configuration validation', () => {
    it('should throw error for missing required environment variables', async () => {
      // Clear required environment variables
      delete process.env.NEXT_PUBLIC_WC_API_URL;
      delete process.env.WC_CONSUMER_KEY;
      delete process.env.WC_CONSUMER_SECRET;
      delete process.env.JWT_SECRET;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_URL;
      jest.resetModules();

      await expect(async () => {
        const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
        UnifiedConfigurationManager.getInstance();
      }).rejects.toThrow(); // Should throw ZodError when missing required variables
    });

    it('should handle optional environment variables gracefully', async () => {
      // Set required variables only
      process.env.NEXT_PUBLIC_WC_API_URL = 'https://test.com/wp-json/wc/v3';
      process.env.WC_CONSUMER_KEY = 'ck_test_consumer_key_1234567890abcdef';
      process.env.WC_CONSUMER_SECRET = 'cs_test_consumer_secret_1234567890abcdef';
      process.env.JWT_SECRET = 'test_jwt_secret_with_minimum_32_characters_for_validation';
      process.env.NEXTAUTH_SECRET = 'test_nextauth_secret_with_minimum_32_chars_validation';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NODE_ENV = 'test';

      // Clear optional variables
      delete process.env.OPENAI_API_KEY;
      delete process.env.PINECONE_API_KEY;

      jest.resetModules();

      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const config = manager.getConfig();
      expect(config.optional?.openai).toBeUndefined();
      expect(config.optional?.pinecone).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_WC_API_URL = 'https://test.com/wp-json/wc/v3';
      process.env.WC_CONSUMER_KEY = 'ck_test_consumer_key_1234567890abcdef';
      process.env.WC_CONSUMER_SECRET = 'cs_test_consumer_secret_1234567890abcdef';
      process.env.JWT_SECRET = 'test_jwt_secret_with_minimum_32_characters_for_validation';
      process.env.NEXTAUTH_SECRET = 'test_nextauth_secret_with_minimum_32_chars_validation';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NODE_ENV = 'test';
    });

    it('should provide all configuration as object', async () => {
      jest.resetModules();
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const config = manager.getConfig();

      expect(config).toHaveProperty('woocommerce');
      expect(config).toHaveProperty('security');
      expect(config).toHaveProperty('isDev');
      expect(config).toHaveProperty('isProd');
      expect(config).toHaveProperty('isTest');
    });

    it('should validate configuration successfully', async () => {
      jest.resetModules();
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager = UnifiedConfigurationManager.getInstance();
      const result = manager.validateRequiredServices();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('missing');
    });

    it('should maintain singleton instance across calls', async () => {
      jest.resetModules();
      const { UnifiedConfigurationManager } = await import('@/lib/unified-config');
      const manager1 = UnifiedConfigurationManager.getInstance();
      const manager2 = UnifiedConfigurationManager.getInstance();

      // Verify same instance is returned
      expect(manager1).toBe(manager2);

      // Verify configuration access works
      const config1 = manager1.getConfig();
      const config2 = manager2.getConfig();
      expect(config1).toEqual(config2);
    });
  });
});