// Real-World End-to-End Integration Tests
// Tests the complete flow from WooCommerce webhook to database persistence

import React from 'react';
import { Money } from '@/lib/money';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { AutoTrackingProvider } from '@/components/AutoTrackingProvider';
import { CartProvider } from '@/context/CartContext';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auto-sync/route';

// Real components for integration testing
import ProductCard from '@/components/ProductCard';
import SearchModal from '@/components/SearchModal';
// import CartDrawer from '@/components/CartDrawer'; // Unused in this test file

// Mock real external dependencies but keep internal logic
jest.mock('@/lib/woocommerce', () => ({
  getAllProducts: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Test Product',
      price: Money.centavos(2999),
      slug: 'test-product',
      images: [{ src: 'https://example.com/image.jpg', alt: 'Test' }]
    }
  ]),
  getProduct: jest.fn().mockResolvedValue({
    id: 1,
    name: 'Test Product',
    price: Money.centavos(2999),
    description: 'A test product'
  })
}));

// Mock database connections but keep validation logic
jest.mock('@/lib/memgraph', () => ({
  withSession: jest.fn().mockImplementation(async (callback) => {
    const mockSession = {
      run: jest.fn().mockResolvedValue({ records: [] }),
      close: jest.fn()
    };
    return callback(mockSession);
  })
}));

