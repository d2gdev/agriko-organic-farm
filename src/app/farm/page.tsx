import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import { URL_CONSTANTS } from '@/lib/url-constants';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Visit Our Farm - Paglinawan Organic Eco Farm | Agriko',
    description: 'Experience authentic Filipino organic farming at Paglinawan Organic Eco Farm in Dumingag, Zamboanga Del Sur. Learn traditional farming methods, meet founder Gerry, and see where your healthy food comes from.',
    keywords: 'organic farm visit, eco farm tours, Dumingag farm, Zamboanga Del Sur, Filipino organic farming, sustainable agriculture, farm tours Philippines',
    authors: [{ name: 'Agriko Team' }],
    creator: 'Agriko',
    publisher: 'Agriko',
    robots: 'index, follow',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'URL_CONSTANTS.COMPANY_BASE_URL/farm',
      siteName: 'Agriko Organic Farm',
      title: 'Visit Our Farm - Paglinawan Organic Eco Farm | Agriko',
      description: 'Experience authentic Filipino organic farming at Paglinawan Organic Eco Farm in Dumingag, Zamboanga Del Sur. Learn traditional farming methods, meet founder Gerry, and see where your healthy food comes from.',
      images: [
        {
          url: '/images/paglinawan-eco-farm-zamboanga-del-sur-2022.jpg',
          width: 1200,
          height: 630,
          alt: 'Paglinawan Organic Eco Farm - Green Haven',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Visit Our Farm - Paglinawan Organic Eco Farm | Agriko',
      description: 'Experience authentic Filipino organic farming at Paglinawan Organic Eco Farm in Dumingag, Zamboanga Del Sur.',
      images: ['/images/paglinawan-eco-farm-zamboanga-del-sur-2022.jpg'],
    },
  };
}

export async function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#389d65',
  };
}

export default function FarmPage() {
  const farmSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": ["LocalBusiness", "TouristAttraction", "Farm"],
    "name": "Paglinawan Organic Eco Farm",
    "alternateName": "Green Haven - Agriko Organic Farm",
    "description": "10-hectare organic farm in Dumingag, Zamboanga Del Sur offering authentic Filipino farming experiences, tours, and sustainable agriculture education.",
    "url": `${URL_CONSTANTS.COMPANY_BASE_URL}/farm`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Paglinawan Organic Eco Farm, Purok 6, Libertad",
      "addressLocality": "Dumingag",
      "addressRegion": "Zamboanga Del Sur",
      "postalCode": "7028",
      "addressCountry": "PH"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "8.4167",
      "longitude": "123.4167"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "agrikoph@gmail.com",
      "contactType": "customer service",
      "availableLanguage": ["English", "Filipino"]
    },
    "founder": {
      "@type": "Person",
      "name": "Gerry Paglinawan",
      "jobTitle": "Founder & Organic Agriculturist"
    },
    "offers": {
      "@type": "Offer",
      "name": "Farm Tours & Educational Visits",
      "description": "Guided tours showing organic rice cultivation, herbal processing, and traditional Filipino farming methods"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(farmSchema)
        }}
      />
      
      <Breadcrumb items={[{ name: 'Visit Our Farm' }]} />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Visit Paglinawan Organic Eco Farm
          </h1>
          <p className="text-xl text-gray-600">
            Experience authentic Filipino organic farming in Dumingag, Zamboanga Del Sur
          </p>
        </div>

        {/* Main Farm Image */}
        <div className="mb-16">
          <Image
            src="/images/paglinawan-eco-farm-zamboanga-del-sur-2022.jpg"
            alt="Paglinawan Organic Eco Farm aerial view"
            title="Paglinawan Eco Farm 2022"
            width={800}
            height={500}
            className="w-full rounded-lg"
            priority
          />
        </div>

        {/* About Section */}
        <div className="prose prose-lg max-w-none mb-16">
          <h2>About Our Farm</h2>
          <p>
            Our 10-hectare organic farm in Dumingag, Zamboanga Del Sur has been cultivating premium 
            rice varieties and herbal plants using traditional Filipino sustainable farming methods 
            since 2016. Every plant is grown without chemicals, following organic principles that 
            respect both the land and the community.
          </p>
          
          <p>
            When you visit, you&apos;ll walk through rice paddies where different organic varieties grow, 
            see our turmeric gardens where we harvest the roots for our famous 5-in-1 blend, and 
            visit our processing facility where we transform fresh harvest into the products you love.
          </p>
        </div>

        {/* Video */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">See Our Farm</h2>
          <div className="aspect-video">
            <iframe
              src="https://www.youtube.com/embed/_6u6kcAb6ps"
              title="Paglinawan Organic Eco Farm Tour"
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Accommodation */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Farm Stay</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Image
              src="/images/paglinawan-eco-farm-accommodation.jpg"
              alt="Farm accommodation"
              title="Farm Stay"
              width={400}
              height={300}
              className="w-full rounded-lg"
            />
            <Image
              src="/images/paglinawan-eco-farm-interior.jpg"
              alt="Farm interior"
              title="Interior"
              width={400}
              height={300}
              className="w-full rounded-lg"
            />
          </div>
          <p className="text-gray-700 mb-6">
            Stay overnight at our farm and experience rural Filipino life. Wake up to the sounds 
            of nature, enjoy fresh farm-to-table meals, and participate in daily farming activities.
          </p>
        </div>

        {/* What to Expect */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Expect</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Day Visit Includes:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Guided farm tour</li>
                <li>• Meet founder Gerry Paglinawan</li>
                <li>• Learn about organic farming</li>
                <li>• See rice and herbal processing</li>
                <li>• Fresh herbal tea tasting</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Farm Stay Includes:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Comfortable accommodation</li>
                <li>• Farm-to-table meals</li>
                <li>• Hands-on farming activities</li>
                <li>• Traditional farming education</li>
                <li>• Community interaction</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Visit Info */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Your Visit</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Best Time to Visit</h3>
                <p className="text-gray-700 text-sm">
                  Year-round tours available. Rice planting (June-July) and harvest 
                  (October-November) offer the most activity.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What to Bring</h3>
                <p className="text-gray-700 text-sm">
                  Comfortable walking shoes, sun protection, and drinking water. 
                  We provide farm snacks and herbal tea.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ready to Visit?</h2>
          <p className="text-gray-600 mb-8">
            Contact us to arrange your farm visit and experience authentic Filipino organic farming
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Contact Us to Visit
            </Link>
            <Link 
              href="/products" 
              className="border border-green-600 text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              Shop Farm Products
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}