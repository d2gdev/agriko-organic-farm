// Build-time image optimization for Agriko
// Runs automatically during 'npm run build:export'

const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  inputDir: 'public',
  outputDir: 'public/optimized',
  quality: {
    jpeg: 85,
    png: 90,
    webp: 80,
    avif: 70
  },
  sizes: {
    thumbnail: 300,
    medium: 600,
    large: 1200,
    hero: 1920
  },
  formats: ['webp', 'avif'] // Generate these additional formats
};

class ImageOptimizer {
  constructor() {
    this.stats = {
      processed: 0,
      originalSize: 0,
      optimizedSize: 0,
      timeStart: Date.now()
    };
  }

  async optimize() {
    console.log('🖼️  Starting image optimization...');
    
    // Ensure output directory exists
    await fs.ensureDir(CONFIG.outputDir);
    
    // Find all images
    const images = glob.sync(`${CONFIG.inputDir}/**/*.{jpg,jpeg,png,gif}`, {
      ignore: [`${CONFIG.outputDir}/**/*`, `${CONFIG.inputDir}/**/*-optimized*`]
    });
    
    console.log(`📦 Found ${images.length} images to optimize`);
    
    // Process each image
    for (const imagePath of images) {
      await this.processImage(imagePath);
    }
    
    this.showSummary();
  }

  async processImage(imagePath) {
    try {
      const relativePath = path.relative(CONFIG.inputDir, imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      const name = path.basename(imagePath, ext);
      const dir = path.dirname(relativePath);
      
      // Get original stats
      const originalStats = await fs.stat(imagePath);
      this.stats.originalSize += originalStats.size;
      
      console.log(`  🔄 ${relativePath} (${this.formatBytes(originalStats.size)})`);
      
      // Load image with sharp
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      // Determine optimization strategy based on image type and size
      const strategy = this.getOptimizationStrategy(imagePath, metadata);
      
      // Create output directory
      const outputDir = path.join(CONFIG.outputDir, dir);
      await fs.ensureDir(outputDir);
      
      // Generate optimized versions
      await this.generateOptimizedVersions(image, outputDir, name, strategy);
      
      this.stats.processed++;
      
    } catch (error) {
      console.error(`    ❌ Failed to process ${imagePath}: ${error.message}`);
    }
  }

  getOptimizationStrategy(imagePath, metadata) {
    const filename = path.basename(imagePath).toLowerCase();
    
    // Product images
    if (filename.includes('5n1') || filename.includes('honey') || filename.includes('salabat')) {
      return {
        type: 'product',
        sizes: [CONFIG.sizes.thumbnail, CONFIG.sizes.medium],
        quality: CONFIG.quality.jpeg,
        formats: ['jpeg', 'webp']
      };
    }
    
    // Hero images
    if (filename.includes('hero') || filename.includes('blend-bg') || metadata.width > 1500) {
      return {
        type: 'hero',
        sizes: [CONFIG.sizes.medium, CONFIG.sizes.large, CONFIG.sizes.hero],
        quality: CONFIG.quality.jpeg,
        formats: ['jpeg', 'webp', 'avif']
      };
    }
    
    // Regular images
    return {
      type: 'regular',
      sizes: [CONFIG.sizes.medium],
      quality: CONFIG.quality.jpeg,
      formats: ['jpeg', 'webp']
    };
  }

  async generateOptimizedVersions(image, outputDir, name, strategy) {
    const results = [];
    
    for (const size of strategy.sizes) {
      for (const format of strategy.formats) {
        const outputPath = path.join(outputDir, `${name}-${size}w.${format}`);
        
        try {
          let pipeline = image.clone().resize(size, null, {
            withoutEnlargement: true,
            fit: 'inside'
          });
          
          // Apply format-specific optimizations
          switch (format) {
            case 'jpeg':
              pipeline = pipeline.jpeg({ 
                quality: strategy.quality,
                progressive: true,
                mozjpeg: true 
              });
              break;
              
            case 'webp':
              pipeline = pipeline.webp({ 
                quality: CONFIG.quality.webp,
                effort: 6 
              });
              break;
              
            case 'avif':
              pipeline = pipeline.avif({ 
                quality: CONFIG.quality.avif,
                effort: 4 
              });
              break;
              
            case 'png':
              pipeline = pipeline.png({ 
                quality: CONFIG.quality.png,
                compressionLevel: 9 
              });
              break;
          }
          
          // Save optimized image
          await pipeline.toFile(outputPath);
          
          // Get size stats
          const stats = await fs.stat(outputPath);
          this.stats.optimizedSize += stats.size;
          
          results.push({
            path: outputPath,
            size: stats.size,
            format,
            width: size
          });
          
        } catch (error) {
          console.error(`    ❌ Failed to generate ${format} version: ${error.message}`);
        }
      }
    }
    
    // Log results
    results.forEach(result => {
      console.log(`    ✅ ${path.basename(result.path)} (${this.formatBytes(result.size)})`);
    });
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  showSummary() {
    const duration = Date.now() - this.stats.timeStart;
    const savings = this.stats.originalSize - this.stats.optimizedSize;
    const savingsPercent = ((savings / this.stats.originalSize) * 100).toFixed(1);
    
    console.log('\n🎉 Image optimization complete!');
    console.log(`📊 Processed: ${this.stats.processed} images`);
    console.log(`📦 Original size: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`🗜️  Optimized size: ${this.formatBytes(this.stats.optimizedSize)}`);
    console.log(`💾 Savings: ${this.formatBytes(savings)} (${savingsPercent}%)`);
    console.log(`⏱️  Time: ${(duration / 1000).toFixed(1)}s`);
    console.log('\n📁 Optimized images saved to: public/optimized/');
    console.log('\n💡 Next steps:');
    console.log('1. Review optimized images');
    console.log('2. Update your components to use optimized versions');
    console.log('3. Deploy with npm run build:export');
  }
}

// Generate picture element helper
function generatePictureElement(imageName, alt, className = '', sizes = '100vw') {
  return `
<picture className="${className}">
  <source 
    srcSet="/optimized/${imageName}-300w.avif 300w, /optimized/${imageName}-600w.avif 600w, /optimized/${imageName}-1200w.avif 1200w" 
    type="image/avif" 
    sizes="${sizes}" 
  />
  <source 
    srcSet="/optimized/${imageName}-300w.webp 300w, /optimized/${imageName}-600w.webp 600w, /optimized/${imageName}-1200w.webp 1200w" 
    type="image/webp" 
    sizes="${sizes}" 
  />
  <img 
    src="/optimized/${imageName}-600w.jpeg" 
    alt="${alt}"
    loading="lazy"
    decoding="async"
  />
</picture>`.trim();
}

// Export for use in components
module.exports = { ImageOptimizer, generatePictureElement };

// Run if called directly
if (require.main === module) {
  const optimizer = new ImageOptimizer();
  optimizer.optimize().catch(console.error);
}