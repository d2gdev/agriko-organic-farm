import Link from 'next/link';
import Button from '@/components/Button';
import ScrollButton from '@/components/ScrollButton';
import ClientOnly from '@/components/ClientOnly';

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
  secondaryButtonText = "Learn Our Story",
  secondaryButtonHref = "/about",
  showButtons = true
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated background video with slow zoom */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center animate-slow-zoom"
      >
        <source src="/videos/hero-vid.mp4" type="video/mp4" />
        {/* Fallback image if video doesn't load */}
        Your browser does not support the video tag.
      </video>

      {/* Animated burlap/woven texture overlay for organic warmth */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none mix-blend-soft-light opacity-70 animate-texture-shift"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23D2B48C' fill-opacity='0.8'%3E%3Crect x='0' y='0' width='40' height='3'/%3E%3Crect x='0' y='6' width='40' height='3'/%3E%3Crect x='0' y='12' width='40' height='3'/%3E%3Crect x='0' y='18' width='40' height='3'/%3E%3Crect x='0' y='24' width='40' height='3'/%3E%3Crect x='0' y='30' width='40' height='3'/%3E%3Crect x='0' y='36' width='40' height='3'/%3E%3C/g%3E%3Cg fill='%23BC9A6A' fill-opacity='0.6'%3E%3Crect x='0' y='0' width='3' height='40'/%3E%3Crect x='6' y='0' width='3' height='40'/%3E%3Crect x='12' y='0' width='3' height='40'/%3E%3Crect x='18' y='0' width='3' height='40'/%3E%3Crect x='24' y='0' width='3' height='40'/%3E%3Crect x='30' y='0' width='3' height='40'/%3E%3Crect x='36' y='0' width='3' height='40'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Darker gradient overlay for maximum text readability */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/95 via-black/70 to-black/30 animate-gradient-shift"></div>

      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up">
          {title}
        </h1>
        <p className="text-2xl md:text-3xl lg:text-4xl text-accent-400 mb-6 font-bold animate-fade-in-up animation-delay-200 drop-shadow-lg">
          {subtitle}
        </p>
        <p className="text-lg md:text-xl lg:text-2xl text-white mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
          {description}
        </p>

        {showButtons && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ClientOnly fallback={
              <Button
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 px-8 py-3 font-semibold"
              >
                {primaryButtonText}
              </Button>
            }>
              <ScrollButton
                targetSelector={primaryButtonHref}
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 px-8 py-3 font-semibold"
              >
                {primaryButtonText}
              </ScrollButton>
            </ClientOnly>
            <Link href={secondaryButtonHref}>
              <Button
                variant="ghost"
                size="lg"
                className="!border-2 !border-white !text-white hover:!bg-white hover:!text-green-700 backdrop-blur-sm bg-transparent hover:shadow-xl transition-all duration-300 px-8 py-3 font-semibold"
              >
                {secondaryButtonText}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}