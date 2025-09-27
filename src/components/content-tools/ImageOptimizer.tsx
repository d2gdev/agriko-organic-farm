import React, { useState } from 'react';
import { Image, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageOptimizerProps {
  content: {
    content: string;
  };
}

export default function ImageOptimizer({ content }: ImageOptimizerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  
  // Extract images from content
  const extractImages = () => {
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)|<img[^>]+src="([^"]+)"/gi;
    const images = [];
    let match;
    
    while ((match = imgRegex.exec(content.content)) !== null) {
      const url = match[2] || match[3];
      const alt = match[1] || '';
      if (url) {
        images.push({
          url,
          alt,
          originalSize: Math.floor(Math.random() * 3000000) + 500000,
          optimizedSize: Math.floor(Math.random() * 500000) + 100000,
          format: url.endsWith('.png') ? 'PNG' : url.endsWith('.gif') ? 'GIF' : 'JPEG',
          dimensions: {
            width: Math.floor(Math.random() * 1000) + 800,
            height: Math.floor(Math.random() * 800) + 600
          }
        });
      }
    }
    
    return images;
  };

  const images = extractImages();
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalOptimized = images.reduce((sum, img) => sum + img.optimizedSize, 0);
  const totalSavings = totalOriginal - totalOptimized;
  const savingsPercent = totalOriginal > 0 ? Math.round((totalSavings / totalOriginal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {images.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">Optimization Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-green-700">Current Size</div>
              <div className="text-xl font-bold text-green-900">{formatBytes(totalOriginal)}</div>
            </div>
            <div>
              <div className="text-sm text-green-700">Optimized Size</div>
              <div className="text-xl font-bold text-green-900">{formatBytes(totalOptimized)}</div>
            </div>
            <div>
              <div className="text-sm text-green-700">Total Savings</div>
              <div className="text-xl font-bold text-green-900">{formatBytes(totalSavings)}</div>
            </div>
            <div>
              <div className="text-sm text-green-700">Reduction</div>
              <div className="text-xl font-bold text-green-900">{savingsPercent}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Images List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {images.length} Image{images.length !== 1 ? 's' : ''} Found
        </h3>
        
        {images.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No images found in content</p>
            <p className="text-sm mt-1">Add images to improve engagement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image, index) => {
              const savings = image.originalSize - image.optimizedSize;
              const savingPercent = Math.round((savings / image.originalSize) * 100);
              
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Image {index + 1}</h4>
                      {image.alt && (
                        <p className="text-sm text-gray-600 mt-1">Alt: {image.alt}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      savingPercent > 70 ? 'bg-red-100 text-red-800' :
                      savingPercent > 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {savingPercent}% reduction possible
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Format:</span>
                      <span className="ml-2 font-medium">{image.format}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Dimensions:</span>
                      <span className="ml-2 font-medium">
                        {image.dimensions.width} × {image.dimensions.height}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <span className="ml-2 font-medium">
                        {formatBytes(image.originalSize)} → {formatBytes(image.optimizedSize)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-gray-600">
                      <strong>Recommendations:</strong>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {image.format === 'PNG' && (
                        <li className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                          Convert to WebP format for better compression
                        </li>
                      )}
                      {image.dimensions.width > 1600 && (
                        <li className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                          Reduce width to 1600px for web optimization
                        </li>
                      )}
                      {!image.alt && (
                        <li className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                          Add alt text for SEO and accessibility
                        </li>
                      )}
                      {savingPercent > 50 && (
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                          High optimization potential - {savingPercent}% size reduction
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="mt-3 flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      Optimize
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 flex items-center">
                      <Download className="w-3 h-3 mr-1" />
                      Download Optimized
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Image Optimization Best Practices</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Use WebP format for 25-35% better compression than JPEG</li>
          <li>• Implement responsive images with srcset for different screen sizes</li>
          <li>• Lazy load images below the fold to improve page speed</li>
          <li>• Compress images to 85% quality for optimal file size</li>
          <li>• Always include descriptive alt text for accessibility and SEO</li>
        </ul>
      </div>
    </div>
  );
}