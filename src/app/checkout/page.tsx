'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatPrice, getProductMainImage } from '@/lib/utils';
import { Money } from '@/lib/money';
import { CheckoutData, WCAddress } from '@/types/woocommerce';
import HeroSection from '@/components/HeroSection';
import { PlantGrowingLoader } from '@/components/OrganicLoadingStates';
import SafeLocalStorage from '@/lib/safe-localstorage';

interface FormErrors {
  [key: string]: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
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
    country: 'PH',
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
    country: 'PH',
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Cash on delivery as default
  const [customerNote, setCustomerNote] = useState('');

  // Redirect if cart is empty (but not if order is being processed)
  useEffect(() => {
    if (state.items.length === 0 && !isProcessing && !isOrderComplete) {
      router.push('/cart');
    }
  }, [state.items.length, router, isProcessing, isOrderComplete]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Billing validation
    if (!billingData.first_name.trim()) newErrors.billing_first_name = 'First name is required';
    if (!billingData.last_name.trim()) newErrors.billing_last_name = 'Last name is required';

    // Email validation - check both presence and format
    if (!billingData.email?.trim()) {
      newErrors.billing_email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(billingData.email.trim());
      if (!isValidEmail) {
        newErrors.billing_email = 'Please enter a valid email address';
      }
    }

    if (!billingData.address_1.trim()) newErrors.billing_address_1 = 'Address is required';
    if (!billingData.city.trim()) newErrors.billing_city = 'City is required';
    if (!billingData.postcode.trim()) newErrors.billing_postcode = 'ZIP/Postal code is required';
    if (!billingData.phone?.trim()) newErrors.billing_phone = 'Phone number is required';

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

    const isValid = validateForm();

    if (!isValid) {
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

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      await response.json();

      // Mark order as complete to prevent cart redirect
      setIsOrderComplete(true);

      // Set success flag for secure access to success page
      SafeLocalStorage.setItem('order_success', 'true');

      // Clear the cart
      clearCart();

      // Redirect to success page (order details sent via email for static export deployment)
      router.push('/success');
    } catch (error) {
      logger.error('Error creating order:', error as Record<string, unknown>);
      setErrors({ general: 'Failed to process your order. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBillingData = (field: keyof WCAddress, value: string) => {
    setBillingData(prev => ({ ...prev, [field]: value }));

    // Smart error clearing
    if (errors[`billing_${field}`]) {
      const newErrors = { ...errors };
      let shouldClearError = false;

      // Field-specific validation for clearing errors
      if (field === 'email') {
        // For email: clear "Email is required" when user starts typing
        // Only keep format errors if the email is invalid but not empty
        if (value.trim()) {
          if (errors.billing_email === 'Email is required') {
            shouldClearError = true;
          } else {
            // For format errors, only clear when email becomes valid
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            shouldClearError = emailRegex.test(value.trim());
          }
        }
      } else if (value.trim()) {
        // For non-email fields, clear error when field is not empty
        shouldClearError = true;
      }

      if (shouldClearError) {
        delete newErrors[`billing_${field}`];
        setErrors(newErrors);
      }
    }
  };

  const updateShippingData = (field: keyof WCAddress, value: string) => {
    setShippingData({ ...shippingData, [field]: value });

    // Smart error clearing - only clear errors when field becomes valid
    if (errors[`shipping_${field}`]) {
      const newErrors = { ...errors };
      let shouldClearError = false;

      // For shipping fields, clear error when field is not empty
      if (value.trim()) {
        shouldClearError = true;
      }

      if (shouldClearError) {
        delete newErrors[`shipping_${field}`];
        setErrors(newErrors);
      }
    }
  };

  if (state.items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <HeroSection 
        title="Agriko"
        subtitle="Secure Checkout"
        description="Complete your order and enjoy premium organic products delivered fresh from our farm to your table."
        showButtons={false}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-heading-1 text-gray-900 mb-8">Checkout</h1>

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
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Billing Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="billing_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    id="billing_first_name"
                    name="billing_first_name"
                    type="text"
                    value={billingData.first_name}
                    onChange={(e) => updateBillingData('first_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 focus:scale-105 ${
                      errors.billing_first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.billing_first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.billing_first_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="billing_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="billing_last_name"
                    name="billing_last_name"
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
                  <label htmlFor="billing_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="billing_email"
                    name="billing_email"
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
                  <label htmlFor="billing_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="billing_phone"
                    name="billing_phone"
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
                  <label htmlFor="billing_address_1" className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    id="billing_address_1"
                    name="billing_address_1"
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
                  <label htmlFor="billing_city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    id="billing_city"
                    name="billing_city"
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
                  <label htmlFor="billing_postcode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <input
                    id="billing_postcode"
                    name="billing_postcode"
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
                    <option value="PH">Philippines</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="SG">Singapore</option>
                    <option value="MY">Malaysia</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="HK">Hong Kong</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Shipping Information
                </h2>
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
                    <label htmlFor="shipping_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      id="shipping_first_name"
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
                    <label htmlFor="shipping_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      id="shipping_last_name"
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
                    <label htmlFor="shipping_address_1" className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      id="shipping_address_1"
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
                    <label htmlFor="shipping_city" className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      id="shipping_city"
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
                    <label htmlFor="shipping_postcode" className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP/Postal Code *
                    </label>
                    <input
                      id="shipping_postcode"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={shippingData.country}
                      onChange={(e) => updateShippingData('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="PH">Philippines</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="SG">Singapore</option>
                      <option value="MY">Malaysia</option>
                      <option value="JP">Japan</option>
                      <option value="CN">China</option>
                      <option value="HK">Hong Kong</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">💳</span>
                Payment Method
              </h2>
              
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
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Order Notes (Optional)
              </h2>
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
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 p-8 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                Order Summary
              </h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {state.items.map((item) => {
                  const itemKey = `${item.product.id}-${item.variation?.id || 'no-variation'}`;
                  const itemTotal = Money.parse(String(item.product.price || '0')).multiply(item.quantity);

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
                        <h3 className="text-heading-3 text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × {formatPrice(item.product.price || Money.ZERO)}
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
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-bold hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 mt-6 flex items-center justify-center transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <PlantGrowingLoader className="mr-2" />
                    <span>Processing your order...</span>
                  </>
                ) : (
                  'Place Order'
                )}
              </button>

              {/* Back to Cart */}
              <Link
                href="/cart"
                className="block text-center text-sm text-green-600 hover:text-green-700 mt-4 font-medium transition-colors duration-200"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </form>
      </div>
    </>
  );
}