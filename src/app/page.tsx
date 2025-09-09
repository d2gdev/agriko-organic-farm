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
      // Fallback to latest products if no featured products
      console.warn('No featured products found, falling back to latest products');
      const latestProducts = await getAllProducts({
        per_page: 8,
        orderby: 'date',
        order: 'desc',
        status: 'publish'
      });
      
      if (latestProducts.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available at the moment.</p>
          </div>
        );
      }
      
      const latestProductsSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Latest Products",
        "description": "Our newest additions - from specialty rice blends to health-boosting herbal formulations.",
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
    // Try to show latest products as a fallback
    try {
      const latestProducts = await getAllProducts({
        per_page: 8,
        orderby: 'date',
        order: 'desc',
        status: 'publish'
      });
      
      if (latestProducts.length > 0) {
        const latestProductsSchema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Latest Products",
          "description": "Currently showing our latest products due to temporary issues with featured products.",
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
            <div className="text-center mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Currently showing latest products due to temporary issues. Please try again later.</p>
            </div>
          </>
        );
      }
    } catch (fallbackError) {
      console.error('Error loading fallback products:', fallbackError);
    }
    
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Unable to load products. Please try again later.</p>
        <p className="text-gray-500 mt-2 text-sm">This might be due to temporary network issues with our product database.</p>
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
          <p className="text-gray-500">No products available at the moment.</p>
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
        <p className="text-red-500">Unable to load latest products. Please try again later.</p>
        <p className="text-gray-500 mt-2 text-sm">This might be due to temporary network issues with our product database.</p>
      </div>
    );
  }
}

