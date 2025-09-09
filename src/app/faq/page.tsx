import HeroSection from '@/components/HeroSection';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions - Agriko Organic Farm',
  description: 'Find answers to common questions about Agriko organic products, health benefits, shipping, and our farming practices.',
  keywords: 'agriko faq, organic rice questions, turmeric benefits, health supplements, organic farming',
};

export default function FAQPage() {
  // Enhanced FAQ Schema with comprehensive Q&A
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://shop.agrikoph.com/faq#faqpage",
    "name": "Frequently Asked Questions - Agriko Organic Farm",
    "description": "Comprehensive answers to common questions about Agriko's organic products, health benefits, shipping, and farming practices",
    "url": "https://shop.agrikoph.com/faq",
    "inLanguage": "en-PH",
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
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
        "name": "FAQ",
        "item": "https://shop.agrikoph.com/faq"
      }
    ]
  };

  // FAQ WebPage Schema
  const faqWebPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://shop.agrikoph.com/faq#webpage",
    "name": "FAQ - Agriko Organic Farm",
    "description": "Find answers to common questions about Agriko organic products, health benefits, shipping, and our farming practices.",
    "url": "https://shop.agrikoph.com/faq",
    "inLanguage": "en-PH",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Agriko Organic Farm",
      "url": "https://shop.agrikoph.com"
    },
    "about": {
      "@type": "Organization",
      "name": "Agriko Organic Farm"
    },
    "mainEntity": {
      "@type": "FAQPage",
      "@id": "https://shop.agrikoph.com/faq#faqpage"
    }
  };

  const faqs = [
    {
      question: "What makes Agriko's rice premium quality?",
      answer: "Our organic rice varieties - Black, Brown, Red, and White - are cultivated in nutrient-rich, pesticide-free soils using traditional farming methods passed down through generations. We ensure superior taste, nutrition, and purity through careful harvesting and processing."
    },
    {
      question: "What herbal powders does Agriko offer?",
      answer: "We offer premium Dulaw (Turmeric), Salabat (Ginger), and Moringa powders - pure, nutrient-dense superfoods with powerful health benefits. All are organically grown and processed without artificial additives or preservatives."
    },
    {
      question: "What health blends and products are available?",
      answer: "We provide unique 5-in-1 Turmeric Tea Blend, pure organic honey, and specialized products like Agribata Kids Cereal for complete wellness. Our signature 5-in-1 blend contains turmeric, ginger, soursop, moringa, brown sugar, and lemongrass."
    },
    {
      question: "What are the health benefits of your 5-in-1 Turmeric Blend?",
      answer: "Our 5-in-1 blend supports joint health (turmeric), aids digestion (ginger), provides antioxidants (soursop), helps manage blood sugar and cholesterol (moringa), supplies minerals (brown sugar), and relieves headaches and indigestion (lemongrass)."
    },
    {
      question: "Where can I buy Agriko products?",
      answer: "Agriko products are available at major supermarkets across the Philippines including Metro, Gaisano Grand, and PureGold locations. You can also order online through our website with delivery to your doorstep."
    },
    {
      question: "Do you ship nationwide in the Philippines?",
      answer: "Yes, we ship nationwide across the Philippines. Shipping costs vary by location, with free shipping available for orders above a minimum amount. Standard delivery takes 3-7 business days depending on your location."
    },
    {
      question: "Are your products certified organic?",
      answer: "Yes, all our products are grown using organic farming practices without synthetic pesticides, herbicides, or artificial fertilizers. Our farm follows sustainable agriculture methods and maintains proper organic certification standards."
    },
    {
      question: "How should I store Agriko products?",
      answer: "Store rice varieties in a cool, dry place in airtight containers. Herbal powders should be kept in sealed containers away from moisture and direct sunlight. Our honey should be stored at room temperature and may crystallize naturally over time."
    },
    {
      question: "What is the shelf life of your products?",
      answer: "Our organic rice varieties have a shelf life of 12-18 months when stored properly. Herbal powders maintain potency for 24 months, and our pure honey has an indefinite shelf life when stored correctly. All products display best-by dates on packaging."
    },
    {
      question: "Can I visit your farm in Dumingag, Zamboanga Del Sur?",
      answer: "Yes! Farm visits are welcome by appointment. Contact us at agrikoph@gmail.com to arrange a tour of Paglinawan Organic Eco Farm where you can see our sustainable farming practices firsthand and meet founder Gerry Paglinawan."
    }
  ];

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqSchema, breadcrumbSchema, faqWebPageSchema])
        }}
      />
      
      <HeroSection 
        title="Agriko"
        subtitle="Frequently Asked Questions"
        description="Find answers to common questions about our organic products, health benefits, farming practices, and more."
        showButtons={false}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-heading-1 text-neutral-900 mb-6">
            Your Questions Answered
          </h2>
          <p className="text-body-large text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Get quick answers to common questions about <Link href="/" className="text-primary-700 hover:text-primary-800 underline">Agriko organic products</Link>, health benefits, and <Link href="/about" className="text-primary-700 hover:text-primary-800 underline">our farming practices</Link>. Can&apos;t find what you&apos;re looking for? <Link href="/find-us" className="text-primary-700 hover:text-primary-800 underline">Contact us directly</Link>.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details key={index} className="group bg-white rounded-lg shadow-sm border border-neutral-200">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-50 transition-colors">
                <h3 className="text-heading-4 text-neutral-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  <ChevronDownIcon className="w-5 h-5 text-neutral-500 group-open:hidden" />
                  <ChevronUpIcon className="w-5 h-5 text-neutral-500 hidden group-open:block" />
                </div>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-neutral-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center bg-primary-50 rounded-xl p-8">
          <h3 className="text-heading-2 text-primary-900 mb-4">
            Still Have Questions?
          </h3>
          <p className="text-neutral-700 mb-6">
            Can&apos;t find the answer you&apos;re looking for? Our friendly team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:agrikoph@gmail.com"
              className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors"
            >
              Email Us
            </a>
            <a
              href="/find-us"
              className="border border-primary-700 text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Visit Our Locations
            </a>
          </div>
        </div>
      </div>
    </>
  );
}