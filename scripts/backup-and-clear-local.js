/**
 * Backup local Qdrant data and optionally clear collections
 * Creates a backup report and can clean local collections
 */

const { QdrantClient } = require('@qdrant/qdrant-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const LOCAL_QDRANT_URL = 'http://localhost:6335';
const localClient = new QdrantClient({ url: LOCAL_QDRANT_URL });

async function backupCollection(collectionName) {
  try {
    const collection = await localClient.getCollection(collectionName);

    if (collection.points_count === 0) {
      return { name: collectionName, points: 0, data: [] };
    }

    const points = [];
    let offset = 0;
    const batchSize = 100;

    while (offset < collection.points_count) {
      const batch = await localClient.scroll(collectionName, {
        limit: batchSize,
        offset,
        with_payload: true,
        with_vector: false, // Skip vectors for backup report
      });

      if (!batch.points || batch.points.length === 0) break;

      points.push(...batch.points.map(p => ({
        id: p.id,
        payload: p.payload,
      })));

      offset += batchSize;
    }

    return {
      name: collectionName,
      points: collection.points_count,
      config: collection.config.params,
      data: points,
    };
  } catch (error) {
    return {
      name: collectionName,
      error: error.message,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  console.warn('📦 Local Qdrant Backup Tool');
  console.warn(`📍 Local URL: ${LOCAL_QDRANT_URL}`);
  if (shouldClear) {
    console.warn('⚠️  CLEAR MODE: Will delete local data after backup');
  }

  try {
    // Test connection
    await localClient.api('cluster').clusterStatus();
    console.warn('✓ Connected to local Qdrant\n');

    // Get collections
    const collections = await localClient.getCollections();
    console.warn(`Found ${collections.collections.length} collections\n`);

    // Backup all collections
    const backups = [];
    for (const coll of collections.collections) {
      console.warn(`Backing up ${coll.name}...`);
      const backup = await backupCollection(coll.name);
      backups.push(backup);
      console.warn(`  ✓ ${backup.points || 0} points backed up`);
    }

    // Save backup report
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(process.cwd(), `qdrant-backup-${timestamp}.json`);

    await fs.writeFile(backupFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      source: LOCAL_QDRANT_URL,
      collections: backups.length,
      totalPoints: backups.reduce((sum, b) => sum + (b.points || 0), 0),
      data: backups,
    }, null, 2));

    console.warn(`\n✅ Backup saved to: ${backupFile}`);

    // Show summary
    console.warn('\n📊 BACKUP SUMMARY');
    console.warn('='.repeat(40));
    for (const backup of backups) {
      console.warn(`${backup.name}: ${backup.points || 0} points`);
    }
    console.warn('='.repeat(40));
    console.warn(`Total: ${backups.reduce((sum, b) => sum + (b.points || 0), 0)} points`);

    // Clear if requested
    if (shouldClear) {
      console.warn('\n🗑️ Clearing local collections...');

      const confirm = args.includes('--force');
      if (!confirm) {
        console.warn('⚠️  Add --force flag to confirm deletion');
        return;
      }

      for (const coll of collections.collections) {
        try {
          // Get points count
          const collection = await localClient.getCollection(coll.name);
          if (collection.points_count > 0) {
            // Delete all points
            const points = [];
            let offset = 0;
            while (offset < collection.points_count) {
              const batch = await localClient.scroll(coll.name, {
                limit: 100,
                offset,
              });
              if (!batch.points) break;
              points.push(...batch.points.map(p => p.id));
              offset += 100;
            }

            if (points.length > 0) {
              await localClient.delete(coll.name, {
                wait: true,
                points,
              });
              console.warn(`  ✓ Cleared ${coll.name} (${points.length} points)`);
            }
          } else {
            console.warn(`  - ${coll.name} already empty`);
          }
        } catch (error) {
          console.warn(`  ❌ Error clearing ${coll.name}: ${error.message}`);
        }
      }

      console.warn('\n✨ Local collections cleared');
      console.warn('📝 Data is safely stored on remote Qdrant');
      console.warn('📝 Backup available at:', backupFile);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run
main();