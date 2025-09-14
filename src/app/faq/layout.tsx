import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions - Agriko Organic Farm',
  description: 'Find answers to common questions about Agriko organic products, health benefits, shipping, and our farming practices.',
  keywords: 'agriko faq, organic rice questions, turmeric benefits, health supplements, organic farming, farm visits, product storage',
  openGraph: {
    title: 'FAQ - Agriko Organic Farm',
    description: 'Everything you need to know about Agriko organic products, health benefits, and farming practices.',
    type: 'website',
    url: 'https://shop.agrikoph.com/faq',
    images: [
      {
        url: '/images/og-faq.jpg',
        width: 1200,
        height: 630,
        alt: 'Agriko FAQ - Your Questions Answered',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ - Agriko Organic Farm',
    description: 'Everything you need to know about Agriko organic products and farming practices.',
    images: ['/images/og-faq.jpg'],
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}