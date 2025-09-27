'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { WCProduct } from '@/types/woocommerce';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

interface WishlistState {
  items: WCProduct[];
  isOpen: boolean;
}

type WishlistAction =
  | { type: 'ADD_ITEM'; payload: WCProduct }
  | { type: 'REMOVE_ITEM'; payload: number } // product id
  | { type: 'TOGGLE_WISHLIST' }
  | { type: 'OPEN_WISHLIST' }
  | { type: 'CLOSE_WISHLIST' }
  | { type: 'LOAD_WISHLIST'; payload: WCProduct[] }
  | { type: 'CLEAR_WISHLIST' };

const initialState: WishlistState = {
  items: [],
  isOpen: false,
};

const wishlistReducer = (state: WishlistState, action: WishlistAction): WishlistState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const product = action.payload;
      // Check if already in wishlist
      if (state.items.some(item => item.id === product.id)) {
        return state;
      }
      return {
        ...state,
        items: [...state.items, product],
      };
    }

    case 'REMOVE_ITEM': {
      const productId = action.payload;
      return {
        ...state,
        items: state.items.filter(item => item.id !== productId),
      };
    }

    case 'TOGGLE_WISHLIST':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_WISHLIST':
      return { ...state, isOpen: true };

    case 'CLOSE_WISHLIST':
      return { ...state, isOpen: false };

    case 'LOAD_WISHLIST':
      return { ...state, items: action.payload };

    case 'CLEAR_WISHLIST':
      return { ...state, items: [] };

    default:
      return state;
  }
};

interface WishlistContextType {
  state: WishlistState;
  addItem: (product: WCProduct) => void;
  removeItem: (productId: number) => void;
  toggleWishlist: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
  clearWishlist: () => void;
  isInWishlist: (productId: number) => boolean;
  moveToCart: (product: WCProduct) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('agriko-wishlist');
      if (savedWishlist) {
        const items = JSON.parse(savedWishlist);
        dispatch({ type: 'LOAD_WISHLIST', payload: items });
      }
    } catch (error) {
      logger.error('Error loading wishlist from localStorage:', error as Record<string, unknown>);
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('agriko-wishlist', JSON.stringify(state.items));
    } catch (error) {
      logger.error('Error saving wishlist to localStorage:', error as Record<string, unknown>);
    }
  }, [state.items]);

  const addItem = (product: WCProduct) => {
    if (!product) {
      logger.error('Cannot add undefined product to wishlist');
      return;
    }

    if (state.items.some(item => item.id === product.id)) {
      toast('Already in wishlist', {
        icon: '❤️',
        duration: 2000,
      });
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: product });
    toast.success(`${product.name} added to wishlist!`, {
      icon: '❤️',
      duration: 3000,
    });

    logger.info('Product added to wishlist', {
      productId: product.id,
      productName: product.name
    });
  };

  const removeItem = (productId: number) => {
    const product = state.items.find(item => item.id === productId);
    dispatch({ type: 'REMOVE_ITEM', payload: productId });

    if (product) {
      toast.success(`${product.name} removed from wishlist`, {
        duration: 2000,
      });
    }

    logger.info('Product removed from wishlist', { productId });
  };

  const toggleWishlist = () => {
    dispatch({ type: 'TOGGLE_WISHLIST' });
  };

  const openWishlist = () => {
    dispatch({ type: 'OPEN_WISHLIST' });
  };

  const closeWishlist = () => {
    dispatch({ type: 'CLOSE_WISHLIST' });
  };

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' });
    toast.success('Wishlist cleared');
    logger.info('Wishlist cleared');
  };

  const isInWishlist = (productId: number) => {
    return state.items.some(item => item.id === productId);
  };

  const moveToCart = (product: WCProduct) => {
    // This will be implemented when we integrate with cart
    removeItem(product.id);
    toast.success(`${product.name} moved to cart!`);
  };

  return (
    <WishlistContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        toggleWishlist,
        openWishlist,
        closeWishlist,
        clearWishlist,
        isInWishlist,
        moveToCart,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}