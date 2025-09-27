/**
 * Check Remote Qdrant Instance
 * Connects to the remote Qdrant and lists existing collections
 */

const { QdrantClient } = require('@qdrant/qdrant-js');

async function checkRemoteQdrant() {
  console.warn('🔍 Checking Remote Qdrant Instance\n');
  console.warn('📍 Remote URL: http://143.42.189.57:6333\n');

  const qdrant = new QdrantClient({
    url: 'http://143.42.189.57:6333',
  });

  try {
    // Check connection
    console.warn('Testing connection...');
    const health = await qdrant.api('cluster').clusterStatus();
    console.warn('✅ Connected successfully!\n');

    // List existing collections
    console.warn('📦 Existing Collections:');
    const collections = await qdrant.getCollections();

    if (collections.collections.length === 0) {
      console.warn('  No collections found\n');
    } else {
      for (const collection of collections.collections) {
        console.warn(`  - ${collection.name}`);

        // Get collection info
        try {
          const info = await qdrant.getCollection(collection.name);
          console.warn(`    Points: ${info.points_count}`);
          console.warn(`    Vectors: ${info.config.params.vectors.size}D`);
          console.warn(`    Distance: ${info.config.params.vectors.distance}`);
        } catch (error) {
          console.warn(`    (Could not get details)`);
        }
      }
    }

    // Check specifically for mentioned collections
    console.warn('\n📋 Checking for specific collections:');
    const specificCollections = ['agriko_products', 'products'];

    for (const collName of specificCollections) {
      try {
        const collection = await qdrant.getCollection(collName);
        console.warn(`  ✅ ${collName}: ${collection.points_count} points`);
      } catch (error) {
        console.warn(`  ❌ ${collName}: Not found`);
      }
    }

  } catch (error) {
    console.error('❌ Failed to connect to remote Qdrant:', error.message);
    console.error('\nPossible issues:');
    console.error('  1. Remote server might be down');
    console.error('  2. Network connectivity issues');
    console.error('  3. Firewall blocking port 6333');
  }
}

// Run check
checkRemoteQdrant();