require('dotenv').config({ path: '.env.local' });

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
  tags
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
      .filter(attr => attr.options && attr.options.length > 0)
      .map(attr => `${attr.name}: ${attr.options.join(', ')}`)
      .join('; ');
    if (attributeText) {
      parts.push(`Attributes: ${attributeText}`);
    }
  }
  
  // Add tags for additional context
  if (tags && tags.length > 0) {
    parts.push(`Tags: ${tags.map(tag => tag.name).join(', ')}`);
  }
  
  // Extract and add health keywords from existing text
  const combinedText = parts.join(' ');
  const keywords = extractHealthKeywords(combinedText);
  if (keywords.length > 0) {
    parts.push(`Health Keywords: ${keywords.join(', ')}`);
  }
  
  return parts.join(' | ');
}

// Text preprocessing function
function preprocessText(text) {
  // Remove HTML tags
  let processed = text.replace(/<[^>]*>/g, '');
  
  // Remove excessive whitespace and normalize
  processed = processed.replace(/\s+/g, ' ').trim();
  
  // Convert to lowercase for consistency
  processed = processed.toLowerCase();
  
  // Remove common stop words that don't add semantic value for product search
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall'];
  
  // Only remove stop words if the text is long enough to preserve meaning
  if (processed.split(' ').length > 10) {
    const words = processed.split(' ');
    const filteredWords = words.filter(word => !stopWords.includes(word) || word.length < 3);
    processed = filteredWords.join(' ');
  }
  
  return processed;
}

async function vectorizeEnhancedProducts() {
  try {
    console.log('🚀 Starting enhanced product vectorization...\n');

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

    // Step 4: Process each product with enhanced pipeline
    console.log('4️⃣ Processing products with enhanced embedding pipeline...');
    const vectors = [];
    
    for (let i = 0; i < Math.min(products.length, 5); i++) {
      const product = products[i];
      console.log(`   Processing (${i + 1}/${Math.min(products.length, 5)}): ${product.name}`);
      
      // Clean description
      const description = (product.description || product.short_description || '').replace(/<[^>]*>/g, '').trim();
      
      // Extract categories
      const categories = product.categories?.map(cat => cat.name) || [];
      
      // Extract attributes  
      const attributes = product.attributes || [];
      
      // Extract tags
      const tags = product.tags || [];
      
      // Use enhanced text preparation
      const enhancedText = prepareTextForEmbedding(
        product.name,
        description,
        categories,
        attributes,
        tags
      );
      
      console.log(`      Enhanced text length: ${enhancedText.length} chars`);
      console.log(`      Health keywords: ${extractHealthKeywords(enhancedText).length} found`);
      
      // Preprocess text before embedding
      const processedText = preprocessText(enhancedText);
      
      // Generate embedding
      const output = await embedder(processedText, { pooling: 'mean', normalize: true });
      let embedding = Array.from(output.data);
      
      // Pad to 1536 dimensions
      if (embedding.length < 1536) {
        embedding.push(...new Array(1536 - embedding.length).fill(0));
      } else if (embedding.length > 1536) {
        embedding.splice(1536);
      }
      
      // Create enhanced vector with more metadata
      const vector = {
        id: `agriko_enhanced_${product.id}`,
        values: embedding,
        metadata: {
          source: 'agriko_enhanced',
          productId: product.id,
          slug: product.slug,
          title: product.name,
          description: description.substring(0, 400), // Leave room for other metadata
          price: product.price,
          categories: categories,
          inStock: product.stock_status === 'instock',
          featured: product.featured || false,
          healthKeywords: extractHealthKeywords(enhancedText).slice(0, 10), // Limit for metadata
          attributeCount: attributes.length,
          tagCount: tags.length,
          enhancedText: enhancedText.length > 500 ? enhancedText.substring(0, 500) + '...' : enhancedText,
          timestamp: new Date().toISOString(),
        },
      };
      
      vectors.push(vector);
    }

    console.log(`   ✅ Created ${vectors.length} enhanced vectors\n`);

    // Step 5: Upsert to Pinecone
    console.log('5️⃣ Uploading enhanced vectors to Pinecone...');
    await index.upsert(vectors);
    console.log(`   ✅ Upserted ${vectors.length} enhanced vectors\n`);

    // Step 6: Wait for indexing and check stats
    console.log('6️⃣ Waiting for indexing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const stats = await index.describeIndexStats();
    console.log(`   ✅ Index now contains ${stats.totalVectorCount || 0} vectors\n`);

    // Step 7: Quality assessment
    console.log('7️⃣ Enhanced embedding quality assessment:');
    vectors.forEach((vector, i) => {
      const metadata = vector.metadata;
      console.log(`   Product ${i + 1}: ${metadata.title}`);
      console.log(`     - Health keywords: ${metadata.healthKeywords.length}`);
      console.log(`     - Attributes: ${metadata.attributeCount}`);
      console.log(`     - Enhanced text length: ${metadata.enhancedText.length} chars`);
      console.log(`     - Vector magnitude: ${Math.sqrt(vector.values.reduce((sum, v) => sum + v * v, 0)).toFixed(4)}`);
    });

    console.log('\n🎉 Enhanced vectorization completed successfully!');
    console.log('\n📋 Enhanced vectors created:');
    vectors.forEach((vector, i) => {
      console.log(`${i + 1}. ${vector.metadata.title} (${vector.id})`);
      console.log(`   Health keywords: ${vector.metadata.healthKeywords.join(', ')}`);
    });

    return { 
      success: true, 
      vectorized: vectors.length,
      enhancementFactor: 'Enhanced with health keywords, attributes, and preprocessing',
      healthKeywordsFound: vectors.reduce((total, v) => total + v.metadata.healthKeywords.length, 0)
    };

  } catch (error) {
    console.error('\n❌ Enhanced vectorization failed:', error);
    return { success: false, error };
  }
}

vectorizeEnhancedProducts();