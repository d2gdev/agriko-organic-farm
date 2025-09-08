// Next.js Image Optimization Plugin
// Automatically integrates image optimization into the build process

const { SmartImageOptimizer } = require('./smart-image-optimizer');
const path = require('path');
const fs = require('fs');

class NextImageOptimizationPlugin {
  constructor(options = {}) {
    this.options = {
      // Run optimization during development
      runInDev: process.env.NODE_ENV === 'development',
      // Run optimization during build
      runInBuild: true,
      // Auto-optimize when images change in dev mode
      watchImages: true,
      // Show detailed logs
      verbose: false,
      ...options
    };
    
    this.optimizer = new SmartImageOptimizer();
    this.isRunning = false;
  }

  apply(compiler) {
    const pluginName = 'NextImageOptimizationPlugin';
    
    // Run before build starts
    if (this.options.runInBuild) {
      compiler.hooks.beforeRun.tapAsync(pluginName, async (compiler, callback) => {
        if (!this.isRunning) {
          this.isRunning = true;
          console.log('🖼️  Pre-build image optimization...');
          try {
            await this.optimizer.optimize({ verbose: this.options.verbose });
          } catch (error) {
            console.error('Image optimization failed:', error.message);
          }
          this.isRunning = false;
        }
        callback();
      });
    }

    // Run during development when images change
    if (this.options.runInDev && this.options.watchImages) {
      compiler.hooks.watchRun.tapAsync(pluginName, async (compiler, callback) => {
        const changedFiles = compiler.modifiedFiles || new Set();
        const imageFiles = Array.from(changedFiles).filter(file => 
          /\.(jpg|jpeg|png|gif)$/i.test(file) && file.includes('public/')
        );

        if (imageFiles.length > 0 && !this.isRunning) {
          this.isRunning = true;
          console.log(`🖼️  Optimizing ${imageFiles.length} changed image(s)...`);
          try {
            await this.optimizer.optimize({ verbose: false });
          } catch (error) {
            console.error('Image optimization failed:', error.message);
          }
          this.isRunning = false;
        }
        callback();
      });
    }

    // Generate image manifest after build
    compiler.hooks.afterEmit.tapAsync(pluginName, async (compilation, callback) => {
      try {
        await this.generateImageManifest();
      } catch (error) {
        console.error('Failed to generate image manifest:', error.message);
      }
      callback();
    });
  }

  async generateImageManifest() {
    const cache = this.optimizer.loadCache();
    const manifest = {
      generated: Date.now(),
      images: {}
    };

    Object.entries(cache).forEach(([originalPath, data]) => {
      const relativePath = path.relative('public', originalPath);
      manifest.images[relativePath] = {
        type: data.type,
        optimized: data.generated || [],
        lastProcessed: data.processedAt
      };
    });

    // Write manifest for use by components
    await fs.promises.writeFile(
      'public/optimized/manifest.json', 
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('📝 Generated image optimization manifest');
  }
}

module.exports = NextImageOptimizationPlugin;