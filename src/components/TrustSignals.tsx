'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Trust badge component
interface TrustBadgeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: 'primary' | 'green' | 'blue' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export function TrustBadge({
  icon,
  title,
  description,
  color = 'primary',
  size = 'md',
  className,
  style
}: TrustBadgeProps) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700'
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl'
  };

  return (
    <div className={cn('text-center animate-fadeInUp', className)} style={style}>
      <div className={cn(
        'rounded-full flex items-center justify-center mx-auto mb-4',
        colorClasses[color],
        sizeClasses[size]
      )}>
        {icon}
      </div>
      <h3 className="font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-600">{description}</p>
    </div>
  );
}

// Customer testimonial component
interface TestimonialProps {
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  rating?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Testimonial({
  quote,
  author,
  role,
  avatar,
  rating = 5,
  className,
  style
}: TestimonialProps) {
  return (
    <div className={cn(
      'bg-white p-6 rounded-xl shadow-sm border border-neutral-200',
      'hover:shadow-md transition-shadow duration-200',
      className
    )} style={style}>
      {/* Rating stars */}
      <div className="flex items-center mb-4">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={cn(
              'w-5 h-5',
              i < rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'
            )}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-neutral-700 mb-4 leading-relaxed">
        &quot;{quote}&quot;
      </blockquote>

      {/* Author */}
      <div className="flex items-center space-x-3">
        {avatar ? (
          <Image
            src={avatar}
            alt={author}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold text-sm">
              {author.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <div className="font-semibold text-neutral-900">{author}</div>
          {role && (
            <div className="text-sm text-neutral-600">{role}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Security badge component
export function SecurityBadge() {
  return (
    <div className="flex items-center space-x-2 text-sm text-neutral-600">
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span>SSL Secured</span>
    </div>
  );
}

// Money back guarantee component
export function MoneyBackGuarantee() {
  return (
    <div className="flex items-center space-x-2 text-sm text-neutral-600">
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>30-Day Money Back Guarantee</span>
    </div>
  );
}

// Free shipping badge
export function FreeShipping({ threshold = 1000 }: { threshold?: number }) {
  return (
    <div className="flex items-center space-x-2 text-sm text-neutral-600">
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <span>Free shipping on orders over ₱{threshold}</span>
    </div>
  );
}

// Trust signals section component
export function TrustSignalsSection() {
  const trustBadges = [
    {
      icon: '🌱',
      title: '100% Organic',
      description: 'Certified organic farming practices',
      color: 'green' as const
    },
    {
      icon: '👨‍👩‍👧‍👦',
      title: 'Family Owned',
      description: 'Third-generation family farm',
      color: 'primary' as const
    },
    {
      icon: '🚚',
      title: 'Fast Shipping',
      description: 'Nationwide delivery available',
      color: 'blue' as const
    },
    {
      icon: '⭐',
      title: 'Premium Quality',
      description: 'Hand-selected and processed',
      color: 'orange' as const
    }
  ];

  return (
    <section className="py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Why Choose Agriko?
          </h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            We&apos;re committed to providing the highest quality organic products with exceptional service and sustainable practices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustBadges.map((badge, index) => (
            <TrustBadge
              key={badge.title}
              icon={badge.icon}
              title={badge.title}
              description={badge.description}
              color={badge.color}
              className="animation-delay-200"
              style={{ animationDelay: `${index * 200}ms` }}
            />
          ))}
        </div>

        {/* Additional trust signals */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            <SecurityBadge />
            <MoneyBackGuarantee />
            <FreeShipping />
          </div>
        </div>
      </div>
    </section>
  );
}

// Customer reviews section
export function CustomerReviewsSection() {
  const testimonials = [
    {
      quote: "The black rice from Agriko is absolutely amazing! The quality and taste are exceptional. My family loves it and we've been ordering regularly.",
      author: "Maria Santos",
      role: "Regular Customer",
      rating: 5
    },
    {
      quote: "Fresh, organic, and delivered on time. The turmeric powder has such a rich color and flavor. Highly recommend Agriko for authentic organic products.",
      author: "John Cruz",
      role: "Health Enthusiast",
      rating: 5
    },
    {
      quote: "As a chef, I'm very particular about ingredients. Agriko's products are consistently high quality and you can taste the difference organic makes.",
      author: "Chef Ana Rodriguez",
      role: "Professional Chef",
      rating: 5
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-neutral-600">
            Join thousands of satisfied customers who trust Agriko for their organic needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              rating={testimonial.rating}
              className="animate-fadeInUp"
              style={{ animationDelay: `${index * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Statistics section
export function StatisticsSection() {
  const [stats, setStats] = useState([
    { label: 'Happy Customers', value: 0, target: 5000, suffix: '+' },
    { label: 'Products Sold', value: 0, target: 25000, suffix: '+' },
    { label: 'Years Experience', value: 0, target: 15, suffix: '' },
    { label: 'Organic Certified', value: 0, target: 100, suffix: '%' }
  ]);

  // Animate numbers on mount
  useEffect(() => {
    const animateNumbers = () => {
      stats.forEach((stat, index) => {
        const increment = stat.target / 50;
        let current = 0;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.target) {
            current = stat.target;
            clearInterval(timer);
          }
          
          setStats(prevStats => 
            prevStats.map((s, i) => 
              i === index ? { ...s, value: Math.floor(current) } : s
            )
          );
        }, 50);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          animateNumbers();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById('stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [stats]);

  return (
    <section id="stats-section" className="py-16 bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={stat.label} className="animate-fadeInUp" style={{ animationDelay: `${index * 200}ms` }}>
              <div className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div className="text-sm text-neutral-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}