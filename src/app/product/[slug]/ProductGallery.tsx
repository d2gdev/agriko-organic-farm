'use client';

import { useState } from 'react';
import Image from 'next/image';
import { WCProduct } from '@/types/woocommerce';
import { getProductMainImage } from '@/lib/utils';

interface ProductGalleryProps {
  product: WCProduct;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [{ id: 0, src: getProductMainImage(product), alt: product.name, name: product.name }];

  const selectedImage = images[selectedImageIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        <Image
          src={selectedImage.src}
          alt={selectedImage.alt || product.name}
          fill
          className={`object-cover transition-transform duration-300 ${isZoomed ? 'scale-150' : 'hover:scale-105'}`}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          onClick={() => setIsZoomed(!isZoomed)}
        />
        
        {/* Zoom indicator */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Navigation arrows for mobile */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Sale badge */}
        {product.on_sale && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-sm font-medium rounded-md">
            Sale
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={`${image.id}-${index}`}
              onClick={() => {
                setSelectedImageIndex(index);
                setIsZoomed(false);
              }}
              className={`relative aspect-square bg-gray-100 rounded border-2 overflow-hidden transition-all ${
                index === selectedImageIndex
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt || `${product.name} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 16vw"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image indicators for mobile */}
      {images.length > 1 && (
        <div className="flex justify-center space-x-2 md:hidden">
          {images.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => setSelectedImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === selectedImageIndex ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Image count */}
      <div className="text-center text-sm text-gray-500">
        {selectedImageIndex + 1} of {images.length}
      </div>
    </div>
  );
}