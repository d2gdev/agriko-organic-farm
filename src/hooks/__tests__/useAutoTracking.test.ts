// Auto Tracking Hooks Tests
import { renderHook, act } from '@testing-library/react';
// Mock Money class for tests
class Money {
  constructor(private centavos: number) {}

  static pesos(amount: number): Money {
    return new Money(Math.round(amount * 100));
  }

  toPesos(): number {
    return this.centavos / 100;
  }

  toCentavos(): number {
    return this.centavos;
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/test-path',
    query: {},
    asPath: '/test-path'
  })
}));

// Mock event system
jest.mock('@/lib/event-system', () => ({
  trackProductView: jest.fn(),
  trackSearch: jest.fn(),
  trackPageView: jest.fn(),
  trackOrder: jest.fn(),
  eventBus: {
    emit: jest.fn()
  },
  EventType: {
    PRODUCT_ADDED_TO_CART: 'product.added_to_cart',
    PRODUCT_REMOVED_FROM_CART: 'product.removed_from_cart',
    PRODUCT_PURCHASED: 'product.purchased',
    SEARCH_RESULT_CLICKED: 'search.result_clicked',
    PAGE_EXITED: 'page.exited'
  }
}));

// Mock browser APIs
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'location', {
  value: {
    pathname: '/test-path',
    href: 'https://test.com/test-path',
    search: '?param=value'
  },
  writable: true
});

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124'
  },
  writable: true
});

Object.defineProperty(document, 'title', {
  value: 'Test Page',
  writable: true
});

Object.defineProperty(document, 'referrer', {
  value: 'https://example.com',
  writable: true
});

// Mock event listeners
window.addEventListener = jest.fn();
window.removeEventListener = jest.fn();
document.addEventListener = jest.fn();
document.removeEventListener = jest.fn();

// Mock PerformanceObserver
const MockPerformanceObserver = jest.fn().mockImplementation((_callback) => ({ // callback not used
  observe: jest.fn(),
  disconnect: jest.fn()
})) as any;
MockPerformanceObserver.supportedEntryTypes = ['navigation', 'paint', 'largest-contentful-paint'];
global.PerformanceObserver = MockPerformanceObserver;
import {
  useAutoTracking,
  // usePageTracking, // Currently unused
  useProductTracking,
  useSearchTracking,
  useOrderTracking,
  useEngagementTracking,
  usePerformanceTracking
} from '../useAutoTracking';

