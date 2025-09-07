import { Suspense } from 'react';
import { getAllProducts, getFeaturedProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/ProductCard';
import HeroSection from '@/components/HeroSection';
import Link from 'next/link';

// Loading component for products grid
function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="flex justify-between items-center">
              <div className="h-5 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
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

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
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

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {latestProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
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
  return (
    <>
      <HeroSection 
        title="Agriko"
        subtitle="From Our Farm, To Your Cup"
        description="Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm."
      />

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-6">
              Premium Product Selection
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Discover our carefully curated collection of organic rice varieties, pure herbal powders, and health-boosting blends.
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
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-6">
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
              <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-4">Premium Quality Rice</h3>
              <p className="text-neutral-600 leading-relaxed">
                Our organic rice varieties - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils for superior taste and nutrition.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-accent-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-4">Pure Herbal Powders</h3>
              <p className="text-neutral-600 leading-relaxed">
                Premium Dulaw (Turmeric), Salabat (Ginger), and Moringa powders - pure, nutrient-dense superfoods with powerful health benefits.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-4">Health Blends & Honey</h3>
              <p className="text-neutral-600 leading-relaxed">
                Unique 5-in-1 Turmeric Tea Blend, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-primary-700 bg-leaf-texture relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-700 bg-opacity-90"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed mb-8">
            &quot;Agriko&#39;s organic rice varieties and herbal powders have transformed our family&#39;s health routine. The quality is exceptional - especially their Black Rice and Moringa powder!&quot;
          </blockquote>
          <div className="text-accent-400">
            <p className="font-semibold text-lg mb-1">Maria Santos</p>
            <p className="text-primary-200">Health-Conscious Mom, Manila</p>
          </div>
        </div>
      </section>

      {/* Latest Products Section */}
      <section id="latest-products" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-6">
              Latest Products
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
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

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-r from-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-leaf-texture opacity-10"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
            Ready to Experience Premium Quality?
          </h2>
          <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of health-conscious families who trust Agriko for premium organic rice, herbal powders, and wellness products.
          </p>
          <div className="flex justify-center">
            <Link
              href="/contact"
              className="border-2 border-white text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-700 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;