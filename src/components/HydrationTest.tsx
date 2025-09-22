'use client';

import { useState, useEffect } from 'react';

export default function HydrationTest() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p>Hydration Test: Server-rendered content (will be replaced after hydration)</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
      <p>Hydration Test: Client-rendered content (hydration successful)</p>
      <p className="mt-2 text-sm">This component confirms that hydration is working correctly.</p>
    </div>
  );
}