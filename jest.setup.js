// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_WC_API_URL = 'https://test.example.com/wp-json/wc/v3'
process.env.WC_CONSUMER_KEY = 'test_consumer_key'
process.env.WC_CONSUMER_SECRET = 'test_consumer_secret'
process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long_for_testing'
process.env.ADMIN_USERNAME = 'testadmin'
process.env.ADMIN_PASSWORD_HASH = '$2a$12$test_hash_for_testing_purposes'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()