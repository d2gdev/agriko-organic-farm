// Smart Image Optimizer for Agriko
// Automatically optimizes only changed images and integrates with the build process

const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  inputDir: 'public',
  outputDir: 'public/optimized',
  cacheFile: '.image-cache.json',
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
  formats: ['webp', 'avif'], // Additional formats to generate
  // Auto-detect image types based on filename patterns
  imageTypes: {
    product: {
      patterns: ['5n1', 'honey', 'salabat', 'product'],
      sizes: [300, 600],
      formats: ['jpeg', 'webp'],
      quality: 85
    },
    hero: {
      patterns: ['hero', 'blend-bg', 'banner'],
      sizes: [600, 1200, 1920],
      formats: ['jpeg', 'webp', 'avif'],
      quality: 90
    },
    background: {
      patterns: ['background', 'bg', 'backdrop'],
      sizes: [600, 1200],
      formats: ['jpeg', 'webp'],
      quality: 80
    },
    logo: {
      patterns: ['logo', 'brand'],
      sizes: [300, 600],
      formats: ['png', 'webp'],
      quality: 95
    },
    regular: {
      patterns: [], // default fallback
      sizes: [600],
      formats: ['jpeg', 'webp'],
      quality: 85
    }
  }
};

class SmartImageOptimizer {
  constructor() {
    this.cache = this.loadCache();
    this.stats = {
      processed: 0,
      skipped: 0,
      originalSize: 0,
      optimizedSize: 0,
      timeStart: Date.now()
    };
  }

