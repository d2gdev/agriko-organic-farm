import Image from 'next/image';
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

interface ImageManifest {
  generated: number;
  images: {
    [key: string]: {
      type: string;
      optimized: Array<{
        path: string;
        format: string;
        width: number;
        size: number;
      }>;
      lastProcessed: number;
    };
  };
}

/**
 * Smart Optimized Image Component for Agriko
 * 
 * Automatically detects and serves optimized versions when available
 * Falls back to original images during development or if optimization not available
 * Supports WebP, AVIF with JPEG fallback
 */
export default function OptimizedImage({
  src,
  alt,
  width = 600,
  height = 400,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3FMsewxVLzL1VZkYyuFDY'
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [manifest, setManifest] = useState<ImageManifest | null>(null);

  // Load image manifest on component mount
  useEffect(() => {
    // Disable manifest loading in development to prevent 404 errors
    if (process.env.NODE_ENV === 'development') {
      setManifest(null);
      return;
    }

    fetch('/optimized/manifest.json')
      .then(res => res.ok ? res.json() : null)
      .then(setManifest)
      .catch(() => setManifest(null)); // Fail silently in development
  }, []);

  // Get optimized versions from manifest
  const getOptimizedVersions = () => {
    if (!manifest) return null;
    
    const imagePath = src.startsWith('/') ? src.slice(1) : src;
    const imageData = manifest.images[imagePath];
    
    if (!imageData?.optimized?.length) return null;
    
    // Group by format
    const byFormat: { [format: string]: Array<{ path: string; width: number }> } = {};
    
    imageData.optimized?.forEach(opt => {
      if (!byFormat[opt.format]) byFormat[opt.format] = [];
      byFormat[opt.format]?.push({
        path: `/optimized/${opt.path}`,
        width: opt.width
      });
    });
    
    // Sort by width
    Object.keys(byFormat).forEach(format => {
      byFormat[format]?.sort((a, b) => a.width - b.width);
    });
    
    return byFormat;
  };

  // Generate srcSet string for a format
  const generateSrcSet = (versions: Array<{ path: string; width: number }>) => {
    return versions.map(v => `${v.path} ${v.width}w`).join(', ');
  };

  // Get fallback image (largest JPEG or original)
  interface ImageVersions {
    [format: string]: Array<{ path: string; width: number }> | undefined;
  }

  const getFallbackSrc = (versions: ImageVersions | null) => {
    const jpegArray = versions?.jpeg;
    if (jpegArray && jpegArray.length > 0) {
      const lastItem = jpegArray[jpegArray.length - 1];
      if (lastItem) {
        return lastItem.path;
      }
    }
    return src; // Use original as fallback
  };

  const optimizedVersions = getOptimizedVersions();

  // Fallback for errors or no optimization
  if (imageError || !optimizedVersions) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        quality={quality}
        onError={() => setImageError(true)}
        onLoad={() => setIsLoading(false)}
        placeholder={placeholder}
        blurDataURL={blurDataURL || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3FMsewxVLzL1VZkYyuFDY'}
        sizes={sizes}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading blur effect */}
      {isLoading && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      
      {/* Modern browsers with picture element */}
      <picture>
        {/* AVIF sources (smallest file size, newest format) */}
        {optimizedVersions.avif && (
          <source
            srcSet={generateSrcSet(optimizedVersions.avif)}
            type="image/avif"
            sizes={sizes}
          />
        )}
        
        {/* WebP sources (good compression, wide support) */}
        {optimizedVersions.webp && (
          <source
            srcSet={generateSrcSet(optimizedVersions.webp)}
            type="image/webp"
            sizes={sizes}
          />
        )}
        
        {/* JPEG/PNG fallback */}
        <Image
          src={getFallbackSrc(optimizedVersions)}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          quality={quality}
          sizes={sizes}
          className="transition-opacity duration-300"
          onError={() => setImageError(true)}
          onLoad={() => setIsLoading(false)}
          placeholder={placeholder}
          blurDataURL={blurDataURL || 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyb5v3FMsewxVLzL1VZkYyuFDY'}
        />
      </picture>
      
      {/* Performance indicator in development */}
      {process.env.NODE_ENV === 'development' && optimizedVersions && (
        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded opacity-75">
          ✓ Optimized
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases

export function ProductImage({ 
  src, 
  alt, 
  className = '' 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={600}
      height={600}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
      priority={false}
    />
  );
}

export function HeroImage({ 
  src, 
  alt, 
  className = '' 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={800}
      className={className}
      sizes="100vw"
      quality={90}
      priority={true} // Hero images should load first
    />
  );
}

export function ThumbnailImage({ 
  src, 
  alt, 
  className = '' 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={300}
      className={className}
      sizes="300px"
      quality={80}
      priority={false}
    />
  );
}