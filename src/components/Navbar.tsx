'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state, toggleCart } = useCart();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const isActivePage = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname?.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/Agriko-Logo.png"
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
                className="nav-link text-neutral-900 hover:text-primary-700 px-3 py-2 transition-colors"
              >
                Agriko Products
              </Link>
              <Link 
                href="/about" 
                className="nav-link text-neutral-900 hover:text-primary-700 px-3 py-2 transition-colors"
              >
                About Us
              </Link>
              <Link 
                href="/find-us" 
                className="nav-link text-neutral-900 hover:text-primary-700 px-3 py-2 transition-colors"
              >
                Find Us
              </Link>
              <Link 
                href="/faq" 
                className="nav-link text-neutral-900 hover:text-primary-700 px-3 py-2 transition-colors"
              >
                FAQ
              </Link>
              <Link 
                href="/contact" 
                className="nav-link text-neutral-900 hover:text-primary-700 px-3 py-2 transition-colors"
              >
                Contact Agriko
              </Link>
              <a 
                href="https://www.booking.com/hotel/ph/paglinawan-organic-eco-farm.en-gb.html" 
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link text-neutral-900 hover:text-primary-700 px-3 py-2 transition-colors"
              >
                Visit Agriko
              </a>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <button 
              onClick={toggleCart}
              className="relative text-neutral-500 hover:text-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
              aria-label={`Shopping cart with ${state.itemCount} items`}
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

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-neutral-500 hover:text-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md p-1"
              aria-label={isMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              aria-expanded={isMenuOpen}
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
          <div className="md:hidden" ref={menuRef}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-neutral-200 bg-white">
              <Link 
                href="/" 
                className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                  isActivePage('/') 
                    ? 'bg-primary-100 text-primary-700 font-semibold' 
                    : 'text-neutral-900 hover:text-primary-600 hover:bg-neutral-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Agriko Products
              </Link>
              <Link 
                href="/about" 
                className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                  isActivePage('/about') 
                    ? 'bg-primary-100 text-primary-700 font-semibold' 
                    : 'text-neutral-900 hover:text-primary-600 hover:bg-neutral-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/find-us" 
                className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                  isActivePage('/find-us') 
                    ? 'bg-primary-100 text-primary-700 font-semibold' 
                    : 'text-neutral-900 hover:text-primary-600 hover:bg-neutral-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Find Us
              </Link>
              <Link 
                href="/faq" 
                className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                  isActivePage('/faq') 
                    ? 'bg-primary-100 text-primary-700 font-semibold' 
                    : 'text-neutral-900 hover:text-primary-600 hover:bg-neutral-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link 
                href="/contact" 
                className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                  isActivePage('/contact') 
                    ? 'bg-primary-100 text-primary-700 font-semibold' 
                    : 'text-neutral-900 hover:text-primary-600 hover:bg-neutral-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Agriko
              </Link>
              <a 
                href="https://www.booking.com/hotel/ph/paglinawan-organic-eco-farm.en-gb.html" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 hover:text-primary-600 hover:bg-neutral-50 block px-3 py-2 text-base font-medium transition-colors rounded-lg"
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