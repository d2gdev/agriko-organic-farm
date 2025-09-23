import Image from 'next/image';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import { URL_CONSTANTS, urlHelpers } from '@/lib/url-constants';

export default function EventsPage() {
  // Farm Tour Event Schema
  const farmTourEventSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "Event",
    "@id": `${urlHelpers.getShopUrl()}/events#farm-tours`,
    "name": "Paglinawan Organic Eco Farm Tours",
    "description": "Experience sustainable organic farming firsthand. Learn about rice cultivation, herbal medicine, and traditional Filipino agricultural practices.",
    "startDate": "2024-01-01T09:00:00+08:00",
    "endDate": "2024-12-31T17:00:00+08:00",
    "eventStatus": `${URL_CONSTANTS.SCHEMA.BASE}/EventScheduled`,
    "eventAttendanceMode": `${URL_CONSTANTS.SCHEMA.BASE}/OfflineEventAttendanceMode`,
    "location": {
      "@type": "Place",
      "name": "Paglinawan Organic Eco Farm",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Purok 6, Libertad",
        "addressLocality": "Dumingag",
        "addressRegion": "Zamboanga Del Sur",
        "postalCode": "7028",
        "addressCountry": "PH"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "8.4167",
        "longitude": "123.4167"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "Agriko Organic Farm",
      "url": "urlHelpers.getShopUrl()"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "PHP",
      "availability": "URL_CONSTANTS.SCHEMA.BASE/InStock",
      "validFrom": "2024-01-01"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "General Public",
      "suggestedMinAge": 5
    },
    "maximumAttendeeCapacity": 50,
    "keywords": [
      "organic farming",
      "sustainable agriculture", 
      "herbal medicine",
      "rice cultivation",
      "eco-tourism",
      "educational tour"
    ]
  };

  // Workshop Event Schema
  const herbalMedicineWorkshopSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "EducationEvent",
    "@id": "urlHelpers.getShopUrl()/events#herbal-workshops",
    "name": "Traditional Filipino Herbal Medicine Workshop",
    "description": "Learn about the health benefits and preparation methods of traditional Filipino herbal medicines including turmeric, ginger, and moringa.",
    "startDate": "2024-06-01T14:00:00+08:00",
    "endDate": "2024-06-01T17:00:00+08:00",
    "duration": "PT3H",
    "eventStatus": `${URL_CONSTANTS.SCHEMA.BASE}/EventScheduled`,
    "eventAttendanceMode": `${URL_CONSTANTS.SCHEMA.BASE}/OfflineEventAttendanceMode`,
    "location": {
      "@type": "Place",
      "name": "Paglinawan Organic Eco Farm",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Purok 6, Libertad",
        "addressLocality": "Dumingag",
        "addressRegion": "Zamboanga Del Sur",
        "postalCode": "7028",
        "addressCountry": "PH"
      }
    },
    "instructor": [
      {
        "@type": "Person",
        "name": "Gerry Paglinawan",
        "jobTitle": "Founder & Herbal Medicine Expert",
        "worksFor": {
          "@type": "Organization",
          "name": "Agriko Organic Farm"
        }
      }
    ],
    "organizer": {
      "@type": "Organization", 
      "name": "Agriko Organic Farm",
      "url": "urlHelpers.getShopUrl()"
    },
    "offers": {
      "@type": "Offer",
      "price": "500",
      "priceCurrency": "PHP",
      "availability": "URL_CONSTANTS.SCHEMA.BASE/InStock",
      "includes": [
        "Workshop materials",
        "Sample herbal products",
        "Recipe guide",
        "Farm tour"
      ]
    },
    "teaches": [
      "Turmeric health benefits and preparation",
      "Ginger therapeutic uses",
      "Moringa nutritional properties",
      "Traditional Filipino remedies",
      "Herbal tea blending techniques"
    ],
    "learningResourceType": "Workshop",
    "educationalLevel": "Beginner",
    "maximumAttendeeCapacity": 25
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "urlHelpers.getShopUrl()"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Events & Workshops",
        "item": "urlHelpers.getShopUrl()/events"
      }
    ]
  };

  return (
    <>
      {/* Enhanced Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            farmTourEventSchema,
            herbalMedicineWorkshopSchema,
            breadcrumbSchema
          ])
        }}
      />
      
      <HeroSection 
        title="Agriko"
        subtitle="Events & Workshops"
        description="Join us for educational farm tours, herbal medicine workshops, and hands-on learning about organic agriculture and traditional Filipino wellness practices."
        showButtons={false}
      />

      {/* Events Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Farm Tours */}
          <div className="mb-16">
            <div className="bg-cream rounded-xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-heading-2 text-primary-700 mb-6">
                    Paglinawan Organic Eco Farm Tours
                  </h2>
                  <p className="text-body-large text-neutral-600 mb-6">
                    Experience sustainable organic farming firsthand. Learn about our rice cultivation methods, 
                    herbal medicine preparation, and traditional Filipino agricultural practices that have been 
                    passed down through generations.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-primary-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-neutral-700">Duration: 2-3 hours</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-primary-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-neutral-700">Group size: Up to 50 people</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-primary-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-neutral-700">Free admission</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-primary-200">
                    <p className="text-sm text-neutral-600">
                      <strong>What you&apos;ll learn:</strong> Rice cultivation techniques, herbal medicine benefits, 
                      sustainable farming practices, traditional Filipino agricultural wisdom
                    </p>
                  </div>
                </div>
                
                <div className="relative h-80">
                  <Image
                    src="/images/agriko-organic-farm-landscape-fields.jpg"
                    alt="Paglinawan Organic Eco Farm landscape showing rice fields and sustainable farming practices"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Herbal Medicine Workshop */}
          <div>
            <div className="bg-accent-50 rounded-xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="relative h-80">
                  <Image
                    src="/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg"
                    alt="Traditional Filipino herbal medicine workshop featuring Agriko's premium herbal products"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                <div>
                  <h2 className="text-heading-2 text-accent-600 mb-6">
                    Traditional Filipino Herbal Medicine Workshop
                  </h2>
                  <p className="text-body-large text-neutral-600 mb-6">
                    Discover the healing power of traditional Filipino herbal medicines. Learn about the health 
                    benefits and preparation methods of turmeric, ginger, moringa, and other medicinal plants 
                    grown on our organic farm.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-accent-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-neutral-700">Duration: 3 hours</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-accent-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-neutral-700">Group size: Up to 25 people</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-accent-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span className="text-neutral-700">₱500 per person</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-accent-200">
                    <p className="text-sm text-neutral-600 mb-2">
                      <strong>Includes:</strong> Workshop materials, sample herbal products, recipe guide, farm tour
                    </p>
                    <p className="text-sm text-neutral-600">
                      <strong>What you&apos;ll learn:</strong> Herbal medicine preparation, health benefits of turmeric and moringa, 
                      traditional Filipino remedies, herbal tea blending techniques
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-16 text-center bg-primary-700 text-white rounded-xl p-8">
            <h2 className="text-heading-2 mb-4">Ready to Visit Our Farm?</h2>
            <p className="text-lg mb-6">
              Contact us to schedule your visit and learn about organic farming and traditional Filipino wellness practices.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/contact"
                className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Contact Us
              </Link>
              <Link 
                href="mailto:jc.paglinawan@agrikoph.com"
                className="bg-accent-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent-700 transition-colors"
              >
                Email Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export const metadata = {
  title: 'Events & Workshops - Agriko Organic Farm',
  description: 'Join our educational farm tours and herbal medicine workshops. Learn about organic farming and traditional Filipino wellness practices.',
};