'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function WhyChooseSection() {
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

  const features = [
    {
      icon: '🌾',
      title: 'Premium Quality Rice',
      description: (
        <>
          Our <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">organic rice varieties</Link> - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils for superior taste and nutrition. <Link href="/find-us" className="text-primary-700 hover:text-primary-800 underline">Find our products</Link> at major supermarkets nationwide.
        </>
      ),
      gradient: 'from-primary-100 to-primary-50',
      borderColor: 'border-primary-300',
      iconGradient: 'from-primary-500 to-primary-600',
      hoverShadow: '[0_20px_50px_rgba(8,_112,_184,_0.15)]',
      hoverText: 'text-primary-700'
    },
    {
      icon: '🌿',
      title: 'Pure Herbal Powders',
      description: (
        <>
          Premium <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">Dulaw (Turmeric), Salabat (Ginger), and Moringa powders</Link> - pure, nutrient-dense superfoods with powerful health benefits. <Link href="/about" className="text-primary-700 hover:text-primary-800 underline">Discover the 5-in-1 blend ingredients</Link> and their wellness properties.
        </>
      ),
      gradient: 'from-accent-100 to-accent-50',
      borderColor: 'border-accent-300',
      iconGradient: 'from-accent-500 to-accent-600',
      hoverShadow: '[0_20px_50px_rgba(251,_146,_60,_0.15)]',
      hoverText: 'text-accent-600'
    },
    {
      icon: '💛',
      title: 'Health Blends & Honey',
      description: (
        <>
          Unique <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">5-in-1 Turmeric Tea Blend</Link>, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness. <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">Learn about health benefits</Link> and usage recommendations.
        </>
      ),
      gradient: 'from-yellow-100 to-yellow-50',
      borderColor: 'border-yellow-300',
      iconGradient: 'from-yellow-500 to-yellow-600',
      hoverShadow: '[0_20px_50px_rgba(251,_191,_36,_0.15)]',
      hoverText: 'text-yellow-700'
    }
  ];

  return (
    <section
      ref={sectionRef}
      className="py-40 lg:py-48 bg-gradient-to-br from-green-50/20 via-white to-emerald-50/20 border-t border-neutral-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-24 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-8 font-[family-name:var(--font-crimson)]">
            Why Choose Agriko Organic Farm?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group text-center bg-gradient-to-br ${feature.gradient} p-8 rounded-xl shadow-2xl hover:shadow-${feature.hoverShadow} hover:-translate-y-1 transition-all duration-500 border-2 ${feature.borderColor} ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
              style={{
                transitionDelay: `${index * 200}ms`
              }}
            >
              <div className={`bg-gradient-to-br ${feature.iconGradient} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                <span className="text-4xl animate-pulse">{feature.icon}</span>
              </div>
              <h3 className={`text-heading-3 text-neutral-900 mb-4 group-hover:${feature.hoverText} transition-colors font-semibold`}>
                {feature.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}