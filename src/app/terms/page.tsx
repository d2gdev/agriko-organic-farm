import { Metadata } from 'next';
import { URL_CONSTANTS } from '@/lib/url-constants';

export const metadata: Metadata = {
  title: 'Terms of Service - Agriko Organic Farm',
  description: 'Terms of service and conditions for purchasing products from Agriko Organic Farm.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-primary-800 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-neutral-600 mb-6">
              <strong>Last updated:</strong> March 15, 2024
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">1. Acceptance of Terms</h2>
              <p className="text-neutral-700">
                By accessing and using the Agriko Organic Farm website and services, you accept and agree to be bound by 
                the terms and provision of this agreement. These Terms of Service apply to all visitors, users, and others 
                who access or use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">2. Products and Services</h2>
              <p className="text-neutral-700 mb-4">
                Agriko Organic Farm provides organic agricultural products including:
              </p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 space-y-2">
                <li>Organic rice varieties</li>
                <li>Pure herbal powders and blends</li>
                <li>Natural health supplements</li>
                <li>Other organic farm products</li>
              </ul>
              <p className="text-neutral-700">
                All products are cultivated using sustainable organic farming practices and are certified organic.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">3. Orders and Payment</h2>
              <p className="text-neutral-700 mb-4">
                When you place an order, you agree that:
              </p>
              <ul className="list-disc list-inside text-neutral-700 space-y-2">
                <li>All information provided is accurate and complete</li>
                <li>You are authorized to use the payment method provided</li>
                <li>You accept responsibility for all charges incurred</li>
                <li>Prices are subject to change without notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">4. Shipping and Delivery</h2>
              <p className="text-neutral-700 mb-4">
                Our products are available at partner retail locations including:
              </p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 space-y-2">
                <li>Metro Supermarkets nationwide</li>
                <li>Gaisano Grand Malls</li>
                <li>PureGold Supermarkets</li>
              </ul>
              <p className="text-neutral-700">
                Delivery times and availability may vary by location. We are not responsible for delays caused by 
                circumstances beyond our control.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">5. Returns and Refunds</h2>
              <p className="text-neutral-700">
                Due to the nature of our organic food products, we have specific return and refund policies. 
                Products may be returned only if they are defective or damaged upon receipt. Contact us immediately 
                if you receive damaged products.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">6. Product Information and Health Claims</h2>
              <p className="text-neutral-700">
                While we strive for accuracy, product information may contain technical inaccuracies or typographical 
                errors. Health benefits mentioned are based on traditional use and are not intended to diagnose, treat, 
                cure, or prevent any disease. Consult your healthcare provider before use.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">7. Intellectual Property</h2>
              <p className="text-neutral-700">
                All content on this website, including text, graphics, logos, and images, is the property of 
                Agriko Organic Farm and is protected by intellectual property laws. You may not use our content 
                without express written permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">8. Limitation of Liability</h2>
              <p className="text-neutral-700">
                Agriko Organic Farm shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages resulting from your use of our products or services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">9. Governing Law</h2>
              <p className="text-neutral-700">
                These Terms shall be interpreted and governed by the laws of the Republic of the Philippines. 
                Any disputes shall be resolved in the courts of Cebu City, Philippines.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">10. Contact Information</h2>
              <p className="text-neutral-700">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 bg-accent-50 rounded-lg">
                <p className="text-neutral-700">
                  <strong>Email:</strong> jc.paglinawan@agrikoph.com<br/>
                  <strong>Address:</strong> GF G&A Arcade, Wilson St., Lahug, Cebu City 6000<br/>
                  <strong>Farm Address:</strong> Paglinawan Organic Eco Farm, Purok 6, Libertad, Dumingag, Zamboanga Del Sur 7028<br/>
                  <strong>Facebook:</strong> <a href={URL_CONSTANTS.SOCIAL.FACEBOOK} className="text-primary-600 hover:text-primary-700">facebook.com/AgrikoPH</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">11. Changes to Terms</h2>
              <p className="text-neutral-700">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective 
                immediately upon posting. Your continued use of our services constitutes acceptance of modified terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}