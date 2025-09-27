import { createApiHandler, successResponse, errorResponse, AuthenticatedRequest } from '@/lib/api/middleware';
import { CompetitorDAO } from '@/lib/dao/competitors';
import { schemas } from '@/lib/api/validators';

const competitorDAO = new CompetitorDAO();

// GET /api/competitors - List competitors with filtering and pagination
export const GET = createApiHandler(
  async (request: AuthenticatedRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const filter = schemas.competitorFilter.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        industry: searchParams.get('industry'),
        country: searchParams.get('country'),
        is_active: searchParams.get('is_active'),
        field: searchParams.get('field'),
        direction: searchParams.get('direction')
      });

      const result = await competitorDAO.findAll(filter);

      return successResponse(result.competitors, {
        pagination: {
          page: result.page,
          limit: filter.limit || 20,
          total: result.total,
          totalPages: result.totalPages
        },
        timestamp: new Date().toISOString(),
        requestId: 'comp_' + Math.random().toString(36).substr(2, 9)
      });

    } catch (error) {
      console.error('Get competitors error:', error);
      return errorResponse('Failed to fetch competitors', 500);
    }
  },
  {
    requireAuth: true,
    allowedRoles: ['admin', 'analyst', 'user'],
    rateLimit: { maxRequests: 100, windowMs: 60000 }
  }
);

// POST /api/competitors - Create a new competitor
export const POST = createApiHandler(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const competitorData = schemas.createCompetitor.parse(body);

      // Check if competitor domain already exists
      const existing = await competitorDAO.findByDomain(competitorData.domain);
      if (existing) {
        return errorResponse('Competitor with this domain already exists', 409);
      }

      const competitorWithConfig = {
        ...competitorData,
        scraping_config: {
          enabled: false,
          frequency: 'daily',
          ...competitorData.scraping_config
        }
      };
      const competitor = await competitorDAO.create(competitorWithConfig);

      return successResponse(competitor, {
        timestamp: new Date().toISOString(),
        requestId: 'comp_' + Math.random().toString(36).substr(2, 9)
      });

    } catch (error) {
      console.error('Create competitor error:', error);

      if (error instanceof Error && error.message.includes('duplicate')) {
        return errorResponse('Competitor domain must be unique', 409);
      }

      return errorResponse('Failed to create competitor', 500);
    }
  },
  {
    requireAuth: true,
    allowedRoles: ['admin', 'analyst'],
    rateLimit: { maxRequests: 20, windowMs: 60000 },
    validateBody: schemas.createCompetitor
  }
);