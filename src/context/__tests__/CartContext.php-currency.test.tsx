/**
 * Cart Context PHP Currency Test
 * Verify cart calculations work correctly with PHP centavos
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { Core } from '@/types/TYPE_REGISTRY';
import { WCProduct } from '@/types/woocommerce';
import { Money } from '@/lib/money';

// Mock dependencies
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
  validateCartItem: jest.fn(() => true),
}));

// No need to mock @/lib/php-currency since we're using Money class directly

// Create test products with Money instances
const mockProducts: WCProduct[] = [
  {
    id: 1,
    name: 'Rice 25kg',
    slug: 'rice-25kg',
    price: Money.pesos(1299), // ₱1,299.00
    regular_price: Money.pesos(1399), // ₱1,399.00
    sale_price: Money.pesos(1299), // ₱1,299.00
    on_sale: true,
    stock_status: 'instock',
    categories: [],
    images: [],
  },
  {
    id: 2,
    name: 'Cooking Oil 1L',
    slug: 'cooking-oil-1l',
    price: Money.pesos(89.50), // ₱89.50
    regular_price: Money.pesos(89.50),
    sale_price: null,
    stock_status: 'instock',
    categories: [],
    images: [],
  },
  {
    id: 3,
    name: 'Sugar 1kg',
    slug: 'sugar-1kg',
    price: Money.pesos(65.75), // ₱65.75
    regular_price: Money.pesos(65.75),
    sale_price: null,
    stock_status: 'instock',
    categories: [],
    images: [],
  },
  {
    id: 4,
    name: 'Salt 500g',
    slug: 'salt-500g',
    price: Money.pesos(25.50), // ₱25.50
    regular_price: Money.pesos(25.50),
    sale_price: null,
    stock_status: 'instock',
    categories: [],
    images: [],
  },
];

// Test component that uses cart
const TestComponent = ({ onUpdate }: { onUpdate: (cart: any) => void }) => {
  const cart = useCart();

  React.useEffect(() => {
    onUpdate(cart);
  }, [cart, onUpdate]);

  return null;
};

describe('CartContext with PHP Currency', () => {
  let cartState: any = null;

  const renderWithCart = () => {
    return render(
      <CartProvider>
        <TestComponent onUpdate={(state) => { cartState = state; }} />
      </CartProvider>
    );
  };

  beforeEach(() => {
    cartState = null;
    jest.clearAllMocks();
  });

  describe('Adding items with PHP prices', () => {
    it('should calculate single item total correctly', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0]); // Rice ₱1,299.00
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(1299); // Pesos
        expect(cartState.state.itemCount).toBe(1);
      });
    });

    it('should calculate multiple items total correctly', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0]); // Rice ₱1,299.00
        cartState.addItem(mockProducts[1]); // Oil ₱89.50
        cartState.addItem(mockProducts[2]); // Sugar ₱65.75
      });

      await waitFor(() => {
        // 1299 + 89.50 + 65.75 = 1454.25 pesos
        expect(cartState.state.total.pesos).toBe(1454.25);
        expect(cartState.state.itemCount).toBe(3);
      });
    });

    it('should handle quantities correctly', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[1], 2); // Oil ₱89.50 x 2
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(179); // ₱179.00
        expect(cartState.state.itemCount).toBe(2);
      });
    });

    it('should handle centavo amounts correctly', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[3], 3); // Salt ₱25.50 x 3
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(76.5); // ₱76.50
        expect(cartState.state.itemCount).toBe(3);
      });
    });
  });

  describe('Complex cart scenarios', () => {
    it('should handle typical shopping cart with mixed items', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0], 1); // Rice ₱1,299.00 x 1
        cartState.addItem(mockProducts[1], 2); // Oil ₱89.50 x 2
        cartState.addItem(mockProducts[2], 3); // Sugar ₱65.75 x 3
      });

      await waitFor(() => {
        // 1299 + (89.50 * 2) + (65.75 * 3) = 1299 + 179 + 197.25 = 1675.25
        expect(cartState.state.total.pesos).toBe(1675.25); // ₱1,675.25
        expect(cartState.state.itemCount).toBe(6);
      });
    });

    it('should update total when quantity changes', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0], 1); // Rice ₱1,299.00
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(1299);
      });

      await act(async () => {
        cartState.updateQuantity(mockProducts[0]?.id || 1, 2);
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(2598); // ₱2,598.00
        expect(cartState.state.itemCount).toBe(2);
      });
    });

    it('should handle removing items correctly', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0]); // Rice ₱1,299.00
        cartState.addItem(mockProducts[1]); // Oil ₱89.50
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(1388.5); // ₱1,388.50
      });

      await act(async () => {
        cartState.removeItem(mockProducts[1]?.id || 2);
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(1299); // ₱1,299.00
        expect(cartState.state.itemCount).toBe(1);
      });
    });

    it('should handle clearing cart', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0]);
        cartState.addItem(mockProducts[1]);
        cartState.addItem(mockProducts[2]);
      });

      await waitFor(() => {
        expect(cartState.state.total).toBeGreaterThan(0);
      });

      await act(async () => {
        cartState.clearCart();
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(0);
        expect(cartState.state.itemCount).toBe(0);
        expect(cartState.state.items).toHaveLength(0);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle products without prices', async () => {
      renderWithCart();

      const productWithoutPrice: WCProduct = {
        ...mockProducts[0],
        price: Money.ZERO,
      } as WCProduct;

      await act(async () => {
        cartState.addItem(productWithoutPrice);
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(0);
        expect(cartState.state.itemCount).toBe(1);
      });
    });

    it('should handle very large quantities safely', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[3], 9999); // Max quantity
      });

      await waitFor(() => {
        // 25.50 * 9999 = 254,974.50 pesos
        expect(cartState.state.total.pesos).toBe(254974.5);
        expect(cartState.state.itemCount).toBe(9999);
      });
    });

    it('should handle zero quantity', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0], 1);
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(1299);
      });

      await act(async () => {
        cartState.updateQuantity(mockProducts[0]?.id || 1, 0);
      });

      await waitFor(() => {
        expect(cartState.state.total.pesos).toBe(0);
        expect(cartState.state.items).toHaveLength(0);
      });
    });
  });

  describe('Price formatting', () => {
    it('should provide correct values for display', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0]); // ₱1,299.00
      });

      await waitFor(() => {
        const total = cartState.state.total;
        expect(total.pesos).toBe(1299);

        // Test that the value can be formatted for display
        const displayPrice = total.pesos.toFixed(2);
        expect(displayPrice).toBe('1299.00');

        // With proper formatting using Money's format method
        const formatted = total.format();
        expect(formatted).toBe('₱1299.00');
      });
    });
  });
});