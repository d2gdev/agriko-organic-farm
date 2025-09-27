import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type {
  CreateCompetitorRequest,
  CompetitorListResponse,
  Competitor
} from '@/lib/business-intelligence/types/competitor';
import { CompetitorStatus } from '@/lib/business-intelligence/types/competitor';
import { competitorDB } from '@/lib/business-intelligence/competitor-database';

// GET /api/business-intelligence/competitors - List all competitors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    logger.debug('Fetching competitors', { page, limit, category, status, search });

    // If there's a search query, use search function
    if (search) {
      const competitors = await competitorDB.searchCompetitors(search);
      return NextResponse.json({
        competitors,
        total: competitors.length,
        page: 1,
        limit: competitors.length
      });
    }

    // Otherwise use filters
    const offset = (page - 1) * limit;
    const response = await competitorDB.getAllCompetitors({
      category,
      status,
      limit,
      offset
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching competitors:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

// POST /api/business-intelligence/competitors - Add new competitor
export async function POST(request: NextRequest) {
  try {
    const body: CreateCompetitorRequest = await request.json();

    // Basic validation
    if (!body.name || !body.domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    logger.debug('Creating new competitor', { name: body.name, domain: body.domain });

    // Create competitor in database
    const newCompetitor = await competitorDB.createCompetitor(body);

    logger.info('Competitor created successfully', {
      competitorId: newCompetitor.id,
      name: body.name
    });

    return NextResponse.json(newCompetitor, { status: 201 });
  } catch (error) {
    logger.error('Error creating competitor:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Failed to create competitor' },
      { status: 500 }
    );
  }
}