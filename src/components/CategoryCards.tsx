'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function CategoryCards() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const categories = [
    {
      name: 'Rice Varieties',
      description: 'Premium organic black, brown, red, and white rice varieties',
      icon: '🌾',
      href: '/products?category=rice',
      gradient: 'from-amber-100 to-orange-100',
      borderColor: 'border-amber-300',
      iconBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      hoverGradient: 'hover:from-amber-200 hover:to-orange-200',
      shadowColor: 'hover:shadow-amber-200/50',
    },
    {
      name: 'Herbal Powders',
      description: 'Pure, nutrient-dense superfoods with powerful health benefits',
      icon: '🌿',
      href: '/products?category=herbs',
      gradient: 'from-green-100 to-emerald-100',
      borderColor: 'border-green-300',
      iconBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      hoverGradient: 'hover:from-green-200 hover:to-emerald-200',
      shadowColor: 'hover:shadow-green-200/50',
    },
    {
      name: 'Health Blends',
      description: 'Specially crafted blends and organic honey for complete wellness',
      icon: '🍶',
      href: '/products?category=blends',
      gradient: 'from-yellow-100 to-amber-100',
      borderColor: 'border-yellow-300',
      iconBg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      hoverGradient: 'hover:from-yellow-200 hover:to-amber-200',
      shadowColor: 'hover:shadow-yellow-200/50',
    }
  ];

  return (
    <section ref={sectionRef} className="py-40 lg:py-48 bg-gradient-to-br from-white via-orange-50/20 to-yellow-50/20 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-24 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-8 font-[family-name:var(--font-crimson)]">
            Shop by Category
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Explore our three main product categories, each carefully cultivated and processed to deliver maximum nutrition and authentic flavors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              href={category.href}
              className={`group relative bg-gradient-to-br ${category.gradient} ${category.hoverGradient} rounded-2xl p-8 border-2 ${category.borderColor} shadow-xl hover:shadow-2xl ${category.shadowColor} transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-500 overflow-hidden ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              {/* Enhanced accent circles */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white opacity-20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-700" />

              <div className="relative text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 ${category.iconBg} rounded-full mb-6 mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <span className="text-5xl">{category.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-green-700 transition-colors">
                  {category.name}
                </h3>
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  {category.description}
                </p>
                <div className="inline-flex items-center text-green-700 font-semibold group-hover:gap-3 transition-all">
                  <span>Browse {category.name}</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}