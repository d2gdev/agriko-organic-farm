import { Suspense } from 'react';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/ProductCard';
import HeroSection from '@/components/HeroSection';
import Breadcrumb from '@/components/Breadcrumb';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { OrganicProductGridSkeleton } from '@/components/OrganicLoadingStates';
import ProductsWithFiltersSimple from '@/components/ProductsWithFiltersSimple';
import type { Metadata } from 'next';

// Products grid loading component
function ProductsGridSkeleton() {
  return <OrganicProductGridSkeleton count={12} />;
}

// Product categories section
function CategoryCards() {
  const categories = [
    {
      name: 'Rice Varieties',
      description: 'Premium organic black, brown, red, and white rice varieties',
      icon: '🌾',
      image: '/images/organic-rice-varieties.jpg',
      href: '/?category=rice',
      products: ['Black Rice', 'Brown Rice', 'Red Rice', 'White Rice']
    },
    {
      name: 'Herbal Powders',
      description: 'Pure, nutrient-dense superfoods with powerful health benefits',
      icon: '🌿',
      image: '/images/herbal-powders.jpg',
      href: '/?category=herbs',
      products: ['Turmeric Powder', 'Ginger Powder', 'Moringa Powder']
    },
    {
      name: 'Health Blends',
      description: 'Specially crafted blends and organic honey for complete wellness',
      icon: '🍯',
      image: '/images/health-blends.jpg',
      href: '/?category=blends',
      products: ['5-in-1 Tea Blend', 'Organic Honey', 'Agribata Cereal']
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 via-cream to-amber-50 relative overflow-hidden">
      {/* Background texture pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary-200 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-amber-200 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-heading-1 text-neutral-900 mb-6">
            Product Categories
          </h2>
          <p className="text-body-large text-neutral-600 max-w-3xl mx-auto">
            Explore our three main product categories, each carefully cultivated and processed to deliver maximum nutrition and authentic flavors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Card
              key={category.name}
              variant="interactive"
              size="lg"
              className="group animate-fadeInUp hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 bg-white/80 backdrop-blur-sm border-2 border-transparent hover:border-primary-200"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Enhanced Category Image with Organic Textures */}
              <div className="relative h-48 bg-gradient-to-br from-primary-100 via-primary-200 to-secondary-100 overflow-hidden -m-8 mb-6">
                {/* Organic texture overlay */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-4 w-16 h-16 bg-white/30 rounded-full blur-xl"></div>
                  <div className="absolute bottom-6 right-6 w-12 h-12 bg-primary-300/40 rounded-full blur-lg"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-secondary-200/30 rounded-full blur-2xl"></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Simple, Organic Icons */}
                  {category.name === 'Rice Varieties' && (
                    <div className="text-6xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-lg">
                      🌾
                    </div>
                  )}

                  {category.name === 'Herbal Powders' && (
                    <div className="text-6xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-lg">
                      🌿
                    </div>
                  )}

                  {category.name === 'Health Blends' && (
                    <div className="text-6xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-lg">
                      🍯
                    </div>
                  )}
                </div>

                {/* Enhanced gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>

              <CardHeader>
                <CardTitle className="group-hover:text-primary-700 transition-colors duration-200">
                  {category.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  {category.description}
                </p>

                {/* Product examples */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-neutral-500 mb-2">Popular items:</p>
                  <div className="flex flex-wrap gap-2">
                    {category.products.map((product) => (
                      <span key={product} className="inline-block bg-primary-50 text-primary-700 text-xs px-3 py-1 rounded-full">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>

                <Link 
                  href={category.href}
                  className="inline-flex items-center space-x-2 text-primary-700 hover:text-primary-800 font-semibold transition-colors duration-200 group/link"
                >
                  <span>Explore {category.name}</span>
                  <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// All products section with static import
async function AllProductsSection() {
  try {
    const products = await getAllProducts({
      per_page: 100, // Get more products for filtering
      orderby: 'menu_order',
      order: 'asc',
      status: 'publish'
    });

    if (products.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No products available at this time.</p>
        </div>
      );
    }

    // Simple component without useSearchParams - no Suspense needed
    return <ProductsWithFiltersSimple products={products} />;

  } catch (error) {
    logger.error('Error loading products:', error as Record<string, unknown>);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Unable to load products. Please try again later.</p>
      </div>
    );
  }
}

export const metadata: Metadata = {
  title: 'Shop All Products - Agriko Organic Farm',
  description: 'Browse our complete collection of organic rice varieties, herbal powders, and health blends. Premium quality products from our sustainable family farm.',
  keywords: 'shop organic products, buy organic rice, herbal powders, health blends, organic farming, sustainable agriculture',
};

export default function ProductsPage() {
  // Enhanced Collection Page Schema
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://shop.agrikoph.com/products#collectionpage",
    "name": "Shop All Products - Agriko Organic Farm",
    "description": "Browse our complete collection of organic rice varieties, herbal powders, and health blends.",
    "url": "https://shop.agrikoph.com/products",
    "inLanguage": "en-PH",
    "datePublished": "2016-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "isPartOf": {
      "@type": "WebSite",
      "name": "Agriko Organic Farm",
      "url": "https://shop.agrikoph.com"
    },
    "breadcrumb": {
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
          "name": "Shop All Products",
          "item": "https://shop.agrikoph.com/products"
        }
      ]
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "Agriko Product Categories",
      "numberOfItems": 3,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "ProductGroup",
            "name": "Organic Rice Varieties",
            "description": "Premium organic black, brown, red, and white rice varieties",
            "url": "https://shop.agrikoph.com/products?category=rice",
            "hasVariant": [
              {"@type": "Product", "name": "Black Rice"},
              {"@type": "Product", "name": "Brown Rice"},
              {"@type": "Product", "name": "Red Rice"},
              {"@type": "Product", "name": "White Rice"}
            ]
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "ProductGroup",
            "name": "Pure Herbal Powders",
            "description": "Pure, nutrient-dense superfoods with powerful health benefits",
            "url": "https://shop.agrikoph.com/products?category=herbs",
            "hasVariant": [
              {"@type": "Product", "name": "Turmeric Powder"},
              {"@type": "Product", "name": "Ginger Powder"},
              {"@type": "Product", "name": "Moringa Powder"}
            ]
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "ProductGroup",
            "name": "Health Blends & Natural Products",
            "description": "Specially crafted blends and organic honey for complete wellness",
            "url": "https://shop.agrikoph.com/products?category=blends",
            "hasVariant": [
              {"@type": "Product", "name": "5-in-1 Turmeric Tea Blend"},
              {"@type": "Product", "name": "Pure Organic Honey"},
              {"@type": "Product", "name": "Agribata Kids Cereal"}
            ]
          }
        }
      ]
    }
  };

  // Product Category Schemas
  const categorySchemas = [
    {
      "@context": "https://schema.org",
      "@type": "ProductGroup",
      "@id": "https://shop.agrikoph.com/products#rice-category",
      "name": "Organic Rice Varieties",
      "description": "Premium organic rice varieties cultivated using sustainable farming practices",
      "brand": {
        "@type": "Brand",
        "name": "Agriko Organic Farm"
      },
      "category": "Food & Beverage > Grains & Rice",
      "productGroupID": "rice-varieties",
      "hasVariant": [
        {"@type": "Product", "name": "Organic Black Rice", "description": "Rich in antioxidants and nutrients"},
        {"@type": "Product", "name": "Organic Brown Rice", "description": "High fiber whole grain rice"},
        {"@type": "Product", "name": "Organic Red Rice", "description": "Traditional colored rice variety"},
        {"@type": "Product", "name": "Organic White Rice", "description": "Classic premium quality rice"}
      ],
      "additionalProperty": [
        {"@type": "PropertyValue", "name": "Organic Certified", "value": "Yes"},
        {"@type": "PropertyValue", "name": "Gluten Free", "value": "Yes"},
        {"@type": "PropertyValue", "name": "Non-GMO", "value": "Yes"}
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ProductGroup",
      "@id": "https://shop.agrikoph.com/products#herbs-category",
      "name": "Pure Herbal Powders",
      "description": "Premium herbal powders with exceptional health benefits and nutritional value",
      "brand": {
        "@type": "Brand",
        "name": "Agriko Organic Farm"
      },
      "category": "Health & Beauty > Health Supplements",
      "productGroupID": "herbal-powders",
      "hasVariant": [
        {"@type": "Product", "name": "Pure Dulaw (Turmeric) Powder", "description": "Anti-inflammatory superfood powder"},
        {"@type": "Product", "name": "Pure Salabat (Ginger) Powder", "description": "Digestive health and pain relief"},
        {"@type": "Product", "name": "Pure Moringa Powder", "description": "Complete superfood with essential nutrients"}
      ],
      "additionalProperty": [
        {"@type": "PropertyValue", "name": "Organic", "value": "Yes"},
        {"@type": "PropertyValue", "name": "Raw", "value": "Yes"},
        {"@type": "PropertyValue", "name": "No Additives", "value": "Yes"}
      ]
    }
  ];

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([collectionPageSchema, ...categorySchemas])
        }}
      />

      {/* Enhanced Hero Section with Subtle Animations */}
      <div className="relative overflow-hidden">
        <HeroSection
          title="Agriko"
          subtitle="Pure Organic Goodness, Straight From Our Farm"
          description="Experience the authentic taste of traditional farming with our premium organic rice, herbal powders, and wellness blends."
          primaryButtonText="Shop All Products"
          primaryButtonHref="#all-products"
          secondaryButtonText="Browse by Category"
          secondaryButtonHref="#categories"
          showButtons={true}
        />

        {/* Subtle animated elements */}
        <div className="absolute top-20 left-20 opacity-30 pointer-events-none">
          <div className="w-2 h-2 bg-primary-300 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
        </div>
        <div className="absolute top-32 right-32 opacity-20 pointer-events-none">
          <div className="w-3 h-3 bg-secondary-300 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        </div>
        <div className="absolute bottom-20 left-1/3 opacity-25 pointer-events-none">
          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ name: 'Shop' }]} />

      {/* Product Categories */}
      <div id="categories">
        <CategoryCards />
      </div>

      {/* All Products Section */}
      <section id="all-products" className="py-20 bg-white">
        <div className="text-center mb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-heading-1 text-neutral-900 mb-6">
            All Products
          </h2>
          <p className="text-body-large text-neutral-600 max-w-3xl mx-auto">
            Browse our complete collection of premium organic products. Use filters to find exactly what you&apos;re looking for.
          </p>
        </div>

        <AllProductsSection />
      </section>

      {/* Premium Value Propositions */}
      <section className="py-32 bg-gradient-to-br from-amber-50 via-cream to-primary-50 relative overflow-hidden">
        {/* Enhanced Background organic shapes */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-primary-300 to-secondary-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-bl from-amber-300 to-primary-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-secondary-200 to-amber-200 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Why Choose Agriko?
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Experience the difference of authentic organic farming with our family&apos;s commitment to quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="animate-fadeInUp text-center group">
              <div className="bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 relative overflow-hidden shadow-lg">
                {/* Organic Certificate Icon */}
                <svg className="w-12 h-12 text-primary-600 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                  <path d="M12 10.5l1 1-3 3-1-1 3-3z" fill="currentColor"/>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-6 group-hover:text-primary-700 transition-colors">100% Organic</h3>
              <p className="text-lg text-neutral-600 leading-relaxed px-4">Certified organic farming practices with no synthetic pesticides or chemicals</p>
            </div>

            <div className="animate-fadeInUp animation-delay-200 text-center group">
              <div className="bg-gradient-to-br from-secondary-100 via-secondary-200 to-secondary-300 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 relative overflow-hidden shadow-lg">
                {/* Family Farm Icon */}
                <svg className="w-12 h-12 text-secondary-600 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
                  <path d="M7 10h2v2H7zm4-4h2v2h-2zm4 4h2v2h-2z" fill="white"/>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-6 group-hover:text-secondary-700 transition-colors">Family Owned</h3>
              <p className="text-lg text-neutral-600 leading-relaxed px-4">Third-generation family farm with traditional knowledge and modern sustainability</p>
            </div>

            <div className="animate-fadeInUp animation-delay-400 text-center group">
              <div className="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 relative overflow-hidden shadow-lg">
                {/* Express Delivery Icon */}
                <svg className="w-12 h-12 text-amber-600 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  <path d="M10 8l2-2 2 2-2 2z" fill="white"/>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-6 group-hover:text-amber-700 transition-colors">Fast Shipping</h3>
              <p className="text-lg text-neutral-600 leading-relaxed px-4">Nationwide delivery available with careful packaging to preserve freshness</p>
            </div>

            <div className="animate-fadeInUp animation-delay-600 text-center group">
              <div className="bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500 relative overflow-hidden shadow-lg">
                {/* Premium Quality Icon */}
                <svg className="w-12 h-12 text-orange-600 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 17.6 5.6 21.2 8 14l-6-4.8h7.6z"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                  <path d="M12 8l1.5 3h3l-2.5 2 1 3-3-2-3 2 1-3-2.5-2h3z" fill="currentColor"/>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-6 group-hover:text-orange-700 transition-colors">Premium Quality</h3>
              <p className="text-lg text-neutral-600 leading-relaxed px-4">Hand-selected and processed with care to ensure maximum nutritional value</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Enable ISR with 1 hour revalidation for product updates
export const revalidate = 3600;