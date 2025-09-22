'use client';

import { useState, useEffect } from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * HydrationBoundary component to prevent hydration mismatches
 * Ensures children only render after client-side hydration is complete
 */
export default function HydrationBoundary({
  children,
  fallback = null,
  className = ''
}: HydrationBoundaryProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
}

// Export a hook version for convenience
export function useHydrationSafe() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}