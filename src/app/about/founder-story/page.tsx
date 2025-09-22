import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { urlHelpers } from '@/lib/url-constants';
import { URL_CONSTANTS } from '@/lib/url-constants';

export const metadata: Metadata = {
  title: 'Founder Story - Gerry Paglinawan | Agriko Organic Farm',
  description: 'Discover how founder Gerry Paglinawan transformed his health challenge in 2013 into a mission to provide premium organic products and empower local farmers.',
  keywords: 'Gerry Paglinawan, Agriko founder, organic farming Philippines, turmeric healing story, health transformation',
  openGraph: {
    title: 'Founder Story - Gerry Paglinawan | Agriko Organic Farm',
    description: 'Discover how founder Gerry Paglinawan transformed his health challenge in 2013 into a mission to provide premium organic products and empower local farmers.',
    url: urlHelpers.getShopUrl('/about/founder-story'),
    siteName: 'Agriko Organic Farm',
    images: [
      {
        url: urlHelpers.getShopUrl('/images/founder-gerry-paglinawan.jpg'),
        width: 1200,
        height: 630,
        alt: 'Gerry Paglinawan - Founder of Agriko Organic Farm',
      },
    ],
    locale: 'en_US',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Founder Story - Gerry Paglinawan | Agriko Organic Farm',
    description: 'Discover how founder Gerry Paglinawan transformed his health challenge in 2013 into a mission to provide premium organic products and empower local farmers.',
    images: [urlHelpers.getShopUrl('/images/founder-gerry-paglinawan.jpg')],
  },
  alternates: {
    canonical: urlHelpers.getShopUrl('/about/founder-story'),
  },
};

