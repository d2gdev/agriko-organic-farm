/**
 * Test Memgraph Remote Connection
 * Verifies connection to the remote Memgraph instance
 */

const neo4j = require('neo4j-driver');

// Configuration
const MEMGRAPH_URL = process.env.MEMGRAPH_URL || 'bolt://143.42.189.57:7687';
const MEMGRAPH_USER = process.env.MEMGRAPH_USER || '';
const MEMGRAPH_PASSWORD = process.env.MEMGRAPH_PASSWORD || '';

async function testMemgraphConnection() {
  console.warn('🔍 Testing Memgraph Connection');
  console.warn(`📍 URL: ${MEMGRAPH_URL}`);
  console.warn(`👤 User: ${MEMGRAPH_USER || '(no auth)'}\n`);

  let driver;
  let session;

  try {
    // Create driver
    driver = neo4j.driver(
      MEMGRAPH_URL,
      MEMGRAPH_USER && MEMGRAPH_PASSWORD
        ? neo4j.auth.basic(MEMGRAPH_USER, MEMGRAPH_PASSWORD)
        : undefined,
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionTimeout: 30000, // 30 seconds
        maxTransactionRetryTime: 30000,
      }
    );

    // Verify connectivity
    await driver.verifyConnectivity();
    console.warn('✅ Connection established!\n');

    // Create session
    session = driver.session();

    // Test basic query
    console.warn('📊 Running test queries...\n');

    // Get database info
    const infoResult = await session.run('SHOW STORAGE INFO');
    console.warn('💾 Storage Info:');
    infoResult.records.forEach(record => {
      console.warn(`  - ${record.get('storage info')}`);
    });

    // Count nodes
    const countResult = await session.run('MATCH (n) RETURN count(n) as count');
    const nodeCount = countResult.records[0].get('count').toNumber();
    console.warn(`\n📦 Total Nodes: ${nodeCount}`);

    // Count edges
    const edgeResult = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
    const edgeCount = edgeResult.records[0].get('count').toNumber();
    console.warn(`🔗 Total Relationships: ${edgeCount}`);

    // Get node labels
    const labelResult = await session.run('MATCH (n) RETURN DISTINCT labels(n) as labels');
    const labels = new Set();
    labelResult.records.forEach(record => {
      const nodeLabels = record.get('labels');
      nodeLabels.forEach(label => labels.add(label));
    });

    if (labels.size > 0) {
      console.warn('\n🏷️ Node Types:');
      labels.forEach(label => console.warn(`  - ${label}`));
    }

    // Get relationship types
    const relResult = await session.run('MATCH ()-[r]->() RETURN DISTINCT type(r) as type');
    const relTypes = new Set();
    relResult.records.forEach(record => {
      relTypes.add(record.get('type'));
    });

    if (relTypes.size > 0) {
      console.warn('\n🔗 Relationship Types:');
      relTypes.forEach(type => console.warn(`  - ${type}`));
    }

    // Sample Product nodes if they exist
    try {
      const productResult = await session.run(
        'MATCH (p:Product) RETURN p.name as name, p.sku as sku LIMIT 3'
      );
      if (productResult.records.length > 0) {
        console.warn('\n📦 Sample Products:');
        productResult.records.forEach(record => {
          console.warn(`  - ${record.get('name')} (SKU: ${record.get('sku')})`);
        });
      }
    } catch (error) {
      // Products might not exist yet
    }

    console.warn('\n✨ Memgraph connection test successful!');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);

    if (error.code === 'ServiceUnavailable') {
      console.error('\nPossible issues:');
      console.error('  1. Remote Memgraph server is down');
      console.error('  2. Network connectivity issues');
      console.error('  3. Firewall blocking port 7687');
      console.error('  4. Incorrect URL or credentials');
    }

    process.exit(1);
  } finally {
    // Clean up
    if (session) await session.close();
    if (driver) await driver.close();
  }
}

// Load environment variables
require('dotenv').config();

// Run test
testMemgraphConnection();