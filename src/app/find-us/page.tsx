import Image from 'next/image';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';

export default function FindUsPage() {
  // Organization Schema for Find Us Page
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "name": "Agriko Organic Farm",
    "alternateName": "Agriko Multi-Trade & Enterprise Corp.",
    "description": "Sustainably grown organic rice varieties, pure herbal powders, and health blends cultivated with care from our family farm.",
    "url": "https://agrikoph.com",
    "logo": "https://agrikoph.com/images/Agriko-Logo.png",
    "founder": {
      "@type": "Person",
      "name": "Gerry Paglinawan"
    },
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": "GF G&A Arcade, Wilson St., Lahug",
        "addressLocality": "Cebu City",
        "addressRegion": "Visayas",
        "postalCode": "6000",
        "addressCountry": "PH"
      },
      {
        "@type": "PostalAddress",
        "streetAddress": "Paglinawan Organic Eco Farm, Purok 6, Libertad",
        "addressLocality": "Dumingag",
        "addressRegion": "Zamboanga Del Sur",
        "postalCode": "7028",
        "addressCountry": "PH"
      }
    ],
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

  // Breadcrumb Schema for Find Us Page
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
        "name": "Find Us",
        "item": "https://agrikoph.com/find-us"
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
      
      <HeroSection 
        title="Agriko"
        subtitle="Find Us"
        description="We are available Online or in Supermarket and Groceries store near you! Discover our premium organic products at your nearest retail location. Learn more about our story and products on our About page."
        showButtons={false}
      />

      {/* Partners Section */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            
            {/* Metro Gaisano Supermarkets */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Logo Container */}
              <div className="bg-gray-50 p-8 pt-12 flex items-center justify-center h-48">
                <div className="flex items-center justify-center w-full h-full">
                  <Image
                    src="/images/metro1.jpeg"
                    alt="Metro Supermarket"
                    width={200}
                    height={128}
                    className="object-contain max-h-32"
                  />
                </div>
              </div>
              
              {/* Text Content Container */}
              <div className="p-8">
                <div className="text-left space-y-2">
                  <h4 className="text-heading-4 text-primary-700 mb-2">Luzon</h4>
                  <p className="text-sm text-neutral-600">Metro Market! Market!</p>
                  <p className="text-sm text-neutral-600">Metro Alabang</p>
                  <p className="text-sm text-neutral-600">Metro Binondo/Metro Imus</p>
                  <p className="text-sm text-neutral-600">Metro Newport Plaza 66 (Pasay)</p>
                  <p className="text-sm text-neutral-600">Metro Lawton</p>
                  <p className="text-sm text-neutral-600">Metro Mandaluyong</p>
                  
                  <h4 className="text-heading-4 text-primary-700 mb-2 mt-4">Visayas</h4>
                  <p className="text-sm text-neutral-600">Metro Colon</p>
                  <p className="text-sm text-neutral-600">Metro Plaza Store (Toledo)</p>
                  <p className="text-sm text-neutral-600">Metro Naga</p>
                  <p className="text-sm text-neutral-600">Metro Danao</p>
                  <p className="text-sm text-neutral-600">Metro Bacolod</p>
                  <p className="text-sm text-neutral-600">Metro Ayala</p>
                  <p className="text-sm text-neutral-600">Metro Carmen (Fresh N&#39; Easy Carmen)</p>
                  <p className="text-sm text-neutral-600">Metro Banilad (Fresh N&#39; Easy Banilad)</p>
                  <p className="text-sm text-neutral-600">Metro IT Park</p>
                  <p className="text-sm text-neutral-600">Metro Canduman</p>
                  <p className="text-sm text-neutral-600">Metro Banawa</p>
                  <p className="text-sm text-neutral-600">Metro Wholesalemart (Oriente)</p>
                  <p className="text-sm text-neutral-600">Metro Fresh n Easy (Shangtl)</p>
                  <p className="text-sm text-neutral-600">Metro Negros</p>
                  <p className="text-sm text-neutral-600">Metro Mambaling</p>
                  <p className="text-sm text-neutral-600">Metro Bogo</p>
                  
                  <div className="mt-4 pt-2 border-t">
                    <p className="text-sm text-neutral-600">Super Metro Lapu Lapu</p>
                    <p className="text-sm text-neutral-600">Super Metro Mandaue</p>
                    <p className="text-sm text-neutral-600">Super Metro Colon (Metro Parking)</p>
                    <p className="text-sm text-neutral-600">Super Metro Car Car</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gaisano Grand Supermarket */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Logo Container */}
              <div className="bg-gray-50 p-8 pt-12 flex items-center justify-center h-48">
                <div className="flex items-center justify-center w-full h-full">
                  <Image
                    src="/images/gaisano-grand-mall-partner-logo.png"
                    alt="Gaisano Grand Mall Partner Logo - Authorized Retailer of Agriko Organic Farm Products Across Philippines"
                    title="Gaisano Grand Mall - Agriko Partner"
                    width={200}
                    height={128}
                    className="object-contain max-h-32"
                  />
                </div>
              </div>
              
              {/* Text Content Container */}
              <div className="p-8">
                <div className="text-left space-y-2">
                  <h4 className="text-heading-4 text-primary-700 mb-2">Visayas</h4>
                  <p className="text-sm text-neutral-600">Gaisano Grand Cordova SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand North Mandaue SP</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Mactan SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Talamban SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Tabunok SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Liloan SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Toledo SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Plaza SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Gingoog</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Minglanilla</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Car Car</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Balamban</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Moalboal</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Dumaguete</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Oslob</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Mandaue Centro</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Jalalai</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Express</p>
                  
                  <h4 className="text-heading-4 text-primary-700 mb-2 mt-4">Mindanao</h4>
                  <p className="text-sm text-neutral-600">Gaisano Market Place SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Mall of Estancia</p>
                  <p className="text-sm text-neutral-600">Gaisano City Roxas SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Sara SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Buhangin SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano South Cotabato SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Tibungco SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Gingoog SPMT</p>
                  <p className="text-sm text-neutral-600">Gaisano Grand Ipil SPMT</p>
                </div>
              </div>
            </div>

            {/* PureGold Supermarket */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Logo Container */}
              <div className="bg-gray-50 p-8 pt-12 flex items-center justify-center h-48">
                <div className="flex items-center justify-center w-full h-full">
                  <Image
                    src="/images/puregold-supermarket-partner-logo.png"
                    alt="PureGold Supermarket Partner Logo - Official Retailer of Agriko Organic Products in Visayas Region"
                    title="PureGold Supermarket - Agriko Partner"
                    width={200}
                    height={128}
                    className="object-contain max-h-32"
                  />
                </div>
              </div>
              
              {/* Text Content Container */}
              <div className="p-8">
                <div className="text-left space-y-2">
                  <h4 className="text-heading-4 text-primary-700 mb-2">Visayas</h4>
                  <p className="text-sm text-neutral-600">PureGold Talisay Cebu</p>
                  <p className="text-sm text-neutral-600">PureGold Kasambagan</p>
                  <p className="text-sm text-neutral-600">PureGold Consolacion</p>
                  <p className="text-sm text-neutral-600">PureGold Mango Ave.</p>
                  <p className="text-sm text-neutral-600">PureGold Guadalupe</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="relative bg-primary-700 text-white rounded-xl p-8 text-center overflow-hidden">
            <Image
              src="/images/gerry-paglinawan-family-agriko-founders.jpg"
              alt="Gerry Paglinawan Family - Agriko Organic Farm Founders and Owners, Pioneering Organic Agriculture in Philippines"
              title="Paglinawan Family - Agriko Founders"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-primary-700/80" />
            <div className="relative z-10">
              <h2 className="text-heading-2 mb-6">
                Prevention is better than cure!
              </h2>
              <p className="text-lg mb-6">
                Take a look at <Link href="/" className="text-accent-400 hover:text-accent-300 underline">how our products</Link> can help you. <Link href="/faq" className="text-accent-400 hover:text-accent-300 underline">Learn about health benefits</Link> and <Link href="/about" className="text-accent-400 hover:text-accent-300 underline">our organic farming story</Link>.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 text-left">
              <div>
                <h3 className="text-heading-3 mb-2">Phone Number:</h3>
                <p className="mb-4">agrikoph@gmail.com</p>
                
                <h3 className="text-heading-3 mb-2">Email:</h3>
                <p className="mb-4">agrikoph@gmail.com</p>
                
                <h3 className="text-heading-3 mb-2">Visayas Address:</h3>
                <p>GF G&A Arcade, Wilson St., Lahug, Cebu City 6000</p>
              </div>
              <div>
                <h3 className="text-heading-3 mb-2">Mindanao Address:</h3>
                <p className="mb-4">Paglinawan Organic Eco Farm, Purok 6, Libertad, Dumingag, Zamboanga Del Sur 7028</p>
                
                <Link 
                  href="/contact"
                  className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-accent-50 transition-colors mt-4"
                >
                  LEARN MORE
                </Link>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export const metadata = {
  title: 'Find Us - Agriko Organic Farm',
  description: 'Find Agriko organic products at Metro, Gaisano Grand, and PureGold supermarkets across the Philippines.',
};