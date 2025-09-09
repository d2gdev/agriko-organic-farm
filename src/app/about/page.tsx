import HeroSection from '@/components/HeroSection';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';

// Note: metadataBase should be set in layout.tsx instead

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About Agriko Organic Farm - Premium Rice & Health Products',
    description: 'Learn about Agriko Organic Farm, our sustainable farming practices, and commitment to providing premium organic rice varieties, pure herbal powders, and health blends.',
    keywords: 'organic farm, sustainable agriculture, organic rice, herbal powders, health products',
    authors: [{ name: 'Agriko Team' }],
    creator: 'Agriko',
    publisher: 'Agriko',
    robots: 'index, follow',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://agrikoph.com/about',
      siteName: 'Agriko Organic Farm',
      title: 'About Agriko Organic Farm - Premium Rice & Health Products',
      description: 'Learn about Agriko Organic Farm, our sustainable farming practices, and commitment to providing premium organic rice varieties, pure herbal powders, and health blends.',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Agriko Organic Farm - About Us',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'About Agriko Organic Farm - Premium Rice & Health Products',
      description: 'Learn about Agriko Organic Farm, our sustainable farming practices, and commitment to providing premium organic rice varieties, pure herbal powders, and health blends.',
      images: ['/og-image.jpg'],
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

