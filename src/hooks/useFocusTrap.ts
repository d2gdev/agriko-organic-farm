'use client';

import { useEffect, useRef, RefObject } from 'react';

import { logger } from '@/lib/logger';

// Focusable element selectors
const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input[type="text"]:not([disabled])',
  'input[type="radio"]:not([disabled])',
  'input[type="checkbox"]:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(', ');

interface UseFocusTrapOptions {
  isActive?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  restoreFocus?: RefObject<HTMLElement | null>;
  allowOutsideClick?: boolean;
  escapeDeactivates?: boolean;
}

/**
 * Focus trap hook for modals, drawers, and other overlays
 * Implements WCAG 2.1 focus management guidelines
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions = {}
) {
  const {
    isActive = true,
    initialFocus,
    restoreFocus,
    allowOutsideClick = false,
    escapeDeactivates = true
  } = options;

  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const cleanupFunctions = useRef<Array<() => void>>([]);
  const isCleanedUp = useRef(false);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    
    // Store the previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll(FOCUSABLE_ELEMENTS)
      );
    };

    // Handle Tab key navigation with cleanup safety
    const handleTabKey = (e: KeyboardEvent) => {
      try {
        // Early return if component is cleaning up
        if (isCleanedUp.current || !containerRef.current) {
          return;
        }
        
        const focusableElements = getFocusableElements();
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.key === 'Tab') {
          if (e.shiftKey) {
            // Shift + Tab: moving backwards
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab: moving forwards
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      } catch (error) {
        logger.error('Error in handleTabKey:', error as Record<string, unknown>);
        // On error, perform safe cleanup
        safeCleanup();
      }
    };

    // Handle Escape key with cleanup safety
    const handleEscapeKey = (e: KeyboardEvent) => {
      try {
        if (isCleanedUp.current) return;
        
        if (e.key === 'Escape' && escapeDeactivates) {
          e.preventDefault();
          deactivateTrap();
        }
      } catch (error) {
        logger.error('Error in handleEscapeKey:', error as Record<string, unknown>);
        safeCleanup();
      }
    };

    // Handle clicks outside the container with cleanup safety
    const handleOutsideClick = (e: MouseEvent) => {
      try {
        if (isCleanedUp.current || !container) return;
        
        if (!allowOutsideClick && !container.contains(e.target as Node)) {
          e.preventDefault();
          e.stopPropagation();
          
          // Return focus to the container
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0 && focusableElements[0]) {
            focusableElements[0].focus();
          }
        }
      } catch (error) {
        logger.error('Error in handleOutsideClick:', error as Record<string, unknown>);
        safeCleanup();
      }
    };
    
    // Safe cleanup function that ensures all listeners are removed
    const safeCleanup = () => {
      if (isCleanedUp.current) return;
      
      try {
        // Mark as cleaned up first to prevent race conditions
        isCleanedUp.current = true;
        
        // Remove event listeners safely
        if (typeof document !== 'undefined') {
          document.removeEventListener('keydown', handleTabKey);
          document.removeEventListener('keydown', handleEscapeKey);
          document.removeEventListener('mousedown', handleOutsideClick, true);
        }
        
        // Execute any additional cleanup functions
        cleanupFunctions.current.forEach(cleanup => {
          try {
            cleanup();
          } catch (cleanupError) {
            logger.error('Error in focus trap cleanup function:', cleanupError as Record<string, unknown>);
          }
        });
        cleanupFunctions.current = [];
        
      } catch (error) {
        logger.error('Error in safeCleanup:', error as Record<string, unknown>);
      }
    };

    // Activate focus trap with proper error handling
    const activateTrap = () => {
      try {
        if (isCleanedUp.current) return;
        
        // Set initial focus
        const focusableElements = getFocusableElements();
        
        if (initialFocus?.current) {
          initialFocus.current.focus();
        } else if (focusableElements.length > 0 && focusableElements[0]) {
          focusableElements[0].focus();
        }

        // Add event listeners with error handling
        if (typeof document !== 'undefined') {
          document.addEventListener('keydown', handleTabKey);
          document.addEventListener('keydown', handleEscapeKey);
          
          if (!allowOutsideClick) {
            document.addEventListener('mousedown', handleOutsideClick, true);
          }
          
          // Store cleanup functions for reliable cleanup
          cleanupFunctions.current = [
            () => document.removeEventListener('keydown', handleTabKey),
            () => document.removeEventListener('keydown', handleEscapeKey),
            () => document.removeEventListener('mousedown', handleOutsideClick, true)
          ];
        }
      } catch (error) {
        logger.error('Error in activateTrap:', error as Record<string, unknown>);
        safeCleanup();
      }
    };

    // Deactivate focus trap with proper cleanup
    const deactivateTrap = () => {
      try {
        // Perform safe cleanup first
        safeCleanup();

        // Restore focus to previously focused element
        if (!isCleanedUp.current) {
          const elementToFocus = restoreFocus?.current ?? previouslyFocusedElement.current;
          if (elementToFocus) {
            try {
              elementToFocus.focus();
            } catch (focusError) {
              logger.error('Error restoring focus:', focusError as Record<string, unknown>);
            }
          }
        }
      } catch (error) {
        logger.error('Error in deactivateTrap:', error as Record<string, unknown>);
      }
    };

    // Reset cleanup state on activation
    isCleanedUp.current = false;
    
    // Activate the trap
    activateTrap();

    // Cleanup on unmount or when isActive becomes false
    return deactivateTrap;
  }, [isActive, containerRef, initialFocus, restoreFocus, allowOutsideClick, escapeDeactivates]);

  // Return focus management utilities
  return {
    // Focus the first focusable element with safety checks
    focusFirst: () => {
      try {
        if (!containerRef.current || isCleanedUp.current) return;
        
        const focusableElements = Array.from(
          containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
        );

        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement)?.focus();
        }
      } catch (error) {
        logger.error('Error in focusFirst:', error as Record<string, unknown>);
      }
    },

    // Focus the last focusable element with safety checks
    focusLast: () => {
      try {
        if (!containerRef.current || isCleanedUp.current) return;
        
        const focusableElements = Array.from(
          containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
        );

        if (focusableElements.length > 0) {
          const lastElement = focusableElements[focusableElements.length - 1];
          (lastElement as HTMLElement)?.focus();
        }
      } catch (error) {
        logger.error('Error in focusLast:', error as Record<string, unknown>);
      }
    },

    // Check if an element is focusable with safety checks
    isFocusable: (element: HTMLElement) => {
      try {
        if (isCleanedUp.current || !element) return false;
        return element.matches(FOCUSABLE_ELEMENTS);
      } catch (error) {
        logger.error('Error in isFocusable:', error as Record<string, unknown>);
        return false;
      }
    }
  };
}

/**
 * Hook for managing focus within a specific section
 * Useful for complex forms or multi-step workflows
 */
