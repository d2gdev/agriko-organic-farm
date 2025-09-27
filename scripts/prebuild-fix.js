#!/usr/bin/env node
/**
 * Pre-build script to fix @xenova/transformers CSS loading issue
 * Creates required CSS files that the package tries to load during static generation
 */

const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');
const serverDir = path.join(nextDir, 'server');
const appDir = path.join(serverDir, 'app');
const browserDir = path.join(appDir, 'browser');
const cssFile = path.join(browserDir, 'default-stylesheet.css');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.warn(`Created directory: ${dirPath}`);
  }
}

function createStubCssFile() {
  ensureDirectoryExists(browserDir);

  const cssContent = `/* Stub CSS file for @xenova/transformers compatibility during static generation */
/* This file prevents runtime errors when the package tries to load browser-specific styles */
`;

  fs.writeFileSync(cssFile, cssContent);
  console.warn(`Created stub CSS file: ${cssFile}`);
}

// Only run during build
if (process.env.NODE_ENV === 'production' || process.argv.includes('--build')) {
  console.warn('Running pre-build fix for @xenova/transformers CSS loading...');
  createStubCssFile();
  console.warn('Pre-build fix completed.');
}