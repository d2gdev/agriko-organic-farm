'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import SearchModal from './SearchModal';
import { WCProduct } from '@/types/woocommerce';

interface NavbarProps {
  products?: WCProduct[];
  isSearchOpen?: boolean;
  setIsSearchOpen?: (open: boolean) => void;
}

export default function Navbar({ 
  products = [], 
  isSearchOpen: externalIsSearchOpen, 
  setIsSearchOpen: externalSetIsSearchOpen 
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [internalIsSearchOpen, setInternalIsSearchOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isSearchOpen = externalIsSearchOpen ?? internalIsSearchOpen;
  const setIsSearchOpen = externalSetIsSearchOpen ?? setInternalIsSearchOpen;
  const { state, toggleCart } = useCart();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
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

  const navItems = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Shop', href: '/products', icon: '🛍️' },
    { name: 'About', href: '/about', icon: '🏡' },
    { name: 'Find Us', href: '/find-us', icon: '📍' },
    { name: 'FAQ', href: '/faq', icon: '❓' },
    { name: 'Contact', href: '/contact', icon: '📞' },
    { name: 'Cart', href: '/cart', icon: '🛒' },
    { name: 'Visit Farm', href: 'https://www.booking.com/hotel/ph/paglinawan-organic-eco-farm.en-gb.html', icon: '🚜', external: true },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-neutral-200/50' 
          : 'bg-white/90 backdrop-blur-sm shadow-sm border-b border-neutral-200'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 group">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative">
                <Image
                  src="/images/Agriko-Logo.png"
                  alt="Agriko Organic Farm"
                  width={120}
                  height={60}
                  className={`h-12 w-auto transition-all duration-300 ${
                    isScrolled ? 'h-10' : 'h-12'
                  } group-hover:scale-105`}
                  priority
                />
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-primary-400 rounded-full blur-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div 
              className="flex items-center space-x-1"
              role="menubar"
              aria-label="Main menu"
            >
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary-50"
                    role="menuitem"
                    aria-label={`${item.name} (opens in new window)`}
                  >
                    <div className="flex items-center space-x-2 text-neutral-700 group-hover:text-primary-700">
                      <span className="text-sm">{item.icon}</span>
                      <span className="font-medium text-sm">{item.name}</span>
                      <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    
                    {/* Hover line */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary-600 group-hover:w-3/4 transition-all duration-200"></div>
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActivePage(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-700'
                    }`}
                    role="menuitem"
                    aria-current={isActivePage(item.href) ? 'page' : undefined}
                    aria-label={item.name}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    
                    {/* Active indicator */}
                    {isActivePage(item.href) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-primary-600 rounded-full"></div>
                    )}
                    
                    {/* Hover line */}
                    {!isActivePage(item.href) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary-600 group-hover:w-3/4 transition-all duration-200"></div>
                    )}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200 hidden md:block hover:scale-110 active:animate-jiggle"
              aria-label="Search products"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Enhanced Cart Button */}
            <button 
              onClick={toggleCart}
              className="relative p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200 group"
              aria-label={`Shopping cart with ${state.itemCount} items`}
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5" />
              </svg>
              
              {/* Enhanced Cart Counter */}
              {state.itemCount > 0 && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                    {state.itemCount > 99 ? '99+' : state.itemCount}
                  </div>
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20"></div>
                </div>
              )}
              
              {/* Hover tooltip */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-neutral-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {state.itemCount === 0 ? 'Cart is empty' : `${state.itemCount} item${state.itemCount === 1 ? '' : 's'}`}
              </div>
            </button>

            {/* Enhanced Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <div className="relative w-6 h-6">
                <span className={`absolute left-0 top-1 block h-0.5 w-6 bg-current transform transition-all duration-200 ${
                  isMenuOpen ? 'rotate-45 top-3' : ''
                }`}></span>
                <span className={`absolute left-0 top-3 block h-0.5 w-6 bg-current transition-all duration-200 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}></span>
                <span className={`absolute left-0 top-5 block h-0.5 w-6 bg-current transform transition-all duration-200 ${
                  isMenuOpen ? '-rotate-45 top-3' : ''
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div 
            className="py-4 space-y-2 border-t border-neutral-200 bg-white/95 backdrop-blur-sm" 
            ref={menuRef}
            role="menu"
            aria-label="Mobile navigation menu"
            aria-hidden={!isMenuOpen}
          >
            {navItems.map((item, index) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg mx-2 transition-all duration-200 group"
                  onClick={() => setIsMenuOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="menuitem"
                  aria-label={`${item.name} (opens in new window)`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg mx-2 transition-all duration-200 ${
                    isActivePage(item.href)
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'text-neutral-700 hover:text-primary-700 hover:bg-primary-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="menuitem"
                  aria-current={isActivePage(item.href) ? 'page' : undefined}
                  aria-label={item.name}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                  {isActivePage(item.href) && (
                    <div className="ml-auto w-2 h-2 bg-primary-600 rounded-full"></div>
                  )}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>
      
      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
      />
    </nav>
  );
}