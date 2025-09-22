'use client';

import { useState, useEffect, Suspense } from 'react';
import { logger } from '@/lib/logger';

import { useSearchParams } from 'next/navigation';
import { ReviewForm } from '@/components/ReviewForm';
import Link from 'next/link';
import Image from 'next/image';

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const productId = searchParams.get('product');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [orderData, setOrderData] = useState<{ id: string; date: string; customerName: string } | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    // Validate parameters
    if (!orderId || !productId) {
      setError('Missing required parameters. Please use the link from your email.');
      setLoading(false);
      return;
    }

    const validateAndFetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In production, this would:
      // 1. Validate the token
      // 2. Fetch order details
      // 3. Fetch product information
      // 4. Check if review already exists

      // Mock validation and data fetching
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (token && token.length < 10) {
        throw new Error('Invalid or expired review link. Please contact support if you need assistance.');
      }

      // Mock product data - in production, fetch from API
      const mockProducts = {
        '123': 'Organic Black Rice (2kg)',
        '124': 'Mixed Organic Vegetables',
        '125': 'Organic Brown Rice (1kg)',
        '126': 'Fresh Organic Herbs Bundle',
        '127': 'Organic Quinoa (500g)'
      };

      const name = mockProducts[productId as keyof typeof mockProducts] || 'Product';
      setProductName(name);

      setOrderData({
        id: orderId,
        date: 'March 8, 2024', // Static date to prevent hydration mismatch
        customerName: 'Valued Customer' // In production, get from order data
      });

    } catch (error) {
      logger.error('Validation error:', error as Record<string, unknown>);
      setError(error instanceof Error ? error.message : 'Failed to validate review link');
    } finally {
      setLoading(false);
    }
    };

    // In production, validate token and fetch order/product data
    validateAndFetchData();
  }, [orderId, productId, token]);

  const handleReviewSubmit = () => {
    setReviewSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Review Form</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <Link
              href="/"
              className="block bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              Visit Our Store
            </Link>
            <Link
              href="/contact"
              className="block text-primary-500 hover:text-primary-600 text-sm"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (reviewSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4 text-center">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Thank You for Your Review!</h1>
          <p className="text-gray-600 mb-6">
            Your review has been submitted and will appear on our website once it&apos;s been moderated. 
            We appreciate you taking the time to share your experience!
          </p>
          <div className="space-y-2">
            <Link
              href="/"
              className="block bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              href={`/product/${productId}`}
              className="block text-primary-500 hover:text-primary-600 text-sm"
            >
              View Product Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image 
              src="/images/Agriko-Logo.png" 
              alt="Agriko Organic Farm" 
              width={120}
              height={48}
              className="h-12 mx-auto"
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Experience</h1>
          <p className="text-gray-600">
            Help other customers by reviewing your recent purchase
          </p>
        </div>

        {/* Order Info */}
        {orderData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center text-blue-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <div>
                <div className="font-medium">Order #{orderId}</div>
                <div className="text-sm">Completed on {orderData.date}</div>
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ReviewForm
            productId={productId ? parseInt(productId) : 0}
            productName={productName}
            onSubmit={handleReviewSubmit}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Having issues? <Link href="/contact" className="text-primary-500 hover:text-primary-600">Contact our support team</Link>
          </p>
          <p className="mt-2">
            <Link href="/" className="text-primary-500 hover:text-primary-600">Return to Agriko Organic Farm</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review form...</p>
        </div>
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}