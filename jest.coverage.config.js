const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Specialized configuration for coverage testing - unit tests only
const coverageJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
  },

  // Only test lib directory for coverage
  testMatch: [
    '<rootDir>/src/lib/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/lib/__tests__/**/*.test.[jt]s?(x)',
  ],

  // Coverage collection focused on lib directory
  collectCoverageFrom: [
    'src/lib/**/*.{js,jsx,ts,tsx}',
    '!src/lib/**/*.d.ts',
    '!src/lib/**/index.ts',
    '!src/lib/**/*.test.{js,jsx,ts,tsx}',
    '!src/lib/**/__tests__/**',
  ],

  // Optimized settings for coverage
  maxWorkers: 1,
  testTimeout: 30000,
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // Minimal ignores for coverage-focused run
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/components/',
    '<rootDir>/src/app/',
    '<rootDir>/src/hooks/',
    '<rootDir>/src/__tests__/',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
}

module.exports = createJestConfig(coverageJestConfig)