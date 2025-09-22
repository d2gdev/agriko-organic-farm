'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  // Don't render footer on admin pages
  if (isAdminPage) {
    return null;
  }

  return (
    <footer
      id="site-footer"
      role="contentinfo"
      aria-label="Site footer"
    >
      <Footer />
    </footer>
  );
}