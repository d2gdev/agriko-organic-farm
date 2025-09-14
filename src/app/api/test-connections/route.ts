import { NextResponse } from 'next/server';
import { testMemgraphConnection, createIndexes } from '@/lib/memgraph';
import { testDeepSeekConnection } from '@/lib/deepseek';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.info('Testing system connections...', undefined, 'health');

    // Test Memgraph connection
    logger.info('Testing Memgraph database connection...', undefined, 'health');
    const memgraphResult = await testMemgraphConnection();

    // Test DeepSeek AI connection
    logger.info('Testing DeepSeek AI connection...', undefined, 'health');
    const deepSeekResult = await testDeepSeekConnection();

    // Create database indexes if Memgraph is working
    let indexResult: { success: true; message: string } | null = null;
    if (memgraphResult.success) {
      logger.info('Creating database indexes...', undefined, 'health');
      await createIndexes();
      indexResult = { success: true, message: 'Indexes created successfully' };
    }

    const results = {
      memgraph: memgraphResult,
      deepseek: deepSeekResult,
      indexes: indexResult,
      timestamp: new Date().toISOString(),
    };

    logger.info('Connection tests completed', results, 'health');

    return NextResponse.json({
      success: true,
      message: 'System connection tests completed',
      results,
    });
  } catch (error) {
    logger.error('Connection test failed', error as Record<string, unknown>, 'health');
    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

