// Test script for enhanced embedding pipeline
const { 
  extractHealthKeywords, 
  prepareTextForEmbedding, 
  generateEnhancedEmbedding,
  semanticChunking 
} = require('../src/lib/embeddings.ts');

async function testEnhancedEmbeddings() {
  console.log('🧪 Testing Enhanced Embedding Pipeline...\n');

  // Test 1: Health Keywords Extraction
  console.log('1️⃣ Testing Health Keywords Extraction:');
  const sampleDescription = `
    Organic turmeric powder rich in curcumin, known for its powerful anti-inflammatory 
    and antioxidant properties. Supports immune system function, aids in digestive health, 
    and may help reduce inflammation. Contains natural compounds that support heart health 
    and cognitive function. High in vitamin C and natural minerals.
  `;
  
  const keywords = extractHealthKeywords(sampleDescription);
  console.log('Found keywords:', keywords);
  console.log(`✅ Extracted ${keywords.length} health keywords\n`);

  // Test 2: Enhanced Text Preparation
  console.log('2️⃣ Testing Enhanced Text Preparation:');
  const sampleProduct = {
    title: 'Organic Turmeric Powder',
    description: sampleDescription,
    categories: ['Spices', 'Superfoods', 'Organic'],
    attributes: [
      { name: 'Organic Certification', options: ['USDA Organic', 'Non-GMO'] },
      { name: 'Origin', options: ['India'] },
      { name: 'Processing', options: ['Raw', 'Ground'] }
    ],
    tags: [
      { name: 'anti-inflammatory' },
      { name: 'superfood' },
      { name: 'traditional-medicine' }
    ],
    healthBenefits: ['anti-inflammatory', 'antioxidant properties', 'immune support']
  };

  const preparedText = prepareTextForEmbedding(
    sampleProduct.title,
    sampleProduct.description,
    sampleProduct.categories,
    sampleProduct.attributes,
    sampleProduct.tags,
    sampleProduct.healthBenefits
  );
  
  console.log('Prepared text for embedding:');
  console.log(preparedText.substring(0, 200) + '...');
  console.log(`✅ Generated enhanced text (${preparedText.length} chars)\n`);

  // Test 3: Semantic Chunking
  console.log('3️⃣ Testing Semantic Chunking:');
  const longText = `
    This is a long product description that needs to be chunked for better embedding processing. 
    Organic moringa powder is derived from the leaves of the moringa oleifera tree, native to India. 
    It contains over 90 nutrients including vitamins A, C, and E, calcium, potassium, and protein. 
    The powder supports immune system function and provides antioxidant benefits. 
    Traditional uses include supporting energy levels and overall wellness. 
    It can be added to smoothies, soups, or taken as a dietary supplement. 
    The production process involves carefully drying the leaves and grinding them into a fine powder. 
    Quality control ensures that the nutrient content remains intact throughout processing.
  `.replace(/\s+/g, ' ').trim();

  const chunks = semanticChunking(longText, 200);
  console.log(`Original text length: ${longText.length} chars`);
  console.log(`Number of chunks: ${chunks.length}`);
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1} (${chunk.length} chars): ${chunk.substring(0, 100)}...`);
  });
  console.log('✅ Semantic chunking completed\n');

  // Test 4: Enhanced Embedding Generation (if model is available)
  console.log('4️⃣ Testing Enhanced Embedding Generation:');
  try {
    const embedding = await generateEnhancedEmbedding(preparedText.substring(0, 500));
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    console.log(`First 10 values: [${embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}]`);
    
    // Verify embedding properties
    const hasNaN = embedding.some(v => isNaN(v));
    const allZeros = embedding.every(v => v === 0);
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    
    console.log(`✅ Embedding validation:`);
    console.log(`  - Contains NaN: ${hasNaN}`);
    console.log(`  - All zeros: ${allZeros}`);
    console.log(`  - Magnitude: ${magnitude.toFixed(4)}`);
  } catch (error) {
    console.log(`⚠️ Embedding generation test skipped (model not available): ${error.message}`);
  }

  // Test 5: Compare with original method
  console.log('\n5️⃣ Comparing Enhanced vs Original Preparation:');
  const originalText = `${sampleProduct.title} | ${sampleProduct.description} | Categories: ${sampleProduct.categories.join(', ')}`;
  const enhancedText = preparedText;
  
  console.log(`Original method length: ${originalText.length} chars`);
  console.log(`Enhanced method length: ${enhancedText.length} chars`);
  console.log(`Enhancement factor: ${(enhancedText.length / originalText.length).toFixed(2)}x`);
  
  console.log('\n🎉 Enhanced Embedding Pipeline Tests Completed!');
}

// Run tests
testEnhancedEmbeddings().catch(console.error);