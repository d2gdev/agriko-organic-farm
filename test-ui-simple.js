const http = require('http');

const TEST_URL = 'http://localhost:3003';

async function testPage() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.get(TEST_URL, (res) => {
      const loadTime = Date.now() - startTime;
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ UI Test Results:');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Load Time: ${loadTime}ms`);
        console.log(`   Page Size: ${body.length} bytes`);
        console.log(`   Has Content: ${body.length > 1000 ? 'Yes' : 'No'}`);
        console.log('');
        console.log('🎯 Manual Testing:');
        console.log('   1. Open http://localhost:3003 in browser');
        console.log('   2. Check black button in hero section');
        console.log('   3. Test product image loading');
        console.log('   4. Verify responsive design');
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Test failed:', err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.error('❌ Request timeout');
      reject(new Error('timeout'));
    });
  });
}

testPage();