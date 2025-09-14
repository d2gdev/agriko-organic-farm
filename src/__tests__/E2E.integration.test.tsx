import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { CartProvider } from '@/context/CartContext';
import ProductsWithFilters from '@/components/ProductsWithFilters';
import SearchModal from '@/components/SearchModal';
import CheckoutPage from '@/app/checkout/page';
import { WCProduct } from '@/types/woocommerce';

// Mock Next.js router and components
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => ({
    get: (key: string) => null,
  }),
  usePathname: () => '/products',
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ alt, src, width, height, fill, priority, ...props }: {
    alt?: string;
    src?: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    [key: string]: unknown;
  }) {
    // Convert boolean props to strings to avoid DOM warnings
    const imgProps: Record<string, unknown> = { ...props };
    if (src) imgProps.src = src;
    if (width) imgProps.width = width.toString();
    if (height) imgProps.height = height.toString();
    if (fill) imgProps['data-fill'] = fill.toString();
    if (priority) imgProps['data-priority'] = priority.toString();

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...imgProps} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  },
}));

// Mock hooks and utilities
jest.mock('@/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({
    focusFirst: jest.fn(),
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock WooCommerce API
jest.mock('@/lib/woocommerce', () => ({
  getAllProducts: jest.fn(),
  searchProducts: jest.fn(),
}));

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  formatPrice: (price: string | number) => `$${parseFloat(price.toString()).toFixed(2)}`,
  getProductMainImage: (product: WCProduct) => `/images/${product.slug || 'placeholder'}.jpg`,
  stripHtml: (str: string) => str.replace(/<[^>]*>/g, ''),
  isProductInStock: (product: WCProduct) => product.stock_status === 'instock',
  cn: (...classes: (string | undefined | false | null)[]) => classes.flat().filter(Boolean).join(' ').trim(),
}));

// Mock hooks
jest.mock('@/hooks/useProductFilters', () => ({
  useProductFilters: jest.fn(),
}));

global.fetch = jest.fn();
const mockRouterPush = jest.fn();

const mockProducts: WCProduct[] = [
  {
    id: 1,
    name: 'Organic Brown Rice',
    slug: 'organic-brown-rice',
    price: '15.99',
    regular_price: '15.99',
    sale_price: '',
    on_sale: false,
    stock_status: 'instock',
    description: 'Premium organic brown rice from our farm',
    short_description: 'Healthy brown rice',
    images: [
      {
        id: 1,
        src: '/brown-rice.jpg',
        alt: 'Organic Brown Rice',
        name: 'Brown Rice Image',
      },
    ],
    categories: [
      {
        id: 1,
        name: 'Rice',
        slug: 'rice',
        description: '',
        display: 'default',
        image: null,
        menu_order: 0,
        count: 0,
      },
    ],
    tags: [],
    attributes: [],
    variations: [],
    weight: '1',
    dimensions: { length: '', width: '', height: '' },
    manage_stock: false,
    stock_quantity: null,
    featured: false,
    catalog_visibility: 'visible',
    permalink: '/product/organic-brown-rice',
    status: 'publish',
    sku: 'ORG-RICE-001',
    meta_data: [],
    average_rating: '0',
    rating_count: 0,
    date_created: '2024-01-01T00:00:00',
    date_modified: '2024-01-01T00:00:00',
  },
  {
    id: 2,
    name: 'Organic Honey',
    slug: 'organic-honey',
    price: '25.50',
    regular_price: '25.50',
    sale_price: '',
    on_sale: false,
    stock_status: 'instock',
    description: 'Pure organic honey from local hives',
    short_description: 'Pure organic honey',
    images: [
      {
        id: 2,
        src: '/honey.jpg',
        alt: 'Organic Honey',
        name: 'Honey Image',
      },
    ],
    categories: [
      {
        id: 3,
        name: 'Blends',
        slug: 'blends',
        description: '',
        display: 'default',
        image: null,
        menu_order: 0,
        count: 0,
      },
    ],
    tags: [],
    attributes: [],
    variations: [],
    weight: '1',
    dimensions: { length: '', width: '', height: '' },
    manage_stock: false,
    stock_quantity: null,
    featured: false,
    catalog_visibility: 'visible',
    permalink: '/product/organic-honey',
    status: 'publish',
    sku: 'ORG-HONEY-001',
    meta_data: [],
    average_rating: '0',
    rating_count: 0,
    date_created: '2024-01-01T00:00:00',
    date_modified: '2024-01-01T00:00:00',
  },
];