export default function AboutPage() {
  // Organization Schema for About Page
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": "https://agrikoph.com",
    "logo": "https://agrikoph.com/Agriko-Logo.png",
    "foundingDate": "2016",
    "founder": {
      "@type": "Person",
      "name": "Gerry Paglinawan"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Paglinawan Organic Eco Farm, Purok 6, Libertad",
      "addressLocality": "Dumingag",
      "addressRegion": "Zamboanga Del Sur",
      "postalCode": "7028",
      "addressCountry": "PH"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "email": "agrikoph@gmail.com",
        "contactType": "customer service",
        "availableLanguage": ["English", "Filipino"]
      }
    ],
    "sameAs": [
      "https://www.facebook.com/AgrikoPH/"
    ]
  };

  // Breadcrumb Schema for About Page
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://agrikoph.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "About",
        "item": "https://agrikoph.com/about"
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
      
      {/* Breadcrumbs */}
      <Breadcrumb items={[{ name: 'About' }]} />
      
      {/* Hero Section with AGRIKO branding */}
      <div 
        className="relative overflow-hidden" 
        style={{ 
          backgroundColor: '#f5f5f5',
          '--cache-key': Date.now()
        } as React.CSSProperties & { '--cache-key': number }}
      >
        <Image
          src={`/images/hero.png?v=${Date.now()}`}
          alt="Hero background"
          fill
          className="object-cover object-center opacity-90"
          style={{ 
            backgroundAttachment: "fixed"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60" />
        
        {/* Animated AGRIKO Title */}
        <div className="relative z-10 flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            {/* Agriko Logo */}
            <div className="flex justify-center">
              <Image 
                src={`/images/Agriko-Logo.png?v=${Date.now()}`} 
                alt="Agriko Organic Farm Logo - Premium Philippine Organic Agriculture Products and Health Supplements" 
                title="Agriko - Agriculture Keeps Organic" 
                width={500}
                height={200}
                className="w-80 md:w-96 lg:w-[500px] h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-12 h-12 bg-yellow-400 rounded-full animate-pulse opacity-80" />
        <div className="absolute top-32 right-32 w-8 h-8 bg-yellow-300 rounded-full animate-bounce opacity-60" />
        <div className="absolute bottom-32 left-40 w-6 h-6 bg-yellow-500 rounded-full animate-ping opacity-70" />
        <div className="absolute top-40 right-20 w-10 h-10 bg-yellow-400 rounded-full animate-pulse opacity-50" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column - Company Story */}
          <div className="lg:col-span-1">
            <h2 className="text-heading-1 text-primary-700 mb-8">COMPANY STORY</h2>
            
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                Inspired by his personal journey, Founder <span className="font-semibold">Gerry Paglinawan</span> transformed his health challenge into wellness. In 2013, while battling illness, Gerry crafted homemade turmeric juice using <span className="font-semibold">agricultural knowledge</span>. The next day, he experienced significant health improvement. This moment ignited his passion for creating <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">turmeric powders</Link>. Known as an <span className="font-semibold">organic agriculturist</span>, Gerry&apos;s natural healing reputation grew. Many sought his <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">herbal remedies</Link>, and after his first turmeric powder order, he discovered his calling. Driven to make a difference, he began manufacturing <Link href="/" className="text-primary-700 hover:text-primary-800 underline">turmeric blends</Link> to heal himself and uplift his community.
              </p>
              
              <div className="bg-orange-100 p-4 rounded-lg border-l-4 border-orange-500">
                <p className="text-orange-800 font-medium italic">
                  <span className="font-bold">Agree ka? Agriko!</span>
                </p>
              </div>
              
              <div className="mt-6 mb-3"></div>
              <p className="text-gray-700 leading-relaxed">
                In 2016, Gerry registered Agriko Multi-Trade & Enterprise Corp., a manufacturing and distribution company dedicated to producing agricultural value-added products that serve as alternative <Link href="/faq" className="text-primary-700 hover:text-primary-800 underline">herbal remedies and organic rice</Link> for the community. Agriko Multi-Trade & Enterprise Corp. is committed to partnering with local farmers, providing them with education on agriculture, and ensuring their livelihood by connecting them directly to the market through <Link href="/" className="text-primary-700 hover:text-primary-800 underline">our products</Link>. By empowering farmers and promoting sustainable practices, the company aims to create a healthier and more prosperous future for all. <Link href="/find-us" className="text-primary-700 hover:text-primary-800 underline">Find our products</Link> at supermarkets nationwide.
              </p>
            </div>

            {/* Values Section */}
            <h2 className="text-heading-1 text-primary-700 mb-8">VALUES</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-800 font-bold text-lg">1</span>
                </div>
                <div>
                  <h4 className="text-heading-4 text-gray-800 mb-2">Sustainability</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Agree ka? Agriko!
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-800 font-bold text-lg">2</span>
                </div>
                <div>
                  <h4 className="text-heading-4 text-gray-800 mb-2">Legacy Beans</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 5 Ingredients & More */}
          <div className="lg:col-span-2">
            <h2 className="text-heading-1 text-primary-700 mb-8">5n1 INGREDIENTS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="relative space-y-4 p-6 rounded-lg overflow-hidden">
                <Image
                  src={`/images/agriko-organic-farm-products-showcase.jpg?v=${Date.now()}`}
                  alt="Agriko Organic Farm Products Showcase - Premium Rice Varieties, Herbal Powders and Health Supplements"
                  title="Agriko Product Showcase"
                  fill
                  className="object-cover object-center opacity-25"
                />
                <div className="relative z-10 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#0F4D0F' }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-800">Turmeric</p>
                    <p className="text-gray-600 text-sm">Good for Arthritis and Memory Loss</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#0F4D0F' }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-800">Ginger</p>
                    <p className="text-gray-600 text-sm">Great for Pain Relief</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#0F4D0F' }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-800">Soursop</p>
                    <p className="text-gray-600 text-sm">Cancer Killing Properties</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#0F4D0F' }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-800">Moringa</p>
                    <p className="text-gray-600 text-sm">Helps manage Blood Sugar, Cholesterol and the Liver</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#0F4D0F' }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-800">Brown Sugar</p>
                    <p className="text-gray-600 text-sm">Calcium, Iron, and Potassium</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#0F4D0F' }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-800">Lemon grass</p>
                    <p className="text-gray-600 text-sm">Helps relieve headaches and indigestion</p>
                  </div>
                </div>
                </div>
              </div>
              
              {/* Green info box */}
              <div className="relative text-gray-800 p-6 rounded-lg overflow-hidden">
                <Image
                  src={`/images/agriko-organic-farm-landscape-fields.jpg?v=${Date.now()}`}
                  alt="Agriko Organic Farm Landscape - Sustainable Agriculture Fields and Eco-Friendly Farming Practices in Philippines"
                  title="Agriko Organic Farm - Sustainable Agriculture"
                  fill
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/75" />
                <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-heading-3 text-white drop-shadow-lg">Exactly The Journey</h3>
                </div>
                <p className="text-white drop-shadow-md text-sm leading-relaxed">
                  Agree ka? Agriko!
                </p>
                </div>
              </div>
            </div>

            {/* Blend Section */}
            <div className="relative rounded-lg p-8 text-white mb-12 overflow-hidden">
              <Image
                src={`/images/agriko-turmeric-blend-background.png?v=${Date.now()}`}
                alt="Agriko Turmeric Blend Background - 5-in-1 Organic Health Supplement Manufacturing Process"
                title="Agriko 5-in-1 Turmeric Blend Process"
                fill
                className="object-cover object-center"
                style={{ 
                  backgroundAttachment: "fixed"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/80" />
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="font-bold text-xl" style={{ color: '#68281c' }}>3</span>
                  </div>
                  <h3 className="text-heading-2">BLEND</h3>
                </div>
                <p className="text-white/80 leading-relaxed">
                  Agree ka? Agriko!
                </p>
              </div>
            </div>

            {/* Team Section */}
            <h2 className="text-heading-1 text-primary-700 mb-8">SPOIL YOURSELF WITHOUT FEELING GUILTY</h2>
            <p className="text-gray-700 mb-8">Join the Revolution</p>
            
            {/* Team Photos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image 
                  src={`/images/agriko-turmeric-5in1-blend-500g-health-supplement.jpg?v=${Date.now()}`} 
                  alt="Agriko 5-in-1 Turmeric Blend 500g - Premium Health Supplement with Natural Wellness Benefits" 
                  title="Agriko 5-in-1 Health Benefits - 500g"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image 
                  src={`/images/agriko-turmeric-5in1-blend-180g-organic.jpg?v=${Date.now()}`} 
                  alt="Agriko 5-in-1 Turmeric Blend 180g - Organic Health Supplement with Nutrition Facts and Benefits" 
                  title="Agriko 5-in-1 Nutrition Facts - 180g"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image 
                  src={`/images/agriko-pure-salabat-ginger-tea-100g.jpg?v=${Date.now()}`} 
                  alt="Agriko Pure Salabat 100g - Traditional Filipino Ginger Tea with Natural Healing Properties" 
                  title="Agriko Pure Salabat - Traditional Ginger Tea"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image 
                  src={`/images/agriko-pure-organic-honey-jar.jpg?v=${Date.now()}`} 
                  alt="Agriko Pure Organic Honey - Raw Natural Honey from Philippine Organic Farms with Health Benefits" 
                  title="Agriko Pure Organic Honey - Raw Natural"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/#latest-products" className="bg-neutral-900 text-white px-8 py-4 rounded-lg text-button-large hover:bg-neutral-800 transition-all duration-300 transform hover:scale-105 text-center">
                Shop Our Products!
              </Link>
              <Link href="/find-us" className="border border-neutral-900 text-neutral-900 px-8 py-4 rounded-lg text-button-large hover:bg-neutral-100 transition-all duration-300 transform hover:scale-105 text-center">
                Find Retailers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}