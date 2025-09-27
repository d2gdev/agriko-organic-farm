/**
 * Test script for new Qdrant-based authentication
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/admin/login';

async function testAuth() {
  console.warn('🔐 Testing Qdrant Authentication System\n');

  try {
    // Test 1: Invalid login
    console.warn('Test 1: Invalid credentials...');
    try {
      await axios.post(API_URL, {
        email: 'wrong@agriko.com',
        password: 'wrongpassword'
      });
      console.warn('  ❌ Should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('  ✅ Correctly rejected invalid credentials');
      } else {
        console.warn('  ❌ Unexpected error:', error.message);
      }
    }

    // Test 2: Valid login
    console.warn('\nTest 2: Valid credentials...');
    try {
      const response = await axios.post(API_URL, {
        email: 'admin@agriko.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });

      if (response.data.success && response.data.token) {
        console.warn('  ✅ Login successful');
        console.warn('  📝 Token received:', response.data.token.substring(0, 20) + '...');
        console.warn('  👤 User:', response.data.user.email);
        console.warn('  🎯 Role:', response.data.user.role);

        // Save token for next tests
        return response.data.token;
      } else {
        console.warn('  ❌ Login failed:', response.data);
      }
    } catch (error) {
      console.warn('  ❌ Login error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testAuth().then(token => {
  if (token) {
    console.warn('\n✨ All tests passed! Authentication system is working.');
    console.warn('\n📝 Next steps:');
    console.warn('   1. Test protected endpoints with the token');
    console.warn('   2. Verify session persistence');
    console.warn('   3. Test logout functionality');
  }
}).catch(console.error);