export default function FounderStoryPage() {
  // Structured Data for Person Schema
  const personSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "Person",
    "name": "Gerry Paglinawan",
    "jobTitle": "Founder & CEO",
    "worksFor": {
      "@type": "Organization",
      "name": "Agriko Organic Farm",
      "url": urlHelpers.getShopUrl()
    },
    "description": "Founder of Agriko Organic Farm, advocate for organic farming and natural health solutions in the Philippines",
    "url": urlHelpers.getShopUrl('/about/founder-story'),
    "image": urlHelpers.getShopUrl('/images/founder-gerry-paglinawan.jpg'),
    "sameAs": [
      urlHelpers.getShopUrl(),
      urlHelpers.getShopUrl('/about')
    ]
  };

  // Article Schema for the founder story
  const articleSchema = {
    "@context": URL_CONSTANTS.SCHEMA.BASE,
    "@type": "Article",
    "headline": "The Gerry Paglinawan Story: From Health Challenge to Wellness Mission",
    "description": "The inspiring journey of how Agriko founder Gerry Paglinawan healed himself with turmeric in 2013 and built a mission to bring organic wellness to Filipino families.",
    "author": {
      "@type": "Person",
      "name": "Gerry Paglinawan"
    },
    "datePublished": "2016-01-01",
    "dateModified": "2024-01-01",
    "publisher": {
      "@type": "Organization",
      "name": "Agriko Organic Farm",
      "logo": {
        "@type": "ImageObject",
        "url": urlHelpers.getShopUrl('/images/Agriko-Logo.png')
      }
    },
    "mainEntityOfPage": urlHelpers.getShopUrl('/about/founder-story'),
    "image": urlHelpers.getShopUrl('/images/founder-gerry-paglinawan.jpg'),
    "about": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    }
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
        "item": urlHelpers.getShopUrl()
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "About",
        "item": urlHelpers.getShopUrl('/about')
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Founder Story",
        "item": urlHelpers.getShopUrl('/about/founder-story')
      }
    ]
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([personSchema, articleSchema, breadcrumbSchema])
        }}
      />

      {/* Breadcrumbs */}
      <Breadcrumb items={[
        { name: 'About', href: '/about' },
        { name: 'Founder Story' }
      ]} />

      {/* Enhanced Hero Section with Visual Elements */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 via-green-900/10 to-emerald-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-8xl animate-pulse">🌾</div>
          <div className="absolute top-32 right-20 text-6xl animate-bounce delay-1000">🌿</div>
          <div className="absolute bottom-20 left-1/4 text-7xl animate-pulse delay-500">🧑‍🌾</div>
          <div className="absolute bottom-32 right-1/3 text-5xl animate-bounce delay-1500">🌱</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10">
          <div className="text-center">
            {/* Founder Image Placeholder */}
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
              <span className="text-6xl">🧑‍🌾</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 font-[family-name:var(--font-crimson)]">
              The Gerry Paglinawan Story
            </h1>
            <p className="text-xl sm:text-2xl text-amber-800 mb-8 max-w-3xl mx-auto font-medium">
              From Personal Health Crisis to National Wellness Mission
            </p>

            {/* Enhanced Stats */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="bg-white/90 backdrop-blur-sm border border-amber-200 text-amber-800 px-6 py-3 rounded-full text-sm font-medium shadow-lg">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 inline-block animate-pulse"></span>
                Founded in 2016
              </div>
              <div className="bg-white/90 backdrop-blur-sm border border-green-200 text-green-800 px-6 py-3 rounded-full text-sm font-medium shadow-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 inline-block animate-pulse"></span>
                10,000+ Filipino Families Served
              </div>
              <div className="bg-white/90 backdrop-blur-sm border border-blue-200 text-blue-800 px-6 py-3 rounded-full text-sm font-medium shadow-lg">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 inline-block animate-pulse"></span>
                50+ Partner Farmers
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="animate-bounce mt-8">
              <div className="w-6 h-10 border-2 border-amber-800 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-amber-800 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Story Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">

        {/* Enhanced Beginning - 2013 Health Crisis */}
        <div className="mb-20">
          {/* Year Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-red-100 to-orange-100 px-6 py-3 rounded-full border border-red-200 shadow-lg">
              <span className="text-3xl mr-3">📅</span>
              <span className="text-2xl font-bold text-red-800">2013</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-[family-name:var(--font-crimson)]">
                A Health Crisis That Changed Everything
              </h2>
              <div className="space-y-6">
                <p className="text-lg text-gray-700 leading-relaxed">
                  In 2013, Gerry Paglinawan faced a health challenge that conventional medicine couldn&apos;t fully address. Like many Filipinos dealing with chronic inflammation and pain, he was searching for answers beyond traditional treatments.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Desperate for relief, Gerry turned to an age-old Filipino remedy his grandmother had taught him - turmeric. What happened next would not only transform his health but spark a mission that would impact thousands of Filipino families.
                </p>

                {/* Visual Pain to Relief Journey */}
                <div className="bg-gradient-to-r from-red-50 to-green-50 p-6 rounded-2xl border-l-4 border-gradient-to-b from-red-400 to-green-400">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">😰</span>
                    </div>
                    <div className="flex-1 h-2 bg-gradient-to-r from-red-300 via-yellow-300 to-green-300 rounded-full"></div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">😊</span>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600 font-medium">
                    Journey from Pain to Healing
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-l-4 border-amber-400 p-6 rounded-r-2xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-lg">💭</span>
                    </div>
                    <div>
                      <p className="text-gray-800 italic text-lg leading-relaxed">
                        &ldquo;I was skeptical at first, but within weeks of using homemade turmeric, my pain began to disappear. I knew I had to share this with other Filipinos who were suffering like I was.&rdquo;
                      </p>
                      <p className="text-sm text-amber-700 mt-3 font-semibold">- Gerry Paglinawan, Founder</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:order-first">
              <div className="bg-gradient-to-br from-orange-100 via-yellow-100 to-amber-100 rounded-3xl p-8 text-center shadow-2xl border border-orange-200 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="w-40 h-40 mx-auto bg-gradient-to-br from-orange-400 via-yellow-500 to-amber-500 rounded-full flex items-center justify-center mb-6 shadow-xl animate-pulse">
                  <span className="text-7xl">🌿</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 font-[family-name:var(--font-crimson)]">The Discovery</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Traditional Filipino turmeric remedies provided the healing conventional medicine couldn&apos;t deliver
                </p>

                {/* Traditional Knowledge Badge */}
                <div className="mt-6 inline-flex items-center bg-orange-200 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mr-2 animate-pulse"></span>
                  Ancestral Wisdom
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Mission - 2014-2015 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center font-[family-name:var(--font-crimson)]">
            From Personal Healing to Community Mission
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Research & Development</h3>
              <p className="text-gray-700">
                Gerry spent months perfecting the ideal blend, studying traditional Filipino remedies and modern nutritional science to create the most effective turmeric-based supplement.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <div className="text-4xl mb-4">👨‍🌾</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Supporting Local Farmers</h3>
              <p className="text-gray-700">
                Recognizing the need to support Filipino agriculture, Gerry built partnerships with local organic farmers in Zamboanga Del Sur, creating sustainable income opportunities.
              </p>
            </div>
          </div>
          <div className="text-center bg-gradient-to-r from-green-100 to-yellow-100 p-8 rounded-xl">
            <p className="text-lg text-gray-800 mb-4">
              &ldquo;This wasn&apos;t just about my health anymore. I realized I could help thousands of Filipino families while supporting our local farmers and preserving our traditional healing knowledge.&rdquo;
            </p>
            <p className="text-sm text-gray-600 font-medium">- Gerry&apos;s mission statement, 2015</p>
          </div>
        </div>

        {/* The Launch - 2016 */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border border-orange-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">
                2016: Agriko Organic Farm is Born
              </h2>
              <p className="text-lg text-gray-600">
                With the tagline &ldquo;Agree ka? Agriko!&rdquo; - a play on Filipino language meaning &ldquo;Do you agree? Agriko!&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏭</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">First Production</h4>
                <p className="text-sm text-gray-700">Small-batch production in Dumingag, Zamboanga Del Sur</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🛒</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Local Markets</h4>
                <p className="text-sm text-gray-700">Started selling in Metro, Gaisano, and PureGold supermarkets</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Organic Certification</h4>
                <p className="text-sm text-gray-700">Achieved 100% organic certification for all products</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Interactive Timeline */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center font-[family-name:var(--font-crimson)]">
            Agriko Timeline: 8 Years of Growth
          </h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-emerald-500 to-green-600 rounded-full shadow-lg"></div>

            <div className="space-y-12">
              {/* 2016 - Foundation */}
              <div className="relative flex items-start group hover:bg-green-50 p-4 rounded-2xl transition-all duration-300">
                <div className="absolute left-6 w-5 h-5 bg-green-600 rounded-full border-4 border-white shadow-lg z-10 group-hover:scale-125 transition-transform duration-300"></div>
                <div className="ml-16">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-600 text-white text-lg font-bold py-2 px-4 rounded-xl shadow-lg">2016</div>
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xl mb-2">Company Founded</h4>
                  <p className="text-gray-700 text-lg leading-relaxed">Agriko Organic Farm officially launched with 5-in-1 turmeric blend</p>
                </div>
              </div>

              {/* 2018 - Retail Expansion */}
              <div className="relative flex items-start group hover:bg-emerald-50 p-4 rounded-2xl transition-all duration-300">
                <div className="absolute left-6 w-5 h-5 bg-emerald-600 rounded-full border-4 border-white shadow-lg z-10 group-hover:scale-125 transition-transform duration-300"></div>
                <div className="ml-16">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-emerald-600 text-white text-lg font-bold py-2 px-4 rounded-xl shadow-lg">2018</div>
                    <span className="text-2xl">🏪</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xl mb-2">Retail Expansion</h4>
                  <p className="text-gray-700 text-lg leading-relaxed">Products available in 50+ Metro, Gaisano, and PureGold stores nationwide</p>
                </div>
              </div>

              {/* 2020 - Digital Transformation */}
              <div className="relative flex items-start group hover:bg-blue-50 p-4 rounded-2xl transition-all duration-300">
                <div className="absolute left-6 w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-lg z-10 group-hover:scale-125 transition-transform duration-300"></div>
                <div className="ml-16">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-600 text-white text-lg font-bold py-2 px-4 rounded-xl shadow-lg">2020</div>
                    <span className="text-2xl">💻</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xl mb-2">Digital Transformation</h4>
                  <p className="text-gray-700 text-lg leading-relaxed">Launched online platform during pandemic to serve customers nationwide</p>
                </div>
              </div>

              {/* 2022 - Product Expansion */}
              <div className="relative flex items-start group hover:bg-amber-50 p-4 rounded-2xl transition-all duration-300">
                <div className="absolute left-6 w-5 h-5 bg-amber-600 rounded-full border-4 border-white shadow-lg z-10 group-hover:scale-125 transition-transform duration-300"></div>
                <div className="ml-16">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-amber-600 text-white text-lg font-bold py-2 px-4 rounded-xl shadow-lg">2022</div>
                    <span className="text-2xl">🌾</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xl mb-2">Product Line Expansion</h4>
                  <p className="text-gray-700 text-lg leading-relaxed">Added premium rice varieties and expanded organic supplement range</p>
                </div>
              </div>

              {/* 2024 - Milestone */}
              <div className="relative flex items-start group hover:bg-purple-50 p-4 rounded-2xl transition-all duration-300">
                <div className="absolute left-6 w-5 h-5 bg-purple-600 rounded-full border-4 border-white shadow-lg z-10 group-hover:scale-125 transition-transform duration-300 animate-pulse"></div>
                <div className="ml-16">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-600 text-white text-lg font-bold py-2 px-4 rounded-xl shadow-lg">2024</div>
                    <span className="text-2xl">🎉</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xl mb-2">10,000+ Customers</h4>
                  <p className="text-gray-700 text-lg leading-relaxed">Reached milestone of serving over 10,000 Filipino families with organic wellness</p>
                  <div className="mt-3 inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-2 animate-pulse"></span>
                    Current Achievement
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Impact & Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-crimson)]">
              Impact Beyond Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Gerry&apos;s vision extends far beyond profit – it&apos;s about transforming communities, preserving traditions, and empowering wellness across the Philippines.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Community Empowerment Card */}
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 p-8 rounded-3xl shadow-xl border border-green-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-4xl">🤝</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Community Empowerment</h3>
                <p className="text-green-700 font-medium">Building sustainable farming communities</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start bg-white/80 p-4 rounded-xl border border-green-100">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <span className="text-green-600 font-bold text-sm">50+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Local Farmer Partnerships</p>
                    <p className="text-sm text-gray-600">Direct relationships ensuring fair trade and quality</p>
                  </div>
                </div>

                <div className="flex items-start bg-white/80 p-4 rounded-xl border border-green-100">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Educational Programs</p>
                    <p className="text-sm text-gray-600">Teaching sustainable organic farming techniques</p>
                  </div>
                </div>

                <div className="flex items-start bg-white/80 p-4 rounded-xl border border-green-100">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <span className="text-lg">🌿</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Traditional Knowledge</p>
                    <p className="text-sm text-gray-600">Preserving Filipino healing wisdom for future generations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Transformation Card */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 p-8 rounded-3xl shadow-xl border border-blue-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-4xl">💚</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Health Transformation</h3>
                <p className="text-blue-700 font-medium">Changing lives through natural wellness</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start bg-white/80 p-4 rounded-xl border border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <span className="text-blue-600 font-bold text-xs">10K+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Customers Transformed</p>
                    <p className="text-sm text-gray-600">Filipino families reporting significant health improvements</p>
                  </div>
                </div>

                <div className="flex items-start bg-white/80 p-4 rounded-xl border border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Inflammation Relief</p>
                    <p className="text-sm text-gray-600">Thousands of arthritis and chronic pain success stories</p>
                  </div>
                </div>

                <div className="flex items-start bg-white/80 p-4 rounded-xl border border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                    <span className="text-lg">🛡️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Preventive Wellness</p>
                    <p className="text-sm text-gray-600">Promoting natural health through nutrition and lifestyle</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Numbers Grid */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-3xl p-8 border border-amber-200 shadow-lg">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8 font-[family-name:var(--font-crimson)]">
              The Numbers Tell the Story
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-2">10,000+</div>
                <div className="text-sm text-gray-700 font-medium">Families Served</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
                <div className="text-sm text-gray-700 font-medium">Partner Farms</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">8</div>
                <div className="text-sm text-gray-700 font-medium">Years of Growth</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-sm text-gray-700 font-medium">Organic Certified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Call to Action */}
        <div className="relative overflow-hidden">
          {/* Background with Subtle Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-6 left-6 text-6xl animate-pulse">🌾</div>
            <div className="absolute bottom-6 right-6 text-5xl animate-bounce delay-1000">🌿</div>
            <div className="absolute top-1/2 left-1/4 text-4xl animate-pulse delay-500">🧑‍🌾</div>
          </div>

          <div className="relative z-10 text-center p-12 rounded-3xl">
            {/* Mission Badge */}
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              Continuing Gerry&apos;s Legacy Since 2016
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white font-[family-name:var(--font-crimson)]">
              Continue Gerry&apos;s Mission
            </h2>
            <p className="text-xl mb-8 text-green-100 max-w-3xl mx-auto leading-relaxed">
              Join thousands of Filipino families who have transformed their health with Agriko&apos;s organic wellness solutions.
              Every purchase supports local farmers and preserves traditional healing wisdom.
            </p>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col lg:flex-row gap-6 justify-center max-w-2xl mx-auto">
              <Link
                href="/products"
                className="group inline-flex items-center justify-center px-10 py-5 bg-white text-green-700 font-bold rounded-2xl hover:bg-green-50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
              >
                <span className="text-2xl mr-3 group-hover:animate-bounce">🛍️</span>
                Shop Our Products
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link
                href="/contact"
                className="group inline-flex items-center justify-center px-10 py-5 bg-green-800/90 backdrop-blur-sm border border-white/20 text-white font-bold rounded-2xl hover:bg-green-900 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span className="text-2xl mr-3 group-hover:animate-pulse">💬</span>
                Contact Our Team
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 text-green-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <span className="text-sm font-medium">100% Organic Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤝</span>
                <span className="text-sm font-medium">Supporting 50+ Local Farms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💚</span>
                <span className="text-sm font-medium">10,000+ Happy Customers</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}