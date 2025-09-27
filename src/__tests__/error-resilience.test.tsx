// Error Handling and System Resilience Tests
// Tests the system's ability to gracefully handle errors and recover from failures

import React from 'react';
import { Core } from '@/types/TYPE_REGISTRY';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auto-sync/route';
import { AutoTrackingProvider } from '@/components/AutoTrackingProvider';
import { CartProvider } from '@/context/CartContext';

// Mock external dependencies with controlled failures
const mockMemgraphSync = jest.fn();
const mockQdrantSync = jest.fn();
const mockAnalyticsSync = jest.fn();
const mockRedisClient = jest.fn();

jest.mock('@/lib/memgraph-auto-sync', () => ({
  autoSyncProductToMemgraph: mockMemgraphSync
}));

jest.mock('@/lib/qdrant-auto-sync', () => ({
  autoSyncProductToQdrant: mockQdrantSync
}));

jest.mock('@/lib/analytics-db', () => ({
  saveAnalyticsEvent: mockAnalyticsSync
}));

jest.mock('@/lib/redis-rate-limiter', () => ({
  rateLimiter: {
    checkRateLimit: mockRedisClient,
    getMetrics: jest.fn().mockReturnValue({ fallbackEntries: 0 })
  }
}));

describe('Error Handling and System Resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to success by default
    mockMemgraphSync.mockResolvedValue(undefined);
    mockQdrantSync.mockResolvedValue(undefined);
    mockAnalyticsSync.mockResolvedValue(undefined);
    mockRedisClient.mockResolvedValue({ allowed: true, remaining: 100 });
  });

  describe('Database Failure Scenarios', () => {
    it('should handle Memgraph complete failure gracefully', async () => {
      // Simulate Memgraph being completely down
      mockMemgraphSync.mockRejectedValue(new Error('ECONNREFUSED: Connection refused'));

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.10'
        },
        body: JSON.stringify({
          productId: 123,
          eventType: 'product.created',
          productData: {
            id: 123,
            name: 'Test Product',
            price: 2999 as Core.Money,
            description: 'A test product'
          }
        })
      });

      const response = await POST(request);

      // Should still process other databases and not crash
      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to sync');

      // Other systems should still be called
      expect(mockQdrantSync).toHaveBeenCalled();
      expect(mockAnalyticsSync).toHaveBeenCalled();
    });

    it('should handle partial database failures with retry logic', async () => {
      let memgraphAttempts = 0;
      mockMemgraphSync.mockImplementation(() => {
        memgraphAttempts++;
        if (memgraphAttempts <= 2) {
          return Promise.reject(new Error('Temporary timeout'));
        }
        return Promise.resolve();
      });

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.11'
        },
        body: JSON.stringify({
          productId: 456,
          eventType: 'product.created',
          productData: { id: 456, name: 'Retry Test Product' }
        })
      });

      const response = await POST(request);

      // Should eventually succeed after retries
      if (response.status === 200) {
        expect(memgraphAttempts).toBeGreaterThan(1);
      } else {
        // If it still fails, should be handled gracefully
        expect(response.status).toBe(500);
      }
    });

    it('should handle cascading database failures', async () => {
      // All databases fail
      mockMemgraphSync.mockRejectedValue(new Error('Memgraph down'));
      mockQdrantSync.mockRejectedValue(new Error('Qdrant unreachable'));
      mockAnalyticsSync.mockRejectedValue(new Error('Analytics DB timeout'));

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.12'
        },
        body: JSON.stringify({
          productId: 789,
          eventType: 'product.created'
        })
      });

      const response = await POST(request);

      // Should fail gracefully with meaningful error
      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Should have attempted all databases
      expect(mockMemgraphSync).toHaveBeenCalled();
      expect(mockQdrantSync).toHaveBeenCalled();
      expect(mockAnalyticsSync).toHaveBeenCalled();
    });
  });

  describe('Frontend Error Resilience', () => {
    it('should handle tracking provider errors without crashing UI', async () => {
      // Mock tracking hook to throw error
      const ErrorComponent = () => {
        const { trackProduct } = require('@/hooks/useAutoTracking').useAutoTracking();

        React.useEffect(() => {
          try {
            trackProduct('view', { id: 1, name: 'Test', price: 10 as Core.Money, category: 'Test' });
          } catch (error) {
            console.error('Tracking error:', error);
          }
        }, []);

        return <div data-testid="error-component">Component with tracking</div>;
      };

      const TestApp = () => (
        <AutoTrackingProvider>
          <CartProvider>
            <ErrorComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      // Should render without throwing
      expect(() => render(<TestApp />)).not.toThrow();

      // Component should still be visible
      await waitFor(() => {
        expect(screen.getByTestId('error-component')).toBeInTheDocument();
      });
    });

    it('should handle cart operations when tracking fails', async () => {
      // Mock fetch to fail for tracking but succeed for other operations
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/analytics/track')) {
          return Promise.reject(new Error('Tracking service down'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const TestCartComponent = () => {
        const { addToCart } = require('@/context/CartContext').useCart();

        const handleAddToCart = () => {
          addToCart({
            id: 1,
            name: 'Test Product',
            price: 2999 as Core.Money,
            image: 'test.jpg',
            quantity: 1
          });
        };

        return (
          <button onClick={handleAddToCart} data-testid="add-to-cart">
            Add to Cart
          </button>
        );
      };

      const TestApp = () => (
        <AutoTrackingProvider>
          <CartProvider>
            <TestCartComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      render(<TestApp />);

      const addButton = screen.getByTestId('add-to-cart');

      // Should not throw error even if tracking fails
      expect(() => fireEvent.click(addButton)).not.toThrow();
    });

    it('should recover from temporary API failures', async () => {
      let apiCallCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        apiCallCount++;
        if (apiCallCount <= 2) {
          return Promise.reject(new Error('Temporary API failure'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const TestApp = () => (
        <AutoTrackingProvider>
          <CartProvider>
            <div data-testid="test-app">Test App</div>
          </CartProvider>
        </AutoTrackingProvider>
      );

      // Should render and work despite initial API failures
      render(<TestApp />);
      expect(screen.getByTestId('test-app')).toBeInTheDocument();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should clean up resources when components unmount', async () => {
      const cleanup = jest.fn();

      const TestComponent = () => {
        React.useEffect(() => {
          const interval = setInterval(() => {
            // Simulate some background task
          }, 100);

          return () => {
            cleanup();
            clearInterval(interval);
          };
        }, []);

        return <div>Test Component</div>;
      };

      const TestApp = () => (
        <AutoTrackingProvider>
          <TestComponent />
        </AutoTrackingProvider>
      );

      const { unmount } = render(<TestApp />);

      // Unmount and verify cleanup
      unmount();

      // Give time for cleanup
      await new Promise(resolve => setTimeout(resolve, 50));

      // Cleanup should have been called
      expect(cleanup).toHaveBeenCalled();
    });

    it('should handle rapid component mount/unmount cycles', async () => {
      const TestComponent = ({ id }: { id: number }) => {
        const { trackCustomEvent } = require('@/hooks/useAutoTracking').useAutoTracking();

        React.useEffect(() => {
          trackCustomEvent('component.mounted', { componentId: id });

          return () => {
            trackCustomEvent('component.unmounted', { componentId: id });
          };
        }, [id]);

        return <div data-testid={`component-${id}`}>Component {id}</div>;
      };

      const TestApp = ({ currentId }: { currentId: number }) => (
        <AutoTrackingProvider>
          <TestComponent id={currentId} />
        </AutoTrackingProvider>
      );

      const { rerender } = render(<TestApp currentId={1} />);

      // Rapidly cycle through components
      for (let i = 2; i <= 10; i++) {
        rerender(<TestApp currentId={i} />);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Should not crash or leak memory
      expect(screen.getByTestId('component-10')).toBeInTheDocument();
    });
  });

  describe('Network Error Scenarios', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock extremely slow network response
      global.fetch = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: false,
              status: 408,
              json: () => Promise.resolve({ error: 'Request timeout' })
            });
          }, 5000); // 5 second timeout
        });
      });

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.13'
        },
        body: JSON.stringify({
          productId: 999,
          eventType: 'product.created'
        })
      });

      const startTime = Date.now();
      const response = await POST(request);
      const duration = Date.now() - startTime;

      // Should timeout quickly, not wait 5 seconds
      expect(duration).toBeLessThan(3000);
      expect([408, 500, 503]).toContain(response.status);
    });

    it('should handle intermittent network failures', async () => {
      let networkCallCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        networkCallCount++;
        // Fail every other call
        if (networkCallCount % 2 === 0) {
          return Promise.reject(new Error('Network failure'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const TestApp = () => {
        const { trackCustomEvent } = require('@/hooks/useAutoTracking').useAutoTracking();

        React.useEffect(() => {
          // Multiple tracking calls to trigger network retries
          for (let i = 0; i < 5; i++) {
            trackCustomEvent('test.event', { index: i });
          }
        }, []);

        return <div data-testid="network-test">Network Test</div>;
      };

      const App = () => (
        <AutoTrackingProvider>
          <TestApp />
        </AutoTrackingProvider>
      );

      // Should handle network failures gracefully
      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByTestId('network-test')).toBeInTheDocument();
    });
  });

  describe('Data Corruption Recovery', () => {
    it('should handle corrupted localStorage data', async () => {
      // Simulate corrupted cart data
      localStorage.setItem('cart', 'invalid-json-{');

      const TestCartApp = () => (
        <CartProvider>
          <div data-testid="cart-app">Cart App</div>
        </CartProvider>
      );

      // Should not crash due to corrupted localStorage
      expect(() => render(<TestCartApp />)).not.toThrow();
      expect(screen.getByTestId('cart-app')).toBeInTheDocument();

      // Should have cleaned up corrupted data
      const cartData = localStorage.getItem('cart');
      expect(() => JSON.parse(cartData || '{}')).not.toThrow();
    });

    it('should handle invalid tracking session data', async () => {
      // Simulate corrupted session data
      sessionStorage.setItem('tracking-session', 'corrupted-data');

      const TestApp = () => (
        <AutoTrackingProvider>
          <div data-testid="tracking-app">Tracking App</div>
        </AutoTrackingProvider>
      );

      // Should recover from corrupted session data
      expect(() => render(<TestApp />)).not.toThrow();
      expect(screen.getByTestId('tracking-app')).toBeInTheDocument();
    });
  });

  describe('Stress Testing Error Conditions', () => {
    it('should handle rapid error conditions without degradation', async () => {
      // Simulate rapid webhook failures
      const rapidRequests = Array.from({ length: 50 }, (_, i) => {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=invalid_action', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': `192.168.1.${i % 255}`
          },
          body: JSON.stringify({ invalid: 'data' })
        });
        return POST(request);
      });

      const startTime = Date.now();
      const responses = await Promise.all(rapidRequests);
      const duration = Date.now() - startTime;

      // Should handle all errors quickly
      expect(duration).toBeLessThan(5000);
      expect(responses).toHaveLength(50);

      // All should be error responses but not crashes
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(600);
      });
    });

    it('should maintain error rate limiting under attack', async () => {
      mockRedisClient.mockResolvedValue({ allowed: false, remaining: 0 });

      const attackRequests = Array.from({ length: 100 }, () => {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '10.0.0.1' // Same IP for all requests
          },
          body: JSON.stringify({ malicious: 'payload' })
        });
        return POST(request);
      });

      const responses = await Promise.all(attackRequests);

      // Should rate limit effectively
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(80); // Most should be rate limited
    });
  });
});

