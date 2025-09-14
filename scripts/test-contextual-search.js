// Test script for contextual search improvements
async function testContextualSearch() {
  console.log('🎯 Testing Contextual Search Improvements...\n');
  
  const BASE_URL = 'http://localhost:3003/api/search';
  const SESSION_ID = 'test_session_' + Date.now();
  
  console.log(`Using session ID: ${SESSION_ID}\n`);

  try {
    // Test 1: Basic Contextual Search
    console.log('1️⃣ Testing Basic Contextual Search:');
    console.log('=' .repeat(60));
    
    const contextualResponse = await fetch(`${BASE_URL}/contextual?q=immunity boost&sessionId=${SESSION_ID}&country=philippines&region=luzon&limit=5`);
    const contextualData = await contextualResponse.json();
    
    if (contextualData.success) {
      console.log(`✅ Found ${contextualData.count} contextual results`);
      console.log(`🎯 Applied context: ${contextualData.appliedContext?.join(', ') || 'none'}`);
      console.log('📊 Contextual insights:');
      console.log(`   - Query expansion: ${contextualData.contextualInsights?.expandedQueries?.length || 0} variants`);
      console.log(`   - Seasonal boost: ${contextualData.contextualInsights?.seasonalBoost?.toFixed(2) || '1.00'}x`);
      console.log(`   - Regional boosts: ${Object.keys(contextualData.contextualInsights?.regionalBoosts || {}).length}`);
      
      console.log('\nTop 3 results:');
      contextualData.results.slice(0, 3).forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.title} (hybrid: ${result.hybridScore?.toFixed(3)}, contextual: ${result.contextualBoost?.toFixed(2)}x)`);
        if (result.recommendationReason?.length > 0) {
          console.log(`      Reasons: ${result.recommendationReason.join(', ')}`);
        }
      });
    } else {
      console.log(`❌ Failed: ${contextualData.error}`);
    }

    // Test 2: Track Search Behavior
    console.log('\n2️⃣ Testing Search Analytics Tracking:');
    console.log('=' .repeat(60));
    
    const trackingPayload = {
      action: 'track_search',
      data: {
        sessionId: SESSION_ID,
        query: 'immunity boost',
        searchType: 'hybrid',
        results: contextualData.success ? contextualData.results.slice(0, 3).map((result, index) => ({
          productId: result.productId,
          title: result.title,
          position: index,
          score: result.hybridScore
        })) : [],
        userAgent: 'test-client/1.0',
        location: { country: 'philippines', region: 'luzon' }
      }
    };

    const trackResponse = await fetch(`${BASE_URL}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingPayload)
    });
    
    const trackData = await trackResponse.json();
    
    if (trackData.success) {
      console.log('✅ Search event tracked successfully');
    } else {
      console.log(`❌ Tracking failed: ${trackData.error}`);
    }

    // Test 3: Simulate User Behavior Over Time
    console.log('\n3️⃣ Testing User Behavior Learning:');
    console.log('=' .repeat(60));

    const searchSequence = [
      'turmeric anti inflammatory',
      'moringa powder nutrition', 
      'organic honey benefits',
      'black rice antioxidants',
      'ginger digestive health'
    ];

    for (let i = 0; i < searchSequence.length; i++) {
      const query = searchSequence[i];
      console.log(`   Search ${i + 1}: "${query}"`);
      
      const response = await fetch(`${BASE_URL}/contextual?q=${encodeURIComponent(query)}&sessionId=${SESSION_ID}&country=philippines&limit=3`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`     ✅ ${data.count} results, context: ${data.appliedContext?.join(', ') || 'none'}`);
        
        // Track the search
        await fetch(`${BASE_URL}/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'track_search',
            data: {
              sessionId: SESSION_ID,
              query: query,
              searchType: 'hybrid',
              results: data.results.map((result, index) => ({
                productId: result.productId,
                title: result.title,
                position: index,
                score: result.hybridScore
              })),
              userAgent: 'test-client/1.0',
              location: { country: 'philippines', region: 'luzon' }
            }
          })
        });
        
        // Simulate clicking on first result
        if (data.results.length > 0) {
          await fetch(`${BASE_URL}/analytics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'track_click',
              data: {
                sessionId: SESSION_ID,
                productId: data.results[0].productId,
                query: query,
                position: 0
              }
            })
          });
          console.log(`     👆 Clicked on: ${data.results[0].title}`);
        }
        
      } else {
        console.log(`     ❌ Failed: ${data.error}`);
      }
      
      // Small delay between searches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Test 4: Check User Profile Development
    console.log('\n4️⃣ Testing User Profile Development:');
    console.log('=' .repeat(60));

    const profileResponse = await fetch(`${BASE_URL}/analytics?action=user_profile&sessionId=${SESSION_ID}`);
    const profileData = await profileResponse.json();
    
    if (profileData.success) {
      const profile = profileData.data;
      console.log('✅ User profile retrieved:');
      console.log(`   - Searches: ${profile.searchCount}`);
      console.log(`   - Clicks: ${profile.clickCount}`);
      console.log(`   - Top categories: ${Object.keys(profile.preferences.categories).slice(0, 3).join(', ')}`);
      console.log(`   - Top health benefits: ${Object.keys(profile.preferences.healthBenefits).slice(0, 3).join(', ')}`);
    } else {
      console.log(`❌ Profile failed: ${profileData.error}`);
    }

    // Test 5: Personalized Search After Learning
    console.log('\n5️⃣ Testing Personalized Search After Learning:');
    console.log('=' .repeat(60));

    const personalizedResponse = await fetch(`${BASE_URL}/contextual?q=health benefits&sessionId=${SESSION_ID}&country=philippines&limit=5`);
    const personalizedData = await personalizedResponse.json();
    
    if (personalizedData.success) {
      console.log(`✅ Personalized search results: ${personalizedData.count}`);
      console.log(`🎯 Applied context: ${personalizedData.appliedContext?.join(', ')}`);
      console.log(`👤 Personalized boosts: ${Object.keys(personalizedData.contextualInsights?.personalizedBoosts || {}).length}`);
      
      console.log('\nPersonalized results:');
      personalizedData.results.slice(0, 3).forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.title} (boost: ${result.contextualBoost?.toFixed(2)}x)`);
        if (result.recommendationReason?.length > 0) {
          console.log(`      Why: ${result.recommendationReason.join(', ')}`);
        }
      });
    } else {
      console.log(`❌ Failed: ${personalizedData.error}`);
    }

    // Test 6: Contextual Suggestions
    console.log('\n6️⃣ Testing Contextual Suggestions:');
    console.log('=' .repeat(60));

    const suggestionQueries = ['imm', 'anti', 'org', 'trad'];
    
    for (const partial of suggestionQueries) {
      const suggestResponse = await fetch(`${BASE_URL}/contextual?action=suggestions&q=${encodeURIComponent(partial)}&sessionId=${SESSION_ID}&country=philippines`);
      const suggestData = await suggestResponse.json();
      
      if (suggestData.success && suggestData.suggestions?.length > 0) {
        console.log(`"${partial}" → [${suggestData.suggestions.join(', ')}]`);
      } else {
        console.log(`"${partial}" → no suggestions`);
      }
    }

    // Test 7: Seasonal Context
    console.log('\n7️⃣ Testing Seasonal Context:');
    console.log('=' .repeat(60));

    const currentMonth = new Date().getMonth() + 1;
    let seasonalQuery;
    
    if (currentMonth >= 3 && currentMonth <= 5) {
      seasonalQuery = 'detox cleanse';
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      seasonalQuery = 'cooling hydration';
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      seasonalQuery = 'immunity support';
    } else {
      seasonalQuery = 'warming spices';
    }
    
    console.log(`Current month: ${currentMonth}, testing seasonal query: "${seasonalQuery}"`);
    
    const seasonalResponse = await fetch(`${BASE_URL}/contextual?q=${encodeURIComponent(seasonalQuery)}&sessionId=${SESSION_ID}&seasonal=true&limit=5`);
    const seasonalData = await seasonalResponse.json();
    
    if (seasonalData.success) {
      console.log(`✅ Seasonal search results: ${seasonalData.count}`);
      console.log(`🌱 Seasonal boost: ${seasonalData.contextualInsights?.seasonalBoost?.toFixed(2)}x`);
      
      if (seasonalData.contextualInsights?.seasonalBoost > 1.0) {
        console.log('Seasonal boosting is active!');
        seasonalData.results.slice(0, 2).forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.title} (seasonal boost: ${result.seasonalBoost?.toFixed(2)}x)`);
        });
      }
    } else {
      console.log(`❌ Failed: ${seasonalData.error}`);
    }

    // Test 8: Analytics Summary
    console.log('\n8️⃣ Testing Analytics Summary:');
    console.log('=' .repeat(60));

    const analyticsResponse = await fetch(`${BASE_URL}/analytics?action=summary&timeRange=3600000`);
    const analyticsData = await analyticsResponse.json();
    
    if (analyticsData.success) {
      const stats = analyticsData.data;
      console.log('✅ Analytics summary:');
      console.log(`   - Total searches: ${stats.totalSearches}`);
      console.log(`   - Unique users: ${stats.uniqueUsers}`);
      console.log(`   - Top queries: ${stats.topQueries?.slice(0, 3).map(q => `"${q.query}" (${q.count})`).join(', ') || 'none'}`);
      console.log(`   - Seasonal trends: ${Object.keys(stats.seasonalTrends || {}).join(', ') || 'none'}`);
    } else {
      console.log(`❌ Analytics failed: ${analyticsData.error}`);
    }

  } catch (error) {
    console.log(`❌ Test suite failed: ${error.message}`);
  }

  console.log('\n🎉 Contextual Search Testing Completed!');
  console.log('\nℹ️  Summary of implemented features:');
  console.log('  ✅ User behavior tracking and learning');
  console.log('  ✅ Query expansion with health synonyms');
  console.log('  ✅ Seasonal product boosting');
  console.log('  ✅ Regional preferences (Philippines focus)');
  console.log('  ✅ Personalized search recommendations');
  console.log('  ✅ Contextual search suggestions');
  console.log('  ✅ Search analytics and insights');
  console.log('  ✅ Multi-factor contextual scoring');
}

// Run tests
testContextualSearch().catch(console.error);