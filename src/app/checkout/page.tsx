'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/woocommerce';
import { formatPrice, getProductMainImage } from '@/lib/utils';
import { CheckoutData, WCAddress } from '@/types/woocommerce';

interface FormErrors {
  [key: string]: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [billingData, setBillingData] = useState<WCAddress>({
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'US',
    email: '',
    phone: '',
  });
  const [shippingData, setShippingData] = useState<WCAddress>({
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'US',
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Cash on delivery as default
  const [customerNote, setCustomerNote] = useState('');

  // Redirect if cart is empty
  useEffect(() => {
    if (state.items.length === 0) {
      router.push('/cart');
    }
  }, [state.items.length, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Billing validation
    if (!billingData.first_name.trim()) newErrors.billing_first_name = 'First name is required';
    if (!billingData.last_name.trim()) newErrors.billing_last_name = 'Last name is required';
    if (!billingData.email.trim()) newErrors.billing_email = 'Email is required';
    if (!billingData.address_1.trim()) newErrors.billing_address_1 = 'Address is required';
    if (!billingData.city.trim()) newErrors.billing_city = 'City is required';
    if (!billingData.postcode.trim()) newErrors.billing_postcode = 'ZIP/Postal code is required';
    if (!billingData.phone.trim()) newErrors.billing_phone = 'Phone number is required';

    // Email validation
    if (billingData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingData.email)) {
      newErrors.billing_email = 'Please enter a valid email address';
    }

    // Shipping validation (if different from billing)
    if (!sameAsBilling) {
      if (!shippingData.first_name.trim()) newErrors.shipping_first_name = 'First name is required';
      if (!shippingData.last_name.trim()) newErrors.shipping_last_name = 'Last name is required';
      if (!shippingData.address_1.trim()) newErrors.shipping_address_1 = 'Address is required';
      if (!shippingData.city.trim()) newErrors.shipping_city = 'City is required';
      if (!shippingData.postcode.trim()) newErrors.shipping_postcode = 'ZIP/Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      const orderData: CheckoutData = {
        payment_method: paymentMethod,
        payment_method_title: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card',
        set_paid: false,
        billing: billingData,
        shipping: sameAsBilling ? billingData : shippingData,
        line_items: state.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        customer_note: customerNote,
      };

      const order = await createOrder(orderData);
      
      // Clear the cart
      clearCart();
      
      // Redirect to order confirmation
      router.push(`/order/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setErrors({ general: 'Failed to process your order. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBillingData = (field: keyof WCAddress, value: string) => {
    setBillingData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[`billing_${field}`]) {
      setErrors(prev => ({ ...prev, [`billing_${field}`]: '' }));
    }
  };

  const updateShippingData = (field: keyof WCAddress, value: string) => {
    setShippingData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[`shipping_${field}`]) {
      setErrors(prev => ({ ...prev, [`shipping_${field}`]: '' }));
    }
  };

  if (state.items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Billing & Shipping Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={billingData.first_name}
                    onChange={(e) => updateBillingData('first_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.billing_first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.billing_first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.billing_first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={billingData.last_name}
                    onChange={(e) => updateBillingData('last_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.billing_last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.billing_last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.billing_last_name}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={billingData.company}
                    onChange={(e) => updateBillingData('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={billingData.email}
                    onChange={(e) => updateBillingData('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.billing_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.billing_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.billing_email}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={billingData.phone}
                    onChange={(e) => updateBillingData('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.billing_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.billing_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.billing_phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={billingData.address_1}
                    onChange={(e) => updateBillingData('address_1', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.billing_address_1 ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Street address"
                  />
                  {errors.billing_address_1 && (
                    <p className="text-red-500 text-sm mt-1">{errors.billing_address_1}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={billingData.address_2}
                    onChange={(e) => updateBillingData('address_2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={billingData.city}
                    onChange={(e) => updateBillingData('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.billing_city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.billing_city && (
                    <p className="text-red-500 text-sm mt-1">{errors.billing_city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={billingData.state}
                    onChange={(e) => updateBillingData('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    value={billingData.postcode}
                    onChange={(e) => updateBillingData('postcode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.billing_postcode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.billing_postcode && (
                    <p className="text-red-500 text-sm mt-1">{errors.billing_postcode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={billingData.country}
                    onChange={(e) => updateBillingData('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Shipping Information</h2>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Same as billing address</span>
                </label>
              </div>

              {!sameAsBilling && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Similar fields as billing but for shipping */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={shippingData.first_name}
                      onChange={(e) => updateShippingData('first_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.shipping_first_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.shipping_first_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.shipping_first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={shippingData.last_name}
                      onChange={(e) => updateShippingData('last_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.shipping_last_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.shipping_last_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.shipping_last_name}</p>
                    )}
                  </div>

                  {/* Add remaining shipping fields similar to billing */}
                  {/* For brevity, I'm including key fields only */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={shippingData.address_1}
                      onChange={(e) => updateShippingData('address_1', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.shipping_address_1 ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.shipping_address_1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.shipping_address_1}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shippingData.city}
                      onChange={(e) => updateShippingData('city', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.shipping_city ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.shipping_city && (
                      <p className="text-red-500 text-sm mt-1">{errors.shipping_city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP/Postal Code *
                    </label>
                    <input
                      type="text"
                      value={shippingData.postcode}
                      onChange={(e) => updateShippingData('postcode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.shipping_postcode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.shipping_postcode && (
                      <p className="text-red-500 text-sm mt-1">{errors.shipping_postcode}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
              
              <div className="space-y-4">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Cash on Delivery</span>
                    <p className="text-sm text-gray-600">Pay when your order is delivered to your door.</p>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="radio"
                    name="payment_method"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3 mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Credit Card</span>
                    <p className="text-sm text-gray-600">Pay securely with your credit or debit card.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Notes (Optional)</h2>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any special instructions for your order..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {state.items.map((item) => {
                  const itemKey = `${item.product.id}-${item.variation?.id || 'no-variation'}`;
                  const itemTotal = parseFloat(item.product.price) * item.quantity;

                  return (
                    <div key={itemKey} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Image
                          src={getProductMainImage(item.product)}
                          alt={item.product.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × {formatPrice(item.product.price)}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <hr className="border-gray-200 mb-6" />

              {/* Order Totals */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(state.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(state.total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-primary-400 transition-colors mt-6 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>

              {/* Back to Cart */}
              <Link
                href="/cart"
                className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-4"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}