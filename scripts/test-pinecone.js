require('dotenv').config({ path: '.env.local' });

async function testPineconeConnection() {
  try {
    const { Pinecone } = require('@pinecone-database/pinecone');
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }
    
    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('PINECONE_INDEX_NAME is not set');
    }
    
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    
    const stats = await index.describeIndexStats();
    console.log('✅ Pinecone connection successful');
    console.log('📊 Index stats:', {
      totalVectorCount: stats.totalVectorCount,
      dimension: stats.dimension,
      indexFullness: stats.indexFullness,
    });
    console.log('✅ Safe to proceed with agriko_ prefixed additions');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testPineconeConnection();