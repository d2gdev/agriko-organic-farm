import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Agriko Organic Farm',
  description: 'The page you are looking for could not be found. Browse our organic rice varieties and health products.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-primary-700 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-neutral-900 mb-6">Page Not Found</h2>
        <p className="text-neutral-600 mb-8 leading-relaxed">
          The page you are looking for might have been moved, deleted, or does not exist.
        </p>
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors"
          >
            Go Home
          </Link>
          <div className="text-sm">
            <Link 
              href="/products"
              className="text-primary-700 hover:text-primary-800 mx-2"
            >
              Browse Products
            </Link>
            ·
            <Link 
              href="/about"
              className="text-primary-700 hover:text-primary-800 mx-2"
            >
              About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}