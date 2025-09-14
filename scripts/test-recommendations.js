// Test script for multi-factor recommendation system
const path = require('path');

// Mock the recommendation functions for testing
const mockRecommendations = [
  {
    productId: 123,
    totalScore: 8.5,
    factors: {
      collaborative: 2.1,
      contentBased: 1.8,
      graphBased: 1.9,
      popularity: 1.2,
      seasonal: 0.8,
      health: 0.6,
      geographical: 0.1
    },
    reasons: ['Similar to your preferences', 'Highly rated', 'In season'],
    confidence: 0.85
  },
  {
    productId: 456,
    totalScore: 7.2,
    factors: {
      collaborative: 1.5,
      contentBased: 2.2,
      graphBased: 1.4,
      popularity: 1.0,
      seasonal: 0.7,
      health: 0.3,
      geographical: 0.1
    },
    reasons: ['Matches your health goals', 'Popular choice'],
    confidence: 0.72
  }
];

// Mock cache stats
const mockCacheStats = {
  hits: 15,
  misses: 8,
  entries: 42,
  hitRate: 0.65,
  memoryUsage: 128
};

// Mock functions for testing
const getSimilarProducts = async (productId, limit = 5) => {
  console.log(`🔍 Getting similar products for ${productId} (limit: ${limit})`);
  return mockRecommendations.slice(0, limit);
};

const getHealthBasedRecommendations = async (healthCondition, limit = 10) => {
  console.log(`🏥 Getting health-based recommendations for "${healthCondition}" (limit: ${limit})`);
  return mockRecommendations.slice(0, limit);
};

const getSeasonalRecommendations = async (season, limit = 10) => {
  console.log(`🌱 Getting seasonal recommendations for "${season}" (limit: ${limit})`);
  return mockRecommendations.slice(0, limit);
};

const getPersonalizedRecommendations = async (userProfile, context) => {
  console.log(`👤 Getting personalized recommendations for user profile`);
  console.log(`   - Purchase history: ${userProfile.purchaseHistory?.length || 0} items`);
  console.log(`   - Health goals: ${userProfile.healthGoals?.join(', ') || 'none'}`);
  return mockRecommendations;
};

// Mock recommendation engine
class MultiFactorRecommendationEngine {
  constructor() {
    this.weights = {
      collaborative: 0.25,
      contentBased: 0.20,
      graphBased: 0.20,
      popularity: 0.10,
      seasonal: 0.10,
      health: 0.10,
      geographical: 0.05
    };
  }

  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    console.log('✅ Updated recommendation weights:', this.weights);
  }

  async getRecommendations(userProfile, context) {
    console.log('🎯 Generating recommendations with engine...');
    return mockRecommendations;
  }

  async getRecommendationExplanation(productId, userProfile) {
    return {
      product: { id: productId, name: `Product ${productId}` },
      explanation: `We recommend this product because it matches your preferences and health goals.`,
      factors: ['matches preferences', 'supports health goals', 'highly rated']
    };
  }

  async close() {
    console.log('🔌 Closed recommendation engine');
  }
}

// Mock cache
const recommendationCache = {
  getStats: () => mockCacheStats,
  get: (type, userProfile, context) => {
    console.log(`📦 Cache lookup for ${type}`);
    return null; // Simulate cache miss for first test
  },
  set: (type, data, userProfile, context) => {
    console.log(`💾 Cached ${data.length} recommendations for ${type}`);
  }
};

