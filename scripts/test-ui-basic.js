/**
 * Basic UI Testing Script for Agriko
 * Run with: node scripts/test-ui-basic.js
 */

const https = require('https');
const http = require('http');

const TEST_URL = 'http://localhost:3000';

async function testPageLoad() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.get(TEST_URL, (res) => {
      const loadTime = Date.now() - startTime;
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          loadTime,
          bodyLength: body.length,
          hasHeroSection: body.includes('HeroSection') || body.includes('Agriko'),
          hasProductCards: body.includes('ProductCard') || body.includes('product'),
          hasImages: body.includes('<img') || body.includes('Image'),
          hasButtons: body.includes('button') || body.includes('btn'),
          responseHeaders: res.headers
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      reject(new Error('Request timeout'));
    });
  });
}

async function runBasicTests() {
  console.log('🧪 Running Basic UI Tests for Agriko\n');
  
  try {
    console.log('📄 Testing page load...');
    const result = await testPageLoad();
    
    console.log('✅ Results:');
    console.log(`   Status: ${result.status === 200 ? '✅ 200 OK' : '❌ ' + result.status}`);
    console.log(`   Load Time: ${result.loadTime}ms`);
    console.log(`   Page Size: ${result.bodyLength} bytes`);
    console.log(`   Hero Section: ${result.hasHeroSection ? '✅' : '❌'}`);
    console.log(`   Product Cards: ${result.hasProductCards ? '✅' : '❌'}`);
    console.log(`   Images: ${result.hasImages ? '✅' : '❌'}`);
    console.log(`   Buttons: ${result.hasButtons ? '✅' : '❌'}`);
    
    console.log('\n📊 Performance:');
    if (result.loadTime < 2000) {
      console.log('   ✅ Fast load time');
    } else if (result.loadTime < 5000) {
      console.log('   ⚠️  Moderate load time');
    } else {
      console.log('   ❌ Slow load time');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Test button hover effects manually');
    console.log('   3. Check mobile responsiveness');
    console.log('   4. Verify all product images load');
    console.log('   5. Test cart functionality');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure dev server is running: npm run dev');
    console.log('   2. Check if port 3000 is available');
    console.log('   3. Verify no compilation errors');
  }
}

runBasicTests();