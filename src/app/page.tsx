import { Suspense } from 'react';
import { getAllProducts, getFeaturedProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/ProductCard';
import HeroSection from '@/components/HeroSection';
import { OrganicProductGridSkeleton } from '@/components/OrganicLoadingStates';
import Link from 'next/link';
import Image from 'next/image';

// Loading component for products grid (using organic theme)
function ProductsGridSkeleton() {
  return <OrganicProductGridSkeleton count={8} />;
}

// Featured Products Section
async function FeaturedProducts() {
  try {
    const featuredProducts = await getFeaturedProducts(8);
    
    if (featuredProducts.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No featured products available.</p>
        </div>
      );
    }

    // Featured Products ItemList Schema
    const featuredProductsSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Premium Product Selection",
      "description": "Discover our carefully curated collection of organic rice varieties, pure herbal powders, and health-boosting blends.",
      "numberOfItems": featuredProducts.length,
      "itemListElement": featuredProducts.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "url": `https://shop.agrikoph.com/product/${product.slug}`,
          "image": product.images?.[0]?.src || '',
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "PHP"
          }
        }
      }))
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(featuredProductsSchema)
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading featured products:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Unable to load featured products. Please try again later.</p>
      </div>
    );
  }
}

// Latest Products Section
async function LatestProducts() {
  try {
    const latestProducts = await getAllProducts({
      per_page: 12,
      orderby: 'date',
      order: 'desc',
      status: 'publish'
    });

    if (latestProducts.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No products available.</p>
        </div>
      );
    }

    // Latest Products ItemList Schema
    const latestProductsSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Latest Products",
      "description": "Explore our newest additions - from specialty rice blends to health-boosting herbal formulations, all crafted with care.",
      "numberOfItems": latestProducts.length,
      "itemListElement": latestProducts.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "url": `https://shop.agrikoph.com/product/${product.slug}`,
          "image": product.images?.[0]?.src || '',
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "PHP"
          }
        }
      }))
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(latestProductsSchema)
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading latest products:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Unable to load products. Please try again later.</p>
      </div>
    );
  }
}

