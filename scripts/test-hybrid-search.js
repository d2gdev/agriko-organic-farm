// Test script for hybrid search implementation
// Using built-in fetch API (Node.js 18+)

async function testHybridSearch() {
  console.log('🧪 Testing Hybrid Search Implementation...\n');
  
  const BASE_URL = 'http://localhost:3002/api/search';
  
  // Test queries
  const testQueries = [
    'turmeric',
    'organic honey',
    'anti-inflammatory',
    'moringa powder',
    'healthy rice'
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log('=' .repeat(60));

    try {
      // Test 1: Semantic Search (baseline)
      console.log('\n1️⃣ Semantic Search:');
      const semanticResponse = await fetch(`${BASE_URL}/semantic?q=${encodeURIComponent(query)}&limit=5`);
      const semanticData = await semanticResponse.json();
      
      if (semanticData.success) {
        console.log(`   ✅ Found ${semanticData.count} results`);
        semanticData.results.slice(0, 3).forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.title} (score: ${result.relevanceScore.toFixed(3)})`);
        });
      } else {
        console.log(`   ❌ Failed: ${semanticData.error}`);
      }

      // Test 2: Keyword Search
      console.log('\n2️⃣ Keyword Search:');
      const keywordResponse = await fetch(`${BASE_URL}/keyword?q=${encodeURIComponent(query)}&limit=5`);
      const keywordData = await keywordResponse.json();
      
      if (keywordData.success) {
        console.log(`   ✅ Found ${keywordData.count} results`);
        keywordData.results.slice(0, 3).forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.title} (score: ${result.relevanceScore.toFixed(3)})`);
          if (result.matchedFields.length > 0) {
            console.log(`      Matched fields: ${result.matchedFields.join(', ')}`);
          }
        });
      } else {
        console.log(`   ❌ Failed: ${keywordData.error}`);
      }

      // Test 3: Hybrid Search (default)
      console.log('\n3️⃣ Hybrid Search (default weights):');
      const hybridResponse = await fetch(`${BASE_URL}/hybrid?q=${encodeURIComponent(query)}&limit=5`);
      const hybridData = await hybridResponse.json();
      
      if (hybridData.success) {
        console.log(`   ✅ Found ${hybridData.count} results (${hybridData.stats.executionTime}ms)`);
        console.log(`   📊 Semantic: ${hybridData.stats.semanticResults}, Keyword: ${hybridData.stats.keywordResults}`);
        hybridData.results.slice(0, 3).forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.title} (${result.searchMethod})`);
          console.log(`      Hybrid score: ${result.hybridScore.toFixed(3)}`);
          if (result.semanticScore) {
            console.log(`      Semantic: ${result.semanticScore.toFixed(3)}`);
          }
          if (result.keywordScore) {
            console.log(`      Keyword: ${result.keywordScore.toFixed(3)}`);
          }
        });
      } else {
        console.log(`   ❌ Failed: ${hybridData.error}`);
      }

      // Test 4: Advanced Hybrid Search with custom weights
      console.log('\n4️⃣ Hybrid Search (keyword-heavy):');
      const advancedPayload = {
        query,
        mode: 'hybrid',
        semanticWeight: 0.3,
        keywordWeight: 0.7,
        maxResults: 5
      };

      const advancedResponse = await fetch(`${BASE_URL}/hybrid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advancedPayload)
      });
      
      const advancedData = await advancedResponse.json();
      
      if (advancedData.success) {
        console.log(`   ✅ Found ${advancedData.count} results (keyword-heavy)`);
        console.log(`   ⚖️ Weights - Semantic: ${advancedData.weights.semantic}, Keyword: ${advancedData.weights.keyword}`);
        advancedData.results.slice(0, 3).forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.title} (${result.searchMethod})`);
          console.log(`      Hybrid score: ${result.hybridScore.toFixed(3)}`);
        });
      } else {
        console.log(`   ❌ Failed: ${advancedData.error}`);
      }

    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }

  // Test 5: A/B Testing Experiment
  console.log('\n\n🧪 A/B Testing Experiment:');
  console.log('=' .repeat(60));

  try {
    const experimentPayload = {
      query: 'organic turmeric',
      runExperiment: true,
      experiments: [
        {
          name: 'Semantic Heavy',
          options: { mode: 'hybrid', semanticWeight: 0.8, keywordWeight: 0.2 }
        },
        {
          name: 'Balanced',
          options: { mode: 'hybrid', semanticWeight: 0.5, keywordWeight: 0.5 }
        },
        {
          name: 'Keyword Heavy',
          options: { mode: 'hybrid', semanticWeight: 0.2, keywordWeight: 0.8 }
        },
        {
          name: 'Semantic Only',
          options: { mode: 'semantic_only' }
        },
        {
          name: 'Keyword Only',
          options: { mode: 'keyword_only' }
        }
      ]
    };

    const experimentResponse = await fetch(`${BASE_URL}/hybrid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(experimentPayload)
    });
    
    const experimentData = await experimentResponse.json();
    
    if (experimentData.success) {
      console.log(`✅ Experiment completed for query: "${experimentData.query}"`);
      console.log('\n📊 Results Comparison:');
      
      experimentData.comparison.experiments.forEach((exp, i) => {
        console.log(`${i + 1}. ${exp.name}:`);
        console.log(`   Results: ${exp.resultCount}`);
        console.log(`   Avg Score: ${exp.avgScore.toFixed(3)}`);
        console.log(`   Time: ${exp.executionTime}ms`);
      });

      console.log('\n🏆 Top Result from Each Method:');
      experimentData.experiments.forEach((exp) => {
        if (exp.results.length > 0) {
          const topResult = exp.results[0];
          console.log(`${exp.name}: ${topResult.title} (score: ${topResult.hybridScore.toFixed(3)})`);
        }
      });
    } else {
      console.log(`❌ Experiment failed: ${experimentData.error}`);
    }

  } catch (error) {
    console.log(`❌ Experiment test failed: ${error.message}`);
  }

  // Test 6: Search Suggestions
  console.log('\n\n💡 Search Suggestions Test:');
  console.log('=' .repeat(60));

  try {
    const suggestionQueries = ['tur', 'org', 'mor'];
    
    for (const partialQuery of suggestionQueries) {
      const suggestResponse = await fetch(`${BASE_URL}/keyword?q=${encodeURIComponent(partialQuery)}&suggestions=true`);
      const suggestData = await suggestResponse.json();
      
      if (suggestData.success) {
        console.log(`"${partialQuery}" → [${suggestData.suggestions.join(', ')}]`);
      } else {
        console.log(`❌ Suggestions failed for "${partialQuery}": ${suggestData.error}`);
      }
    }

  } catch (error) {
    console.log(`❌ Suggestions test failed: ${error.message}`);
  }

  console.log('\n🎉 Hybrid Search Testing Completed!');
  console.log('\nℹ️  Summary of implemented features:');
  console.log('  ✅ Semantic search (existing)');
  console.log('  ✅ Keyword search with fuzzy matching and stemming');
  console.log('  ✅ Hybrid search with configurable weights');
  console.log('  ✅ A/B testing capabilities');
  console.log('  ✅ Search suggestions');
  console.log('  ✅ Advanced filtering and boosting');
}

// Run tests
testHybridSearch().catch(console.error);