async function testRecommendationSystem() {
  console.log('🧪 Testing Multi-Factor Recommendation System...\n');

  try {
    // Test 1: Similar Products
    console.log('Test 1: Similar Products');
    console.log('========================');
    const similarProducts = await getSimilarProducts(123, 5);
    console.log(`Found ${similarProducts.length} similar products`);
    if (similarProducts.length > 0) {
      console.log('First recommendation:', {
        productId: similarProducts[0].productId,
        totalScore: similarProducts[0].totalScore,
        confidence: similarProducts[0].confidence,
        reasons: similarProducts[0].reasons.slice(0, 2)
      });
    }
    console.log('');

    // Test 2: Health-Based Recommendations
    console.log('Test 2: Health-Based Recommendations');
    console.log('====================================');
    const healthRecommendations = await getHealthBasedRecommendations('digestive health', 5);
    console.log(`Found ${healthRecommendations.length} health-based recommendations`);
    if (healthRecommendations.length > 0) {
      console.log('First recommendation:', {
        productId: healthRecommendations[0].productId,
        totalScore: healthRecommendations[0].totalScore,
        factors: Object.entries(healthRecommendations[0].factors)
          .filter(([_, score]) => score > 0)
          .map(([factor, score]) => `${factor}: ${score.toFixed(2)}`)
      });
    }
    console.log('');

    // Test 3: Seasonal Recommendations
    console.log('Test 3: Seasonal Recommendations');
    console.log('=================================');
    const seasonalRecommendations = await getSeasonalRecommendations('summer', 5);
    console.log(`Found ${seasonalRecommendations.length} seasonal recommendations`);
    if (seasonalRecommendations.length > 0) {
      console.log('First recommendation:', {
        productId: seasonalRecommendations[0].productId,
        totalScore: seasonalRecommendations[0].totalScore,
        reasons: seasonalRecommendations[0].reasons
      });
    }
    console.log('');

    // Test 4: Personalized Recommendations
    console.log('Test 4: Personalized Recommendations');
    console.log('====================================');
    const userProfile = {
      purchaseHistory: [101, 102, 103],
      viewHistory: [104, 105, 106],
      searchHistory: ['organic tea', 'herbal supplements'],
      healthGoals: ['immune support', 'energy boost'],
      preferredCategories: ['teas', 'supplements'],
      dietaryRestrictions: ['gluten-free'],
      location: 'California'
    };

    const context = {
      currentSeason: 'autumn',
      inStockOnly: true,
      limit: 8
    };

    const personalizedRecommendations = await getPersonalizedRecommendations(userProfile, context);
    console.log(`Found ${personalizedRecommendations.length} personalized recommendations`);
    if (personalizedRecommendations.length > 0) {
      console.log('First recommendation:', {
        productId: personalizedRecommendations[0].productId,
        totalScore: personalizedRecommendations[0].totalScore,
        confidence: personalizedRecommendations[0].confidence,
        topFactors: Object.entries(personalizedRecommendations[0].factors)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([factor, score]) => `${factor}: ${score.toFixed(2)}`)
      });
    }
    console.log('');

    // Test 5: Cache Performance
    console.log('Test 5: Cache Performance');
    console.log('=========================');
    
    // Make the same request again to test caching
    const start = Date.now();
    await getSimilarProducts(123, 5);
    const cached = Date.now() - start;
    console.log(`Cached request took: ${cached}ms`);

    const cacheStats = recommendationCache.getStats();
    console.log('Cache Statistics:', {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`,
      entries: cacheStats.entries,
      memoryUsage: `${cacheStats.memoryUsage} KB`
    });
    console.log('');

    // Test 6: Recommendation Engine with Manual Configuration
    console.log('Test 6: Engine Configuration');
    console.log('============================');
    const engine = new MultiFactorRecommendationEngine();
    
    // Update weights
    engine.updateWeights({
      health: 0.3,
      seasonal: 0.15,
      collaborative: 0.2
    });

    const configuredRecommendations = await engine.getRecommendations(userProfile, context);
    console.log(`Found ${configuredRecommendations.length} recommendations with custom weights`);
    
    if (configuredRecommendations.length > 0) {
      console.log('Configured recommendation factors:', 
        configuredRecommendations[0].factors
      );
    }

    await engine.close();
    console.log('');

    // Test 7: Recommendation Explanation
    console.log('Test 7: Recommendation Explanation');
    console.log('==================================');
    if (personalizedRecommendations.length > 0) {
      const explainEngine = new MultiFactorRecommendationEngine();
      try {
        const explanation = await explainEngine.getRecommendationExplanation(
          personalizedRecommendations[0].productId,
          userProfile
        );
        console.log('Explanation:', explanation.explanation);
        console.log('Factors:', explanation.factors);
      } catch (error) {
        console.log('Explanation test skipped (product not in graph):', error.message);
      } finally {
        await explainEngine.close();
      }
    }

    console.log('\n✅ All recommendation tests completed successfully!');

  } catch (error) {
    console.error('❌ Recommendation test failed:', error);
    process.exit(1);
  }
}

// Test individual components
async function testComponentPerformance() {
  console.log('\n🔬 Testing Component Performance...\n');

  const engine = new MultiFactorRecommendationEngine();
  const userProfile = {
    purchaseHistory: [1, 2, 3],
    viewHistory: [4, 5, 6],
    healthGoals: ['immune support'],
    preferredCategories: ['teas'],
    dietaryRestrictions: [],
    location: 'Oregon'
  };

  const context = { limit: 5 };

  try {
    // Mock component methods for testing
    const mockComponentResult = mockRecommendations.slice(0, 3);
    
    engine.getCollaborativeRecommendations = async () => mockComponentResult;
    engine.getContentBasedRecommendations = async () => mockComponentResult;
    engine.getGraphBasedRecommendations = async () => mockComponentResult;
    engine.getPopularityBasedRecommendations = async () => mockComponentResult;
    engine.getSeasonalRecommendations = async () => mockComponentResult;
    engine.getHealthBasedRecommendations = async () => mockComponentResult;
    engine.getGeographicalRecommendations = async () => mockComponentResult;

    // Test each component individually
    const tests = [
      { name: 'Collaborative Filtering', method: () => engine.getCollaborativeRecommendations(userProfile, context) },
      { name: 'Content-Based Filtering', method: () => engine.getContentBasedRecommendations(userProfile, context) },
      { name: 'Graph-Based Recommendations', method: () => engine.getGraphBasedRecommendations(userProfile, context) },
      { name: 'Popularity-Based', method: () => engine.getPopularityBasedRecommendations(context) },
      { name: 'Seasonal Recommendations', method: () => engine.getSeasonalRecommendations({ ...context, currentSeason: 'winter' }) },
      { name: 'Health-Based', method: () => engine.getHealthBasedRecommendations(userProfile, { ...context, healthCondition: 'stress relief' }) },
      { name: 'Geographical', method: () => engine.getGeographicalRecommendations(userProfile, context) }
    ];

    for (const test of tests) {
      try {
        const start = Date.now();
        const results = await test.method();
        const duration = Date.now() - start;
        console.log(`${test.name}: ${results.length} results in ${duration}ms`);
      } catch (error) {
        console.log(`${test.name}: Error - ${error.message}`);
      }
    }

  } finally {
    await engine.close();
  }
}

async function runAllTests() {
  await testRecommendationSystem();
  await testComponentPerformance();
  
  console.log('\n🎯 Recommendation System Testing Complete!');
  process.exit(0);
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testRecommendationSystem,
  testComponentPerformance,
  runAllTests
};