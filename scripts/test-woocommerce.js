require('dotenv').config({ path: '.env.local' });

async function testWooCommerceAPI() {
  try {
    const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
    const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
    const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

    if (!WC_API_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      console.error('❌ Missing WooCommerce credentials');
      return;
    }

    console.log('🔄 Testing WooCommerce connection...');
    console.log('🌐 API URL:', WC_API_URL);

    const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${WC_API_URL}/products?featured=true&per_page=5&status=publish`, {
      headers,
      timeout: 30000,
    });

    if (!response.ok) {
      console.error(`❌ WooCommerce API error: ${response.status} ${response.statusText}`);
      return;
    }

    const products = await response.json();
    console.log(`✅ WooCommerce API connected successfully`);
    console.log(`📦 Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log('\n📋 Sample product:');
      const product = products[0];
      console.log(`- ID: ${product.id}`);
      console.log(`- Name: ${product.name}`);
      console.log(`- Slug: ${product.slug}`);
      console.log(`- Price: ${product.price}`);
      console.log(`- Categories: ${product.categories?.map(cat => cat.name).join(', ') || 'None'}`);
      console.log(`- Images: ${product.images?.length || 0} images`);
      if (product.images && product.images.length > 0) {
        console.log(`- First image URL: ${product.images[0].src || 'No URL'}`);
      }
    }

    return { success: true, productCount: products.length };

  } catch (error) {
    console.error('❌ WooCommerce test failed:', error);
    return { success: false, error };
  }
}

testWooCommerceAPI();