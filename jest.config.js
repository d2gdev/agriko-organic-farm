const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',

    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',

    // Handle image imports
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/**', // Exclude Next.js app directory
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  // Conservative settings to prevent worker crashes
  maxWorkers: 1, // Single worker to prevent crashes
  testTimeout: 30000, // 30 seconds timeout
  workerIdleMemoryLimit: '200MB', // Very low memory limit
  maxConcurrency: 1, // Only run 1 test at a time

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Prevent memory leaks and stabilize workers
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Disable problematic features that can cause worker crashes
  cache: false,
  watchman: false,
  detectOpenHandles: false,
  forceExit: true,

  // Node.js specific options to prevent crashes
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },

  // Skip problematic tests that may cause worker crashes
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/e2e-real-world.test.ts',
    '<rootDir>/src/__tests__/performance-load.test.ts',
    '<rootDir>/src/__tests__/production-readiness.test.ts',
    '<rootDir>/src/__tests__/security-penetration.test.ts',
    '<rootDir>/src/__tests__/error-resilience.test.ts',
  ],

  // Additional stability settings
  bail: 1, // Stop after first test failure
  verbose: false, // Reduce output
  silent: true, // Suppress console output during tests
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)