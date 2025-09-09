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
        src={`/images/hero.png?v=${Date.now()}`}
        alt="Hero background"
        fill
        className="object-cover object-center"
        priority
      />
      {/* Black 70% overlay */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-accent-400 mb-4">
          {subtitle}
        </p>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          {description}
        </p>

        {showButtons && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ScrollButton
              targetSelector={primaryButtonHref}
              variant="primary"
              size="lg"
              className="bg-accent-500 hover:bg-accent-600 text-white"
            >
              {primaryButtonText}
            </ScrollButton>
            <Link href={secondaryButtonHref}>
              <Button
                variant="secondary"
                size="lg"
                className="bg-transparent hover:bg-white/10 text-white border-2 border-white/50 hover:border-white/70"
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