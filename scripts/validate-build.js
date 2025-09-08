#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildDir = path.join(process.cwd(), 'out');
const requiredFiles = [
  'index.html',
  '_next/static',
  'about/index.html',
  'cart/index.html',
  'checkout/index.html',
  'find-us/index.html',
];

const requiredProductPages = [
  'product',
];

function validateBuild() {
  console.log('🔍 Validating build output...\n');

  // Check if build directory exists
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found at:', buildDir);
    process.exit(1);
  }

  // Check required files
  let missingFiles = [];
  for (const file of requiredFiles) {
    const filePath = path.join(buildDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }

  // Check for product pages
  const productDir = path.join(buildDir, 'product');
  if (!fs.existsSync(productDir)) {
    console.error('❌ Product pages directory not found');
    process.exit(1);
  }

  const productPages = fs.readdirSync(productDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (productPages.length === 0) {
    console.error('❌ No product pages found in build');
    process.exit(1);
  }

  // Validate that each product page has an index.html
  let missingProductPages = [];
  for (const productSlug of productPages) {
    const indexPath = path.join(productDir, productSlug, 'index.html');
    if (!fs.existsSync(indexPath)) {
      missingProductPages.push(`product/${productSlug}/index.html`);
    }
  }

  if (missingProductPages.length > 0) {
    console.error('❌ Missing product page files:');
    missingProductPages.forEach(page => console.error(`   - ${page}`));
    process.exit(1);
  }

  // Check for empty HTML files (indication of build failure)
  const indexPath = path.join(buildDir, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (indexContent.length < 1000 || !indexContent.includes('<!DOCTYPE html>')) {
    console.error('❌ Homepage appears to be incomplete or corrupted');
    console.error(`   File size: ${indexContent.length} bytes`);
    process.exit(1);
  }

  // Check for JavaScript bundles
  const nextStaticDir = path.join(buildDir, '_next', 'static');
  if (fs.existsSync(nextStaticDir)) {
    const staticContents = fs.readdirSync(nextStaticDir);
    const hasJsBundle = staticContents.some(item => {
      const itemPath = path.join(nextStaticDir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const subContents = fs.readdirSync(itemPath);
        return subContents.some(file => file.endsWith('.js'));
      }
      return false;
    });

    if (!hasJsBundle) {
      console.error('❌ No JavaScript bundles found in build');
      process.exit(1);
    }
  }

  // Success validation
  console.log('✅ Build validation passed!');
  console.log(`📦 Found ${productPages.length} product pages`);
  console.log(`📁 Homepage size: ${Math.round(indexContent.length / 1024)}KB`);
  console.log('🚀 Build is ready for deployment\n');
  
  return true;
}

if (require.main === module) {
  validateBuild();
}

module.exports = { validateBuild };