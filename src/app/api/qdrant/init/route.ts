import { NextResponse } from 'next/server';
import db from '@/lib/database/competitor-qdrant';

// POST /api/qdrant/init - Initialize Qdrant collections
export async function POST() {
  try {
    // Initialize the database (this will create collections and default competitors)
    await db.initialize();

    // Get current competitors to verify
    const competitors = await db.competitor.getAll(true);

    return NextResponse.json({
      success: true,
      message: 'Qdrant collections initialized successfully',
      data: {
        competitors: competitors.length,
        collections: ['competitors', 'competitor_products', 'scraping_jobs']
      }
    });
  } catch (error) {
    console.error('Qdrant initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initialize Qdrant',
        error: error instanceof Error ? error.message : 'Unknown error',
        instructions: [
          '1. Ensure Qdrant is running: docker-compose up -d qdrant',
          '2. Check Qdrant health: GET /api/qdrant/health',
          '3. Retry initialization: POST /api/qdrant/init'
        ]
      },
      { status: 500 }
    );
  }
}