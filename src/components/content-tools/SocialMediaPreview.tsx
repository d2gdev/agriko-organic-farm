import React from 'react';
import { Facebook, Twitter, Linkedin } from 'lucide-react';

interface SocialMediaPreviewProps {
  content: {
    title: string;
    content: string;
    excerpt: string;
    image?: string;
  };
}

export default function SocialMediaPreview({ content }: SocialMediaPreviewProps) {
  const defaultImage = '/images/og-default.jpg';
  const imageUrl = content.image || defaultImage;

  return (
    <div className="space-y-6">
      {/* Facebook Preview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Facebook className="w-5 h-5 mr-2 text-blue-600" />
          Facebook
        </h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-lg">
          <div className="aspect-video bg-gray-200">
            {imageUrl !== defaultImage ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>No image set</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="text-xs text-gray-500 uppercase mb-1">agrikoph.com</div>
            <div className="font-semibold text-gray-900 line-clamp-2">
              {content.title.substring(0, 65)}{content.title.length > 65 && '...'}
            </div>
            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
              {content.excerpt.substring(0, 125)}{content.excerpt.length > 125 && '...'}
            </div>
          </div>
        </div>
      </div>

      {/* Twitter/X Preview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Twitter className="w-5 h-5 mr-2 text-sky-500" />
          Twitter/X
        </h3>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden max-w-lg">
          <div className="flex">
            <div className="w-32 h-32 bg-gray-200 flex-shrink-0">
              {imageUrl !== defaultImage ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  <span>No image</span>
                </div>
              )}
            </div>
            <div className="p-3 flex-1">
              <div className="font-semibold text-gray-900 text-sm line-clamp-2">
                {content.title.substring(0, 70)}{content.title.length > 70 && '...'}
              </div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                {content.excerpt.substring(0, 125)}{content.excerpt.length > 125 && '...'}
              </div>
              <div className="text-xs text-gray-500 mt-2">agrikoph.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn Preview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Linkedin className="w-5 h-5 mr-2 text-blue-700" />
          LinkedIn
        </h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-lg">
          <div className="aspect-video bg-gray-200">
            {imageUrl !== defaultImage ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>No image set</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="font-semibold text-gray-900">
              {content.title.substring(0, 100)}{content.title.length > 100 && '...'}
            </div>
            <div className="text-xs text-gray-500 mt-1">agrikoph.com • 2 min read</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">Optimization Tips</h4>
        <ul className="space-y-1 text-sm text-amber-800">
          <li>• Use high-quality images (1200x630px for Facebook, 1200x675px for Twitter)</li>
          <li>• Keep titles under 60 characters for best display</li>
          <li>• Write compelling descriptions under 125 characters</li>
          <li>• Include relevant hashtags for better reach</li>
          <li>• Add Open Graph tags to your HTML for accurate previews</li>
        </ul>
      </div>
    </div>
  );
}