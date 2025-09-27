/**
 * Test endpoint for Qdrant connectivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { qdrantDb } from '@/core/database/qdrant.client';

export async function GET(_request: NextRequest) {
  try {
    // Initialize Qdrant if not already initialized
    await qdrantDb.initialize();

    // Check health
    const healthy = await qdrantDb.healthCheck();

    if (!healthy) {
      return NextResponse.json({
        success: false,
        message: 'Qdrant is not healthy',
        url: process.env.QDRANT_URL || 'http://143.42.189.57:6333',
      }, { status: 503 });
    }

    // Get collection stats
    const client = qdrantDb.getClient();
    const collections = await client.getCollections();

    // Get counts for key collections
    const stats: Record<string, number | string> = {};
    const keyCollections = ['users', 'products', 'agriko_products', 'sessions'];

    for (const collName of keyCollections) {
      try {
        const count = await qdrantDb.count(collName as 'users' | 'products' | 'agriko_products' | 'sessions');
        stats[collName] = count;
      } catch {
        stats[collName] = 'error';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Qdrant connection successful',
      url: process.env.QDRANT_URL || 'http://143.42.189.57:6333',
      collections: collections.collections.length,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Qdrant test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Qdrant',
      error: error instanceof Error ? error.message : 'Unknown error',
      url: process.env.QDRANT_URL || 'http://143.42.189.57:6333',
    }, { status: 500 });
  }
}