  loadCache() {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.cacheFile, 'utf8'));
    } catch {
      return {};
    }
  }

  saveCache() {
    fs.writeFileSync(CONFIG.cacheFile, JSON.stringify(this.cache, null, 2));
  }

  getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  needsOptimization(imagePath) {
    const stats = fs.statSync(imagePath);
    const currentHash = this.getFileHash(imagePath);
    const cached = this.cache[imagePath];
    
    // Check if file changed or never processed
    return !cached || 
           cached.hash !== currentHash || 
           cached.mtime !== stats.mtime.getTime();
  }

  detectImageType(imagePath) {
    const filename = path.basename(imagePath).toLowerCase();
    
    for (const [type, config] of Object.entries(CONFIG.imageTypes)) {
      if (config.patterns.some(pattern => filename.includes(pattern))) {
        return type;
      }
    }
    
    return 'regular';
  }

  async optimize(options = {}) {
    const { force = false, verbose = true } = options;
    
    if (verbose) {
      console.log('🚀 Starting smart image optimization...');
    }
    
    // Ensure output directory exists
    await fs.ensureDir(CONFIG.outputDir);
    
    // Find all images
    const images = glob.sync(`${CONFIG.inputDir}/**/*.{jpg,jpeg,png,gif}`, {
      ignore: [
        `${CONFIG.outputDir}/**/*`, 
        `${CONFIG.inputDir}/**/*-optimized*`,
        `${CONFIG.inputDir}/**/*copy*` // Skip copy files
      ]
    });
    
    if (verbose) {
      console.log(`📦 Found ${images.length} images`);
    }
    
    let toProcess = [];
    
    // Filter images that need processing
    for (const imagePath of images) {
      if (force || this.needsOptimization(imagePath)) {
        toProcess.push(imagePath);
      } else {
        this.stats.skipped++;
        if (verbose) {
          console.log(`  ⏭️  Skipping ${path.relative(CONFIG.inputDir, imagePath)} (no changes)`);
        }
      }
    }
    
    if (verbose) {
      console.log(`🔄 Processing ${toProcess.length} images, skipping ${this.stats.skipped}`);
    }
    
    // Process images in parallel (but limit concurrency)
    const concurrency = 3;
    const chunks = this.chunkArray(toProcess, concurrency);
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(imagePath => this.processImage(imagePath, verbose)));
    }
    
    // Save cache
    this.saveCache();
    
    if (verbose) {
      this.showSummary();
    }
    
    return {
      processed: this.stats.processed,
      skipped: this.stats.skipped,
      totalSavings: this.stats.originalSize - this.stats.optimizedSize
    };
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async processImage(imagePath, verbose = true) {
    try {
      const relativePath = path.relative(CONFIG.inputDir, imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      const name = path.basename(imagePath, ext);
      const dir = path.dirname(relativePath);
      
      // Get original stats
      const originalStats = fs.statSync(imagePath);
      this.stats.originalSize += originalStats.size;
      
      if (verbose) {
        console.log(`  🔄 ${relativePath} (${this.formatBytes(originalStats.size)})`);
      }
      
      // Load image with sharp
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      // Detect image type and get optimization strategy
      const imageType = this.detectImageType(imagePath);
      const strategy = CONFIG.imageTypes[imageType];
      
      if (verbose) {
        console.log(`    📋 Type: ${imageType}, Sizes: [${strategy.sizes.join(', ')}], Formats: [${strategy.formats.join(', ')}]`);
      }
      
      // Create output directory
      const outputDir = path.join(CONFIG.outputDir, dir);
      await fs.ensureDir(outputDir);
      
      // Generate optimized versions
      const generatedFiles = await this.generateOptimizedVersions(image, outputDir, name, strategy, metadata);
      
      // Update cache
      this.cache[imagePath] = {
        hash: this.getFileHash(imagePath),
        mtime: originalStats.mtime.getTime(),
        generated: generatedFiles,
        type: imageType,
        processedAt: Date.now()
      };
      
      this.stats.processed++;
      
    } catch (error) {
      console.error(`    ❌ Failed to process ${imagePath}: ${error.message}`);
    }
  }

  async generateOptimizedVersions(image, outputDir, name, strategy, metadata) {
    const results = [];
    
    for (const size of strategy.sizes) {
      // Don't upscale images
      const actualSize = Math.min(size, metadata.width || size);
      
      for (const format of strategy.formats) {
        const outputPath = path.join(outputDir, `${name}-${actualSize}w.${format}`);
        
        try {
          let pipeline = image.clone().resize(actualSize, null, {
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
                quality: strategy.quality,
                compressionLevel: 9 
              });
              break;
          }
          
          // Save optimized image
          await pipeline.toFile(outputPath);
          
          // Get size stats
          const stats = fs.statSync(outputPath);
          this.stats.optimizedSize += stats.size;
          
          results.push({
            path: path.relative('public', outputPath),
            size: stats.size,
            format,
            width: actualSize
          });
          
        } catch (error) {
          console.error(`    ❌ Failed to generate ${format} version: ${error.message}`);
        }
      }
    }
    
    return results;
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
    const savingsPercent = this.stats.originalSize > 0 ? 
      ((savings / this.stats.originalSize) * 100).toFixed(1) : 0;
    
    console.log('\n🎉 Smart image optimization complete!');
    console.log(`📊 Processed: ${this.stats.processed} images`);
    console.log(`⏭️  Skipped: ${this.stats.skipped} images (unchanged)`);
    
    if (this.stats.processed > 0) {
      console.log(`📦 Original size: ${this.formatBytes(this.stats.originalSize)}`);
      console.log(`🗜️  Optimized size: ${this.formatBytes(this.stats.optimizedSize)}`);
      console.log(`💾 Savings: ${this.formatBytes(savings)} (${savingsPercent}%)`);
    }
    
    console.log(`⏱️  Time: ${(duration / 1000).toFixed(1)}s`);
    console.log('\n📁 Optimized images saved to: public/optimized/');
    
    if (this.stats.processed > 0) {
      console.log('\n💡 Next steps:');
      console.log('1. Components automatically use OptimizedImage component');
      console.log('2. Deploy with npm run deploy:smart');
    }
  }

  // Generate usage report
  generateReport() {
    const cacheEntries = Object.entries(this.cache);
    const report = {
      totalImages: cacheEntries.length,
      byType: {},
      oldestOptimization: null,
      newestOptimization: null,
      totalOptimizedFiles: 0
    };

    cacheEntries.forEach(([imagePath, data]) => {
      if (!report.byType[data.type]) {
        report.byType[data.type] = 0;
      }
      report.byType[data.type]++;
      report.totalOptimizedFiles += data.generated?.length || 0;

      if (!report.oldestOptimization || data.processedAt < report.oldestOptimization) {
        report.oldestOptimization = data.processedAt;
      }
      if (!report.newestOptimization || data.processedAt > report.newestOptimization) {
        report.newestOptimization = data.processedAt;
      }
    });

    return report;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const optimizer = new SmartImageOptimizer();

  if (args.includes('--report')) {
    const report = optimizer.generateReport();
    console.log('📊 Image Optimization Report');
    console.log('============================');
    console.log(`Total images: ${report.totalImages}`);
    console.log(`Total optimized files: ${report.totalOptimizedFiles}`);
    console.log('\nBy type:');
    Object.entries(report.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    if (report.oldestOptimization) {
      console.log(`\nOldest optimization: ${new Date(report.oldestOptimization).toLocaleString()}`);
      console.log(`Newest optimization: ${new Date(report.newestOptimization).toLocaleString()}`);
    }
    return;
  }

  const force = args.includes('--force');
  const quiet = args.includes('--quiet');
  
  await optimizer.optimize({ force, verbose: !quiet });
}

// Export for use in other scripts
module.exports = { SmartImageOptimizer, CONFIG };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}