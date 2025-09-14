'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  children,
  className,
  loading = false,
  disabled,
  fullWidth = false,
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}, ref) => {
  // Base button styles that apply to all variants
  const baseClasses = [
    'inline-flex items-center justify-center font-semibold',
    'transition-all duration-300 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'rounded-xl',
    'relative overflow-hidden',
    // Accessibility improvements
    'focus-visible:ring-2 focus-visible:ring-primary-500',
    // Mobile touch targets
    'touch-manipulation'
  ];

  // Variant styles using design system tokens
  const variantClasses = {
    primary: [
      'bg-gradient-to-r from-primary-600 to-primary-700',
      'hover:from-primary-700 hover:to-primary-800',
      'text-white shadow-lg hover:shadow-xl',
      'focus:ring-primary-500',
      'transform hover:-translate-y-0.5',
      'active:animate-jiggle'
    ],
    secondary: [
      'bg-white border-2 border-primary-600',
      'text-primary-600 hover:bg-primary-50',
      'hover:border-primary-700 hover:text-primary-700',
      'focus:ring-primary-500',
      'shadow-md hover:shadow-lg',
      'transform hover:-translate-y-0.5'
    ],
    tertiary: [
      'bg-neutral-100 text-neutral-700',
      'hover:bg-neutral-200 hover:text-neutral-800',
      'focus:ring-neutral-500',
      'shadow-sm hover:shadow-md'
    ],
    danger: [
      'bg-gradient-to-r from-red-600 to-red-700',
      'hover:from-red-700 hover:to-red-800',
      'text-white shadow-lg hover:shadow-xl',
      'focus:ring-red-500',
      'transform hover:-translate-y-0.5'
    ],
    ghost: [
      'bg-transparent text-neutral-600',
      'hover:bg-neutral-100 hover:text-neutral-700',
      'focus:ring-neutral-500'
    ]
  };

  // Size styles with proper touch targets
  const sizeClasses = {
    sm: ['px-3 py-2 text-sm min-h-[36px] gap-2'],
    md: ['px-4 py-3 text-base min-h-[44px] gap-2'],
    lg: ['px-6 py-4 text-lg min-h-[52px] gap-3'],
    xl: ['px-8 py-5 text-xl min-h-[60px] gap-3']
  };

  // Additional modifiers
  const modifierClasses = [
    fullWidth && 'w-full',
    loading && 'cursor-wait'
  ].filter(Boolean);

  // Combine all classes
  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    ...modifierClasses,
    className
  );

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
      
      {/* Ripple effect for enhanced feedback */}
      {!disabled && !loading && (
        <span className="absolute inset-0 bg-white/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

// Utility function to create button variants with preset props
export const createButtonVariant = (defaultProps: Partial<ButtonProps>) => {
  const ButtonVariant = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <Button ref={ref} {...defaultProps} {...props} />
  ));
  
  ButtonVariant.displayName = 'ButtonVariant';
  
  return ButtonVariant;
};

// Common button variants for consistent usage
export const PrimaryButton = createButtonVariant({ variant: 'primary' });
export const SecondaryButton = createButtonVariant({ variant: 'secondary' });
export const DangerButton = createButtonVariant({ variant: 'danger' });
export const GhostButton = createButtonVariant({ variant: 'ghost' });