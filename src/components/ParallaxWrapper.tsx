'use client';

import { useEffect, useRef, useState } from 'react';

interface ParallaxWrapperProps {
  children: React.ReactNode;
  speed?: number; // Parallax speed multiplier (0.1 to 1.0)
  className?: string;
  offset?: number; // Offset from top before parallax starts
}

export default function ParallaxWrapper({ 
  children, 
  speed = 0.5, 
  className = '',
  offset = 0 
}: ParallaxWrapperProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;
      const elementTop = rect.top + scrolled;

      // Only apply parallax when element is in viewport
      if (scrolled + windowHeight > elementTop - offset && scrolled < elementTop + rect.height + offset) {
        const yPos = -(scrolled - elementTop) * speed;
        setTranslateY(yPos);
      }
    };

    // Initial calculation
    handleScroll();

    // Throttled scroll listener for performance
    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScrollHandler);
      window.removeEventListener('resize', handleScroll);
    };
  }, [speed, offset]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        transform: `translate3d(0, ${translateY}px, 0)`,
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
}