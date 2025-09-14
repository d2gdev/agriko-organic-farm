require('dotenv').config({ path: '.env.local' });

async function testEmbeddingGeneration() {
  try {
    const { pipeline, env } = require('@xenova/transformers');
    
    // Allow remote download to get model initially
    env.allowRemoteModels = true;
    env.allowLocalModels = true;
    
    console.log('🔄 Loading local embedding model...');
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Local embedding model loaded successfully');
    
    console.log('🔄 Testing embedding generation...');
    const testText = "Organic basmati rice with healthy nutrients and natural flavor";
    const output = await embedder(testText, { pooling: 'mean', normalize: true });
    
    // Convert tensor to array
    let embedding = Array.from(output.data);
    
    console.log(`📊 Original embedding dimensions: ${embedding.length}`);
    
    // Pad or truncate to exactly 1536 dimensions for Pinecone compatibility
    const targetDimensions = 1536;
    if (embedding.length < targetDimensions) {
      embedding.push(...new Array(targetDimensions - embedding.length).fill(0));
      console.log(`📏 Padded to ${targetDimensions} dimensions`);
    } else if (embedding.length > targetDimensions) {
      embedding.splice(targetDimensions);
      console.log(`✂️ Truncated to ${targetDimensions} dimensions`);
    }
    
    console.log('✅ Embedding generated successfully!');
    console.log(`📊 Final embedding dimensions: ${embedding.length}`);
    console.log(`📊 First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}...]`);
    
    if (embedding.length === 1536) {
      console.log('🎉 Perfect! Embedding dimensions match Pinecone index (1536)');
    } else {
      console.log(`⚠️ Warning: Expected 1536 dimensions, got ${embedding.length}`);
    }
    
  } catch (error) {
    console.error('❌ Embedding test failed:', error);
  }
}

testEmbeddingGeneration();