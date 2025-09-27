/**
 * Migrate data from local Qdrant to remote Qdrant
 * Transfers all points from local collections to remote
 */

const { QdrantClient } = require('@qdrant/qdrant-js');

// Configuration
const LOCAL_QDRANT_URL = 'http://localhost:6335';
const REMOTE_QDRANT_URL = 'http://143.42.189.57:6333';

// Initialize clients
const localClient = new QdrantClient({ url: LOCAL_QDRANT_URL });
const remoteClient = new QdrantClient({ url: REMOTE_QDRANT_URL });

async function migrateCollection(collectionName) {
  console.warn(`\n📦 Migrating collection: ${collectionName}`);

  try {
    // Check if collection exists on local
    let localCollection;
    try {
      localCollection = await localClient.getCollection(collectionName);
      console.warn(`  ✓ Found local collection with ${localCollection.points_count} points`);
    } catch (error) {
      console.warn(`  ⚠️ Collection doesn't exist locally, skipping`);
      return { collection: collectionName, status: 'skipped', reason: 'not found locally' };
    }

    if (localCollection.points_count === 0) {
      console.warn(`  ⚠️ No points to migrate`);
      return { collection: collectionName, status: 'skipped', reason: 'empty' };
    }

    // Check/create collection on remote
    let remoteCollection;
    try {
      remoteCollection = await remoteClient.getCollection(collectionName);
      console.warn(`  ✓ Remote collection exists`);
    } catch (error) {
      // Create collection on remote with same config
      console.warn(`  📝 Creating remote collection`);
      await remoteClient.createCollection(collectionName, {
        vectors: localCollection.config.params.vectors,
        optimizers_config: localCollection.config.optimizer_config,
        replication_factor: 2,
      });
      console.warn(`  ✓ Remote collection created`);
    }

    // Fetch all points from local collection
    console.warn(`  📥 Fetching points from local...`);
    const batchSize = 100;
    let offset = 0;
    let totalMigrated = 0;

    while (offset < localCollection.points_count) {
      // Scroll through local collection
      const batch = await localClient.scroll(collectionName, {
        limit: batchSize,
        offset,
        with_payload: true,
        with_vector: true,
      });

      if (!batch.points || batch.points.length === 0) break;

      console.warn(`  📤 Migrating batch: ${offset + 1}-${offset + batch.points.length}`);

      // Prepare points for upsert
      const points = batch.points.map(point => ({
        id: point.id,
        vector: point.vector,
        payload: point.payload,
      }));

      // Upsert to remote
      await remoteClient.upsert(collectionName, {
        wait: true,
        points,
      });

      totalMigrated += batch.points.length;
      offset += batchSize;
    }

    console.warn(`  ✅ Migrated ${totalMigrated} points successfully`);
    return { collection: collectionName, status: 'success', migrated: totalMigrated };

  } catch (error) {
    console.error(`  ❌ Error migrating ${collectionName}:`, error.message);
    return { collection: collectionName, status: 'error', error: error.message };
  }
}

async function main() {
  console.warn('🚀 Starting Local to Remote Qdrant Migration');
  console.warn(`📍 Local: ${LOCAL_QDRANT_URL}`);
  console.warn(`📍 Remote: ${REMOTE_QDRANT_URL}`);

  const results = [];

  try {
    // Test connections
    console.warn('\n🔗 Testing connections...');

    try {
      await localClient.api('cluster').clusterStatus();
      console.warn('  ✓ Local Qdrant connected');
    } catch (error) {
      console.error('  ❌ Failed to connect to local Qdrant');
      console.error('     Make sure local Qdrant is running on port 6335');
      process.exit(1);
    }

    try {
      await remoteClient.api('cluster').clusterStatus();
      console.warn('  ✓ Remote Qdrant connected');
    } catch (error) {
      console.error('  ❌ Failed to connect to remote Qdrant');
      console.error('     Check network connectivity and firewall settings');
      process.exit(1);
    }

    // Get list of collections from local
    console.warn('\n📋 Fetching local collections...');
    const localCollections = await localClient.getCollections();

    if (localCollections.collections.length === 0) {
      console.warn('  ⚠️ No collections found on local Qdrant');
      process.exit(0);
    }

    console.warn(`  ✓ Found ${localCollections.collections.length} collections`);
    for (const coll of localCollections.collections) {
      console.warn(`    - ${coll.name}`);
    }

    // Migrate each collection
    console.warn('\n🔄 Starting migration...');
    for (const collection of localCollections.collections) {
      const result = await migrateCollection(collection.name);
      results.push(result);
    }

    // Summary
    console.warn('\n' + '='.repeat(60));
    console.warn('📊 MIGRATION SUMMARY');
    console.warn('='.repeat(60));

    let totalSuccess = 0;
    let totalPoints = 0;

    for (const result of results) {
      const status = result.status === 'success' ? '✅' :
                     result.status === 'skipped' ? '⚠️' : '❌';
      console.warn(`${status} ${result.collection}: ${result.status}`);

      if (result.migrated) {
        console.warn(`   Migrated: ${result.migrated} points`);
        totalSuccess++;
        totalPoints += result.migrated;
      }
      if (result.reason) {
        console.warn(`   Reason: ${result.reason}`);
      }
      if (result.error) {
        console.warn(`   Error: ${result.error}`);
      }
    }

    console.warn('\n' + '='.repeat(60));
    console.warn(`✨ Migration Complete!`);
    console.warn(`   Collections migrated: ${totalSuccess}`);
    console.warn(`   Total points transferred: ${totalPoints}`);

    // Verify remote collections
    console.warn('\n🔍 Verifying remote collections...');
    const remoteCollections = await remoteClient.getCollections();
    for (const coll of remoteCollections.collections) {
      const info = await remoteClient.getCollection(coll.name);
      console.warn(`  - ${coll.name}: ${info.points_count} points`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
main();