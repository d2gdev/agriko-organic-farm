import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/ProductCard';
import HeroSection from '@/components/HeroSection';
import Breadcrumb from '@/components/Breadcrumb';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { OrganicProductGridSkeleton } from '@/components/OrganicLoadingStates';
import SearchFiltersComponent, { SearchFilters } from '@/components/SearchFilters';
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
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              className="group animate-fadeInUp" 
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Category Image */}
              <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden -m-8 mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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

// All products section with dynamic import for client-side filtering
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

    // Dynamic import to avoid SSR issues
    const { default: ProductsWithFilters } = await import('@/components/ProductsWithFilters');
    
    return <ProductsWithFilters products={products} />;
    
  } catch (error) {
    console.error('Error loading products:', error);
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

      {/* Hero Section */}
      <HeroSection 
        title="Shop All Products"
        subtitle="Premium Organic Selection"
        description="Discover our complete range of organic rice varieties, pure herbal powders, and health-boosting blends, all grown with sustainable farming practices on our family farm."
        primaryButtonText="Browse Categories"
        primaryButtonHref="#categories"
        secondaryButtonText="View All Products"
        secondaryButtonHref="#all-products"
        showButtons={true}
      />

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

        <Suspense fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductsGridSkeleton />
          </div>
        }>
          <AllProductsSection />
        </Suspense>
      </section>

      {/* Trust Signals */}
      <section className="py-16 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fadeInUp">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">100% Organic</h3>
              <p className="text-sm text-neutral-600">Certified organic farming practices</p>
            </div>
            
            <div className="animate-fadeInUp animation-delay-200">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Family Owned</h3>
              <p className="text-sm text-neutral-600">Third-generation family farm</p>
            </div>
            
            <div className="animate-fadeInUp animation-delay-400">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Fast Shipping</h3>
              <p className="text-sm text-neutral-600">Nationwide delivery available</p>
            </div>
            
            <div className="animate-fadeInUp animation-delay-600">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Premium Quality</h3>
              <p className="text-sm text-neutral-600">Hand-selected and processed</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Enable ISR with 1 hour revalidation for product updates
export const revalidate = 3600;