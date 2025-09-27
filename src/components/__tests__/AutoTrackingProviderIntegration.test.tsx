// Integration test for AutoTrackingProvider with actual components
import React from 'react';
import { Money } from '@/lib/money';
import { EventType } from '@/lib/client-event-system';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { AutoTrackingProvider, useTracking } from '../AutoTrackingProvider';
import { CartProvider } from '@/context/CartContext';

// Mock the dependencies
jest.mock('@/hooks/useAutoTracking', () => ({
  useAutoTracking: () => ({
    trackProduct: jest.fn().mockResolvedValue(undefined),
    trackSearchQuery: jest.fn().mockResolvedValue(undefined),
    trackSearchClick: jest.fn().mockResolvedValue(undefined),
    trackOrderCreated: jest.fn().mockResolvedValue(undefined),
    trackCustomEvent: jest.fn().mockResolvedValue(undefined)
  })
}));

jest.mock('@/lib/job-processor', () => ({
  jobProcessor: {
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock localStorage for cart functionality
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage for tracking
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Test component that uses tracking
const TestTrackingComponent: React.FC = () => {
  const tracking = useTracking();

  const handleTrackProduct = () => {
    tracking.trackProduct('view', {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      category: 'Test Category'
    });
  };

  const handleTrackSearch = () => {
    tracking.trackSearchQuery('test search', 5);
  };

  const handleTrackCustom = () => {
    tracking.trackCustomEvent(EventType.TEST_EVENT, {
      action: 'button_click',
      context: 'test'
    });
  };

  return (
    <div>
      <button data-testid="track-product" onClick={handleTrackProduct}>
        Track Product View
      </button>
      <button data-testid="track-search" onClick={handleTrackSearch}>
        Track Search
      </button>
      <button data-testid="track-custom" onClick={handleTrackCustom}>
        Track Custom Event
      </button>
    </div>
  );
};

describe('AutoTrackingProvider Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  describe('Provider Integration', () => {
    it('should provide tracking context within layout structure', async () => {
      render(
        <AutoTrackingProvider>
          <CartProvider>
            <TestTrackingComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      expect(screen.getByTestId('track-product')).toBeInTheDocument();
      expect(screen.getByTestId('track-search')).toBeInTheDocument();
      expect(screen.getByTestId('track-custom')).toBeInTheDocument();
    });

    it('should initialize job processor on mount', async () => {
      const { jobProcessor } = require('@/lib/job-processor');

      render(
        <AutoTrackingProvider>
          <CartProvider>
            <TestTrackingComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(jobProcessor.start).toHaveBeenCalled();
      });
    });

    it('should stop job processor on unmount', async () => {
      const { jobProcessor } = require('@/lib/job-processor');

      const { unmount } = render(
        <AutoTrackingProvider>
          <CartProvider>
            <TestTrackingComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(jobProcessor.start).toHaveBeenCalled();
      });

      unmount();

      expect(jobProcessor.stop).toHaveBeenCalled();
    });
  });

  describe('Tracking Methods', () => {
    it('should track product views', async () => {
      const { useAutoTracking } = require('@/hooks/useAutoTracking');
      const mockTrackProduct = jest.fn().mockResolvedValue(undefined);
      useAutoTracking.mockReturnValue({
        trackProduct: mockTrackProduct,
        trackSearchQuery: jest.fn(),
        trackSearchClick: jest.fn(),
        trackOrderCreated: jest.fn(),
        trackCustomEvent: jest.fn()
      });

      render(
        <AutoTrackingProvider>
          <CartProvider>
            <TestTrackingComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      fireEvent.click(screen.getByTestId('track-product'));

      expect(mockTrackProduct).toHaveBeenCalledWith('view', {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        category: 'Test Category'
      });
    });

    it('should track search queries', async () => {
      const { useAutoTracking } = require('@/hooks/useAutoTracking');
      const mockTrackSearch = jest.fn().mockResolvedValue(undefined);
      useAutoTracking.mockReturnValue({
        trackProduct: jest.fn(),
        trackSearchQuery: mockTrackSearch,
        trackSearchClick: jest.fn(),
        trackOrderCreated: jest.fn(),
        trackCustomEvent: jest.fn()
      });

      render(
        <AutoTrackingProvider>
          <CartProvider>
            <TestTrackingComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      fireEvent.click(screen.getByTestId('track-search'));

      expect(mockTrackSearch).toHaveBeenCalledWith('test search', 5);
    });

    it('should track custom events', async () => {
      const { useAutoTracking } = require('@/hooks/useAutoTracking');
      const mockTrackCustom = jest.fn().mockResolvedValue(undefined);
      useAutoTracking.mockReturnValue({
        trackProduct: jest.fn(),
        trackSearchQuery: jest.fn(),
        trackSearchClick: jest.fn(),
        trackOrderCreated: jest.fn(),
        trackCustomEvent: mockTrackCustom
      });

      render(
        <AutoTrackingProvider>
          <CartProvider>
            <TestTrackingComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      fireEvent.click(screen.getByTestId('track-custom'));

      expect(mockTrackCustom).toHaveBeenCalledWith(EventType.TEST_EVENT, {
        action: 'button_click',
        context: 'test'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', async () => {
      const { useAutoTracking } = require('@/hooks/useAutoTracking');
      const mockTrackProduct = jest.fn().mockRejectedValue(new Error('Tracking failed'));
      useAutoTracking.mockReturnValue({
        trackProduct: mockTrackProduct,
        trackSearchQuery: jest.fn(),
        trackSearchClick: jest.fn(),
        trackOrderCreated: jest.fn(),
        trackCustomEvent: jest.fn()
      });

      render(
        <AutoTrackingProvider>
          <CartProvider>
            <TestTrackingComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      // Should not throw when tracking fails
      fireEvent.click(screen.getByTestId('track-product'));

      expect(mockTrackProduct).toHaveBeenCalled();
    });

    it('should handle missing tracking context gracefully', () => {
      // Test component outside of AutoTrackingProvider
      const TestComponentOutsideProvider = () => {
        try {
          const _tracking = useTracking();
          return <div data-testid="has-tracking">Has tracking</div>;
        } catch (_error) {
          return <div data-testid="no-tracking">No tracking</div>;
        }
      };

      render(
        <CartProvider>
          <TestComponentOutsideProvider />
        </CartProvider>
      );

      expect(screen.getByTestId('no-tracking')).toBeInTheDocument();
    });
  });

  describe('Provider Hierarchy', () => {
    it('should work correctly when AutoTrackingProvider wraps CartProvider', () => {
      render(
        <AutoTrackingProvider>
          <CartProvider>
            <TestTrackingComponent />
          </CartProvider>
        </AutoTrackingProvider>
      );

      expect(screen.getByTestId('track-product')).toBeInTheDocument();
    });

    it('should work with nested provider structure', () => {
      const NestedComponent = () => {
        const tracking = useTracking();
        return (
          <div data-testid="nested-component">
            <button onClick={() => tracking.trackCustomEvent(EventType.NESTED_TEST, {})}>
              Nested Tracking
            </button>
          </div>
        );
      };

      render(
        <AutoTrackingProvider>
          <CartProvider>
            <div>
              <TestTrackingComponent />
              <NestedComponent />
            </div>
          </CartProvider>
        </AutoTrackingProvider>
      );

      expect(screen.getByTestId('nested-component')).toBeInTheDocument();
    });
  });
});