'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import { URL_CONSTANTS, urlHelpers } from '@/lib/url-constants';

export default function FindUsPage() {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'metro-luzon': false,
    'metro-visayas': false,
    'metro-mindanao': false,
    'gaisano-visayas': false,
    'gaisano-mindanao': false,
    'puregold-visayas': false,
  });

  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter logic for store cards
  const shouldShowStore = (storeChain: string, regions: string[]) => {
    const chainMatch = chainFilter === 'all' || chainFilter === storeChain;
    const regionMatch = regionFilter === 'all' || regions.some(region =>
      regionFilter === region.toLowerCase()
    );

    return chainMatch && regionMatch;
  };

  // Enhanced Organization Schema for Find Us Page
  const organizationSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": ["Organization", "LocalBusiness", "Store"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "legalName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": urlHelpers.getShopUrl(),
    "logo": `${urlHelpers.getShopUrl()}/images/Agriko-Logo.png`,
    "founder": {
      "@type": "Person",
      "name": "Gerry Paglinawan",
      "jobTitle": "Founder & CEO"
    },
    "address": [
      {
        "@type": "PostalAddress",
        "@id": `${urlHelpers.getShopUrl()}/find-us#cebu-office`,
        "name": "Visayas Office",
        "streetAddress": "GF G&A Arcade, Wilson St., Lahug",
        "addressLocality": "Cebu City",
        "addressRegion": "Central Visayas",
        "postalCode": "6000",
        "addressCountry": "PH",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "10.3157",
          "longitude": "123.8854"
        }
      },
      {
        "@type": "PostalAddress",
        "@id": `${urlHelpers.getShopUrl()}/find-us#farm-location`,
        "name": "Paglinawan Organic Eco Farm",
        "streetAddress": "Paglinawan Organic Eco Farm, Purok 6, Libertad",
        "addressLocality": "Dumingag",
        "addressRegion": "Zamboanga Del Sur",
        "postalCode": "7028",
        "addressCountry": "PH",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "8.4167",
          "longitude": "123.4167"
        }
      }
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "email": "jc.paglinawan@agrikoph.com",
        "contactType": "customer service",
        "availableLanguage": ["English", "Filipino"],
        "areaServed": "PH"
      }
    ],
    "sameAs": [
      URL_CONSTANTS.SOCIAL.FACEBOOK,
      URL_CONSTANTS.COMPANY_BASE_URL
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Retail Distribution Network",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Metro Supermarket Chain",
          "description": "Available across Luzon and Visayas Metro locations"
        },
        {
          "@type": "OfferCatalog",
          "name": "Gaisano Grand Supermarket Chain", 
          "description": "Available across Visayas and Mindanao Gaisano Grand locations"
        },
        {
          "@type": "OfferCatalog",
          "name": "PureGold Supermarket Chain",
          "description": "Available across Visayas PureGold locations"
        }
      ]
    }
  };

  // Enhanced Breadcrumb Schema for Find Us Page
  const breadcrumbSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": urlHelpers.getShopUrl()
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Find Our Products",
        "item": urlHelpers.getShopUrl('/find-us')
      }
    ]
  };

  // Retail Partner Schemas
  const metroSupermarketSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "Organization",
    "@id": urlHelpers.getShopUrl('/find-us#metro-partner'),
    "name": "Metro Supermarket",
    "alternateName": "Metro Retail Stores Group",
    "description": "Major Philippine supermarket chain carrying Agriko organic products across Luzon and Visayas",
    "url": "https://www.metro.com.ph",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Agriko Products at Metro",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "ProductGroup",
            "name": "Agriko Organic Rice Varieties"
          },
          "availability": URL_CONSTANTS.SCHEMA.BASE + "/InStock"
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "ProductGroup",
            "name": "Agriko Herbal Powders"
          },
          "availability": URL_CONSTANTS.SCHEMA.BASE + "/InStock"
        }
      ]
    },
    "areaServed": [
      {
        "@type": "State",
        "name": "Metro Manila"
      },
      {
        "@type": "State", 
        "name": "Central Visayas"
      }
    ]
  };

  const gaisanoGrandSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "Organization",
    "@id": urlHelpers.getShopUrl('/find-us#gaisano-partner'),
    "name": "Gaisano Grand",
    "alternateName": "Gaisano Grand Mall",
    "description": "Leading Visayas and Mindanao supermarket chain featuring Agriko organic products",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Agriko Products at Gaisano Grand",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "ProductGroup",
            "name": "Agriko 5-in-1 Turmeric Blend"
          },
          "availability": URL_CONSTANTS.SCHEMA.BASE + "/InStock"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "ProductGroup", 
            "name": "Agriko Organic Honey"
          },
          "availability": URL_CONSTANTS.SCHEMA.BASE + "/InStock"
        }
      ]
    },
    "areaServed": [
      {
        "@type": "State",
        "name": "Central Visayas"
      },
      {
        "@type": "State",
        "name": "Northern Mindanao"
      }
    ]
  };

  const puregoldSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE, 
    "@type": "Organization",
    "@id": urlHelpers.getShopUrl('/find-us#puregold-partner'),
    "name": "PureGold Price Club",
    "alternateName": "PureGold Supermarket",
    "description": "Nationwide Philippine supermarket chain offering Agriko premium organic products",
    "url": "https://www.puregold.com.ph",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Agriko Products at PureGold",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "ProductGroup",
            "name": "Agriko Complete Product Line"
          },
          "availability": URL_CONSTANTS.SCHEMA.BASE + "/InStock"
        }
      ]
    },
    "areaServed": {
      "@type": "Country",
      "name": "Philippines"
    }
  };

  // Store Locator Schema
  const storeLocatorSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "WebPage",
    "@id": urlHelpers.getShopUrl('/find-us#storepage'),
    "name": "Find Agriko Products - Store Locator",
    "description": "Locate Agriko organic products at Metro, Gaisano Grand, and PureGold supermarkets across the Philippines",
    "url": urlHelpers.getShopUrl('/find-us'),
    "inLanguage": "en-PH",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Agriko Organic Farm",
      "url": urlHelpers.getShopUrl()
    },
    "about": {
      "@type": "Thing",
      "name": "Retail Distribution Network",
      "description": "Philippine supermarket chains carrying Agriko organic products"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "Retail Partner Network",
      "numberOfItems": 3,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Organization",
            "name": "Metro Supermarket"
          }
        },
        {
          "@type": "ListItem", 
          "position": 2,
          "item": {
            "@type": "Organization",
            "name": "Gaisano Grand"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Organization", 
            "name": "PureGold Price Club"
          }
        }
      ]
    }
  };

  return (
    <>
      {/* Enhanced Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationSchema, 
            breadcrumbSchema, 
            storeLocatorSchema,
            metroSupermarketSchema,
            gaisanoGrandSchema, 
            puregoldSchema
          ])
        }}
      />
      
      {/* Enhanced Hero Section with Better Readability */}
      <div className="relative">
        <HeroSection
          title="Agriko"
          subtitle="Find Agriko Near You"
          description="Discover our premium organic products at 50+ supermarkets and groceries nationwide! Fresh organic wellness, just around the corner."
          showButtons={false}
          videoSrc="/videos/Hero-Find-Us.mp4"
          pauseAtEnd={true}
          pauseDuration={5000}
          playbackSpeed={0.5}
        />
        {/* Enhanced dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60 pointer-events-none" />
        {/* Additional text shadow enhancement */}
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <style jsx>{`
              .enhanced-text-shadow {
                text-shadow:
                  0 2px 4px rgba(0,0,0,0.9),
                  0 4px 8px rgba(0,0,0,0.7),
                  0 8px 16px rgba(0,0,0,0.5);
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* Partners Section with Filter */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-green-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Retail Partners</h2>
            <p className="text-xl text-gray-600 mb-8">Available in 50+ stores nationwide</p>

            {/* Enhanced Search/Filter Bar with Visual Grouping */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                {/* Filter Header */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Find Stores Near You</h3>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-green-500 to-green-600 mx-auto"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Enhanced Search Input with Better Styling */}
                  <div className="space-y-3">
                    <label htmlFor="store-search" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🔍</span>
                      Search Stores
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        id="store-search"
                        name="store-search"
                        type="text"
                        placeholder="e.g., Cebu City, Metro Ayala..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white"
                        aria-label="Search stores by city or store name"
                      />
                    </div>
                  </div>

                  {/* Enhanced Region Filter */}
                  <div className="space-y-3">
                    <label htmlFor="region-filter" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🌏</span>
                      Filter by Region
                    </label>
                    <div className="relative">
                      <select
                        id="region-filter"
                        name="region-filter"
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                        aria-label="Filter stores by region"
                      >
                        <option value="all">🇵🇭 All Regions</option>
                        <option value="luzon">🏙️ Luzon</option>
                        <option value="visayas">🏝️ Visayas</option>
                        <option value="mindanao">⛰️ Mindanao</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Chain Filter */}
                  <div className="space-y-3">
                    <label htmlFor="chain-filter" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🏬</span>
                      Filter by Store Chain
                    </label>
                    <div className="relative">
                      <select
                        id="chain-filter"
                        name="chain-filter"
                        value={chainFilter}
                        onChange={(e) => setChainFilter(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                        aria-label="Filter stores by chain"
                      >
                        <option value="all">🛒 All Store Chains</option>
                        <option value="metro">🏬 Metro Supermarket</option>
                        <option value="gaisano">🛍️ Gaisano Grand</option>
                        <option value="puregold">🌟 PureGold</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Active Filters Display and Clear Button */}
                {(regionFilter !== 'all' || chainFilter !== 'all' || searchQuery) && (
                  <div className="mt-6 space-y-3">
                    {/* Active filters chips */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {regionFilter !== 'all' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Region: {regionFilter}
                          <button
                            onClick={() => setRegionFilter('all')}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {chainFilter !== 'all' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          Chain: {chainFilter}
                          <button
                            onClick={() => setChainFilter('all')}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {searchQuery && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                          Search: &quot;{searchQuery}&quot;
                          <button
                            onClick={() => setSearchQuery('')}
                            className="ml-2 text-orange-600 hover:text-orange-800"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                    {/* Clear all button */}
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setRegionFilter('all');
                          setChainFilter('all');
                          setSearchQuery('');
                        }}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear all filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile-optimized partner cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 auto-rows-fr">
            {/* Mobile swipe indicator */}
            <div className="lg:hidden text-center mb-4 col-span-full">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <span>👈</span>
                <span>Swipe to explore all partners</span>
                <span>👉</span>
              </p>
            </div>
            <style jsx>{`
              @keyframes gentle-bounce {
                0%, 20%, 50%, 80%, 100% {
                  transform: translateY(0);
                }
                40% {
                  transform: translateY(-4px);
                }
                60% {
                  transform: translateY(-2px);
                }
              }
              .hover-lift:hover {
                animation: gentle-bounce 0.6s ease-in-out;
              }

              @keyframes slide-down {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .animate-fade-in {
                animation: slide-down 0.3s ease-out;
              }
            `}</style>
            
            {/* Metro Supermarkets - Enhanced */}
            {shouldShowStore('metro', ['luzon', 'visayas']) && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-gray-100 hover:border-blue-200 group hover-lift relative flex flex-col h-full">
              {/* Subtle gradient border on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              {/* Enhanced Logo Container */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center h-52 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300 relative overflow-hidden">
                {/* Animated background element */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="text-center relative z-10">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🏬</div>
                  <div className="text-4xl font-bold text-blue-600 mb-2 group-hover:text-blue-700 transition-colors">METRO</div>
                  <div className="text-sm text-gray-600 font-medium">SUPERMARKET</div>
                  <div className="mt-4 inline-flex items-center gap-2">
                    <div className="text-xs bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold border border-blue-200 group-hover:bg-blue-200 group-hover:scale-105 transition-all duration-300">
                      <span className="text-blue-500 mr-1">📍</span>
                      25+ Locations
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Luzon Section */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('metro-luzon')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-semibold text-gray-800">Luzon</span>
                      <span className="text-xs bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-2 py-1 rounded-full font-semibold">6 stores</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['metro-luzon'] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections['metro-luzon'] && (
                    <div className="mt-2 pl-10 space-y-1 animate-fade-in">
                      <p className="text-sm text-gray-600">• Metro Market! Market!</p>
                      <p className="text-sm text-gray-600">• Metro Alabang</p>
                      <p className="text-sm text-gray-600">• Metro Binondo/Metro Imus</p>
                      <p className="text-sm text-gray-600">• Metro Newport Plaza 66 (Pasay)</p>
                      <p className="text-sm text-gray-600">• Metro Lawton</p>
                      <p className="text-sm text-gray-600">• Metro Mandaluyong</p>
                    </div>
                  )}
                </div>

                {/* Visayas Section */}
                <div>
                  <button
                    onClick={() => toggleSection('metro-visayas')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-semibold text-gray-800">Visayas</span>
                      <span className="text-xs bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-2 py-1 rounded-full font-semibold">20+ stores</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['metro-visayas'] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections['metro-visayas'] && (
                    <div className="mt-2 pl-10 space-y-1 animate-fade-in">
                      <p className="text-sm text-gray-600">• Metro Colon</p>
                      <p className="text-sm text-gray-600">• Metro Plaza Store (Toledo)</p>
                      <p className="text-sm text-gray-600">• Metro Naga</p>
                      <p className="text-sm text-gray-600">• Metro Danao</p>
                      <p className="text-sm text-gray-600">• Metro Bacolod</p>
                      <p className="text-sm text-gray-600">• Metro Ayala</p>
                      <p className="text-sm text-gray-600">• Metro Carmen (Fresh N&apos; Easy)</p>
                      <p className="text-sm text-gray-600">• Metro Banilad (Fresh N&apos; Easy)</p>
                      <p className="text-sm text-gray-600">• Metro IT Park</p>
                      <p className="text-sm text-gray-600">• Metro Canduman</p>
                      <p className="text-sm text-gray-600">• Metro Banawa</p>
                      <p className="text-sm text-gray-600">• Metro Wholesalemart (Oriente)</p>
                      <p className="text-sm text-gray-600">• Metro Fresh n Easy (Shangtl)</p>
                      <p className="text-sm text-gray-600">• Metro Negros</p>
                      <p className="text-sm text-gray-600">• Metro Mambaling</p>
                      <p className="text-sm text-gray-600">• Metro Bogo</p>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Super Metro Branches:</p>
                        <p className="text-sm text-gray-600">• Super Metro Lapu Lapu</p>
                        <p className="text-sm text-gray-600">• Super Metro Mandaue</p>
                        <p className="text-sm text-gray-600">• Super Metro Colon</p>
                        <p className="text-sm text-gray-600">• Super Metro Car Car</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Online CTA for Metro */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Can&apos;t visit the store? Order online with free delivery!
                    </p>
                    <Link
                      href="/products"
                      className="group inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 border-2 border-blue-600 hover:border-blue-700"
                    >
                      <span className="mr-2 text-lg group-hover:animate-bounce">🚚</span>
                      Order Online - Free Delivery
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                    <p className="text-xs text-gray-500 mt-2">
                      Same quality products, delivered to your door
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Gaisano Grand Supermarket - Enhanced */}
            {shouldShowStore('gaisano', ['visayas', 'mindanao']) && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-gray-100 hover:border-green-200 group hover-lift relative flex flex-col h-full">
              {/* Subtle gradient border on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              {/* Enhanced Logo Container */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 flex items-center justify-center h-52 group-hover:from-green-100 group-hover:to-green-200 transition-all duration-300 relative overflow-hidden">
                {/* Animated background element */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="text-center relative z-10">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🛒</div>
                  <Image
                    src="/images/gaisano-grand-mall-partner-logo.png"
                    alt="Gaisano Grand Mall"
                    width={160}
                    height={80}
                    className="object-contain max-h-20 mb-3 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="mt-4 inline-flex items-center gap-2">
                    <div className="text-xs bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold border border-green-200 group-hover:bg-green-200 group-hover:scale-105 transition-all duration-300">
                      <span className="text-green-500 mr-1">📍</span>
                      27+ Locations
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Visayas Section */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('gaisano-visayas')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-semibold text-gray-800">Visayas</span>
                      <span className="text-xs bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-2 py-1 rounded-full font-semibold">18 stores</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['gaisano-visayas'] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections['gaisano-visayas'] && (
                    <div className="mt-2 pl-10 space-y-1 animate-fade-in">
                      <p className="text-sm text-gray-600">• Gaisano Grand Cordova SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand North Mandaue SP</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Mactan SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Talamban SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Tabunok SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Liloan SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Toledo SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Plaza SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Minglanilla</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Car Car</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Balamban</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Moalboal</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Dumaguete</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Oslob</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Mandaue Centro</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Jalalai</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Express</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Gingoog</p>
                    </div>
                  )}
                </div>

                {/* Mindanao Section */}
                <div>
                  <button
                    onClick={() => toggleSection('gaisano-mindanao')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-semibold text-gray-800">Mindanao</span>
                      <span className="text-xs bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-2 py-1 rounded-full font-semibold">9 stores</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['gaisano-mindanao'] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections['gaisano-mindanao'] && (
                    <div className="mt-2 pl-10 space-y-1 animate-fade-in">
                      <p className="text-sm text-gray-600">• Gaisano Market Place SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Mall of Estancia</p>
                      <p className="text-sm text-gray-600">• Gaisano City Roxas SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Sara SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Buhangin SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano South Cotabato SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Tibungco SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Gingoog SPMT</p>
                      <p className="text-sm text-gray-600">• Gaisano Grand Ipil SPMT</p>
                    </div>
                  )}
                </div>

                {/* Order Online CTA for Gaisano */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Save time and gas! Order online for home delivery
                    </p>
                    <Link
                      href="/products"
                      className="group inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 border-2 border-green-600 hover:border-green-700"
                    >
                      <span className="mr-2 text-lg group-hover:animate-bounce">🛍️</span>
                      Order Online Now
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                    <p className="text-xs text-gray-500 mt-2">
                      Direct from our farm to your home
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* PureGold Supermarket - Enhanced */}
            {shouldShowStore('puregold', ['visayas']) && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-gray-100 hover:border-orange-200 group hover-lift relative flex flex-col h-full">
              {/* Subtle gradient border on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              {/* Enhanced Logo Container */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-8 flex items-center justify-center h-52 group-hover:from-orange-100 group-hover:to-yellow-200 transition-all duration-300 relative overflow-hidden">
                {/* Animated background element */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                <div className="text-center relative z-10">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🌐</div>
                  <Image
                    src="/images/puregold-supermarket-partner-logo.png"
                    alt="PureGold Supermarket"
                    width={160}
                    height={80}
                    className="object-contain max-h-20 mb-3 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="mt-4 inline-flex items-center gap-2">
                    <div className="text-xs bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-semibold border border-orange-200 group-hover:bg-orange-200 group-hover:scale-105 transition-all duration-300">
                      <span className="text-orange-500 mr-1">📍</span>
                      5 Locations
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <div className="p-6 flex-1 flex flex-col">
                <button
                  onClick={() => toggleSection('puregold-visayas')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <span className="font-semibold text-gray-800">Visayas</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">5 stores</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections['puregold-visayas'] ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections['puregold-visayas'] && (
                  <div className="mt-2 pl-10 space-y-1 animate-fade-in">
                    <p className="text-sm text-gray-600">• PureGold Talisay Cebu</p>
                    <p className="text-sm text-gray-600">• PureGold Kasambagan</p>
                    <p className="text-sm text-gray-600">• PureGold Consolacion</p>
                    <p className="text-sm text-gray-600">• PureGold Mango Ave.</p>
                    <p className="text-sm text-gray-600">• PureGold Guadalupe</p>
                  </div>
                )}

                {/* Order Online CTA for PureGold */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Skip the trip! Get Agriko delivered to your doorstep
                    </p>
                    <Link
                      href="/products"
                      className="group inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 border-2 border-orange-500 hover:border-orange-600"
                    >
                      <span className="mr-2 text-lg group-hover:animate-bounce">⚡</span>
                      Order Online Today
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                    <p className="text-xs text-gray-500 mt-2">
                      Fresh organic products, fast delivery
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Fully Polished Contact Section */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            {/* Gradient with depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A6B35] via-[#0D8C4A] to-[#1EBF73]"></div>

            {/* Diagonal wave pattern overlay */}
            <div className="absolute inset-0">
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path fill="white" fillOpacity="0.2" d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,218.7C672,235,768,213,864,186.7C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 p-10 lg:p-12">
              {/* Enhanced Header */}
              <div className="text-center mb-12">
                <h2 className="text-6xl font-extrabold text-white mb-4 drop-shadow-2xl tracking-tight">
                  Get in Touch
                </h2>
                <p className="text-base text-white/50 font-light max-w-2xl mx-auto">
                  Over 50+ retail partners bringing fresh Agriko wellness near you
                </p>
              </div>

              {/* Mobile-responsive 3-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                {/* Contact Info Column - Mobile Optimized */}
                <div className="bg-white/12 backdrop-blur-md rounded-2xl p-6 lg:p-7 shadow-xl hover:bg-white/18 transition-all duration-300 hover:shadow-2xl border border-white/25 hover:border-white/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  <div className="relative z-10">
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                    <span className="text-2xl lg:text-3xl">💬</span>
                    <span>Contact Info</span>
                  </h3>

                  <div className="space-y-4 lg:space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/30">
                        <span className="text-xl lg:text-2xl">📞</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-light">Phone</p>
                        <p className="text-white text-sm lg:text-base font-medium mt-1">Contact via email</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/30">
                        <span className="text-xl lg:text-2xl">✉️</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-light">Email</p>
                        <p className="text-white text-sm lg:text-base font-medium mt-1 break-words">jc.paglinawan@agrikoph.com</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/30">
                        <span className="text-xl lg:text-2xl">🌐</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-light">Website</p>
                        <p className="text-white text-sm lg:text-base font-medium mt-1">agrikoph.com</p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Visayas Office Column - Mobile Optimized */}
                <div className="bg-white/12 backdrop-blur-md rounded-2xl p-6 lg:p-7 shadow-xl hover:bg-white/18 transition-all duration-300 hover:shadow-2xl border border-white/25 hover:border-white/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  <div className="relative z-10">
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                    <span className="text-2xl lg:text-3xl">📍</span>
                    <span>Visayas Office</span>
                  </h3>

                  <div className="space-y-4 lg:space-y-5">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-xs uppercase tracking-wider font-light mb-2">Address</p>
                      <p className="text-white text-sm lg:text-base leading-relaxed">
                        GF G&A Arcade,<br />
                        Wilson St., Lahug,<br />
                        Cebu City 6000
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-xs uppercase tracking-wider font-light mb-2">Business Hours</p>
                      <p className="text-white text-sm lg:text-base">
                        Mon-Fri: 9AM - 6PM<br />
                        Saturday: 9AM - 1PM
                      </p>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Farm Location Column - Mobile Optimized */}
                <div className="bg-white/12 backdrop-blur-md rounded-2xl p-6 lg:p-7 shadow-xl hover:bg-white/18 transition-all duration-300 hover:shadow-2xl border border-white/25 hover:border-white/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  <div className="relative z-10">
                  <h3 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                    <span className="text-2xl lg:text-3xl">🚜</span>
                    <span>Visit Our Farm</span>
                  </h3>

                  <div className="space-y-4 lg:space-y-5">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-xs uppercase tracking-wider font-light mb-2">Mindanao Location</p>
                      <p className="text-white text-sm lg:text-base leading-relaxed">
                        Paglinawan Organic Eco Farm,<br />
                        Purok 6, Libertad,<br />
                        Dumingag, Zamboanga Del Sur
                      </p>
                    </div>

                    <Link
                      href="https://maps.google.com"
                      target="_blank"
                      className="inline-flex items-center justify-center w-full bg-white text-green-700 px-4 lg:px-6 py-3 lg:py-4 text-sm lg:text-base rounded-xl font-bold hover:bg-gradient-to-r hover:from-white hover:to-yellow-50 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Get Directions</span>
                      <svg className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

