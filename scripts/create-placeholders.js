const fs = require('fs');
const path = require('path');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create simple SVG placeholders
const placeholders = {
  'placeholder-product.jpg': {
    width: 400,
    height: 400,
    text: 'Product Image',
    bg: '#f3f4f6'
  },
  'Agriko-Logo.png': {
    width: 200,
    height: 100,
    text: 'Agriko Logo',
    bg: '#22c55e'
  },
  'hero.png': {
    width: 800,
    height: 600,
    text: 'Hero Image',
    bg: '#15803d'
  },
  'philippines-flag-background.jpg': {
    width: 1200,
    height: 800,
    text: 'Philippines Flag',
    bg: '#dc2626'
  },
  'gerry-paglinawan-family-agriko-founders.jpg': {
    width: 600,
    height: 400,
    text: 'Founder Photo',
    bg: '#a3a3a3'
  },
  'footer-background.jpg': {
    width: 1200,
    height: 300,
    text: 'Footer Background',
    bg: '#374151'
  },
  'gaisano.png': {
    width: 200,
    height: 100,
    text: 'Gaisano',
    bg: '#3b82f6'
  },
  'puregold.png': {
    width: 200,
    height: 100,
    text: 'Puregold',
    bg: '#f59e0b'
  }
};

// Generate SVG placeholders
Object.entries(placeholders).forEach(([filename, config]) => {
  const svg = `<svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${config.bg}"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${config.text}</text>
</svg>`;
  
  const filepath = path.join(imagesDir, filename.replace(/\.(jpg|png)$/, '.svg'));
  fs.writeFileSync(filepath, svg);
  console.log(`Created: ${filepath}`);
});

console.log('\n✅ Placeholder images created!');
console.log('📝 To use real images:');
console.log('1. Replace these SVG files with actual images');
console.log('2. Update file extensions in the code if needed');
console.log('3. Commit the real images to git');