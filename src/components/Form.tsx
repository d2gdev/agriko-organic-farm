'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Base input styles
const inputBaseClasses = [
  'block w-full rounded-lg border transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50',
  // Mobile touch target compliance
  'min-h-[44px] px-4 py-3',
  // Design system colors
  'border-neutral-300 bg-white text-neutral-900',
  'hover:border-neutral-400 focus:border-primary-500',
  'placeholder:text-neutral-500'
];

// Input variants
const inputVariants = {
  default: [],
  error: [
    'border-red-500 focus:ring-red-500 focus:border-red-500',
    'bg-red-50'
  ],
  success: [
    'border-green-500 focus:ring-green-500 focus:border-green-500'
  ]
};

// Label component
interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export const Label = ({ children, htmlFor, required, className }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className={cn(
      'block text-sm font-medium text-neutral-700 mb-2',
      className
    )}
  >
    {children}
    {required && (
      <span className="text-red-500 ml-1" aria-label="required">*</span>
    )}
  </label>
);

// Input component
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: keyof typeof inputVariants;
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  label,
  error,
  helperText,
  className,
  required,
  id,
  ...props
}, ref) => {
  const inputId = id ?? `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="form-spacing">
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        className={cn(
          inputBaseClasses,
          inputVariants[error ? 'error' : variant],
          className
        )}
        aria-invalid={!!error}
        aria-describedby={cn(
          error && errorId,
          helperText && helperId
        ) ?? undefined}
        {...props}
      />
      
      {error && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p
          id={helperId}
          className="mt-2 text-sm text-neutral-600"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: keyof typeof inputVariants;
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  variant = 'default',
  label,
  error,
  helperText,
  className,
  required,
  id,
  ...props
}, ref) => {
  const textareaId = id ?? `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  return (
    <div className="form-spacing">
      {label && (
        <Label htmlFor={textareaId} required={required}>
          {label}
        </Label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          inputBaseClasses,
          inputVariants[error ? 'error' : variant],
          'min-h-[120px] py-3 resize-vertical',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={cn(
          error && errorId,
          helperText && helperId
        ) ?? undefined}
        {...props}
      />
      
      {error && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p
          id={helperId}
          className="mt-2 text-sm text-neutral-600"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select component
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: keyof typeof inputVariants;
  label?: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  variant = 'default',
  label,
  error,
  helperText,
  className,
  required,
  id,
  children,
  ...props
}, ref) => {
  const selectId = id ?? `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className="form-spacing">
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            inputBaseClasses,
            inputVariants[error ? 'error' : variant],
            'pr-10 appearance-none cursor-pointer',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          ) ?? undefined}
          {...props}
        >
          {children}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p
          id={helperId}
          className="mt-2 text-sm text-neutral-600"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Form container component
interface FormProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export const Form = ({ children, className, onSubmit }: FormProps) => (
  <form
    className={cn(
      'space-y-6', // Using standard spacing
      className
    )}
    onSubmit={onSubmit}
  >
    {children}
  </form>
);

// Field group component for related fields
interface FieldGroupProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const FieldGroup = ({ children, className, title }: FieldGroupProps) => (
  <fieldset className={cn('space-y-4', className)}>
    {title && (
      <legend className="text-lg font-semibold text-neutral-900 mb-4">
        {title}
      </legend>
    )}
    {children}
  </fieldset>
);