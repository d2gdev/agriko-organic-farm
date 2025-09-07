import Image from 'next/image';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';

export default function FindUsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <HeroSection 
        title="Agriko"
        subtitle="Find Us"
        description="We are available Online or in Supermarket and Groceries store near you! Discover our premium organic products at your nearest retail location."
        showButtons={false}
      />

      {/* Partners Section */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            
            {/* Metro Gaisano Supermarkets */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mb-8 h-24 flex items-center justify-center">
                <Image
                  src="/metro1.jpeg"
                  alt="Metro Supermarket"
                  width={200}
                  height={80}
                  className="object-contain"
                />
              </div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-4">
                Metro Gaisano Supermarkets
              </h3>
              
              <div className="text-left space-y-2">
                <h4 className="font-semibold text-primary-700 mb-2">Luzon</h4>
                <p className="text-sm text-neutral-600">Metro Market! Market!</p>
                <p className="text-sm text-neutral-600">Metro Alabang</p>
                <p className="text-sm text-neutral-600">Metro Binondo/Metro Imus</p>
                <p className="text-sm text-neutral-600">Metro Newport Plaza 66 (Pasay)</p>
                <p className="text-sm text-neutral-600">Metro Lawton</p>
                <p className="text-sm text-neutral-600">Metro Mandaluyong</p>
                
                <h4 className="font-semibold text-primary-700 mb-2 mt-4">Visayas</h4>
                <p className="text-sm text-neutral-600">Metro Colon</p>
                <p className="text-sm text-neutral-600">Metro Plaza Store (Toledo)</p>
                <p className="text-sm text-neutral-600">Metro Naga</p>
                <p className="text-sm text-neutral-600">Metro Danao</p>
                <p className="text-sm text-neutral-600">Metro Bacolod</p>
                <p className="text-sm text-neutral-600">Metro Ayala</p>
                <p className="text-sm text-neutral-600">Metro Carmen (Fresh N&#39; Easy Carmen)</p>
                <p className="text-sm text-neutral-600">Metro Banilad (Fresh N&#39; Easy Banilad)</p>
                <p className="text-sm text-neutral-600">Metro IT Park</p>
                <p className="text-sm text-neutral-600">Metro Canduman</p>
                <p className="text-sm text-neutral-600">Metro Banawa</p>
                <p className="text-sm text-neutral-600">Metro Wholesalemart (Oriente)</p>
                <p className="text-sm text-neutral-600">Metro Fresh n Easy (Shangtl)</p>
                <p className="text-sm text-neutral-600">Metro Negros</p>
                <p className="text-sm text-neutral-600">Metro Mambaling</p>
                <p className="text-sm text-neutral-600">Metro Bogo</p>
                
                <div className="mt-4 pt-2 border-t">
                  <p className="text-sm text-neutral-600">Super Metro Lapu Lapu</p>
                  <p className="text-sm text-neutral-600">Super Metro Mandaue</p>
                  <p className="text-sm text-neutral-600">Super Metro Colon (Metro Parking)</p>
                  <p className="text-sm text-neutral-600">Super Metro Car Car</p>
                </div>
              </div>
            </div>

            {/* Gaisano Grand Supermarket */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mb-8 h-24 flex items-center justify-center">
                <Image
                  src="/gaisano1.png"
                  alt="Gaisano Grand Malls"
                  width={200}
                  height={80}
                  className="object-contain"
                />
              </div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-4">
                Gaisano Grand Supermarket
              </h3>
              
              <div className="text-left space-y-2">
                <h4 className="font-semibold text-primary-700 mb-2">Visayas</h4>
                <p className="text-sm text-neutral-600">Gaisano Grand Cordova SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand North Mandaue SP</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Mactan SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Talamban SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Tabunok SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Liloan SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Toledo SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Plaza SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Gingoog</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Minglanilla</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Car Car</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Balamban</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Moalboal</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Dumaguete</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Oslob</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Mandaue Centro</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Jalalai</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Express</p>
                
                <h4 className="font-semibold text-primary-700 mb-2 mt-4">Mindanao</h4>
                <p className="text-sm text-neutral-600">Gaisano Market Place SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Mall of Estancia</p>
                <p className="text-sm text-neutral-600">Gaisano City Roxas SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Sara SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Buhangin SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano South Cotabato SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Tibungco SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Gingoog SPMT</p>
                <p className="text-sm text-neutral-600">Gaisano Grand Ipil SPMT</p>
              </div>
            </div>

            {/* PureGold Supermarket */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mb-8 h-24 flex items-center justify-center">
                <Image
                  src="/puregold1.png"
                  alt="PureGold Supermarket"
                  width={200}
                  height={80}
                  className="object-contain"
                />
              </div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-4">
                PureGold Supermarket
              </h3>
              
              <div className="text-left space-y-2">
                <h4 className="font-semibold text-primary-700 mb-2">Visayas</h4>
                <p className="text-sm text-neutral-600">PureGold Talisay Cebu</p>
                <p className="text-sm text-neutral-600">PureGold Kasambagan</p>
                <p className="text-sm text-neutral-600">PureGold Consolacion</p>
                <p className="text-sm text-neutral-600">PureGold Mango Ave.</p>
                <p className="text-sm text-neutral-600">PureGold Guadalupe</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-primary-700 text-white rounded-xl p-8 text-center">
            <h2 className="text-3xl font-serif font-bold mb-6">
              Prevention is better than cure!
            </h2>
            <p className="text-lg mb-6">
              Take a look at how our products can help you.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 text-left">
              <div>
                <h3 className="font-semibold mb-2">Phone Number:</h3>
                <p className="mb-4">agrikoph@gmail.com</p>
                
                <h3 className="font-semibold mb-2">Email:</h3>
                <p className="mb-4">agrikoph@gmail.com</p>
                
                <h3 className="font-semibold mb-2">Visayas Address:</h3>
                <p>GF G&A Arcade, Wilson St., Lahug, Cebu City 6000</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Mindanao Address:</h3>
                <p className="mb-4">Paglinawan Organic Eco Farm, Purok 6, Libertad, Dumingag, Zamboanga Del Sur 7028</p>
                
                <Link 
                  href="/contact"
                  className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-accent-50 transition-colors mt-4"
                >
                  LEARN MORE
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const metadata = {
  title: 'Find Us - Agriko Organic Farm',
  description: 'Find Agriko organic products at Metro, Gaisano Grand, and PureGold supermarkets across the Philippines.',
};