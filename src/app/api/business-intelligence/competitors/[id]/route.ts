import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type {
  UpdateCompetitorRequest,
  CompetitorDetailsResponse
} from '@/lib/business-intelligence/types/competitor';
import {
  CompanySize,
  CompetitorCategory,
  MonitoringScope,
  MonitoringFrequency,
  CompetitorStatus
} from '@/lib/business-intelligence/types/competitor';
import { competitorDB } from '@/lib/business-intelligence/competitor-database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/business-intelligence/competitors/[id] - Get competitor details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    logger.debug('Fetching competitor details', { competitorId: id });

    // Get competitor from database
    const competitor = await competitorDB.getCompetitorById(id);

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    // Build detailed response (in real implementation, would fetch related data)
    const detailsResponse: CompetitorDetailsResponse = {
      ...competitor,
      products: [], // Would fetch from product monitoring database
      channels: [], // Would fetch from channel monitoring database
      campaigns: [], // Would fetch from campaign tracking database
      monitoringStats: {
        totalProducts: 0,
        totalChannels: 0,
        activeCampaigns: 0,
        lastPriceChanges: 0,
      },
    };

    return NextResponse.json(detailsResponse);
  } catch (error) {
    logger.error('Error fetching competitor details:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Failed to fetch competitor details' },
      { status: 500 }
    );
  }
}

// PUT /api/business-intelligence/competitors/[id] - Update competitor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateCompetitorRequest = await request.json();

    logger.debug('Updating competitor', { competitorId: id, updates: Object.keys(body) });

    // Update competitor in database
    const updatedCompetitor = await competitorDB.updateCompetitor(id, body);

    if (!updatedCompetitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Competitor updated successfully',
      competitor: updatedCompetitor
    });
  } catch (error) {
    logger.error('Error updating competitor:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Failed to update competitor' },
      { status: 500 }
    );
  }
}

// DELETE /api/business-intelligence/competitors/[id] - Remove competitor
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    logger.debug('Deleting competitor', { competitorId: id });

    // Delete competitor from database
    const deleted = await competitorDB.deleteCompetitor(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Competitor deleted successfully',
      competitorId: id
    });
  } catch (error) {
    logger.error('Error deleting competitor:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    );
  }
}