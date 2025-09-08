import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Successful - Agriko',
  description: 'Your order has been placed successfully. Thank you for choosing Agriko organic products.',
  robots: 'noindex, nofollow',
};

export default function SuccessPage() {
  return (
    <>
      <HeroSection 
        title="Agriko"
        subtitle="Order Successful!"
        description="Thank you for your order! We've received your order and will begin processing it shortly."
        showButtons={false}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-heading-1 text-green-800">Order Confirmed!</h1>
              <p className="text-green-700 mt-1">
                Thank you for your order. We&apos;ve received your order and will begin processing it shortly.
              </p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-heading-2 text-gray-900 mb-4">What happens next?</h2>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 font-semibold text-sm">1</span>
              </div>
              <p>We&apos;ll send you an order confirmation email with your order details.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 font-semibold text-sm">2</span>
              </div>
              <p>Your organic products will be carefully prepared and packaged.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 font-semibold text-sm">3</span>
              </div>
              <p>We&apos;ll notify you when your order is ready for delivery or pickup.</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-heading-3 text-gray-900 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you have any questions about your order, please don&apos;t hesitate to contact us.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Email:</strong> orders@agrikoph.com</p>
            <p><strong>Phone:</strong> (555) 123-4567</p>
            <p><strong>Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
          >
            Continue Shopping
          </Link>
          <Link
            href="/about"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Learn About Our Farm
          </Link>
          <Link
            href="/contact"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors text-center"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </>
  );
}