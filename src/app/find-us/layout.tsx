import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Us - Agriko Organic Farm',
  description: 'Find Agriko organic products at Metro, Gaisano Grand, and PureGold supermarkets across the Philippines. Available in 50+ stores nationwide.',
  keywords: 'Agriko store locator, find Agriko products, Metro supermarket, Gaisano Grand, PureGold, organic products Philippines, Agriko retailers',
  openGraph: {
    title: 'Find Agriko Products Near You',
    description: 'Discover Agriko organic products at 50+ supermarkets nationwide. Fresh organic wellness, just around the corner.',
    type: 'website',
    url: 'https://shop.agrikoph.com/find-us',
    images: [
      {
        url: '/images/og-find-us.jpg',
        width: 1200,
        height: 630,
        alt: 'Find Agriko Products - Store Locator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Agriko Products Near You',
    description: 'Discover Agriko organic products at 50+ supermarkets nationwide.',
    images: ['/images/og-find-us.jpg'],
  },
};

export default function FindUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}