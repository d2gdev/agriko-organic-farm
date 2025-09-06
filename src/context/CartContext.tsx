'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { WCProduct } from '@/types/woocommerce';

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
  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.product.price) || 0;
    return sum + (price * item.quantity);
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1, variation } = action.payload;
      const existingItemIndex = state.items.findIndex(item => 
        item.product.id === product.id && 
        JSON.stringify(item.variation) === JSON.stringify(variation)
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

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('agriko-cart');
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('agriko-cart', JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state.items]);

  const addItem = (product: WCProduct, quantity = 1, variation?: CartItem['variation']) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, variation } });
  };

  const removeItem = (productId: number, variationId?: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, variationId } });
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