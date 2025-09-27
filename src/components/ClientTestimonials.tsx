'use client';

import dynamic from 'next/dynamic';

const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  ssr: false,
  loading: () => <div className="py-20 bg-neutral-50 animate-pulse" />
});

export default function ClientTestimonials() {
  return <Testimonials />;
}