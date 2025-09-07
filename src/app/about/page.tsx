import HeroSection from '@/components/HeroSection';
import type { Metadata } from 'next';

export const metadataBase = new URL('https://agrikoph.com');

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
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section with AGRIKO branding */}
      <div className="relative bg-gradient-to-br from-green-600 to-green-800 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ 
            backgroundImage: "url('/hero.png')",
            backgroundAttachment: "fixed"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60" />
        
        {/* Animated AGRIKO Title */}
        <div className="relative z-10 flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            {/* Agriko Logo */}
            <div className="flex justify-center">
              <img 
                src="/Agriko-Logo.png" 
                alt="Agriko - Agriculture Keeps Organic" 
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
            <h2 className="text-4xl font-bold text-primary-700 mb-8 font-serif">COMPANY STORY</h2>
            
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                Lorem ipsum dolor sit amet, consectetur <span className="font-semibold">adipiscing elit</span>, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad <span className="font-semibold">minim veniam</span>, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute <span className="font-semibold">irure dolor</span> in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.
              </p>
              
              <div className="bg-orange-100 p-4 rounded-lg border-l-4 border-orange-500">
                <p className="text-orange-800 font-medium italic">
                  Lorem ipsum dolor sit <span className="font-bold">amet</span>
                </p>
              </div>
              
              <div className="mt-6 mb-3"></div>
              <p className="text-gray-700 leading-relaxed">
                Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt.
              </p>
            </div>

            {/* Values Section */}
            <h2 className="text-4xl font-bold text-primary-700 mb-8 font-serif">VALUES</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-800 font-bold text-lg">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Sustainability</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-800 font-bold text-lg">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">Legacy Beans</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 5 Ingredients & More */}
          <div className="lg:col-span-2">
            <h2 className="text-4xl font-bold text-primary-700 mb-8 font-serif">5n1 INGREDIENTS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="relative space-y-4 p-6 rounded-lg overflow-hidden">
                <div 
                  className="absolute inset-0"
                  style={{ 
                    backgroundImage: "url('/Agriko-Website-Imagery-2.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    backgroundRepeat: "no-repeat",
                    opacity: 0.25
                  }}
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
                <div 
                  className="absolute inset-0"
                  style={{ 
                    backgroundImage: "url('/eco-farm-scaled.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    backgroundRepeat: "no-repeat"
                  }}
                />
                <div className="absolute inset-0 bg-black/75" />
                <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white drop-shadow-lg">Exactly The Journey</h3>
                </div>
                <p className="text-white drop-shadow-md text-sm leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                </div>
              </div>
            </div>

            {/* Blend Section */}
            <div className="relative rounded-lg p-8 text-white mb-12 overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{ 
                  backgroundImage: "url('/blend-bg.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center center",
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "fixed"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/80" />
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="font-bold text-xl" style={{ color: '#68281c' }}>3</span>
                  </div>
                  <h3 className="text-3xl font-bold">BLEND</h3>
                </div>
                <p className="text-white/80 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia.
                </p>
              </div>
            </div>

            {/* Team Section */}
            <h2 className="text-4xl font-bold text-primary-700 mb-8 font-serif">SPOIL YOURSELF WITHOUT FEELING GUILTY</h2>
            <p className="text-gray-700 mb-8">Join the Revolution</p>
            
            {/* Team Photos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src="/5n1-500-for-health-.jpg" 
                  alt="5n1 Health Benefits" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src="/5n1-180-for-Website-P3.jpg" 
                  alt="5n1 Nutrition Facts" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src="/Pure-Salabat-100g-with-Background.jpg" 
                  alt="Pure Salabat Ginger Tea" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src="/Honey-with-Background.jpg" 
                  alt="Pure Honey" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-neutral-900 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-neutral-800 transition-all duration-300 transform hover:scale-105">
                Buy Now!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}