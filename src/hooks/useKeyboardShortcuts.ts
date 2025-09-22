'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for managing keyboard shortcuts throughout the application
 * Provides consistent keyboard navigation and accessibility features
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventDefault = true
}: UseKeyboardShortcutsOptions) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const matchedShortcut = shortcuts.find(shortcut => {
      if (shortcut.disabled) return false;
      if (!event.key || !shortcut.key) return false;

      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === !!event.ctrlKey;
      const metaMatch = !!shortcut.metaKey === !!event.metaKey;
      const shiftMatch = !!shortcut.shiftKey === !!event.shiftKey;
      const altMatch = !!shortcut.altKey === !!event.altKey;
      
      return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
    });
    
    if (matchedShortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      matchedShortcut.action();
    }
  }, [shortcuts, enabled, preventDefault]);
  
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
  
  return {
    shortcuts: shortcuts.filter(s => !s.disabled),
    enabled
  };
}

/**
 * Common keyboard shortcuts for e-commerce applications
 */
export function useCommerceKeyboardShortcuts({
  onSearch,
  onCart,
  onHome,
  onProducts,
  onHelp,
  enabled = true
}: {
  onSearch?: () => void;
  onCart?: () => void;
  onHome?: () => void;
  onProducts?: () => void;
  onHelp?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      action: () => onSearch?.(),
      description: 'Open search',
      disabled: !onSearch
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => onSearch?.(),
      description: 'Open search (Ctrl+K)',
      disabled: !onSearch
    },
    {
      key: 'k',
      metaKey: true,
      action: () => onSearch?.(),
      description: 'Open search (Cmd+K)',
      disabled: !onSearch
    },
    {
      key: 'c',
      altKey: true,
      action: () => onCart?.(),
      description: 'Open cart (Alt+C)',
      disabled: !onCart
    },
    {
      key: 'h',
      altKey: true,
      action: () => onHome?.(),
      description: 'Go to home (Alt+H)',
      disabled: !onHome
    },
    {
      key: 'p',
      altKey: true,
      action: () => onProducts?.(),
      description: 'Go to products (Alt+P)',
      disabled: !onProducts
    },
    {
      key: '?',
      shiftKey: true,
      action: () => onHelp?.(),
      description: 'Show keyboard shortcuts (?)',
      disabled: !onHelp
    }
  ];
  
  return useKeyboardShortcuts({
    shortcuts,
    enabled
  });
}

/**
 * Hook for managing modal/dialog keyboard shortcuts
 */
export function useModalKeyboardShortcuts({
  onClose,
  onConfirm,
  _onCancel,
  enabled = true
}: {
  onClose?: () => void;
  onConfirm?: () => void;
  _onCancel?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Escape',
      action: () => onClose?.(),
      description: 'Close modal (Escape)',
      disabled: !onClose
    },
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => onConfirm?.(),
      description: 'Confirm action (Ctrl+Enter)',
      disabled: !onConfirm
    },
    {
      key: 'Enter',
      metaKey: true,
      action: () => onConfirm?.(),
      description: 'Confirm action (Cmd+Enter)',
      disabled: !onConfirm
    }
  ];
  
  return useKeyboardShortcuts({
    shortcuts,
    enabled
  });
}

/**
 * Hook for product navigation shortcuts
 */
export function useProductKeyboardShortcuts({
  onAddToCart,
  onQuickView,
  onWishlist,
  onCompare,
  enabled = true
}: {
  onAddToCart?: () => void;
  onQuickView?: () => void;
  onWishlist?: () => void;
  onCompare?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'a',
      action: () => onAddToCart?.(),
      description: 'Add to cart (A)',
      disabled: !onAddToCart
    },
    {
      key: 'q',
      action: () => onQuickView?.(),
      description: 'Quick view (Q)',
      disabled: !onQuickView
    },
    {
      key: 'w',
      action: () => onWishlist?.(),
      description: 'Add to wishlist (W)',
      disabled: !onWishlist
    },
    {
      key: 'c',
      action: () => onCompare?.(),
      description: 'Compare product (C)',
      disabled: !onCompare
    }
  ];
  
  return useKeyboardShortcuts({
    shortcuts,
    enabled,
    preventDefault: false // Allow normal typing in forms
  });
}

/**
 * Utility to format keyboard shortcuts for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const keys: string[] = [];
  
  if (shortcut.ctrlKey) keys.push('Ctrl');
  if (shortcut.metaKey) keys.push('Cmd');
  if (shortcut.altKey) keys.push('Alt');
  if (shortcut.shiftKey) keys.push('Shift');
  
  keys.push(shortcut.key.toUpperCase());
  
  return keys.join(' + ');
}