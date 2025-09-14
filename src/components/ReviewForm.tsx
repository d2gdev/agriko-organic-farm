'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { reliableFetch } from '@/lib/reliable-fetch';
import { Input, Textarea } from '@/components/Form';

import { ReviewSubmission, REVIEW_VALIDATION } from '@/types/reviews';

interface ReviewFormProps {
  productId: number;
  productName: string;
  onSubmit?: (review: ReviewSubmission) => void;
  onClose?: () => void;
}

interface FormErrors {
  customerName?: string;
  customerEmail?: string;
  rating?: string;
  title?: string;
  content?: string;
}

export function ReviewForm({ productId, productName, onSubmit, onClose }: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewSubmission>({
    productId,
    customerName: '',
    customerEmail: '',
    rating: 0,
    title: '',
    content: '',
    orderId: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customerName || formData.customerName.length < REVIEW_VALIDATION.customerName.minLength) {
      newErrors.customerName = `Name must be at least ${REVIEW_VALIDATION.customerName.minLength} characters`;
    }

    if (!REVIEW_VALIDATION.email.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }

    if (formData.rating < REVIEW_VALIDATION.rating.min || formData.rating > REVIEW_VALIDATION.rating.max) {
      newErrors.rating = `Please select a rating between ${REVIEW_VALIDATION.rating.min} and ${REVIEW_VALIDATION.rating.max} stars`;
    }

    if (!formData.title || formData.title.length < REVIEW_VALIDATION.title.minLength) {
      newErrors.title = `Title must be at least ${REVIEW_VALIDATION.title.minLength} characters`;
    }

    if (!formData.content || formData.content.length < REVIEW_VALIDATION.content.minLength) {
      newErrors.content = `Review must be at least ${REVIEW_VALIDATION.content.minLength} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const response = await reliableFetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        timeoutLevel: 'critical'
      });

      if (response.ok) {
        setSubmitted(true);
        onSubmit?.(formData);
      } else {
        const result = await response.json();
        throw new Error(result.message ?? 'Failed to submit review');
      }
    } catch (error) {
      logger.error('Review submission error:', error as Record<string, unknown>);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: undefined }));
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you for your review!</h3>
          <p className="text-gray-600 mb-4">
            Your review has been submitted and is pending moderation. It will appear on the product page once approved.
          </p>
          <button
            onClick={onClose}
            className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-gray-600">
          Reviewing: <span className="font-semibold text-gray-900">{productName}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            id="customerName"
            label="Your Name"
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            placeholder="Enter your full name"
            error={errors.customerName}
            required
          />

          <Input
            id="customerEmail"
            label="Email Address"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
            placeholder="your@email.com"
            error={errors.customerEmail}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                className={`w-8 h-8 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded ${
                  star <= formData.rating
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {formData.rating > 0 ? `${formData.rating} star${formData.rating > 1 ? 's' : ''}` : 'Select rating'}
            </span>
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        <div>
          <Input
            id="title"
            label="Review Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Summarize your experience"
            maxLength={REVIEW_VALIDATION.title.maxLength}
            error={errors.title}
            required
          />
          <div className="flex justify-end mt-1">
            <span className="text-sm text-gray-500">
              {formData.title.length}/{REVIEW_VALIDATION.title.maxLength}
            </span>
          </div>
        </div>

        <div>
          <Textarea
            id="content"
            label="Your Review"
            rows={6}
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Tell us about your experience with this product..."
            maxLength={REVIEW_VALIDATION.content.maxLength}
            error={errors.content}
            required
            className="resize-vertical"
          />
          <div className="flex justify-end mt-1">
            <span className="text-sm text-gray-500">
              {formData.content.length}/{REVIEW_VALIDATION.content.maxLength}
            </span>
          </div>
        </div>

        <Input
          id="orderId"
          label="Order ID (Optional)"
          type="text"
          value={formData.orderId}
          onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
          placeholder="Enter your order ID to verify your purchase"
          helperText="Providing your order ID will mark your review as &quot;Verified Purchase&quot;"
        />

        <div className="flex justify-end space-x-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}