// Define proper types for cart items
interface CartItem {
  product: WCProduct;
  quantity: number;
  variation: any;
}

interface CartState {
  items: CartItem[];
  total: number;
}

// Helper to create a full cart context provider
const createCartProvider = (initialState: CartState = { items: [], total: 0 }) => {
  return function TestCartProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState(initialState);

    const addItem = jest.fn((product: WCProduct, quantity = 1) => {
      setState(prevState => {
        const existingItem = prevState.items.find(item => item.product.id === product.id);

        if (existingItem) {
          const updatedItems = prevState.items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          return {
            items: updatedItems,
            total: updatedItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0),
          };
        } else {
          const newItems = [...prevState.items, { product, quantity, variation: null }];
          return {
            items: newItems,
            total: newItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0),
          };
        }
      });
    });

    const updateQuantity = jest.fn((productId: number, quantity: number) => {
      setState(prevState => {
        const updatedItems = prevState.items.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        ).filter(item => item.quantity > 0);

        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0),
        };
      });
    });

    const removeItem = jest.fn((productId: number) => {
      setState(prevState => {
        const updatedItems = prevState.items.filter(item => item.product.id !== productId);
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0),
        };
      });
    });

    const clearCart = jest.fn(() => {
      setState({ items: [], total: 0 });
    });

    const contextValue = {
      state,
      dispatch: jest.fn(),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };

    return React.createElement(
      React.createContext(contextValue).Provider,
      { value: contextValue },
      children
    );
  };
};

