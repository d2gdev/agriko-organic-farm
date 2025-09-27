'use client';

// Enhanced provider component for automatic tracking across the entire application
import React, { createContext, useContext, useEffect, ReactNode, Component, ErrorInfo, useState } from 'react';
import { useAutoTracking } from '@/hooks/useAutoTracking';
import { jobProcessor } from '@/lib/job-processor';
import { EventType } from '@/lib/event-system';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/error-utils';
import { databaseOptimizer } from '@/lib/database-schema-optimizer';

// Debug interface for development
interface AgrikoTrackingDebug {
  getStats: () => unknown;
  getHealth: () => unknown;
  isReady: boolean;
  forceHealthCheck: () => Promise<unknown>;
  getSlowQueries: () => Promise<unknown>;
}

declare global {
  interface Window {
    agrikoTracking?: AgrikoTrackingDebug;
  }
}
import { initializeDatabaseOptimizations, schedulePerformanceMonitoring } from '@/lib/database-schema-optimizer';

interface AutoTrackingContextType {
  trackProduct: (action: 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase', productData: {
    id: number;
    name: string;
    price: number;
    category: string;
    quantity?: number;
    variantId?: number;
  }) => Promise<void>;
  trackSearchQuery: (query: string, resultsCount: number, filters?: Record<string, unknown>) => Promise<void>;
  trackSearchClick: (query: string, resultId: number, position: number) => Promise<void>;
  trackOrderCreated: (orderData: {
    orderId: string;
    orderTotal: number;
    itemCount: number;
    paymentMethod?: string;
    shippingMethod?: string;
    items: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
  }) => Promise<void>;
  trackCustomEvent: (eventType: string, data: Record<string, unknown>) => Promise<void>;
  // Debug and monitoring features
  isReady: boolean;
  getPerformanceStats: () => Promise<{
    totalEvents: number;
    errorCount: number;
    lastEvent: Date | null;
  }>;
  getHealthCheck: () => Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    errors: string[];
  }>;
}

const AutoTrackingContext = createContext<AutoTrackingContextType | null>(null);

export const useTracking = () => {
  const context = useContext(AutoTrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within AutoTrackingProvider');
  }
  return context;
};

// Error boundary for tracking provider
interface TrackingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class TrackingErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
  TrackingErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): TrackingErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log the error
    logger.error('🔥 AutoTracking Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI - return children without tracking to prevent total app breakage
      return this.props.children;
    }

    return this.props.children;
  }
}

interface AutoTrackingProviderProps {
  children: ReactNode;
  enableDebugMode?: boolean;
  enablePerformanceMonitoring?: boolean;
}

