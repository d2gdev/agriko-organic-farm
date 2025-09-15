'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { logger } from '@/lib/logger';
import SafeLocalStorage from '@/lib/safe-localstorage';

import { WCProduct } from '@/types/woocommerce';
import { ecommerceEvent, funnelEvent } from '@/lib/gtag';
import { parseCartData, compareVariations, validateCartItem } from '@/lib/cart-validation';
import { parsePrice, safePriceMultiply } from '@/lib/price-validation';

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
  total: number;
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
  total: 0,
  itemCount: 0,
};

const calculateTotals = (items: CartItem[]): { total: number; itemCount: number } => {
  const MAX_SAFE_CURRENCY = 999999999; // Max safe currency value
  const MAX_SAFE_QUANTITY = 9999; // Max reasonable quantity
  
  const total = items.reduce((sum, item) => {
    const multiplyResult = safePriceMultiply(
      item.product.price, 
      Math.min(item.quantity, MAX_SAFE_QUANTITY),
      `CartItem ${item.product.name}`
    );
    
    if (!multiplyResult.success) {
      logger.error('Cart item calculation failed', { 
        error: multiplyResult.error,
        productId: item.product.id,
        price: item.product.price,
        quantity: item.quantity
      });
      return sum; // Skip this item to prevent errors
    }
    
    const itemTotal = multiplyResult.value;
    
    // Check for overflow before addition
    if (sum > MAX_SAFE_CURRENCY - itemTotal) {
      logger.error('Cart total overflow detected', { 
        currentSum: sum, 
        itemTotal, 
        productId: item.product.id 
      });
      return MAX_SAFE_CURRENCY; // Cap at maximum safe value
    }
    
    return sum + itemTotal;
  }, 0);

  const itemCount = items.reduce((sum, item) => {
    const quantity = Math.min(item.quantity, MAX_SAFE_QUANTITY);
    return sum + quantity;
  }, 0);

  return { total: Math.min(total, MAX_SAFE_CURRENCY), itemCount };
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
        total: 0,
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

    case 'LOAD_CART':
      const { total, itemCount } = calculateTotals(action.payload);
      return {
        ...state,
        items: action.payload,
        total,
        itemCount,
      };

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

  // Load cart from localStorage on mount with validation
  useEffect(() => {
    try {
      const savedCart = SafeLocalStorage.getItem('agriko-cart');
      if (savedCart) {
        const cartItems = parseCartData(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      }
    } catch (error) {
      logger.error('Error loading cart from localStorage:', error as Record<string, unknown>);
      // Clear corrupted cart data
      SafeLocalStorage.removeItem('agriko-cart');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      SafeLocalStorage.setJSON('agriko-cart', state.items);
    } catch (error) {
      logger.error('Error saving cart to localStorage:', error as Record<string, unknown>);
    }
  }, [state.items]);

  // Track cart view in funnel when cart is opened
  useEffect(() => {
    if (state.isOpen) {
      funnelEvent.viewCart(state.itemCount, state.total);
    }
  }, [state.isOpen, state.itemCount, state.total]);

  const addItem = (product: WCProduct, quantity = 1, variation?: CartItem['variation']) => {
    // Validate cart item before adding
    if (!validateCartItem(product, quantity, variation)) {
      logger.error('Invalid cart item, refusing to add');
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
    const totalPrice = totalPriceResult.success ? totalPriceResult.value : 0;
    funnelEvent.addToCart(
      product.id.toString(),
      product.name,
      totalPrice
    );
  };

  const removeItem = (productId: number, variationId?: number) => {
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
    }
  };

  const updateQuantity = (productId: number, quantity: number, variationId?: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity, variationId } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const isInCart = (productId: number, variationId?: number): boolean => {
    return state.items.some(item => 
      item.product.id === productId && 
      (variationId === undefined || item.variation?.id === variationId)
    );
  };

  const getItemQuantity = (productId: number, variationId?: number): number => {
    const item = state.items.find(item => 
      item.product.id === productId && 
      (variationId === undefined || item.variation?.id === variationId)
    );
    return item ? item.quantity : 0;
  };

  const contextValue: CartContextType = {
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
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};