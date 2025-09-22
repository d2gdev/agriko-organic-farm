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

  // Create helper functions that don't rely on the functional update pattern
  const handlePrevImage = () => {
    setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
  };

  const handleNextImage = () => {
    setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1);
  };

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index);
    setIsZoomed(false);
  };

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl overflow-hidden group shadow-2xl border border-gray-200">
        <Image
          src={selectedImage?.src || ''}
          alt={selectedImage?.alt || product.name}
          fill
          className={`object-cover transition-transform duration-300 ${isZoomed ? 'scale-150' : 'hover:scale-105'}`}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          fetchPriority="high"
          onClick={() => setIsZoomed(!isZoomed)}
        />
        
        {/* Zoom indicator */}
        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm text-gray-700 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:shadow-lg transform hover:scale-110">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Navigation arrows for mobile */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-700 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:shadow-lg transform hover:scale-110 md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-700 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:shadow-lg transform hover:scale-110 md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Sale badge */}
        {product.on_sale && (
          <div className="absolute top-6 left-6 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-sm font-bold rounded-full shadow-lg animate-pulse border-2 border-white">
            🎉 On Sale!
          </div>
        )}

        {/* Quality badge */}
        <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 text-xs font-bold rounded-full shadow-lg border border-white">
          🌱 Organic
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Product Gallery</h3>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
            {images.map((image, index) => (
              <button
                key={`${image.id}-${index}`}
                onClick={() => handleSelectImage(index)}
                className={`relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  index === selectedImageIndex
                    ? 'border-red-500 ring-4 ring-red-200 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-red-300'
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
        </div>
      )}

      {/* Image indicators for mobile */}
      {images.length > 1 && (
        <div className="flex justify-center space-x-3 md:hidden">
          {images.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => handleSelectImage(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 transform ${
                index === selectedImageIndex
                  ? 'bg-red-600 ring-2 ring-red-200 scale-125'
                  : 'bg-gray-300 hover:bg-red-300 hover:scale-110'
              }`}
            />
          ))}
        </div>
      )}

      {/* Image count */}
      <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 text-center">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-red-600">{selectedImageIndex + 1}</span> of <span className="font-semibold">{images.length}</span> images
        </div>
        <div className="text-xs text-gray-500 mt-1">Click to zoom, swipe or use arrows to navigate</div>
      </div>
    </div>
  );
}