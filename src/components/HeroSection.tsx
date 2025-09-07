import Link from 'next/link';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  showButtons?: boolean;
}

export default function HeroSection({
  title,
  subtitle,
  description,
  primaryButtonText = "Shop Our Products",
  primaryButtonHref = "#latest-products",
  secondaryButtonText = "View Product Categories",
  secondaryButtonHref = "/categories",
  showButtons = true
}: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary-700 to-primary-900 text-white overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/hero.png')",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat"
        }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
            {title}
            <span className="block text-accent-500">{subtitle}</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-10 max-w-4xl mx-auto leading-relaxed font-light">
            {description}
          </p>
          {showButtons && (
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href={primaryButtonHref}
                className="btn-primary text-lg px-10 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
              >
                {primaryButtonText}
              </a>
              <Link
                href={secondaryButtonHref}
                className="border-2 border-white text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-700 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {secondaryButtonText}
              </Link>
            </div>
          )}
        </div>
      </div>
      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-16 text-cream" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"></path>
        </svg>
      </div>
    </section>
  );
}