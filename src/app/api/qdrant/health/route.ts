import { NextResponse } from 'next/server';

// GET /api/qdrant/health - Check Qdrant health
export async function GET() {
  try {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';

    // Check Qdrant health
    const healthResponse = await fetch(`${qdrantUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Short timeout for health check
      signal: AbortSignal.timeout(5000),
    }).catch((error) => ({
      ok: false,
      status: 0,
      statusText: error.message || 'Connection failed'
    }));

    if (!healthResponse.ok) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Qdrant is not running',
          details: {
            url: qdrantUrl,
            error: `${healthResponse.status} ${healthResponse.statusText}`,
            instructions: 'Start Qdrant with: docker-compose up -d qdrant'
          }
        },
        { status: 503 }
      );
    }

    // Check collections
    const collectionsResponse = await fetch(`${qdrantUrl}/collections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    let collections = [];
    if (collectionsResponse.ok) {
      const data = await collectionsResponse.json();
      collections = data.result?.collections || [];
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Qdrant is running and accessible',
      details: {
        url: qdrantUrl,
        collections: collections.length,
        collectionNames: collections.map((c: { name: string }) => c.name),
        initialized: collections.some((c: { name: string }) =>
          ['competitors', 'competitor_products', 'scraping_jobs'].includes(c.name)
        )
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to check Qdrant health',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}