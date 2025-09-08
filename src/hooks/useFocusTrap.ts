'use client';

import { useEffect, useRef, RefObject } from 'react';

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

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    
    // Store the previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll(FOCUSABLE_ELEMENTS)
      ) as HTMLElement[];
    };

    // Handle Tab key navigation
    const handleTabKey = (e: KeyboardEvent) => {
      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab: moving backwards
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Handle Escape key
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escapeDeactivates) {
        e.preventDefault();
        deactivateTrap();
      }
    };

    // Handle clicks outside the container
    const handleOutsideClick = (e: MouseEvent) => {
      if (!allowOutsideClick && container && !container.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        
        // Return focus to the container
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    // Activate focus trap
    const activateTrap = () => {
      // Set initial focus
      const focusableElements = getFocusableElements();
      
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      // Add event listeners
      document.addEventListener('keydown', handleTabKey);
      document.addEventListener('keydown', handleEscapeKey);
      if (!allowOutsideClick) {
        document.addEventListener('mousedown', handleOutsideClick, true);
      }
    };

    // Deactivate focus trap
    const deactivateTrap = () => {
      // Remove event listeners
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleOutsideClick, true);

      // Restore focus to previously focused element
      const elementToFocus = restoreFocus?.current || previouslyFocusedElement.current;
      if (elementToFocus) {
        elementToFocus.focus();
      }
    };

    // Activate the trap
    activateTrap();

    // Cleanup on unmount or when isActive becomes false
    return deactivateTrap;
  }, [isActive, containerRef, initialFocus, restoreFocus, allowOutsideClick, escapeDeactivates]);

  // Return focus management utilities
  return {
    // Focus the first focusable element
    focusFirst: () => {
      if (!containerRef.current) return;
      
      const focusableElements = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
      ) as HTMLElement[];
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    },

    // Focus the last focusable element
    focusLast: () => {
      if (!containerRef.current) return;
      
      const focusableElements = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
      ) as HTMLElement[];
      
      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus();
      }
    },

    // Check if an element is focusable
    isFocusable: (element: HTMLElement) => {
      return element.matches(FOCUSABLE_ELEMENTS);
    }
  };
}

/**
 * Hook for managing focus within a specific section
 * Useful for complex forms or multi-step workflows
 */
export function useFocusManagement(containerRef: RefObject<HTMLElement>) {
  const moveFocus = (direction: 'next' | 'previous' | 'first' | 'last') => {
    if (!containerRef.current) return;

    const focusableElements = Array.from(
      containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    switch (direction) {
      case 'first':
        focusableElements[0].focus();
        break;
      case 'last':
        focusableElements[focusableElements.length - 1].focus();
        break;
      case 'next':
        if (currentIndex < focusableElements.length - 1) {
          focusableElements[currentIndex + 1].focus();
        }
        break;
      case 'previous':
        if (currentIndex > 0) {
          focusableElements[currentIndex - 1].focus();
        }
        break;
    }
  };

  return {
    moveFocus,
    getFocusableCount: () => {
      if (!containerRef.current) return 0;
      return containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS).length;
    },
    getCurrentFocusIndex: () => {
      if (!containerRef.current) return -1;
      const focusableElements = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS)
      );
      return focusableElements.indexOf(document.activeElement as HTMLElement);
    }
  };
}

/**
 * Hook for managing focus announcements to screen readers
 */
export function useFocusAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
}