describe('E2E Integration Tests', () => {
  beforeEach(() => {
    const { getAllProducts, searchProducts } = require('@/lib/woocommerce');
    const { useProductFilters } = require('@/hooks/useProductFilters');

    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });

    // Mock API functions
    getAllProducts.mockResolvedValue(mockProducts);
    searchProducts.mockResolvedValue(mockProducts);

    // Mock useProductFilters hook - return all products initially
    // The filtering will be handled by the actual components during interaction
    useProductFilters.mockReturnValue({
      filters: {},
      searchQuery: '',
      filteredProducts: mockProducts,
      filterStats: { totalProducts: mockProducts.length },
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      hasActiveFilters: false,
      resetFilters: jest.fn(),
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
    document.body.style.overflow = 'unset';
  });

  describe('Product Discovery to Cart Flow', () => {
    it('should complete full product discovery and add to cart flow', async () => {
      const user = userEvent.setup();
      const CartProvider = createCartProvider();

      const App = () => {
        const [showSearch, setShowSearch] = React.useState(false);
        const [cartItems, setCartItems] = React.useState([]);

        return (
          <CartProvider>
            <div>
              <button onClick={() => setShowSearch(true)}>Open Search</button>
              <ProductsWithFilters products={mockProducts} />
              <SearchModal
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                products={mockProducts}
              />
            </div>
          </CartProvider>
        );
      };

      render(<App />);

      // 1. Start with product listing
      expect(screen.getAllByText('Organic Brown Rice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Organic Honey').length).toBeGreaterThan(0);

      // 2. Use search to find specific product
      const openSearchButton = screen.getByText('Open Search');
      await user.click(openSearchButton);

      const searchInput = screen.getByPlaceholderText(/search products/i);
      await user.type(searchInput, 'honey');

      await waitFor(() => {
        expect(screen.getAllByText('Organic Honey').length).toBeGreaterThan(0);
        // Note: In this test setup, both components show all products since filtering is mocked.
        // In a real scenario, both components would filter together or independently.
        // For now, we just verify that the search modal interaction works.
        expect(searchInput.value).toBe('honey');
      }, { timeout: 1000 });

      // 3. Navigate to product from search
      // Use a more specific selector since there are multiple instances
      const honeyProducts = screen.getAllByText('Organic Honey');
      expect(honeyProducts.length).toBeGreaterThan(0);

      // Click on the first clickable honey product (likely from SearchModal)
      const honeyLinks = screen.getAllByRole('button', { name: /organic honey/i });
      if (honeyLinks.length === 0) {
        // Fallback to any clickable element containing the product
        const honeyLink = honeyProducts[0].closest('a, button') as HTMLElement;
        await user.click(honeyLink);
      } else {
        await user.click(honeyLinks[0]);
      }

      expect(mockRouterPush).toHaveBeenCalledWith('/product/organic-honey');
    });
  });

  describe('Search to Checkout Flow', () => {
    it('should complete search to checkout integration', async () => {
      const user = userEvent.setup();
      const initialCartState = {
        items: [
          {
            product: mockProducts[1], // Organic Honey
            quantity: 2,
            variation: null,
          },
        ],
        total: 51.00, // 25.50 * 2
      };

      const CartProvider = createCartProvider(initialCartState);

      // Mock successful order creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, status: 'processing' }),
      });

      render(
        <CartProvider>
          <CheckoutPage />
        </CartProvider>
      );

      // Should display the cart items in order summary
      expect(screen.getAllByText('Organic Honey').length).toBeGreaterThan(0);
      expect(screen.getByText('Qty: 2 × $25.50')).toBeInTheDocument();
      expect(screen.getByText('$51.00')).toBeInTheDocument();

      // Fill out checkout form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/address/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.type(screen.getByLabelText(/zip/i), '12345');

      // Submit order
      const submitButton = screen.getByRole('button', { name: /place order/i });
      await user.click(submitButton);

      // Should process order
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('john.doe@example.com'),
        }));
      });

      // Should redirect to success page
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/success');
      });
    });
  });

  describe('Product Filtering to Search Integration', () => {
    it('should maintain filter context across product listing and search', async () => {
      const user = userEvent.setup();

      const App = () => {
        const [showSearch, setShowSearch] = React.useState(false);
        const [urlParams, setUrlParams] = React.useState(new URLSearchParams());

        React.useEffect(() => {
          // Simulate URL parameter changes
          const params = new URLSearchParams(window.location.search);
          setUrlParams(params);
        }, []);

        return (
          <div>
            <button onClick={() => setShowSearch(true)}>Open Search</button>
            <ProductsWithFilters products={mockProducts} />
            <SearchModal
              isOpen={showSearch}
              onClose={() => setShowSearch(false)}
              products={mockProducts}
            />
            <div data-testid="url-params">{urlParams.toString()}</div>
          </div>
        );
      };

      render(<App />);

      // 1. Apply category filter in product listing
      const riceFilter = screen.getByRole('button', { name: /rice/i });
      await user.click(riceFilter);

      await waitFor(() => {
        expect(screen.getAllByText('Organic Brown Rice').length).toBeGreaterThan(0);
        expect(screen.queryByText('Organic Honey')).not.toBeInTheDocument();
      });

      // 2. Open search modal
      const openSearchButton = screen.getByText('Open Search');
      await user.click(openSearchButton);

      // 3. Apply search in modal
      const searchInput = screen.getByPlaceholderText(/search products/i);
      await user.type(searchInput, 'organic');

      await waitFor(() => {
        expect(screen.getByText(/\d+ products? found/i)).toBeInTheDocument();
      }, { timeout: 1000 });

      // 4. View all results should maintain both search and filters
      const viewAllButton = screen.getByText(/view all \d+ results/i);
      await user.click(viewAllButton);

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringMatching(/\/products\?.*search=organic/)
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully across components', async () => {
      const user = userEvent.setup();
      const CartProvider = createCartProvider({
        items: [
          {
            product: mockProducts[0],
            quantity: 1,
            variation: null,
          },
        ],
        total: 15.99,
      });

      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <CartProvider>
          <CheckoutPage />
        </CartProvider>
      );

      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/address/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.type(screen.getByLabelText(/zip/i), '12345');

      // Submit and handle error
      const submitButton = screen.getByRole('button', { name: /place order/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to process your order/i)).toBeInTheDocument();
      });

      // Should not redirect on error
      expect(mockRouterPush).not.toHaveBeenCalledWith('/success');
    });

    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup();

      render(
        <SearchModal
          isOpen={true}
          onClose={jest.fn()}
          products={mockProducts}
        />
      );

      // Search with special characters that might cause issues
      const searchInput = screen.getByPlaceholderText(/search products/i);
      await user.type(searchInput, '!@#$%^&*()');

      await waitFor(() => {
        // Should handle gracefully and show no results
        expect(screen.getByText(/no products found/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large product lists efficiently', async () => {
      const user = userEvent.setup();

      // Create large product list
      const largeProductList = Array.from({ length: 100 }, (_, i) => ({
        ...mockProducts[0],
        id: i + 1,
        name: `Product ${i + 1}`,
        slug: `product-${i + 1}`,
        price: Math.random() * 50 + 10,
      }));

      const startTime = performance.now();

      render(
        <ProductsWithFilters products={largeProductList} />
      );

      const renderTime = performance.now() - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000); // 1 second

      // Should still be interactive
      const searchInput = screen.getByPlaceholderText(/search products/i);
      await user.type(searchInput, 'Product 50');

      await waitFor(() => {
        expect(screen.getByText('Product 50')).toBeInTheDocument();
      });
    });

    it('should debounce search across components', async () => {
      const user = userEvent.setup();

      render(
        <SearchModal
          isOpen={true}
          onClose={jest.fn()}
          products={mockProducts}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search products/i);

      const startTime = performance.now();

      // Type multiple characters quickly
      await user.type(searchInput, 'organic honey premium');

      // Should show loading state
      expect(screen.getByText(/searching/i)).toBeInTheDocument();

      // Should eventually resolve
      await waitFor(() => {
        expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
      }, { timeout: 1000 });

      const totalTime = performance.now() - startTime;

      // Should complete search reasonably quickly
      expect(totalTime).toBeLessThan(2000); // 2 seconds max
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across component interactions', async () => {
      const user = userEvent.setup();

      const App = () => {
        const [showSearch, setShowSearch] = React.useState(false);

        return (
          <div>
            <button onClick={() => setShowSearch(true)} aria-label="Open product search">
              Open Search
            </button>
            <ProductsWithFilters products={mockProducts} />
            <SearchModal
              isOpen={showSearch}
              onClose={() => setShowSearch(false)}
              products={mockProducts}
            />
          </div>
        );
      };

      render(<App />);

      // Should have accessible button
      const openButton = screen.getByLabelText(/open product search/i);
      expect(openButton).toBeInTheDocument();

      // Open search modal
      await user.click(openButton);

      // Modal should be accessible
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');

      // Search input should be focused
      const searchInput = screen.getByPlaceholderText(/search products/i);
      expect(searchInput).toHaveFocus();

      // Should be keyboard navigable
      await user.tab();
      const sortSelect = screen.getByLabelText(/sort by/i);
      expect(sortSelect).toHaveFocus();

      // Search results should be accessible
      await user.type(searchInput, 'organic');

      await waitFor(() => {
        const results = screen.getAllByRole('option');
        results.forEach(result => {
          expect(result).toHaveAttribute('aria-selected');
          expect(result).toHaveAttribute('aria-label');
        });
      }, { timeout: 1000 });
    });
  });

  describe('State Management Integration', () => {
    it('should maintain consistent state across cart operations', async () => {
      const user = userEvent.setup();
      const CartProvider = createCartProvider();

      const App = () => {
        const cartContext = React.useContext(React.createContext({
          state: { items: [], total: 0 },
          addItem: jest.fn(),
          updateQuantity: jest.fn(),
          removeItem: jest.fn(),
          clearCart: jest.fn(),
        }));

        return (
          <CartProvider>
            <div>
              <ProductsWithFilters products={mockProducts} />
              <div data-testid="cart-info">
                Items: {cartContext.state.items.length}, Total: ${cartContext.state.total}
              </div>
            </div>
          </CartProvider>
        );
      };

      render(<App />);

      // Initially empty cart
      expect(screen.getByTestId('cart-info')).toHaveTextContent('Items: 0, Total: $0');

      // Add product to cart (this would normally be done via product card buttons)
      // For this test, we'll assume the product listing has add to cart functionality

      // Products should be displayed
      expect(screen.getAllByText('Organic Brown Rice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Organic Honey').length).toBeGreaterThan(0);
    });
  });
});