export function useFocusManagement(containerRef: RefObject<HTMLElement>) {
  const moveFocus = (direction: 'next' | 'previous' | 'first' | 'last') => {
    try {
      if (!containerRef.current) return;

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
      );

      if (focusableElements.length === 0) return;

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      switch (direction) {
        case 'first':
          (focusableElements[0] as HTMLElement)?.focus();
          break;
        case 'last':
          const lastElement = focusableElements[focusableElements.length - 1];
          (lastElement as HTMLElement)?.focus();
          break;
        case 'next':
          if (currentIndex < focusableElements.length - 1) {
            const nextElement = focusableElements[currentIndex + 1];
            (nextElement as HTMLElement)?.focus();
          }
          break;
        case 'previous':
          if (currentIndex > 0) {
            const prevElement = focusableElements[currentIndex - 1];
            (prevElement as HTMLElement)?.focus();
          }
          break;
      }
    } catch (error) {
      logger.error('Error in moveFocus:', error as Record<string, unknown>);
    }
  };

  return {
    moveFocus,
    getFocusableCount: () => {
      try {
        if (!containerRef.current) return 0;
        return containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS).length;
      } catch (error) {
        logger.error('Error in getFocusableCount:', error as Record<string, unknown>);
        return 0;
      }
    },
    getCurrentFocusIndex: () => {
      try {
        if (!containerRef.current) return -1;
        const focusableElements = Array.from(
          containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
        );
        return focusableElements.indexOf(document.activeElement as HTMLElement);
      } catch (error) {
        logger.error('Error in getCurrentFocusIndex:', error as Record<string, unknown>);
        return -1;
      }
    }
  };
}

/**
 * Hook for managing focus announcements to screen readers
 */
export function useFocusAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    try {
      if (typeof document === 'undefined' || !document.body) return;
      
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // Remove after announcement with cleanup safety
      const cleanup = setTimeout(() => {
        try {
          if (announcement && announcement.parentNode === document.body) {
            document.body.removeChild(announcement);
          }
        } catch (error) {
          logger.error('Error removing focus announcement:', error as Record<string, unknown>);
        }
      }, 1000);

      // Return cleanup function for manual cleanup if needed
      return () => {
        clearTimeout(cleanup);
        try {
          if (announcement && announcement.parentNode === document.body) {
            document.body.removeChild(announcement);
          }
        } catch (error) {
          logger.error('Error in manual focus announcement cleanup:', error as Record<string, unknown>);
        }
      };
    } catch (error) {
      logger.error('Error creating focus announcement:', error as Record<string, unknown>);
      return () => {}; // Return empty cleanup function
    }
  };

  return { announce };
}