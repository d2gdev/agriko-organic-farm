'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';

export default function FindUsPage() {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'metro-luzon': false,
    'metro-visayas': false,
    'metro-mindanao': false,
    'gaisano-visayas': false,
    'gaisano-mindanao': false,
    'puregold-visayas': false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Enhanced Organization Schema for Find Us Page
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "Store"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "legalName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": "https://shop.agrikoph.com",
    "logo": "https://shop.agrikoph.com/images/Agriko-Logo.png",
    "founder": {
      "@type": "Person",
      "name": "Gerry Paglinawan",
      "jobTitle": "Founder & CEO"
    },
    "address": [
      {
        "@type": "PostalAddress",
        "@id": "https://shop.agrikoph.com/find-us#cebu-office",
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
        "@id": "https://shop.agrikoph.com/find-us#farm-location",
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
        "email": "agrikoph@gmail.com",
        "contactType": "customer service",
        "availableLanguage": ["English", "Filipino"],
        "areaServed": "PH"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/AgrikoPH/",
      "https://agrikoph.com"
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
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shop.agrikoph.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Find Our Products",
        "item": "https://shop.agrikoph.com/find-us"
      }
    ]
  };

  // Retail Partner Schemas
  const metroSupermarketSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://shop.agrikoph.com/find-us#metro-partner",
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
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "ProductGroup",
            "name": "Agriko Herbal Powders"
          },
          "availability": "https://schema.org/InStock"
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
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://shop.agrikoph.com/find-us#gaisano-partner",
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
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "ProductGroup", 
            "name": "Agriko Organic Honey"
          },
          "availability": "https://schema.org/InStock"
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
    "@context": "https://schema.org", 
    "@type": "Organization",
    "@id": "https://shop.agrikoph.com/find-us#puregold-partner",
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
          "availability": "https://schema.org/InStock"
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
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://shop.agrikoph.com/find-us#storepage",
    "name": "Find Agriko Products - Store Locator",
    "description": "Locate Agriko organic products at Metro, Gaisano Grand, and PureGold supermarkets across the Philippines",
    "url": "https://shop.agrikoph.com/find-us",
    "inLanguage": "en-PH",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Agriko Organic Farm",
      "url": "https://shop.agrikoph.com"
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
      
      {/* Enhanced Hero Section with Overlay */}
      <div className="relative">
        <HeroSection
          title="Agriko"
          subtitle="Find Agriko Near You"
          description="Discover our premium organic products at 50+ supermarkets and groceries nationwide! Fresh organic wellness, just around the corner."
          showButtons={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* Partners Section with Filter */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-green-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Retail Partners</h2>
            <p className="text-xl text-gray-600 mb-8">Available in 50+ stores nationwide</p>

            {/* Search/Filter Bar */}
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-gray-600">Filter by Region: Luzon • Visayas • Mindanao</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            
            {/* Metro Supermarkets */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Logo Container */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center h-48">
                <div className="text-center">
                  <span className="text-2xl mb-2">🏬</span>
                  <div className="text-4xl font-bold text-blue-600 mb-1">METRO</div>
                  <div className="text-sm text-gray-600">SUPERMARKET</div>
                  <div className="mt-3 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full inline-block">
                    25+ Locations
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <div className="p-6">
                {/* Luzon Section */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('metro-luzon')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-semibold text-gray-800">Luzon</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">6 stores</span>
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
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-semibold text-gray-800">Visayas</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">20+ stores</span>
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
              </div>
            </div>

            {/* Gaisano Grand Supermarket */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Logo Container */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 flex items-center justify-center h-48">
                <div className="text-center">
                  <span className="text-2xl mb-2">🛒</span>
                  <Image
                    src="/images/gaisano-grand-mall-partner-logo.png"
                    alt="Gaisano Grand Mall"
                    width={160}
                    height={80}
                    className="object-contain max-h-20 mb-2"
                  />
                  <div className="mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full inline-block">
                    27+ Locations
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <div className="p-6">
                {/* Visayas Section */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('gaisano-visayas')}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-semibold text-gray-800">Visayas</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">18 stores</span>
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
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-semibold text-gray-800">Mindanao</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">9 stores</span>
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
              </div>
            </div>

            {/* PureGold Supermarket */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Logo Container */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-8 flex items-center justify-center h-48">
                <div className="text-center">
                  <span className="text-2xl mb-2">🌐</span>
                  <Image
                    src="/images/puregold-supermarket-partner-logo.png"
                    alt="PureGold Supermarket"
                    width={160}
                    height={80}
                    className="object-contain max-h-20 mb-2"
                  />
                  <div className="mt-3 text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full inline-block">
                    5 Locations
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <div className="p-6">
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
              </div>
            </div>
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

              {/* 3-Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Contact Info Column */}
                <div className="bg-white/12 backdrop-blur-md rounded-2xl p-7 shadow-xl hover:bg-white/18 transition-all duration-300 hover:shadow-2xl border border-white/25 hover:border-white/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">💬</span>
                    <span>Contact Info</span>
                  </h3>

                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/30">
                        <span className="text-2xl">📞</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-light">Phone</p>
                        <p className="text-white text-base font-medium mt-1">Contact via email</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/30">
                        <span className="text-2xl">✉️</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-light">Email</p>
                        <p className="text-white text-base font-medium mt-1 break-all">agrikoph@gmail.com</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/30">
                        <span className="text-2xl">🌐</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs uppercase tracking-wider font-light">Website</p>
                        <p className="text-white text-base font-medium mt-1">agrikoph.com</p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Visayas Office Column */}
                <div className="bg-white/12 backdrop-blur-md rounded-2xl p-7 shadow-xl hover:bg-white/18 transition-all duration-300 hover:shadow-2xl border border-white/25 hover:border-white/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">📍</span>
                    <span>Visayas Office</span>
                  </h3>

                  <div className="space-y-5">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-xs uppercase tracking-wider font-light mb-2">Address</p>
                      <p className="text-white text-base leading-relaxed">
                        GF G&A Arcade,<br />
                        Wilson St., Lahug,<br />
                        Cebu City 6000
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-xs uppercase tracking-wider font-light mb-2">Business Hours</p>
                      <p className="text-white text-base">
                        Mon-Fri: 9AM - 6PM<br />
                        Saturday: 9AM - 1PM
                      </p>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Farm Location Column */}
                <div className="bg-white/12 backdrop-blur-md rounded-2xl p-7 shadow-xl hover:bg-white/18 transition-all duration-300 hover:shadow-2xl border border-white/25 hover:border-white/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                  <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">🚜</span>
                    <span>Visit Our Farm</span>
                  </h3>

                  <div className="space-y-5">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <p className="text-white/60 text-xs uppercase tracking-wider font-light mb-2">Mindanao Location</p>
                      <p className="text-white text-base leading-relaxed">
                        Paglinawan Organic Eco Farm,<br />
                        Purok 6, Libertad,<br />
                        Dumingag, Zamboanga Del Sur
                      </p>
                    </div>

                    <Link
                      href="https://maps.google.com"
                      target="_blank"
                      className="inline-flex items-center justify-center w-full bg-white text-green-700 px-6 py-4 rounded-xl font-bold hover:bg-gradient-to-r hover:from-white hover:to-yellow-50 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group"
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

