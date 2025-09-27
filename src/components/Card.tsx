'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  size = 'md',
  children,
  className,
  hover = false,
  clickable = false,
  ...props
}, ref) => {
  // Base card styles using design system tokens
  const baseClasses = [
    'rounded-xl transition-all duration-300 ease-out',
    'bg-white border',
    // Using design system border radius
    'overflow-hidden'
  ];

  // Variant styles
  const variantClasses = {
    default: [
      'border-neutral-200 shadow-sm',
      hover && 'hover:shadow-md'
    ].filter(Boolean),
    elevated: [
      'border-neutral-100 shadow-lg',
      hover && 'hover:shadow-xl'
    ].filter(Boolean),
    outlined: [
      'border-neutral-300 shadow-none',
      hover && 'hover:border-primary-300 hover:shadow-sm'
    ].filter(Boolean),
    interactive: [
      'border-neutral-200 shadow-sm',
      'hover:shadow-xl hover:border-primary-200 hover:-translate-y-1',
      'cursor-pointer',
      clickable && 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
    ].filter(Boolean)
  };

  // Size-based padding using design tokens
  const sizeClasses = {
    sm: 'p-4',      // --space-md
    md: 'p-6',      // --space-xl  
    lg: 'p-8'       // --space-2xl
  };

  // Additional interaction states
  const interactionClasses = [
    clickable && 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    clickable && 'active:scale-98 active:shadow-md'
  ].filter(Boolean);

  const cardClasses = cn(
    baseClasses,
    ...variantClasses[variant],
    sizeClasses[size],
    ...interactionClasses,
    className
  );

  // const _Component = clickable ? 'button' : 'div';

  if (clickable) {
    return (
      <div
        ref={ref}
        className={cardClasses}
        role="button"
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cardClasses}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card sub-components for consistent structure
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = ({ children, className }: CardHeaderProps) => (
  <div className={cn('flex flex-col space-y-2 mb-6', className)}>
    {children}
  </div>
);

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = ({ children, className, as: Component = 'h3' }: CardTitleProps) => (
  <Component className={cn('text-lg font-semibold text-neutral-900 leading-tight', className)}>
    {children}
  </Component>
);

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const CardDescription = ({ children, className }: CardDescriptionProps) => (
  <p className={cn('text-neutral-600 text-sm leading-relaxed', className)}>
    {children}
  </p>
);

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className }: CardContentProps) => (
  <div className={cn('flex-1', className)}>
    {children}
  </div>
);

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={cn('flex items-center justify-between mt-6 pt-4 border-t border-neutral-100', className)}>
    {children}
  </div>
);

// Specialized card variants for common use cases
export const ProductCard = forwardRef<HTMLDivElement, CardProps>((props, ref) => (
  <Card ref={ref} variant="interactive" hover {...props} />
));

export const FeatureCard = forwardRef<HTMLDivElement, CardProps>((props, ref) => (
  <Card ref={ref} variant="elevated" size="lg" hover {...props} />
));

export const InfoCard = forwardRef<HTMLDivElement, CardProps>((props, ref) => (
  <Card ref={ref} variant="outlined" hover {...props} />
));

ProductCard.displayName = 'ProductCard';
FeatureCard.displayName = 'FeatureCard';
InfoCard.displayName = 'InfoCard';

export default Card;