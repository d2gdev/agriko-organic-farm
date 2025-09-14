import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Agriko Organic Farm',
  description: 'Contact Agriko Organic Farm for inquiries about our premium organic rice varieties, herbal powders, and health blends. Visit our farm or reach us via email.',
  keywords: 'contact agriko, agriko farm visit, organic farm philippines, agriko office cebu, paglinawan eco farm',
  openGraph: {
    title: 'Contact Agriko Organic Farm',
    description: 'Get in touch with Agriko for questions about our organic products, farm visits, or partnership opportunities.',
    type: 'website',
    url: 'https://shop.agrikoph.com/contact',
    images: [
      {
        url: '/images/og-contact.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Agriko Organic Farm',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Agriko Organic Farm',
    description: 'Get in touch with Agriko for organic products and farm visits.',
    images: ['/images/og-contact.jpg'],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}