'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import SafeLocalStorage from '@/lib/safe-localstorage';

export default function SuccessPage() {
  const router = useRouter();
  const [isValidAccess, setIsValidAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user arrived here from a successful order
    const orderSuccess = SafeLocalStorage.getItem('order_success');

    if (orderSuccess === 'true') {
      // Clear the flag so it can't be reused
      SafeLocalStorage.removeItem('order_success');
      setIsValidAccess(true);
    } else {
      // No valid order completion, redirect to home
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [router]);

  // Show loading while checking access
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying order...</p>
        </div>
      </div>
    );
  }

  // Don't render content if access is invalid
  if (!isValidAccess) {
    return null;
  }
  return (
    <>
      {/* Enhanced Hero with Warm Success Theme */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-emerald-600/15 to-amber-600/10 z-0" />
        <HeroSection
          title="Agriko"
          subtitle="Order Confirmed! 🎉"
          description="Thank you for choosing our organic farm products! Your order is on its way to bringing healthy, sustainable nutrition to your family."
          showButtons={false}
        />
        {/* Celebratory Farm Elements */}
        <div className="absolute bottom-12 right-12 opacity-30 z-10 hidden lg:block animate-bounce">
          <span className="text-8xl">🌾</span>
        </div>
        <div className="absolute bottom-24 left-12 opacity-25 z-10 hidden lg:block animate-pulse">
          <span className="text-7xl">🚚</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Success Banner */}
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 rounded-3xl p-8 mb-12 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-3xl"></div>
          <div className="flex items-center relative z-10">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-6">
              <h1 className="text-4xl font-bold text-green-800 font-[family-name:var(--font-crimson)] mb-2">Order Confirmed!</h1>
              <p className="text-lg text-green-700">
                Your order has been successfully placed and we&apos;re excited to prepare your organic products with care.
              </p>
              <p className="text-sm text-green-600 mt-2 font-medium">
                🌱 Fresh from our family farm to your cup
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced What's Next Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-lg border border-amber-100 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center font-[family-name:var(--font-crimson)]">Your Order Journey</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mr-4 shadow-md">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Confirmation Email</h3>
              <p className="text-gray-600 text-sm">We&apos;ll send you an order confirmation email with all your order details within the next few minutes.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mr-4 shadow-md">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <span className="text-2xl">🌾</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Farm Fresh Preparation</h3>
              <p className="text-gray-600 text-sm">Your organic products will be carefully harvested, prepared, and packaged with love at our family farm.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-4 shadow-md">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Delivery Notification</h3>
              <p className="text-gray-600 text-sm">We&apos;ll notify you when your order is ready for delivery or pickup with tracking information.</p>
            </div>
          </div>
        </div>

        {/* Enhanced Contact Information */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-lg border border-green-100 p-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">Need Help?</h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Our friendly farm team is here to help! If you have any questions about your order or our organic products, please don&apos;t hesitate to reach out.
            </p>
            <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
              <a
                href="mailto:agrikoph@gmail.com"
                className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-green-100"
              >
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">📧</span>
                  <span className="font-semibold text-gray-900">Email Us</span>
                </div>
                <p className="text-green-600 font-medium">agrikoph@gmail.com</p>
                <p className="text-sm text-gray-600">24-hour response time</p>
              </a>

              <div className="bg-white rounded-2xl p-4 shadow-md border border-green-100">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">🕒</span>
                  <span className="font-semibold text-gray-900">Business Hours</span>
                </div>
                <p className="text-gray-700 font-medium">Monday - Friday</p>
                <p className="text-sm text-gray-600">8:00 AM - 6:00 PM (PHT)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 font-[family-name:var(--font-crimson)]">What would you like to do next?</h3>
          <div className="flex flex-col lg:flex-row gap-6 justify-center max-w-4xl mx-auto">
            <Link
              href="/"
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <span className="text-xl mr-2">🛍️</span>
              Continue Shopping
            </Link>

            <Link
              href="/about/founder-story"
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <span className="text-xl mr-2">🌱</span>
              Our Farm Story
            </Link>

            <Link
              href="/contact"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <span className="text-xl mr-2">💬</span>
              Contact Us
            </Link>
          </div>

          {/* Trust Badge */}
          <div className="mt-12 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 inline-block">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🏆</span>
              <div className="text-left">
                <p className="font-bold text-gray-900">100% Organic Guarantee</p>
                <p className="text-sm text-gray-700">Sustainably grown with love on our family farm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}