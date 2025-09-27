import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const progressSizes = {
  sm: 'h-1',
  default: 'h-2',
  lg: 'h-3'
};

const progressVariants = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  danger: 'bg-red-600'
};

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className = '',
  size = 'default',
  variant = 'default',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizeClasses = progressSizes[size];
  const variantClasses = progressVariants[variant];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-gray-200 ${sizeClasses} ${className}`}
      {...props}
    >
      <div
        className={`h-full transition-all duration-300 ease-in-out ${variantClasses}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};