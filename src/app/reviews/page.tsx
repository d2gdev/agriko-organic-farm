'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import Link from 'next/link';

interface Review {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  productName: string;
  date: string;
  verified: boolean;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch reviews from API
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews');
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-xl ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}>
        ⭐
      </span>
    ));
  };

  return (
    <>
      <HeroSection
        title="Agriko"
        subtitle="Customer Reviews"
        description="Read what our customers say about our organic farm products. Every review helps us grow better!"
        showButtons={false}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Reviews Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">
            What Our Customers Say
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From our family farm to your cup - these reviews represent the trust and satisfaction of families who choose our organic products.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Be Our First Reviewer!</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We&apos;re excited to hear from our customers. Once you try our organic products, come back and share your experience!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="text-xl mr-2">🛍️</span>
              Shop Our Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300"
              >
                {/* Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex">{renderStars(review.rating)}</div>
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Review Content */}
                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </blockquote>

                {/* Customer Info */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{review.customerName}</p>
                      <p className="text-sm text-gray-600">{review.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{review.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">
              Share Your Experience
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Have you tried our organic products? We&apos;d love to hear about your experience! Your feedback helps other families discover the quality and care we put into every product.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span className="text-xl mr-2">🛍️</span>
                Shop Our Products
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span className="text-xl mr-2">💬</span>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}