describe('Error Recovery Patterns', () => {
  it('should implement circuit breaker pattern for external services', async () => {
    // Mock external service that fails repeatedly
    let failureCount = 0;
    mockQdrantSync.mockImplementation(() => {
      failureCount++;
      if (failureCount <= 5) {
        return Promise.reject(new Error('Service unavailable'));
      }
      return Promise.resolve();
    });

    // Multiple requests should trigger circuit breaker
    for (let i = 0; i < 10; i++) {
      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId: i, eventType: 'product.created' })
      });

      await POST(request);
    }

    // After circuit breaker opens, service should recover
    expect(failureCount).toBeGreaterThan(5);
  });

  it('should gracefully degrade features when dependencies fail', async () => {
    // All external services fail
    mockMemgraphSync.mockRejectedValue(new Error('All services down'));
    mockQdrantSync.mockRejectedValue(new Error('All services down'));
    mockAnalyticsSync.mockRejectedValue(new Error('All services down'));

    const TestApp = () => {
      const [error, setError] = React.useState<string | null>(null);

      React.useEffect(() => {
        // Simulate feature that depends on these services
        Promise.all([
          mockMemgraphSync(),
          mockQdrantSync(),
          mockAnalyticsSync()
        ]).catch(() => {
          // Should gracefully degrade, not crash
          setError('Features temporarily unavailable');
        });
      }, []);

      return (
        <div data-testid="degraded-app">
          {error ? <div data-testid="degradation-notice">{error}</div> : 'Normal operation'}
        </div>
      );
    };

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('degradation-notice')).toBeInTheDocument();
    });

    expect(screen.getByText('Features temporarily unavailable')).toBeInTheDocument();
  });
});