'use client';

import { useState } from 'react';
import HeroSection from '@/components/HeroSection';
import Link from 'next/link';
import { icons } from '@/lib/design-system';
import { URL_CONSTANTS, urlHelpers } from '@/lib/url-constants';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Function to highlight search terms
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return text;
    }

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Enhanced FAQ Schema with comprehensive Q&A
  const faqSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "FAQPage",
    "@id": `${urlHelpers.getShopUrl()}/faq#faqpage`,
    "name": "Frequently Asked Questions - Agriko Organic Farm",
    "description": "Comprehensive answers to common questions about Agriko's organic products, health benefits, shipping, and farming practices",
    "url": `${urlHelpers.getShopUrl()}/faq`,
    "inLanguage": "en-PH",
    "datePublished": "2024-01-01",
    "dateModified": "2024-03-15",
    "about": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What makes Agriko's rice premium quality?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our organic rice varieties - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils using traditional farming methods passed down through generations. We ensure superior taste, nutrition, and purity through careful harvesting and processing.",
          "dateCreated": "2024-01-01",
          "upvoteCount": 25,
          "author": {
            "@type": "Organization",
            "name": "Agriko Organic Farm"
          }
        }
      },
      {
        "@type": "Question",
        "name": "What herbal powders does Agriko offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer premium Dulaw (Turmeric), Salabat (Ginger), and Moringa powders - pure, nutrient-dense superfoods with powerful health benefits. All are organically grown and processed without artificial additives or preservatives.",
          "dateCreated": "2024-01-01",
          "upvoteCount": 20,
          "author": {
            "@type": "Organization",
            "name": "Agriko Organic Farm"
          }
        }
      },
      {
        "@type": "Question",
        "name": "What health blends and products are available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide unique 5-in-1 Turmeric Tea Blend, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness. Our signature 5-in-1 blend contains turmeric, ginger, soursop, moringa, brown sugar, and lemongrass.",
          "dateCreated": "2024-01-01",
          "upvoteCount": 30,
          "author": {
            "@type": "Organization",
            "name": "Agriko Organic Farm"
          }
        }
      },
      {
        "@type": "Question",
        "name": "What are the health benefits of your 5-in-1 Turmeric Blend?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our 5-in-1 blend supports joint health (turmeric), aids digestion (ginger), provides antioxidants (soursop), helps manage blood sugar and cholesterol (moringa), supplies minerals (brown sugar), and relieves headaches and indigestion (lemongrass)."
        }
      },
      {
        "@type": "Question",
        "name": "Where can I buy Agriko products?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Agriko products are available at major supermarkets across the Philippines including Metro, Gaisano Grand, and PureGold locations. You can also order online through our website with delivery to your doorstep."
        }
      },
      {
        "@type": "Question",
        "name": "Do you ship nationwide in the Philippines?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we ship nationwide across the Philippines. Shipping costs vary by location, with free shipping available for orders above a minimum amount. Standard delivery takes 3-7 business days depending on your location."
        }
      },
      {
        "@type": "Question",
        "name": "Are your products certified organic?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all our products are grown using organic farming practices without synthetic pesticides, herbicides, or artificial fertilizers. Our farm follows sustainable agriculture methods and maintains proper organic certification standards."
        }
      },
      {
        "@type": "Question",
        "name": "How should I store Agriko products?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Store rice varieties in a cool, dry place in airtight containers. Herbal powders should be kept in sealed containers away from moisture and direct sunlight. Our honey should be stored at room temperature and may crystallize naturally over time."
        }
      },
      {
        "@type": "Question",
        "name": "What is the shelf life of your products?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our organic rice varieties have a shelf life of 12-18 months when stored properly. Herbal powders maintain potency for 24 months, and our pure honey has an indefinite shelf life when stored correctly. All products display best-by dates on packaging."
        }
      },
      {
        "@type": "Question",
        "name": "Can I visit your farm in Dumingag, Zamboanga Del Sur?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Farm visits are welcome by appointment. Contact us at agrikoph@gmail.com to arrange a tour of Paglinawan Organic Eco Farm where you can see our sustainable farming practices firsthand and meet founder Gerry Paglinawan."
        }
      }
    ]
  };

  // Enhanced Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": urlHelpers.getShopUrl()
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "FAQ",
        "item": urlHelpers.getShopUrl('/faq')
      }
    ]
  };

  // FAQ WebPage Schema
  const faqWebPageSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "WebPage",
    "@id": urlHelpers.getShopUrl('/faq#webpage'),
    "name": "FAQ - Agriko Organic Farm",
    "description": "Find answers to common questions about Agriko organic products, health benefits, shipping, and our farming practices.",
    "url": `${urlHelpers.getShopUrl()}/faq`,
    "inLanguage": "en-PH",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Agriko Organic Farm",
      "url": urlHelpers.getShopUrl()
    },
    "about": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "mainEntity": {
      "@type": "FAQPage",
      "@id": urlHelpers.getShopUrl('/faq#faqpage')
    }
  };

  const faqs = [
    {
      question: "What makes Agriko's rice premium quality?",
      answer: "Our organic rice varieties - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils using traditional farming methods passed down through generations. We ensure superior taste, nutrition, and purity through careful harvesting and processing.",
      icon: icons.rice,
      category: 'products'
    },
    {
      question: "What herbal powders does Agriko offer?",
      answer: "We offer premium Dulaw (Turmeric), Salabat (Ginger), and Moringa powders - pure, nutrient-dense superfoods with powerful health benefits. All are organically grown and processed without artificial additives or preservatives.",
      icon: icons.detox,
      category: 'products'
    },
    {
      question: "What health blends and products are available?",
      answer: "We provide unique 5-in-1 Turmeric Tea Blend, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness. Our signature 5-in-1 blend contains turmeric, ginger, soursop, moringa, brown sugar, and lemongrass. <br/><br/><strong>Try our bestselling 5-in-1 blend!</strong> <a href='/products' className='text-green-600 hover:text-green-700 font-semibold underline'>Order now</a> and join 10,000+ satisfied customers.",
      icon: icons.wellness,
      category: 'products'
    },
    {
      question: "What are the health benefits of your 5-in-1 Turmeric Blend?",
      answer: "Our 5-in-1 blend supports joint health (turmeric), aids digestion (ginger), provides antioxidants (soursop), helps manage blood sugar and cholesterol (moringa), supplies minerals (brown sugar), and relieves headaches and indigestion (lemongrass). <br/><br/><strong>Ready to experience these benefits?</strong> <a href='/products' className='text-green-600 hover:text-green-700 font-semibold underline'>Shop our 5-in-1 Turmeric Blend now</a> and start your wellness journey today!",
      icon: icons.immunity,
      category: 'health'
    },
    {
      question: "Where can I buy Agriko products?",
      answer: "Agriko products are available at major supermarkets across the Philippines including Metro, Gaisano Grand, and PureGold locations. You can also order online through our website with delivery to your doorstep. <br/><br/><strong>Order online now for the fastest delivery!</strong> <a href='/products' className='text-green-600 hover:text-green-700 font-semibold underline'>Shop all products</a> with free shipping on orders over ₱1,500.",
      icon: icons.cart,
      category: 'ordering'
    },
    {
      question: "Do you ship nationwide in the Philippines?",
      answer: "Yes, we ship nationwide across the Philippines. Shipping costs vary by location, with free shipping available for orders above a minimum amount. Standard delivery takes 3-7 business days depending on your location.",
      icon: icons.delivery,
      category: 'delivery'
    },
    {
      question: "Are your products certified organic?",
      answer: "Yes, all our products are grown using organic farming practices without synthetic pesticides, herbicides, or artificial fertilizers. Our farm follows sustainable agriculture methods and maintains proper organic certification standards.",
      icon: icons.check,
      category: 'certification'
    },
    {
      question: "How should I store Agriko products?",
      answer: "Store rice varieties in a cool, dry place in airtight containers. Herbal powders should be kept in sealed containers away from moisture and direct sunlight. Our honey should be stored at room temperature and may crystallize naturally over time.",
      icon: icons.info,
      category: 'storage'
    },
    {
      question: "What is the shelf life of your products?",
      answer: "Our organic rice varieties have a shelf life of 12-18 months when stored properly. Herbal powders maintain potency for 24 months, and our pure honey has an indefinite shelf life when stored correctly. All products display best-by dates on packaging.",
      icon: icons.clock,
      category: 'storage'
    },
    {
      question: "Can I visit your farm in Dumingag, Zamboanga Del Sur?",
      answer: "Yes! Farm visits are welcome by appointment. Contact us at agrikoph@gmail.com to arrange a tour of Paglinawan Organic Eco Farm where you can see our sustainable farming practices firsthand and meet founder Gerry Paglinawan.",
      icon: icons.farm,
      category: 'visit'
    }
  ];

  // Filter FAQs based on search term
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqSchema, breadcrumbSchema, faqWebPageSchema])
        }}
      />

      {/* Enhanced FAQ Hero Section with more vertical spacing */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-yellow-50/20 z-0" />
        <div className="py-12">
          <HeroSection
            title="Agriko"
            subtitle="Frequently Asked Questions"
            description="Answers to your most common questions about Agriko products and practices"
            showButtons={false}
          />
        </div>
        {/* FAQ Illustrations */}
        <div className="absolute bottom-10 right-10 z-10 hidden lg:block">
          <div className="relative">
            <svg className="w-64 h-64 text-green-600/10 animate-float" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-400/10 rounded-full blur-xl"></div>
          </div>
        </div>
        <div className="absolute bottom-20 left-10 opacity-20 z-10 hidden lg:block">
          <svg className="w-32 h-32 text-green-500 rotate-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20A4,4 0 0,0 12,16V14A6,6 0 0,1 18,8H17M17,1L17.5,3.5L20,3L19,5L21,6L19,7L20,9L17.5,8.5L17,11L16.5,8.5L14,9L15,7L13,6L15,5L14,3L16.5,3.5L17,1Z"/>
          </svg>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-8">
            <span className="text-4xl">{icons.info}</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-8">
            Your Questions Answered
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Get quick answers to common questions about <Link href="/" className="text-green-600 hover:text-green-700 font-medium">Agriko organic products</Link>, health benefits, and <Link href="/about" className="text-green-600 hover:text-green-700 font-medium">our farming practices</Link>.
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                aria-label="Search frequently asked questions"
                aria-describedby="search-help"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Results Count */}
        {searchTerm && (
          <div className="text-center mb-6">
            <p className="text-gray-600">
              Found <span className="font-semibold text-green-600">{filteredFaqs.length}</span> result{filteredFaqs.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`rounded-xl shadow-md border-2 transition-all duration-300 hover:shadow-lg ${
                  isOpen ? 'bg-gradient-to-br from-green-50 to-emerald-50/30 border-green-400 shadow-lg' : 'bg-white border-neutral-100'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className={`w-full flex items-center justify-between p-6 cursor-pointer transition-all duration-300 rounded-t-xl ${
                    isOpen ? 'bg-transparent' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start gap-4 text-left">
                    <span className="text-2xl mt-1 flex-shrink-0">{faq.icon}</span>
                    <h3 className={`text-xl md:text-2xl font-bold pr-4 transition-colors ${
                      isOpen ? 'text-green-700' : 'text-neutral-900'
                    }`}>
                      {highlightText(faq.question, searchTerm)}
                    </h3>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOpen ? 'bg-green-600 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      <span className={`text-2xl font-light transition-transform duration-300 inline-block ${
                        isOpen ? 'rotate-45' : ''
                      }`}>+</span>
                    </div>
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-400 ease-out ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 pb-8 pt-2">
                    <div className="bg-gradient-to-br from-white to-green-50/20 rounded-xl p-6 border border-green-100/50">
                      <p className="text-neutral-700 leading-[1.8] text-base">
                        {highlightText(faq.answer, searchTerm)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Product CTA Section */}
        <div className="mt-16 relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-green-700 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/80 to-green-800/80"></div>
          <div className="relative z-10 text-center p-12 text-white">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Start Your Wellness Journey?
            </h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Got your questions answered? Now experience the amazing health benefits of our 5-in-1 Turmeric Blend and premium organic products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center bg-white text-green-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Shop All Products
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center bg-green-800 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-900 transition-all duration-300 border-2 border-white/20"
              >
                Learn Our Story
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm opacity-80">
              <span className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free shipping over ₱1,500
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                10,000+ satisfied customers
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                100% organic certified
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Contact CTA with consistent button colors */}
        <div className="mt-20 relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-yellow-50 to-green-50 border border-green-200 shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center p-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-6">
              <span className="text-3xl">{icons.phone}</span>
            </div>
            <h3 className="text-4xl font-bold text-neutral-900 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Can&apos;t find the answer you&apos;re looking for? Our friendly team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:agrikoph@gmail.com"
                className="inline-flex items-center justify-center bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg group"
              >
                <span className="mr-2 text-xl">{icons.email}</span>
                Email Us
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/find-us"
                className="inline-flex items-center justify-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg group"
              >
                <span className="mr-2 text-xl">{icons.location}</span>
                Visit Locations
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}