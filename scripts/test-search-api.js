require('dotenv').config({ path: '.env.local' });

async function testSearchAPI() {
  try {
    console.log('🔍 Testing semantic search API...\n');

    // Test different search queries
    const queries = [
      'turmeric tea healthy',
      'organic rice',
      'moringa superfood',
      'honey natural sweetener'
    ];

    for (const query of queries) {
      console.log(`🔍 Searching for: "${query}"`);
      
      const url = `http://localhost:3002/api/search/semantic?q=${encodeURIComponent(query)}&limit=3`;
      console.log(`   📡 URL: ${url}`);
      
      try {
        const response = await fetch(url);
        console.log(`   📊 Status: ${response.status}`);
        
        if (!response.ok) {
          const text = await response.text();
          console.log(`   ❌ Error: ${text}`);
          continue;
        }
        
        const result = await response.json();
        console.log(`   ✅ Found ${result.count || 0} results`);
        
        if (result.results && result.results.length > 0) {
          result.results.forEach((item, i) => {
            console.log(`      ${i + 1}. ${item.title} (Score: ${item.relevanceScore?.toFixed(4) || 'N/A'})`);
          });
        } else {
          console.log('      No results found');
        }
        
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
      
      console.log(''); // Empty line between queries
    }

  } catch (error) {
    console.error('❌ Search API test failed:', error);
  }
}

testSearchAPI();