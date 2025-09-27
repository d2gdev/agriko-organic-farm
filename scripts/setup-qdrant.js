#!/usr/bin/env node

/**
 * Setup script for Qdrant Vector Database
 * Checks if Qdrant is running and creates required collections
 */

const http = require('http');

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6335';

console.warn('🚀 Qdrant Setup Script');
console.warn('======================');

// Check if Qdrant is running
async function checkQdrantHealth() {
  return new Promise((resolve) => {
    const url = new URL(`${QDRANT_URL}/collections`);

    http.get(url, (res) => {
      if (res.statusCode === 200) {
        console.warn('✅ Qdrant is running at', QDRANT_URL);
        resolve(true);
      } else {
        console.warn('❌ Qdrant returned status:', res.statusCode);
        resolve(false);
      }
    }).on('error', (err) => {
      console.warn('❌ Cannot connect to Qdrant at', QDRANT_URL);
      console.warn('   Error:', err.message);
      resolve(false);
    });
  });
}

// Initialize collections
async function initializeCollections() {
  const collections = [
    { name: 'competitors', vectorSize: 384 },
    { name: 'competitor_products', vectorSize: 768 },
    { name: 'scraping_jobs', vectorSize: 128 }
  ];

  for (const collection of collections) {
    try {
      // Check if collection exists
      const checkRes = await fetch(`${QDRANT_URL}/collections/${collection.name}`);

      if (checkRes.ok) {
        console.warn(`✓ Collection '${collection.name}' already exists`);
        continue;
      }

      // Create collection
      const createRes = await fetch(`${QDRANT_URL}/collections/${collection.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vectors: {
            size: collection.vectorSize,
            distance: 'Cosine'
          }
        })
      });

      if (createRes.ok) {
        console.warn(`✅ Created collection '${collection.name}'`);
      } else {
        console.warn(`❌ Failed to create collection '${collection.name}':`, await createRes.text());
      }
    } catch (error) {
      console.warn(`❌ Error with collection '${collection.name}':`, error.message);
    }
  }
}

// Main setup function
async function setup() {
  console.warn('\n1. Checking Qdrant connection...');
  const isHealthy = await checkQdrantHealth();

  if (!isHealthy) {
    console.warn('\n⚠️  Qdrant is not running!');
    console.warn('\nTo start Qdrant with Docker:');
    console.warn('  docker run -p 6333:6333 -v ./qdrant_storage:/qdrant/storage qdrant/qdrant');
    console.warn('\nOr download from: https://github.com/qdrant/qdrant/releases');
    process.exit(1);
  }

  console.warn('\n2. Initializing collections...');
  await initializeCollections();

  console.warn('\n✅ Qdrant setup complete!');
  console.warn('\nYour semantic database is ready to use.');
}

// Run setup
setup().catch(console.error);