export const AutoTrackingProvider: React.FC<AutoTrackingProviderProps> = ({
  children,
  enableDebugMode = false,
  enablePerformanceMonitoring = true
}) => {
  const [isReady, setIsReady] = useState(false);
  const trackingMethods = useAutoTracking();

  useEffect(() => {
    let mounted = true;

    // Initialize all tracking systems
    const initializeTracking = async () => {
      try {
        logger.info('🚀 Initializing auto-tracking system...');

        // Start the background job processor
        await jobProcessor.start();
        logger.info('✅ Auto-tracking job processor started');

        // Initialize database optimizations
        if (enablePerformanceMonitoring) {
          await initializeDatabaseOptimizations();
          schedulePerformanceMonitoring();
          logger.info('✅ Database performance monitoring started');
        }

        // Mark as ready
        if (mounted) {
          setIsReady(true);
          logger.info('🎉 Auto-tracking system fully initialized');
        }

      } catch (error) {
        logger.error('❌ Failed to initialize auto-tracking system', { error: getErrorMessage(error) });

        // Still mark as ready but with limited functionality
        if (mounted) {
          setIsReady(true);
        }
      }
    };

    initializeTracking();

    // Cleanup on unmount
    return () => {
      mounted = false;
      try {
        jobProcessor.stop();
        logger.info('🛑 Auto-tracking system stopped');
      } catch (error) {
        logger.error('❌ Error stopping auto-tracking system', { error: getErrorMessage(error) });
      }
    };
  }, [enablePerformanceMonitoring]);

  // Enhanced context value with monitoring capabilities
  const contextValue: AutoTrackingContextType = {
    ...trackingMethods,
    isReady,
    getPerformanceStats: async () => {
      try {
        const stats = await databaseOptimizer.getPerformanceStats();
        if (!stats) {
          return { totalEvents: 0, errorCount: 0, lastEvent: null };
        }
        // Map database metrics to expected format
        const totalEvents = (stats.memgraph?.nodeCount || 0) + (stats.qdrant?.vectorCount || 0);
        const errorCount = 0; // Could be calculated from actual error tracking
        const lastEvent = new Date(stats.lastUpdated || Date.now());

        return {
          totalEvents,
          errorCount,
          lastEvent
        };
      } catch (error) {
        logger.error('Failed to get performance stats', { error: getErrorMessage(error) });
        return { totalEvents: 0, errorCount: 0, lastEvent: null };
      }
    },
    getHealthCheck: async () => {
      try {
        const healthData = await databaseOptimizer.performHealthCheck();
        if (!healthData) {
          return { status: 'unhealthy' as const, uptime: 0, errors: ['Health check failed'] };
        }

        // Map the health check data to expected format
        const overallStatus = healthData.memgraph?.status === 'critical' || healthData.qdrant?.status === 'critical'
          ? 'unhealthy' as const
          : healthData.memgraph?.status === 'warning' || healthData.qdrant?.status === 'warning'
          ? 'degraded' as const
          : 'healthy' as const;

        return {
          status: overallStatus,
          uptime: Date.now(),
          errors: [
            ...(healthData.memgraph?.details || []),
            ...(healthData.qdrant?.details || [])
          ]
        };
      } catch (error) {
        logger.error('Failed to perform health check', { error: getErrorMessage(error) });
        return { status: 'unhealthy' as const, uptime: 0, errors: [getErrorMessage(error)] };
      }
    }
  };

  // Error handler for the error boundary
  const handleTrackingError = (error: Error, errorInfo: ErrorInfo) => {
    // Track the error itself as a custom event
    try {
      trackingMethods.trackCustomEvent(EventType.TRACKING_ERROR, {
        errorMessage: error.message,
        errorStack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now()
      });
    } catch (trackingError) {
      // Fallback logging if tracking fails
      logger.error('Failed to track error event', { error: getErrorMessage(trackingError) });
    }
  };

  // Debug information in development
  useEffect(() => {
    if (enableDebugMode && typeof window !== 'undefined') {
      // Expose debug methods to window for development
      window.agrikoTracking = {
        getStats: contextValue.getPerformanceStats,
        getHealth: contextValue.getHealthCheck,
        isReady,
        forceHealthCheck: () => databaseOptimizer.performHealthCheck(),
        getSlowQueries: () => databaseOptimizer.analyzeSlowQueries()
      };

      logger.info('🐛 Auto-tracking debug mode enabled. Access via window.agrikoTracking');
    }
  }, [enableDebugMode, isReady, contextValue.getPerformanceStats, contextValue.getHealthCheck]);

  return (
    <TrackingErrorBoundary onError={handleTrackingError}>
      <AutoTrackingContext.Provider value={contextValue}>
        {children}
      </AutoTrackingContext.Provider>
    </TrackingErrorBoundary>
  );
};

// Additional hook for accessing readiness state
export const useTrackingReady = () => {
  const context = useContext(AutoTrackingContext);
  return context?.isReady ?? false;
};

// Additional hook for performance monitoring
export const useTrackingMonitoring = () => {
  const context = useContext(AutoTrackingContext);
  if (!context) {
    return {
      getPerformanceStats: async () => null,
      getHealthCheck: async () => null
    };
  }

  return {
    getPerformanceStats: context.getPerformanceStats,
    getHealthCheck: context.getHealthCheck
  };
};