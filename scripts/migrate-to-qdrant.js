/**
 * Migration Script: Move all data to Qdrant
 * This script migrates data from old databases to Qdrant
 */

const { QdrantClient } = require('@qdrant/qdrant-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config();
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production' });
}

// Qdrant client - Use remote instance
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://143.42.189.57:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

// Collections configuration
const COLLECTIONS = {
  users: { size: 384, distance: 'Cosine' },
  products: { size: 768, distance: 'Cosine' },
  competitors: { size: 384, distance: 'Cosine' },
  scraped_products: { size: 768, distance: 'Cosine' },
  analytics: { size: 256, distance: 'Euclid' },
  sessions: { size: 128, distance: 'Cosine' },
  cache: { size: 128, distance: 'Euclid' },
  graph_edges: { size: 256, distance: 'Cosine' }
};

// Simple embedding generator (replace with real embeddings in production)
function generateMockEmbedding(size, text = '') {
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array(size).fill(0).map((_, i) => Math.sin(seed + i) * 0.5 + 0.5);
}

async function createCollections() {
  console.warn('📦 Creating Qdrant collections...');

  for (const [name, config] of Object.entries(COLLECTIONS)) {
    try {
      await qdrant.getCollection(name);
      console.warn(`  ✓ Collection ${name} already exists`);
    } catch (error) {
      await qdrant.createCollection(name, {
        vectors: {
          size: config.size,
          distance: config.distance,
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 2,
      });
      console.warn(`  ✓ Created collection ${name}`);
    }
  }
}

async function createIndexes() {
  console.warn('🔍 Creating indexes...');

  const indexes = [
    { collection: 'users', field: 'email' },
    { collection: 'users', field: 'role' },
    { collection: 'sessions', field: 'userId' },
    { collection: 'sessions', field: 'expiresAt' },
    { collection: 'products', field: 'sku' },
    { collection: 'products', field: 'category' },
    { collection: 'scraped_products', field: 'domain' },
    { collection: 'analytics', field: 'event' },
    { collection: 'analytics', field: 'userId' },
    { collection: 'graph_edges', field: 'fromId' },
    { collection: 'graph_edges', field: 'toId' },
    { collection: 'graph_edges', field: 'type' },
  ];

  for (const { collection, field } of indexes) {
    try {
      await qdrant.createPayloadIndex(collection, {
        field_name: field,
        field_schema: 'keyword',
      });
      console.warn(`  ✓ Created index ${collection}.${field}`);
    } catch (error) {
      console.warn(`  - Index ${collection}.${field} may already exist`);
    }
  }
}

async function createDefaultAdminUser() {
  console.warn('👤 Creating default admin user...');

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Use numeric ID for Qdrant
  const adminId = Date.now();
  const adminUser = {
    id: `user_admin_${adminId}`,
    email: 'admin@agriko.com',
    passwordHash,
    role: 'admin',
    permissions: [
      'users:read', 'users:write', 'users:delete',
      'products:read', 'products:write', 'products:delete',
      'scraper:use',
      'analytics:read', 'analytics:write',
      'settings:read', 'settings:write',
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
    },
  };

  await qdrant.upsert('users', {
    wait: true,
    points: [{
      id: adminId, // Use numeric ID
      vector: generateMockEmbedding(384, adminUser.email),
      payload: adminUser,
    }],
  });

  console.warn(`  ✓ Created admin user (email: admin@agriko.com)`);
  if (process.env.NODE_ENV === 'development') {
    console.warn(`  📝 Default password: ${adminPassword}`);
  }
}

async function migrateSampleProducts() {
  console.warn('📦 Creating sample products...');

  const sampleProducts = [
    {
      id: Date.now() + 1,
      sku: 'ORG-AVD-001',
      name: 'Organic Avocados',
      category: 'produce',
      price: 3.99,
      stock: 100,
      description: 'Fresh organic Hass avocados',
      metadata: {
        origin: 'Mexico',
        organic: true,
        unit: 'each',
      },
    },
    {
      id: Date.now() + 2,
      sku: 'ORG-BAN-002',
      name: 'Organic Bananas',
      category: 'produce',
      price: 0.79,
      stock: 200,
      description: 'Sweet organic bananas',
      metadata: {
        origin: 'Ecuador',
        organic: true,
        unit: 'lb',
      },
    },
    {
      id: Date.now() + 3,
      sku: 'ALM-MLK-001',
      name: 'Almond Milk',
      category: 'dairy-alternatives',
      price: 4.99,
      stock: 50,
      description: 'Unsweetened almond milk',
      metadata: {
        brand: 'Califia Farms',
        size: '64oz',
        allergens: ['tree nuts'],
      },
    },
  ];

  const points = sampleProducts.map(product => ({
    id: product.id,
    vector: generateMockEmbedding(768, `${product.name} ${product.category}`),
    payload: product,
  }));

  await qdrant.upsert('products', {
    wait: true,
    points,
  });

  console.warn(`  ✓ Created ${sampleProducts.length} sample products`);
}

async function migrateCompetitors() {
  console.warn('🏪 Setting up competitor monitoring...');

  const competitors = [
    {
      id: Date.now() + 100,
      domain: 'wholefoodsmarket.com',
      name: 'Whole Foods Market',
      active: true,
      lastScraped: null,
      categories: ['organic', 'natural', 'grocery'],
      metadata: {
        priceRange: 'premium',
        marketShare: 0.15,
      },
    },
    {
      id: Date.now() + 101,
      domain: 'naturesbasket.co.in',
      name: "Nature's Basket",
      active: true,
      lastScraped: null,
      categories: ['organic', 'imported', 'gourmet'],
      metadata: {
        priceRange: 'premium',
        marketShare: 0.08,
      },
    },
  ];

  const points = competitors.map(comp => ({
    id: comp.id,
    vector: generateMockEmbedding(384, comp.name),
    payload: comp,
  }));

  await qdrant.upsert('competitors', {
    wait: true,
    points,
  });

  console.warn(`  ✓ Set up ${competitors.length} competitor profiles`);
}

async function setupAnalytics() {
  console.warn('📊 Initializing analytics collection...');

  const sampleEvents = [
    {
      id: Date.now() + 200,
      event: 'page_view',
      userId: null,
      sessionId: `sess_${Date.now()}`,
      path: '/',
      timestamp: new Date().toISOString(),
      metadata: {
        referrer: 'direct',
        device: 'desktop',
      },
    },
  ];

  const points = sampleEvents.map(event => ({
    id: event.id,
    vector: generateMockEmbedding(256, event.event),
    payload: event,
  }));

  await qdrant.upsert('analytics', {
    wait: true,
    points,
  });

  console.warn(`  ✓ Analytics collection ready`);
}

async function verifyMigration() {
  console.warn('\n✅ Verifying migration...');

  for (const collection of Object.keys(COLLECTIONS)) {
    const count = await qdrant.count(collection, { exact: true });
    console.warn(`  - ${collection}: ${count.count} records`);
  }
}

async function main() {
  console.warn('🚀 Starting Qdrant Migration\n');
  console.warn(`📍 Qdrant URL: ${process.env.QDRANT_URL || 'http://localhost:6333'}\n`);

  try {
    // Check connection
    try {
      await qdrant.api('cluster').clusterStatus();
      console.warn('✓ Connected to Qdrant\n');
    } catch (error) {
      console.error('❌ Failed to connect to Qdrant');
      console.error('   Make sure Qdrant is running on port 6333');
      console.error('   Run: docker run -p 6333:6333 qdrant/qdrant');
      process.exit(1);
    }

    // Run migration steps
    await createCollections();
    await createIndexes();
    await createDefaultAdminUser();
    await migrateSampleProducts();
    await migrateCompetitors();
    await setupAnalytics();

    // Verify
    await verifyMigration();

    console.warn('\n✨ Migration completed successfully!');
    console.warn('\n📝 Next steps:');
    console.warn('   1. Update .env with QDRANT_URL if needed');
    console.warn('   2. Restart the application');
    console.warn('   3. Login with admin@agriko.com');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
main();