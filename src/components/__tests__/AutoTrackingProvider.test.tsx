// AutoTrackingProvider Tests
import React from 'react';
import { Core } from '@/types/TYPE_REGISTRY';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AutoTrackingProvider, useTracking, useTrackingReady, useTrackingMonitoring } from '../AutoTrackingProviderEnhanced';

// Mock all the dependencies
const mockTrackingMethods = {
  trackProduct: jest.fn().mockResolvedValue(undefined),
  trackSearchQuery: jest.fn().mockResolvedValue(undefined),
  trackSearchClick: jest.fn().mockResolvedValue(undefined),
  trackOrderCreated: jest.fn().mockResolvedValue(undefined),
  trackCustomEvent: jest.fn().mockResolvedValue(undefined)
};

jest.mock('@/hooks/useAutoTracking', () => ({
  useAutoTracking: jest.fn(() => mockTrackingMethods)
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

jest.mock('@/lib/database-schema-optimizer', () => ({
  databaseOptimizer: {
    getPerformanceStats: jest.fn().mockResolvedValue({ mock: 'stats' }),
    performHealthCheck: jest.fn().mockResolvedValue({ mock: 'health' }),
    analyzeSlowQueries: jest.fn().mockResolvedValue({ mock: 'queries' })
  },
  initializeDatabaseOptimizations: jest.fn().mockResolvedValue(undefined),
  schedulePerformanceMonitoring: jest.fn()
}));

// Test component to access the context
const TestConsumer: React.FC = () => {
  const tracking = useTracking();
  const isReady = useTrackingReady();
  const monitoring = useTrackingMonitoring();

  return (
    <div>
      <div data-testid="ready-status">{isReady ? 'ready' : 'not-ready'}</div>
      <button
        onClick={() => tracking.trackProduct('view', {
          id: 1,
          name: 'Test Product',
          price: 10 as Core.Money,
          category: 'test'
        })}
        data-testid="track-product"
      >
        Track Product
      </button>
      <button
        onClick={() => tracking.trackSearchQuery('test query', 5)}
        data-testid="track-search"
      >
        Track Search
      </button>
      <button
        onClick={() => monitoring.getPerformanceStats()}
        data-testid="get-stats"
      >
        Get Stats
      </button>
    </div>
  );
};

const ErrorTestComponent: React.FC = () => {
  // This component will throw an error
  throw new Error('Test error for error boundary');
};

describe('AutoTrackingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Provider Functionality', () => {
    it('should provide tracking context to children', async () => {
      render(
        <AutoTrackingProvider>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      // Should find the test consumer
      expect(screen.getByTestId('ready-status')).toBeInTheDocument();
      expect(screen.getByTestId('track-product')).toBeInTheDocument();
      expect(screen.getByTestId('track-search')).toBeInTheDocument();
    });

    it('should initialize as ready', async () => {
      render(
        <AutoTrackingProvider>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      // Should eventually be ready
      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
      });
    });

    it('should start job processor on mount', async () => {
      const { jobProcessor } = require('@/lib/job-processor');

      render(
        <AutoTrackingProvider>
          <TestConsumer />
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
          <TestConsumer />
        </AutoTrackingProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(jobProcessor.start).toHaveBeenCalled();
      });

      // Unmount and check cleanup
      unmount();

      expect(jobProcessor.stop).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should initialize database optimizations when enabled', async () => {
      const { initializeDatabaseOptimizations, schedulePerformanceMonitoring } = require('@/lib/database-schema-optimizer');

      render(
        <AutoTrackingProvider enablePerformanceMonitoring={true}>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(initializeDatabaseOptimizations).toHaveBeenCalled();
        expect(schedulePerformanceMonitoring).toHaveBeenCalled();
      });
    });

    it('should skip database optimizations when disabled', async () => {
      const { initializeDatabaseOptimizations, schedulePerformanceMonitoring } = require('@/lib/database-schema-optimizer');

      render(
        <AutoTrackingProvider enablePerformanceMonitoring={false}>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
      });

      expect(initializeDatabaseOptimizations).not.toHaveBeenCalled();
      expect(schedulePerformanceMonitoring).not.toHaveBeenCalled();
    });

    it('should provide performance monitoring methods', async () => {
      const { databaseOptimizer } = require('@/lib/database-schema-optimizer');

      render(
        <AutoTrackingProvider>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
      });

      // Click the get stats button
      act(() => {
        screen.getByTestId('get-stats').click();
      });

      expect(databaseOptimizer.getPerformanceStats).toHaveBeenCalled();
    });
  });

  describe('Debug Mode', () => {
    it('should expose debug methods to window when enabled', async () => {
      // Clear any existing agrikoTracking
      delete (global.window as any).agrikoTracking;

      render(
        <AutoTrackingProvider enableDebugMode={true}>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
      });

      // Wait a bit more for useEffect to run
      await waitFor(() => {
        expect((global.window as any).agrikoTracking).toBeDefined();
      });

      expect((global.window as any).agrikoTracking.getStats).toBeDefined();
      expect((global.window as any).agrikoTracking.getHealth).toBeDefined();
      expect((global.window as any).agrikoTracking.isReady).toBe(true);
    });

    it('should not expose debug methods when disabled', async () => {
      // Clear any existing agrikoTracking
      delete (global.window as any).agrikoTracking;

      render(
        <AutoTrackingProvider enableDebugMode={false}>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
      });

      // Should not have exposed debug methods
      expect((global.window as any).agrikoTracking).toBeUndefined();
    });
  });

  describe('Error Boundary', () => {
    it('should catch errors and continue rendering children', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AutoTrackingProvider>
          <div data-testid="before-error">Before Error</div>
          <ErrorTestComponent />
          <div data-testid="after-error">After Error</div>
        </AutoTrackingProvider>
      );

      // Should still render the other children
      expect(screen.getByTestId('before-error')).toBeInTheDocument();
      expect(screen.getByTestId('after-error')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should log errors when caught', () => {
      const { logger } = require('@/lib/logger');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AutoTrackingProvider>
          <ErrorTestComponent />
        </AutoTrackingProvider>
      );

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('AutoTracking Error Boundary caught an error'),
        expect.objectContaining({
          error: 'Test error for error boundary'
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Tracking Methods', () => {
    it('should call tracking methods when used', async () => {
      const { useAutoTracking } = require('@/hooks/useAutoTracking');
      const mockTrackProduct = jest.fn().mockResolvedValue(undefined);
      useAutoTracking.mockReturnValue({
        trackProduct: mockTrackProduct,
        trackSearchQuery: jest.fn().mockResolvedValue(undefined),
        trackSearchClick: jest.fn().mockResolvedValue(undefined),
        trackOrderCreated: jest.fn().mockResolvedValue(undefined),
        trackCustomEvent: jest.fn().mockResolvedValue(undefined)
      });

      render(
        <AutoTrackingProvider>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
      });

      // Click track product button
      act(() => {
        screen.getByTestId('track-product').click();
      });

      expect(mockTrackProduct).toHaveBeenCalledWith('view', {
        id: 1,
        name: 'Test Product',
        price: 10 as Core.Money,
        category: 'test'
      });
    });
  });

  describe('Hook Exports', () => {
    it('should throw error when useTracking is used outside provider', () => {
      const TestComponent = () => {
        useTracking();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTracking must be used within AutoTrackingProvider');

      consoleSpy.mockRestore();
    });

    it('should return default values when monitoring hooks are used outside provider', () => {
      const TestComponent = () => {
        const isReady = useTrackingReady();
        const monitoring = useTrackingMonitoring();

        return (
          <div>
            <div data-testid="ready">{isReady ? 'true' : 'false'}</div>
            <div data-testid="monitoring">{typeof monitoring.getPerformanceStats}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('ready')).toHaveTextContent('false');
      expect(screen.getByTestId('monitoring')).toHaveTextContent('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const { jobProcessor } = require('@/lib/job-processor');
      jobProcessor.start.mockRejectedValueOnce(new Error('Job processor failed'));

      render(
        <AutoTrackingProvider>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      // Should still become ready even with initialization errors
      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
      });
    });

    it('should handle monitoring method errors gracefully', async () => {
      const { databaseOptimizer } = require('@/lib/database-schema-optimizer');
      databaseOptimizer.getPerformanceStats.mockRejectedValueOnce(new Error('Stats failed'));

      render(
        <AutoTrackingProvider>
          <TestConsumer />
        </AutoTrackingProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ready-status')).toHaveTextContent('ready');
      });

      // Should not throw when getting stats fails
      act(() => {
        screen.getByTestId('get-stats').click();
      });

      // Should log the error
      const { logger } = require('@/lib/logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get performance stats:',
        expect.any(Error)
      );
    });
  });
});