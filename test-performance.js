/**
 * Simple Performance Testing for Agriko UI
 * Alternative to Lighthouse when there are permission issues
 */

const http = require('http');

const TEST_URL = 'http://localhost:3003';

async function measurePagePerformance() {
  console.log('🚀 Performance Testing Agriko UI\n');
  
  const tests = [];
  
  // Run multiple tests to get average
  for (let i = 0; i < 5; i++) {
    const result = await testSingleRequest(i + 1);
    tests.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate averages
  const avgLoadTime = tests.reduce((sum, test) => sum + test.loadTime, 0) / tests.length;
  const avgSize = tests.reduce((sum, test) => sum + test.size, 0) / tests.length;
  
  console.log('\n📊 Performance Summary:');
  console.log(`   Average Load Time: ${Math.round(avgLoadTime)}ms`);
  console.log(`   Average Page Size: ${Math.round(avgSize / 1024)}KB`);
  console.log(`   Status Success Rate: ${tests.filter(t => t.status === 200).length}/5`);
  
  // Performance ratings
  console.log('\n🎯 Performance Rating:');
  if (avgLoadTime < 1000) {
    console.log('   ✅ Excellent (< 1s)');
  } else if (avgLoadTime < 2000) {
    console.log('   ✅ Good (< 2s)');
  } else if (avgLoadTime < 3000) {
    console.log('   ⚠️  Fair (< 3s)');
  } else {
    console.log('   ❌ Poor (> 3s)');
  }
  
  console.log('\n🔧 Manual Testing Options:');
  console.log('   1. Open http://localhost:3003 in browser');
  console.log('   2. Open DevTools (F12) > Lighthouse tab');
  console.log('   3. Click "Generate report" for full analysis');
  console.log('   4. Test Core Web Vitals manually');
  
  console.log('\n📱 Mobile Testing:');
  console.log('   1. Open DevTools > Device Toggle (📱 icon)');
  console.log('   2. Test on iPhone/Android simulation');
  console.log('   3. Check touch targets (44px minimum)');
  console.log('   4. Verify responsive design');
  
  return {
    avgLoadTime,
    avgSize,
    tests
  };
}

function testSingleRequest(testNum) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.get(TEST_URL, (res) => {
      const loadTime = Date.now() - startTime;
      let bodySize = 0;
      
      res.on('data', (chunk) => {
        bodySize += chunk.length;
      });
      
      res.on('end', () => {
        console.log(`Test ${testNum}: ${res.statusCode} - ${loadTime}ms - ${Math.round(bodySize/1024)}KB`);
        resolve({
          status: res.statusCode,
          loadTime,
          size: bodySize,
          timestamp: new Date().toISOString()
        });
      });
    });
    
    req.on('error', (err) => {
      console.error(`Test ${testNum} failed:`, err.message);
      resolve({
        status: 0,
        loadTime: 0,
        size: 0,
        error: err.message
      });
    });
    
    req.setTimeout(10000, () => {
      console.error(`Test ${testNum} timeout`);
      resolve({
        status: 0,
        loadTime: 10000,
        size: 0,
        error: 'timeout'
      });
    });
  });
}

measurePagePerformance().catch(console.error);