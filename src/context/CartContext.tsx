'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { logger } from '@/lib/logger';
import SafeLocalStorage from '@/lib/safe-localstorage';

import { Core } from '@/types/TYPE_REGISTRY';
import { WCProduct } from '@/types/woocommerce';
import { ecommerceEvent, funnelEvent } from '@/lib/gtag';
import { parseCartData, compareVariations, validateCartItem } from '@/lib/cart-validation';
import { Money } from '@/lib/money';

// Safe price parsing helpers
const parsePrice = (price: Core.Money | undefined, context: string): { success: boolean; value: number } => {
  if (price === undefined || price === null) {
    return { success: false, value: 0 };
  }
  return { success: true, value: price.toNumber() };
};

const safePriceMultiply = (price: number, quantity: number, context: string): { success: boolean; value: Core.Money } => {
  try {
    const priceAsMoney = Money.pesos(price);
    const result = priceAsMoney.multiply(quantity);
    return { success: true, value: result };
  } catch (error) {
    logger.error(`Price multiplication failed in ${context}`, { error, price, quantity });
    return { success: false, value: Money.ZERO };
  }
};

export interface CartItem {
  product: WCProduct;
  quantity: number;
  variation?: {
    id: number;
    attributes: Record<string, string>;
  };
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  total: Core.Money;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: WCProduct; quantity?: number; variation?: CartItem['variation'] } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number; variationId?: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number; variationId?: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  isOpen: false,
  total: Money.ZERO,
  itemCount: 0,
};

