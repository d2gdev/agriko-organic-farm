'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="relative mt-auto">
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-50 to-yellow-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
            {/* Decorative Element */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full opacity-50"></div>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full opacity-50"></div>

            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold text-neutral-900 mb-4">
                  🌿 Try Our Bestseller
                </h3>
                <p className="text-lg text-neutral-600 mb-6">
                  Experience the power of our 5-in-1 Turmeric Tea Blend - a perfect fusion of organic turmeric, ginger, and premium herbs for your daily wellness routine.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/products"
                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 border-2 border-green-600 hover:border-green-700"
                  >
                    <span className="mr-2 text-lg group-hover:animate-bounce">🛍️</span>
                    Shop Now
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/faq"
                    className="group inline-flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-700 font-bold rounded-xl hover:bg-green-50 hover:border-green-700 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5"
                  >
                    <span className="mr-2 text-lg group-hover:animate-bounce">📚</span>
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-64 h-64">
                  <Image
                    src="/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg"
                    alt="5-in-1 Turmeric Tea Blend"
                    fill
                    sizes="(max-width: 768px) 256px, 256px"
                    className="object-cover rounded-xl shadow-lg"
                  />
                  <div className="absolute -top-4 -right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    Bestseller
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-gradient-to-br from-neutral-50 via-green-50/30 to-yellow-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Enhanced visual separators */}
            <style jsx>{`
              .footer-section {
                position: relative;
              }
              .footer-section:not(:last-child)::after {
                content: '';
                position: absolute;
                right: -24px;
                top: 0;
                bottom: 0;
                width: 1px;
                background: linear-gradient(to bottom, transparent, #e5e7eb, transparent);
                display: none;
              }
              @media (min-width: 768px) {
                .footer-section:not(:last-child)::after {
                  display: block;
                }
              }
            `}</style>
            {/* Company Info - Enhanced */}
            <div className="md:col-span-2 space-y-6 footer-section">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Agriko Organic Farm
              </h3>
              <p className="text-neutral-600 text-base leading-relaxed">
                A family-owned organic farm committed to sustainable farming practices and delivering the freshest, healthiest produce to your table for over 20 years.
              </p>

              {/* Social Icons */}
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com/agrikofarm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                <a
                  href="#"
                  className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 shadow-sm hover:shadow-md"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>

                <a
                  href="https://www.instagram.com/agrikoph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-600 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-purple-600 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>

                <a
                  href="#"
                  className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 shadow-sm hover:shadow-md"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>

              {/* Farm Badge and Awards */}
              <div className="mt-6 flex items-center space-x-4">
                <div className="bg-green-100 px-4 py-2 rounded-lg">
                  <p className="text-xs text-green-700 font-semibold">🏆 2023 Best Organic Farm Award</p>
                </div>
                <div className="bg-yellow-100 px-4 py-2 rounded-lg">
                  <p className="text-xs text-yellow-700 font-semibold">⭐ 4.9/5 Customer Rating</p>
                </div>
              </div>
            </div>

            {/* Quick Links - Enhanced */}
            <div className="space-y-6 footer-section">
              <h4 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <span className="text-xl">🔗</span>
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/#latest-products" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Our Products
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/find-us" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Find Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="space-y-6 footer-section">
              <h4 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <span className="text-xl">🌿</span>
                Products & Info
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/faq" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Health Benefits
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Storage Guide
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Our Farm
                  </Link>
                </li>
                <li>
                  <Link href="/find-us" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Visit Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-neutral-600 hover:text-green-600 transition-colors flex items-center group">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Organic Certification
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h4 className="text-2xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    Stay Connected
                  </h4>
                  <p className="text-neutral-600 text-lg">
                    Get exclusive offers, farming tips, and new product announcements delivered to your inbox!
                  </p>
                </div>
                <form className="flex flex-col sm:flex-row gap-4 w-full">
                  <input
                    type="email"
                    placeholder="Enter your email for exclusive offers..."
                    className="flex-1 min-w-0 px-5 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-400"
                  />
                  <button
                    type="submit"
                    className="group flex-shrink-0 inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5"
                  >
                    <span className="mr-2 text-lg group-hover:animate-bounce">📧</span>
                    Get Tips & Offers
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="mt-8 pt-8 border-t border-neutral-200">
            <div className="flex flex-col items-center space-y-6">
              {/* Payment Methods */}
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-4">Secure Payment Methods</p>
                <div className="flex items-center justify-center space-x-4">
                  {/* Cash */}
                  <div className="bg-white p-2 rounded-lg border border-neutral-200 shadow-sm">
                    <svg className="w-8 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.31 0-.68-.45-1.11-1.93-1.51-2.02-.53-3.29-1.42-3.29-3.04 0-1.74 1.46-2.91 3.06-3.19V5.5h2.67v1.77c1.07.28 2.02 1.04 2.14 2.55h-1.96c-.05-.72-.38-1.41-1.44-1.41-1.07 0-1.53.59-1.53 1.22 0 .69.68 1.01 2.09 1.41 1.93.56 3.12 1.43 3.12 3.08-.01 1.9-1.61 3.1-3.23 3.47z"/>
                    </svg>
                  </div>
                  {/* Credit Card */}
                  <div className="bg-white p-2 rounded-lg border border-neutral-200 shadow-sm">
                    <svg className="w-8 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                    </svg>
                  </div>
                  {/* Bank Transfer */}
                  <div className="bg-white p-2 rounded-lg border border-neutral-200 shadow-sm">
                    <svg className="w-8 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"/>
                    </svg>
                  </div>
                  {/* GCash */}
                  <div className="bg-white px-3 py-2 rounded-lg border border-neutral-200 shadow-sm">
                    <span className="text-blue-600 font-bold text-sm">GCash</span>
                  </div>
                  {/* PayMaya */}
                  <div className="bg-white px-3 py-2 rounded-lg border border-neutral-200 shadow-sm">
                    <span className="text-green-600 font-bold text-sm">Maya</span>
                  </div>
                </div>
              </div>

              {/* Certifications and Trust Badges */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-6">
                  {/* Organic Certified */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-neutral-600 font-medium">100% Organic</span>
                  </div>
                  {/* SSL Secured */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-neutral-600 font-medium">SSL Secured</span>
                  </div>
                  {/* Proudly Filipino */}
                  <div className="flex items-center space-x-2">
                    <img
                      src="/images/philippines-flag.svg"
                      alt="Philippines Flag"
                      className="w-6 h-4 object-cover rounded-sm"
                    />
                    <span className="text-sm text-neutral-600 font-medium">Proudly Filipino-Owned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar with Enhanced Styling */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200 relative">
            {/* Decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-yellow-500 to-green-500"></div>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-neutral-600 text-sm">
                © 2024 Agriko Organic Farm. All rights reserved. Made with 💚 in Zamboanga Del Sur
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="text-neutral-600 hover:text-green-600 transition-colors text-sm">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-neutral-600 hover:text-green-600 transition-colors text-sm">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="text-neutral-600 hover:text-green-600 transition-colors text-sm">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}