export default function HomePage() {
  // Enhanced Organization Schema with more detailed LocalBusiness information
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "Store"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "legalName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": "https://shop.agrikoph.com",
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
      "knowsAbout": ["Organic Agriculture", "Herbal Medicine", "Sustainable Farming"]
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
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      }
    ],
    "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer"],
    "currenciesAccepted": "PHP",
    "priceRange": "₱₱",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Agriko Organic Products",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Organic Rice Varieties",
          "description": "Black, Brown, Red, and White organic rice varieties grown sustainably"
        },
        {
          "@type": "OfferCatalog", 
          "name": "Pure Herbal Powders",
          "description": "Premium Dulaw (Turmeric), Salabat (Ginger), and Moringa powders"
        },
        {
          "@type": "OfferCatalog",
          "name": "Health Blends & Natural Products",
          "description": "5-in-1 Turmeric Tea Blend, pure organic honey, and specialty health products"
        }
      ]
    },
    "knowsAbout": [
      "Organic Agriculture",
      "Sustainable Farming",
      "Herbal Medicine",
      "Rice Cultivation",
      "Health Supplements",
      "Traditional Filipino Remedies"
    ],
    "areaServed": {
      "@type": "Country",
      "name": "Philippines"
    },
    "serviceArea": {
      "@type": "Country",
      "name": "Philippines"
    },
    "award": "Certified Organic Producer",
    "slogan": "From Our Farm, To Your Cup",
    "mission": "To provide premium organic agricultural products while empowering local farmers and promoting sustainable practices for a healthier community."
  };

  // Enhanced WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Shop",
    "url": "https://shop.agrikoph.com",
    "description": "Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm.",
    "inLanguage": "en-PH",
    "copyrightYear": "2024",
    "copyrightHolder": {
      "@type": "Organization",
      "name": "Agriko Multi-Trade & Enterprise Corp."
    },
    "publisher": {
      "@type": "Organization",
      "name": "Agriko Organic Farm",
      "logo": {
        "@type": "ImageObject",
        "url": "https://shop.agrikoph.com/images/Agriko-Logo.png",
        "width": "500",
        "height": "200"
      }
    },
    "potentialAction": [
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://shop.agrikoph.com/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      {
        "@type": "BuyAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://shop.agrikoph.com/product/{product_slug}"
        }
      }
    ],
    "mainEntity": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "about": {
      "@type": "Thing",
      "name": "Organic Agriculture and Health Products",
      "description": "Sustainable farming, organic rice varieties, herbal powders, and natural health supplements"
    }
  };

  // Enhanced WebPage Schema
  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://shop.agrikoph.com/#webpage",
    "name": "Agriko Organic Farm - Premium Rice & Health Products",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": "https://shop.agrikoph.com",
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
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": "https://shop.agrikoph.com/images/hero.png",
      "width": "1200",
      "height": "630"
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
    },
    "mainContentOfPage": {
      "@type": "WebPageElement",
      "cssSelector": "main"
    },
    "significantLink": [
      "https://shop.agrikoph.com/about",
      "https://shop.agrikoph.com/faq",
      "https://shop.agrikoph.com/find-us",
      "https://shop.agrikoph.com/contact"
    ]
  };

  // Enhanced Review Schema Collection
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": "https://shop.agrikoph.com/#review-1",
    "reviewBody": "Agriko's organic rice varieties and herbal powders have transformed our family's health routine. The quality is exceptional - especially their Black Rice and Moringa powder!",
    "headline": "Exceptional Quality Organic Products",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5",
      "worstRating": "1"
    },
    "datePublished": "2024-01-15",
    "author": {
      "@type": "Person",
      "name": "Maria Santos",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Quezon City",
        "addressCountry": "PH"
      },
      "reviewedBy": "Verified Customer"
    },
    "itemReviewed": {
      "@type": "Organization",
      "name": "Agriko Organic Farm",
      "url": "https://shop.agrikoph.com"
    },
    "publisher": {
      "@type": "Organization", 
      "name": "Agriko Organic Farm",
      "url": "https://shop.agrikoph.com"
    },
    "positiveNotes": [
      "Exceptional quality",
      "Health benefits",
      "Black Rice variety",
      "Moringa powder effectiveness"
    ]
  };

  // Enhanced FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://shop.agrikoph.com/#faq",
    "name": "Frequently Asked Questions - Agriko Organic Farm",
    "description": "Common questions about Agriko's organic rice varieties, herbal powders, and health products",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What makes Agriko's rice premium quality?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our organic rice varieties - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils using sustainable farming practices. Each variety is carefully selected for superior taste, nutrition, and health benefits.",
          "dateCreated": "2024-01-01"
        }
      },
      {
        "@type": "Question",
        "name": "What herbal powders does Agriko offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer premium Dulaw (Turmeric), Salabat (Ginger), and Moringa powders - pure, nutrient-dense superfoods with powerful health benefits. All powders are processed using traditional methods to preserve maximum nutritional value.",
          "dateCreated": "2024-01-01"
        }
      },
      {
        "@type": "Question",
        "name": "What health blends and products are available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide our signature 5-in-1 Turmeric Tea Blend containing turmeric, ginger, soursop, moringa, brown sugar, and lemongrass. We also offer pure organic honey and specialized products like Agribata Kids Cereal for complete wellness.",
          "dateCreated": "2024-01-01"
        }
      },
      {
        "@type": "Question",
        "name": "Are Agriko products certified organic?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all Agriko products are cultivated using certified organic farming methods without synthetic pesticides, herbicides, or chemical fertilizers. Our farm is committed to sustainable agricultural practices.",
          "dateCreated": "2024-01-01"
        }
      },
      {
        "@type": "Question",
        "name": "Where can I buy Agriko products?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Agriko products are available at major supermarkets nationwide including SM, Robinsons, and other retail partners. You can also purchase directly from our online store or visit our farm in Dumingag, Zamboanga del Sur.",
          "dateCreated": "2024-01-01"
        }
      }
    ],
    "about": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    }
  };

  // Recipe Schemas for Product Usage
  const turmericTeaRecipeSchema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "@id": "https://shop.agrikoph.com/#turmeric-tea-recipe",
    "name": "Perfect Turmeric Tea with Agriko 5-in-1 Blend",
    "description": "A healing and delicious turmeric tea using Agriko's signature 5-in-1 blend for maximum health benefits",
    "image": "https://shop.agrikoph.com/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg",
    "author": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "datePublished": "2024-01-01",
    "prepTime": "PT5M",
    "cookTime": "PT10M",
    "totalTime": "PT15M",
    "recipeYield": "2 servings",
    "recipeCategory": "Beverage",
    "recipeCuisine": "Filipino",
    "keywords": "turmeric tea, herbal tea, health drink, anti-inflammatory, immune boost",
    "recipeIngredient": [
      "2 teaspoons Agriko 5-in-1 Turmeric Blend",
      "2 cups hot water (not boiling)",
      "1 tablespoon Agriko organic honey (optional)",
      "1 slice fresh lemon (optional)"
    ],
    "recipeInstructions": [
      {
        "@type": "HowToStep",
        "name": "Heat Water",
        "text": "Heat water to about 80°C (176°F). Avoid boiling to preserve nutrients.",
        "image": "https://shop.agrikoph.com/images/step1-heat-water.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Add Blend",
        "text": "Add 1 teaspoon of Agriko 5-in-1 Turmeric Blend to each cup.",
        "image": "https://shop.agrikoph.com/images/step2-add-blend.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Steep",
        "text": "Pour hot water over the blend and let steep for 5-8 minutes.",
        "image": "https://shop.agrikoph.com/images/step3-steep.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Strain and Serve",
        "text": "Strain the tea, add honey and lemon if desired, and enjoy warm.",
        "image": "https://shop.agrikoph.com/images/step4-serve.jpg"
      }
    ],
    "nutrition": {
      "@type": "NutritionInformation",
      "calories": "15",
      "servingSize": "1 cup",
      "fatContent": "0g",
      "saturatedFatContent": "0g",
      "carbohydrateContent": "4g",
      "fiberContent": "1g",
      "sugarContent": "2g",
      "proteinContent": "1g",
      "sodiumContent": "2mg"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "87",
      "bestRating": "5",
      "worstRating": "1"
    },
    "video": {
      "@type": "VideoObject",
      "name": "How to Make Perfect Turmeric Tea",
      "description": "Learn the proper way to prepare Agriko's 5-in-1 Turmeric Tea Blend",
      "thumbnailUrl": "https://shop.agrikoph.com/images/turmeric-tea-video-thumb.jpg",
      "uploadDate": "2024-01-15",
      "duration": "PT3M45S"
    }
  };

  // HowTo Schema for Rice Cooking
  const ricePreparationSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": "https://shop.agrikoph.com/#rice-cooking-guide",
    "name": "Perfect Organic Rice Cooking Guide",
    "description": "Learn how to cook Agriko's organic rice varieties for optimal nutrition and flavor",
    "image": "https://shop.agrikoph.com/images/organic-rice-cooking-guide.jpg",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "PHP",
      "value": "50"
    },
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "Agriko Organic Rice (any variety)"
      },
      {
        "@type": "HowToSupply",
        "name": "Clean water"
      },
      {
        "@type": "HowToSupply",
        "name": "Rice cooker or pot with lid"
      }
    ],
    "tool": [
      {
        "@type": "HowToTool",
        "name": "Rice cooker or heavy-bottomed pot"
      },
      {
        "@type": "HowToTool",
        "name": "Fine mesh strainer"
      }
    ],
    "totalTime": "PT45M",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Rinse Rice",
        "text": "Rinse Agriko organic rice in cold water until water runs clear. This removes excess starch.",
        "image": "https://shop.agrikoph.com/images/rice-step1-rinse.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Measure Water",
        "text": "Use 1.5 cups water for 1 cup rice (adjust for desired consistency).",
        "image": "https://shop.agrikoph.com/images/rice-step2-measure.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Cook",
        "text": "Bring to boil, then reduce heat to low, cover, and simmer for 18-20 minutes.",
        "image": "https://shop.agrikoph.com/images/rice-step3-cook.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Rest and Fluff",
        "text": "Let stand 10 minutes, then fluff with fork before serving.",
        "image": "https://shop.agrikoph.com/images/rice-step4-fluff.jpg"
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
            faqSchema,
            turmericTeaRecipeSchema,
            ricePreparationSchema
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
          src={`/images/philippines-flag-background.jpg?v=${Date.now()}`}
          alt="Philippines Flag Background - Representing Agriko's Proud Filipino Heritage and Local Organic Farming Tradition"
          title="Philippines Flag - Agriko's Filipino Heritage"
          fill
          className="object-cover object-center"
        />
        
        {/* Black 70% overlay */}
        <div className="absolute inset-0 bg-black/70"></div>
        
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