#!/usr/bin/env node

// Reset Circuit Breakers and Test WooCommerce API
const { resetCircuitBreaker, getCircuitBreakerStats } = require('../src/lib/retry-handler');

console.warn('🔄 Checking current circuit breaker status...');
const stats = getCircuitBreakerStats();

if (Object.keys(stats).length === 0) {
  console.warn('✅ No active circuit breakers found');
} else {
  console.warn('📊 Active circuit breakers:');
  Object.entries(stats).forEach(([key, state]) => {
    console.warn(`  - ${key}: ${state.state} (${state.failures} failures)`);
  });

  console.warn('\n🔄 Resetting all circuit breakers...');
  Object.keys(stats).forEach(key => {
    resetCircuitBreaker(key);
    console.warn(`  ✅ Reset: ${key}`);
  });
}

console.warn('\n🔄 Testing WooCommerce API configuration...');

// Import WooCommerce service to test
const { wooCommerceAPI } = require('../src/lib/integrations/woocommerce-api');

async function testWooCommerceConnection() {
  try {
    console.warn('🔍 Testing API connection...');
    const result = await wooCommerceAPI.testConnection();

    if (result.success) {
      console.warn('✅ WooCommerce API connection successful');
      console.warn(`   Store info: ${JSON.stringify(result.storeInfo?.environment?.wordpress_version || 'Available', null, 2)}`);
    } else {
      console.warn('❌ WooCommerce API connection failed');
      console.warn(`   Error: ${result.message}`);
    }

    console.warn('\n🔍 Testing products endpoint...');
    const products = await wooCommerceAPI.getProducts({ per_page: 3 });
    console.warn(`✅ Successfully fetched ${products.products.length} products`);
    console.warn(`   Total products available: ${products.totalCount}`);

    if (products.products.length > 0) {
      console.warn(`   Sample product: ${products.products[0].name} (ID: ${products.products[0].id})`);
    }

  } catch (error) {
    console.error('❌ WooCommerce API test failed:');
    console.error(`   Error: ${error.message}`);

    if (error.message.includes('Circuit breaker is open')) {
      console.warn('\n🔄 Circuit breaker is still blocking requests');
      console.warn('   This suggests there may be ongoing issues with the API configuration');
    }
  }
}

// Run the test
testWooCommerceConnection()
  .then(() => {
    console.warn('\n✅ Circuit breaker reset and API test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });