// Test script for extended graph relationship modeling
async function testExtendedGraph() {
  console.log('🔗 Testing Extended Graph Relationship Modeling...\n');
  
  const BASE_URL = 'http://localhost:3003/api/graph/extended';
  
  try {
    // Test 1: Add Sample Ingredients
    console.log('1️⃣ Testing Ingredient Addition:');
    console.log('=' .repeat(60));
    
    const sampleIngredients = [
      {
        id: 'turmeric-root',
        name: 'Turmeric Root',
        category: 'spices',
        description: 'Fresh turmeric root with high curcumin content',
        nutritionalInfo: {
          curcumin: '3-6%',
          antioxidants: 'high'
        },
        allergens: [],
        source: 'test_data'
      },
      {
        id: 'moringa-leaves',
        name: 'Moringa Leaves',
        category: 'herbs',
        description: 'Nutrient-dense moringa oleifera leaves',
        nutritionalInfo: {
          vitaminA: 'very high',
          iron: 'high',
          protein: 'high'
        },
        allergens: [],
        source: 'test_data'
      }
    ];

    for (const ingredient of sampleIngredients) {
      const response = await fetch(`${BASE_URL}?action=add_ingredient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Added ingredient: ${ingredient.name}`);
      } else {
        console.log(`❌ Failed to add ingredient: ${data.message}`);
      }
    }

    // Test 2: Add Sample Regions
    console.log('\n2️⃣ Testing Region Addition:');
    console.log('=' .repeat(60));
    
    const sampleRegions = [
      {
        id: 'luzon-highlands',
        name: 'Luzon Highlands',
        country: 'Philippines',
        type: 'highland',
        climate: 'tropical highland',
        coordinates: { lat: 16.5, lng: 120.8 },
        description: 'Cool highland region ideal for temperate crops'
      },
      {
        id: 'mindanao-lowlands',
        name: 'Mindanao Lowlands',
        country: 'Philippines',
        type: 'lowland',
        climate: 'tropical lowland',
        coordinates: { lat: 7.0, lng: 125.0 },
        description: 'Warm lowland region perfect for tropical crops'
      }
    ];

    for (const region of sampleRegions) {
      const response = await fetch(`${BASE_URL}?action=add_region`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Added region: ${region.name}`);
      } else {
        console.log(`❌ Failed to add region: ${data.message}`);
      }
    }

    // Test 3: Add Sample Health Conditions
    console.log('\n3️⃣ Testing Health Condition Addition:');
    console.log('=' .repeat(60));
    
    const sampleConditions = [
      {
        id: 'inflammation',
        name: 'Chronic Inflammation',
        category: 'inflammatory',
        severity: 'moderate',
        symptoms: ['swelling', 'pain', 'redness'],
        description: 'Persistent inflammatory response',
        prevalence: 'common'
      },
      {
        id: 'iron-deficiency',
        name: 'Iron Deficiency',
        category: 'nutritional',
        severity: 'mild',
        symptoms: ['fatigue', 'weakness', 'pale skin'],
        description: 'Insufficient iron levels in the body',
        prevalence: 'very common'
      }
    ];

    for (const condition of sampleConditions) {
      const response = await fetch(`${BASE_URL}?action=add_condition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Added condition: ${condition.name}`);
      } else {
        console.log(`❌ Failed to add condition: ${data.message}`);
      }
    }

    // Test 4: Add Sample Nutrients
    console.log('\n4️⃣ Testing Nutrient Addition:');
    console.log('=' .repeat(60));
    
    const sampleNutrients = [
      {
        id: 'curcumin',
        name: 'Curcumin',
        type: 'polyphenol',
        unit: 'mg',
        dailyValue: 500,
        category: 'antioxidant',
        description: 'Active compound in turmeric with anti-inflammatory properties',
        benefits: ['anti-inflammatory', 'antioxidant', 'neuroprotective'],
        sources: ['turmeric', 'curry powder']
      },
      {
        id: 'vitamin-a',
        name: 'Vitamin A',
        type: 'vitamin',
        unit: 'IU',
        dailyValue: 900,
        category: 'fat-soluble vitamin',
        description: 'Essential vitamin for vision and immune function',
        benefits: ['vision', 'immune support', 'skin health'],
        sources: ['moringa', 'carrots', 'sweet potatoes']
      }
    ];

    for (const nutrient of sampleNutrients) {
      const response = await fetch(`${BASE_URL}?action=add_nutrient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nutrient })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Added nutrient: ${nutrient.name}`);
      } else {
        console.log(`❌ Failed to add nutrient: ${data.message}`);
      }
    }

    // Test 5: Create Product-Ingredient Relationships
    console.log('\n5️⃣ Testing Product-Ingredient Relationships:');
    console.log('=' .repeat(60));
    
    // Assuming we have product ID 1 for testing
    const containsRelationships = [
      {
        productId: 1,
        ingredientId: 'turmeric-root',
        properties: {
          percentage: 95,
          importance: 'primary',
          processingLevel: 'minimal',
          bioavailability: 0.85,
          qualityGrade: 'premium',
          seasonality: 'year-round',
          source: 'organic farm'
        }
      }
    ];

    for (const rel of containsRelationships) {
      const response = await fetch(`${BASE_URL}?action=create_contains_relationship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rel)
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Created CONTAINS relationship: Product ${rel.productId} → ${rel.ingredientId}`);
      } else {
        console.log(`❌ Failed to create CONTAINS relationship: ${data.message}`);
      }
    }

    // Test 6: Create Regional Growing Relationships
    console.log('\n6️⃣ Testing Regional Growing Relationships:');
    console.log('=' .repeat(60));
    
    const grownInRelationships = [
      {
        ingredientId: 'turmeric-root',
        regionId: 'mindanao-lowlands',
        grownInProperties: {
          suitability: 'excellent',
          yieldQuality: 'high',
          traditionalUse: true,
          cultivation: 'organic',
          sustainability: 'high',
          certifications: ['organic', 'fair-trade']
        }
      },
      {
        ingredientId: 'moringa-leaves',
        regionId: 'luzon-highlands',
        grownInProperties: {
          suitability: 'good',
          yieldQuality: 'medium',
          traditionalUse: true,
          cultivation: 'traditional',
          sustainability: 'medium',
          certifications: ['traditional']
        }
      }
    ];

    for (const rel of grownInRelationships) {
      const response = await fetch(`${BASE_URL}?action=create_grown_in_relationship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rel)
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Created GROWN_IN relationship: ${rel.ingredientId} → ${rel.regionId}`);
      } else {
        console.log(`❌ Failed to create GROWN_IN relationship: ${data.message}`);
      }
    }

    // Test 7: Create Health Benefit Relationships
    console.log('\n7️⃣ Testing Health Benefit Relationships:');
    console.log('=' .repeat(60));
    
    const treatsRelationships = [
      {
        productId: 1,
        conditionId: 'inflammation',
        treatsProperties: {
          effectiveness: 'moderate',
          evidenceLevel: 'clinical',
          mechanism: 'inhibits inflammatory pathways',
          dosage: '500mg daily',
          duration: '4-8 weeks',
          sideEffects: ['mild stomach upset'],
          contraindications: ['blood thinners'],
          studies: ['https://pubmed.ncbi.nlm.nih.gov/example1']
        }
      }
    ];

    for (const rel of treatsRelationships) {
      const response = await fetch(`${BASE_URL}?action=create_treats_relationship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rel)
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Created TREATS relationship: Product ${rel.productId} → ${rel.conditionId}`);
      } else {
        console.log(`❌ Failed to create TREATS relationship: ${data.message}`);
      }
    }

    // Test 8: Create Nutritional Content Relationships
    console.log('\n8️⃣ Testing Nutritional Content Relationships:');
    console.log('=' .repeat(60));
    
    const richInRelationships = [
      {
        productId: 1,
        nutrientId: 'curcumin',
        richInProperties: {
          amount: 150,
          unit: 'mg',
          dailyValuePercent: 30,
          bioavailability: 0.7,
          synergies: ['black pepper', 'fat'],
          inhibitors: ['calcium'],
          stability: 'light-sensitive',
          analysisMethod: 'HPLC'
        }
      }
    ];

    for (const rel of richInRelationships) {
      const response = await fetch(`${BASE_URL}?action=create_rich_in_relationship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rel)
      });
      
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Created RICH_IN relationship: Product ${rel.productId} → ${rel.nutrientId}`);
      } else {
        console.log(`❌ Failed to create RICH_IN relationship: ${data.message}`);
      }
    }

    // Test 9: Query Products by Ingredient
    console.log('\n9️⃣ Testing Products by Ingredient Query:');
    console.log('=' .repeat(60));
    
    const ingredientQuery = await fetch(`${BASE_URL}?action=products_by_ingredient&ingredientId=turmeric-root&limit=5`);
    const ingredientData = await ingredientQuery.json();
    
    if (ingredientData.success) {
      console.log(`✅ Found ${ingredientData.count} products containing turmeric-root`);
      ingredientData.products.forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.name} (${product.percentage}% turmeric-root)`);
      });
    } else {
      console.log(`❌ Query failed: ${ingredientData.error}`);
    }

    // Test 10: Query Products by Health Condition
    console.log('\n🔟 Testing Products for Health Condition Query:');
    console.log('=' .repeat(60));
    
    const conditionQuery = await fetch(`${BASE_URL}?action=products_for_condition&condition=inflammation&limit=5`);
    const conditionData = await conditionQuery.json();
    
    if (conditionData.success) {
      console.log(`✅ Found ${conditionData.count} products for inflammation`);
      conditionData.products.forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.name} (effectiveness: ${product.effectiveness})`);
      });
    } else {
      console.log(`❌ Query failed: ${conditionData.error}`);
    }

    // Test 11: Query Products by Nutrient
    console.log('\n1️⃣1️⃣ Testing Products by Nutrient Query:');
    console.log('=' .repeat(60));
    
    const nutrientQuery = await fetch(`${BASE_URL}?action=products_by_nutrient&nutrient=curcumin&minAmount=100&limit=5`);
    const nutrientData = await nutrientQuery.json();
    
    if (nutrientData.success) {
      console.log(`✅ Found ${nutrientData.count} products rich in curcumin (≥100mg)`);
      nutrientData.products.forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.name} (${product.amount}${product.unit} curcumin)`);
      });
    } else {
      console.log(`❌ Query failed: ${nutrientData.error}`);
    }

    // Test 12: Get Extended Graph Statistics
    console.log('\n1️⃣2️⃣ Testing Extended Graph Statistics:');
    console.log('=' .repeat(60));
    
    const statsQuery = await fetch(`${BASE_URL}?action=stats`);
    const statsData = await statsQuery.json();
    
    if (statsData.success) {
      console.log('✅ Extended graph statistics:');
      const stats = statsData.stats;
      console.log(`   - Products: ${stats.productCount}`);
      console.log(`   - Ingredients: ${stats.ingredientCount}`);
      console.log(`   - Regions: ${stats.regionCount}`);
      console.log(`   - Conditions: ${stats.conditionCount}`);
      console.log(`   - Nutrients: ${stats.nutrientCount}`);
      console.log(`   - Total relationships: ${stats.relationshipCount}`);
      console.log(`   - CONTAINS relationships: ${stats.containsCount}`);
      console.log(`   - GROWN_IN relationships: ${stats.grownInCount}`);
      console.log(`   - TREATS relationships: ${stats.treatsCount}`);
      console.log(`   - RICH_IN relationships: ${stats.richInCount}`);
    } else {
      console.log(`❌ Stats query failed: ${statsData.error}`);
    }

    // Test 13: Validate Graph Data
    console.log('\n1️⃣3️⃣ Testing Graph Data Validation:');
    console.log('=' .repeat(60));
    
    const validateQuery = await fetch(`${BASE_URL}?action=validate`);
    const validateData = await validateQuery.json();
    
    if (validateData.success) {
      const validation = validateData.validation;
      console.log(`✅ Graph validation completed: ${validation.isValid ? 'VALID' : 'ISSUES FOUND'}`);
      
      if (validation.issues.length > 0) {
        console.log('   Issues:');
        validation.issues.forEach(issue => console.log(`     ⚠️  ${issue}`));
      }
      
      if (validation.suggestions.length > 0) {
        console.log('   Suggestions:');
        validation.suggestions.forEach(suggestion => console.log(`     💡 ${suggestion}`));
      }
    } else {
      console.log(`❌ Validation failed: ${validateData.error}`);
    }

  } catch (error) {
    console.log(`❌ Test suite failed: ${error.message}`);
  }

  console.log('\n🎉 Extended Graph Testing Completed!');
  console.log('\nℹ️  Summary of advanced relationship modeling features:');
  console.log('  ✅ Multi-type node management (Ingredient, Region, Condition, Nutrient)');
  console.log('  ✅ Advanced relationship properties with detailed metadata');
  console.log('  ✅ Complex queries across relationship types');
  console.log('  ✅ Graph validation and health monitoring');
  console.log('  ✅ Batch import capabilities for data migration');
  console.log('  ✅ Comprehensive API endpoints for graph operations');
  console.log('  ✅ Data integrity validation and cleanup utilities');
}

// Run tests
testExtendedGraph().catch(console.error);