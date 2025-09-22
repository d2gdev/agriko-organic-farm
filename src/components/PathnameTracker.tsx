'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function PathnameTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-pathname', pathname);
    }
  }, [pathname]);

  return null;
}