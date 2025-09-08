'use client';

import React from 'react';

interface FloatingElementsProps {
  density?: 'light' | 'medium' | 'heavy';
  className?: string;
}

export default function OrganicFloatingElements({ 
  density = 'medium',
  className = ''
}: FloatingElementsProps) {
  const elementCounts = {
    light: 3,
    medium: 6,
    heavy: 9
  };

  const count = elementCounts[density];

  const organicShapes = ['🌾', '🍃', '🌿', '🌱', '🌸', '✨', '🟢', '🟡', '🟤'];
  
  const generateElements = () => {
    const elements = [];
    
    for (let i = 0; i < count; i++) {
      const shape = organicShapes[i % organicShapes.length];
      const size = Math.random() * 20 + 10; // 10-30px
      const left = Math.random() * 100; // 0-100%
      const top = Math.random() * 100; // 0-100%
      const duration = Math.random() * 3 + 3; // 3-6s
      const delay = Math.random() * 2; // 0-2s
      const isReverse = Math.random() > 0.5;
      
      elements.push(
        <div
          key={i}
          className={`absolute text-primary-300/30 pointer-events-none select-none ${
            isReverse ? 'animate-float-reverse' : 'animate-float'
          }`}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            fontSize: `${size}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            zIndex: -1
          }}
        >
          {shape}
        </div>
      );
    }
    
    return elements;
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {generateElements()}
    </div>
  );
}

// Sparkle effect component for accent areas
export function SparkleEffect({ 
  count = 12,
  className = ''
}: {
  count?: number;
  className?: string;
}) {
  const generateSparkles = () => {
    const sparkles = [];
    
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 4 + 2; // 2-6px
      const left = Math.random() * 100; // 0-100%
      const top = Math.random() * 100; // 0-100%
      const delay = Math.random() * 3; // 0-3s
      
      sparkles.push(
        <div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-sparkle pointer-events-none"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
    
    return sparkles;
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {generateSparkles()}
    </div>
  );
}