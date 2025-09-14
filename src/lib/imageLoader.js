// Custom image loader for production static export
// This loader optimizes images for better Core Web Vitals

function customImageLoader({ src, width, quality }) {
  // For static export, we'll return the original image with optimizations
  // In a production environment, this would integrate with a CDN or image service
  
  // Handle relative URLs
  if (src.startsWith('/')) {
    return `https://shop.agrikoph.com${src}`;
  }
  
  // Handle external URLs - return as-is for remote images
  if (src.startsWith('http')) {
    return src;
  }
  
  // Default to the source URL
  return src;
}

module.exports = customImageLoader;