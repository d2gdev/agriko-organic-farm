'use client';

import React from 'react';

import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorCount: number;
  lastErrorTimestamp: number;
  errorId: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorRecoveryTimer: NodeJS.Timeout | null = null;
  private static readonly MAX_ERROR_COUNT = 5;
  private static readonly RECOVERY_TIMEOUT = 10000; // 10 seconds
  private static readonly ERROR_COOLDOWN = 5000; // 5 seconds between same errors

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      errorCount: 0,
      lastErrorTimestamp: 0,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error, prevState?: ErrorBoundaryState): Partial<ErrorBoundaryState> {
    const now = Date.now();
    const errorId = `${error.name}-${error.message?.slice(0, 50)}`;
    
    // Note: getDerivedStateFromError doesn't have access to prevState in React
    // We'll handle error counting in componentDidCatch instead
    return {
      hasError: true,
      error,
      errorCount: 1, // Will be updated in componentDidCatch if needed
      lastErrorTimestamp: now,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Get current error ID from the newly set state
    const currentErrorId = `${error.name}-${error.message?.slice(0, 50)}`;
    
    // Check if this error is the same as the previous one and update count accordingly
    this.setState(prevState => {
      const isSameError = prevState.errorId === currentErrorId;
      const isWithinCooldown = Date.now() - prevState.lastErrorTimestamp < ErrorBoundary.ERROR_COOLDOWN;
      
      let newErrorCount = prevState.errorCount;
      if (isSameError && !isWithinCooldown) {
        newErrorCount = Math.min(prevState.errorCount + 1, ErrorBoundary.MAX_ERROR_COUNT + 1);
      }
      
      logger.error('ErrorBoundary caught an error', { 
        error, 
        errorInfo,
        errorCount: newErrorCount,
        errorId: currentErrorId,
        timestamp: new Date().toISOString()
      }, 'app');
      
      return { errorCount: newErrorCount };
    }, () => {
      // Set up automatic recovery timer if error count is manageable
      const finalErrorCount = this.state.errorCount;
      if (finalErrorCount < ErrorBoundary.MAX_ERROR_COUNT && !this.errorRecoveryTimer) {
        this.errorRecoveryTimer = setTimeout(() => {
          this.recoverFromError();
        }, ErrorBoundary.RECOVERY_TIMEOUT);
      }
    });
  }

  componentWillUnmount() {
    if (this.errorRecoveryTimer) {
      clearTimeout(this.errorRecoveryTimer);
      this.errorRecoveryTimer = null;
    }
  }

  private recoverFromError = () => {
    logger.info('ErrorBoundary attempting automatic recovery', {
      errorCount: this.state.errorCount,
      errorId: this.state.errorId
    });
    
    this.setState({
      hasError: false,
      error: undefined
    });
    
    this.errorRecoveryTimer = null;
  };

  private handleManualRetry = () => {
    if (this.errorRecoveryTimer) {
      clearTimeout(this.errorRecoveryTimer);
      this.errorRecoveryTimer = null;
    }
    
    logger.info('ErrorBoundary manual retry initiated', {
      errorCount: this.state.errorCount,
      errorId: this.state.errorId
    });
    
    this.setState({ 
      hasError: false, 
      error: undefined
    });
  };

  private handleResetErrorCount = () => {
    logger.info('ErrorBoundary resetting error count');
    
    this.setState({
      hasError: false,
      error: undefined,
      errorCount: 0,
      lastErrorTimestamp: 0,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorCount, errorId } = this.state;
      const isRecoverable = errorCount < ErrorBoundary.MAX_ERROR_COUNT;
      const hasRecurringError = errorCount > 2;
      
      // Render fallback UI if provided, otherwise render enhanced error message
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-red-800">
                {hasRecurringError ? 'Recurring Error Detected' : 'Something went wrong'}
              </h2>
              <p className="text-red-600 mt-2">
                {error?.message ?? 'An unexpected error occurred'}
              </p>
              
              {/* Error details for debugging */}
              {errorCount > 1 && (
                <div className="mt-2 text-sm text-red-500">
                  <p>Error occurred {errorCount} times</p>
                  {errorId && (
                    <p className="truncate">ID: {errorId}</p>
                  )}
                </div>
              )}
              
              {/* Recovery message */}
              {this.errorRecoveryTimer && (
                <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                  Automatic recovery will be attempted in a few seconds...
                </div>
              )}
              
              {/* Action buttons */}
              <div className="mt-4 flex space-x-2">
                {isRecoverable ? (
                  <>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      onClick={this.handleManualRetry}
                    >
                      Try again
                    </button>
                    {hasRecurringError && (
                      <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        onClick={this.handleResetErrorCount}
                      >
                        Reset & Retry
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-red-700">
                    <p className="font-medium">Maximum error limit reached</p>
                    <p className="text-sm mt-1">Please refresh the page or contact support</p>
                    <button
                      className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
