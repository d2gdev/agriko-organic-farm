import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import Testimonials from '@/components/Testimonials';
import TrustBadges from '@/components/TrustBadges';
import { URL_CONSTANTS, urlHelpers } from '@/lib/url-constants';

// Note: metadataBase should be set in layout.tsx instead

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About Agriko Organic Farm - Premium Rice & Health Products',
    description: 'Learn about Agriko Organic Farm, our sustainable farming practices, and commitment to providing premium organic rice varieties, pure herbal powders, and health blends.',
    keywords: 'organic farm, sustainable agriculture, organic rice, herbal powders, health products',
    authors: [{ name: 'Agriko Team' }],
    creator: 'Agriko',
    publisher: 'Agriko',
    robots: 'index, follow',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: urlHelpers.getCompanyUrl('/about'),
      siteName: 'Agriko Organic Farm',
      title: 'About Agriko Organic Farm - Premium Rice & Health Products',
      description: 'Learn about Agriko Organic Farm, our sustainable farming practices, and commitment to providing premium organic rice varieties, pure herbal powders, and health blends.',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Agriko Organic Farm - About Us',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'About Agriko Organic Farm - Premium Rice & Health Products',
      description: 'Learn about Agriko Organic Farm, our sustainable farming practices, and commitment to providing premium organic rice varieties, pure herbal powders, and health blends.',
      images: ['/og-image.jpg'],
    },
  };
}

export async function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#389d65',
  };
}

