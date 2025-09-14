const { searchByText } = require('../src/lib/pinecone');

// Test semantic search with relevance threshold
async function testSemanticThreshold() {
  console.log('🧪 Testing semantic search with relevance threshold...\n');
  
  const testQueries = [
    'car',
    'medicine', 
    'honey',
    'ginger tea',
    'organic vegetables',
    'antibiotics',
    'transportation',
    'computer software'
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    
    try {
      // Test with default threshold (0.3)
      const defaultResults = await searchByText(query, { topK: 3 });
      
      // Test with lower threshold (0.1) 
      const lowResults = await searchByText(query, { topK: 3, minScore: 0.1 });
      
      console.log(`  Default threshold (0.3): ${defaultResults.matches?.length || 0} results`);
      if (defaultResults.matches?.length > 0) {
        defaultResults.matches.forEach((match, i) => {
          console.log(`    ${i+1}. ${match.metadata?.title} (score: ${match.score?.toFixed(3)})`);
        });
      } else {
        console.log('    ✅ No results - query rejected as irrelevant');
      }
      
      console.log(`  Lower threshold (0.1): ${lowResults.matches?.length || 0} results`);
      if (lowResults.matches?.length > 0) {
        lowResults.matches.forEach((match, i) => {
          console.log(`    ${i+1}. ${match.metadata?.title} (score: ${match.score?.toFixed(3)})`);
        });
      }
      
    } catch (error) {
      console.error(`    ❌ Error testing "${query}":`, error.message);
    }
  }
}

// Run the test
testSemanticThreshold().catch(console.error);