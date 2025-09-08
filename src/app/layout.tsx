import type { Metadata } from 'next';
import { Inter, Crimson_Pro } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import NavbarWrapper from '@/components/NavbarWrapper';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import { SkipLinks } from '@/components/SkipLink';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const crimsonPro = Crimson_Pro({ 
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://shop.agrikoph.com'),
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
    url: 'https://shop.agrikoph.com',
    siteName: 'Agriko',
    title: 'Agriko Organic Farm - Premium Rice & Health Products',
    description: 'Premium organic rice varieties, pure herbal powders, and health blends from our sustainable family farm.',
    images: [
      {
        url: '/images/og-image.jpg',
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
    images: ['/images/og-image.jpg'],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://agrikoph.com" />
        <link rel="dns-prefetch" href="https://agrikoph.com" />
      </head>
      <body className={`${inter.variable} ${crimsonPro.variable} font-sans min-h-screen flex flex-col bg-cream`}>
        {/* Skip links for screen reader navigation */}
        <SkipLinks />
        
        <CartProvider>
          {/* Site navigation */}
          <header 
            id="site-navigation"
            role="banner" 
            aria-label="Site navigation"
          >
            <NavbarWrapper />
          </header>
          
          {/* Main content area */}
          <main 
            id="main-content"
            role="main" 
            className="flex-1 pt-16"
            aria-label="Main content"
          >
            {children}
          </main>
          
          {/* Site footer */}
          <footer 
            id="site-footer"
            role="contentinfo" 
            aria-label="Site footer"
          >
            <Footer />
          </footer>
          
          {/* Shopping cart overlay */}
          <aside 
            role="complementary" 
            aria-label="Shopping cart"
          >
            <CartDrawer />
          </aside>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #d1d5db',
              },
              success: {
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}