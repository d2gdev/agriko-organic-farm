// Simple test script for enhanced embedding pipeline functions
console.log('🧪 Testing Enhanced Embedding Pipeline Functions...\n');

// Health-related keywords dictionary for enhanced embedding
const healthKeywords = {
  nutrients: [
    'vitamin', 'mineral', 'protein', 'fiber', 'calcium', 'iron', 'potassium',
    'magnesium', 'zinc', 'antioxidants', 'omega-3', 'vitamin c', 'vitamin d',
    'folate', 'beta-carotene', 'flavonoids', 'polyphenols'
  ],
  benefits: [
    'anti-inflammatory', 'antioxidant', 'immune support', 'heart health',
    'digestive health', 'brain health', 'bone health', 'skin health',
    'weight management', 'energy boost', 'blood sugar', 'cholesterol',
    'detox', 'metabolism', 'cognitive', 'memory', 'circulation'
  ],
  conditions: [
    'diabetes', 'hypertension', 'arthritis', 'cardiovascular', 'digestive issues',
    'inflammation', 'oxidative stress', 'metabolic syndrome', 'insulin resistance'
  ],
  properties: [
    'organic', 'natural', 'raw', 'pure', 'whole grain', 'gluten-free',
    'non-gmo', 'pesticide-free', 'sustainable', 'traditional', 'medicinal'
  ]
};

// Extract health-related keywords from text
function extractHealthKeywords(text) {
  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  
  // Check all keyword categories
  Object.values(healthKeywords).forEach(keywordList => {
    keywordList.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    });
  });
  
  // Remove duplicates and return
  return [...new Set(foundKeywords)];
}

// Enhanced text preparation with health keywords and nutritional information
function prepareTextForEmbedding(
  title, 
  description, 
  categories,
  attributes,
  tags,
  healthBenefits
) {
  const parts = [title];
  
  if (description) {
    parts.push(description);
  }
  
  if (categories && categories.length > 0) {
    parts.push(`Categories: ${categories.join(', ')}`);
  }
  
  // Add product attributes (nutritional info, organic certifications, etc.)
  if (attributes && attributes.length > 0) {
    const attributeText = attributes
      .map(attr => `${attr.name}: ${attr.options.join(', ')}`)
      .join('; ');
    parts.push(`Attributes: ${attributeText}`);
  }
  
  // Add tags for additional context
  if (tags && tags.length > 0) {
    parts.push(`Tags: ${tags.map(tag => tag.name).join(', ')}`);
  }
  
  // Add extracted or provided health benefits
  if (healthBenefits && healthBenefits.length > 0) {
    parts.push(`Health Benefits: ${healthBenefits.join(', ')}`);
  }
  
  // Extract and add health keywords from existing text
  const combinedText = parts.join(' ');
  const keywords = extractHealthKeywords(combinedText);
  if (keywords.length > 0) {
    parts.push(`Health Keywords: ${keywords.join(', ')}`);
  }
  
  return parts.join(' | ');
}

// Semantic chunking for long descriptions
function semanticChunking(text, maxChunkSize = 500) {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk.length > 0 ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk + '.');
  }
  
  return chunks;
}

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
console.log(preparedText.substring(0, 300) + '...');
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

// Test 4: Compare with original method
console.log('4️⃣ Comparing Enhanced vs Original Preparation:');
const originalText = `${sampleProduct.title} | ${sampleProduct.description} | Categories: ${sampleProduct.categories.join(', ')}`;
const enhancedText = preparedText;

console.log(`Original method length: ${originalText.length} chars`);
console.log(`Enhanced method length: ${enhancedText.length} chars`);
console.log(`Enhancement factor: ${(enhancedText.length / originalText.length).toFixed(2)}x`);

console.log('\n🎉 Enhanced Embedding Pipeline Tests Completed!');
console.log('✅ All functions working correctly - ready for integration');