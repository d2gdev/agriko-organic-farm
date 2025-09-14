'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Floating action button with micro-interactions
interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  position?: 'bottom-right' | 'bottom-left';
  color?: 'primary' | 'secondary';
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  color = 'primary',
  className
}: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  const colorClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-neutral-800 hover:bg-neutral-900 text-white'
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-40 w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-out',
        'flex items-center justify-center group hover:shadow-xl',
        'transform hover:scale-105 active:scale-95',
        positionClasses[position],
        colorClasses[color],
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0',
        className
      )}
      aria-label={label}
      style={{
        willChange: 'transform, opacity'
      }}
    >
      <div className="transform transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-neutral-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {label}
      </div>
    </button>
  );
}

// Pulse animation component
interface PulseProps {
  children: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export function Pulse({ 
  children, 
  color = 'primary-500', 
  size = 'md',
  speed = 'normal',
  className 
}: PulseProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  };

  const speedClasses = {
    slow: 'animate-pulse-slow',
    normal: 'animate-pulse',
    fast: 'animate-pulse-fast'
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      <div className={cn(
        'absolute inset-0 rounded-full',
        `bg-${color}`,
        sizeClasses[size],
        speedClasses[speed],
        'opacity-20'
      )} />
    </div>
  );
}

// Shimmer loading effect
interface ShimmerProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export function Shimmer({ 
  className, 
  width = 'w-full', 
  height = 'h-4',
  rounded = true 
}: ShimmerProps) {
  return (
    <div 
      className={cn(
        'animate-shimmer bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]',
        width,
        height,
        rounded && 'rounded-md',
        className
      )}
    />
  );
}

// Interactive card hover effects
interface InteractiveCardProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  hoverEffect?: 'lift' | 'glow' | 'border' | 'scale';
}

export function InteractiveCard({
  children,
  href,
  onClick,
  className,
  hoverEffect = 'lift'
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const effectClasses = {
    lift: 'hover:-translate-y-1 hover:shadow-xl',
    glow: 'hover:shadow-lg hover:shadow-primary-500/20',
    border: 'hover:border-primary-300',
    scale: 'hover:scale-105'
  };

  const Component = href ? 'a' : 'div';

  return (
    <Component
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'transition-all duration-300 ease-out cursor-pointer',
        effectClasses[hoverEffect],
        className
      )}
      style={{
        willChange: 'transform, box-shadow'
      }}
    >
      {children}
    </Component>
  );
}

// Ripple effect component
interface RippleProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}

export function Ripple({ 
  children, 
  color = 'rgba(255, 255, 255, 0.6)',
  duration = 600,
  className 
}: RippleProps) {
  const [ripples, setRipples] = useState<Array<{
    x: number;
    y: number;
    size: number;
    id: string;
  }>>([]);

  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const id = Date.now().toString();

    setRipples(prev => [...prev, { x, y, size, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, duration);
  };

  return (
    <div 
      className={cn('relative overflow-hidden', className)}
      onClick={addRipple}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`
          }}
        />
      ))}
    </div>
  );
}

// Toast notification with animations
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose,
  duration = 3000 
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, duration, onClose]);

  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'i'
  };

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ease-out',
      'flex items-center space-x-2 max-w-sm',
      typeClasses[type],
      isVisible 
        ? 'translate-x-0 opacity-100' 
        : 'translate-x-full opacity-0'
    )}>
      <span className="font-bold">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white transition-colors"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

// Loading dots animation
interface LoadingDotsProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingDots({ 
  color = 'primary-600', 
  size = 'md',
  className 
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-bounce',
            `bg-${color}`,
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
}

// Progress bar with smooth animations
interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: string;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  color = 'primary-600',
  height = 'h-2',
  showLabel = false,
  animated = true,
  className
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
    return undefined;
  }, [progress, animated]);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-neutral-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(displayProgress)}%</span>
        </div>
      )}
      <div className={cn('bg-neutral-200 rounded-full overflow-hidden', height)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            `bg-${color}`
          )}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  );
}