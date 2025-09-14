require('dotenv').config({ path: '.env.local' });

async function vectorizeBatchProducts() {
  try {
    console.log('🚀 Starting product vectorization...\n');

    // Step 1: Fetch products from WooCommerce
    console.log('1️⃣ Fetching products from WooCommerce...');
    const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
    const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
    const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

    const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${WC_API_URL}/products?per_page=10&status=publish`, { headers });
    const products = await response.json();
    console.log(`   ✅ Fetched ${products.length} products\n`);

    // Step 2: Initialize embeddings
    console.log('2️⃣ Initializing embedding model...');
    const { pipeline, env } = require('@xenova/transformers');
    env.allowRemoteModels = true;
    env.allowLocalModels = true;

    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('   ✅ Embedding model loaded\n');

    // Step 3: Initialize Pinecone
    console.log('3️⃣ Connecting to Pinecone...');
    const { Pinecone } = require('@pinecone-database/pinecone');
    
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    console.log('   ✅ Connected to Pinecone\n');

    // Step 4: Process each product
    console.log('4️⃣ Processing products...');
    const vectors = [];
    
    for (let i = 0; i < Math.min(products.length, 5); i++) { // Start with 5 products
      const product = products[i];
      console.log(`   Processing (${i + 1}/${Math.min(products.length, 5)}): ${product.name}`);
      
      // Clean and prepare text
      const description = (product.description || product.short_description || '').replace(/<[^>]*>/g, '').trim();
      const categories = product.categories?.map(cat => cat.name).join(', ') || '';
      const textToEmbed = `${product.name}. ${description}. Categories: ${categories}`;
      
      // Generate embedding
      const output = await embedder(textToEmbed, { pooling: 'mean', normalize: true });
      let embedding = Array.from(output.data);
      
      // Pad to 1536 dimensions
      if (embedding.length < 1536) {
        embedding.push(...new Array(1536 - embedding.length).fill(0));
      }
      
      // Create vector
      const vector = {
        id: `agriko_product_${product.id}`,
        values: embedding,
        metadata: {
          source: 'agriko',
          productId: product.id,
          slug: product.slug,
          title: product.name,
          description: description.substring(0, 500), // Pinecone metadata size limit
          price: product.price,
          categories: product.categories?.map(cat => cat.name) || [],
          inStock: product.stock_status === 'instock',
          featured: product.featured || false,
          timestamp: new Date().toISOString(),
        },
      };
      
      vectors.push(vector);
    }

    console.log(`   ✅ Created ${vectors.length} vectors\n`);

    // Step 5: Upsert to Pinecone
    console.log('5️⃣ Uploading to Pinecone...');
    await index.upsert(vectors);
    console.log(`   ✅ Upserted ${vectors.length} vectors\n`);

    // Step 6: Wait a moment for indexing
    console.log('6️⃣ Waiting for indexing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check stats
    const stats = await index.describeIndexStats();
    console.log(`   ✅ Index now contains ${stats.totalVectorCount || 0} vectors\n`);

    console.log('🎉 Vectorization completed successfully!');
    console.log('\n📋 Vectorized products:');
    vectors.forEach((vector, i) => {
      console.log(`${i + 1}. ${vector.metadata.title} (${vector.id})`);
    });

    return { success: true, vectorized: vectors.length };

  } catch (error) {
    console.error('\n❌ Vectorization failed:', error);
    return { success: false, error };
  }
}

vectorizeBatchProducts();