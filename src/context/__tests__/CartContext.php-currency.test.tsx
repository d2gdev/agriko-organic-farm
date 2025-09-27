/**
 * Cart Context PHP Currency Test
 * Verify cart calculations work correctly with PHP centavos
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { Core } from '@/types/TYPE_REGISTRY';
import { WCProduct } from '@/types/woocommerce';

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

jest.mock('@/lib/php-currency', () => ({
  PHPCurrency: {
    multiply: jest.fn((price, quantity) => price * quantity),
    add: jest.fn((a, b) => a + b),
    format: jest.fn((price) => `₱${(price / 100).toFixed(2)}`),
  }
}));

// Create test products with PHP prices in centavos
const mockProducts: WCProduct[] = [
  {
    id: 1,
    name: 'Rice 25kg',
    slug: 'rice-25kg',
    price: 129900 as Core.Money, // ₱1,299.00
    regular_price: 139900 as Core.Money, // ₱1,399.00
    sale_price: 129900 as Core.Money, // ₱1,299.00
    on_sale: true,
    stock_status: 'instock',
    categories: [],
    images: [],
  },
  {
    id: 2,
    name: 'Cooking Oil 1L',
    slug: 'cooking-oil-1l',
    price: 8950 as Core.Money, // ₱89.50
    regular_price: 8950 as Core.Money,
    stock_status: 'instock',
    categories: [],
    images: [],
  },
  {
    id: 3,
    name: 'Sugar 1kg',
    slug: 'sugar-1kg',
    price: 6575 as Core.Money, // ₱65.75
    regular_price: 6575 as Core.Money,
    stock_status: 'instock',
    categories: [],
    images: [],
  },
  {
    id: 4,
    name: 'Salt 500g',
    slug: 'salt-500g',
    price: 2550 as Core.Money, // ₱25.50
    regular_price: 2550 as Core.Money,
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
        expect(cartState.state.total).toBe(129900); // Centavos
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
        // 129900 + 8950 + 6575 = 145425 centavos (₱1,454.25)
        expect(cartState.state.total).toBe(145425);
        expect(cartState.state.itemCount).toBe(3);
      });
    });

    it('should handle quantities correctly', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[1], 2); // Oil ₱89.50 x 2
      });

      await waitFor(() => {
        expect(cartState.state.total).toBe(17900); // ₱179.00
        expect(cartState.state.itemCount).toBe(2);
      });
    });

    it('should handle centavo amounts correctly', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[3], 3); // Salt ₱25.50 x 3
      });

      await waitFor(() => {
        expect(cartState.state.total).toBe(7650); // ₱76.50
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
        // 129900 + (8950 * 2) + (6575 * 3) = 129900 + 17900 + 19725 = 167525
        expect(cartState.state.total).toBe(167525); // ₱1,675.25
        expect(cartState.state.itemCount).toBe(6);
      });
    });

    it('should update total when quantity changes', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0], 1); // Rice ₱1,299.00
      });

      await waitFor(() => {
        expect(cartState.state.total).toBe(129900);
      });

      await act(async () => {
        cartState.updateQuantity(mockProducts[0]?.id || 1, 2);
      });

      await waitFor(() => {
        expect(cartState.state.total).toBe(259800); // ₱2,598.00
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
        expect(cartState.state.total).toBe(138850); // ₱1,388.50
      });

      await act(async () => {
        cartState.removeItem(mockProducts[1]?.id || 2);
      });

      await waitFor(() => {
        expect(cartState.state.total).toBe(129900); // ₱1,299.00
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
        expect(cartState.state.total).toBe(0);
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
        price: 0 as Core.Money,
      } as WCProduct;

      await act(async () => {
        cartState.addItem(productWithoutPrice);
      });

      await waitFor(() => {
        expect(cartState.state.total).toBe(0);
        expect(cartState.state.itemCount).toBe(1);
      });
    });

    it('should handle very large quantities safely', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[3], 9999); // Max quantity
      });

      await waitFor(() => {
        // 2550 * 9999 = 25,497,450 centavos (₱254,974.50)
        expect(cartState.state.total).toBe(25497450);
        expect(cartState.state.itemCount).toBe(9999);
      });
    });

    it('should handle zero quantity', async () => {
      renderWithCart();

      await act(async () => {
        cartState.addItem(mockProducts[0], 1);
      });

      await waitFor(() => {
        expect(cartState.state.total).toBe(129900);
      });

      await act(async () => {
        cartState.updateQuantity(mockProducts[0]?.id || 1, 0);
      });

      await waitFor(() => {
        expect(cartState.state.total).toBe(0);
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
        expect(total).toBe(129900);

        // Test that the value can be formatted for display
        const displayPrice = (total / 100).toFixed(2);
        expect(displayPrice).toBe('1299.00');

        // With proper formatting
        const formatted = `₱${(total / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        expect(formatted).toBe('₱1,299.00');
      });
    });
  });
});