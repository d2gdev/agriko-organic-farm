import HeroSection from '@/components/HeroSection';
import Link from 'next/link';
import Image from 'next/image';
import ContactForm from './ContactForm';
import ScrollButton from './ScrollButton';
// import Breadcrumb from '@/components/Breadcrumb';

export default function ContactPage() {

  // Enhanced Organization Schema for Contact Page
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "Store"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "legalName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": "https://shop.agrikoph.com",
    "logo": "https://shop.agrikoph.com/images/Agriko-Logo.png",
    "founder": {
      "@type": "Person",
      "name": "Gerry Paglinawan",
      "jobTitle": "Founder & CEO"
    },
    "address": [
      {
        "@type": "PostalAddress",
        "@id": "https://shop.agrikoph.com/contact#cebu-office",
        "name": "Visayas Office",
        "streetAddress": "GF G&A Arcade, Wilson St., Lahug",
        "addressLocality": "Cebu City",
        "addressRegion": "Central Visayas",
        "postalCode": "6000",
        "addressCountry": "PH",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "10.3157",
          "longitude": "123.8854"
        }
      },
      {
        "@type": "PostalAddress",
        "@id": "https://shop.agrikoph.com/contact#farm-location",
        "name": "Paglinawan Organic Eco Farm",
        "streetAddress": "Paglinawan Organic Eco Farm, Purok 6, Libertad",
        "addressLocality": "Dumingag",
        "addressRegion": "Zamboanga Del Sur",
        "postalCode": "7028",
        "addressCountry": "PH",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "8.4167",
          "longitude": "123.4167"
        }
      }
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "email": "agrikoph@gmail.com",
        "contactType": "customer service",
        "availableLanguage": ["English", "Filipino"],
        "areaServed": "PH",
        "hoursAvailable": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "08:00",
          "closes": "17:00"
        }
      }
    ],
    "sameAs": [
      "https://www.facebook.com/AgrikoPH/",
      "https://agrikoph.com"
    ]
  };

  // Enhanced Breadcrumb Schema for Contact Page
  const breadcrumbSchema = {
    "@context": "https://schema.org",
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
        "name": "Contact Us",
        "item": "https://shop.agrikoph.com/contact"
      }
    ]
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, breadcrumbSchema])
        }}
      />

      {/* Breadcrumbs - temporarily disabled due to import issue */}
      {/* <Breadcrumb items={[{ name: 'Contact' }]} /> */}

      {/* Enhanced Hero Section with Warmer Design */}
      <div className="relative">
        {/* Consolidated Background Overlay for Better Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-amber-600/15 to-black/20 z-0" />
        <HeroSection
          title="Agriko"
          subtitle="We'd Love to Hear from You"
          description="Connect with our family farm team. Whether you have questions, feedback, or want to visit our organic farm, we're here to help!"
          showButtons={false}
        />
        {/* Warm Farm-themed Icons */}
        <div className="absolute bottom-12 right-12 opacity-30 z-10 hidden lg:block animate-pulse">
          <span className="text-8xl">🌾</span>
        </div>
        <div className="absolute bottom-24 left-12 opacity-25 z-10 hidden lg:block">
          <span className="text-7xl rotate-12 inline-block">🧑‍🌾</span>
        </div>
        {/* Primary and Secondary CTAs */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
          <ScrollButton />
          <Link
            href="/find-us"
            className="inline-flex items-center bg-white/90 backdrop-blur-sm text-amber-700 px-8 py-4 rounded-full font-bold hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            <span>Find a Location</span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>

      <section className="py-32 relative">
        {/* Warm Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/20 via-cream-50/30 to-white z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Icon-led Contact Info Blocks */}
          <div className="mb-24">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16 font-[family-name:var(--font-crimson)]">Get in Touch</h2>

            {/* Horizontal Contact Blocks with Consistent Styling */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-8 shadow-lg border border-amber-100 hover:shadow-xl transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cebu Office Block */}
                <div className="flex items-center gap-4 group cursor-pointer p-4 rounded-2xl hover:bg-white/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">📍</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-amber-700 transition-colors duration-300">Cebu Office</h3>
                    <p className="text-gray-700 text-sm leading-tight">GF G&A Arcade, Wilson St.<br/>Lahug, Cebu City</p>
                  </div>
                </div>

                {/* Email Block */}
                <div className="flex items-center gap-4 group cursor-pointer p-4 rounded-2xl hover:bg-white/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">📧</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-amber-700 transition-colors duration-300">Email</h3>
                    <a href="mailto:agrikoph@gmail.com" className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors duration-300">
                      agrikoph@gmail.com
                    </a>
                    <p className="text-gray-600 text-xs">24hr response</p>
                  </div>
                </div>

                {/* Phone Block */}
                <div className="flex items-center gap-4 group cursor-pointer p-4 rounded-2xl hover:bg-white/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">📞</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-amber-700 transition-colors duration-300">Call</h3>
                    <p className="text-gray-700 text-sm">Contact via email</p>
                    <p className="text-gray-600 text-xs">Mon-Fri 9AM-6PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Team Photo and Additional Info */}
            <div className="space-y-8">
              {/* Team Photo */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 shadow-lg border border-amber-100">
                <div className="text-center">
                  <div className="w-64 h-48 mx-auto bg-gradient-to-br from-green-100 to-amber-100 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <span className="text-6xl mb-2 block">🧑‍🌾</span>
                      <p className="text-gray-700 font-medium">Meet Our Team</p>
                      <p className="text-gray-600 text-sm">Passionate about organic farming</p>
                    </div>
                  </div>
                  <blockquote className="text-lg text-gray-700 italic mb-4">
                    &ldquo;From our family farm to your table, we&apos;re committed to bringing you the finest organic products with personal care.&rdquo;
                  </blockquote>
                  <cite className="text-gray-600 font-semibold">– Gerry Paglinawan, Founder</cite>
                </div>
              </div>

              {/* Farm Visit Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-lg border border-green-100">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-3xl">🌾</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Visit Our Farm</h3>
                  <p className="text-gray-700 mb-6">Experience sustainable farming firsthand at Paglinawan Organic Eco Farm in Mindanao.</p>
                  <a
                    href="mailto:agrikoph@gmail.com?subject=Farm Visit Request"
                    className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-md"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Visit
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form - Right Column with Warm Styling */}
            <ContactForm />
          </div>

          {/* Enhanced Testimonial Section */}
          <div className="mt-32 relative overflow-hidden">
            <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30 rounded-3xl p-12 border border-amber-100 shadow-lg relative">
              {/* Subtle Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/10 to-orange-200/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-200/10 to-yellow-200/10 rounded-full blur-2xl"></div>

              <div className="max-w-4xl mx-auto text-center relative z-10">
                {/* Customer Photo with More Authentic Feel */}
                <div className="w-28 h-28 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-2 border-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full"></div>
                  <span className="text-5xl relative z-10">👩‍🌾</span>
                </div>

                {/* Star Rating */}
                <div className="flex justify-center gap-1 mb-6">
                  <span className="text-2xl text-yellow-500">⭐</span>
                  <span className="text-2xl text-yellow-500">⭐</span>
                  <span className="text-2xl text-yellow-500">⭐</span>
                  <span className="text-2xl text-yellow-500">⭐</span>
                  <span className="text-2xl text-yellow-500">⭐</span>
                </div>

                <blockquote className="text-2xl lg:text-3xl text-gray-900 italic mb-8 font-[family-name:var(--font-crimson)] leading-relaxed max-w-3xl mx-auto">
                  &ldquo;Agriko&apos;s team feels like family! They responded within hours and helped me find the perfect organic blend for my family&apos;s wellness needs. The personal touch makes all the difference.&rdquo;
                </blockquote>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 inline-block shadow-md border border-amber-100">
                  <cite className="text-lg text-gray-800 font-bold block mb-2">Maria Santos</cite>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span>Long-time Customer</span>
                    <span>•</span>
                    <span>📍 Cebu City</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}