export default function AboutPage() {
  // Enhanced Organization Schema for About Page
  const organizationSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": ["Organization", "LocalBusiness", "Store"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "legalName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm. Founded in 2016 by Gerry Paglinawan, we are committed to providing premium organic agricultural products while empowering local farmers.",
    "url": urlHelpers.getShopUrl(),
    "mainEntityOfPage": urlHelpers.getShopUrl('/about'),
    "logo": urlHelpers.getShopUrl('/images/Agriko-Logo.png'),
    "image": [
      urlHelpers.getShopUrl('/images/gerry-paglinawan-family-agriko-founders.jpg'),
      urlHelpers.getShopUrl('/images/agriko-organic-farm-landscape-fields.jpg'),
      urlHelpers.getShopUrl('/images/agriko-organic-farm-products-showcase.jpg')
    ],
    "foundingDate": "2016",
    "founder": {
      "@type": "Person",
      "name": "Gerry Paglinawan",
      "jobTitle": "Founder & CEO",
      "description": "Organic agriculturist and founder of Agriko, passionate about natural healing and sustainable farming practices.",
      "knowsAbout": ["Organic Agriculture", "Herbal Medicine", "Sustainable Farming", "Turmeric Cultivation"],
      "memberOf": {
        "@type": "Organization",
        "name": "Agriko Multi-Trade & Enterprise Corp."
      }
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Paglinawan Organic Eco Farm, Purok 6, Libertad",
      "addressLocality": "Dumingag",
      "addressRegion": "Zamboanga Del Sur",
      "postalCode": "7028",
      "addressCountry": "PH"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "8.4167",
      "longitude": "123.4167"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "email": "jc.paglinawan@agrikoph.com",
        "contactType": "customer service",
        "availableLanguage": ["English", "Filipino"],
        "areaServed": "PH"
      },
      {
        "@type": "ContactPoint",
        "email": "orders@agrikoph.com",
        "contactType": "sales",
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
      "name": "Agriko Organic Products",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "5-in-1 Turmeric Tea Blend",
            "description": "Premium health blend containing turmeric, ginger, soursop, moringa, brown sugar, and lemongrass"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "Organic Rice Varieties",
            "description": "Black, Brown, Red, and White organic rice varieties"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "Pure Herbal Powders",
            "description": "Dulaw (Turmeric), Salabat (Ginger), and Moringa powders"
          }
        }
      ]
    },
    "knowsAbout": [
      "Organic Agriculture",
      "Sustainable Farming",
      "Herbal Medicine",
      "Rice Cultivation",
      "Health Supplements",
      "Traditional Filipino Remedies",
      "5-in-1 Turmeric Blend"
    ],
    "areaServed": {
      "@type": "Country",
      "name": "Philippines"
    },
    "award": "100% Organic Producer",
    "slogan": "From Our Farm, To Your Cup - Agree ka? Agriko!",
    "mission": "To provide premium organic agricultural products while empowering local farmers and promoting sustainable practices for a healthier community."
  };

  // Enhanced Breadcrumb Schema for About Page
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
        "name": "About Us",
        "item": urlHelpers.getShopUrl('/about')
      }
    ]
  };

  // About Page WebPage Schema
  const aboutPageSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "AboutPage",
    "@id": urlHelpers.getShopUrl('/about#webpage'),
    "name": "About Agriko Organic Farm - Our Story and Mission",
    "description": "Learn about Agriko Organic Farm's journey from a personal health challenge to a mission of providing premium organic products and empowering local farmers.",
    "url": urlHelpers.getShopUrl('/about'),
    "inLanguage": "en-PH",
    "datePublished": "2016-01-01",
    "dateModified": "2024-03-15",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Agriko Organic Farm",
      "url": urlHelpers.getShopUrl()
    },
    "about": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "mainEntity": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": urlHelpers.getShopUrl('/images/Agriko-Logo.png'),
      "width": "500",
      "height": "200"
    }
  };

  // Story Schema - highlighting the founder's journey
  const storySchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "Article",
    "headline": "The Agriko Story: From Health Challenge to Wellness Mission",
    "description": "Discover how founder Gerry Paglinawan transformed his health challenge in 2013 into a mission to provide premium organic products and empower local farmers.",
    "author": {
      "@type": "Person",
      "name": "Gerry Paglinawan",
      "jobTitle": "Founder & CEO"
    },
    "datePublished": "2016-01-01",
    "publisher": {
      "@type": "Organization",
      "name": "Agriko Organic Farm",
      "logo": {
        "@type": "ImageObject",
        "url": urlHelpers.getShopUrl('/images/Agriko-Logo.png')
      }
    },
    "mainEntityOfPage": urlHelpers.getShopUrl('/about'),
    "about": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    }
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, breadcrumbSchema, aboutPageSchema, storySchema])
        }}
      />

      {/* Skip Navigation for Screen Readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        Skip to main content
      </a>

      {/* Breadcrumbs */}
      <Breadcrumb items={[{ name: 'About' }]} />

      {/* Enhanced Hero Section with Stronger Overlay */}
      <section
        className="relative overflow-hidden min-h-[70vh] flex items-center"
        aria-label="About Agriko Organic Farm - Hero section"
      >
        <Image
          src="/images/hero.png"
          alt="Lush organic farm fields with farmers harvesting fresh vegetables and herbs under golden sunlight, representing Agriko's sustainable farming practices"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Much stronger dark overlay for maximum text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />

        {/* Hero Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center">
              {/* Further Reduced Logo Size */}
              <div className="flex justify-center mb-8 animate-fade-in">
                <Image
                  src="/images/Agriko-Logo.png"
                  alt="Agriko Organic Farm Logo"
                  width={300}
                  height={120}
                  className="w-48 sm:w-56 md:w-64 lg:w-72 h-auto drop-shadow-2xl"
                  priority
                />
              </div>

              {/* Enhanced Tagline with stronger value proposition */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-bold mb-4 drop-shadow-2xl">
                Reduce Inflammation. Boost Energy. Heal Naturally.
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-yellow-200 font-medium mb-8 sm:mb-10 drop-shadow-2xl">
                Join 10,000+ Filipinos who transformed their health with our 5-in-1 turmeric blend
              </p>

              {/* CTA Buttons with Animation */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 focus:from-green-700 focus:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden group animate-glow"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></span>
                  <span className="relative">Start My Healing Journey</span>
                  <svg className="w-5 h-5 ml-2 relative group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="#story"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/30 hover:border-white/50 focus:bg-white/30 focus:border-white/50 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  See Our Science
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content">
        {/* Social Proof Section - Above the Fold */}
        <section
          className="bg-white border-b border-gray-200"
          aria-labelledby="social-proof-heading"
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-8">
            <h2 id="social-proof-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Trusted by Thousands of Health-Conscious Filipinos
            </h2>
            <p className="text-lg text-gray-600">
              See why families across the Philippines choose Agriko for their wellness journey
            </p>
          </div>

          {/* Enhanced Customer Metrics */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12"
            role="group"
            aria-label="Customer trust metrics and statistics"
          >
            <div className="text-center bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">10,000+</div>
              <div className="text-sm text-gray-700 font-medium">Happy Customers</div>
              <div className="text-xs text-gray-600 mt-1">Since 2016</div>
            </div>
            <div className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
              <div className="text-3xl md:text-4xl font-bold text-yellow-600 mb-2">4.8★</div>
              <div className="text-sm text-gray-700 font-medium">Average Rating</div>
              <div className="text-xs text-gray-600 mt-1">2,500+ Reviews</div>
            </div>
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">8+</div>
              <div className="text-sm text-gray-700 font-medium">Years in Business</div>
              <div className="text-xs text-gray-600 mt-1">Est. 2016</div>
            </div>
            <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">15+</div>
              <div className="text-sm text-gray-700 font-medium">Store Locations</div>
              <div className="text-xs text-gray-600 mt-1">Metro, Gaisano, PureGold</div>
            </div>
            <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">98%</div>
              <div className="text-sm text-gray-700 font-medium">Satisfaction Rate</div>
              <div className="text-xs text-gray-600 mt-1">30-Day Guarantee</div>
            </div>
            <div className="text-center bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-sm text-gray-700 font-medium">Organic Certified</div>
              <div className="text-xs text-gray-600 mt-1">USDA & Philippine</div>
            </div>
          </div>

          {/* Customer Testimonials - Enhanced with specific health outcomes */}
          <Testimonials limit={3} className="mb-6" />

          {/* Link to Full Reviews */}
          <div className="text-center mb-8">
            <Link
              href="/review"
              className="inline-flex items-center text-green-700 hover:text-green-800 focus:text-green-800 focus:outline-none focus:underline font-medium transition-colors text-sm"
            >
              Read All 2,500+ Customer Reviews
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Enhanced Trust Badges with Certifications */}
          <TrustBadges
            layout="flex"
            badges={['organic', 'fda', 'natural', 'family-farm', 'guarantee']}
            className="mb-4"
          />
        </div>
        </section>

        {/* Post-Social Proof CTA */}
        <section
          className="bg-gradient-to-br from-yellow-50 to-orange-50 border-y border-orange-200"
          aria-labelledby="community-cta-heading"
        >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h3 id="community-cta-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Join Our Community of Wellness Champions
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Be part of the 10,000+ Filipino families who chose natural healing over synthetic alternatives
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Order Your First Bottle Today
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/reviews"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-700 font-semibold rounded-xl border-2 border-green-200 hover:bg-green-50 transition-all duration-300"
            >
              Read More Reviews
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Money-back guarantee
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free shipping over ₱1,500
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              100% organic certified
            </span>
          </div>
        </div>
        </section>

        {/* Table of Contents Navigation */}
      <nav
        className="bg-gradient-to-r from-green-50 to-yellow-50 border-y border-green-200"
        aria-labelledby="quick-nav-heading"
        role="navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 id="quick-nav-heading" className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#benefits"
                className="inline-flex items-center px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 focus:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm border border-green-200"
                aria-label="Jump to Health Benefits section"
              >
                <span className="text-lg mr-2" aria-hidden="true">💚</span>
                Health Benefits
              </a>
              <a
                href="#ingredients"
                className="inline-flex items-center px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 focus:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm border border-green-200"
                aria-label="Jump to 5-in-1 Blend Ingredients section"
              >
                <span className="text-lg mr-2" aria-hidden="true">🌿</span>
                5-in-1 Blend
              </a>
              <a
                href="#products"
                className="inline-flex items-center px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 focus:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm border border-green-200"
                aria-label="Jump to Our Products section"
              >
                <span className="text-lg mr-2" aria-hidden="true">🛒</span>
                Our Products
              </a>
              <a
                href="#story"
                className="inline-flex items-center px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 focus:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm border border-green-200"
                aria-label="Jump to Our Story section"
              >
                <span className="text-lg mr-2" aria-hidden="true">📖</span>
                Our Story
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Better Spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-20">

          {/* Primary Content - Health Benefits & Products */}
          <div className="lg:col-span-2 order-1">
            <section aria-labelledby="ingredients-heading">
              <h2 id="ingredients" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-8 sm:mb-12 font-[family-name:var(--font-crimson)]">
                5-IN-1 BLEND INGREDIENTS
              </h2>

            <div className="mb-8 sm:mb-12 space-y-6">
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                When founder <span className="font-semibold text-green-700">Gerry Paglinawan</span> healed himself with homemade turmeric in 2013, he discovered his calling. Today, Agriko brings you the same organic wellness solutions that transformed one man&apos;s health into a mission.
              </p>

              <div className="mt-4">
                <Link
                  href="/about/founder-story"
                  className="inline-flex items-center text-green-700 hover:text-green-800 font-medium transition-colors"
                >
                  Read the Full Founder Story
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-yellow-50 border-l-4 border-green-600 p-4 rounded-r-lg">
                <p className="text-lg font-bold text-green-800 text-center italic">
                  &ldquo;Agree ka? Agriko!&rdquo;
                </p>
                <p className="text-sm text-gray-600 text-center mt-1">
                  Premium organic wellness, Filipino pride
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-white/80 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="text-sm font-semibold text-gray-800">Premium Quality</div>
                </div>
                <div className="bg-white/80 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🌾</div>
                  <div className="text-sm font-semibold text-gray-800">100% Organic</div>
                </div>
                <div className="bg-white/80 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🇵🇭</div>
                  <div className="text-sm font-semibold text-gray-800">Filipino Made</div>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Shop Our Products
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
            </section>

            {/* Products Section */}
            <section aria-labelledby="products-heading">
              <h2 id="products-heading" className="sr-only">Our Products</h2>
              <div id="products" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
              <div className="group cursor-pointer touch-manipulation">
                <div className="relative bg-white rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square h-0 pb-[100%] relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src="/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg"
                      alt="Agriko 5-in-1 Turmeric Blend premium health supplement in 500g package, featuring organic turmeric, ginger, lemongrass, and moringa blend for inflammation reduction and energy boost"
                      width={300}
                      height={300}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                      className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold" aria-label="Large size 500 grams">
                    500g
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-gray-800">5-in-1 Turmeric Blend</p>
                  <p className="text-xs text-gray-600 mt-1">Premium Health Supplement</p>
                  {/* Review snippet integration */}
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="flex text-yellow-500 text-xs">
                      {"★".repeat(5)}
                    </div>
                    <span className="text-xs text-gray-600 ml-1">4.9 (342 reviews)</span>
                  </div>
                  <p className="text-xs text-gray-600 italic mt-1">&ldquo;Life-changing results!&rdquo;</p>
                </div>
              </div>

              <div className="group cursor-pointer touch-manipulation">
                <div className="relative bg-white rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square h-0 pb-[100%] relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src="/images/agriko-turmeric-5in1-blend-180g-organic.jpg"
                      alt="Agriko 5-in-1 Turmeric Blend in compact 180g travel-friendly size, organic herbal supplement blend perfect for on-the-go wellness routines"
                      width={300}
                      height={300}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                      className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold" aria-label="Travel size 180 grams">
                    180g
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-gray-800">5-in-1 Turmeric Blend</p>
                  <p className="text-xs text-gray-600 mt-1">Travel Size</p>
                  {/* Review snippet integration */}
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="flex text-yellow-500 text-xs">
                      {"★".repeat(5)}
                    </div>
                    <span className="text-xs text-gray-600 ml-1">4.8 (127 reviews)</span>
                  </div>
                  <p className="text-xs text-gray-600 italic mt-1">&ldquo;Perfect for travel!&rdquo;</p>
                </div>
              </div>

              <div className="group cursor-pointer touch-manipulation">
                <div className="relative bg-white rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square h-0 pb-[100%] relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src="/images/agriko-pure-salabat-ginger-tea-100g.jpg"
                      alt="Agriko Pure Salabat traditional Filipino ginger tea in 100g package, made from fresh organic ginger root for digestive health and nausea relief"
                      width={300}
                      height={300}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                      className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold" aria-label="Small size 100 grams">
                    100g
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-gray-800">Pure Salabat</p>
                  <p className="text-xs text-gray-600 mt-1">Traditional Ginger Tea</p>
                  {/* Review snippet integration */}
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="flex text-yellow-500 text-xs">
                      {"★".repeat(5)}
                    </div>
                    <span className="text-xs text-gray-600 ml-1">4.7 (89 reviews)</span>
                  </div>
                  <p className="text-xs text-gray-600 italic mt-1">&ldquo;Stops nausea instantly!&rdquo;</p>
                </div>
              </div>

              <div className="group cursor-pointer touch-manipulation">
                <div className="relative bg-white rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square h-0 pb-[100%] relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src="/images/agriko-pure-organic-honey-jar.jpg"
                      alt="Agriko Pure Organic Honey in glass jar, raw and unprocessed natural honey harvested from local beehives, rich golden color indicating high quality and purity"
                      width={300}
                      height={300}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
                      className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold" aria-label="Natural and unprocessed">
                    Natural
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-gray-800">Pure Organic Honey</p>
                  <p className="text-xs text-gray-600 mt-1">Raw & Unprocessed</p>
                </div>
              </div>
            </div>
            </section>

            {/* Wellness Journey CTA - Split Layout with Lifestyle Focus */}
            <section aria-labelledby="wellness-journey-heading">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-orange-50 via-yellow-50 to-cream">
              {/* Curved wave pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
                  <path fill="#fb923c" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,133.3C960,128,1056,96,1152,96C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                  <path fill="#fb923c" fillOpacity="0.2" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,256C960,245,1056,203,1152,192C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
                {/* Left Column - Lifestyle Image */}
                <div className="relative h-[400px] lg:h-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-yellow-400/20"></div>
                  <Image
                    src="/images/hero.png"
                    alt="Person enjoying a peaceful morning wellness routine with organic herbal tea, representing the daily ritual of natural health and the transformation possible through Agriko's organic products"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>

                {/* Right Column - Content */}
                <div className="p-10 lg:p-12 flex flex-col justify-center">
                  <h3 id="wellness-journey-heading" className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">
                    Your Daily Ritual for Natural Wellness
                  </h3>

                  <p className="text-xl text-gray-700 mb-8">
                    Join over <span className="font-bold text-3xl text-orange-600">10,000</span> happy customers who trust Agriko for their daily wellness needs.
                  </p>

                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Experience the difference of authentic organic products grown with love from our family farm. Every cup is a step towards better health.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Link
                      href="/#latest-products"
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 focus:from-green-700 focus:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 transform hover:scale-105 shadow-xl text-center text-lg"
                      aria-label="Start shopping for our organic products"
                    >
                      Start Shopping
                    </Link>
                    <Link
                      href="/find-us"
                      className="flex-1 border-2 border-green-600 text-green-700 px-8 py-4 rounded-xl font-bold hover:bg-green-50 focus:bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 transform hover:scale-105 text-center text-lg"
                      aria-label="Find our store locations"
                    >
                      Visit Store
                    </Link>
                  </div>

                  {/* Enhanced Trust Badge Row */}
                  <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-full p-4 border border-green-200" role="list" aria-label="Product certifications and trust indicators">
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start items-center">
                      <span className="inline-flex items-center text-sm font-medium text-green-700 bg-white px-3 py-1 rounded-full shadow-sm" role="listitem">
                        <svg className="w-4 h-4 text-green-600 mr-1.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        100% Organic
                      </span>
                      <span className="text-gray-500" aria-hidden="true">•</span>
                      <span className="inline-flex items-center text-sm font-medium text-yellow-700 bg-white px-3 py-1 rounded-full shadow-sm" role="listitem">
                        <svg className="w-4 h-4 text-yellow-600 mr-1.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        100% Natural
                      </span>
                      <span className="text-gray-500" aria-hidden="true">•</span>
                      <span className="inline-flex items-center text-sm font-medium text-orange-700 bg-white px-3 py-1 rounded-full shadow-sm" role="listitem">
                        <svg className="w-4 h-4 text-orange-600 mr-1.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        Family Farm Since 2016
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </section>
          </div>

          {/* Sidebar - Quick Links and Trust Signals */}
          <aside className="lg:col-span-1 order-2" aria-label="Quick links and certifications">
            <div className="sticky top-24 space-y-6">
              {/* Trust Badges Component */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                <TrustBadges layout="compact" />
              </div>

              {/* Quick Navigation */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <nav className="space-y-2" aria-label="Quick navigation links">
                  <a href="#ingredients" className="block text-green-700 hover:text-green-800 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors">
                    5-in-1 Blend
                  </a>
                  <a href="#products" className="block text-green-700 hover:text-green-800 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors">
                    Our Products
                  </a>
                  <Link href="/#latest-products" className="block text-green-700 hover:text-green-800 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors">
                    Shop Now
                  </Link>
                </nav>
              </div>
            </div>
          </aside>
        </div>
      </div>
      </main>
    </>
  );
}