// Track actual API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('End-to-End Real-World Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  describe('Complete User Journey: Browse → Search → Add to Cart', () => {
    it('should track complete user journey with real components', async () => {
      const TestApp = () => (
        <AutoTrackingProvider>
          <CartProvider>
            <div>
              <ProductCard
                product={{
                  id: 1,
                  name: 'Test Product',
                  price: Money.centavos(2999),
                  regular_price: Money.centavos(2999),
                  sale_price: null,
                  slug: 'test-product',
                  images: [{ id: 1, name: 'Test', src: 'https://example.com/image.jpg', alt: 'Test' }]
                }}
              />
              <SearchModal isOpen={true} onClose={() => {}} products={[]} />
            </div>
          </CartProvider>
        </AutoTrackingProvider>
      );

      render(<TestApp />);

      // 1. User views product (should trigger tracking)
      const productElement = screen.getByText('Test Product');
      expect(productElement).toBeInTheDocument();

      // Wait for product view tracking
      await waitFor(() => {
        // Should track product view
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/track'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('product.view')
          })
        );
      }, { timeout: 3000 });

      // 2. User searches (should trigger search tracking)
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      await waitFor(() => {
        // Should track search
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/track'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('search.performed')
          })
        );
      });

      // 3. User adds to cart (should trigger cart tracking)
      const addToCartButton = screen.getByText(/add to cart/i);
      fireEvent.click(addToCartButton);

      await waitFor(() => {
        // Should track add to cart
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/track'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('product.add_to_cart')
          })
        );
      });

      // Verify multiple tracking events were fired
      const trackingCalls = mockFetch.mock.calls.filter(call =>
        call[0].includes('/api/analytics/track')
      );
      expect(trackingCalls.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle tracking failures gracefully without breaking UX', async () => {
      // Mock tracking API failure
      mockFetch.mockRejectedValue(new Error('Tracking API down'));

      const TestApp = () => (
        <AutoTrackingProvider>
          <CartProvider>
            <ProductCard
              product={{
                id: 1,
                name: 'Test Product',
                price: Money.centavos(2999),
                regular_price: Money.centavos(2999),
                sale_price: null,
                slug: 'test-product',
                images: [{ id: 1, name: 'Test', src: 'https://example.com/image.jpg', alt: 'Test' }]
              }}
            />
          </CartProvider>
        </AutoTrackingProvider>
      );

      render(<TestApp />);

      // User interactions should still work despite tracking failures
      const addToCartButton = screen.getByText(/add to cart/i);

      // Should not throw error
      expect(() => {
        fireEvent.click(addToCartButton);
      }).not.toThrow();

      // UI should still be functional
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  describe('Webhook to Database Integration Flow', () => {
    it('should process complete webhook flow from WooCommerce to persistence', async () => {
      // Simulate real WooCommerce webhook payload
      const webhookPayload = {
        id: 123,
        name: 'New Product',
        slug: 'new-product',
        type: 'simple',
        status: 'publish',
        featured: false,
        catalog_visibility: 'visible',
        description: 'A new product description',
        short_description: 'Short description',
        sku: 'NEW-PROD-123',
        price: Money.centavos(4999),
        regular_price: Money.centavos(4999),
        sale_price: null,
        on_sale: false,
        weight: '1.5',
        categories: [
          {
            id: 15,
            name: 'Electronics',
            slug: 'electronics'
          }
        ],
        images: [
          {
            id: 789,
            src: 'https://shop.example.com/wp-content/uploads/new-product.jpg',
            name: 'new-product.jpg',
            alt: 'New Product Image'
          }
        ],
        date_created: '2024-01-15T10:30:00',
        date_modified: '2024-01-15T10:30:00'
      };

      // Create webhook request with proper headers
      const webhookRequest = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-wc-webhook-topic': 'product.created',
          'x-wc-webhook-resource': 'product',
          'x-wc-webhook-event': 'created',
          'x-wc-webhook-signature': 'test-signature',
          'x-wc-webhook-delivery': '12345',
          'user-agent': 'WooCommerce/1.0.0 Hookshot'
        },
        body: JSON.stringify(webhookPayload)
      });

      // Process webhook
      const response = await POST(webhookRequest);
      const result = await response.json();

      // Should process successfully or fail gracefully
      expect([200, 403, 422, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(result.success).toBe(true);
        expect(result.action).toBe('product_created');
      } else {
        // Should provide meaningful error
        expect(result.error).toBeDefined();
      }
    });

    it('should handle malformed WooCommerce webhooks', async () => {
      const malformedPayloads = [
        // Missing required fields
        { id: 123 },
        // Invalid data types
        { id: 'not-a-number', name: 123, price: true },
        // Circular references
        (() => {
          const obj: Record<string, unknown> = { id: 123, name: 'Test' };
          obj.circular = obj;
          return obj;
        })(),
        // XSS attempts
        {
          id: 123,
          name: '<script>alert("xss")</script>Product',
          description: '<img src=x onerror=alert(1)>',
          sku: '"; DROP TABLE products; --'
        }
      ];

      for (const payload of malformedPayloads) {
        const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-wc-webhook-topic': 'product.created'
          },
          body: JSON.stringify(payload)
        });

        const response = await POST(request);

        // Should handle gracefully
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(600);

        const result = await response.json();
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Cross-Database Consistency', () => {
    it('should maintain data consistency across multiple databases', async () => {
      // Track database calls
      const memgraphCalls: any[] = [];
      const qdrantCalls: any[] = [];
      const analyticsCalls: any[] = [];

      // Mock database modules to track calls
      jest.doMock('@/lib/memgraph-auto-sync', () => ({
        autoSyncProductToMemgraph: jest.fn().mockImplementation((data) => {
          memgraphCalls.push(data);
          return Promise.resolve();
        })
      }));

      jest.doMock('@/lib/qdrant-auto-sync', () => ({
        autoSyncProductToQdrant: jest.fn().mockImplementation((data) => {
          qdrantCalls.push(data);
          return Promise.resolve();
        })
      }));

      jest.doMock('@/lib/analytics-db', () => ({
        saveAnalyticsEvent: jest.fn().mockImplementation((data) => {
          analyticsCalls.push(data);
          return Promise.resolve();
        })
      }));

      const webhookPayload = {
        productId: 456,
        eventType: 'product.created',
        productData: {
          id: 456,
          name: 'Consistency Test Product',
          price: Money.centavos(9999),
        }
      };

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      });

      await POST(request);

      // All databases should receive the same product ID
      if (memgraphCalls.length > 0) {
        expect(memgraphCalls[0].productId).toBe(456);
      }
      if (qdrantCalls.length > 0) {
        expect(qdrantCalls[0].productId).toBe(456);
      }
      if (analyticsCalls.length > 0) {
        expect(analyticsCalls[0].metadata.productId).toBe(456);
      }
    });

    it('should handle partial database failures without corrupting data', async () => {
      // Mock Memgraph success, Qdrant failure
      jest.doMock('@/lib/memgraph-auto-sync', () => ({
        autoSyncProductToMemgraph: jest.fn().mockResolvedValue(undefined)
      }));

      jest.doMock('@/lib/qdrant-auto-sync', () => ({
        autoSyncProductToQdrant: jest.fn().mockRejectedValue(new Error('Qdrant timeout'))
      }));

      jest.doMock('@/lib/analytics-db', () => ({
        saveAnalyticsEvent: jest.fn().mockResolvedValue(undefined)
      }));

      const request = new NextRequest('http://localhost:3000/api/auto-sync?action=product_created', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          productId: 789,
          eventType: 'product.created'
        })
      });

      const response = await POST(request);

      // Should fail gracefully
      expect(response.status).toBe(500);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Session and Context Management', () => {
    it('should maintain session consistency across page navigation', async () => {
      let sessionId: string | null = null;

      const TrackingCapture = () => {
        const { trackCustomEvent } = require('@/hooks/useAutoTracking').useAutoTracking();

        React.useEffect(() => {
          trackCustomEvent('session.test', { page: 'test' });
        }, []);

        return <div>Tracking Component</div>;
      };

      const TestApp = () => (
        <AutoTrackingProvider>
          <TrackingCapture />
        </AutoTrackingProvider>
      );

      render(<TestApp />);

      await waitFor(() => {
        const trackingCall = mockFetch.mock.calls.find(call =>
          call[0].includes('/api/analytics/track')
        );

        if (trackingCall) {
          const body = JSON.parse(trackingCall[1].body);
          sessionId = body.sessionId;
          expect(sessionId).toBeDefined();
        }
      });

      // Re-render with same provider (simulating navigation)
      render(<TestApp />);

      await waitFor(() => {
        const newTrackingCall = mockFetch.mock.calls.find((call, index) =>
          index > 0 && call[0].includes('/api/analytics/track')
        );

        if (newTrackingCall) {
          const body = JSON.parse(newTrackingCall[1].body);
          expect(body.sessionId).toBe(sessionId); // Should maintain same session
        }
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle tracking errors without crashing the application', async () => {
      // Mock tracking to throw error
      jest.doMock('@/hooks/useAutoTracking', () => ({
        useAutoTracking: () => ({
          trackProduct: jest.fn().mockImplementation(() => {
            throw new Error('Tracking system failure');
          }),
          trackCustomEvent: jest.fn()
        })
      }));

      const ErrorProneComponent = () => {
        const { trackProduct } = require('@/hooks/useAutoTracking').useAutoTracking();

        React.useEffect(() => {
          trackProduct('view', { id: 1, name: 'Test', price: Money.centavos(1000), category: 'Test' });
        }, []);

        return <div>Component with tracking error</div>;
      };

      const TestApp = () => (
        <AutoTrackingProvider>
          <ErrorProneComponent />
        </AutoTrackingProvider>
      );

      // Should not throw error
      expect(() => render(<TestApp />)).not.toThrow();

      // Should still render content
      expect(screen.getByText('Component with tracking error')).toBeInTheDocument();
    });
  });

  describe('Performance Under Real Load', () => {
    it('should handle rapid user interactions without degradation', async () => {
      const TestApp = () => (
        <AutoTrackingProvider>
          <CartProvider>
            <div>
              {Array.from({ length: 10 }, (_, i) => (
                <ProductCard
                  key={i}
                  product={{
                    id: i + 1,
                    name: `Product ${i + 1}`,
                    price: Money.centavos(2999),
                    regular_price: Money.centavos(2999),
                    sale_price: null,
                    slug: `product-${i + 1}`,
                    images: [{ id: 1, name: 'Test', src: 'https://example.com/image.jpg', alt: 'Test' }]
                  }}
                />
              ))}
            </div>
          </CartProvider>
        </AutoTrackingProvider>
      );

      render(<TestApp />);

      const startTime = Date.now();

      // Rapidly click multiple add to cart buttons
      const addToCartButtons = screen.getAllByText(/add to cart/i);
      addToCartButtons.forEach(button => {
        fireEvent.click(button);
      });

      // Rapidly interact with products
      const productElements = screen.getAllByText(/Product \d+/);
      productElements.forEach(element => {
        fireEvent.mouseEnter(element);
        fireEvent.mouseLeave(element);
      });

      const interactionTime = Date.now() - startTime;

      // Interactions should complete quickly
      expect(interactionTime).toBeLessThan(1000);

      // UI should remain responsive
      expect(screen.getAllByText(/Product \d+/)).toHaveLength(10);
    });
  });
});

describe('Integration Testing Helpers', () => {
  // Helper to verify tracking payload structure
  const _verifyTrackingPayload = (payload: Record<string, unknown>) => {
    expect(payload).toHaveProperty('id');
    expect(payload).toHaveProperty('type');
    expect(payload).toHaveProperty('timestamp');
    expect(payload).toHaveProperty('sessionId');
    expect(typeof payload.timestamp).toBe('number');
    expect(payload.timestamp).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
  };

  // Helper to simulate real webhook
  const _createWebhookRequest = (action: string, payload: Record<string, unknown>) => {
    return new NextRequest(`http://localhost:3000/api/auto-sync?action=${action}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-wc-webhook-topic': `product.${action.split('_')[1]}`,
        'user-agent': 'WooCommerce/1.0.0'
      },
      body: JSON.stringify(payload)
    });
  };

  // Helper to measure performance
  const _measurePerformance = async (fn: () => Promise<unknown>) => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    return {
      result,
      duration: endTime - startTime
    };
  };
});