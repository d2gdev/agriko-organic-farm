require('dotenv').config({ path: '.env.local' });

async function testFullVectorizationPipeline() {
  try {
    console.log('🚀 Testing full vectorization pipeline...\n');

    // Step 1: Test WooCommerce connection
    console.log('1️⃣ Testing WooCommerce...');
    const WC_API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
    const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
    const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

    const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${WC_API_URL}/products?per_page=2&status=publish`, { headers });
    const products = await response.json();
    console.log(`   ✅ Fetched ${products.length} products\n`);

    // Step 2: Test embeddings
    console.log('2️⃣ Testing embeddings...');
    const { pipeline, env } = require('@xenova/transformers');
    env.allowRemoteModels = true;
    env.allowLocalModels = true;

    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    // Test with first product
    const product = products[0];
    const textToEmbed = `${product.name} ${product.description || ''} Categories: ${product.categories?.map(cat => cat.name).join(', ') || ''}`;
    console.log(`   📝 Text: "${textToEmbed.substring(0, 100)}..."`);
    
    const output = await embedder(textToEmbed.replace(/<[^>]*>/g, ''), { pooling: 'mean', normalize: true });
    let embedding = Array.from(output.data);
    
    // Pad to 1536 dimensions
    if (embedding.length < 1536) {
      embedding.push(...new Array(1536 - embedding.length).fill(0));
    }
    console.log(`   ✅ Generated ${embedding.length}D embedding\n`);

    // Step 3: Test Pinecone connection
    console.log('3️⃣ Testing Pinecone...');
    const { Pinecone } = require('@pinecone-database/pinecone');
    
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    const stats = await index.describeIndexStats();
    console.log(`   ✅ Connected to Pinecone (${stats.totalVectorCount || 0} vectors)\n`);

    // Step 4: Test upsert
    console.log('4️⃣ Testing vector upsert...');
    const testVector = {
      id: `agriko_test_${Date.now()}`,
      values: embedding,
      metadata: {
        source: 'agriko',
        productId: product.id,
        slug: product.slug,
        title: product.name,
        price: product.price,
        categories: product.categories?.map(cat => cat.name) || [],
        timestamp: new Date().toISOString(),
        test: true, // Mark as test data
      },
    };

    await index.upsert([testVector]);
    console.log(`   ✅ Upserted test vector: ${testVector.id}\n`);

    // Step 5: Test search
    console.log('5️⃣ Testing semantic search...');
    const searchQuery = 'healthy turmeric tea blend';
    const queryOutput = await embedder(searchQuery, { pooling: 'mean', normalize: true });
    let queryEmbedding = Array.from(queryOutput.data);
    
    if (queryEmbedding.length < 1536) {
      queryEmbedding.push(...new Array(1536 - queryEmbedding.length).fill(0));
    }

    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: 3,
      filter: { source: { $eq: 'agriko' } },
      includeMetadata: true,
    });

    console.log(`   ✅ Found ${searchResults.matches?.length || 0} matches`);
    if (searchResults.matches?.length > 0) {
      const match = searchResults.matches[0];
      console.log(`   🎯 Top result: "${match.metadata?.title}" (score: ${match.score?.toFixed(4)})`);
    }

    console.log('\n🎉 Full pipeline test completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('\n❌ Pipeline test failed:', error);
    return { success: false, error };
  }
}

testFullVectorizationPipeline();