import HeroSection from '@/components/HeroSection';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';

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
      url: 'https://agrikoph.com/about',
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
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "Store"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "legalName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm. Founded in 2016 by Gerry Paglinawan, we are committed to providing premium organic agricultural products while empowering local farmers.",
    "url": "https://shop.agrikoph.com",
    "mainEntityOfPage": "https://shop.agrikoph.com/about",
    "logo": "https://shop.agrikoph.com/images/Agriko-Logo.png",
    "image": [
      "https://shop.agrikoph.com/images/gerry-paglinawan-family-agriko-founders.jpg",
      "https://shop.agrikoph.com/images/agriko-organic-farm-landscape-fields.jpg",
      "https://shop.agrikoph.com/images/agriko-organic-farm-products-showcase.jpg"
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
        "email": "agrikoph@gmail.com",
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
      "https://www.facebook.com/AgrikoPH/",
      "https://agrikoph.com"
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
    "award": "Certified Organic Producer",
    "slogan": "From Our Farm, To Your Cup - Agree ka? Agriko!",
    "mission": "To provide premium organic agricultural products while empowering local farmers and promoting sustainable practices for a healthier community."
  };

  // Enhanced Breadcrumb Schema for About Page
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
        "name": "About Us",
        "item": "https://shop.agrikoph.com/about"
      }
    ]
  };

  // About Page WebPage Schema
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": "https://shop.agrikoph.com/about#webpage",
    "name": "About Agriko Organic Farm - Our Story and Mission",
    "description": "Learn about Agriko Organic Farm's journey from a personal health challenge to a mission of providing premium organic products and empowering local farmers.",
    "url": "https://shop.agrikoph.com/about",
    "inLanguage": "en-PH",
    "datePublished": "2016-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "isPartOf": {
      "@type": "WebSite",
      "name": "Agriko Organic Farm",
      "url": "https://shop.agrikoph.com"
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
      "url": "https://shop.agrikoph.com/images/Agriko-Logo.png",
      "width": "500",
      "height": "200"
    }
  };

  // Story Schema - highlighting the founder's journey
  const storySchema = {
    "@context": "https://schema.org",
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
        "url": "https://shop.agrikoph.com/images/Agriko-Logo.png"
      }
    },
    "mainEntityOfPage": "https://shop.agrikoph.com/about",
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

      {/* Breadcrumbs */}
      <Breadcrumb items={[{ name: 'About' }]} />

      {/* Enhanced Hero Section with Stronger Overlay */}
      <div className="relative overflow-hidden min-h-[70vh] flex items-center">
        <Image
          src="/images/hero.png"
          alt="Hero background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Much stronger dark overlay for maximum text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />

        {/* Hero Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              {/* Further Reduced Logo Size */}
              <div className="flex justify-center mb-8 animate-fade-in">
                <Image
                  src="/images/Agriko-Logo.png"
                  alt="Agriko Organic Farm Logo"
                  width={300}
                  height={120}
                  className="w-56 md:w-64 lg:w-72 h-auto drop-shadow-2xl"
                  priority
                />
              </div>

              {/* Enhanced Tagline with better contrast */}
              <p className="text-2xl md:text-3xl lg:text-4xl text-white font-medium mb-10 drop-shadow-2xl">
                Organic Wellness from Farm to Cup
              </p>

              {/* CTA Buttons with Animation */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden group animate-glow"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></span>
                  <span className="relative">Shop Now</span>
                  <svg className="w-5 h-5 ml-2 relative group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="#story"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Learn More
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Better Spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">

          {/* Left Column - Company Story */}
          <div className="lg:col-span-1">
            <h2 id="story" className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-12 font-[family-name:var(--font-crimson)]">
              COMPANY STORY
            </h2>

            <div className="mb-12 space-y-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                Inspired by his personal journey, Founder <span className="font-semibold text-green-700">Gerry Paglinawan</span> transformed his health challenge into wellness. In 2013, while battling illness, Gerry crafted homemade turmeric juice using <span className="font-semibold">agricultural knowledge</span>. The next day, he experienced significant health improvement.
              </p>

              <p className="text-gray-700 leading-relaxed text-lg">
                This moment ignited his passion for creating <Link href="/faq" className="text-green-600 hover:text-green-700 underline font-medium">turmeric powders</Link>. Known as an <span className="font-semibold">organic agriculturist</span>, Gerry&apos;s natural healing reputation grew. Many sought his <Link href="/faq" className="text-green-600 hover:text-green-700 underline font-medium">herbal remedies</Link>, and after his first turmeric powder order, he discovered his calling.
              </p>

              <div className="bg-gradient-to-r from-green-50 to-yellow-50 border-l-4 border-green-600 p-6 rounded-r-lg my-8">
                <p className="text-xl font-bold text-green-800 text-center italic">
                  &ldquo;Agree ka? Agriko!&rdquo;
                </p>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Our signature Filipino greeting that embodies our commitment to quality and community
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed text-lg">
                In 2016, Gerry registered Agriko Multi-Trade & Enterprise Corp., a manufacturing and distribution company dedicated to producing agricultural value-added products that serve as alternative <Link href="/faq" className="text-green-600 hover:text-green-700 underline font-medium">herbal remedies and organic rice</Link> for the community.
              </p>

              <p className="text-gray-700 leading-relaxed text-lg">
                Agriko is committed to partnering with local farmers, providing them with education on agriculture, and ensuring their livelihood by connecting them directly to the market through <Link href="/" className="text-green-600 hover:text-green-700 underline font-medium">our products</Link>. <Link href="/find-us" className="text-green-600 hover:text-green-700 underline font-medium">Find us</Link> at supermarkets nationwide.
              </p>
            </div>

            {/* Enhanced Values Section with Better Layout */}
            <div className="bg-gradient-to-br from-green-50 via-yellow-50/50 to-green-50 -mx-4 px-6 py-12 sm:-mx-6 sm:px-8 lg:-mx-8 lg:px-10 rounded-2xl shadow-inner border border-green-100">
              <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-12 font-[family-name:var(--font-crimson)] text-center">
                OUR VALUES
              </h2>

              <div className="grid grid-cols-1 gap-8">
                <div className="flex items-start space-x-5 group bg-white/60 backdrop-blur-sm p-6 rounded-xl hover:bg-white/80 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    {/* Leaf icon */}
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17 7c0 2.38-.89 4.54-2.36 6.18l2.07 2.07c.39.39.39 1.02 0 1.41-.39.39-1.02.39-1.41 0l-2.07-2.07C11.59 16.11 9.38 17 7 17c-5 0-9-4-9-9s4-9 9-9 9 4 9 9zm-9 5c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z"/>
                      <path d="M7 2C3.69 2 1 4.69 1 8s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm2.5 9L7 8.5 4.5 11 3 9.5 5.5 7 3 4.5 4.5 3 7 5.5 9.5 3 11 4.5 8.5 7 11 9.5 9.5 11z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Organic Excellence</h4>
                    <p className="text-gray-600 leading-relaxed">
                      100% chemical-free agriculture with certified organic products that promote natural healing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-5 group bg-white/60 backdrop-blur-sm p-6 rounded-xl hover:bg-white/80 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    {/* People icon */}
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Community Empowerment</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Supporting local farmers with education and direct market connections for sustainable livelihoods.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-5 group bg-white/60 backdrop-blur-sm p-6 rounded-xl hover:bg-white/80 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    {/* Heart icon */}
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Health & Wellness</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Traditional Filipino remedies crafted for modern wellness seekers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 5 Ingredients & More */}
          <div className="lg:col-span-2">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-12 font-[family-name:var(--font-crimson)]">
              5-IN-1 BLEND INGREDIENTS
            </h2>

            {/* Enhanced Ingredients Cards with Fixed Heights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {/* Turmeric Card */}
              <div className="h-[220px] bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 hover:-translate-y-2 group cursor-pointer flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <span className="text-3xl group-hover:animate-bounce">🌿</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-2 text-lg">Turmeric</h4>
                <p className="text-sm text-gray-600 leading-relaxed flex-grow">Good for Arthritis and Memory Loss</p>
              </div>

              {/* Ginger Card */}
              <div className="h-[220px] bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-2 group cursor-pointer flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <span className="text-3xl group-hover:animate-bounce">🫚</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-2 text-lg">Ginger</h4>
                <p className="text-sm text-gray-600 leading-relaxed flex-grow">Great for Pain Relief</p>
              </div>

              {/* Soursop Card */}
              <div className="h-[220px] bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-2xl hover:border-green-300 transition-all duration-300 hover:-translate-y-2 group cursor-pointer flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <span className="text-3xl group-hover:animate-bounce">🍃</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-2 text-lg">Soursop</h4>
                <p className="text-sm text-gray-600 leading-relaxed flex-grow">Cancer Killing Properties</p>
              </div>

              {/* Moringa Card */}
              <div className="h-[220px] bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-2xl hover:border-teal-300 transition-all duration-300 hover:-translate-y-2 group cursor-pointer flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <span className="text-3xl group-hover:animate-bounce">🌱</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-2 text-lg">Moringa</h4>
                <p className="text-sm text-gray-600 leading-relaxed flex-grow">Manages Blood Sugar & Cholesterol</p>
              </div>

              {/* Brown Sugar Card */}
              <div className="h-[220px] bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-2xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2 group cursor-pointer flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <span className="text-3xl group-hover:animate-bounce">🍯</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-2 text-lg">Brown Sugar</h4>
                <p className="text-sm text-gray-600 leading-relaxed flex-grow">Calcium, Iron, and Potassium</p>
              </div>

              {/* Lemongrass Card */}
              <div className="h-[220px] bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-2xl hover:border-lime-300 transition-all duration-300 hover:-translate-y-2 group cursor-pointer flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-green-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                  <span className="text-3xl group-hover:animate-bounce">🌾</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-2 text-lg">Lemongrass</h4>
                <p className="text-sm text-gray-600 leading-relaxed flex-grow">Relieves headaches & indigestion</p>
              </div>
            </div>

            {/* Enhanced Farm to Cup Excellence Section */}
            <div className="bg-gradient-to-br from-green-50 to-yellow-50 border-2 border-green-200 rounded-2xl p-8 mb-16 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Farm to Cup Excellence</h3>
              </div>

              <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                From our organic farms in Dumingag, Zamboanga Del Sur to your kitchen, every product is carefully cultivated, processed, and packaged to deliver the highest quality natural health supplements and rice varieties.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-700">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>100% Chemical-Free Cultivation</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Traditional Processing Methods</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Direct Farm-to-Consumer Connection</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Supporting Local Filipino Farmers</span>
                </div>
              </div>
            </div>

            {/* Perfect Blend Section - Enhanced with Premium Pattern */}
            <div className="relative rounded-3xl mb-16 overflow-hidden bg-gradient-to-br from-green-50 via-yellow-50/30 to-green-50 border border-green-200/50">
              {/* Premium leaf pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2305966950' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px'
                }}></div>
              </div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-10 lg:p-12">
                {/* Left Column - Visual Element */}
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-md">
                    {/* Tea Cup Mockup Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-orange-200 to-yellow-300 rounded-2xl blur-3xl opacity-40"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/50">
                      <div className="aspect-square relative rounded-xl overflow-hidden bg-gradient-to-br from-yellow-100 to-orange-100">
                        <Image
                          src="/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg"
                          alt="The Perfect Blend"
                          width={400}
                          height={400}
                          className="w-full h-full object-contain p-4"
                        />
                      </div>
                      <div className="mt-6 flex justify-center gap-2 flex-wrap">
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">100% Organic</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">6 Ingredients</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">Daily Wellness</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Content with Hierarchy */}
                <div className="flex flex-col justify-center">
                  <h3 className="text-5xl font-bold text-gray-900 mb-3 font-[family-name:var(--font-crimson)]">
                    The Perfect Blend
                  </h3>
                  <p className="text-2xl text-green-700 font-medium mb-6">
                    Six Ingredients, One Daily Ritual
                  </p>

                  <p className="text-gray-700 text-lg leading-relaxed mb-8 max-w-xl">
                    Meticulously crafted for maximum health benefits and delicious taste. Transform your wellness routine with just one cup a day.
                  </p>

                  {/* Ingredient Badges with Increased Spacing */}
                  <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full">
                      <span className="text-2xl mr-2">🌿</span>
                      <span className="text-sm font-semibold text-yellow-800">Turmeric</span>
                    </div>
                    <div className="flex items-center bg-orange-100 px-4 py-2 rounded-full">
                      <span className="text-2xl mr-2">🫚</span>
                      <span className="text-sm font-semibold text-orange-800">Ginger</span>
                    </div>
                    <div className="flex items-center bg-green-100 px-4 py-2 rounded-full">
                      <span className="text-2xl mr-2">🍃</span>
                      <span className="text-sm font-semibold text-green-800">Soursop</span>
                    </div>
                    <div className="flex items-center bg-teal-100 px-4 py-2 rounded-full">
                      <span className="text-2xl mr-2">🌱</span>
                      <span className="text-sm font-semibold text-teal-800">Moringa</span>
                    </div>
                    <div className="flex items-center bg-amber-100 px-4 py-2 rounded-full">
                      <span className="text-2xl mr-2">🍯</span>
                      <span className="text-sm font-semibold text-amber-800">Brown Sugar</span>
                    </div>
                    <div className="flex items-center bg-lime-100 px-4 py-2 rounded-full">
                      <span className="text-2xl mr-2">🌾</span>
                      <span className="text-sm font-semibold text-lime-800">Lemongrass</span>
                    </div>
                  </div>

                  {/* Key Benefits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Anti-inflammatory</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Immune Support</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Digestive Health</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">Natural Energy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wellness Products Section - Better Organized */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-10 mb-12 border border-orange-100">
              <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 font-[family-name:var(--font-crimson)] text-center">
                WELLNESS WITHOUT COMPROMISE
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto text-center">
                Experience the perfect balance of taste and health with our premium organic products. From traditional Filipino remedies to modern wellness solutions, every product is crafted with care to nourish your body naturally.
              </p>
            </div>

            {/* Standardized Product Gallery with uniform frames and clear labels */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="group cursor-pointer">
                <div className="relative bg-white rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src="/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg"
                      alt="5-in-1 Turmeric Blend 500g"
                      width={300}
                      height={300}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    500g
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-gray-800">5-in-1 Turmeric Blend</p>
                  <p className="text-xs text-gray-500 mt-1">Premium Health Supplement</p>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="relative bg-white rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src="/images/agriko-turmeric-5in1-blend-180g-organic.jpg"
                      alt="5-in-1 Turmeric Blend 180g"
                      width={300}
                      height={300}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    180g
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-gray-800">5-in-1 Turmeric Blend</p>
                  <p className="text-xs text-gray-500 mt-1">Travel Size</p>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="relative bg-white rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src="/images/agriko-pure-salabat-ginger-tea-100g.jpg"
                      alt="Pure Salabat"
                      width={300}
                      height={300}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    100g
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-gray-800">Pure Salabat</p>
                  <p className="text-xs text-gray-500 mt-1">Traditional Ginger Tea</p>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="relative bg-white rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src="/images/agriko-pure-organic-honey-jar.jpg"
                      alt="Pure Organic Honey"
                      width={300}
                      height={300}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    Natural
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-bold text-gray-800">Pure Organic Honey</p>
                  <p className="text-xs text-gray-500 mt-1">Raw & Unprocessed</p>
                </div>
              </div>
            </div>

            {/* Wellness Journey CTA - Split Layout with Lifestyle Focus */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-orange-50 via-yellow-50 to-cream">
              {/* Curved wave pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
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
                    alt="Wellness Journey"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>

                {/* Right Column - Content */}
                <div className="p-10 lg:p-12 flex flex-col justify-center">
                  <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">
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
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105 shadow-xl text-center text-lg"
                    >
                      Start Shopping
                    </Link>
                    <Link
                      href="/find-us"
                      className="flex-1 border-2 border-green-600 text-green-700 px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition-all duration-300 transform hover:scale-105 text-center text-lg"
                    >
                      Visit Store
                    </Link>
                  </div>

                  {/* Enhanced Trust Badge Row */}
                  <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-full p-4 border border-green-200">
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start items-center">
                      <span className="inline-flex items-center text-sm font-medium text-green-700 bg-white px-3 py-1 rounded-full shadow-sm">
                        <svg className="w-4 h-4 text-green-600 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Certified Organic
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="inline-flex items-center text-sm font-medium text-yellow-700 bg-white px-3 py-1 rounded-full shadow-sm">
                        <svg className="w-4 h-4 text-yellow-600 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        100% Natural
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="inline-flex items-center text-sm font-medium text-orange-700 bg-white px-3 py-1 rounded-full shadow-sm">
                        <svg className="w-4 h-4 text-orange-600 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        Family Farm Since 2016
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}