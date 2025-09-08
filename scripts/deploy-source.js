// Smart source deployment - only uploads necessary files
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REMOTE_USER = "root";
const REMOTE_HOST = "143.42.189.57";
const REMOTE_SOURCE = "/var/www/shop-src";

// Files and directories to exclude (like .deployignore)
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'out',
  '.git',
  '.env*',
  '*.log',
  '.image-cache.json',
  '.eslintcache',
  '*.tsbuildinfo',
  '.DS_Store',
  'Thumbs.db',
  '*copy*',
  '*Copy*',
  '*.backup.*',
  '*.ps1',
  '*.md',
  'coverage',
  'test',
  'tests',
  '__tests__',
];

function shouldExclude(filePath) {
  const basename = path.basename(filePath);
  const relativePath = path.relative('.', filePath);
  
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      // Simple glob matching
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(basename) || regex.test(relativePath);
    } else {
      // Exact match or directory match
      return basename === pattern || 
             relativePath.includes(pattern + path.sep) ||
             relativePath === pattern;
    }
  });
}

function getFilesToUpload() {
  const files = [];
  
  function scanDirectory(dir) {
    if (shouldExclude(dir)) {
      return;
    }
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        
        if (shouldExclude(itemPath)) {
          continue;
        }
        
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          scanDirectory(itemPath);
        } else if (stats.isFile()) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Cannot read directory ${dir}: ${error.message}`);
    }
  }
  
  scanDirectory('.');
  return files;
}

function uploadFiles(files) {
  console.log('📤 Uploading source files...');
  console.log(`Found ${files.length} files to upload`);
  
  // Create a temporary directory list
  const tempFile = '.temp-file-list.txt';
  fs.writeFileSync(tempFile, files.join('\n'));
  
  try {
    // Ensure remote directory exists
    console.log('📁 Preparing remote directory...');
    execSync(`ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_SOURCE}"`);
    
    // Clear existing files (ignore . and .. warnings)
    console.log('🧹 Cleaning remote source directory...');
    execSync(`ssh ${REMOTE_USER}@${REMOTE_HOST} "rm -rf ${REMOTE_SOURCE}/* ${REMOTE_SOURCE}/.[!.]* 2>/dev/null || true"`);
    
    // Upload files using tar for efficiency
    console.log('🚀 Uploading files...');
    
    // Create tar of selected files and upload
    const tarCmd = `tar -czf - -T ${tempFile} | ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_SOURCE} && tar -xzf -"`;
    execSync(tarCmd, { stdio: 'inherit' });
    
    console.log('✅ Source files uploaded successfully');
    
    // Show what was uploaded
    execSync(`ssh ${REMOTE_USER}@${REMOTE_HOST} "echo 'Remote directory contents:' && ls -la ${REMOTE_SOURCE}"`, { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

function main() {
  console.log('🚀 Smart source deployment starting...');
  console.log('Excluding: node_modules, .next, out, .git, logs, etc.');
  console.log('');
  
  try {
    const files = getFilesToUpload();
    
    // Show exclusion summary
    console.log('📊 Upload summary:');
    console.log(`• Total files: ${files.length}`);
    console.log(`• Excluded patterns: ${EXCLUDE_PATTERNS.length}`);
    console.log('');
    
    uploadFiles(files);
    
    console.log('');
    console.log('🎉 Source deployment completed!');
    console.log('Next: Server will run npm ci && npm run build:smart');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getFilesToUpload, shouldExclude };