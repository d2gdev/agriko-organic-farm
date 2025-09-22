import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';
import ScrollButton from '@/components/ScrollButton';

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
    <section className="relative min-h-[80vh] flex items-center justify-center">
      {/* Background image */}
      <Image
        src="/images/hero.png"
        alt="Hero background"
        fill
        className="object-cover object-center"
        priority
        fetchPriority="high"
      />
      {/* Enhanced gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
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
            <ScrollButton
              targetSelector={primaryButtonHref}
              variant="primary"
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {primaryButtonText}
            </ScrollButton>
            <Link href={secondaryButtonHref}>
              <Button
                variant="ghost"
                size="lg"
                className="!border-2 !border-white !text-white hover:!bg-white hover:!text-red-700 backdrop-blur-sm bg-white/10 transition-all duration-200"
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