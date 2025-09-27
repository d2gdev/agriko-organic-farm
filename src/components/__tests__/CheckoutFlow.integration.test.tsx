import React from 'react';
import { Money } from '@/lib/money';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import CheckoutPage from '@/app/checkout/page';
// import { CartProvider } from '@/context/CartContext'; // Mock provided below
import { WCProduct } from '@/types/woocommerce';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock CartContext
jest.mock('@/context/CartContext', () => ({
  useCart: jest.fn(),
  CartProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock components
jest.mock('@/components/HeroSection', () => {
  return function MockHeroSection() {
    return <div>Hero Section</div>;
  };
});

jest.mock('@/components/OrganicLoadingStates', () => ({
  PlantGrowingLoader: ({ className }: { className?: string }) => <div className={className}>Loading...</div>,
}));

// Mock fetch globally
global.fetch = jest.fn();

const mockRouterPush = jest.fn();
const mockProduct: WCProduct = {
  id: 1,
  name: 'Test Organic Rice',
  slug: 'test-organic-rice',
  price: Money.centavos(1599),
  regular_price: Money.centavos(1599),
  sale_price: null,
  on_sale: false,
  stock_status: 'instock',
  description: 'Premium organic rice',
  short_description: 'Premium organic rice from our farm',
  images: [
    {
      id: 1,
      src: '/test-image.jpg',
      alt: 'Test Rice',
      name: 'Test Rice Image',
    },
  ],
  categories: [
    {
      id: 1,
      name: 'Rice',
      slug: 'rice',
      description: 'Rice products',
      display: 'default',
      image: null,
      menu_order: 0,
      count: 10,
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
};

// Helper to render checkout with cart context
const renderCheckoutWithCart = (initialItems: Array<{ product: WCProduct; quantity: number; variation: null }> = []) => {
  const mockCartState = {
    items: initialItems,
    total: initialItems.reduce((sum, item) => {
      const price = item.product.price || Money.ZERO;
      const itemTotal = price instanceof Money ? price.multiply(item.quantity) : Money.ZERO;
      return sum instanceof Money ? sum.add(itemTotal) : itemTotal;
    }, Money.ZERO),
  };

  const mockUseCart = {
    state: mockCartState,
    dispatch: jest.fn(),
    addItem: jest.fn(),
    updateQuantity: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  };

  // Mock useCart hook
  const { useCart } = require('@/context/CartContext');
  useCart.mockReturnValue(mockUseCart);

  return render(<CheckoutPage />);
};

describe('Checkout Flow Integration', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Empty Cart Handling', () => {
    it('should redirect to cart when no items present', () => {
      renderCheckoutWithCart([]);

      expect(mockRouterPush).toHaveBeenCalledWith('/cart');
    });
  });

  describe('Checkout Form Validation', () => {
    const cartItems = [
      {
        product: mockProduct,
        quantity: 2,
        variation: null,
      },
    ];

    it('should display validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      renderCheckoutWithCart(cartItems);

      // Try to submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /place order/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Address is required')).toBeInTheDocument();
        expect(screen.getByText('City is required')).toBeInTheDocument();
        expect(screen.getByText('ZIP/Postal code is required')).toBeInTheDocument();
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      renderCheckoutWithCart(cartItems);

      // Fill all required fields with invalid email format
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/^address \*$/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.type(screen.getByLabelText(/zip\/postal code/i), '12345');

      // Submit form - should show email format error
      const submitButton = screen.getByRole('button', { name: /place order/i });

      // Ensure the submit button is enabled and clickable
      expect(submitButton).toBeEnabled();

      // Blur the last input to ensure all onChange events are processed
      const lastInput = screen.getByLabelText(/zip\/postal code/i);
      await user.click(lastInput);
      lastInput.blur();

      // Try direct form submission if button click doesn't work
      const form = submitButton.closest('form');
      if (form) {
        // Use fireEvent to directly trigger form submission
        fireEvent.submit(form);
      } else {
        // Fallback to button click
        await user.click(submitButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      renderCheckoutWithCart(cartItems);

      // First trigger validation error
      const submitButton = screen.getByRole('button', { name: /place order/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });

      // Find billing first name input using proper label association
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'John');

      // Error should be cleared
      expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
    });
  });

  describe('Shipping Address Toggle', () => {
    const cartItems = [
      {
        product: mockProduct,
        quantity: 1,
        variation: null,
      },
    ];

    it('should show shipping form when "Same as billing" is unchecked', async () => {
      const _user = userEvent.setup(); // Not used in this test, uses fireEvent instead
      renderCheckoutWithCart(cartItems);

      const sameAsBillingCheckbox = screen.getByLabelText(/same as billing address/i);
      expect(sameAsBillingCheckbox).toBeChecked();

      // Uncheck the "same as billing" option using fireEvent for immediate state update
      fireEvent.click(sameAsBillingCheckbox);

      // Wait for the checkbox state to be reflected in DOM first
      await waitFor(() => {
        expect(sameAsBillingCheckbox).not.toBeChecked();
      });

      // Then wait for the shipping form fields to appear
      await waitFor(() => {
        // Look for the shipping first name field directly by ID
        const shippingFirstName = document.getElementById('shipping_first_name');
        expect(shippingFirstName).toBeVisible();
      });
    });

    it('should validate shipping fields when different from billing', async () => {
      const user = userEvent.setup();
      renderCheckoutWithCart(cartItems);

      // Uncheck "same as billing"
      const sameAsBillingCheckbox = screen.getByLabelText(/same as billing address/i);
      await user.click(sameAsBillingCheckbox);

      // Try to submit without filling shipping fields
      const submitButton = screen.getByRole('button', { name: /place order/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Pattern #2: Multiple element handling
        const firstNameErrors = screen.getAllByText('First name is required');
        expect(firstNameErrors.length).toBeGreaterThan(1); // Both billing and shipping
      });
    });
  });

  describe('Order Submission', () => {
    const cartItems = [
      {
        product: mockProduct,
        quantity: 2,
        variation: null,
      },
    ];

    it('should submit order successfully with valid form data', async () => {
      const user = userEvent.setup();
      const mockOrderResponse = {
        id: 123,
        status: 'processing',
        total: '31.98',
      };

      // Add delay to mock fetch to allow capturing loading state
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: async () => mockOrderResponse,
          }), 100)
        )
      );

      renderCheckoutWithCart(cartItems);

      // Fill in required billing fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/^address \*$/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.type(screen.getByLabelText(/zip\/postal code/i), '12345');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /place order/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Processing your order...')).toBeInTheDocument();
      });

      // Should call API with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"payment_method":"cod"'),
        });

        // Verify key data in the request body
        const callArguments = (global.fetch as jest.Mock).mock.calls[0];
        const requestBody = JSON.parse(callArguments[1].body);
        expect(requestBody.billing.first_name).toBe('John');
        expect(requestBody.billing.last_name).toBe('Doe');
        expect(requestBody.billing.email).toBe('john.doe@example.com');
        expect(requestBody.line_items[0].product_id).toBe(1);
        expect(requestBody.line_items[0].quantity).toBe(2);
      });

      // Should redirect to success page
      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/success');
      });
    });

    it('should handle order submission errors', async () => {
      const user = userEvent.setup();
      const mockError = { error: 'Payment failed' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      renderCheckoutWithCart(cartItems);

      // Fill in required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/^address \*$/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.type(screen.getByLabelText(/zip\/postal code/i), '12345');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /place order/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to process your order. Please try again.')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockRouterPush).not.toHaveBeenCalledWith('/success');
    });
  });

  describe('Order Summary Display', () => {
    it('should display correct order summary with multiple items', () => {
      const cartItems = [
        {
          product: mockProduct,
          quantity: 2,
          variation: null,
        },
        {
          product: {
            ...mockProduct,
            id: 2,
            name: 'Organic Honey',
            price: Money.centavos(2550),
          },
          quantity: 1,
          variation: null,
        },
      ];

      renderCheckoutWithCart(cartItems);

      // Check order summary section
      const orderSummary = screen.getByText('Order Summary').closest('div');
      expect(orderSummary).not.toBeNull();

      // Should display both products
      expect(within(orderSummary as HTMLElement).getByText('Test Organic Rice')).toBeInTheDocument();
      expect(within(orderSummary as HTMLElement).getByText('Organic Honey')).toBeInTheDocument();

      // Should display quantities and prices (using peso symbol)
      expect(within(orderSummary as HTMLElement).getByText('Qty: 2 × ₱15.99')).toBeInTheDocument();
      expect(within(orderSummary as HTMLElement).getByText('Qty: 1 × ₱25.50')).toBeInTheDocument();

      // Should display correct total (using peso symbol) - Pattern #2: Multiple element handling
      const totalElements = within(orderSummary as HTMLElement).getAllByText('₱57.48');
      expect(totalElements.length).toBeGreaterThan(0);
    });
  });

  describe('Payment Method Selection', () => {
    const cartItems = [
      {
        product: mockProduct,
        quantity: 1,
        variation: null,
      },
    ];

    it('should allow payment method selection', async () => {
      const user = userEvent.setup();
      renderCheckoutWithCart(cartItems);

      // Cash on Delivery should be selected by default
      const codRadio = screen.getByDisplayValue('cod');
      expect(codRadio).toBeChecked();

      // Select credit card
      const stripeRadio = screen.getByDisplayValue('stripe');
      await user.click(stripeRadio);

      expect(stripeRadio).toBeChecked();
      expect(codRadio).not.toBeChecked();
    });
  });

  describe('Customer Notes', () => {
    const cartItems = [
      {
        product: mockProduct,
        quantity: 1,
        variation: null,
      },
    ];

    it('should include customer notes in order submission', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
      });

      renderCheckoutWithCart(cartItems);

      // Add customer note
      const notesTextarea = screen.getByPlaceholderText(/any special instructions/i);
      await user.type(notesTextarea, 'Please deliver in the morning');

      // Fill required fields and submit
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/^address \*$/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.type(screen.getByLabelText(/zip\/postal code/i), '12345');

      const submitButton = screen.getByRole('button', { name: /place order/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
          body: expect.stringContaining('"customer_note":"Please deliver in the morning"'),
        }));
      });
    });
  });
});