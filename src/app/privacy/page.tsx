import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Agriko Organic Farm',
  description: 'Privacy policy for Agriko Organic Farm - how we collect, use and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-primary-800 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-neutral-600 mb-6">
              <strong>Last updated:</strong> March 15, 2024
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">1. Information We Collect</h2>
              <p className="text-neutral-700 mb-4">
                At Agriko Organic Farm, we collect information you provide directly to us, such as when you:
              </p>
              <ul className="list-disc list-inside text-neutral-700 mb-4 space-y-2">
                <li>Create an account or make a purchase</li>
                <li>Subscribe to our newsletter</li>
                <li>Contact us for customer support</li>
                <li>Participate in surveys or promotions</li>
              </ul>
              <p className="text-neutral-700">
                This information may include your name, email address, postal address, phone number, and payment information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">2. How We Use Your Information</h2>
              <p className="text-neutral-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-neutral-700 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Provide customer service and support</li>
                <li>Improve our products and services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">3. Information Sharing</h2>
              <p className="text-neutral-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to outside parties except:
              </p>
              <ul className="list-disc list-inside text-neutral-700 space-y-2">
                <li>To trusted third parties who assist us in operating our website and conducting business</li>
                <li>When we believe disclosure is appropriate to comply with law or protect our rights</li>
                <li>With your consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">4. Data Security</h2>
              <p className="text-neutral-700">
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic 
                storage is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">5. Cookies</h2>
              <p className="text-neutral-700">
                We use cookies to enhance your experience on our website. You can choose to disable cookies through your 
                browser settings, but this may affect some functionality of our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">6. Your Rights</h2>
              <p className="text-neutral-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-neutral-700 space-y-2">
                <li>Access, update, or delete your personal information</li>
                <li>Opt-out of marketing communications</li>
                <li>Request information about how we use your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">7. Contact Us</h2>
              <p className="text-neutral-700">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-accent-50 rounded-lg">
                <p className="text-neutral-700">
                  <strong>Email:</strong> agrikoph@gmail.com<br/>
                  <strong>Address:</strong> GF G&A Arcade, Wilson St., Lahug, Cebu City 6000<br/>
                  <strong>Facebook:</strong> <a href="URL_CONSTANTS.SOCIAL.FACEBOOK" className="text-primary-600 hover:text-primary-700">facebook.com/AgrikoPH</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary-700 mb-4">8. Changes to This Policy</h2>
              <p className="text-neutral-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}