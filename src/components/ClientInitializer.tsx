'use client';

import { useEffect } from 'react';
import setupGlobalErrorHandlers from '@/lib/errorHandler';

export default function ClientInitializer() {
  useEffect(() => {
    // Initialize global error handlers only on the client side
    setupGlobalErrorHandlers();
  }, []);

  return null;
}