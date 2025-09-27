import { NextRequest, NextResponse } from 'next/server';
// Using Qdrant semantic database for competitor data
import db from '@/lib/database/competitor-qdrant';

// Initialize database on first request
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await db.initialize();
    initialized = true;
  }
}

// GET /api/competitors/config - Get all competitor configurations
export async function GET() {
  try {
    await ensureInitialized();
    const competitors = await db.competitor.getAll(true); // Include disabled

    return NextResponse.json({
      success: true,
      competitors,
      total: competitors.length
    });
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load configurations'
      },
      { status: 500 }
    );
  }
}

// POST /api/competitors/config - Save or update a competitor configuration
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { action, competitor, key, enabled } = body;

    if (action === 'save') {
      // Save or update competitor
      if (!competitor || !competitor.key) {
        return NextResponse.json(
          { success: false, error: 'Invalid competitor data' },
          { status: 400 }
        );
      }

      // Check if competitor exists
      const existing = await db.competitor.getByKey(competitor.key);

      let result;
      if (existing) {
        // Update existing
        result = await db.competitor.update(competitor.key, {
          name: competitor.name,
          baseUrl: competitor.baseUrl,
          enabled: competitor.enabled ?? true,
          selectors: competitor.selectors,
          currency: competitor.priceParsing?.currency || competitor.currency || 'USD',
          currencySymbol: competitor.priceParsing?.currencySymbol || '$',
          decimalSeparator: competitor.priceParsing?.decimalSeparator || '.',
          rateLimitMs: competitor.rateLimitMs || 2000,
          headers: competitor.headers,
        });
      } else {
        // Create new
        result = await db.competitor.create({
          key: competitor.key,
          name: competitor.name,
          baseUrl: competitor.baseUrl,
          enabled: competitor.enabled ?? true,
          selectors: competitor.selectors,
          currency: competitor.priceParsing?.currency || competitor.currency || 'USD',
          currencySymbol: competitor.priceParsing?.currencySymbol || '$',
          decimalSeparator: competitor.priceParsing?.decimalSeparator || '.',
          rateLimitMs: competitor.rateLimitMs || 2000,
          headers: competitor.headers,
        });
      }

      return NextResponse.json({
        success: true,
        message: existing ? 'Competitor updated successfully' : 'Competitor created successfully',
        competitor: result
      });
    }

    if (action === 'toggle') {
      // Toggle enabled status
      if (!key || typeof enabled !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Invalid toggle data' },
          { status: 400 }
        );
      }

      const result = await db.competitor.toggleEnabled(key, enabled);

      return NextResponse.json({
        success: true,
        message: `Competitor ${enabled ? 'enabled' : 'disabled'} successfully`,
        competitor: result
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error saving competitor:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/competitors/config - Delete a competitor configuration
export async function DELETE(request: NextRequest) {
  try {
    await ensureInitialized();
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Competitor key is required' },
        { status: 400 }
      );
    }

    await db.competitor.delete(key);

    return NextResponse.json({
      success: true,
      message: 'Competitor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete configuration'
      },
      { status: 500 }
    );
  }
}