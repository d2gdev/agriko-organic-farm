'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin') ?? false;

  return (
    <footer
      id="site-footer"
      role="contentinfo"
      aria-label="Site footer"
      style={{ display: isAdminPage ? 'none' : 'block' }}
    >
      <Footer />
    </footer>
  );
}