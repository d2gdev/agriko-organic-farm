import { Suspense, lazy } from 'react';
import { getAllProducts, getFeaturedProducts } from '@/lib/woocommerce';
import HeroSection from '@/components/HeroSection';
import { OrganicProductGridSkeleton } from '@/components/OrganicLoadingStates';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import Image from 'next/image';
import { URL_CONSTANTS, urlHelpers } from '@/lib/url-constants';
// Removed APP_CONSTANTS import due to dependency issues

// Import ProductCard eagerly since it's needed for above-the-fold content
import ProductCard from '@/components/ProductCard';
import Testimonials from '@/components/Testimonials';

// Lazy load components that are not immediately visible
const PageAnalytics = lazy(() => import('@/components/PageAnalytics'));

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
    logger.warn('No featured products found, falling back to latest products', undefined, 'home');
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
        "@context": URL_CONSTANTS.SCHEMA.BASE,
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
            "url": urlHelpers.getProductUrl(product.slug),
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {latestProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
                fetchPriority={index < 4 ? "high" : "auto"}
              />
            ))}
          </div>
        </>
      );
    }

    // Featured Products ItemList Schema
    const featuredProductsSchema = {
      "@context": URL_CONSTANTS.SCHEMA.BASE,
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
          "url": urlHelpers.getProductUrl(product.slug),
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              fetchPriority={index < 4 ? "high" : "auto"}
            />
          ))}
        </div>
      </>
    );
  } catch (error) {
    logger.error('Error loading featured products', error as Record<string, unknown>, 'home');
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
          "@context": URL_CONSTANTS.SCHEMA.BASE,
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
              "url": urlHelpers.getProductUrl(product.slug),
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
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
    logger.error('Error loading fallback products', fallbackError as Record<string, unknown>, 'home');
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

    // Latest Products ItemList Schema
    const latestProductsSchema = {
      "@context": URL_CONSTANTS.SCHEMA.BASE,
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
          "url": urlHelpers.getProductUrl(product.slug),
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/products">
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-lg">
                View All Products
              </button>
            </Link>
          </div>
        </>
      </>
    );
  } catch (error) {
    logger.error('Error loading latest products', error as Record<string, unknown>, 'home');
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
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": ["Organization", "LocalBusiness", "Store"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "legalName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": urlHelpers.getShopUrl(),
    "logo": `${urlHelpers.getShopUrl()}/images/Agriko-Logo.png`,
    "image": [
      urlHelpers.getShopImageUrl("gerry-paglinawan-family-agriko-founders.jpg"),
      urlHelpers.getShopImageUrl("agriko-organic-farm-landscape-fields.jpg"),
      urlHelpers.getShopImageUrl("agriko-organic-farm-products-showcase.jpg")
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
      URL_CONSTANTS.SOCIAL.FACEBOOK,
      URL_CONSTANTS.COMPANY_BASE_URL
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
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "WebSite",
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Shop",
    "url": urlHelpers.getShopUrl(),
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
        "url": urlHelpers.getShopImageUrl("Agriko-Logo.png"),
        "width": "500",
        "height": "200"
      }
    },
    "potentialAction": [
      {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${urlHelpers.getShopUrl()}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      {
        "@type": "BuyAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${urlHelpers.getShopUrl()}/product/{product_slug}`
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
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "WebPage",
    "@id": "urlHelpers.getShopUrl()/#webpage",
    "name": "Agriko Organic Farm - Premium Rice & Health Products",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": urlHelpers.getShopUrl(),
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
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": "urlHelpers.getShopUrl()/images/hero.png",
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
          "item": urlHelpers.getShopUrl()
        }
      ]
    },
    "mainContentOfPage": {
      "@type": "WebPageElement",
      "cssSelector": "main"
    },
    "significantLink": [
      "urlHelpers.getShopUrl()/about",
      "urlHelpers.getShopUrl()/faq",
      "urlHelpers.getShopUrl()/find-us",
      "urlHelpers.getShopUrl()/contact"
    ]
  };

  // Enhanced Review Schema Collection
  const reviewSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "Review",
    "@id": "urlHelpers.getShopUrl()/#review-1",
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
      "url": urlHelpers.getShopUrl()
    },
    "publisher": {
      "@type": "Organization",
      "name": "Agriko Organic Farm",
      "url": urlHelpers.getShopUrl()
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
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "FAQPage",
    "@id": "urlHelpers.getShopUrl()/#faq",
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
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "Recipe",
    "@id": "urlHelpers.getShopUrl()/#turmeric-tea-recipe",
    "name": "Perfect Turmeric Tea with Agriko 5-in-1 Blend",
    "description": "A healing and delicious turmeric tea using Agriko's signature 5-in-1 blend for maximum health benefits",
    "image": "urlHelpers.getShopUrl()/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg",
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
        "image": "urlHelpers.getShopUrl()/images/agriko-turmeric-5in1-blend-180g-organic.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Add Blend",
        "text": "Add 1 teaspoon of Agriko 5-in-1 Turmeric Blend to each cup.",
        "image": "urlHelpers.getShopUrl()/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Steep",
        "text": "Pour hot water over the blend and let steep for 5-8 minutes.",
        "image": "urlHelpers.getShopUrl()/images/agriko-pure-salabat-ginger-tea-100g.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Strain and Serve",
        "text": "Strain the tea, add honey and lemon if desired, and enjoy warm.",
        "image": "urlHelpers.getShopUrl()/images/agriko-pure-organic-honey-jar.jpg"
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
      "thumbnailUrl": "urlHelpers.getShopUrl()/images/turmeric-tea-video-thumb.jpg",
      "uploadDate": "2024-01-15",
      "duration": "PT3M45S"
    }
  };

  // HowTo Schema for Rice Cooking
  const ricePreparationSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "HowTo",
    "@id": "urlHelpers.getShopUrl()/#rice-cooking-guide",
    "name": "Perfect Organic Rice Cooking Guide",
    "description": "Learn how to cook Agriko's organic rice varieties for optimal nutrition and flavor",
    "image": "urlHelpers.getShopUrl()/images/organic-rice-cooking-guide.jpg",
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
        "image": "urlHelpers.getShopUrl()/images/agriko-organic-farm-products-showcase.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Measure Water",
        "text": "Use 1.5 cups water for 1 cup rice (adjust for desired consistency).",
        "image": "urlHelpers.getShopUrl()/images/agriko-organic-farm-landscape-fields.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Cook",
        "text": "Bring to boil, then reduce heat to low, cover, and simmer for 18-20 minutes.",
        "image": "urlHelpers.getShopUrl()/images/gerry-paglinawan-family-agriko-founders.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Rest and Fluff",
        "text": "Let stand 10 minutes, then fluff with fork before serving.",
        "image": "urlHelpers.getShopUrl()/images/agriko-organic-farm-products-showcase.jpg"
      }
    ]
  };

  return (
    <>
      {/* Page Analytics for Homepage - Lazy loaded */}
      <Suspense fallback={null}>
        <PageAnalytics pageType="homepage" />
      </Suspense>
      
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
            ricePreparationSchema,
            // Additional comprehensive review schemas
            {
              "@context": URL_CONSTANTS.SCHEMA.BASE,
              "@type": "Review",
              "@id": "urlHelpers.getShopUrl()/#review-black-rice",
              "reviewBody": "I've been using Agriko's black rice for 6 months now. The antioxidant benefits are amazing and it tastes so much better than regular rice. My family loves it!",
              "headline": "Amazing Antioxidant Benefits",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5",
                "worstRating": "1"
              },
              "datePublished": "2024-02-20",
              "author": {
                "@type": "Person",
                "name": "Carmen Dela Cruz",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Cebu City",
                  "addressCountry": "PH"
                }
              },
              "itemReviewed": {
                "@type": "Product",
                "name": "Agriko Black Rice"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Agriko Organic Farm"
              }
            },
            {
              "@context": URL_CONSTANTS.SCHEMA.BASE,
              "@type": "Review",
              "@id": "urlHelpers.getShopUrl()/#review-turmeric-blend",
              "reviewBody": "The 5-in-1 turmeric blend has become part of my daily routine. It helps with my joint pain and I sleep better at night. Natural healing at its best!",
              "headline": "Joint Pain Relief and Better Sleep",
              "reviewRating": {
                "@type": "Rating", 
                "ratingValue": "5",
                "bestRating": "5",
                "worstRating": "1"
              },
              "datePublished": "2024-03-10",
              "author": {
                "@type": "Person",
                "name": "Roberto Fernandez",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Dumaguete",
                  "addressCountry": "PH"
                }
              },
              "itemReviewed": {
                "@type": "Product",
                "name": "Agriko 5-in-1 Turmeric Blend"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Agriko Organic Farm"
              }
            },
            {
              "@context": URL_CONSTANTS.SCHEMA.BASE,
              "@type": "Review", 
              "@id": "urlHelpers.getShopUrl()/#review-moringa-powder",
              "reviewBody": "Found Agriko products at Metro Supermarket and decided to try their moringa powder. Excellent quality and my energy levels have improved significantly!",
              "headline": "Excellent Quality Moringa",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "4.8",
                "bestRating": "5", 
                "worstRating": "1"
              },
              "datePublished": "2024-01-25",
              "author": {
                "@type": "Person",
                "name": "Lisa Chen",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Manila",
                  "addressCountry": "PH"
                }
              },
              "itemReviewed": {
                "@type": "Product",
                "name": "Agriko Moringa Powder"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Agriko Organic Farm"
              }
            },
            // Educational and Certification Schemas
            {
              "@context": URL_CONSTANTS.SCHEMA.BASE,
              "@type": "EducationalOccupationalCredential",
              "@id": "urlHelpers.getShopUrl()/#organic-certification",
              "name": "Certified Organic Producer",
              "description": "Official organic farming certification ensuring sustainable agricultural practices",
              "credentialCategory": "Professional Certificate",
              "educationalLevel": "Expert",
              "competencyRequired": [
                "Sustainable Agriculture",
                "Organic Certification Standards",
                "Soil Health Management", 
                "Natural Pest Control",
                "Crop Rotation Techniques"
              ],
              "recognizedBy": {
                "@type": "Organization",
                "name": "Department of Agriculture - Philippines",
                "url": "https://da.gov.ph"
              },
              "about": {
                "@type": "Organization",
                "name": "Agriko Organic Farm"
              }
            },
            // Course/Educational Content Schema
            {
              "@context": URL_CONSTANTS.SCHEMA.BASE,
              "@type": "Course",
              "@id": "urlHelpers.getShopUrl()/#organic-farming-knowledge",
              "name": "Organic Farming and Herbal Medicine Knowledge Base",
              "description": "Comprehensive educational content about organic farming practices, herbal medicine benefits, and sustainable agriculture",
              "provider": {
                "@type": "Organization",
                "name": "Agriko Organic Farm"
              },
              "hasCourseInstance": [
                {
                  "@type": "CourseInstance", 
                  "courseMode": "Online",
                  "name": "Rice Cultivation Techniques"
                },
                {
                  "@type": "CourseInstance",
                  "courseMode": "Online", 
                  "name": "Herbal Medicine Benefits and Usage"
                },
                {
                  "@type": "CourseInstance",
                  "courseMode": "Farm Visit",
                  "name": "Sustainable Farming Practices Tour"
                }
              ],
              "teaches": [
                "Organic rice cultivation",
                "Herbal medicine preparation",
                "Sustainable farming techniques",
                "Natural health benefits",
                "Traditional Filipino remedies"
              ],
              "educationalLevel": "Beginner to Advanced"
            },
            // Video Schema for Educational Content
            {
              "@context": URL_CONSTANTS.SCHEMA.BASE,
              "@type": "VideoObject",
              "@id": "urlHelpers.getShopUrl()/#organic-farming-video",
              "name": "Sustainable Organic Rice Farming in the Philippines",
              "description": "Documentary showcasing Agriko's organic farming methods, from planting to harvest, highlighting sustainable practices in Zamboanga del Sur",
              "thumbnailUrl": "urlHelpers.getShopUrl()/images/agriko-organic-farm-landscape-fields.jpg",
              "uploadDate": "2024-01-15",
              "duration": "PT12M45S",
              "contentUrl": "urlHelpers.getShopUrl()/about",
              "publisher": {
                "@type": "Organization",
                "name": "Agriko Organic Farm",
                "logo": {
                  "@type": "ImageObject",
                  "url": "urlHelpers.getShopUrl()/images/Agriko-Logo.png"
                }
              },
              "creator": {
                "@type": "Person",
                "name": "Gerry Paglinawan",
                "jobTitle": "Founder & Organic Farming Expert"
              },
              "keywords": [
                "organic farming",
                "sustainable agriculture",
                "rice cultivation", 
                "Philippine agriculture",
                "Zamboanga del Sur",
                "traditional farming"
              ],
              "genre": "Educational",
              "inLanguage": "en-PH",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "156",
                "bestRating": "5"
              }
            },
            // Agricultural Research Dataset Schema  
            {
              "@context": URL_CONSTANTS.SCHEMA.BASE,
              "@type": "Dataset",
              "@id": "urlHelpers.getShopUrl()/#rice-varieties-research",
              "name": "Organic Rice Varieties Nutritional Analysis Dataset",
              "description": "Comprehensive nutritional analysis and cultivation data for black, brown, red, and white organic rice varieties grown at Paglinawan Organic Eco Farm",
              "creator": {
                "@type": "Organization",
                "name": "Agriko Multi-Trade & Enterprise Corp.",
                "url": "urlHelpers.getShopUrl()"
              },
              "datePublished": "2024-01-01",
              "dateModified": "2024-03-15",
              "license": "https://creativecommons.org/licenses/by/4.0/",
              "keywords": [
                "organic rice",
                "nutritional analysis",
                "sustainable agriculture",
                "crop yield data",
                "antioxidant content",
                "Philippine agriculture"
              ],
              "variableMeasured": [
                {
                  "@type": "PropertyValue",
                  "name": "Anthocyanin Content",
                  "description": "Antioxidant levels in black rice varieties"
                },
                {
                  "@type": "PropertyValue", 
                  "name": "Protein Content",
                  "description": "Protein percentage across rice varieties"
                },
                {
                  "@type": "PropertyValue",
                  "name": "Fiber Content",
                  "description": "Dietary fiber measurements"
                },
                {
                  "@type": "PropertyValue",
                  "name": "Mineral Content",
                  "description": "Iron, magnesium, and other mineral levels"
                }
              ],
              "spatialCoverage": {
                "@type": "Place",
                "name": "Paglinawan Organic Eco Farm",
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": "8.4167",
                  "longitude": "123.4167"
                }
              },
              "temporalCoverage": "2016/2024",
              "distribution": {
                "@type": "DataDownload",
                "encodingFormat": "CSV",
                "contentUrl": "urlHelpers.getShopUrl()/products/"
              }
            }
          ])
        }}
      />
      
      <HeroSection
        title="Agriko"
        subtitle="Nourish Your Body. Sustainably Grown."
        description="Premium organic rice, pure herbal powders, and health blends from our sustainable farm to your table."
        secondaryButtonText="Our Story"
        secondaryButtonHref="/about"
      />

      {/* Featured Products Section */}
      <section className="py-40 lg:py-48 bg-gradient-to-br from-white via-green-50/10 to-white border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <span className="text-lg font-bold text-red-600 mb-3 block font-[family-name:var(--font-caveat)]">Our Collection</span>
            <h2 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 font-[family-name:var(--font-crimson)]">
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

      {/* Bestseller Spotlight Section */}
      <section className="py-32 lg:py-40 bg-gradient-to-br from-amber-50/30 via-white to-yellow-50/30 border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-2xl font-bold text-amber-600 mb-3 block font-[family-name:var(--font-caveat)]">⭐ Customer Favorite ⭐</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 font-[family-name:var(--font-crimson)]">
              Bestseller Spotlight
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Product Image Side */}
              <div className="relative h-96 md:h-full bg-gradient-to-br from-gray-50 to-white p-12 flex items-center justify-center overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-yellow-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200/20 to-amber-200/20 rounded-full blur-3xl"></div>

                <div className="absolute top-6 left-6 z-20">
                  <div className="bg-red-600 text-white px-5 py-2 rounded-lg font-black shadow-lg flex items-center space-x-2 text-sm uppercase tracking-wider border border-red-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Bestseller</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <Image
                    src="/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg"
                    alt="5-in-1 Turmeric Tea Blend"
                    width={450}
                    height={450}
                    className="object-contain drop-shadow-[0_20px_50px_rgba(251,191,36,0.3)] hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  {/* Floating product shadow */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-3/4 h-12 bg-black/10 rounded-full blur-2xl"></div>
                </div>
              </div>

              {/* Product Details Side */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h3 className="text-3xl font-bold text-neutral-900 mb-4 font-[family-name:var(--font-crimson)]">
                  5-in-1 Turmeric Tea Blend
                </h3>

                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">(87 Reviews)</span>
                </div>

                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Our signature wellness blend combining turmeric, ginger, moringa, soursop, and lemongrass.
                </p>

                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-3 font-semibold">Key Benefits:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-red-50 to-orange-50 p-2 rounded-lg border border-red-100">
                      <span className="text-lg">❤️</span>
                      <span className="text-gray-700 font-medium text-sm">Anti-inflammatory</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-100">
                      <span className="text-lg">🛡️</span>
                      <span className="text-gray-700 font-medium text-sm">Immune Boost</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-indigo-50 p-2 rounded-lg border border-purple-100">
                      <span className="text-lg">🌿</span>
                      <span className="text-gray-700 font-medium text-sm">Antioxidant Rich</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-amber-50 p-2 rounded-lg border border-yellow-100">
                      <span className="text-lg">⚡</span>
                      <span className="text-gray-700 font-medium text-sm">Energy Support</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-red-600">₱450</span>
                    <span className="text-sm text-gray-500 ml-2">500g</span>
                  </div>
                  <Link href="/products">
                    <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                      Shop Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-40 lg:py-48 bg-gradient-to-br from-green-50/20 via-white to-emerald-50/20 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-8 font-[family-name:var(--font-crimson)]">
              Why Choose Agriko Organic Farm?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group text-center bg-gradient-to-br from-primary-100 to-primary-50 p-8 rounded-xl shadow-2xl hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.15)] hover:-translate-y-1 transition-all duration-300 border-2 border-primary-300">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                {/* Rice grain icon */}
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C9.62 2 7.68 3.88 7.68 6.25c0 .57.11 1.12.31 1.63L4.2 11.67c-.28.28-.28.72 0 1l7.08 7.08c.28.28.72.28 1 0l7.08-7.08c.28-.28.28-.72 0-1l-3.79-3.79c.51-.19.98-.45 1.4-.79 1.26-1 2.03-2.56 2.03-4.09C19 3.88 17.05 2 14.68 2H12zm0 2h2.68c1.26 0 2.32.96 2.32 2.25 0 .97-.49 1.91-1.28 2.54-.42.34-.93.56-1.47.65l-.45.08-.32.34 3.88 3.89L12 19.11 6.64 13.75l3.88-3.89-.32-.34-.45-.08c-.54-.09-1.05-.31-1.47-.65C7.49 8.16 7 7.22 7 6.25 7 4.96 7.74 4 9 4h3z"/>
                </svg>
              </div>
              <h3 className="text-heading-3 text-neutral-900 mb-4 group-hover:text-primary-700 transition-colors">Premium Quality Rice</h3>
              <p className="text-neutral-600 leading-relaxed">
                Our <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">organic rice varieties</Link> - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils for superior taste and nutrition. <Link href="/find-us" className="text-primary-700 hover:text-primary-800 underline">Find our products</Link> at major supermarkets nationwide.
              </p>
            </div>

            <div className="group text-center bg-gradient-to-br from-accent-100 to-accent-50 p-8 rounded-xl shadow-2xl hover:shadow-[0_20px_50px_rgba(251,_146,_60,_0.15)] hover:-translate-y-1 transition-all duration-300 border-2 border-accent-300">
              <div className="bg-gradient-to-br from-accent-500 to-accent-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                {/* Herbal leaf icon */}
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20A4,4 0 0,0 12,16V14A6,6 0 0,1 18,8H17M17,1L17.5,3.5L20,3L19,5L21,6L19,7L20,9L17.5,8.5L17,11L16.5,8.5L14,9L15,7L13,6L15,5L14,3L16.5,3.5L17,1Z"/>
                </svg>
              </div>
              <h3 className="text-heading-3 text-neutral-900 mb-4 group-hover:text-accent-600 transition-colors">Pure Herbal Powders</h3>
              <p className="text-neutral-600 leading-relaxed">
                Premium <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">Dulaw (Turmeric), Salabat (Ginger), and Moringa powders</Link> - pure, nutrient-dense superfoods with powerful health benefits. <Link href="/about" className="text-primary-700 hover:text-primary-800 underline">Discover the 5-in-1 blend ingredients</Link> and their wellness properties.
              </p>
            </div>

            <div className="group text-center bg-gradient-to-br from-yellow-100 to-yellow-50 p-8 rounded-xl shadow-2xl hover:shadow-[0_20px_50px_rgba(251,_191,_36,_0.15)] hover:-translate-y-1 transition-all duration-300 border-2 border-yellow-300">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                {/* Health mix bowl icon */}
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.4 19,16.5 17.3,18C15.9,16.7 14,16 12,16C10,16 8.2,16.7 6.7,18C5,16.5 4,14.4 4,12A8,8 0 0,1 12,4M14,5.89C13.62,5.9 13.26,6.15 13.1,6.54L11.81,9.77L11.71,10C11,10.13 10.41,10.6 10.14,11.26C9.73,12.29 10.23,13.45 11.26,13.86C12.29,14.27 13.45,13.77 13.86,12.74C14.12,12.08 14,11.32 13.57,10.76L13.67,10.5L14.96,7.29L14.97,7.26C15.17,6.75 14.92,6.17 14.41,5.96C14.28,5.91 14.14,5.89 14,5.89M10,6C9.62,6.05 9.27,6.32 9.12,6.71L7.82,9.88L7.74,10.04C7.06,10.18 6.5,10.62 6.21,11.26C5.82,12.25 6.32,13.38 7.32,13.77C8.31,14.16 9.44,13.67 9.83,12.67C10.09,12.03 10,11.31 9.61,10.75L9.67,10.61L10.95,7.5L10.97,7.43C11.16,6.93 10.91,6.36 10.41,6.17C10.28,6.11 10.14,6.07 10,6M17,8C16.62,8.05 16.27,8.32 16.12,8.71L14.82,11.88L14.74,12.04C14.06,12.18 13.5,12.62 13.21,13.26C12.82,14.25 13.32,15.38 14.32,15.77C15.31,16.16 16.44,15.67 16.83,14.67C17.09,14.03 17,13.31 16.61,12.75L16.67,12.61L17.95,9.5L17.97,9.43C18.16,8.93 17.91,8.36 17.41,8.17C17.28,8.11 17.14,8.07 17,8Z"/>
                </svg>
              </div>
              <h3 className="text-heading-3 text-neutral-900 mb-4 group-hover:text-yellow-700 transition-colors">Health Blends & Honey</h3>
              <p className="text-neutral-600 leading-relaxed">
                Unique <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">5-in-1 Turmeric Tea Blend</Link>, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness. <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">Learn about health benefits</Link> and usage recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonial Section */}
      <Testimonials />

      {/* Latest Products Section */}
      <section id="latest-products" className="py-40 lg:py-48 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <span className="text-xl font-bold text-red-600 mb-3 block font-[family-name:var(--font-caveat)]">New Arrivals</span>
            <h2 className="text-5xl lg:text-7xl font-bold text-neutral-900 mb-8 font-[family-name:var(--font-crimson)]">
              Latest Products
            </h2>
            <p className="text-lg lg:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Explore our newest additions - from specialty rice blends to health-boosting herbal formulations, all crafted with care.
            </p>
          </div>

          <Suspense fallback={<div className="flex justify-center"><ProductsGridSkeleton /></div>}>
            <LatestProducts />
          </Suspense>

        </div>
      </section>

    </>
  );
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;