const calculateTotals = (items: CartItem[]): { total: Core.Money; itemCount: number } => {
  const MAX_SAFE_QUANTITY = 9999; // Max reasonable quantity

  const total = items.reduce((sum, item) => {
    const price = item.product.price || Money.ZERO;
    const quantity = Math.min(item.quantity, MAX_SAFE_QUANTITY);

    try {
      const itemTotal = price.multiply(quantity);
      return sum.add(itemTotal);
    } catch (error) {
      logger.error('Cart item calculation failed', {
        error,
        productId: item.product.id,
        price: item.product.price,
        quantity: item.quantity
      });
      return sum; // Skip this item to prevent errors
    }
  }, Money.ZERO);

  const itemCount = items.reduce((sum, item) => {
    const quantity = Math.min(item.quantity, MAX_SAFE_QUANTITY);
    return sum + quantity;
  }, 0);

  return { total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1, variation } = action.payload;
      const existingItemIndex = state.items.findIndex(item => 
        item.product.id === product.id && 
        compareVariations(item.variation, variation)
      );

      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, { product, quantity, variation }];
      }

      const { total, itemCount } = calculateTotals(newItems);
      
      return {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'REMOVE_ITEM': {
      const { productId, variationId } = action.payload;
      const newItems = state.items.filter(item => 
        !(item.product.id === productId && 
          (variationId === undefined || item.variation?.id === variationId))
      );

      const { total, itemCount } = calculateTotals(newItems);

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity, variationId } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId, variationId } });
      }

      const newItems = state.items.map(item => {
        if (item.product.id === productId && 
            (variationId === undefined || item.variation?.id === variationId)) {
          return { ...item, quantity };
        }
        return item;
      });

      const { total, itemCount } = calculateTotals(newItems);

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: Money.ZERO,
        itemCount: 0,
      };

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };

    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true,
      };

    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };

    case 'LOAD_CART': {
      const { total, itemCount } = calculateTotals(action.payload);
      return {
        ...state,
        items: action.payload,
        total,
        itemCount,
      };
    }

    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (product: WCProduct, quantity?: number, variation?: CartItem['variation']) => void;
  removeItem: (productId: number, variationId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  isInCart: (productId: number, variationId?: number) => boolean;
  getItemQuantity: (productId: number, variationId?: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Safe version for components that might render outside CartProvider
export const useSafeCart = () => {
  const context = useContext(CartContext);
  return context || null;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isMounted, setIsMounted] = useState(false);

  // Track mounted state to prevent localStorage access during SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load cart from localStorage on mount with validation - only after mounting
  useEffect(() => {
    if (!isMounted) return;

    try {
      const savedCart = SafeLocalStorage.getItem('agriko-cart');
      if (savedCart) {
        const cartItems = parseCartData(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      }
    } catch (error) {
      logger.error('Error loading cart from localStorage', { error: error instanceof Error ? error.message : String(error) });
      // Clear corrupted cart data
      SafeLocalStorage.removeItem('agriko-cart');
    }
  }, [isMounted]);

  // Save cart to localStorage whenever it changes - only after mounting
  useEffect(() => {
    if (!isMounted) return;

    try {
      SafeLocalStorage.setJSON('agriko-cart', state.items);
    } catch (error) {
      logger.error('Error saving cart to localStorage', { error: error instanceof Error ? error.message : String(error) });
    }
  }, [state.items, isMounted]);

  // Track cart view in funnel when cart is opened
  useEffect(() => {
    if (state.isOpen) {
      funnelEvent.viewCart(state.itemCount, state.total.toNumber());
    }
  }, [state.isOpen, state.itemCount, state.total]);

  const addItem = useCallback((product: WCProduct, quantity = 1, variation?: CartItem['variation']) => {
    // Check if product is defined first
    if (!product) {
      logger.error('Invalid cart item, refusing to add undefined product');
      return;
    }

    // Validate cart item before adding
    if (!validateCartItem(product, quantity, variation)) {
      logger.error('Invalid cart item, refusing to add', {
        productId: product?.id,
        productName: product?.name,
        quantity,
        productKeys: product ? Object.keys(product) : [],
        hasRequiredFields: product ? {
          hasId: 'id' in product,
          hasName: 'name' in product,
          hasSlug: 'slug' in product,
          hasPrice: 'price' in product
        } : null
      });
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, variation } });

    // Track add to cart event in GA4
    const priceResult = parsePrice(product.price, `addToCart ${product.name}`);
    const price = priceResult.success ? priceResult.value : 0;
    const category = product.categories?.[0]?.name ?? 'Uncategorized';
    ecommerceEvent.addToCart(
      product.id.toString(),
      product.name,
      category,
      price,
      quantity
    );

    // Track funnel progression with safe multiplication
    const totalPriceResult = safePriceMultiply(price, quantity, `funnelEvent ${product.name}`);
    const totalPrice = totalPriceResult.success ? totalPriceResult.value.toNumber() : 0;
    funnelEvent.addToCart(
      product.id.toString(),
      product.name,
      totalPrice
    );

    // Track add to cart with Google Analytics (already handled in ProductCard)
    // No need to duplicate here as this is called from ProductCard
  }, []);

  const removeItem = useCallback((productId: number, variationId?: number) => {
    // Get item details before removing for GA tracking
    const item = state.items.find(item =>
      item.product.id === productId &&
      (variationId === undefined || item.variation?.id === variationId)
    );

    dispatch({ type: 'REMOVE_ITEM', payload: { productId, variationId } });

    // Track remove from cart event in GA4
    if (item) {
      const priceResult = parsePrice(item.product.price, `removeFromCart ${item.product.name}`);
      const price = priceResult.success ? priceResult.value : 0;
      const category = item.product.categories?.[0]?.name ?? 'Uncategorized';
      ecommerceEvent.removeFromCart(
        item.product.id.toString(),
        item.product.name,
        category,
        price,
        item.quantity
      );

      // Google Analytics tracking already handled above
    }
  }, [state.items]);

  const updateQuantity = useCallback((productId: number, quantity: number, variationId?: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity, variationId } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const toggleCart = useCallback(() => {
    dispatch({ type: 'TOGGLE_CART' });

    // Track cart view when opened
    if (!state.isOpen) {
      funnelEvent.viewCart(state.itemCount, state.total.toNumber());
    }
  }, [state.isOpen, state.itemCount, state.total]);

  const openCart = useCallback(() => {
    dispatch({ type: 'OPEN_CART' });

    // Track cart view when opened
    funnelEvent.viewCart(state.itemCount, state.total.toNumber());
  }, [state.itemCount, state.total]);

  const closeCart = useCallback(() => {
    dispatch({ type: 'CLOSE_CART' });
  }, []);

  const isInCart = useCallback((productId: number, variationId?: number): boolean => {
    return state.items.some(item =>
      item.product.id === productId &&
      (variationId === undefined || item.variation?.id === variationId)
    );
  }, [state.items]);

  const getItemQuantity = useCallback((productId: number, variationId?: number): number => {
    const item = state.items.find(item =>
      item.product.id === productId &&
      (variationId === undefined || item.variation?.id === variationId)
    );
    return item ? item.quantity : 0;
  }, [state.items]);

  const contextValue: CartContextType = useMemo(() => ({
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    isInCart,
    getItemQuantity,
  }), [state, addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart, isInCart, getItemQuantity]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};