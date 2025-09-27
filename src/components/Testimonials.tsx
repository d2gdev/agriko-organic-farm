'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  product: string;
  healthOutcome: string;
  avatar?: string;
}

// Avatar colors for placeholder avatars
const avatarColors = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600'
];

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Maria Santos",
    location: "Quezon City",
    rating: 5,
    text: "Agriko's 5-in-1 blend completely transformed my daily energy. I was struggling with chronic fatigue, but after just 2 weeks, I felt like myself again.",
    product: "5-in-1 Herbal Blend",
    healthOutcome: "Increased energy by 70%",
    avatar: "👩"
  },
  {
    id: 2,
    name: "Carlos Mendoza",
    location: "Cebu City",
    rating: 5,
    text: "My arthritis pain was unbearable until I started drinking Agriko's turmeric blend. Within a month, my joint pain reduced significantly.",
    product: "Turmeric Blend",
    healthOutcome: "Reduced joint pain by 80%",
    avatar: "👨"
  },
  {
    id: 3,
    name: "Ana Reyes",
    location: "Davao City",
    rating: 5,
    text: "As a busy mom, Agriko's products help me maintain my health naturally. My blood sugar levels are now stable, and I have more energy for my kids.",
    product: "Moringa Powder",
    healthOutcome: "Normalized blood sugar levels",
    avatar: "👩"
  },
  {
    id: 4,
    name: "Roberto Cruz",
    location: "Manila",
    rating: 5,
    text: "I've tried many health supplements, but nothing compares to Agriko's quality. My digestion improved dramatically, and I sleep better now.",
    product: "Ginger Lemongrass Tea",
    healthOutcome: "Improved digestion and sleep quality",
    avatar: "👨"
  },
  {
    id: 5,
    name: "Elena Villanueva",
    location: "Iloilo City",
    rating: 5,
    text: "Agriko's soursop blend boosted my immune system incredibly. I haven't been sick since I started using it 6 months ago.",
    product: "Soursop Blend",
    healthOutcome: "Zero sick days in 6 months",
    avatar: "👩"
  }
];

interface TestimonialsProps {
  showAll?: boolean;
  limit?: number;
  autoRotate?: boolean;
  className?: string;
}

export default function Testimonials({
  showAll = false,
  limit = 3,
  autoRotate = false,
  className = ""
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const displayTestimonials = showAll ? testimonials : testimonials.slice(0, limit);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!autoRotate || showAll) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRotate, showAll, displayTestimonials.length]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-500' : 'text-gray-400'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (autoRotate && !showAll) {
    const testimonial = displayTestimonials[currentIndex];
    if (!testimonial) {
      return null;
    }

    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${className}`}>
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {testimonial.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="ml-4">
            <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
            <p className="text-sm text-gray-600">{testimonial.location}</p>
          </div>
          <div className="ml-auto flex items-center">
            {renderStars(testimonial.rating)}
          </div>
        </div>

        <blockquote className="text-gray-700 mb-4 italic">
          &ldquo;{testimonial.text}&rdquo;
        </blockquote>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-green-700">Product: {testimonial.product}</span>
            <span className="text-orange-600 font-semibold">{testimonial.healthOutcome}</span>
          </div>
        </div>

        {/* Rotation indicators */}
        <div className="flex justify-center mt-4 space-x-2">
          {displayTestimonials.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-green-600' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-neutral-50 via-white to-green-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <span className="text-xl font-bold text-green-600 mb-3 block">Real Stories</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">What Our Customers Say</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">Trusted by thousands of families across the Philippines</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
          {displayTestimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 border border-gray-100 transition-all duration-700 hover:-translate-y-1 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Quote Icon */}
              <div className="text-6xl text-green-200 leading-none mb-4">❝</div>

              {/* Testimonial Text - Shorter line width */}
              <blockquote className="text-gray-700 mb-6 italic leading-relaxed text-base">
                {testimonial.text}
              </blockquote>

              {/* Rating Stars */}
              <div className="flex items-center mb-6">
                {renderStars(testimonial.rating)}
                <span className="ml-2 text-sm text-gray-500 font-medium">5.0</span>
              </div>

              {/* Customer Info with Avatar */}
              <div className="flex items-center border-t pt-6">
                <div className={`w-14 h-14 bg-gradient-to-r ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center shadow-md`}>
                  <span className="text-2xl">{testimonial.avatar}</span>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>

              {/* Product Badge */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {testimonial.product}
                </span>
                <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {testimonial.healthOutcome}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center space-x-8 text-gray-600">
            <div className="flex items-center">
              <span className="text-3xl mr-2">🌱</span>
              <div className="text-left">
                <p className="font-bold text-2xl text-gray-900">10,000+</p>
                <p className="text-sm">Happy Customers</p>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="flex items-center">
              <span className="text-3xl mr-2">⭐</span>
              <div className="text-left">
                <p className="font-bold text-2xl text-gray-900">4.9/5</p>
                <p className="text-sm">Average Rating</p>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="flex items-center">
              <span className="text-3xl mr-2">🏆</span>
              <div className="text-left">
                <p className="font-bold text-2xl text-gray-900">Since 2016</p>
                <p className="text-sm">Trusted Quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}