'use client';

import { ReactNode } from 'react';
import Button, { ButtonProps } from '@/components/Button';

interface ScrollButtonProps extends Omit<ButtonProps, 'onClick'> {
  targetSelector: string;
  children: ReactNode;
}

export default function ScrollButton({ 
  targetSelector, 
  children, 
  ...buttonProps 
}: ScrollButtonProps) {
  const handleScroll = () => {
    const target = document.querySelector(targetSelector);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Button onClick={handleScroll} {...buttonProps}>
      {children}
    </Button>
  );
}