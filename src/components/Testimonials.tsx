'use client';

import React, { useState, useEffect } from 'react';

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

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Maria Santos",
    location: "Quezon City",
    rating: 5,
    text: "Agriko's 5-in-1 blend completely transformed my daily energy. I was struggling with chronic fatigue, but after just 2 weeks, I felt like myself again.",
    product: "5-in-1 Herbal Blend",
    healthOutcome: "Increased energy by 70%",
    avatar: "/images/testimonials/maria.jpg"
  },
  {
    id: 2,
    name: "Carlos Mendoza",
    location: "Cebu City",
    rating: 5,
    text: "My arthritis pain was unbearable until I started drinking Agriko's turmeric blend. Within a month, my joint pain reduced significantly.",
    product: "Turmeric Blend",
    healthOutcome: "Reduced joint pain by 80%",
    avatar: "/images/testimonials/carlos.jpg"
  },
  {
    id: 3,
    name: "Ana Reyes",
    location: "Davao City",
    rating: 5,
    text: "As a busy mom, Agriko's products help me maintain my health naturally. My blood sugar levels are now stable, and I have more energy for my kids.",
    product: "Moringa Powder",
    healthOutcome: "Normalized blood sugar levels",
    avatar: "/images/testimonials/ana.jpg"
  },
  {
    id: 4,
    name: "Roberto Cruz",
    location: "Manila",
    rating: 5,
    text: "I've tried many health supplements, but nothing compares to Agriko's quality. My digestion improved dramatically, and I sleep better now.",
    product: "Ginger Lemongrass Tea",
    healthOutcome: "Improved digestion and sleep quality",
    avatar: "/images/testimonials/roberto.jpg"
  },
  {
    id: 5,
    name: "Elena Villanueva",
    location: "Iloilo City",
    rating: 5,
    text: "Agriko's soursop blend boosted my immune system incredibly. I haven't been sick since I started using it 6 months ago.",
    product: "Soursop Blend",
    healthOutcome: "Zero sick days in 6 months",
    avatar: "/images/testimonials/elena.jpg"
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
  const displayTestimonials = showAll ? testimonials : testimonials.slice(0, limit);

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
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {displayTestimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {testimonial.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
              <p className="text-sm text-gray-600">{testimonial.location}</p>
            </div>
          </div>

          <div className="flex items-center mb-3">
            {renderStars(testimonial.rating)}
          </div>

          <blockquote className="text-gray-700 mb-4 italic">
            &ldquo;{testimonial.text}&rdquo;
          </blockquote>

          <div className="border-t pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium text-green-700">{testimonial.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Result:</span>
                <span className="font-semibold text-orange-600">{testimonial.healthOutcome}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}