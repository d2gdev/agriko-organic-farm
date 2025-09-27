/**
 * Simple Cart Context Test
 * Debug cart calculations with PHP centavos
 */

import React from 'react';
import { Core } from '@/types/TYPE_REGISTRY';
import { render, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { Money } from '@/lib/money';

// Minimal mocks
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  }
}));

jest.mock('@/lib/safe-localstorage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    setJSON: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
}));

jest.mock('@/lib/gtag', () => ({
  ecommerceEvent: {
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
  },
  funnelEvent: {
    addToCart: jest.fn(),
    viewCart: jest.fn(),
  }
}));

jest.mock('@/lib/cart-validation', () => ({
  parseCartData: jest.fn((data) => data),
  compareVariations: jest.fn((a, b) => a?.id === b?.id),
  validateCartItem: jest.fn(() => {
    console.log('Mock validateCartItem called');
    return true;
  }),
}));

// No need to mock @/lib/php-currency since we're using Money class directly

// Test component
const TestCart = () => {
  const cart = useCart();

  // Expose cart for testing
  // @ts-expect-error Test utility
  window.testCart = cart;

  return (
    <div>
      <div data-testid="total">{cart.state.total.toNumber()}</div>
      <div data-testid="count">{cart.state.itemCount}</div>
      <div data-testid="items">{cart.state.items.length}</div>
    </div>
  );
};

describe('Simple Cart Test', () => {
  it('should add a product and calculate total', async () => {
    const { getByTestId } = render(
      <CartProvider>
        <TestCart />
      </CartProvider>
    );

    // Initial state
    expect(getByTestId('total').textContent).toBe('0');
    expect(getByTestId('count').textContent).toBe('0');
    expect(getByTestId('items').textContent).toBe('0');

    // Add a product
    const product = {
      id: 1,
      name: 'Test Product',
      slug: 'test',
      price: Money.pesos(100), // ₱100.00
      categories: [],
      images: [],
    };

    console.log('Adding product:', product);

    await act(async () => {
      // @ts-expect-error Test utility
      const cart = window.testCart;
      console.log('Cart before add:', cart.state);
      cart.addItem(product, 1);
      console.log('Cart after add:', cart.state);
    });

    // Wait for state update
    await waitFor(() => {
      expect(getByTestId('total').textContent).toBe('100');
      expect(getByTestId('count').textContent).toBe('1');
      expect(getByTestId('items').textContent).toBe('1');
    });
  });
});