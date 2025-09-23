'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: 'general',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    // Form submission logic will be implemented here
  };

  return (
    <div id="contact-form" className="bg-gradient-to-br from-amber-50/30 via-cream-50/50 to-orange-50/30 rounded-3xl shadow-xl p-10 border border-amber-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-200 to-orange-200 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-2xl">🌿</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Send us a Message</h2>
          <p className="text-gray-600">We&apos;d love to hear from you!</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Your Name
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500">🌱</span>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 border-2 border-amber-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 bg-white/80 backdrop-blur-sm"
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500">✉️</span>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 border-2 border-amber-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 bg-white/80 backdrop-blur-sm"
              placeholder="john@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
            Reason for Contact
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500">🎯</span>
            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 border-2 border-amber-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 bg-white/80 backdrop-blur-sm"
            >
              <option value="general">General Inquiry</option>
              <option value="product">Product Question</option>
              <option value="wholesale">Wholesale/Bulk Orders</option>
              <option value="partnership">Partnership Opportunity</option>
              <option value="farm-visit">Farm Visit Request</option>
              <option value="feedback">Feedback/Suggestion</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
            Your Message
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-amber-500">📝</span>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 border-2 border-amber-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 hover:border-amber-300 bg-white/80 backdrop-blur-sm resize-none"
              placeholder="Tell us more about how we can help you..."
              required
            ></textarea>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-5 px-8 rounded-2xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
          >
            <span className="text-xl">🌱</span>
            <span>Send Message</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
          <p className="text-center text-sm text-gray-600 bg-amber-50/50 rounded-lg py-2 px-4">
            ✨ We typically respond within 24 hours
          </p>
        </div>
      </form>

      {/* Quick Contact Options */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center mb-4">Or reach us directly via:</p>
        <div className="flex justify-center gap-4">
          <a
            href="tel:+639669968578"
            className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Us
          </a>
          <a
            href="https://m.me/AgrikoPH"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 3.474 1.459 6.604 3.795 8.823V24l3.467-1.9c.925.257 1.905.4 2.918.4 6.627 0 12-5.373 12-12S18.627 0 12 0zm1.191 16.157l-2.594-2.766-5.063 2.766 5.568-5.91 2.657 2.766 5-2.766-5.568 5.91z"/>
            </svg>
            Messenger
          </a>
        </div>
      </div>
    </div>
  );
}