'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state, toggleCart } = useCart();

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/Agriko-Logo.png"
                alt="Agriko Logo"
                width={120}
                height={60}
                className="h-12 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link 
                href="/" 
                className="text-neutral-900 hover:text-primary-700 px-3 py-2 text-sm font-medium transition-colors"
              >
                Agriko Products
              </Link>
              <Link 
                href="/about" 
                className="text-neutral-900 hover:text-primary-700 px-3 py-2 text-sm font-medium transition-colors"
              >
                About Us
              </Link>
              <Link 
                href="/find-us" 
                className="text-neutral-900 hover:text-primary-700 px-3 py-2 text-sm font-medium transition-colors"
              >
                Find Us
              </Link>
              <Link 
                href="/contact" 
                className="text-neutral-900 hover:text-primary-700 px-3 py-2 text-sm font-medium transition-colors"
              >
                Contact Agriko
              </Link>
              <a 
                href="https://www.booking.com/hotel/ph/paglinawan-organic-eco-farm.en-gb.html" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 hover:text-primary-700 px-3 py-2 text-sm font-medium transition-colors"
              >
                Visit Agriko
              </a>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <button className="text-neutral-500 hover:text-primary-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Cart Button */}
            <button 
              onClick={toggleCart}
              className="relative text-neutral-500 hover:text-primary-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m4.5-5a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {state.itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-700 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {state.itemCount > 99 ? '99+' : state.itemCount}
                </span>
              )}
            </button>

            {/* Account Button */}
            <button className="text-neutral-500 hover:text-primary-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <Link 
                href="/" 
                className="text-gray-900 hover:text-primary-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Agriko Products
              </Link>
              <Link 
                href="/about" 
                className="text-gray-900 hover:text-primary-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/find-us" 
                className="text-gray-900 hover:text-primary-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Us
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-900 hover:text-primary-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Agriko
              </Link>
              <a 
                href="https://www.booking.com/hotel/ph/paglinawan-organic-eco-farm.en-gb.html" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-primary-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Visit Agriko
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}