describe('Auto Tracking Hooks', () => {
  // Get mock functions
  const mockTrackProductView = require('@/lib/event-system').trackProductView;
  const mockTrackSearch = require('@/lib/event-system').trackSearch;
  const _mockTrackPageView = require('@/lib/event-system').trackPageView; // Currently unused
  const mockTrackOrder = require('@/lib/event-system').trackOrder;
  const mockEventBusEmit = require('@/lib/event-system').eventBus.emit;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset storage mocks
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
  });

  describe('useProductTracking', () => {
    it('should track product view', async () => {
      const { result } = renderHook(() => useProductTracking());

      const productData = {
        id: 123,
        name: 'Test Product',
        price: 25.99,
        category: 'grains',
        quantity: 2
      };

      await act(async () => {
        await result.current.trackProduct('view', productData);
      });

      expect(mockTrackProductView).toHaveBeenCalledWith({
        productId: 123,
        productName: 'Test Product',
        productPrice: 25.99,
        productCategory: 'grains',
        sessionId: expect.any(String),
        userId: undefined,
        metadata: {
          quantity: 2,
          variantId: undefined,
          timestamp: expect.any(Number),
          userAgent: expect.any(String)
        }
      });
    });

    it('should track add to cart', async () => {
      const { result } = renderHook(() => useProductTracking());

      const productData = {
        id: 456,
        name: 'Another Product',
        price: 15.50,
        category: 'spices'
      };

      await act(async () => {
        await result.current.trackProduct('add_to_cart', productData);
      });

      expect(mockEventBusEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'product.added_to_cart',
          productId: 456,
          productName: 'Another Product',
          productPrice: 15.50,
          productCategory: 'spices'
        })
      );
    });

    it('should track remove from cart', async () => {
      const { result } = renderHook(() => useProductTracking());

      const productData = {
        id: 789,
        name: 'Removed Product',
        price: 30.00,
        category: 'oils'
      };

      await act(async () => {
        await result.current.trackProduct('remove_from_cart', productData);
      });

      expect(mockEventBusEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'product.removed_from_cart',
          productId: 789
        })
      );
    });

    it('should track purchase', async () => {
      const { result } = renderHook(() => useProductTracking());

      const productData = {
        id: 101,
        name: 'Purchased Product',
        price: 45.00,
        category: 'tea'
      };

      await act(async () => {
        await result.current.trackProduct('purchase', productData);
      });

      expect(mockEventBusEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'product.purchased',
          productId: 101
        })
      );
    });
  });

  describe('useSearchTracking', () => {
    it('should track search query', async () => {
      const { result } = renderHook(() => useSearchTracking());

      await act(async () => {
        await result.current.trackSearchQuery('organic turmeric', 15, { category: 'spices' });
      });

      expect(mockTrackSearch).toHaveBeenCalledWith({
        query: 'organic turmeric',
        resultsCount: 15,
        sessionId: expect.any(String),
        userId: undefined,
        filters: { category: 'spices' },
        metadata: {
          timestamp: expect.any(Number),
          queryLength: 16,
          hasFilters: true
        }
      });
    });

    it('should track search without filters', async () => {
      const { result } = renderHook(() => useSearchTracking());

      await act(async () => {
        await result.current.trackSearchQuery('rice', 8);
      });

      expect(mockTrackSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'rice',
          resultsCount: 8,
          filters: undefined,
          metadata: expect.objectContaining({
            hasFilters: false
          })
        })
      );
    });

    it('should track search result click', async () => {
      const { result } = renderHook(() => useSearchTracking());

      await act(async () => {
        await result.current.trackSearchClick('turmeric', 123, 2);
      });

      expect(mockEventBusEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'search.result_clicked',
          query: 'turmeric',
          clickedResultId: 123,
          clickedPosition: 2
        })
      );
    });
  });

  describe('useOrderTracking', () => {
    it('should track order creation', async () => {
      const { result } = renderHook(() => useOrderTracking());

      const orderData = {
        orderId: 'order_123',
        orderTotal: 75.50,
        itemCount: 3,
        paymentMethod: 'credit_card',
        shippingMethod: 'standard',
        items: [
          { productId: 1, quantity: 2, price: 25.00 },
          { productId: 2, quantity: 1, price: 25.50 }
        ]
      };

      await act(async () => {
        await result.current.trackOrderCreated(orderData);
      });

      expect(mockTrackOrder).toHaveBeenCalledWith({
        ...orderData,
        sessionId: expect.any(String),
        userId: undefined,
        metadata: {
          timestamp: expect.any(Number),
          userAgent: expect.any(String)
        }
      });
    });
  });

  describe('useEngagementTracking', () => {
    it('should set up activity listeners', () => {
      renderHook(() => useEngagementTracking());

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        expect(document.addEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          true
        );
      });
    });

    it('should set up beforeunload listener', () => {
      renderHook(() => useEngagementTracking());

      expect(window.addEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });

    it('should track custom events', async () => {
      const { result } = renderHook(() => useEngagementTracking());

      await act(async () => {
        await result.current.trackCustomEvent('custom.event' as any, {
          customData: 'test value'
        });
      });

      expect(mockEventBusEmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'custom.event',
          metadata: { customData: 'test value' }
        })
      );
    });
  });

  describe('usePerformanceTracking', () => {
    it('should set up performance observer', () => {
      renderHook(() => usePerformanceTracking());

      expect(global.PerformanceObserver).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle performance observer errors gracefully', () => {
      // Check that the component initializes without throwing even with observer issues
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePerformanceTracking());
      }).not.toThrow();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('useAutoTracking (Master Hook)', () => {
    it('should initialize all tracking hooks', () => {
      const { result } = renderHook(() => useAutoTracking());

      // Should have all the tracking methods
      expect(result.current).toHaveProperty('trackProduct');
      expect(result.current).toHaveProperty('trackSearchQuery');
      expect(result.current).toHaveProperty('trackSearchClick');
      expect(result.current).toHaveProperty('trackOrderCreated');
      expect(result.current).toHaveProperty('trackCustomEvent');
    });

    it('should provide working tracking methods', async () => {
      const { result } = renderHook(() => useAutoTracking());

      // Test that methods work
      await act(async () => {
        await result.current.trackProduct('view', {
          id: 999,
          name: 'Test',
          price: 10,
          category: 'test'
        });
      });

      expect(mockTrackProductView).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should generate session ID if not exists', async () => {
      (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useProductTracking());

      // Call a function that actually uses the session
      await act(async () => {
        await result.current.trackProduct('view', {
          id: 1,
          name: 'Test',
          price: 10,
          category: 'test'
        });
      });

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'agriko_session_id',
        expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
      );
    });

    it('should use existing session ID', async () => {
      const existingSessionId = 'existing_session_123';
      (window.sessionStorage.getItem as jest.Mock).mockReturnValue(existingSessionId);

      const { result } = renderHook(() => useProductTracking());

      await act(async () => {
        await result.current.trackProduct('view', {
          id: 1,
          name: 'Test',
          price: 10,
          category: 'test'
        });
      });

      expect(mockTrackProductView).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: existingSessionId
        })
      );
    });

    it('should retrieve user ID from localStorage', async () => {
      const userId = 'user_456';
      (window.localStorage.getItem as jest.Mock).mockReturnValue(userId);

      const { result } = renderHook(() => useProductTracking());

      await act(async () => {
        await result.current.trackProduct('view', {
          id: 1,
          name: 'Test',
          price: 10,
          category: 'test'
        });
      });

      expect(mockTrackProductView).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId
        })
      );
    });
  });

  describe('Device Detection', () => {
    it('should detect device info in product tracking', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        },
        writable: true
      });

      const { result } = renderHook(() => useProductTracking());

      await act(async () => {
        await result.current.trackProduct('view', {
          id: 1,
          name: 'Test',
          price: 10,
          category: 'test'
        });
      });

      expect(mockTrackProductView).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userAgent: expect.stringContaining('iPhone')
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle sessionStorage errors gracefully', () => {
      (window.sessionStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage not available');
      });

      expect(() => {
        renderHook(() => useProductTracking());
      }).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage not available');
      });

      expect(() => {
        renderHook(() => useProductTracking());
      }).not.toThrow();
    });
  });
});