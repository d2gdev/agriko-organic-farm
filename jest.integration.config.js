const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Specialized configuration for integration tests - longer timeouts, no coverage
const integrationJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
  },

  // Only integration tests
  testMatch: [
    'src/components/__tests__/**/*.integration.test.{ts,tsx}',
    'src/__tests__/**/E2E.integration.test.tsx',
    'src/__tests__/**/Integration.*.test.tsx',
  ],

  // Extended timeouts for complex integration tests
  testTimeout: 120000, // 2 minutes
  maxWorkers: 1,
  maxConcurrency: 1,

  // No coverage collection for integration tests
  collectCoverage: false,

  // Stability settings for complex tests
  workerIdleMemoryLimit: '512MB',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Allow more detailed output for debugging integration issues
  verbose: true,
  silent: false,

  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    // Skip the problematic stress tests
    '<rootDir>/src/__tests__/performance-load.test.ts',
    '<rootDir>/src/__tests__/security-penetration.test.ts',
    '<rootDir>/src/__tests__/error-resilience.test.ts',
  ],
}

module.exports = createJestConfig(integrationJestConfig)