export default function HomePage() {
  // Enhanced Organization Schema with more detailed LocalBusiness information
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": "https://shop.agrikoph.com",
    "logo": "https://shop.agrikoph.com/images/Agriko-Logo.png",
    "image": "https://shop.agrikoph.com/images/gerry-paglinawan-family-agriko-founders.jpg",
    "founder": {
      "@type": "Person",
      "name": "Gerry Paglinawan"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Paglinawan Organic Eco Farm, Purok 6, Libertad",
      "addressLocality": "Dumingag",
      "addressRegion": "Zamboanga Del Sur",
      "postalCode": "7028",
      "addressCountry": "PH"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "email": "agrikoph@gmail.com",
        "contactType": "customer service",
        "availableLanguage": ["English", "Filipino"]
      },
      {
        "@type": "ContactPoint",
        "telephone": "+63XXXXXXXXXX", // Replace with actual phone number
        "contactType": "customer service",
        "availableLanguage": ["English", "Filipino"]
      }
    ],
    "sameAs": [
      "https://www.facebook.com/AgrikoPH/"
    ],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Agriko Organic Products",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Organic Rice Varieties",
          "description": "Black, Brown, Red, and White organic rice"
        },
        {
          "@type": "OfferCatalog", 
          "name": "Herbal Powders",
          "description": "Turmeric, Ginger, and Moringa powders"
        },
        {
          "@type": "OfferCatalog",
          "name": "Health Blends & Honey",
          "description": "5-in-1 Turmeric Tea Blend and pure organic honey"
        }
      ]
    }
  };

  // Enhanced WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Agriko Organic Farm",
    "url": "https://shop.agrikoph.com",
    "description": "Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm.",
    "publisher": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://shop.agrikoph.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Enhanced WebPage Schema
  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Agriko Organic Farm - Premium Rice & Health Products",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": "https://shop.agrikoph.com",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Agriko Organic Farm",
      "url": "https://agrikoph.com"
    },
    "about": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://shop.agrikoph.com"
        }
      ]
    }
  };

  // Review Schema
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "reviewBody": "Agriko's organic rice varieties and herbal powders have transformed our family's health routine. The quality is exceptional - especially their Black Rice and Moringa powder!",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": "Maria Santos",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Manila",
        "addressCountry": "PH"
      }
    },
    "itemReviewed": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "publisher": {
      "@type": "Organization", 
      "name": "Agriko Organic Farm"
    }
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What makes Agriko's rice premium quality?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our organic rice varieties - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils for superior taste and nutrition."
        }
      },
      {
        "@type": "Question",
        "name": "What herbal powders does Agriko offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer premium Dulaw (Turmeric), Salabat (Ginger), and Moringa powders - pure, nutrient-dense superfoods with powerful health benefits."
        }
      },
      {
        "@type": "Question",
        "name": "What health blends and products are available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide unique 5-in-1 Turmeric Tea Blend, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness."
        }
      }
    ]
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationSchema,
            websiteSchema, 
            webpageSchema,
            reviewSchema,
            faqSchema
          ])
        }}
      />
      
      <HeroSection 
        title="Agriko"
        subtitle="From Our Farm, To Your Cup"
        description="Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm."
        secondaryButtonText="About Us"
        secondaryButtonHref="/about"
      />

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-heading-1 text-neutral-900 mb-6">
              Premium Product Selection
            </h2>
            <p className="text-body-large text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Discover our carefully curated collection of <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">organic rice varieties</Link>, pure herbal powders, and health-boosting blends. <Link href="/about" className="text-primary-700 hover:text-primary-800 underline">Learn more about our story</Link> and sustainable farming practices.
            </p>
          </div>

          <div className="flex justify-center">
            <Suspense fallback={<div className="flex justify-center"><ProductsGridSkeleton /></div>}>
              <FeaturedProducts />
            </Suspense>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-heading-1 text-neutral-900 mb-6">
              Why Choose Agriko Organic Farm?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-heading-3 text-neutral-900 mb-4">Premium Quality Rice</h3>
              <p className="text-neutral-600 leading-relaxed">
                Our <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">organic rice varieties</Link> - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils for superior taste and nutrition. <Link href="/find-us" className="text-primary-700 hover:text-primary-800 underline">Find our products</Link> at major supermarkets nationwide.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-accent-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-heading-3 text-neutral-900 mb-4">Pure Herbal Powders</h3>
              <p className="text-neutral-600 leading-relaxed">
                Premium <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">Dulaw (Turmeric), Salabat (Ginger), and Moringa powders</Link> - pure, nutrient-dense superfoods with powerful health benefits. <Link href="/about" className="text-primary-700 hover:text-primary-800 underline">Discover the 5-in-1 blend ingredients</Link> and their wellness properties.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
                </svg>
              </div>
              <h3 className="text-heading-3 text-neutral-900 mb-4">Health Blends & Honey</h3>
              <p className="text-neutral-600 leading-relaxed">
                Unique <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">5-in-1 Turmeric Tea Blend</Link>, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness. <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">Learn about health benefits</Link> and usage recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonial Section */}
      <section className="py-24 relative overflow-hidden min-h-[600px] flex items-center">
        <Image
          src="/images/philippines-flag-background.jpg"
          alt="Philippines Flag Background - Representing Agriko's Proud Filipino Heritage and Local Organic Farming Tradition"
          title="Philippines Flag - Agriko's Filipino Heritage"
          fill
          className="object-cover object-center"
        />
        
        {/* Enhanced gradients for better depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/60 via-red-900/80 to-black/90"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Decorative quote marks */}
        <div className="absolute top-12 left-12 text-accent-400/20 text-9xl font-serif leading-none pointer-events-none hidden md:block select-none">&ldquo;</div>
        <div className="absolute bottom-12 right-12 text-accent-400/20 text-9xl font-serif leading-none rotate-180 pointer-events-none hidden md:block select-none">&rdquo;</div>
        
        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-serif italic text-white leading-relaxed mb-12 drop-shadow-lg max-w-4xl mx-auto opacity-0 animate-fade-in-up">
            &quot;Agriko&#39;s organic rice varieties and herbal powders have transformed our family&#39;s health routine. The quality is exceptional - especially their Black Rice and Moringa powder!&quot;
          </blockquote>
          
          <div className="flex flex-col items-center space-y-3 opacity-0 animate-fade-in-up-delayed">
            <div className="w-20 h-0.5 bg-accent-400 mb-2"></div>
            <p className="font-semibold text-xl text-accent-400 tracking-wide">Maria Santos</p>
            <p className="text-white/90 text-lg">Health-Conscious Mom, Quezon City</p>
            <div className="flex space-x-1 mt-3 text-accent-400 text-lg animate-pulse-stars">
              ★★★★★
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products Section */}
      <section id="latest-products" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-heading-1 text-neutral-900 mb-6">
              Latest Products
            </h2>
            <p className="text-body-large text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Explore our newest additions - from specialty rice blends to health-boosting herbal formulations, all crafted with care.
            </p>
          </div>

          <div className="flex justify-center">
            <Suspense fallback={<div className="flex justify-center"><ProductsGridSkeleton /></div>}>
              <LatestProducts />
            </Suspense>
          </div>

        </div>
      </section>

    </>
  );
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;