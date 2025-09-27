import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type {
  CreateCompetitorRequest,
  CompetitorListResponse,
  Competitor
} from '@/lib/business-intelligence/types/competitor';
import { CompetitorStatus } from '@/lib/business-intelligence/types/competitor';

// GET /api/business-intelligence/competitors - List all competitors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    logger.debug('Fetching competitors', { page, limit, category, status });

    // TODO: Implement actual database query
    const mockCompetitors: Competitor[] = [];

    const response: CompetitorListResponse = {
      competitors: mockCompetitors,
      total: 0,
      page,
      limit,
    };

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

    // TODO: Implement actual competitor creation
    const competitorId = `comp_${Date.now()}`;

    const newCompetitor: Competitor = {
      id: competitorId,
      name: body.name,
      domain: body.domain,
      industry: body.industry,
      size: body.size,
      founded: body.founded,
      category: body.category,
      monitoringScope: body.monitoringScope,
      monitoringFrequency: body.monitoringFrequency,
      status: CompetitorStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    logger.info('Competitor created successfully', { competitorId, name: body.name });

    return NextResponse.json(newCompetitor, { status: 201 });
  } catch (error) {
    logger.error('Error creating competitor:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Failed to create competitor' },
      { status: 500 }
    );
  }
}