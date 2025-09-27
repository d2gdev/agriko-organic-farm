// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Suppress console.error and console.warn during tests to reduce noise
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning') ||
       args[0].includes('Error') ||
       args[0].includes('worker'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning') || args[0].includes('worker'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock environment variables
process.env.NEXT_PUBLIC_WC_API_URL = 'https://test.example.com/wp-json/wc/v3'
process.env.WC_CONSUMER_KEY = 'test_consumer_key'
process.env.WC_CONSUMER_SECRET = 'test_consumer_secret'
process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long_for_testing'
process.env.ADMIN_USERNAME = 'testadmin'
process.env.ADMIN_PASSWORD_HASH = '$2a$12$test_hash_for_testing_purposes'
process.env.NODE_ENV = 'test'
process.env.DEEPSEEK_API_KEY = 'test_deepseek_key'
process.env.QDRANT_URL = 'http://localhost:6333'

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

// Mock missing global objects for Node.js compatibility
global.TextEncoder = class TextEncoder {
  encode(input) {
    return new Uint8Array(Buffer.from(input, 'utf8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(input) {
    return Buffer.from(input).toString('utf8');
  }
};

// Mock Web APIs
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = input;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }

  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
  }
};

global.Headers = class Headers extends Map {};

// Mock crypto for Node.js compatibility
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };
}

// Mock localStorage with proper implementation
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
)

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(() => Promise.resolve()),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Transformers.js to prevent worker crashes
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(() => Promise.resolve((_text) => Promise.resolve([[0.1, 0.2, 0.3]]))),
  env: {
    allowRemoteModels: false,
    allowLocalModels: false,
  },
}));

// Mock our AI services to prevent external calls
jest.mock('@/lib/deepseek', () => ({
  analyzeSearchIntent: jest.fn(() => Promise.resolve({
    intent: 'informational',
    confidence: 0.8,
    entities: [],
    categories: [],
    context: {}
  })),
  analyzeUserPreferences: jest.fn(() => Promise.resolve({
    preferences: {},
    categories: [],
    interests: []
  })),
  reRankSearchResults: jest.fn((results) => Promise.resolve(results)),
  analyzeSearchQuality: jest.fn(() => Promise.resolve({
    relevanceScore: 0.8,
    diversityScore: 0.7,
    completenessScore: 0.9
  }))
}));

// Mock Qdrant
jest.mock('@/lib/qdrant', () => ({
  checkQdrantHealth: jest.fn(() => Promise.resolve(true)),
  hybridQdrantSearch: jest.fn(() => Promise.resolve([])),
  vectorizeProducts: jest.fn(() => Promise.resolve()),
}));

// Mock database modules to prevent crashes
jest.mock('@/lib/analytics-db', () => ({
  saveAnalyticsEvent: jest.fn(() => Promise.resolve()),
  getAnalyticsEvents: jest.fn(() => Promise.resolve([])),
  initializeDatabase: jest.fn(() => Promise.resolve()),
}));

jest.mock('pg', () => ({
  Client: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    query: jest.fn(() => Promise.resolve({ rows: [] })),
    end: jest.fn(() => Promise.resolve()),
  })),
  Pool: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    query: jest.fn(() => Promise.resolve({ rows: [] })),
    end: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve()),
    del: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),
  })),
}));

// Prevent setInterval/setTimeout in tests
jest.useFakeTimers();

// Global error handler to prevent test crashes
process.on('uncaughtException', (err) => {
  if (err.message.includes('worker') || err.message.includes('Jest')) {
    // Suppress worker-related errors during tests
    return;
  }
  throw err;
});

process.on('unhandledRejection', (reason) => {
  if (reason && typeof reason === 'object' && 'message' in reason) {
    if (reason.message.includes('worker') || reason.message.includes('Jest')) {
      // Suppress worker-related rejections during tests
      return;
    }
  }
  throw reason;
});