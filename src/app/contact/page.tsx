import HeroSection from '@/components/HeroSection';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

export default function ContactPage() {
  // Organization Schema for Contact Page
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

  // Breadcrumb Schema for Contact Page
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
        "name": "Contact",
        "item": "https://agrikoph.com/contact"
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
      <Breadcrumb items={[{ name: 'Contact' }]} />
      
      <div className="min-h-screen bg-cream">
        <HeroSection 
          title="Agriko"
          subtitle="Contact Us"
          description="Have questions or want to learn more about our organic products? Get in touch with us!"
          showButtons={false}
        />

        <section className="py-16 bg-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-lg p-8 animate-slideInFromLeft animation-delay-100">
                <h2 className="text-heading-2 text-primary-700 mb-6">Get In Touch</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-heading-3 text-gray-900 mb-2">Email</h3>
                    <p className="text-gray-700">agrikoph@gmail.com</p>
                  </div>
                  
                  <div>
                    <h3 className="text-heading-3 text-gray-900 mb-2">Visayas Office</h3>
                    <p className="text-gray-700">GF G&A Arcade, Wilson St., Lahug, Cebu City 6000</p>
                  </div>
                  
                  <div>
                    <h3 className="text-heading-3 text-gray-900 mb-2">Mindanao Farm</h3>
                    <p className="text-gray-700">Paglinawan Organic Eco Farm, Purok 6, Libertad, Dumingag, Zamboanga Del Sur 7028</p>
                  </div>
                  
                  <div>
                    <h3 className="text-heading-3 text-gray-900 mb-2">Follow Us</h3>
                    <div className="flex space-x-4">
                      <Link 
                        href="https://www.facebook.com/AgrikoPH/" 
                        target="_blank"
                        className="text-primary-700 hover:text-primary-900 transition-colors"
                      >
                        Facebook
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-xl shadow-lg p-8 animate-slideInFromRight animation-delay-200">
                <h2 className="text-heading-2 text-primary-700 mb-6">Send us a Message</h2>
                
                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-primary-300 focus:scale-105"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-primary-300 focus:scale-105"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-primary-300 focus:scale-105"
                      placeholder="Your message..."
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-primary-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-800 transition-all duration-300 transform hover:scale-105 active:animate-jiggle hover:animate-glow"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const metadata = {
  title: 'Contact Us - Agriko Organic Farm',
  description: 'Contact Agriko Organic Farm for inquiries about our premium organic rice varieties, herbal powders, and health blends.',
};