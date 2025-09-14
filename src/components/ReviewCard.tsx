'use client';

import { useState } from 'react';
import { Review } from '@/types/reviews';
import { StarRating } from './StarRating';
import { ImageModal } from './ImageModal';
import Image from 'next/image';

interface ReviewCardProps {
  review: Review;
  showActions?: boolean;
  onHelpful?: (reviewId: string, helpful: boolean) => void;
}

export function ReviewCard({ review, showActions = true, onHelpful }: ReviewCardProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleHelpfulClick = (helpful: boolean) => {
    onHelpful?.(review.id, helpful);
  };

  const handleImageClick = (image: { url: string; alt: string }) => {
    setSelectedImage({ src: image.url, alt: image.alt });
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-sm font-medium text-gray-900">{review.rating}/5 stars</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {review.title}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">{review.customerName}</span>
            {review.verified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified Purchase
              </span>
            )}
            <span>•</span>
            <span>{formatDate(review.createdAt)}</span>
          </div>
        </div>
        
        {review.status !== 'approved' && (
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              review.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
            </span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {review.content}
        </p>
      </div>

      {review.images && review.images.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {review.images.map((image) => (
              <Image
                key={image.id}
                src={image.url}
                alt={image.alt}
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => handleImageClick(image)}
              />
            ))}
          </div>
        </div>
      )}

      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleHelpfulClick(true)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V9a2 2 0 00-2-2V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1a2 2 0 00-2 2v1m7-10h2m-7 10h2m5 10l3-3m-3 3l-3-3" />
              </svg>
              <span>Helpful</span>
            </button>
            
            <button
              onClick={() => handleHelpfulClick(false)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{transform: 'scaleY(-1)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V9a2 2 0 00-2-2V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1a2 2 0 00-2 2v1m7-10h2m-7 10h2m5 10l3-3m-3 3l-3-3" />
              </svg>
              <span>Not Helpful</span>
            </button>
          </div>

          {review.helpful > 0 && (
            <div className="text-sm text-gray-500">
              {review.helpful} {review.helpful === 1 ? 'person' : 'people'} found this helpful
            </div>
          )}
        </div>
      )}

      {review.moderationNotes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Moderation Notes:</span> {review.moderationNotes}
          </p>
          {review.moderatedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Moderated on {formatDate(review.moderatedAt)}
              {review.moderatedBy && ` by ${review.moderatedBy}`}
            </p>
          )}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          src={selectedImage.src}
          alt={selectedImage.alt}
          isOpen={!!selectedImage}
          onClose={closeModal}
        />
      )}
    </div>
  );
}