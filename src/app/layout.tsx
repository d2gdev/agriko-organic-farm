import type { Metadata } from 'next';
import { Inter, Crimson_Pro } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const crimsonPro = Crimson_Pro({ 
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Agriko Organic Farm - Premium Rice & Health Products',
  description: 'Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm. Black, Brown, Red, White rice, Turmeric, Ginger, Moringa powders.',
  keywords: 'organic rice, black rice, brown rice, turmeric powder, moringa powder, ginger powder, organic honey, health products, sustainable farming',
  authors: [{ name: 'Agriko Team' }],
  creator: 'Agriko',
  publisher: 'Agriko',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://agrikoph.com',
    siteName: 'Agriko',
    title: 'Agriko Organic Farm - Premium Rice & Health Products',
    description: 'Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Agriko - Quality Agricultural Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agriko Organic Farm - Premium Rice & Health Products',
    description: 'Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm.',
    images: ['/og-image.jpg'],
  },
};

export async function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#389d65',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${crimsonPro.variable} font-sans min-h-screen flex flex-col bg-cream`}>
        <CartProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}